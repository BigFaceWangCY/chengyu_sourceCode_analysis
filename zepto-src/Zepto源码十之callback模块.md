### 整体结构
```javascript
;(function($){
    $.Callbacks = function(options) {
        Callbacks = {
            // code
        }
        return Callbacks
    }
})(Zepto)
```

从整体上来看，我们可以看到，其实就是向 Zepto 对象上添加了一个 Callbacks 的工厂函数。工厂函数返回一个对象。

### 代码详解

```javascript

;(function($){
  $.Callbacks = function(options) {
    options = $.extend({}, options)

    var memory, fired, firing, firingStart, firingLength, firingIndex, list = [], stack = !options.once && []
    
    // 这是 Callbacks 模块唯一的内部方法，主要是用于触发回调的执行
    var fire = function(data) {
          memory = options.memory && data
          fired = true
          firingIndex = firingStart || 0
          firingStart = 0
          firingLength = list.length
          firing = true
          // 遍历回调列表，逐个执行回调
          // 当回调列表存在且执行回调任务的索引值要小于执行列表的长度的时候执行
          for ( ; list && firingIndex < firingLength ; ++firingIndex ) {
            // 使用 apply 传入对应的上下文对象与参数，如果返回 false ，并且 options.stopOnFalse 为 true，那么清空缓存，跳出循环，不再向下执行
            if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
              memory = false
              break
            }
          }
          // 设置标记，表示没有正在执行的任务了
          firing = false
          
          if (list) {
            // 检查 stack 列表，看看基本是否有未完成任务，如果有，那么执行 
            if (stack) stack.length && fire(stack.shift())
            else if (memory) list.length = 0
            else Callbacks.disable()
          }
        },

        Callbacks = {
          add: function() {
            if (list) {
              var start = list.length,
                  // 添加一个 add 的内部方法，其主要用处是处理参数，将其正确的 push 进 list 列表中
                  add = function(args) {
                    $.each(args, function(_, arg){
                      // 如果传入参数为 function ，且 options 设置中 unique 为负或者 在回调列表中不存在，那么直接 push 进 list 列表
                      if (typeof arg === "function") {
                        if (!options.unique || !Callbacks.has(arg)) list.push(arg)
                      }
                      // 在类数组情况下，递归分解
                      else if (arg && arg.length && typeof arg !== 'string') add(arg)
                    })
                  }
              // 调用内部方法 add 处理参数
              add(arguments)
              // 如果回调正在执行中，修正任务列表长度
              if (firing) firingLength = list.length
              else if (memory) {
                // 如果是 memory 模式，立即执行新添加的回调，再继续执行
                firingStart = start
                fire(memory)
              }
            }
            return this
          },
          // 删除列表中指定的回调
          remove: function() {
            if (list) {
              $.each(arguments, function(_, arg){
                var index
                // 当指定参数在待执行列表中
                while ((index = $.inArray(arg, list, index)) > -1) {
                  // 删除待执行的回调
                  list.splice(index, 1)
                  // 如果正在执行
                  if (firing) {
                    // 修正处理参数
                    if (index <= firingLength) --firingLength
                    if (index <= firingIndex) --firingIndex
                  }
                }
              })
            }
            return this
          },
          // 检查回调是不是在待执行列表中
          has: function(fn) {
            return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
          },
          // 清空执行回调列表
          empty: function() {
            firingLength = list.length = 0
            return this
          },
          // 禁用回调
          disable: function() {
            list = stack = memory = undefined
            return this
          },
          // 检查回调禁用状态
          disabled: function() {
            return !list
          },
          // 锁定回调列表，不添加新的回调
          lock: function() {
            stack = undefined
            if (!memory) Callbacks.disable()
            return this
          },
          // 检查锁定状态
          locked: function() {
            return !stack
          },
          // 用指定上下文来执行回调函数，两个参数，第一个是上下文对象，第二个是执行参数列表
          fireWith: function(context, args) {
            if (list && (!fired || stack)) {
            // 回调待执行列表存在且未执行过或者 stack 存在
              // 如果args存在就不修改，否则赋值为空数组
              args = args || []
              // 重组 args 使其成为 list 所需要的参数形式
              args = [context, args.slice ? args.slice() : args]
              // 如果回调正在执行中，那么 push 进 stack 列表
              if (firing) stack.push(args)
              // 否则执行
              else fire(args)
            }
            return this
          },
          // 用当前上下文来执行回调函数
          fire: function() {
            return Callbacks.fireWith(this, arguments)
          },
          // 检测回调是否正在执行
          fired: function() {
            return !!fired
          }
        }

    return Callbacks
  }
})(Zepto)

```