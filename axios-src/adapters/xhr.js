'use strict'

var utils = require('./../utils')
var settle = require('./../core/settle')
var buildURL = require('./../helpers/buildURL')
var parseHeaders = require('./../helpers/parseHeaders')
var isURLSameOrigin = require('./../helpers/isURLSameOrigin')
var createError = require('../core/createError')
// 如果浏览器含有 btoa 方法，那么使用浏览器的方法，否则就引入在 helpers 中的 btoa 方法
var btoa = (typeof window !== 'undefined' && window.btoa && window.btoa.bind(window)) || require('./../helpers/btoa')

module.exports = function xhrAdapter (config) {
  return new Promise(function dispatchXhrRequest (resolve, reject) {
    // 引入默认的头文件，数据参数
    var requestData = config.data
    var requestHeaders = config.headers

    // 如果请求是 formdata ,那么删除请求头中 Content-Type ，让浏览器设置
    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']
    }

    // 创建一个 XMLHttpRequest 对象
    var request = new XMLHttpRequest()
    var loadEvent = 'onreadystatechange'
    var xDomain = false

    // 针对 IE 做的 CORS 兼容
    if (process.env.NODE_ENV !== 'test' &&
        typeof window !== 'undefined' &&
        window.XDomainRequest && !('withCredentials' in request) &&
        !isURLSameOrigin(config.url)) {
      request = new window.XDomainRequest()
      loadEvent = 'onload'
      xDomain = true
      request.onprogress = function handleProgress () {}
      request.ontimeout = function handleTimeout () {}
    }

    // 如果用户配置项里设置了用户名和密码，那么将其放入 requsetHeaders.Authorization 中
    if (config.auth) {
      var username = config.auth.username || ''
      var password = config.auth.password || ''
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password)
    }

    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true)

    // 设置超时时间，针对 IE
    request.timeout = config.timeout

    // 监听 loadEvent 事件，正常情况下是 onreadystatechange 事件，在 IE 下面是 onload 事件
    request[loadEvent] = function handleLoad () {
      // 如果不是已完成的请求，那么直接返回，不进行操作
      if (!request || (request.readyState !== 4 && !xDomain)) {
        return
      }

      // 如果请求状态为 0 且响应 url 存在且是一个 file 服务，那么返回，不执行操作
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return
      }

      // 配置响应事件事件参数，并设置到一个 Promise 对象中
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response
      var response = {
        data: responseData,
        status: request.status === 1223 ? 204 : request.status,
        statusText: request.status === 1223 ? 'No Content' : request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      }

      settle(resolve, reject, response)

      // 清理 request 对象，释放内存
      request = null
    }

    // 错误事件
    request.onerror = function handleError () {
      // 调用 Promise 里面的 reject 方法，并传入相关错误信息
      reject(createError('Network Error', config, null, request))

      // 清理 request 对象，释放内存
      request = null
    }

    // 超时事件
    request.ontimeout = function handleTimeout () {
      // 调用 Promise 里面的 reject 方法，并传入相关错误信息
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
        request))

      // 清理 request 对象，释放内存
      request = null
    }

    // 检查是否是标准的浏览器环境，如果是标准浏览器环境，那么引入 cookie 操作函数
    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies')

      // 如果设置了跨域，或者是同域的情况且已知 cookie 名，那么设置 cookie ，否则就是设置 undefined
      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName
        ? cookies.read(config.xsrfCookieName)
        : undefined

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue
      }
    }

    // 如果 request 中有 setRequestHeader 方法那么就设置请求头的内容
    if ('setRequestHeader' in request) {
      // 遍历配置的请求头内容，调用回调函数
      utils.forEach(requestHeaders, function setRequestHeader (val, key) {
        // 如果没有配置 requestData 那么清除请求头中的 content-type 项
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key]
        } else {
          // 设置请求头部信息
          request.setRequestHeader(key, val)
        }
      })
    }

    // 根据配置情况设置跨域
    if (config.withCredentials) {
      request.withCredentials = true
    }

    // 如果配置了 responseType,那么将其设置在请求头部中
    if (config.responseType) {
      try {
        request.responseType = config.responseType
      } catch (e) {
        if (config.responseType !== 'json') {
          throw e
        }
      }
    }

    // 如果配置了下载事件监听回调，那么添加事件监听
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress)
    }

    // 如果配置了上传事件回调，那么添加事件监听
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress)
    }

    if (config.cancelToken) {
      // 如果取消执行，那么执行取消操作
      config.cancelToken.promise.then(function onCanceled (cancel) {
        if (!request) {
          return
        }

        // 取消事件
        request.abort()
        // 调用成功方法，返回取消事件参数
        reject(cancel)
        // 清理 request 对象，释放内存
        request = null
      })
    }

    // 如果没有 request,那么将其设置为 null
    if (requestData === undefined) {
      requestData = null
    }

    // 发送 XMLHttpRequest 请求
    request.send(requestData)
  })
}
