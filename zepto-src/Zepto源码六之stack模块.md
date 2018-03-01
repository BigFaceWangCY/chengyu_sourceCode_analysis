```javascript
;(function($){
  $.fn.end = function(){
    return this.prevObject || $()
  }

  $.fn.andSelf = function(){
    return this.add(this.prevObject || $())
  }

  'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function(property){
    var fn = $.fn[property]
    $.fn[property] = function(){
      var ret = fn.apply(this, arguments)
      ret.prevObject = this
      return ret
    }
  })
})(Zepto)
```

从源码里我们可以看出来， stack 模块主要就是改写了 filter, add, not, eq, first, last, find, closest, parents, parent, children, siblings 等方法。因为我们之前看过这些方法的源码，我们可以知道，这些方法都是返回了一个新的 zepto 对象。那么之前操作的对象则会丢弃，此模块就是为了应对这种操作而设计的，把之前操作的 zepto 对象放入了 prevObject 对象中。形式了一个类似于原型的模型，我们可以一层一层的查询，找到每一次操作的对象。

其中 还添加了两个方法 end, andSelf 方法。简单的分析其源码就是返回上一个操作的 zepto 对象与将之前操作的 zepto 对象插入到现在操作的对象之中。 