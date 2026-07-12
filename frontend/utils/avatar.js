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

function extFromPath(path) {
  const match = String(path || '').match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
  return match ? match[1].toLowerCase() : 'jpg'
}

function uploadAvatar(localPath, openid) {
  if (!isLocalTempFile(localPath)) {
    return Promise.resolve(localPath || DEFAULT_AVATAR)
  }
  if (!wx.cloud || !wx.cloud.uploadFile) {
    return Promise.reject(new Error('云开发未初始化，无法上传头像'))
  }

  const safeOpenid = String(openid || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '_')
  const cloudPath = `avatars/${safeOpenid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFromPath(localPath)}`

  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath: localPath,
      success: res => resolve(res.fileID),
      fail: reject
    })
  })
}

function resolveAvatarUrl(value) {
  const source = value || DEFAULT_AVATAR
  if (isExpiredWechatPlaceholder(source)) {
    return Promise.resolve(DEFAULT_AVATAR)
  }
  if (!isCloudFileId(source)) {
    return Promise.resolve(source)
  }
  if (!wx.cloud || !wx.cloud.getTempFileURL) {
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
  return userInfo.avatar_file_id || userInfo.avatarUrl || wx.getStorageSync('userAvatarFileId') || wx.getStorageSync('userAvatar') || DEFAULT_AVATAR
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
