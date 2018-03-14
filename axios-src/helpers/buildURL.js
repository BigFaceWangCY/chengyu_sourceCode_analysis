'use strict'

var utils = require('./../utils')

// encode 参数，其实主要是调用 encodeURIComponent 方法，再将其中转义过的字符转化回去
function encode (val) {
  return encodeURIComponent(val)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
}

/**
 * 把参数拼接到 url 后面，主要用于提交 GET 请求
 */
module.exports = function buildURL (url, params, paramsSerializer) {
  // 如果没有参数，那么直接返回 url
  if (!params) {
    return url
  }

  var serializedParams
  if (paramsSerializer) {
    // 如果传入了序列化方法，那么使用指定的序列化方法
    serializedParams = paramsSerializer(params)
  } else if (utils.isURLSearchParams(params)) {
    // 如果不是一个 url 查询参数，那么直接把它转化成字符串
    serializedParams = params.toString()
  } else {
    // 临时的存储数组
    var parts = []

    // 遍历传入的参数，将其用序列化函数处理一下
    utils.forEach(params, function serialize (val, key) {
      // 如果传入了 null 或者 undefined 那么不进行处理
      // 其实也可以这么写，作者为了保证安全性写得太保守了，这里可以大胆的使用隐式类型转换
      // if (!val) 完全可以达到要求
      if (val === null || typeof val === 'undefined') {
        return
      }

      // 如果 val 是一个数组那么修改一下 key 内容，如果不是数组，那么将其改为数组，方便下面 forEach 方法调用
      if (utils.isArray(val)) {
        key = key + '[]'
      } else {
        val = [val]
      }

      // 对 val 进行遍历操作
      utils.forEach(val, function parseValue (v) {
        // 如果内容是一个 data 对象，那么将其变成 ISO 标准时间字符串，如果是一个对象那么将其使用 JSON.stringify 方法序列化一下
        if (utils.isDate(v)) {
          v = v.toISOString()
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v)
        }
        // 将内容 encode 一下，然后插入到临时存储数组中
        parts.push(encode(key) + '=' + encode(v))
      })
    })
    // 把临时存储数据拼接成一个字符串
    serializedParams = parts.join('&')
  }

  // 如果存在序列好的参数，那么根据 url 最后一位的内容是 ? 还是 & 来决定拼接方式
  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
  }

  // 返回处理后的 url
  return url
}
