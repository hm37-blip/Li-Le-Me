const test = require('node:test');
const assert = require('node:assert/strict');

function setup(respond) {
  const calls = [];
  const redirects = [];
  const storage = { auth_token: 'old-token', refresh_token: 'refresh-token' };
  global.wx = {
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value; },
    removeStorageSync: key => { delete storage[key]; },
    redirectTo: options => redirects.push(options.url),
    request: options => {
      calls.push(options);
      setImmediate(() => options.success(respond(options, calls)));
    }
  };
  delete require.cache[require.resolve('../utils/api.js')];
  return { api: require('../utils/api.js'), calls, redirects, storage };
}
const refresh = options => options.url.endsWith('/auth/refresh');
const ok = data => ({ statusCode: 200, data });
const unauthorized = { statusCode: 401, data: { error: 'unauthorized' } };

function squadPage(api) {
  let page;
  global.Page = definition => { page = definition; };
  global.getApp = () => ({ globalData: {} });
  delete require.cache[require.resolve('../pages/squad/squad.js')];
  require('../pages/squad/squad.js');
  page.data = { ...page.data, inviteCode: 'invalid' };
  page.setData = data => Object.assign(page.data, data);
  return page;
}

test('invalid invite releases loading, sends auth and permits rebind', async () => {
  const ctx = setup(() => ok({ valid: false, error_msg: '邀请码不存在' }));
  const page = squadPage(ctx.api);
  await page.handleVerify();
  assert.equal(page.data.loading, false);
  assert.equal(page.data.errorMessage, '邀请码不存在');
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.calls[0].header.Authorization, 'Bearer old-token');
  page.handleRebind();
  assert.deepEqual(ctx.redirects, ['/pages/registration/registration']);
});

test('public login 401 does not refresh or redirect', async () => {
  const ctx = setup(() => unauthorized);
  await assert.rejects(ctx.api.login('code', 'device'), /401/);
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.redirects.length, 0);
});

test('persistent 401 stops after one refresh and one retry', async () => {
  const ctx = setup(options => refresh(options) ? ok({ token: 'new-token' }) : unauthorized);
  const page = squadPage(ctx.api);
  await page.handleVerify();
  assert.equal(ctx.calls.length, 3);
  assert.equal(ctx.calls[2].header.Authorization, 'Bearer new-token');
  assert.equal(page.data.loading, false);
  assert.match(page.data.errorMessage, /重新登录/);
  assert.equal(ctx.storage.auth_token, undefined);
});

test('concurrent requests share successful refresh', async () => {
  const ctx = setup(options => refresh(options) ? ok({ token: 'new-token' }) :
    options.header.Authorization === 'Bearer new-token' ? ok({ valid: true }) : unauthorized);
  await Promise.all([ctx.api.verifySquadInvite('a'), ctx.api.verifySquadInvite('b')]);
  assert.equal(ctx.calls.filter(refresh).length, 1);
  assert.equal(ctx.calls.length, 5);
});

test('failed refresh rejects all waiters without retrying', async () => {
  const ctx = setup(() => unauthorized);
  const results = await Promise.allSettled([ctx.api.getUserStatus(), ctx.api.getUserStatus()]);
  assert(results.every(result => result.status === 'rejected'));
  assert.equal(ctx.calls.filter(refresh).length, 1);
  assert.equal(ctx.calls.length, 3);
  assert.equal(ctx.redirects.length, 1);
});

test('return during verification prevents late success from navigating forward', async () => {
  const ctx = setup(() => ok({ valid: true, squad_name: 'test' }));
  const page = squadPage(ctx.api);
  const pending = page.handleVerify();
  page.handleRebind();
  await pending;
  assert.deepEqual(ctx.redirects, ['/pages/registration/registration']);
});
