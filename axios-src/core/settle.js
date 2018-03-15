'use strict'

var createError = require('./createError')

/**
 * 导出一个方法，这个方法主要是用于检测 response 状态与过滤状态，再根据状态判断是执行 Promise 的 reject 方法还是 resolve 方法
 */
module.exports = function settle (resolve, reject, response) {
  var validateStatus = response.config.validateStatus
  // 如果有返回状态状态且通过过滤器验证，那么执行 resolve 方法
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response)
  } else {
    // 如果没有通过验证，那么执行 reject 方法并传入对应的错误信息
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ))
  }
}
