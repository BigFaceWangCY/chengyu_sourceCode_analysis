'use strict'

var utils = require('./../utils')
var transformData = require('./transformData')
var isCancel = require('../cancel/isCancel')
var defaults = require('../defaults')
var isAbsoluteURL = require('./../helpers/isAbsoluteURL')
var combineURLs = require('./../helpers/combineURLs')

/**
 * 如果终止了，那么抛出导演
 */
function throwIfCancellationRequested (config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested()
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest (config) {
  // 检查请求是否被主动终止
  throwIfCancellationRequested(config)

  // 如果存在 baseURL 那么将配置中的 url 重新拼接一下
  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url)
  }

  // 如果设置了头部信息那就使用设置的对象，要不然就使用一个空对象
  config.headers = config.headers || {}

  // 组合一下 data 信息，其实就是用过滤器处理一遍
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  )

  // 配置头部信息，将默认参数，自设参数组合到一起
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  )

  // 清除各个方法的对应头部信息
  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig (method) {
      delete config.headers[method]
    }
  )

  var adapter = config.adapter || defaults.adapter

  // 完成请求了，这个时候进行处理，同样，这是一个 Promise 对象
  return adapter(config).then(function onAdapterResolution (response) {
    // 工作正常的情况
    // 检查请求是否被主动终止
    throwIfCancellationRequested(config)

    // 组合响应信息并返回
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    )

    return response
  }, function onAdapterRejection (reason) {
    // 发生异常的情况
    // 如果被主动终止，那么停止操作
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config)

      // 组合并返回一个 Promise
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        )
      }
    }

    return Promise.reject(reason)
  })
}
