```javascript

;(function(){
  try {
    getComputedStyle(undefined)
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle
    window.getComputedStyle = function(element, pseudoElement){
      try {
        return nativeGetComputedStyle(element, pseudoElement)
      } catch(e) {
        return null
      }
    }
  }
})()

```

这段代码的主要作用是改写 getComputedStyle 方法。主要是为了 zepto 在不同的浏览器下，可以进行相同的操作。通过查看代码，我们可以看出主要使用的方法是利用 try...catch... 来进行异常处理。同时这是一个立即执行函数，使得我们在加载框架的时候，就得以重写 getComputedStyle 方法。  

这段代码主要是针对在不同参数数量情况下，不同浏览器对此方法产生的处理差异性的统一。