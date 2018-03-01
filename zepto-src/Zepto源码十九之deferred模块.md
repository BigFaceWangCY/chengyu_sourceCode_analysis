这个其实就是一种对 Promise/A+ 规范的实现。

```javascript

;(function($){
  var slice = Array.prototype.slice

  function Deferred(func) {
    // 用于储存状态切换的方法名，与对应的执行方法
    // $.Callback({once:1,memory:1}) 用来表示只执行一次，且立即触发
    var tuples = [
          [ "resolve", "done", $.Callbacks({once:1, memory:1}), "resolved" ],
          [ "reject", "fail", $.Callbacks({once:1, memory:1}), "rejected" ],
          [ "notify", "progress", $.Callbacks({memory:1}) ]
        ],
        // 执行状态，默认为 执行中
        state = "pending",
        promise = {
          // 返回执行状态
          state: function() {
            return state
          },
          // 最后一定要执行的函数，通过调用  deferred.done, deferred.fail 来执行
          always: function() {
            deferred.done(arguments).fail(arguments)
            return this
          },
          then: function() {
            var fns = arguments
            // 其实是返回 deferred 对象上的一个 promise 方法。这样就可以一直链式调用下去，子子孙孙无穷尽也
            return Deferred(function(defer){
              $.each(tuples, function(i, tuple){
                // 判断对应位置的参数是不是一个函数 
                var fn = $.isFunction(fns[i]) && fns[i]
                // deferred[tuple[1]] 对应着 done, fail, process 三个方法，依次执行
                deferred[tuple[1]](function(){
                  // 调用指定回调，并将结果返回到 returned 中
                  var returned = fn && fn.apply(this, arguments)
                  // 如果 returned 是一个 promise ，那么那对应的回调方法传入，并返回 defer.promise()
                  if (returned && $.isFunction(returned.promise)) {
                    returned.promise()
                      .done(defer.resolve)
                      .fail(defer.reject)
                      .progress(defer.notify)
                  } else {
                  // 否则将它修改上下文状态
                    var context = this === promise ? defer.promise() : this,
                        values = fn ? [returned] : arguments
                    defer[tuple[0] + "With"](context, values)
                  }
                })
              })
              fns = null
            }).promise()
          },

          // 返回 promise 对象，如果 obj 上有值，那么将其扩展到 promise 上
          promise: function(obj) {
            return obj != null ? $.extend( obj, promise ) : promise
          }
        },
        deferred = {}
        
    // 通过遍历 tuples 生成方法
    $.each(tuples, function(i, tuple){
      var list = tuple[2],
          stateString = tuple[3]

      promise[tuple[1]] = list.add

      // 状态切换
      if (stateString) {
        list.add(function(){
          state = stateString
        }, tuples[i^1][2].disable, tuples[2][2].lock)
      }

      deferred[tuple[0]] = function(){
        deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments)
        return this
      }
      deferred[tuple[0] + "With"] = list.fireWith
    })
    // 使用 promise 扩展 deferred, 让其存在 done, fail, process 三个方法
    promise.promise(deferred)
    if (func) func.call(deferred, deferred)
    return deferred
  }

  // 类似于 Promise 对象中的 all 方法
  $.when = function(sub) {
    var resolveValues = slice.call(arguments),
        len = resolveValues.length,
        i = 0,
        remain = len !== 1 || (sub && $.isFunction(sub.promise)) ? len : 0,
        deferred = remain === 1 ? sub : Deferred(),
        progressValues, progressContexts, resolveContexts,
        // 更新回调，在每个 promise 对象执行 resolve, process 时调用
        updateFn = function(i, ctx, val){
          return function(value){
            ctx[i] = this
            val[i] = arguments.length > 1 ? slice.call(arguments) : value
            if (val === progressValues) {
              deferred.notifyWith(ctx, val)
            } else if (!(--remain)) {
              deferred.resolveWith(ctx, val)
            }
          }
        }

    // 依次处理异步队列
    if (len > 1) {
      progressValues = new Array(len)
      progressContexts = new Array(len)
      resolveContexts = new Array(len)
      for ( ; i < len; ++i ) {
        if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
          resolveValues[i].promise()
            .done(updateFn(i, resolveContexts, resolveValues))
            .fail(deferred.reject)
            .progress(updateFn(i, progressContexts, progressValues))
        } else {
          --remain
        }
      }
    }
    if (!remain) deferred.resolveWith(resolveContexts, resolveValues)
    return deferred.promise()
  }

  $.Deferred = Deferred
})(Zepto)

```