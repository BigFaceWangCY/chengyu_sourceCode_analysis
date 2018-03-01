### $.each

> 遍历数组元素或以key-value值对方式遍历对象。回调函数返回 false 时停止遍历。

关于为什么使用它，而不使用原生的 forEach 方法，我的看法是 $.each 传入参数是 index, element  而 forEach 的传入参数是 element, index, arr 。所以使用 $.each 方法进行遍历操作更加的安全，而不用担心修改了数组。如果需要修改数组，那么可以使用 $.map 方法来遍历创建一个新数组。这样还保证了数据的安全性。

```javascript

$.each = function (elements, callback) {
    var i, key
    // 如果是一个类数组的形式，那么就以数组的形式遍历
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        // 通过 call 形式调用，callback 函数，传入的参数是元素位置
        // 与元素本身，如果回调返回 false 时，那么停止遍历
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      // 如果不是一个类数组，那么就用对象的形式遍历
      for (key in elements)
        // 通过 call 形式调用，callback 函数，传入的参数是元素位置
        // 与元素本身，如果回调返回 false 时，那么停止遍历
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }
    return elements
  }
  
```


### $.map

> 通过遍历集合中的元素，返回通过迭代函数的全部结果(注：是一个新数组，从而保证了原数组的数据安全性)，null 和 undefined 将被过滤掉。

```javascript

$.map = function (elements, callback) {
    var value, values = [], i, key
    // 如果是一个类数组的形式，那么就以数组的形式遍历
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        // 调用 callback ，传入参数是 元素与元素位置，返回值赋值给value
        // 如果 value 不为 null 或者 undefined 那么 将 value 的值 push 到 values 中
        // PS:说句题外话，这个代码风格值得一喷
        // 如果按照 $.each 的写法，那么回调的调用方式应该是 callback.call(elements[i], elements[i], i)
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      // 如果不是一个类数组，那么就用对象的形式遍历
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    // 将 values 数组展开并返回(差不多有点有则改之，无则加勉的意思)
    return flatten(values)
  }
  
```

关于 flatten函数 详细内容我在上篇博文已经解释了，请对照 [Zepto源码二之辅助函数](http://blog.csdn.net/qq_17347575/article/details/78973466)阅读


### $.trim
> 除去字符串左右空格，如果是 null 或者 undefined 那么返回空串，否则调用字符串原生trim方法。   

因为zepto主要是为移动端设计的，所以通常使用的是webkit内核，所以不用考虑 IE8 不兼容 trim 而要自己写 trim 函数。直接调用即可。

```javascript
$.trim = function (str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }
  
// 在一般兼容IE8的项目中，我们可以拓展String原型，不过这是题外话
String.prototype.trim = function(){
    this.replace(/(^+)|(+$)/g,'')
}
```
 
### $.parseJSON
> 格式化JSON。

直接调用浏览器方法。
```javascript
if (window.JSON) $.parseJSON = JSON.parse
```

### $.contains

> 检查父节点是否包含给定的dom节点，如果两者是相同的节点，则返回 false。 

先检查浏览器是否包含 contains 方法。如果包含的话，那么直接调用该方法。否则使用自己编写的 polyfill 方法。

```javascript
$.contains = document.documentElement.contains ?
    function (parent, node) {
    // 直接判断两个元素是否是同一个元素，然后再直接调用元素方法查看 node 是不是 parent 的子孙元素
      return parent !== node && parent.contains(node)
    } :
    function (parent, node) {
      // 当 node 存在，且 node 存在父元素的时候，把 node 的父元素赋值给 node 
      // 然后对比 node 是不是与传入的 parent相等，如果相等那么说明 node 是 parent 的 子元素。如果不等那么循环操作，一直对比到 html 元素为止。
      // 这样如果有相等就可以判断 parent 是 node 的祖先元素。
      // 如果一直找不到的话，那就说明 parent 中不包含 node。 那么返回 false
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }
```

### $.type

> 获取JavaScript 对象的类型。可能的类型有： null undefined boolean number string function array date regexp object error。

```javascript

$.type = type

```

关于 type 函数 详细内容我在上篇博文已经解释了，请对照 [Zepto源码二之辅助函数](http://blog.csdn.net/qq_17347575/article/details/78973466)阅读

### $.isFunction

> 如果object是function，则返回ture。

```javascript

$.isFunction = isFunction

```

关于 isFunction函数 详细内容我在上篇博文已经解释了，请对照 [Zepto源码二之辅助函数](http://blog.csdn.net/qq_17347575/article/details/78973466)阅读


### $.isWindow

> 如果object参数为一个window对象，那么返回true。这在处理iframe时非常有用，因为每个iframe都有它们自己的window对象，使用常规方法obj === window校验这些objects的时候会失败。

```javascript

$.isWindow = isWindow

```

关于 isWindow函数 详细内容我在上篇博文已经解释了，请对照 [Zepto源码二之辅助函数](http://blog.csdn.net/qq_17347575/article/details/78973466)阅读

### $.isArray

> 如果object是array，则返回ture。

```javascript

$.isArray = isArray

```
关于 isArray函数 详细内容我在上篇博文已经解释了，请对照 [Zepto源码二之辅助函数](http://blog.csdn.net/qq_17347575/article/details/78973466)阅读

### $.isPlainObject

> 测试对象是否是“纯粹”的对象，这个对象是通过 对象常量（"{}"） 或者 new Object 创建的，如果是，则返回true。

```javascript

$.isPlainObject = isPlainObject

```
关于 isPlainObject函数 详细内容我在上篇博文已经解释了，请对照 [Zepto源码二之辅助函数](http://blog.csdn.net/qq_17347575/article/details/78973466)阅读

### $.isEmptyObject

```javascript

$.isEmptyObject = function (obj) {
    var name
    // 如果使用 for..in 循环能遍历出属性那么说明，参数有属性，即非空对象，那么返回 false 否则返回 true
    for (name in obj) return false
    return true
  }
  
```

### $.isNumeric

> 如果该值为有限数值或一个字符串表示的数字，则返回ture。

```javascript

$.isNumeric = function (val) {
    // 先将 val 转化成一个 Number 对象，再检查 val 的类型
    // null undefined 肯定非数字，返回 false
    // boolean 的值只有 false ,true 肯定非数字，返回false
    // 不是字符串类型，但是有length属性，那么说明是类数组或者数组，肯定非数字，返回false
    // 通过 isNaN ,isFinite 检测，那么说明它是一个数字，返回false
    // 没如果不能通过上述的所有条件，那么肯定不是一个数字，返回false
    var num = Number(val), type = typeof val
    return val != null && type != 'boolean' &&
      (type != 'string' || val.length) &&
      !isNaN(num) && isFinite(num) || false
  }
  
```

### $.noop

> 引用一个空函数（什么都不处理）。

```javascript

$.noop = function () { }

```

### $.inArray

> 返回数组中指定元素的索引值，如果没有找到该元素则返回-1。

```javascript

$.inArray = function (elem, array, i) {
    return emptyArray.indexOf.call(array, elem, i)
  }
  
// 题外话
// 在ES6版本中，我们已经可以使用 Array.indexOf() 来检测元素位置
// 在ES7中我们可以使用 Array.includes() 来检测元素是否存在于数组中
  
```

### $.camelCase

> 将一组字符串变成“骆驼”命名法的新字符串，如果该字符已经是“骆驼”命名法，则不变化。

```javascript

$.camelCase = camelize

```
关于 camelize函数 详细内容我在上篇博文已经解释了，请对照 [Zepto源码二之辅助函数](http://blog.csdn.net/qq_17347575/article/details/78973466)阅读

### $.grep

> 获取一个新数组，新数组只包含回调函数中返回 ture 的数组项。

```javascript

$.grep = function (elements, callback) {
    // 直接使用 filter 函数来过滤参数
    return filter.call(elements, callback)
  }
关于 filter函数 详细内容我在上篇博文已经解释了，请对照 [Zepto源码二之辅助函数](http://blog.csdn.net/qq_17347575/article/details/78973466)阅读

```

### $.extend

> 通过源对象扩展目标对象的属性，源对象属性将覆盖目标对象属性。


```javascript
function extend(target, source, deep) {
    // 对源对象进行遍历
    for (key in source)
      // 如果是深度遍历，那么还要判断该属性是否是对象或者数组。
      // 在对象与数组的情况要深层递归遍历
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        // 先判断是对象还是数组，根据情况创建，方便后期赋值
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
          
        // 递归调用
        extend(target[key], source[key], deep)
      }
      // 简单的把 源对象的属性值赋值给 目标对象。如果是深度遍历的情况，那说明已经遍历到最深的一层了
      // 如果是非深度遍历，那就表示是最外层复制
      // 过滤了undefined 。且都是按引用赋值
      else if (source[key] !== undefined) target[key] = source[key]
  }

  $.extend = function (target) {
    var deep, args = slice.call(arguments, 1)
     
    // 从这个 if 判断中可以看出,$.extend的两种调用方式
    // $.extend(deep,target,source)
    // $.extend(target,source,deep)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    
    // 使用 forEach 方法来调用匿名函数
    // 匿名函数的具体职责是调用 extend 方法
    args.forEach(function (arg) { extend(target, arg, deep) })
    return target
  }
```

##### 参考资料 [Zepto 1.2.0 中文版API手册](http://www.css88.com/doc/zeptojs_api/)