import { forEachValue } from '../util'

// Module 类
export default class Module {
  // 构造函数
  constructor (rawModule, runtime) {
    this.runtime = runtime
    this._children = Object.create(null)
    this._rawModule = rawModule
    const rawState = rawModule.state

    // 如果 rowSTate 是一个 function 那么就执行它，否则就取它的值。如果它没有值的话，为了程序的稳定，给它一个默认值 {}
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }

  // 判断是否是命名空间，如果是则返回 true ,如果不是则返回  false, 这里用到了隐匿类型转换
  get namespaced () {
    return !!this._rawModule.namespaced
  }

  // 添加子模块
  addChild (key, module) {
    this._children[key] = module
  }

  // 移除子模块
  removeChild (key) {
    delete this._children[key]
  }

  // 获取子模块
  getChild (key) {
    return this._children[key]
  }

  // 更新模块
  update (rawModule) {
    // 修改实例的 namespaced
    this._rawModule.namespaced = rawModule.namespaced
    // 如果更新后的 module 存在 actions, mutations, getters 那么就更新一下内容
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters
    }
  }

  // 给每个子模块执行指定回调，这里使用了 util 中的 forEachValue 方法来实现
  forEachChild (fn) {
    forEachValue(this._children, fn)
  }

  // 对每一个 getter 执行指定回调
  forEachGetter (fn) {
    // 如果存在就执行指定回调，不存在就不费什么事了，直接返回
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }

  // 对每一个 action 执行指定回调
  forEachAction (fn) {
    // 如果存在就执行指定回调，不存在就不费什么事了，直接返回
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }

  // 对每一个 mutation 执行指定回调
  forEachMutation (fn) {
    // 如果存在就执行指定回调，不存在就不费什么事了，直接返回
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }
}
