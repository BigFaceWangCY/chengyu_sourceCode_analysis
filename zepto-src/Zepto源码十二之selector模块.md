
使用的正则： (.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*

图形化展示： ![image](http://p07n2mo4k.bkt.clouddn.com/ZEPTO0006.png)

```javascript


;(function($){
  var zepto = $.zepto, oldQsa = zepto.qsa, oldMatches = zepto.matches
  
  // 判断元素是否可见
  function visible(elem){
    // 先将元素转化成一个 zepto 对象，方便后面调用 zepto 方法
    elem = $(elem)
    // 通过判断元素的宽高与 display 是否为 display 来判断元素是否可见
    return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
  }

  var filters = $.expr[':'] = {
    // 匹配 el:visible 选择器
    visible:  function(){ if (visible(this)) return this },
    // 匹配 el:hidden 选择器
    hidden:   function(){ if (!visible(this)) return this },
    // 匹配 el:selected 选择器
    selected: function(){ if (this.selected) return this },
    // 匹配 el:checked 选择器
    checked:  function(){ if (this.checked) return this },
    // 匹配 el:parent 选择器
    parent:   function(){ return this.parentNode },
    // 匹配 el:first 选择器
    first:    function(idx){ if (idx === 0) return this },
    // 匹配 el:last 选择器
    last:     function(idx, nodes){ if (idx === nodes.length - 1) return this }, 
    // 匹配 el:eq(index) 选择器
    eq:       function(idx, _, value){ if (idx === value) return this },
    // 匹配 el:contains(text)
    contains: function(idx, _, text){ if ($(this).text().ivisiblendexOf(text) > -1) return this },
    // 匹配 el:has(sel)
    has:      function(idx, _, sel){ if (zepto.qsa(this, sel).length) return this }
  }

  var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
      childRe  = /^\s*>/,
      classTag = 'Zepto' + (+new Date())



  // 根据传入的 sel 选择器，分解出选择器，伪类，伪类参数，根据选择器选择对应的 filter
  function process(sel, fn) {
    // 用于处理 a[href=#] 这一类写法，正常应该是 a[href="#"] 这是为了容错
    sel = sel.replace(/=#\]/g, '="#"]')
    var filter, arg, match = filterRe.exec(sel)
    // 如果是伪类，且伪类名存在于 filters 对象中，然后处理对应的值
    if (match && match[2] in filters) {
      filter = filters[match[2]], arg = match[3]
      sel = match[1]
      if (arg) {
        var num = Number(arg)
        if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '')
        else arg = num
      }
    }
    // 调用传入的回调并返回结果
    return fn(sel, filter, arg)
  }

  // 重写 zepto.qsa 方法
  zepto.qsa = function(node, selector) {
    // 主要就是调用 process 方法，将主要逻辑放在回调中执行，和原方法并没有太大的区别
    return process(selector, function(sel, filter, arg){
      try {
        var taggedParent
        if (!sel && filter) sel = '*'
        else if (childRe.test(sel))
          taggedParent = $(node).addClass(classTag), sel = '.'+classTag+' '+sel

        var nodes = oldQsa(node, sel)
      } catch(e) {
        console.error('error performing selector: %o', selector)
        throw e
      } finally {
        if (taggedParent) taggedParent.removeClass(classTag)
      }
      return !filter ? nodes :
        zepto.uniq($.map(nodes, function(n, i){ return filter.call(n, i, nodes, arg) }))
    })
  }

  // 重写 zepto.matches 方法
  zepto.matches = function(node, selector){
  // 主要就是调用 process 方法，将主要逻辑放在回调中执行，和原方法没有太大的区别
    return process(selector, function(sel, filter, arg){
      return (!sel || oldMatches(node, sel)) &&
        (!filter || filter.call(node, null, arg) === node)
    })
  }
})(Zepto)


```