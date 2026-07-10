module.exports = {
  // domain: use deployed HTTPS domain. cloud: use wx.cloud.callContainer. local: use localBaseUrl.
  mode: 'cloud',

  serverDomain: '',
  requestTimeout: 20000,

  // Only used when mode is cloud.
  cloudEnv: 'prod-d9g63nxql83921525',
  cloudService: 'real',

  // Only used when mode is local.
  localBaseUrl: 'http://localhost:8080'
}
