'use strict'

// 一个取消类，主要是用于输出取消状态与输出取消信息
function Cancel (message) {
  this.message = message
}

Cancel.prototype.toString = function toString () {
  return 'Cancel' + (this.message ? ': ' + this.message : '')
}

Cancel.prototype.__CANCEL__ = true

module.exports = Cancel

// 在 ES6 以后可以这么写
export default class Cancel {
  constructor (message) {
    this.message = message
    this.__CANCEL__ = true
  }
  toString () {
    return `Cancel ${this.message ? this.message : ''}`
  }
}
