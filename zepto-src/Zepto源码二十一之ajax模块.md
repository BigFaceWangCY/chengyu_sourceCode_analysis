```

;(function($){
  var jsonpID = +new Date(),
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a')

  originAnchor.href = window.location.href

  // 触发自定义事件,并返回默认事件执行状态
  function triggerAndReturn(context, eventName, data) {
    // 创建并初始化一个指定的 DOM 事件
    var event = $.Event(eventName)
    // 使用指定的上下文来触发刚刚创建的事件,并传入参数
    $(context).trigger(event, data)
    // 返回默认事件的执行状态
    return !event.isDefaultPrevented()
  }
  
  // Ajax 模块中的全局事件
  function triggerGlobal(settings, context, eventName, data) {
    // 如果设置中确定了使用了全局事件,那么直接调用 triggerAndRetrun 来触发全局事件, 如果指定了上下文对象,那么传入指定的上下文对象,否则使用 document 来当上下文对象
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }
  
  // Ajax 请求的步骤
  $.active = 0
  
  // 全局 ajaxStart 事件
  function ajaxStart(settings) {
    // 如果允许使用全局事件,且 $.active 执行步骤为 0 .添加 $.active 并触发全局 ajaxStart 事件
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  
  // 全局 ajaxStop 事件
  function ajaxStop(settings) {
    // 如果允许使用全局事件,且 $.active先自udgkn, 执行步骤为 0 .触发全局 ajaxStop 事件
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }
  
  // 全局 ajaxBeforeSend 事件
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    // 调用配置中的 beforeSend 方法，如果 befoeSend 方法返回的为 false 时，则取消触发 ajaxBeforeSend 事件，并且会取消后续 Ajax 请求的发送,否则调用 ajaxBeforeSend
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false
    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  
  // 全局 ajaxSuccess 事件
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    // 先调用绑定的 success 回调
    settings.success.call(context, data, status, xhr)
    // 如果 ajax 是一个 deferred 类型的,那么调用 deferred.resolveWith()
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    // 触发全局 ajaxSuccess 事件
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    // 调用 ajaxComplete
    ajaxComplete(status, xhr, settings)
  }

  // 触发全局 ajaxError 事件
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    // 先调用绑定的 error 事件回调
    settings.error.call(context, xhr, type, error)
    // 如果 ajax 是一个 deferred 类型的,那么调用 deferred.rejectWith()
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    // 调用全局的 ajaxError 事件
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    // 调用 ajaxComplete
    ajaxComplete(type, xhr, settings)
  }

  // 触发全局 ajaxComplete 事件
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    // 先调用绑定的 complete 事件回调
    settings.complete.call(context, xhr, status)
    // 触发全局的 ajaxComplete 事件
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    // 执行 ajaxStop
    ajaxStop(settings)
  }
  
  // 触发全局 ajaxDataFilter 事件
  function ajaxDataFilter(data, type, settings) {
    // 如果设置中的 dataFilter 是默认的空函数,直接返回 data,否则使用 dataFilter 处理,并返回结果
    if (settings.dataFilter == empty) return data
    var context = settings.context
    return settings.dataFilter.call(context, data, type)
  }
  
  // 一个空函数,什么都不做
  function empty() {}

  $.ajaxJSONP = function(options, deferred){
    // 如果没有设置类型,那么就是使用默认类型,直接返回并调用 ajax 方法
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
    // 如果 options.jsonpCallback 不存在,那么 callbackName 为 ('Zepto' + (jsonpID++))
    // 否则要根据其状态判断,其要是一个函数的话,那么 callbackName 为函数的返回值,不是函数的话,那么 callbackName 就是 options.jsonpCallback
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout
    
    // 如果 deffered 存在,那么将 xhr 封装成一个 Promise 对象
    if (deferred) deferred.promise(xhr)
    
    // 错误处理,如果刚刚创建的 script 标签 load error 那么执行函数
    $(script).on('load error', function(e, errorType){
      // 清除计时器
      clearTimeout(abortTimeout)
      // 关闭标签并删除
      $(script).off().remove()

      if (e.type == 'error' || !responseData) { 
        // 如果事件类型是 error 且没有数据,那么执行 ajaxError
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        // 如果事件类型不是 error ,或者有数据,那么执行 ajaxSuccess
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      // 把值给回调进行处理
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])
      // 释放内存
      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }
    
    // 给 script 标签添加 src ,并处理 src 参数
    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    // 将标签插入到 head 中,基本上就会执行了
    document.head.appendChild(script)

    // 如果设置了超时,那么就设置一下超越处理
    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  // 请求设置 
  $.ajaxSettings = {
    // 请求方法,默认为 GET
    type: 'GET',
    // 发送请求前要执行的回调,默认是一个空函数
    beforeSend: empty,
    // 请求成功要执行的回调,默认是一个空函数
    success: empty,
    // 请求失败后要执行的回调,默认是一个函数
    error: empty,
    // 请求完成后要执行的回调,无论成功或者失败,默认是一个空函数
    complete: empty,
    // 用于设置 Ajax 的相关回调的上下文对象,默认为 window
    context: null,
    // 求将触发全局Ajax事件处理程序
    global: true,
    // 初始化一个 xhr 对象
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    //  从服务器请求的MIME类型，指定dataType值
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // 是否跨域,默认不跨域
    crossDomain: false,
    // 超时时间
    timeout: 0,
    // 对于非 GET 请求,是否自动将数据编码,默认自动编码
    processData: true,
    // 浏览器是否缓存 GET 请求,默认缓存
    cache: true,
    // 使用指定的回调来过滤响应数据,默认使用一个空函数
    dataFilter: empty
  }

  // 根据 mime 返回 dataType
  function mimeToDataType(mime) {
    // 如果 mime 存在,那么使用 split 分割,并把第一个值赋值给 mime
    if (mime) mime = mime.split(';', 2)[0]
    // 如果 mime 不存在,直接返回 false
    // 如果 mime 存在,那么通过比对返回对应的值
    // mime === jsonType   =>  json
    // scriptTypeRE.test(mime) === true  => script
    // xmlTypeRE.test(mime) && 'xml' ) === true => xml
    // 其它类型 => text
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  // 向 url 追加参数
  function appendQuery(url, query) {
    // 如果没有参数,直接返回 url
    if (query == '') return url
    // 使用 & 拼接 url 与 query ,然后再把 &&, &?, ??, ?& 等形式的改成 ? ,其实主要是针对  &?, ? 这两种形式
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // 序列化参数
  function serializeData(options) {
    // 如果需要序列化参数且存在参数,且参数类型不为 string, 那么直接调用 $.param() 来序列化参数
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    // 如果没有设置请求类型,或者请求类型为 GET ,或者请求类型为 jsonp 那么使用 appendQuery 来拼接请求 url 与参数
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor, hashIndex
    // 将默认的参数合并到settings上
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    // 执行 ajaxStart
    ajaxStart(settings)

    // 判断是否设置了跨域
    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a')
      urlAnchor.href = settings.url
      urlAnchor.href = urlAnchor.href
      // 重新判断一下跨域是否需要
      settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
    }
    
    // 如果没有设置链接,那么使用当前页面的链接
    if (!settings.url) settings.url = window.location.toString()
    
    // 如果链接上面有 # 锚点,那么修正一下
    if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex)
    
    // 把参数序列化一下
    serializeData(settings)

    // 遇到请求地址类似 abc.com?a=xx&b=xx的时候设置返回数据类型为jsonp
    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'

    // 不使用缓存，添加时间戳
    // cache 为 false 
    // options.cache 不为 true
    // dataType为 jsonp 或 script
    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now())

    // 如果 dataType 是 jsonp 先设置 callback 名字然后调用 $.ajaxJSONP
    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        // 内部函数,用于设置 HTTP 请求的请求头
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
        // 取 HTTP 请求的协议,如果没有那么使用当前页面协议
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)
 
    // 如果没有设置跨域,那么将请求头的 X-Requested-With 设置成 XMLHttpRequest, 否则不设置
    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    
    // 设置接收类型 Accept ,如果自己设置了,那么使用自己的设置项,否则接收全类型
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    
    // Content-Type指定后端接收的文件类型，方便服务器处理对应的文件
    // 如果不是 GET 类型请求，并且指定了数据 data，则默认类型为 application/x-www-form-urlencoded
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    // 如果设置了 name 项,那么就插入到 setHeader 里面
    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    
    // 将刚刚设置好的 setHeader 赋值给 XHR 对象的 setRequestHeader
    xhr.setRequestHeader = setHeader

    // 给 XHR 对象的 onreadystatechange 事件设置回调
    xhr.onreadystatechange = function(){
      // 0：请求未初始化（还没有调用 open()）。
      // 1：请求已经建立，但是还没有发送（还没有调用 send()）。
      // 2：请求已发送，正在处理中（通常现在可以从响应中获取内容头）。
      // 3：请求在处理中；通常响应中已有部分数据可用了，但是服务器还没有完成响应的生成。
      // 4：响应已完成；您可以获取并使用服务器的响应了。
      if (xhr.readyState == 4) {
        // 给回调设成空,防止重复处理
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        // 200 <= xhr.status < 300 表示请求已经成功
        // 304 便是没有被修改
        // 或者是本地的文件
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {

          // mimeToDataType对后端返回的数据进行数据转化
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          
          // 设置返回数据
          if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
            result = xhr.response
          else {
            result = xhr.responseText

            try {
              // 过滤数据
              result = ajaxDataFilter(result, dataType, settings)
              // 根据不同的数据类型,重新进行赋值
              if (dataType == 'script')    (1,eval)(result)
              else if (dataType == 'xml')  result = xhr.responseXML
              else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
            } catch (e) { error = e }
            // 如果有错误的话,那么执行 ajaxError
            if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred)
          }
          // 成功调用  ajaxSuccess
          ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    // 调用 ajaxBeforeSend ,如果结果返回 false ,那么终止 xhr 请求,然后执行 ajaxError
    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    // 是否设置了异步,如果设置了,那么使用设置值,否则使用异步
    var async = 'async' in settings ? settings.async : true
    // xhr 的 open 方法
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])
    
    // 超时处理
    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // xhr 请求发送
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // 参数格式化,一般是处理一些参数 undefined 或者 缺失的情况
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  // 序列化参数
  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      if (!scope && array) params.add(value.name, value.value)
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(key, value) {
      if ($.isFunction(value)) value = value()
      if (value == null) value = ""
      this.push(escape(key) + '=' + escape(value))
    }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)


```