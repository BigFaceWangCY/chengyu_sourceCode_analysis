'use strict'

var enhanceError = require('./enhanceError')

/**
 * 创建一个错误对象，并返回
 */
module.exports = function createError (message, config, code, request, response) {
  var error = new Error(message)
  return enhanceError(error, config, code, request, response)
}
