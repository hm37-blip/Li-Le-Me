const api = require('./api.js')
const env = require('../config/env.js')

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ccircle cx="50" cy="35" r="18" fill="white"/%3E%3Cpath d="M20 85 Q20 55 50 55 Q80 55 80 85 Z" fill="white"/%3E%3C/svg%3E'

function isCloudFileId(value) {
  return typeof value === 'string' && value.indexOf('cloud://') === 0
}

function isLocalTempFile(value) {
  if (typeof value !== 'string') return false
  return value.indexOf('wxfile://') === 0 ||
    value.indexOf('http://tmp/') === 0 ||
    value.indexOf('https://tmp/') === 0 ||
    value.indexOf('file://') === 0
}

function isExpiredWechatPlaceholder(value) {
  return typeof value === 'string' && value.indexOf('https://mmbiz.qpic.cn/mmbiz/') === 0
}

function uploadAvatar(localPath, openid) {
  if (!isLocalTempFile(localPath) && !String(localPath || '').startsWith('/')) {
    return Promise.resolve(localPath || DEFAULT_AVATAR)
  }
  return api.uploadAvatar(localPath, openid)
}

function resolveAvatarUrl(value) {
  const source = value || DEFAULT_AVATAR
  if (isExpiredWechatPlaceholder(source)) {
    return Promise.resolve(DEFAULT_AVATAR)
  }
  if (!isCloudFileId(source)) {
    const baseUrl = env.mode === 'local' ? env.localBaseUrl : env.serverDomain
    return Promise.resolve(source.startsWith('/uploads/') ? `${baseUrl.replace(/\/$/, '')}${source}` : source)
  }
  if (env.mode !== 'cloud' || !wx.cloud || !wx.cloud.getTempFileURL) {
    return Promise.resolve(DEFAULT_AVATAR)
  }

  return new Promise(resolve => {
    wx.cloud.getTempFileURL({
      fileList: [source],
      success: res => {
        const item = res.fileList && res.fileList[0]
        resolve((item && item.tempFileURL) || DEFAULT_AVATAR)
      },
      fail: () => resolve(DEFAULT_AVATAR)
    })
  })
}

function getProfileAvatar(userInfo = {}) {
  return userInfo.avatar_url || userInfo.avatar_file_id || userInfo.avatarUrl || wx.getStorageSync('userAvatarFileId') || wx.getStorageSync('userAvatar') || DEFAULT_AVATAR
}

function saveAvatar(fileIdOrUrl, displayUrl) {
  wx.setStorageSync('userAvatarFileId', fileIdOrUrl)
  wx.setStorageSync('userAvatar', displayUrl || fileIdOrUrl)
}

module.exports = {
  DEFAULT_AVATAR,
  getProfileAvatar,
  isCloudFileId,
  isLocalTempFile,
  resolveAvatarUrl,
  saveAvatar,
  uploadAvatar
}
