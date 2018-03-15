'use strict'

var Cancel = require('./Cancel')

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken (executor) {
  // 如果传入的不是一个函数，那就报类型错误
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.')
  }

  // 记录下 Promise 的 resolve 方法
  var resolvePromise
  this.promise = new Promise(function promiseExecutor (resolve) {
    resolvePromise = resolve
  })

  var token = this
  // 执行传入的回调，如果取消信息已经存在，那就直接返回不进行操作，要淆就新建一个，并传递 resole 方法
  executor(function cancel (message) {
    if (token.reason) {
      // Cancellation has already been requested
      return
    }

    token.reason = new Cancel(message)
    resolvePromise(token.reason)
  })
}

/**
 * 如果请求已经返回了，那么就直接抛出异常
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested () {
  if (this.reason) {
    throw this.reason
  }
}

/**
 * 创建一个新的 CancelToken 对象，并返回对应的属性
 */
CancelToken.source = function source () {
  var cancel
  var token = new CancelToken(function executor (c) {
    cancel = c
  })
  return {
    token: token,
    cancel: cancel
  }
}

module.exports = CancelToken
