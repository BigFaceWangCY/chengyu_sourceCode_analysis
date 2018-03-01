```javascript

;(function($, undefined){
  var prefix = '', eventPrefix,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
    testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming, transitionDelay,
    animationName, animationDuration, animationTiming, animationDelay,
    cssReset = {}

  // 反驼峰命名，就是把 thisIsAName 形式的命名转化成 this-is-a-name 这样的对 CSS 友好的命名
  function dasherize(str) { return str.replace(/([A-Z])/g, '-$1').toLowerCase() }
  // 如果 eventPrefix 存在，那么加上，如果不存在，则返回 name 小写形式
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() }

  // 通过检查 testE1.style.transform 来检查浏览器兼容性，与是否应该要加前缀，要加什么前缀
  if (testEl.style.transform === undefined) $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + vendor.toLowerCase() + '-'
      eventPrefix = event
      return false
    }
  })
 
  // 初始化设置内容，给对应的 css 属性加上前缀
  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionDelay    = prefix + 'transition-delay'] =
  cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
  cssReset[animationName      = prefix + 'animation-name'] =
  cssReset[animationDuration  = prefix + 'animation-duration'] =
  cssReset[animationDelay     = prefix + 'animation-delay'] =
  cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

  $.fx = {
    // 是否关闭，一般在浏览器不支持 CSS3 的时候，zepto 不作动画操作，直接转化到终点状态
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    // 定义了三版速度，其中 400 为 default
    speeds: { _default: 400, fast: 200, slow: 600 },
    // 浏览器前缀设置
    cssPrefix: prefix,
    // 过滤完成时触发的事件，即加浏览器前缀
    transitionEnd: normalizeEvent('TransitionEnd'),
    // 动画完成时触发的事件，即加浏览器前缀
    animationEnd: normalizeEvent('AnimationEnd')
  }
  
  
  /**
   * 参数含义
   * properties: 一个对象，该对象包含了css动画的值，或者css帧动画的名称。
   * duration: 以毫秒为单位的时间，或者一个字符串。
   * easing: 指定动画的缓动类型。
   * complete: 动画完成时的回调函数。
   */
  $.fn.animate = function(properties, duration, ease, callback, delay){
    // 如果第二个参数就是回调函数，那就表示没有设置 duration, easa 那么调整一下参数
    if ($.isFunction(duration))
      callback = duration, ease = undefined, duration = undefined
    // 如果第三个参数就是回调函数，那就表示没有设置 easa 那么调整一下参数
    if ($.isFunction(ease))
      callback = ease, ease = undefined
    // 如果第二个参数是一个对象，那么表示配置项是以一个对象传入，调整一下参数
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
    // 如果设置了 duration 那么直接使用它，否则使用默认值
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    if (delay) delay = parseFloat(delay) / 1000
    // 将调整好的参数传入 this.anim 函数中
    return this.anim(properties, duration, ease, callback, delay)
  }

  $.fn.anim = function(properties, duration, ease, callback, delay){
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd,
        fired = false 
    
    // 在进行最后的参数调整，主要是修正未配置项为默认值
    if (duration === undefined) duration = $.fx.speeds._default / 1000
    if (delay === undefined) delay = 0
    if ($.fx.off) duration = 0

    // 如果 properties 为一个字符串，那就说明只有一种样式进行动画操作
    if (typeof properties == 'string') {
      // 处理 CSS 动画设置，从这里我们可以看出，这里使用的是 CSS3 的 animate 属性
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationDelay] = delay + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
    // 反之说明 properties 为一个对象，里面设置了多个要进行变换的样式
      cssProperties = []
      // 处理 properties 参数设置，进行清理，过滤
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
      // 处理 CSS 动画设置，从这里我们可以看出
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionDelay] = delay + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }
    
    // 处理回调
    wrappedCallback = function(event){
      // 如果浏览器支持过滤或者动画事件，那么在动画结束的时候，取消事件监听
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return
        $(event.target).unbind(endEvent, wrappedCallback)
      } else
        $(this).unbind(endEvent, wrappedCallback)
      // 设置配置项，表示已经执行过了
      fired = true
      $(this).css(cssReset)
      // 如果有回调，那么调用回调
      callback && callback.call(this)
    }
    
    // 绑定动画结束事件
    if (duration > 0){
      this.bind(endEvent, wrappedCallback)
      setTimeout(function(){
        if (fired) return
        wrappedCallback.call(that)
      }, ((duration + delay) * 1000) + 25)
    }

    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function() {
      that.each(function(){ wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto)


```