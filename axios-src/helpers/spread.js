'use strict'

// bind 的一种写法啊
module.exports = function spread (callback) {
  return function wrap (arr) {
    return callback.apply(null, arr)
  }
}
