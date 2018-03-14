'use strict'

var utils = require('./../utils')

module.exports = (
  // 先检查执行环境
  utils.isStandardBrowserEnv()

  // 如果是标准浏览器环境，那么返回一个操作 cookie 的函数
    ? (function standardBrowserEnv () {
      return {
        // 写操作
        write: function write (name, value, expires, path, domain, secure) {
          var cookie = []
          // 先将 name, value 写入，这两项是必须的，另外 value 使用 encodeURIComponent 转义一下
          cookie.push(name + '=' + encodeURIComponent(value))

          // 如果传入了 expires 那么表示设置了超时时间，将其转换成 GMT string 存入 cookie 临时数组中
          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString())
          }

          // 如果传入了控制域，那么将其存入 cookie 临时数组中
          if (utils.isString(path)) {
            cookie.push('path=' + path)
          }

          // 如果设置了 domain 域，那么将其存入 cookie 临时数组中
          if (utils.isString(domain)) {
            cookie.push('domain=' + domain)
          }

          // 如果设置了只能使用 HTTPS 来传递此条 cookie 那么将其存入 cookie 临时数组中
          if (secure === true) {
            cookie.push('secure')
          }

          // 把刚刚写入的内容存在浏览器的 cookie 中，个人感觉这样写不好，应该写成：
          // document.cookie += cookie.join(';')
          document.cookie = cookie.join('; ')
        },

        // 读取指定 cookie 的内容
        read: function read (name) {
          // 使用正则表达式来匹配内容，如果匹配到了则返回匹配到的内容，当然要转义一下，如果没有找到就返回 null
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
          return (match ? decodeURIComponent(match[3]) : null)
        },

        // 本质上就是写入 cookie ，只不过把有效时间调成之前的时间，使 cookie 失效
        // 然后过一段时间浏览器就会自动清理此条 cookie
        remove: function remove (name) {
          this.write(name, '', Date.now() - 86400000)
        }
      }
    })()

    // 非标准浏览器环境，那就不支持了，反正支持了也没啥用，但是写一个，为了统一
    : (function nonStandardBrowserEnv () {
      return {
        write: function write () {},
        read: function read () { return null },
        remove: function remove () {}
      }
    })()
)
