
```javascript
;(function($){
  var cache = [], timeout

  $.fn.remove = function(){
    return this.each(function(){
      if(this.parentNode){
        if(this.tagName === 'IMG'){
          cache.push(this)
          this.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
          if (timeout) clearTimeout(timeout)
          timeout = setTimeout(function(){ cache = [] }, 60000)
        }
        this.parentNode.removeChild(this)
      }
    })
  }
})(Zepto)
```

### 分析

从源码上看，我们可以看出来，此模块就是找寻 IMG 元素，将其内容放入 cache 缓冲数组中。然后将内容赋值成一个 1*1 的图片。并过 6 秒后清空 cache 数组中的内容。然后再移除该元素。

看到这里不由的有一点不解，为什么要执行这样的操作，直接除去图片元素不就可以了么。通过查阅资料，我找到了以下内容： 

> Because of the memory available on an iPad or iPhone, Mobile Safari has much stricter resource limits than most desktop browsers.  
> One of these limits is the total amount of image data that can be loaded on a single HTML page. When Mobile Safari has loaded between 8 to 10 MB of image data it will simply stop displaying any more images. It might even crash.  
>This limit doesn’t affect most websites since it’s generally a good idea to keep web pages reasonably small.
> However, you can get in trouble with big image galleries and slideshows or with web applications that load new data asynchronously, for example to enable smooth ‘native’ transitions between different sections (yes, you can do those Flipboard transitions with Mobile Safari).

也就是为了处理 iphone 与 Ipad 下大图片不能正常处理，且删除之后其实内容还是存在于内存中，没有真正的删除而进行的操作。

[参考文章：https://www.fngtps.com/2010/mobile-safari-image-resource-limit-workaround/](https://www.fngtps.com/2010/mobile-safari-image-resource-limit-workaround/)