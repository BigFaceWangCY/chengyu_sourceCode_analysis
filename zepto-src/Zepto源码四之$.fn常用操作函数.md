### $.fn.get

> 从当前对象集合中获取所有元素或单个元素。当index参数不存在的时，以普通数组的方式返回所有的元素。当指定index时，只返回该置的元素。这点与eq不同，该方法返回的是DOM节点，不是Zepto对象集合。

```javascript
get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    
// 这里用的是三目运算符，我们可以简单的改写一下
get: function(idx) {
    if(idx === undefined) {
    // 没有设置 idx 返回全部的元素 
        return slice.call(this)
        // this.slice()
    } else {
    // 设置了 idx 的情况，取对应的元素
        if(idx >= 0) {
            // idx 大于等于0 从头开始取
            return this[idx]
        } else {
             // idx 小于0 从尾开始取
            return this[idx + this.length]
        }
    }
}
```
### $.fn.toArray

> 这是一个彩蛋惊喜，本质是暴露出来的，不过官方的API文档上并没有。其主要是内部使用，用于调用  $.fn.get 把传入的 zepto 对象转化成一个数组。

```javascript
toArray: function(){ return this.get() },
```


### $.fn.concat

> 添加元素到一个Zepto对象集合形成一个新数组。如果参数是一个数组，那么这个数组中的元素将会合并到Zepto对象集合中。

```javascript
concat: function(){
      var i, value, args = []
      // 遍历传入的参数
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        // 检测元素是不是 zepto 对象，如果是，那么转化成数组插入到 临时数组中，如果是元素，那么直接插入到临时数组中 
        args[i] = zepto.isZ(value) ? value.toArray() : value
      }
      // 检测当前调用 concat函数的对象是不是 zepto 对象，如果是那么先转化成数组再与args拼接，否则直接与args拼接。返回拼接结果
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },
```

### map

> 遍历对象集合中的所有元素。通过遍历函数返回值形成一个新的集合对象。

```javascript
map: function(fn){
      // 先调用 $.map 方法，把对象中的数据全用 fn 处理一遍，生成一个数组。再将数组中的内容通过 $() 方法转化成 zepto 对象。
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
```

### slice

> 提取这个数组array的子集，从start开始，如果给定end，提取从从start开始到end结束的元素，但是不包含end位置的元素。

```javascript
slice: function(){
      // 调用 slice 方法，截取该数组，并转化成 zepto 对象 
      return $(slice.apply(this, arguments))
    },
```

### ready

```javascript
ready: function(callback){
      // 通过检测 document.readyState 来判断页面是否加载成功，  
      // doScroll 是用于检测 IE 浏览器加载状态的
      // 如果页面加载成功，那么立即将回调函数放在执行队形中
      if (document.readyState === "complete" ||
          (document.readyState !== "loading" && !document.documentElement.doScroll))
        setTimeout(function(){ callback($) }, 0)
      else {
        // 添加事件监听，如果监听到 DOMContented 或者 load 事件，那么就表明页面执行完成，执行 handler
        var handler = function() {
          document.removeEventListener("DOMContentLoaded", handler, false)
          window.removeEventListener("load", handler, false)
          callback($)
        }
        document.addEventListener("DOMContentLoaded", handler, false)
        window.addEventListener("load", handler, false)
      }
      return this
    },
```


### size

> 获取对象集合中元素的数量。

```javascript
size: function(){
      return this.length
    },
```

### each

> 遍历一个对象集合每个元素。如果迭代函数返回 false，遍历结束。

```javascript
// emptyArray 的定义在顶部数据定义部分
emptyArray = []

each: function(callback){
      // 使用 Array.prototype.every 然后监测返回值，就可以做到当迭代函数返回 false 时，遍历结束
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
```

### remove

> 从其父节点中删除当前集合中的元素，有效的从dom中移除。 

```javascript
remove: function(){
      // 本函数本质上是返回 this 。即当前操作的 zepto 对象。这样做的好处是可以链式调用
      return this.each(function(){
      // 遍历当前操作的 zepto 对象。如果其存在父元素，那么就将其从父元素中移除
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
```

### not
> 过滤当前对象集合，获取一个新的对象集合，它里面的元素不能匹配css选择器。如果另一个参数为Zepto对象集合，那么返回的新Zepto对象中的元素都不包含在该参数对象中。如果参数是一个函数。仅仅包含函数执行为false值得时候的元素，函数的 this 关键字指向当前循环元素。

```javascript
not: function(selector){
      var nodes=[]
      // 如果传入内容是一个函数，且函数存在call方法
      if (isFunction(selector) && selector.call !== undefined)
        // 对当前指向的DOM数组执行 each 方法，如果返回值为false，传到到nodes数组中        
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        // 当 selector 为字符串时，对数组进行筛选，找出满足selector的内容
        // 当 selector 为 nodeList 时执行 slice.call(selector) ,这里的isFunction(selector.item)是为了排除selector为数组的情况
        //当selector为css选择器，执行$(selector)
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        //筛选出不在 excludes 数组中的记录，达到除去的目的
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      // 将nodes数组转化成 zepto 对象并返回
      return $(nodes)
    },
```

### filter
> 过滤对象集合，返回对象集合中满足css选择器的项。如果参数为一个函数，函数返回有实际值得时候，元素才会被返回。

```javascript
filter: function(selector){
      // 如果传入内容是个函数，那么返回 两次not函数筛选的结果，负负为正
      if (isFunction(selector)) return this.not(this.not(selector))
      // 如果传入的是一个css选择器，那么执行 matches 来筛选，并将结果转化成一个 zepto 数组
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
```

关于 matches 函数，我在上面文章 [Zepto源码二之工具函数](http://blog.csdn.net/qq_17347575/article/details/78973466)中提到过，在此略过

### add

> 添加元素到当前匹配的元素集合中。如果给定content参数，将只在content元素中进行查找，否则在整个document中查找。

```javascript
add: function(selector,context){
// 先调用 $ 函数，将 selector转化成zepto对象，再拼接到现在操作的 zepto 对象上，再去重，将去重结果再转化成zepto对象并返回
    return $(uniq(this.concat($(selector,context))))
    },
```

### is

> 判断当前元素集合中的第一个元素是否符css选择器。对于基础支持jquery的非标准选择器类似： :visible包含在可选的“selector”模块中。

```javascript
is: function(selector){
      // 先判断传入的是不是css选择器(通常是string形字符串)
      // 如果当前操作的 zepto 对象存在，且有内容，那么用 matches 匹配传入的内容是不是第一个，如果是 返回 true,否则返回 false
      return typeof selector == 'string' ? this.length > 0 && zepto.matches(this[0], selector) : 
      // 如果不存在则尴尬了，只能强行检验传入的selector与当前对象的selector是不是相等，返回比较结果
          selector && this.selector == selector.selector
    },
```

### find

> 在当对象前集合内查找符合CSS选择器的每个元素的后代元素。如果给定Zepto对象集合或者元素，过滤它们，只有当它们在当前Zepto集合对象中时，才回被返回。

```javascript
find: function(selector){
      var result, $this = this
      // 如果没有传入选择器，返回一个包含空值 zepto 对象
      if (!selector) result = $()
      else if (typeof selector == 'object')
      // 如果选择器是一个对象
        result = $(selector).filter(function(){
          var node = this
          // //如果 $.contains 返回 true ，则 emptyArray.some 也会返回true,外层的filter则会收录该条记录
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
        // 如果selector是css选择器
        // 如果当前集合长度为1时，调用zepto.qsa，将结果转成zepto对象
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
        // 如果长度大于1，则调用map遍历
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      // 返回结果
      return result
    },
```


### has

> 判断当前对象集合的子元素是否有符合选择器的元素，或者是否包含指定的DOM节点，如果有，则返回新的对象集合，该对象过滤掉不含有选择器匹配元素或者不含有指定DOM节点的对象。

```javascript
has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    
// 这一段可以这么改写以便于理解
changeHas: funcion(selector){
    var nodes
    // 如果传入内容是一个对象，那么直接使用 $.contains 来检测，否则用 find 来查找
    if(isObject(selector)){
        nodes = $.contains(this, selector)
    } else {
        nodes = $(this).find(selector).size()
    }
    // 返回查找结果用 filter 筛选后的结果
    return this.filter(nodes)
}
```

### eq

> 从当前对象集合中获取给定索引值的元素。

```javascript
eq: function(idx){
    // + idx +1 是隐式类型转换，确定idx是一个数字
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
```

### first

> 获取当前对象集合中的第一个元素。

```javascript
first: function(){
      var el = this[0]
      // 如果 el 存在，那么将它转化成 zepto 对象传回
      return el && !isObject(el) ? el : $(el)
    },
```
### last

> 获取当前对象集合中的最后一个元素。

```javascript
last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
```

### closest  

> 从元素本身开始，逐级向上级元素匹配，并返回最先匹配selector的元素。如果给定context节点参数，那么只匹配该节点的后代元素。这个方法与 parents(selector)有点相像，但它只返回最先匹配的祖先元素。
如果参数是一个Zepto对象集合或者一个元素，结果必须匹配给定的元素而不是选择器。

```javascript
closest: function(selector, context){
      // 判断 selector 是不是一个对象如果是那么转化成一个 zepto 对象并赋值给 collection ,如果不是那么将 collection 赋值为 false
      var nodes = [], collection = typeof selector == 'object' && $(selector)
      
      this.each(function(_, node){
      // 当selector是字符串选择器时，如果node与selector不匹配，则需要取node.parentNode进行判断
      // 当node 不是context,document的时候，取node.parentNode
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode
        if (node && nodes.indexOf(node) < 0) nodes.push(node)
      })
      // 将结果转换成一个 zepto 对象
      return $(nodes)
    },
```

### parents

> 获取对象集合每个元素所有的祖先元素。如果css选择器参数给出，过滤出符合条件的元素。

```javascript
parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          // 当selector是字符串选择器时，如果node与selector不匹配，则需要取node.parentNode进行判断
          // 当node 不是context,document的时候，取node.parentNode
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
```

### pluck

> 获取对象集合中每一个元素的属性值。返回值为 null或undefined值得过滤掉。

```javascript
pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
```

### parent

> 获取对象集合中每个元素的直接父元素。如果css选择器参数给出。过滤出符合条件的元素。


```javascript
parent: function(selector){
      // 找出直接父元素，再过滤重复值筛选一下，返回结果
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
```

### children

> 获得每个匹配元素集合元素的直接子元素，如果给定selector，那么返回的结果中只包含符合css选择器的元素。

```javascript

// 得到element元素的子元素(nodeType === 1)集合
// 如果element支持children属性则直接返回
// 反则遍历子节点中nodeType为1的节点（即元素节点）

children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
```

### contents

> 获得每个匹配元素集合元素的子元素，包括文字和注释节点。

```javascript
contents: function() {
      return this.map(function() { return this.contentDocument || slice.call(this.childNodes) })
    },
```

### siblings

> 获取对象集合中所有元素的兄弟节点。如果给定CSS选择器参数，过滤出符合选择器的元素。

```javascript

// 先获取当前元素的父节点，然后获取该父节点的所有子节点
// 再从所有子节点中去掉当前元素
// 最后如果传了selector，再将所有的子节点过滤出符合selector条件的
siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },

```

### empty

> 清空对象集合中每个元素的DOM内容。

```javascript
empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
```

### show

> 恢复对象集合中每个元素默认的“display”值。如果你用 hide将元素隐藏，用该属性可以将其显示。相当于去掉了display：none。

```javascript
show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        // 通过 getComputedStyle 来查看当前元素计算后的样式，如果 display 为 none 。那么将其 display 设置成默认
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
```

### replaceWith

> 用给定的内容替换所有匹配的元素。(包含元素本身)。content参数可以为 before中描述的类型。

```javascript
replaceWith: function(newContent){
      // 在该节点前面插入新的内容，然后删除该节点，以达到替换的目的
      return this.before(newContent).remove()
    },
```

### wrap

> 在每个匹配的元素外层包上一个html元素。structure参数可以是一个单独的元素或者一些嵌套的元素。也可以是一个html字符串片段或者dom节点。还可以是一个生成用来包元素的回调函数，这个函数返回前两种类型的包裹片段。

```javascript
wrap: function(structure){
      var func = isFunction(structure)
      // 当前操作的 zepto 对象不为空且 structure 不为函数
      if (this[0] && !func)
      // 将 structure 的第一个元素赋值给 dom 
      // 如果dom元素的parentNode存在或者当前选中的元素个人大于1那么clone为true
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        // 如果structure为函数，则将当前的元素和对应的索引传入函数
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
```

### wrapAll

> 在所有匹配元素外面包一个单独的结构。结构可以是单个元素或 几个嵌套的元素，并且可以通过在作为HTML字符串或DOM节点。

```javascript
wrapAll: function(structure){
      if (this[0]) {
      // 如果当前操作的 zepto 对象存在
      // 在当前操作的 zepto 对象前面插入被转化成 zepto 对象的 structure 对象
        $(this[0]).before(structure = $(structure))
        var children
        // 获取structure的最深层次的第一个子元素
        // 将当前的元素集合通过append方法添加到structure末尾
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
```

### wrapInner

> 将每个元素中的内容包裹在一个单独的结构中。结构可以是单个元件或多个嵌套元件，并且可以通过在作为HTML字符串或DOM节点，或者是一个生成用来包元素的回调函数，这个函数返回前两种类型的包裹片段。

```javascript
wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
        // contents => 获取当前元素的所有子节点(包括元素节点和文本节点)
        // structure为函数则将其执行结果赋值为dom，否则直接将其赋值
        // 当前元素的子节点不为空，则调用wrapAll，否则直接将dom插入self当前元素即可
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
```

### unwrap

> 移除集合中每个元素的直接父节点，并把他们的子元素保留在原来的位置。 基本上，这种方法删除上一的祖先元素，同时保持DOM中的当前元素。

```javascript

unwrap: function(){
      // 通过parent()获取当前元素集合的所有直接父节点
      // 将获取到的父节点集合进行遍历
      // 将该父节点替换为该父节点的所有子节点
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
```

### clone

> 通过深度克隆来复制集合中的所有元素。

```javascript

// 将当前元素赋值一份，用了cloneNode这个原生方法，并且传了true

clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
```

### hide

> 通过设置css的属性display 为 none来将对象集合中的元素隐藏。

```javascript
hide: function(){
      return this.css("display", "none")
    },
```

### toggle

> 显示或隐藏匹配元素。如果 setting为true，相当于show 法。如果setting为false。相当于 hide方法。

```javascript
toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        // 先判断有没有传入 setting 如果设置了，则使用 setting 的规则来进行设置
        // 如果没有设置 setting ，那么通过元素的 display 判断来进行设置显示或者隐藏
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
```

### prev

> 获取对象集合中每一个元素的前一个兄弟节点，通过选择器来进行过滤。

```javascript
prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
```

### next

> 获取对象集合中每一个元素的下一个兄弟节点(可以选择性的带上过滤选择器)。

```javascript
next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
```

### html

> 获取或设置对象集合中元素的HTML内容。当没有给定content参数时，返回对象集合中第一个元素的innerHtml。当给定content参数时，用其替换对象集合中每个元素的内容。content可以是append中描述的所有类型。

    
```javascript

html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    
// 简单的改写一下

html: function(html) {
    // 没有传入参数，那么直接获取第一个元素的html内容
    if(html === undefined){
        if(this[0]){
        // 第一个元素存在就返回内容
            return this[0].innerHTML
        } else {
        // 不存在就返回 null
            return null
        }
    } else {
        return this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        })
    }
}
```

### text

> 获取或者设置所有对象集合中元素的文本内容。当没有给定content参数时，返回当前对象集合中第一个元素的文本内容（包含子节点中的文本内容）。当给定content参数时，使用它替换对象集合中所有元素的文本内容。它有待点似 html，与它不同的是它不能用来获取或设置 HTML。

```javascript
text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
```

### attr

> 读取或设置dom的属性。如果没有给定value参数，则读取对象集合中第一个元素的属性值。当给定了value参数。则设置对象集合中所有元素的该属性的值。当value参数为null，那么这个属性将被移除(类似removeAttr)，多个属性可以通过对象键值对的方式进行设置。

```javascript
attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
      // 获取属性
        (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
        // 设置属性
        this.each(function(idx){
          if (this.nodeType !== 1) return
          // 设置多个属性值 
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          // 设置一个属性值
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
```

### removeAttr

> 移除当前对象集合中所有元素的指定属性。

```javascript
removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute)
      }, this)})
    },
```

### prop

> 读取或设置dom元素的属性值。它在读取属性值的情况下优先于 attr，因为这些属性值会因为用户的交互发生改变，如checked 和 selected。
简写或小写名称，比如for, class, readonly及类似的属性，将被映射到实际的属性上，比如htmlFor, className, readOnly, 等等。

```javascript
prop: function(name, value){
      name = propMap[name] || name
      return (typeof name == 'string' && !(1 in arguments)) ?
        (this[0] && this[0][name]) :
        this.each(function(idx){
          if (isObject(name)) for (key in name) this[propMap[key] || key] = name[key]
          else this[name] = funcArg(this, value, idx, this[name])
        })
    },
```

### removeProp

> 从集合的每个DOM节点中删除一个属性。这是用JavaScript的delete操作符完成。值得注意的是如果尝试删除DOM的一些内置属性，如className或maxLength，将不会有任何效果，因为浏览器禁止删除这些属性。

```javascript
removeProp: function(name){
      name = propMap[name] || name
      return this.each(function(){ delete this[name] })
    },
```

### data

> 读取或写入dom的 data-* 属性。行为有点像 attr ，但是属性名称前面加上 data-。

```javascript
data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
```

### val

> 获取或设置匹配元素的值。当没有给定value参数，返回第一个元素的值。如果是<select multiple>标签，则返回一个数组。当给定value参数，那么将设置所有元素的值。

```javascript
val: function(value){
      if (0 in arguments) {
        if (value == null) value = ""
        return this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
      } else {
        return this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
      }
    },
```

### offset

> 获得当前元素相对于document的位置。返回一个对象含有： top, left, width和height
当给定一个含有left和top属性对象时，使用这些值来对集合中每一个元素进行相对于document的定位。



```javascript
offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null
      if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
        return {top: 0, left: 0}
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
```

### css

> 读取或设置DOM元素的css属性。当value参数不存在的时候，返回对象集合中第一个元素的css属性。当value参数存在时，设置对象集合中每一个元素的对应css属性。
多个属性可以通过传递一个属性名组成的数组一次性获取。多个属性可以利用对象键值对的方式进行设置。
当value为空(空字符串，null 或 undefined)，那个css属性将会被移出。当value参数为一个无单位的数字，如果该css属性需要单位，“px”将会自动添加到该属性上。

```javascript
css: function(property, value){
      // 如果参数小于2，那么是取值操作
      if (arguments.length < 2) {
        var element = this[0]
        if (typeof property == 'string') {
          // 如果传入是一个字符串，那就说明是取一个单独的css样式，返回结果
          if (!element) return
          return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
        } else if (isArray(property)) {
          // 如果传入的是一个数组，那么返回一个对象，对象内容是数组所列的属性与其对应值的键值对
          if (!element) return
          var props = {}
          var computedStyle = getComputedStyle(element, '')
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
```

### index

> 获取一个元素的索引值。当elemen参数没有给出时，返回当前元素在兄弟节点中的位置。当element参数给出时，返回它在当前对象集合中的位置。如果没有找到该元素，则返回-1。

```javascript
index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
```

### hasClass

> 检查对象集合中是否有元素含有指定的class。

```javascript
hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
```

### addClass

> 为每个匹配的元素添加指定的class类名。多个class类名使用空格分隔。

```javascript
addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = []
        // 获取当前元素的className，以及通过funcArg包装参数，这样name既可以是字符串也可以是回调函数
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        // 对要设置的class newName进行分割后遍历处理
        newName.split(/\s+/g).forEach(function(klass){
          // 当前元素不存在要添加的class的时候才往classList中push
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        // 首先检查classList的长度，如果长度为0就没有必要设置了，然后调用className函数进行class设置
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
```

### removeClass

> 移除当前对象集合中所有元素的指定class。如果没有指定name参数，将移出所有的class。多个class参数名称可以利用空格分隔。

```javascript
removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          // 将匹配中的klass替换成' '，从而起到删除的作用
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
```

### toggleClass

> 在匹配的元素集合中的每个元素上添加或删除一个或多个样式类。如果class的名称存在则删除它，如果不存在，就添加它。如果 setting的值为真，这个功能类似于 addClass，如果为假，这个功能类似与 removeClass。

```javascript
toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        // name 可以是字符串也可以是函数
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        // 因为有可能是切换多个class，所以切割之后遍历处理
        names.split(/\s+/g).forEach(function(klass){
          // 当when没有传入的时候，进行的逻辑是元素有kClass，就移除，否则添加
          // 当指定了when转换后为真便是添加，否则移除kClass
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
```

### scrollTop

> 获取或设置页面上的滚动元素或者整个窗口向下滚动的像素值。

```javascript
scrollTop: function(value){
      if (!this.length) return
      // 当前元素是否有scrollTop属性
      var hasScrollTop = 'scrollTop' in this[0]
      // 如果没有传入value值，则是取值操作，hasScrollTop为真则返回元素的scrollTop属性值，否则返回元素的pageYOffset属性值
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
         // 如果有scrollTop属性则直接设置该属性对应的value值
        function(){ this.scrollTop = value } :
         // 否则调用元素的scrollTo方法，并传入scrollX和value
        function(){ this.scrollTo(this.scrollX, value) })
    },
```

### scrollLeft

> 获取或设置页面上的滚动元素或者整个窗口向右滚动的像素值。

```javascript
scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        
        function(){ this.scrollTo(value, this.scrollY) })
    },
```

### offsetParent

> 找到第一个定位过的祖先元素，意味着它的css中的position 属性值为“relative”, “absolute” or “fixed”

```javascript

rootNodeRE = /^(?:body|html)$/i,

offsetParent: function() {
      return this.map(function(){
        // 获取集合中当前元素的有定位元素的最近的祖先元素，没有获取到则用body元素赋值
        var parent = this.offsetParent || document.body
        // 祖先元素存在，并且不是根元素，html或者body元素，并且parent的position属性为static则再次进入循环
        // 以上条件都不满足则直接返回parent元素
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
```

### position

> 获取对象集合中第一个元素的位置。相对于 offsetParent。当绝对定位的一个元素靠近另一个元素的时候，这个方法是有用的。

```javascript
position: function() {
      if (!this.length) return

      var elem = this[0],
        // 找到有定位属性的祖先元素
        offsetParent = this.offsetParent(),
        // 获取当前元素相对于document的位置
        offset       = this.offset(),
        // 获取父元素相对于document的位置，如果是根元素（html或者body）则为0， 0
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // 相对于第一个定位祖先元素的位置关系不应该包括margin的举例，所以减去
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0
      // 祖先定位元素加上border的宽度
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0
      // 计算结果
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
```


### detach

```javascript
$.fn.detach = $.fn.remove
```
### forEach

```javascript
forEach: emptyArray.forEach,
```

### reduce

```javascript
reduce: emptyArray.reduce,
```

### push

```javascript
push: emptyArray.push,
```

### sort

```javascript
sort: emptyArray.sort,
```

### splice

```javascript
splice: emptyArray.splice,
```

### indexOf

> 在当前对象集合中获取一个元素的索引值。如果给定formindex参数，从该位置开始往后查找，返回基于0的索引值，如果没找到，则返回-1。index 方法是基于这个方法实现的。

```javascript
indexOf: emptyArray.indexOf,
```
##### 参考资料 [Zepto 1.2.0 中文版API手册](http://www.css88.com/doc/zeptojs_api/)