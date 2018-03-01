源码GITHUB地址：
[git@github.com:madrobby/zepto.git](git@github.com:madrobby/zepto.git)

首先我们查看一下代码结构  
![image](http://p07n2mo4k.bkt.clouddn.com/zepto0001.png)

其中 zepto.js 是其中主文件，本篇文章主要讲述的内容就是它：

## 代码结构

我们首先使用一下代码折叠，查看一下主要结构  

![image](http://p07n2mo4k.bkt.clouddn.com/zepto0002.png)  


```javascript
var Zepto = (function(){
    // code
})()
```

由此我们可以看出 zepto 使用的是自执行函数。从自执行函数赋值给Zepto上来看，我们可以推断出，它是一个闭包(当然，它真是一个闭包)。

然后把 Zepto 绑定到全局的windows上面。  
接下来再判断全局$是否存在值，如果存在值就代码它被其它内容占用(如：jQuery)，那么就不改变$的内容，如果不存在就表示可以使用$，那么就把Zepto赋值给window.$

PS:说多一句,jQuery的构造函数也是使用这种闭包自执行函数的封装方式，虽然没有验证 $ 的赋值问题，但是它有另一种操作。如直接传入window对象，可以把window对象当作局部对象来使用，当jQuery需要访问window对象的时候，不用把作用域回退到最顶层，可以更快的访问window对象。同时，传入了undefined，也可以缩短查找undefined的作用域链。也算是一个骚操作。

```javascript
// jQuery的骚操作
(function(window,undefined){
    window.jQuery = window.$ = jQuery
    // code
})(window)

```

## 核心代码

我们先把具体实现的细节移除，看一下核心代码结构

![image](http://p07n2mo4k.bkt.clouddn.com/zepto0003.png)

```javascript
var Zepto = (function() {
  var $,zepto = {},
 
  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len
    this.selector = selector || ''
  }

  zepto.Z = function(dom, selector) {
    return new Z(dom, selector)
  }
  
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  zepto.init = function(selector, context) {
    var dom
    if (!selector) return zepto.Z()
    else if (typeof selector == 'string') {
      // code
    }
    else if (isFunction(selector)) return $(document).ready(selector)
    else if (zepto.isZ(selector)) return selector
    else {
     // code
    }
    return zepto.Z(dom, selector)
  }

  $ = function(selector, context){
    return zepto.init(selector, context)
  }
  
  $.fn = {
    constructor: zepto.Z,
    // 一些常用方法，如 get ,ready, remove ,add ,filter ,has ,attr ,html 等
    // 我们可以发现，常用的API操作具体实现就在这里，不过在这里我们省去了
  }

  zepto.Z.prototype = Z.prototype = $.fn
  $.zepto = zepto

  return $
})()
```

在这里我们可以看到， $ 是一个函数，在$.fn上面挂载了许多属性与方法。
使用 zepto 的时候，会像 jQuery 一样的用 $ 来获取 dom 元素，并刚它转化成 zepto 元素，从而可以使用 zepto 的方法。  

```javascript
$ = function(selector, context){
  return zepto.init(selector, context)
}
```
$ 其实是调用 zepto.init() 方法
```javascript
zepto.init = function(selector, context) {
    var dom
    if (!selector) return zepto.Z()
    else if (typeof selector == 'string') {
      // code
    }
    else if (isFunction(selector)) return $(document).ready(selector)
    else if (zepto.isZ(selector)) return selector
    else {
      // code
    }
    return zepto.Z(dom, selector)
  }
```
init 方法其实主要就是通过 selector 定义的选择器来获取 dom 集合。然后交由 zepto.Z() 进行处理

```javascript
function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len
    this.selector = selector || ''
}

zepto.Z = function(dom, selector) {
  return new Z(dom, selector)
}
```
zepto.Z 方法返回的是函数 Z 的一个实例。函数 Z 会将 dom 展开，变成实例的属性，并且设置实例的 length 属性。

## 骚操作
```javascript
zepto.Z.prototype = Z.prototype = $.fn
```
将 Z 的 prototype 指向 $.fn ，这样，Z 的实例就继承了 $.fn 的方法。同时配合 isZ 方法来确定对象是一个 zepto 对象。

