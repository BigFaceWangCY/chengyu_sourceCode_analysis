> gesture 模块是针对 IOS 系统上浏览器的 gesture 事件进行的封装。

```javascript

;(function($){
  // 判断系统是不是 ios
  if ($.os.ios) {
    var gesture = {}, gestureTimeout
    
    // 获取目标节点，如果目标节点不是元素节点，那么获取父节点
    function parentIfText(node){
      return 'tagName' in node ? node : node.parentNode
    }

    // 给浏览器绑定 gesturestart, gesturechange, gestureend 三个方法
    $(document).bind('gesturestart', function(e){
      // 记录两次 start 之间的间隔时间
      var now = Date.now(), delta = now - (gesture.last || now)
      // 获取要操作的元素节点
      gesture.target = parentIfText(e.target)
      // 清空已有的计时器任务
      gestureTimeout && clearTimeout(gestureTimeout)
      // 获取起点的缩放值
      gesture.e1 = e.scale
      gesture.last = now
    }).bind('gesturechange', function(e){
      // 更新终点的缩放值
      gesture.e2 = e.scale
    }).bind('gestureend', function(e){
      // 如果有缩放的情况
      if (gesture.e2 > 0) {
        // 根据缩放值的变化情况调用对应的 pinchIn, pinchOut, pinch 方法
        Math.abs(gesture.e1 - gesture.e2) != 0 && $(gesture.target).trigger('pinch') &&
          $(gesture.target).trigger('pinch' + (gesture.e1 - gesture.e2 > 0 ? 'In' : 'Out'))
        gesture.e1 = gesture.e2 = gesture.last = 0
      } else if ('last' in gesture) {
        gesture = {}
      }
    })
    
    // 将 gesturechange, gestureend, gesturestart 绑定到对应的 pinch, pinchout, pinchin 上面
    // 从而在多个操作系统上，对应的方法调用事件得以统一
    ;['pinch', 'pinchIn', 'pinchOut'].forEach(function(m){
      $.fn[m] = function(callback){ return this.bind(m, callback) }
    })
  }
})(Zepto)


```