'use strict'

var utils = require('./../utils')

module.exports = (
  // 检查浏览器环境
  utils.isStandardBrowserEnv()

  // 如果是标准浏览器环境
    ? (function standardBrowserEnv () {
      // 通过 userAgent 来检查是否是 IE 环境
      var msie = /(msie|trident)/i.test(navigator.userAgent)
      var urlParsingNode = document.createElement('a')
      var originURL

      // 内部函数，用于分解URL
      function resolveURL (url) {
        var href = url

        // 针对 IE 浏览器进行的特殊处理,因为在 IE 下，第一遍设置的是属性名，并没有把值带入
        if (msie) {
          urlParsingNode.setAttribute('href', href)
          href = urlParsingNode.href
        }

        urlParsingNode.setAttribute('href', href)

        // 分解成对应的内容并返回
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/')
            ? urlParsingNode.pathname
            : '/' + urlParsingNode.pathname
        }
      }

      // 分解当前页面 URL
      originURL = resolveURL(window.location.href)

      // 返回一个检查同源的方法，这样用于判断请求地址与当前页面是不是同源
      return function isURLSameOrigin (requestURL) {
        // 先分解请求 URL，然后通过判断地址与端口来检查是不是同源
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host)
      }
    })()

    // 非标准浏览器环境，这个没办法操作了，随缘就好
    : (function nonStandardBrowserEnv () {
      return function isURLSameOrigin () {
        return true
      }
    })()
)
