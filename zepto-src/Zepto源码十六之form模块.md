```javascript

;(function($){
  $.fn.serializeArray = function() {
    var name, type, result = [],
      add = function(value) {
      // 内部方法 add ,如果传入的参数存在 forEach 方法，那么通过 forEach 调用 add 方法
      // 如果不存在 forEach 方法，那么将其存在固定属性名的对象中，并刚对象插入到 result 数组中
        if (value.forEach) return value.forEach(add)
        result.push({ name: name, value: value })
      }
    // 只处理一个表单
    if (this[0]) $.each(this[0].elements, function(_, field){
    // this[0].elements 是用来获取表单里所有的表单元素的
      type = field.type, name = field.name
      // type 为表单类型，name 为表单元素的 name 属性值
      if (name && field.nodeName.toLowerCase() != 'fieldset' &&
        !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
        ((type != 'radio' && type != 'checkbox') || field.checked))
        // 筛选需要处理的表单元素，除掉一些功能性的表单元素，然后调用 add 添加到值中
          add($(field).val())
    })
    return result
  }
    
  // 序列化内容
  $.fn.serialize = function(){
    var result = []
    // 将 serializeArray 中的内容全部使用 encodeURIComponent 编码再用 = 把键值对连接起来，将字符串插入到 result 数组中
    this.serializeArray().forEach(function(elm){
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    // 将 result 中的内容用 & 连接起来，形成我们最常见的 url 参数内容，返回
    return result.join('&')
  }

  $.fn.submit = function(callback) {
    // 如果有传入回调，那么直接把回调绑定到 submit 上
    if (0 in arguments) this.bind('submit', callback)
    // 如果当前操作的 zepto 对象有内容，那么操作，否则直接返回
    else if (this.length) {
      // 手动绑定事件
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }

})(Zepto)


```