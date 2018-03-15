'use strict'

var defaults = require('./../defaults')
var utils = require('./../utils')
var InterceptorManager = require('./InterceptorManager')
var dispatchRequest = require('./dispatchRequest')

/**
 * 创建一个 Axios 实例的构造函数，主要包含配置信息，和 request, response 的过滤器
 */
function Axios (instanceConfig) {
  this.defaults = instanceConfig
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  }
}

/**
 * 使用 Axios 发起请求
 */
Axios.prototype.request = function request (config) {
  // 整合一下参数，为了数据健壮性做的努力
  if (typeof config === 'string') {
    config = utils.merge({
      url: arguments[0]
    }, arguments[1])
  }

  // 加载配置信息
  config = utils.merge(defaults, this.defaults, { method: 'get' }, config)
  // 写入方法名称
  config.method = config.method.toLowerCase()

  var chain = [dispatchRequest, undefined]
  var promise = Promise.resolve(config)

  // 把 request 过滤器的内容放入 chain 中
  this.interceptors.request.forEach(function unshiftRequestInterceptors (interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected)
  })

  // 把 response 过滤器的内容放入 chain 中
  this.interceptors.response.forEach(function pushResponseInterceptors (interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected)
  })

  // 执行 chain 中的函数列表
  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift())
  }

  // 返回一个 promise 对象，里面是一个 Promise 对象，是过滤器全部执行结束之后的结果
  return promise
}

// 生成 delete, get, head, options 方法，添加到 Asiox 的显示原型上。
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData (method) {
  Axios.prototype[method] = function (url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }))
  }
})

// 生成 post, put, patch 方法
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData (method) {
  Axios.prototype[method] = function (url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }))
  }
})

module.exports = Axios
