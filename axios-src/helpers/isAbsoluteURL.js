'use strict'

// 是否是一个纯粹的 URL ，主要就是检查 URL 链接是否带协议，或者协议自适应 //
module.exports = function isAbsoluteURL (url) {
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url)
}
