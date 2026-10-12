const test = require('node:test');
const assert = require('node:assert/strict');

function setup({ rankError = false, memberError = false, total = 2 } = {}) {
  const calls = [];
  const info = { squad_id: 7, squad_name: '测试战队' };
  const app = { globalData: { openid: 'me', userInfo: info, token: 'token' } };
  const storage = { auth_token: 'token', openid: 'me', userInfo: info };
  global.getApp = () => app;
  global.wx = {
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value; },
    showToast() {},
    request(options) {
      calls.push(options);
      let data;
      if (options.url.endsWith('/user/status')) data = { registration_status: 2, user_info: info };
      else if (options.url.endsWith('/squad-members')) {
        if (memberError) return setImmediate(() => options.fail(new Error('成员加载失败')));
        data = [{ id: 1 }, { id: 2 }];
      } else if (options.url.endsWith('/rank/daily')) {
        if (rankError) return setImmediate(() => options.success({statusCode:500,data:{error:'榜单服务异常'}}));
        data = { code: 200, data: { totalMembers: total, rankList: [], mySummary: {} } };
      } else throw new Error('Unexpected request: ' + options.url);
      setImmediate(() => options.success({ statusCode: 200, data }));
    }
  };
  let page;
  global.Page = definition => { page = definition; };
  delete require.cache[require.resolve('../pages/index/home/home.js')];
  require('../pages/index/home/home.js');
  page.data = structuredClone(page.data);
  page.setData = values => {
    for (const [key, value] of Object.entries(values)) {
      const parts = key.split('.');
      let target = page.data;
      for (const part of parts.slice(0, -1)) target = target[part];
      target[parts.at(-1)] = value;
    }
  };
  return {page,calls};
}

test('page show requests authenticated ranking once and refreshes membership on return', async () => {
  const {page,calls} = setup();
  await page.onShow();
  assert.equal(page.data.teamMemberCount, 2);
  assert.equal(page.data.leaderboardError, '');
  const ranks = calls.filter(c => c.url.endsWith('/rank/daily'));
  assert.equal(ranks.length, 1);
  assert.equal(ranks[0].header.Authorization, 'Bearer token');
  assert.equal(ranks[0].data.squad_id, 7);
  await page.onShow();
  assert.equal(calls.filter(c => c.url.endsWith('/squad-members')).length, 2);
});

test('ranking failure still updates membership and exposes retryable error', async () => {
  const {page} = setup({rankError:true});
  await page.onShow();
  assert.equal(page.data.teamMemberCount, 2);
  assert.equal(page.data.loading, false);
  assert.match(page.data.leaderboardError, /榜单服务异常/);
});

test('zero member count is respected when member endpoint fails', async () => {
  const {page} = setup({memberError:true,total:0});
  page.data.teamMemberCount = 9;
  await page.onShow();
  assert.equal(page.data.teamMemberCount, 0);
  assert.equal(page.data.leaderboardError, '');
});

test('admin membership refreshes each time the page becomes visible', () => {
  let page;
  global.Page = definition => { page = definition; };
  require('../pages/admin/admin.js');
  let checks = 0;
  page.ensureAdminToken = () => { checks++; };
  page.onShow();
  page.onShow();
  assert.equal(checks, 2);
});
