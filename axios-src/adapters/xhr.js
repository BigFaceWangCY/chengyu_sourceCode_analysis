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

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response
      var response = {
        data: responseData,
        // IE sends 1223 instead of 204 (https://github.com/axios/axios/issues/201)
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

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader (val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key]
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val)
        }
      })
    }

    // 根据配置情况设置跨域
    if (config.withCredentials) {
      request.withCredentials = true
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e
        }
      }
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress)
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress)
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled (cancel) {
        if (!request) {
          return
        }

        request.abort()
        reject(cancel)
        // Clean up request
        request = null
      })
    }

    if (requestData === undefined) {
      requestData = null
    }

    // Send the request
    request.send(requestData)
  })
}
