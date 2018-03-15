'use strict'

var utils = require('./../utils')
var settle = require('./../core/settle')
var buildURL = require('./../helpers/buildURL')
var http = require('http')
var https = require('https')
var httpFollow = require('follow-redirects').http
var httpsFollow = require('follow-redirects').https
var url = require('url')
var zlib = require('zlib')
var pkg = require('./../../package.json')
var createError = require('../core/createError')
var enhanceError = require('../core/enhanceError')

module.exports = function httpAdapter (config) {
  // 返回一个 Promise 对象
  return new Promise(function dispatchHttpRequest (resolve, reject) {
    // 引入配置信息
    var data = config.data
    var headers = config.headers
    var timer

    // 如果没有 user-agent 那么使用 axios user-agent
    if (!headers['User-Agent'] && !headers['user-agent']) {
      headers['User-Agent'] = 'axios/' + pkg.version
    }

    // 如果 data 存在且不为 stream ，那么根据其内容统计 content-length 并传入头部中
    if (data && !utils.isStream(data)) {
      if (Buffer.isBuffer(data)) {
        // Nothing to do...
      } else if (utils.isArrayBuffer(data)) {
        data = new Buffer(new Uint8Array(data))
      } else if (utils.isString(data)) {
        data = new Buffer(data, 'utf-8')
      } else {
        return reject(createError(
          'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
          config
        ))
      }

      headers['Content-Length'] = data.length
    }

    // 检查配置的用户信息设置，如果设置了就使用，要不然就使用空串
    var auth = undefined
    if (config.auth) {
      var username = config.auth.username || ''
      var password = config.auth.password || ''
      auth = username + ':' + password
    }

    // 把语法参数分解一下
    var parsed = url.parse(config.url)
    // 如果有设置请求协议，那么使用请求设定的协议，要不然就使用 http 协议
    var protocol = parsed.protocol || 'http:'

    // 如果配置里面没有配置用户信息，但是 url 配置了，那么使用 url 的用户信息
    if (!auth && parsed.auth) {
      var urlAuth = parsed.auth.split(':')
      var urlUsername = urlAuth[0] || ''
      var urlPassword = urlAuth[1] || ''
      auth = urlUsername + ':' + urlPassword
    }

    // 如果存在用户信息配置，那么删除请求头部中的 Authorization
    if (auth) {
      delete headers.Authorization
    }

    var isHttps = protocol === 'https:'
    var agent = isHttps ? config.httpsAgent : config.httpAgent

    // 具体的请求信息
    var options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\?/, ''),
      method: config.method,
      headers: headers,
      agent: agent,
      auth: auth
    }

    var proxy = config.proxy
    // 如果设置了代理但未启用，那么仅修改一下代理信息
    if (!proxy && proxy !== false) {
      var proxyEnv = protocol.slice(0, -1) + '_proxy'
      var proxyUrl = process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()]
      if (proxyUrl) {
        var parsedProxyUrl = url.parse(proxyUrl)
        proxy = {
          host: parsedProxyUrl.hostname,
          port: parsedProxyUrl.port
        }

        if (parsedProxyUrl.auth) {
          var proxyUrlAuth = parsedProxyUrl.auth.split(':')
          proxy.auth = {
            username: proxyUrlAuth[0],
            password: proxyUrlAuth[1]
          }
        }
      }
    }

    // 如果使用了代理，修改对应的请求信息
    if (proxy) {
      options.hostname = proxy.host
      options.host = proxy.host
      options.headers.host = parsed.hostname + (parsed.port ? ':' + parsed.port : '')
      options.port = proxy.port
      options.path = protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path

      if (proxy.auth) {
        var base64 = new Buffer(proxy.auth.username + ':' + proxy.auth.password, 'utf8').toString('base64')
        options.headers['Proxy-Authorization'] = 'Basic ' + base64
      }
    }

    var transport
    // 一般是有配置就按配置来，没有配置的话就使用默认传输方式
    if (config.transport) {
      transport = config.transport
    } else if (config.maxRedirects === 0) {
      transport = isHttps ? https : http
    } else {
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects
      }
      transport = isHttps ? httpsFollow : httpFollow
    }

    // 创建一个 request
    var req = transport.request(options, function handleResponse (res) {
      // 如果请求已终止，啥都不做，直接返回
      if (req.aborted) return

      clearTimeout(timer)
      timer = null

      // 清除请求头的 content-encoding 信息
      var stream = res
      switch (res.headers['content-encoding']) {
        case 'gzip':
        case 'compress':
        case 'deflate':
          stream = stream.pipe(zlib.createUnzip())
          delete res.headers['content-encoding']
          break
      }

      var lastRequest = res.req || req

      var response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        config: config,
        request: lastRequest
      }

      // 如果 responseType 是一个 stream,那么直接把它放入 settle 中，要不然，把它转化成流，进行处理
      if (config.responseType === 'stream') {
        response.data = stream
        settle(resolve, reject, response)
      } else {
        var responseBuffer = []
        stream.on('data', function handleStreamData (chunk) {
          responseBuffer.push(chunk)

          if (config.maxContentLength > -1 && Buffer.concat(responseBuffer).length > config.maxContentLength) {
            reject(createError('maxContentLength size of ' + config.maxContentLength + ' exceeded',
              config, null, lastRequest))
          }
        })

        // 流的 error 监听处理
        stream.on('error', function handleStreamError (err) {
          if (req.aborted) return
          reject(enhanceError(err, config, null, lastRequest))
        })

        // 流的 end 监听处理
        stream.on('end', function handleStreamEnd () {
          var responseData = Buffer.concat(responseBuffer)
          if (config.responseType !== 'arraybuffer') {
            responseData = responseData.toString('utf8')
          }

          response.data = responseData
          settle(resolve, reject, response)
        })
      }
    })

    // 监听 error 事件，如果错误，那么终止请求，并执行 Promise 的 reject 状态回调
    req.on('error', function handleRequestError (err) {
      if (req.aborted) return
      reject(enhanceError(err, config, null, req))
    })

    // 设置超时，如果超时就停止
    if (config.timeout && !timer) {
      timer = setTimeout(function handleRequestTimeout () {
        req.abort()
        reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', req))
      }, config.timeout)
    }

    // 如果配置了取消，那么根据情况调用停止信息并调用 Promise 对象的 reject 方法
    if (config.cancelToken) {
      config.cancelToken.promise.then(function onCanceled (cancel) {
        if (req.aborted) return

        req.abort()
        reject(cancel)
      })
    }

    // 发送请求信息
    if (utils.isStream(data)) {
      data.pipe(req)
    } else {
      req.end(data)
    }
  })
}
