export default function (Vue) {
  // 取大版本号 一般 Vue 的版本号者是 X.X.X 形式的，这样就可以取到第一位的大版本号
  const version = Number(Vue.version.split('.')[0])

  // 如果大版本号大于等于 2 ，那就表示 Vue 拥有了 mixin 方法
  // 这样我们就可以直接调用它，刚 vuexInit 添加到 beforeCreate 钩子函数中
  if (version >= 2) {
    Vue.mixin({ beforeCreate: vuexInit })
  } else {
    // 如果使用的是旧版本的 Vue 那么没有 mixin ，要使用 _init 方法来调用
    // 先把 Vue.prototype._init 存储在常量中，之所以使用常量，就是为了防止不小心修改
    // 然后扩充 Vue.prototype._init 方法，在 options 中添加属性内容 vuexInit
    const _init = Vue.prototype._init
    Vue.prototype._init = function (options = {}) {
      // 如果 options.init 之前有参数，那就就将参数拼接起来来
      // 如果没有参数，那么就将其当今参数传入
      options.init = options.init
        ? [vuexInit].concat(options.init)
        : vuexInit
      // 然后执行原来的 Vue.prototype._init 方法，从可以我们可以看出
      // 这次的扩充函数其实主要就是添加了参数设置，在执行步骤上没有任何的改变
      _init.call(this, options)
    }
  }

  /**
   * 内部函数，就是使 store 在 Vue 上 mixin 的方法
   */
  function vuexInit () {
    // 先保存系统参数，存为常量，防止误修改
    const options = this.$options
    // 如果系统参数中存在 store 那就检查其是否为 store 对象的实例
    // 如果是的话那就将其挂载在 this.$store 上
    // 如果不是的话，那么就实例化一个 store 对象并挂载在 this.$store 上
    if (options.store) {
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store
    } else if (options.parent && options.parent.$store) {
      // 如果当前参数没有没有 store 对象，但是有 parent 对象，那就说明它依赖于其父组件
      // 那么将它的父组件的 store 挂载在 this.$store 上
      this.$store = options.parent.$store
    }
  }
}
