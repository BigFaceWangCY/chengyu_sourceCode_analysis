'use strict'

/**
 * 为了兼容性，写了一个 bind 函数。以防在一些环境中，不存在 bind 方法
 * 这里用的是函数式的写法，主要就是将 fn 常驻在内存中，从而获取一个固定了 this 的值的 bind 方法
 */
module.exports = function bind (fn, thisArg) {
  return function wrap () {
    // 针对参数进行简单的处理
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    // 核心就是使用 apply 方法
    return fn.apply(thisArg, args)
  }
}

/**
 * ES6 写法
 * 我们可以写完之后用 babel 转啊，哈哈哈哈
 */
export default function bind (fn, thisArg) {
  return function (...rest) {
    return fn.apply(thisArg, rest)
  }
}
