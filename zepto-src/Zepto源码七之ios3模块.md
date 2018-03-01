```javascript
;(function(undefined){
  // 针对 iOS 3.2 及以下版本的 ipad, iphone 自带浏览器String对象不带trim做的浏览器polyfill
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g, '') }

  // 针对 iOS 3.X 及以下版本的 ipad, iphone 自带浏览器Array对象不带reduce做的浏览器polyfill,不过貌似忽视了reduceRight
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      // 除去一些不能操作的特殊情况，这种时候要抛出类型异常
      if(this === void 0 || this === null) throw new TypeError()
      // 将传入数组转化Object对象
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator
      // 如果传入的参数不是一个回调函数，那么不能进行处理，抛出类型异常
      if(typeof fun != 'function') throw new TypeError()
      // 如果传入的不是一个数组或者类数组，且只传入了回调，那么没有对象操作，不能处理，抛出类型异常
      if(len == 0 && arguments.length == 1) throw new TypeError()
        
        
      // 给 accumulator 赋初值，即传入的数组对象
      if(arguments.length >= 2)
       accumulator = arguments[1]
      else
        do{
          if(k in t){
            accumulator = t[k++]
            break
          }
          if(++k >= len) throw new TypeError()
        } while (true)
    
      // 执行传入的回调
      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
        k++
      }
      return accumulator
    }

})()

```

这一个模块主要是针对 IOS3 做的浏览器 polyfill 。为浏览器添加 String.prototype.trim 与 Array.prototype.reduce 两个方法