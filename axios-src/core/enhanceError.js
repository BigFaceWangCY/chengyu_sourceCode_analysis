'use strict'

/**
 * 导出一个方法，这个方法主要就是把传入的错误信息整个到一个错误对象中，用于格式化显示
 */
module.exports = function enhanceError (error, config, code, request, response) {
  error.config = config
  if (code) {
    error.code = code
  }
  error.request = request
  error.response = response
  return error
}
