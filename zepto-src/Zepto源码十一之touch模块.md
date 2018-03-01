```javascript

;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
    longTapDelay = 750,
    gesture,
    down, up, move,
    eventMap,
    initialized = false

  // 滑动方向
  function swipeDirection(x1, x2, y1, y2) {
    // 先判断水平与垂直方向谁的相对位移比较大，如果水平方向大，那就是水平滑动，否则就是垂直滑动
    return Math.abs(x1 - x2) >=
    // 判断完了方向再比较两个手势点位移，通过位移差判断是上下左右滑动
      Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  // 长按
  function longTap() {
    // 清空 longTabTimeout 计时器
    longTapTimeout = null
    // 如果 touch.last 存在，则触发 longTap 事件，然后清空 touch 对象，方便下次使用
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }
  
  // 取消长按
  function cancelLongTap() {
    // 清空 longTabTimeout 计时器
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  // 取消全部
  function cancelAll() {
    // 清空所有计时器，然后清空 touch 对象，方便下次使用
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  // 是否为主触点
  function isPrimaryTouch(event){
    // 通过检查事件类型是点击事件且是主触点来判断。只处理手指事件
    return (event.pointerType == 'touch' ||
      event.pointerType == event.MSPOINTER_TYPE_TOUCH)
      && event.isPrimary
  }

  // 是否是点击事件类型
  function isPointerEventType(e, type){
    // 反正在前端上面喷微软就是政治正确就是了，为了微软专门写的浏览器hack
    return (e.type == 'pointer'+type ||
      e.type.toLowerCase() == 'mspointer'+type)
  }

  // 未注册的事件，其实也就是检查一下初始化是否执行过
  function unregisterTouchEvents(){
    if (!initialized) return
    $(document).off(eventMap.down, down)
      .off(eventMap.up, up)
      .off(eventMap.move, move)
      .off(eventMap.cancel, cancelAll)
    $(window).off('scroll', cancelAll)
    cancelAll()
    initialized = false
  }

  // 初始化模块，其实也就是自执行的一种方式 
  function setup(__eventMap){
    var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType

    unregisterTouchEvents()

    // 根据不同的浏览器，给定不同的事件类型，使用在框架内部得以统一
    eventMap = (__eventMap && ('down' in __eventMap)) ? __eventMap :
      ('ontouchstart' in document ?
      { 'down': 'touchstart', 'up': 'touchend',
        'move': 'touchmove', 'cancel': 'touchcancel' } :
      'onpointerdown' in document ?
      { 'down': 'pointerdown', 'up': 'pointerup',
        'move': 'pointermove', 'cancel': 'pointercancel' } :
       'onmspointerdown' in document ?
      { 'down': 'MSPointerDown', 'up': 'MSPointerUp',
        'move': 'MSPointerMove', 'cancel': 'MSPointerCancel' } : false)

    if (!eventMap) return
    
    // 日常黑微软，这又是为了处理 IE
    if ('MSGesture' in window) {
      // 创建一个手势对象
      gesture = new MSGesture()
      // 绑定对象
      gesture.target = document.body
      
      $(document)
        .bind('MSGestureEnd', function(e){
        // 绑定事件，分析在IE下的手势方向，然后触发对应事件
        // 此段代码作用类似于 swipeDirection
          var swipeDirectionFromVelocity =
            e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null
          if (swipeDirectionFromVelocity) {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe'+ swipeDirectionFromVelocity)
          }
        })
    }

    down = function(e){
      // 只要不是滑动事件，或者不是向下滑动那么直接返回，不执行下面步骤
      if((_isPointerType = isPointerEventType(e, 'down')) &&
        !isPrimaryTouch(e)) return
      // 如果是滑动事件，那么记录第一根手指的信息
      firstTouch = _isPointerType ? e : e.touches[0]
      // 是单指操作的时候，重置终点信息
      if (e.touches && e.touches.length === 1 && touch.x2) {
        touch.x2 = undefined
        touch.y2 = undefined
      }
      // 记录触点信息
      now = Date.now()
      delta = now - (touch.last || now)
      touch.el = $('tagName' in firstTouch.target ?
        firstTouch.target : firstTouch.target.parentNode)
      touchTimeout && clearTimeout(touchTimeout)
      touch.x1 = firstTouch.pageX
      touch.y1 = firstTouch.pageY
      // 检查是不是双击事件
      if (delta > 0 && delta <= 250) touch.isDoubleTap = true
      // 检查是不是长按事件
      touch.last = now
      longTapTimeout = setTimeout(longTap, longTapDelay)
      // 黑IE，单独处理IE
      if (gesture && _isPointerType) gesture.addPointer(e.pointerId)
    }

    move = function(e){
    // 只要不是滑动事件，或者不是 move 事件那么直接返回，不执行下面步骤
      if((_isPointerType = isPointerEventType(e, 'move')) &&
        !isPrimaryTouch(e)) return
      firstTouch = _isPointerType ? e : e.touches[0]
      // 竟然移动了，那肯定不是长按事件，取消长按事件
      cancelLongTap()
      //记录移动终点的信息
      touch.x2 = firstTouch.pageX
      touch.y2 = firstTouch.pageY
      // 计算手指移动起点终点间的位移
      deltaX += Math.abs(touch.x1 - touch.x2)
      deltaY += Math.abs(touch.y1 - touch.y2)
    }

    up = function(e){
    // 只要不是滑动事件，或者不是 up 事件那么直接返回，不执行下面步骤
      if((_isPointerType = isPointerEventType(e, 'up')) &&
        !isPrimaryTouch(e)) return
        // 手指竟然松开了，那肯定不是长按，取消长按
      cancelLongTap()

      // 如果手指间移动超过30,那么就是 swipe滑动事件
      if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
          (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))
        // 触发对应的滑动事件
        swipeTimeout = setTimeout(function() {
          if (touch.el){
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
          }
          touch = {}
        }, 0)

      else if ('last' in touch)
        if (deltaX < 30 && deltaY < 30) {
          // 如果 last 存在，那么不是 swipe 事件。
          tapTimeout = setTimeout(function() {
            var event = $.Event('tap')
            event.cancelTouch = cancelAll
            if (touch.el) touch.el.trigger(event)

            if (touch.isDoubleTap) {
              if (touch.el) touch.el.trigger('doubleTap')
              touch = {}
            }

            else {
              touchTimeout = setTimeout(function(){
                touchTimeout = null
                if (touch.el) touch.el.trigger('singleTap')
                touch = {}
              }, 250)
            }
          }, 0)
        } else {
          touch = {}
        }
        deltaX = deltaY = 0
    }

    $(document).on(eventMap.up, up)
      .on(eventMap.down, down)
      .on(eventMap.move, move)
    $(document).on(eventMap.cancel, cancelAll)
    $(window).on('scroll', cancelAll)

    initialized = true
  }
  // 给对应的事件绑定 callback
  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
    'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
    $.fn[eventName] = function(callback){ return this.on(eventName, callback) }
  })

  $.touch = { setup: setup }

  $(document).ready(setup)
})(Zepto)


```