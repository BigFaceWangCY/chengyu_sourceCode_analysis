'use strict'

var utils = require('../utils')

// 导出一个函数，这个函数的作用是序列化请求头名称
module.exports = function normalizeHeaderName (headers, normalizedName) {
  // 对 Header 部参数进行处理，就是转换成合适的名称
  utils.forEach(headers, function processHeader (value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value
      delete headers[name]
    }
  })
}
