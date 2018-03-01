### 用于判断类型的内部函数
```javascript
// class2type对象与toString方法的定义
class2type = {}
toString = class2type.toString

// 调用 $.each 给 class2type 对象设置属性与参数，里面有全部常用的参数类型
// PS:说多一句，ES6中新增Symbol类型
$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase()
})
/*
    class2type = {
        "[object Boolean]": "boolean",
        "[object Number]": "number",
        "[object String]": "string",
        "[object Function]": "function",
        "[object Array]": "array",
        "[object Date]": "date",
        "[object RegExp]": "regexp",
        "[object Object]": "object",
        "[object Error]": "error"
    }
*/

// 用来查看传入参数的对象类型
// 如果传入参数为 undefined 或 null ,那么 obj == null 的结果为false，直接返回 "null" 或者 "undefined"
// 这是因为隐式类型转换，undefined,null在进行判断的时候都传统隐式转化为false,这也是为什么使用 == 而不是更安全的 === 的原因
// 如果不为undefined或者null那么就根据 class2Type 对象来确定类型，如果没有找到类型，就默认其是object类型
function type(obj) {
    return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
}

// 判断对象是否为window对象
function isWindow(obj) { return obj != null && obj == obj.window }

// 调用内部方法 type 来判断参数类型，并判断其是否为对象
function isObject(obj) { return type(obj) == "object" }

// 判断参数是否为函数
function isFunction(value) { return type(value) == "function" }

// 判断参数是否为document对象
function isDocument(obj) { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }

// 判断对象类型是不是纯粹的对象，具体iswg其是不是window对象与是否有原型
function isPlainObject(obj) { return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype }

// 判断对象是否为数组
isArray = Array.isArray || function (object) { return object instanceof Array }

// 判断参数是不是一个类似于数组的对象
// 如：{ "1":1,"2":2,length:2}
function likeArray(obj) {
    // 判断参数是否存在，判断参数中是否存在length属性，存在的话，length的值为参数length属性的值，否则为undefined
    var length = !!obj && 'length' in obj && obj.length,
        type = $.type(obj)
 
    // 如果是funtion或者windows对象，那么肯定不会是类数组，直接返回false
    // 如果 array ,那么直接返回 true
    // 如果不是 array ,且 length 为 0。那么只能认定这是一个类空数组了，返回true
    // 如果是上述示例中的形式的类数组，那么可以看作数组，且除了数组属性，可以像数组一样使用，返回true
    return 'function' != type && !isWindow(obj) && (
      'array' == type || length === 0 ||
      (typeof length == 'number' && length > 0 && (length - 1) in obj)
    )
  }
```

### 数组方法
```javascript
// 在一开始就定义了一个空数组，然后把数组的原型上的方法赋给 concat, filter, slice
emptyArray = []
concat = emptyArray.concat
filter = emptyArray.filter
slice = emptyArray.slice


/*
 * 这是一个过滤器方法，用于除去数组中的 null 与 undefined
 * 这么看可能利于理解
 * function compact (array) {
 *   return array.filter( (el) => item != null )  
 * }
 */
function compact(array) { return filter.call(array, function (item) { return item != null }) }

// 将数组展开，但是只能展开一层
function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }

/**
 * 将数组去重
 * 在ES6中可以这么写，更加的简单
 * uniq = (arr) => [...new Set(arr)]
 **/
uniq = function (array) { return filter.call(array, function (item, idx) { return array.indexOf(item) == idx }) }

```

### 字符串方法
```javascript

// 把HTML标准中定义的 data-proto-name 形式的内容转换成对 js 安全的驼峰式命名，主要是消除 - 的影响
camelize = function (str) { return str.replace(/-+(.)?/g, function (match, chr) { return chr ? chr.toUpperCase() : '' }) }


// 将驼峰式写法转换成 _ 连字符形式，并将 ::  转化成 /a
function dasherize(str) {
    return str.replace(/::/g, '/')
              .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
              .replace(/([a-z\d])([A-Z])/g, '$1_$2')
              .replace(/_/g, '-')
              .toLowerCase()
}
```

### 内部通用方法
```javascript

// 值反序列化
function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }
  
  // 我们可能用一种简单的方式来改写一下，毕竟多层嵌套的三目运算符理解上容易出问题
  function deserializeValue(value) {
      // 主要是用于处理一些无法反序列化的值，不能处理，为了安全，直接返回其原值
      try{
          // 如果 value 存在值，这里主要针对 null, false, undefined, 0, -0, NaN, '' 等值，这些值在隐式类型转换中都会被当作false
          if (value){
              // 检测是否是true
              if(value === 'true') {
                  return true
              } else if(value === 'false') {
              // 检测是否是false
                  return false
              } else {
                  // 检测是否是null
                  if(value === 'null') {
                      return null
                  } else {
                     // 检测是否是数字
                     if(Number(value) + '' === value){
                         return parseFloat(value)
                     } else {
                         // 检测是否是JSON
                         if(/^[\[\{]/.test(value)) {
                             return $.parseJSON(value)
                         } else {
                             return value
                         }
                     }
                  }
              }
          } else {
          // 这个意思是，啥都没检出来，大哥我服，您先回去
              return value
          }
      } catch(e) {
          return value
      }
  }

zepto.matches = function(element, selector) {
    // 如果选择器不存在或者元素不存在或者元素不为元素节点那么直接返回 false
    if (!selector || !element || element.nodeType !== 1) return false
    // 使用polyfill方法来拿到 matchesSelector ，这样可以在下面使用统一内容
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
                          element.mozMatchesSelector || element.oMatchesSelector ||
                          element.matchesSelector
    // 如果元素选择器存在，那么直接调用元素选择来选择元素并返回
    if (matchesSelector) return matchesSelector.call(element, selector)
    
    
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }
  
// zepto的css选择器
zepto.qsa = function(element, selector){
    var found,
        // 如果选择器第一个元素是 # 那么说明是 id 选择器，maybeId 为 true    
        maybeID = selector[0] == '#',
        // 如果不是 id 选择器，且第一位为 . 那么说明是类选择器，maybeClass 为 true
        maybeClass = !maybeID && selector[0] == '.',
        // 将选择器前面的 # 或者 . 去掉
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
        // simpleSelectorRE = /^[\w-]*$/,
        // 检验是不是单个选择器
        isSimple = simpleSelectorRE.test(nameOnly)
    return (element.getElementById && isSimple && maybeID) ?
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ?
          maybeClass ? element.getElementsByClassName(nameOnly) :
          element.getElementsByTagName(selector) :
          element.querySelectorAll(selector)
      )
      // return 部分比较复杂，我们写成简单的形式吧
      /*           start                   */
      // 如果 getElementById 方法存在且是id选择器同时还是一个简单的选择器
      if(element.getElementById && isSimple && maybeId) {
      // 使用 getElementById 来查找，如果找到就返回内容数组，找不到返回一个空数组
          found = element.getElementById(nameOnly)
          if(found === undefined) {
              return []
          } else {
              return [found]
          }
      } else {
       
          if(element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11){
          // 如果传用元素不是元素节点，文档，轻量级文档对象那也不用费什么劲了，找不到，直接返回一个空数组吧
              return []
          } else {
              if(isSimple && !maybeID && element.getElementsByClassName){
              // 如果是简单选择器且不是 id 选择器，浏览器支持 getElementsByClassName 方法
                  if(maybeClass){
                  // 如果是传入选择器是类选择器，那么用类选择器筛选，并将获取内容转化成一个数组对象传出
                       found = element.getElementsByClassName(nameOnly)
                       return slice.call(found)
                  } else {
                   // 如果是传入选择器是不是类选择器，那么用标签选择器筛选，并将获取内容转化成一个数组对象传出
                      found = element.getElementsByTagName(selector)
                      return slice.call(found)
                  }
              } else {
              // 使用 querySelectorAll 方法筛选选择器内容，并将内容转化成一个数组对象传出
                  found = element.querySelectorAll(selector)
                  return slice.call(found)
              }
          }
      }
      /*           end                     */
  }
  

// 过滤函数
function filtered(nodes, selector) {
    // 如果不存在选择器，那么直接把nodes 转化成 zepto 对象返回，否则转化成 zepto 对象后再用 filter 过滤
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }
 
zepto.uniq = uniq
zepto.deserializeValue = deserializeValue
```