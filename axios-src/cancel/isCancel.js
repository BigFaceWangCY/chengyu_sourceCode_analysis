'use strict'

// 检查是否取消，用两个 !! 主要是针对隐式类型转换进行的一番骚操作
module.exports = function isCancel (value) {
  return !!(value && value.__CANCEL__)
}
