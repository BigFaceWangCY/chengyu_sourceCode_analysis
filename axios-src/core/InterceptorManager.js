'use strict'

var utils = require('./../utils')

// 过滤器管理类，主要参数就是一个列表，用于添加过滤器
function InterceptorManager () {
  this.handlers = []
}

/**
 *  使用过滤器，传入两个参数，分别是成功回调，和失败回调，将其插入到过滤器列表中，然后返回其在过滤器中的位置
 */
InterceptorManager.prototype.use = function use (fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  })
  return this.handlers.length - 1
}

/**
 * 在过滤器列表中删除过滤器，通过传入其位置，刚其位置中的内容替换为 null 来达到功能
 */
InterceptorManager.prototype.eject = function eject (id) {
  if (this.handlers[id]) {
    this.handlers[id] = null
  }
}

/**
 * 遍历执行过滤器，如果传入的过滤器内容为 null 那么跳过，这个就是针对该位置的过滤器已经删除的情况
 */
InterceptorManager.prototype.forEach = function forEach (fn) {
  utils.forEach(this.handlers, function forEachHandler (h) {
    if (h !== null) {
      fn(h)
    }
  })
}

module.exports = InterceptorManager
