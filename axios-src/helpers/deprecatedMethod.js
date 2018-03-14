'use strict'

// 使用弃用方法警告，其实本质上就是输出一段弃用方法的警告
module.exports = function deprecatedMethod (method, instead, docs) {
  // 使用 try...catch 方法来操作，主要是针对一些浏览器不能使用 console.warn 方法，这个时候直接忽略
  try {
    console.warn(
      'DEPRECATED method `' + method + '`.' +
      (instead ? ' Use `' + instead + '` instead.' : '') +
      ' This method will be removed in a future release.')

    if (docs) {
      console.warn('For more information about usage see ' + docs)
    }
  } catch (e) { /* Ignore */ }
}
