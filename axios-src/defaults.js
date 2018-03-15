'use strict'

var utils = require('./utils')
var normalizeHeaderName = require('./helpers/normalizeHeaderName')

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

// 设置表单头内容，如果头没有设置，就是检查其是否存在，如果存在那就不管，不存在就设置为默认值
function setContentTypeIfUnset (headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value
  }
}

// 拿到 xhr 对象，主要就是针对不同的环境，如浏览器和 node 来使用不同的 xhr 对象
function getDefaultAdapter () {
  var adapter
  if (typeof XMLHttpRequest !== 'undefined') {
    adapter = require('./adapters/xhr')
  } else if (typeof process !== 'undefined') {
    adapter = require('./adapters/http')
  }
  return adapter
}

// 默认配置信息
var defaults = {
  // 要使用的 XHR 对象
  adapter: getDefaultAdapter(),

  // 发送前执行的函数列表
  transformRequest: [function transformRequest (data, headers) {
    // 先反序列化一下头部的 content-type
    normalizeHeaderName(headers, 'Content-Type')
    // 检查传入的数据是类型，再根据其类型返回对应的内容，并设置相应对的 header 字段
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8')
      return data.toString()
    }
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8')
      return JSON.stringify(data)
    }
    return data
  }],

  // 接收信息时执行的函数列表
  transformResponse: [function transformResponse (data) {
    // 尽量把返回的内容转化成 JSON 形式，如果不能成功就直接返回原内容
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) { /* Ignore */ }
    }
    return data
  }],

  // 超时时间
  timeout: 0,

  // xsrfcookie,xsrfheader
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,

  // 默认过滤器，只通过 2XX 形式的返回内容
  validateStatus: function validateStatus (status) {
    return status >= 200 && status < 300
  }
}

// 默认头部，主要是接收类型
defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
}

// 创建delete, get, head, post, put, patch 等方法，并添上合适的 header 配置项
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData (method) {
  defaults.headers[method] = {}
})

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData (method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE)
})

// 导出默认配置
module.exports = defaults
