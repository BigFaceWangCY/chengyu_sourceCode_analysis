```javascript
;(function($){
  var data = {}, dataAttr = $.fn.data, camelize = $.camelCase,
    exp = $.expando = 'Zepto' + (+new Date()), emptyArray = []


  // 获取 node 节点的指定属性名的值
  function getData(node, name) {
    // 读取 node 的 exp 属性，直接赋值给 id 。然后拿到对应 node 的 store
    var id = node[exp], store = id && data[id]
    // 如果属性名不存在，那么返回全部属性 store 。如果 store 存在，直接返回，不存在，通过setData() 方法拿到一个返回
    if (name === undefined) return store || setData(node)
    else {
      if (store) {
        // 如果 name 存在于 store 中，直接返回结果。不如果不存在，那么转化成驼峰再返回一次结果
        if (name in store) return store[name]
        var camelName = camelize(name)
        if (camelName in store) return store[camelName]
      }
      // 如果有 name , store 但是在 store 中找不到，那么使用 dataAttr 找一遍
      return dataAttr.call($(node), name)
    }
  }

  // 给 node 节点设置属性，另外该属性是存储在内存中的，并没有真正的操作 DOM 节点
  function setData(node, name, value) {
    // 读取 node 的 exp 属性，如果存在那么直接赋值给 id 。如果不存在那么新建一个赋值给 id 。注意新建的时候使用的是一个时间戳字符串，这样就可以有效的避免覆盖用户的私有属性。
    var id = node[exp] || (node[exp] = ++$.uuid),
    // 从 node 节点拿到之前缓存的数据，如果没有缓存，那么调用 attributeData 方法来缓存。
      store = data[id] || (data[id] = attributeData(node))
    // 设置需要缓存的值
    if (name !== undefined) store[camelize(name)] = value
    return store
  }

  // 用来获取给定的 node 节点的所有 data-* 自定义属性值 ，并储存到 store 对象中
  function attributeData(node) {
    var store = {}
    // 先拿到该 node 节点的 attributes 数组，如果不存在，赋值为空数组，然后遍历该数组
    $.each(node.attributes || emptyArray, function(i, attr){
      // 如果属性名是 data- 开头，那就说明是我们需要的自定义属性，将其除去开头的 data- 标识，转化为驼峰命名并存入到 store 中
      if (attr.name.indexOf('data-') == 0)
        store[camelize(attr.name.replace('data-', ''))] =
          $.zepto.deserializeValue(attr.value)
    })
    return store
  }

  // 用于设置或者获取 data-* 数据
  $.fn.data = function(name, value) {
  // 判断 value 是否存在，如果存在，那么说明是设置，如果不存在，那么说明是获取
    return value === undefined ?
      // 判断是不是一个"正经"的对象，如果是的话，遍历对象属性，将其使用 setData设置
      $.isPlainObject(name) ?
        this.each(function(i, node){
          $.each(name, function(key, value){ setData(node, key, value) })
        }) :
        // 不是一个"正经"对象的话，那么查看目前操作的 zepto 对象是否存在节点，如果存在节点返回第一个节点的对应属性，如果不存在，返回undefined
        (0 in this ? getData(this[0], name) : undefined) :
      // 这就是存在 value 的情况，遍历使用 setData 赋值
      this.each(function(){ setData(this, name, value) })
  }

  // 用于设置或者获取指定节点的 data-* 数据
  $.data = function(elem, name, value) {
    return $(elem).data(name, value)
  }

  // 判断是否存在 data-* 自定义属性
  $.hasData = function(elem) {
    var id = elem[exp], store = id && data[id]
    return store ? !$.isEmptyObject(store) : false
  }

  // 删除对应的 names 属性
  $.fn.removeData = function(names) {
    // 先判断是不是字符串，如果是的话，就以空为分割，分割成数组，这样就可以删除类似于 "hello world pika"，这样设置的 "hello", "world", "pika" 三个属性了，也方面下面使用 each 方法遍历
    if (typeof names == 'string') names = names.split(/\s+/)
    return this.each(function(){
      var id = this[exp], store = id && data[id]
      if (store) $.each(names || store, function(key){
        delete store[names ? camelize(this) : key]
      })
    })
  }
  
  // 改写 $.fn 上面的 remove , empty 方法
  ;['remove', 'empty'].forEach(function(methodName){
    var origFn = $.fn[methodName]
    $.fn[methodName] = function() {
      var elements = this.find('*')
      if (methodName === 'remove') elements = elements.add(this)
      elements.removeData()
      return origFn.call(this)
    }
  })
})(Zepto)

```