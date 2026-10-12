const test = require('node:test')
const assert = require('node:assert/strict')
const api = require('../utils/api.js')
const avatar = require('../utils/avatar.js')

test('temporary avatars upload to the server with authentication and resolve public URLs', async () => {
  global.wx = {
    getStorageSync: key => key === 'auth_token' ? 'test-token' : '',
    uploadFile: options => {
      assert.equal(options.url, 'https://www.uiuccesa.com/api/user/avatar')
      assert.equal(options.name, 'file')
      assert.equal(options.header.Authorization, 'Bearer test-token')
      assert.equal(options.formData.openid, 'user-1')
      options.success({ statusCode: 200, data: JSON.stringify({ code: 200, data: { avatar_url: '/uploads/avatars/test.png' } }) })
    }
  }
  const url = await avatar.uploadAvatar('wxfile://tmp/avatar.jpg', 'user-1')
  assert.equal(await avatar.resolveAvatarUrl(url), 'https://www.uiuccesa.com/uploads/avatars/test.png')
  assert.equal(await avatar.resolveAvatarUrl('cloud://old/avatar'), avatar.DEFAULT_AVATAR)
})

test('server errors and invalid upload responses reject without saving a temporary path', async () => {
  global.wx = {
    getStorageSync: () => '',
    uploadFile: options => options.success({ statusCode: 413, data: '{"msg":"图片过大"}' })
  }
  await assert.rejects(api.uploadAvatar('wxfile://tmp/avatar.jpg', 'user-1'), /图片过大/)
  wx.uploadFile = options => options.success({ statusCode: 200, data: '<html>error</html>' })
  await assert.rejects(api.uploadAvatar('wxfile://tmp/avatar.jpg', 'user-1'))
})
