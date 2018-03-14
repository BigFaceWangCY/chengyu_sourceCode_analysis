'use strict'

var utils = require('./../utils')

// 标准头部内容拥有的属性列表
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
]

/**
 * 导出函数，这个函数的作用是处理头部内容
 */
module.exports = function parseHeaders (headers) {
  var parsed = {}
  var key
  var val
  var i

  // 如果没有传入头部文件，那么直接返回一个空对象
  if (!headers) { return parsed }

  // 把头部内容按 \n 分割成一个数组，然后遍历操作
  utils.forEach(headers.split('\n'), function parser (line) {
    // 取出对应的 key 和 val
    i = line.indexOf(':')
    key = utils.trim(line.substr(0, i)).toLowerCase()
    val = utils.trim(line.substr(i + 1))

    // 如果 key 存在，那么进行操作
    if (key) {
      // 当 key 存在，且在标准化列表中，不进行操作
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return
      }
      // 如果 key 为 set-cookie ，那么把 val 的值拼入其中。如果为其它值 ，那么存入结果集中
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val])
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val
      }
    }
  })

  // 返回处理后的结果
  return parsed
}
