'use strict'

var utils = require('./../utils')

/**
 * 导出一个方法，把数据通过所有回调函数处理一遍再返回
 */
module.exports = function transformData (data, headers, fns) {
  utils.forEach(fns, function transform (fn) {
    data = fn(data, headers)
  })
  return data
}
