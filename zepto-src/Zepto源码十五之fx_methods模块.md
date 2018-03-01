```javascript

;(function($, undefined){
  var document = window.document,
    origShow = $.fn.show, origHide = $.fn.hide, origToggle = $.fn.toggle
  
  // 内部方法，主要是用于配置参数，然后调用 $.animate 
  function anim(el, speed, opacity, scale, callback) {
    // 用于参数的清洗，配置
    if (typeof speed == 'function' && !callback) callback = speed, speed = undefined
    var props = { opacity: opacity }
    if (scale) {
      props.scale = scale
      el.css($.fx.cssPrefix + 'transform-origin', '0 0')
    }
    // 调用 animate,然后传入清洗后的数据
    return el.animate(props, speed, null, callback)
  }
  
  // 内部方法，隐藏元素方法
  function hide(el, speed, scale, callback) {
    // hide 就是将元素的 opicity 设置为 0 ,然后调用原有的 hide 方法，将 diplay 设置为 none
    return anim(el, speed, 0, scale, function(){
      origHide.call($(this))
      callback && callback.call(this)
    })
  }
 
  // 显示元素方法
  $.fn.show = function(speed, callback) {
    // 先调用原有的 show 方法，将元素显示出来，然后再将元素透明度先设为 0 ，慢慢变成 1
    origShow.call(this)
    if (speed === undefined) speed = 0
    else this.css('opacity', 0)
    return anim(this, speed, 1, '1,1', callback)
  }
  
  // 隐藏元素方法
  $.fn.hide = function(speed, callback) {
  // 如果没有设置 speed 那么直接调用原有的 hide 方法，使其显示出来
  // 如果设置了，那么使用动画方法让其显示出来，就是调用 hide 内部方法
    if (speed === undefined) return origHide.call(this)
    else return hide(this, speed, '0,0', callback)
  }

  // 显隐切换
  $.fn.toggle = function(speed, callback) {
  // 如果没有设置 speed,或者设置了布尔型参数，那么表示不用动画，直接调用自带的 toggle 方法
    if (speed === undefined || typeof speed == 'boolean')
      return origToggle.call(this, speed)
    else return this.each(function(){
      // 对当前操作的 zepto 对象进行操作，使其每个元素进行的显隐动画
      var el = $(this)
      el[el.css('display') == 'none' ? 'show' : 'hide'](speed, callback)
    })
  }
  
  // 变成指定透明度
  $.fn.fadeTo = function(speed, opacity, callback) {
  // 通过调节透明度与动画时间来进行操作，直接调用 anim
    return anim(this, speed, opacity, null, callback)
  }
  
  // 淡入
  $.fn.fadeIn = function(speed, callback) {
    var target = this.css('opacity')
    if (target > 0) this.css('opacity', 0)
    else target = 1
    // 变成指定透明度
    return origShow.call(this).fadeTo(speed, target, callback)
  }

  // 淡出
  $.fn.fadeOut = function(speed, callback) {
    // 直接调用 hide 方法，隐藏
    return hide(this, speed, null, callback)
  }
 
  // 淡入出
  $.fn.fadeToggle = function(speed, callback) {
    return this.each(function(){
     // 对当前操作的 zepto 对象进行操作，使其每个元素进行的淡入出动画
      var el = $(this)
      el[
        (el.css('opacity') == 0 || el.css('display') == 'none') ? 'fadeIn' : 'fadeOut'
      ](speed, callback)
    })
  }

})(Zepto)


```