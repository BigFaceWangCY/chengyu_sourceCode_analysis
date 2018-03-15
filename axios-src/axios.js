'use strict'

var utils = require('./utils')
var bind = require('./helpers/bind')
var Axios = require('./core/Axios')
var defaults = require('./defaults')

/**
 * 创建一个 axios 实例
 */
function createInstance (defaultConfig) {
  // 创建一个实例，并载入默认配置
  var context = new Axios(defaultConfig)
  // 绑定上下文环境
  var instance = bind(Axios.prototype.request, context)

  // 拓展，把写好的方法扩展到实例上面
  utils.extend(instance, Axios.prototype, context)

  utils.extend(instance, context)

  // 返回创建的实例，从这里可以看出，这是一个工厂函数，用于创建 Axios 实例
  return instance
}

// 创建一个实例
var axios = createInstance(defaults)

// 存起来，防止出事
axios.Axios = Axios

// 导出一个创建对象，用于传入自己的参数，和默认参数合并再创建
axios.create = function create (instanceConfig) {
  return createInstance(utils.merge(defaults, instanceConfig))
}

// 引入各种取消操作
axios.Cancel = require('./cancel/Cancel')
axios.CancelToken = require('./cancel/CancelToken')
axios.isCancel = require('./cancel/isCancel')

// 把 axios 结合 Promise 来进行操作，这样就可以进行 Promise 操作，从这里可以看出来， axios 主要是根据 Promise 来写的
axios.all = function all (promises) {
  return Promise.all(promises)
}
axios.spread = require('./helpers/spread')

module.exports = axios

module.exports.default = axios
