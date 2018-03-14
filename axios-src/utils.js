'use strict'

var bind = require('./helpers/bind')
var isBuffer = require('is-buffer')

// 把 Object.prototype.toString 绑定在 toString 上面
// 这样做的主要目的是为了压缩方便，大量重复代码的出现，另外也提升了调用效率
var toString = Object.prototype.toString

// 检查是否是数组
function isArray (val) {
  return toString.call(val) === '[object Array]'
}

// 检查是否是 ArrayBuffer ,这个一般用不上
function isArrayBuffer (val) {
  return toString.call(val) === '[object ArrayBuffer]'
}

// 检查是否是 FormDate ,主要是就通过查看 FormData 这个全局变量是否存在，如果存在再判断传入内容是否是 FormData 的实例
function isFormData (val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData)
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView (val) {
  var result
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val)
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer)
  }
  return result
}

// 检查是否是 string 类型
function isString (val) {
  return typeof val === 'string'
}

// 检查是否是 number 类型
function isNumber (val) {
  return typeof val === 'number'
}

// 检查是否是 undefined 类型
function isUndefined (val) {
  return typeof val === 'undefined'
}

// 检查是否是 Object 类型，之所以加一个 null 判断是因为javascript是根据二进制的前三位来判断类型的
// object 类型的前三位是 000.而 null 的二进制表示全为 0.
function isObject (val) {
  return val !== null && typeof val === 'object'
}

// 检查传是否是一个 Data 对象
function isDate (val) {
  return toString.call(val) === '[object Date]'
}

// 检查是否是一个 File 对象
function isFile (val) {
  return toString.call(val) === '[object File]'
}

// 检查是否是 Blob 对象
function isBlob (val) {
  return toString.call(val) === '[object Blob]'
}

// 检查是否是 function 类型
function isFunction (val) {
  return toString.call(val) === '[object Function]'
}

// 检查是否是 stream 对象
// 通常 stream 对象是一个对象且含有一个 pipe 属性方法，就是通过这个来检测是否是一个 stream 对象的
// 不过不常用
function isStream (val) {
  return isObject(val) && isFunction(val.pipe)
}

// 检查是不是 urlsearchparams
function isURLSearchParams (val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams
}

// 去除首尾空格，至于为什么这么写，当然是因为在所有的去除方法中，这样写的效率最高
// 虽然 str.repalce(/(^\s*|\s*$)/g, '') 看起来更简洁，但是真没这么写效率高
function trim (str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '')
}

// 检查是否是标准浏览器环境，主要用于检查是否是 ReactNative 或者 WebWorker 中
function isStandardBrowserEnv () {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return false
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  )
}

// 扩展 Array 中的 forEach 方法，使其可以遍历 Object
function forEach (obj, fn) {
  // 如果传入的是 null，或者没有传入，那么直接返回，不过无用功
  if (obj === null || typeof obj === 'undefined') {
    return
  }

  // 如果传入的不是 object 类型的，那么将其处理成为一个数组
  // 因为数组的 typeof 也是 object 这样做是应对传入一个参数的情况
  // 这个时候为了函数的健壮性，也可以对其进行处理
  if (typeof obj !== 'object') {
    obj = [obj]
  }

  if (isArray(obj)) {
    // 如果是数组形式,那么遍历调用传入的 fn 参数
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj)
    }
  } else {
    // 如果是传入对象，那么使用 for...in... 方法来遍历，遍历的时候还要判断是否是 obj 本身的属性
    // 在最新标准的 JS 中，我们已经可以这么写了
    // let key = obj.keys()
    // for(var i = 0, l = keys.length; i < l; i++) {
    //   fn.call(null, keys[i], i, obj)
    // }
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj)
      }
    }
  }
}

/**
 * 把多个对象合并成一个对象，如果属性有重复，那么会覆盖
 */
function merge (/* obj1, obj2, obj3, ... */) {
  // 新建一个结果集
  var result = {}

  // assignValue 方法，用于递归遍历传入内容，并将结果存入结果集中
  function assignValue (val, key) {
    // 如果内容是一个 obj ，那么继续递归遍历
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = merge(result[key], val)
    } else {
      // 将内容存入结果集中
      result[key] = val
    }
  }

  // 对传入的参数进行遍历，全部调用 assignValue 方法
  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue)
  }
  // 返回结果
  return result
}

/**
 * 扩展方法，把 b 的内容扩展到 a 上面
 */
function extend (a, b, thisArg) {
  // 挨个遍历 b 的属性
  forEach(b, function assignValue (val, key) {
    if (thisArg && typeof val === 'function') {
      // 如果该属性是一个函数且传入参数要深拷贝，那么使用 bind 构造一个新的函数绑定到 a 上面
      // 这样做是防止引用类型引用的时候，b 已经改变了
      a[key] = bind(val, thisArg)
    } else {
      // 不是函数的情况，那么直接赋值
      a[key] = val
    }
  })
  return a
}

// 把刚才写的方法批量导出
module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim
}
