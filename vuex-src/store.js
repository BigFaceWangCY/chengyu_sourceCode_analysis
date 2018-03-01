import applyMixin from './mixin'
import devtoolPlugin from './plugins/devtool'
import ModuleCollection from './module/module-collection'
import { forEachValue, isObject, isPromise, assert } from './util'

let Vue

export class Store {
  // 构造函数，默认传入 {}
  constructor (options = {}) {
    // 如果当前环境是浏览器环境，且没有安装 vuex ，那么就会自动安装
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue)
    }

    // 如果是开发环境那么进行断言检测，以保证程序的稳定
    if (process.env.NODE_ENV !== 'production') {
      assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`)
      assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
      assert(this instanceof Store, `Store must be called with the new operator.`)
    }

    const {
      plugins = [],
      strict = false
    } = options

    // 初始化一些参数
    this._committing = false                             // 是否在进行提交状态标识
    this._actions = Object.create(null)                  // acitons 操作对象
    this._actionSubscribers = []                         // action 订阅列表
    this._mutations = Object.create(null)                // mutations操作对象
    this._wrappedGetters = Object.create(null)           // 封装后的 getters 集合对象
    this._modules = new ModuleCollection(options)        // vuex 支持 store 分模块传入，存储分析后的 modules
    this._modulesNamespaceMap = Object.create(null)      // 模块命名空间 map
    this._subscribers = []                               // 订阅函数集合
    this._watcherVM = new Vue()                          // Vue 组件用于 watch 监视变化

    // 替换 this 中的 dispatch, commit 方法，将 this 指向 store
    const store = this
    const { dispatch, commit } = this
    // 其实也可以这么写 
    // this.dispatch = dispatch.bind(store)
    // this.commit = commit.bind(store)
    this.dispatch = function boundDispatch (type, payload) {
      return dispatch.call(store, type, payload)
    }
    this.commit = function boundCommit (type, payload, options) {
      return commit.call(store, type, payload, options)
    }

    // 是否使用严格模式
    this.strict = strict

    // 数据树
    const state = this._modules.root.state

    // 加载安装模块
    installModule(this, state, [], this._modules.root)

    // 重置虚拟 store
    resetStoreVM(this, state)

    // 如果使用了 plugins 那么挨个载入它们
    plugins.forEach(plugin => plugin(this))

    // 如果当前环境安装了开发者工具，那么使用开发者工具
    if (Vue.config.devtools) {
      devtoolPlugin(this)
    }
  }

  // 获取 state, 是从虚拟 state 上获取的，为了区别，所以使用的是 $$state
  get state () {
    return this._vm._data.$$state
  }

  set state (v) {
    // 如果是开发环境那么进行断言检测，以保证程序的稳定
    if (process.env.NODE_ENV !== 'production') {
      assert(false, `Use store.replaceState() to explicit replace store state.`)
    }
  }

  commit (_type, _payload, _options) {
    // 先统一一下参数，方便后续处理
    const {
      type,
      payload,
      options
    } = unifyObjectStyle(_type, _payload, _options)

    const mutation = { type, payload }
    const entry = this._mutations[type]
    // 如果在 mutations 列表中不存在当前指定的方法，那么表示传入方法错误，直接返回，开发环境会报错
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown mutation type: ${type}`)
      }
      return
    }
    // 专用修改 state 的方法
    this._withCommit(() => {
      entry.forEach(function commitIterator (handler) {
        handler(payload)
      })
    })
    // 遍历执行订阅者函数，并传入当前设置以执行指定的订阅者
    this._subscribers.forEach(sub => sub(mutation, this.state))

    // 如果是开发环境，那么当 options 与 options.silent 都存在的情况下，进行报警
    if (
      process.env.NODE_ENV !== 'production' &&
      options && options.silent
    ) {
      console.warn(
        `[vuex] mutation type: ${type}. Silent option has been removed. ` +
        'Use the filter functionality in the vue-devtools'
      )
    }
  }

  dispatch (_type, _payload) {
    // 先统一一下参数，方便后续处理
    const {
      type,
      payload
    } = unifyObjectStyle(_type, _payload)

    const action = { type, payload }
    const entry = this._actions[type]
    // 如果在 action 列表中不存在当前指定的方法，那么表示传入方法错误，直接返回，开发环境会报错
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown action type: ${type}`)
      }
      return
    }
    // 遍历执行订阅者函数，并传入当前设置以执行指定的订阅者
    this._actionSubscribers.forEach(sub => sub(action, this.state))

    // 如果有多个 entry 那么，使用 Promise.all() 来执行，并返回结果
    // 如果只有一个 entry 那么稳了，就执行第一个就可以了
    return entry.length > 1
      ? Promise.all(entry.map(handler => handler(payload)))
      : entry[0](payload)
  }

  // 将函数加入到订阅列表中
  subscribe (fn) {
    return genericSubscribe(fn, this._subscribers)
  }

  // action 的订阅
  subscribeAction (fn) {
    return genericSubscribe(fn, this._actionSubscribers)
  }

  // 监视数据
  watch (getter, cb, options) {
    // 如果是开发环境那么断言检测一下，以保证程序稳定
    if (process.env.NODE_ENV !== 'production') {
      assert(typeof getter === 'function', `store.watch only accepts a function.`)
    }
    // 使用 $watch 来监视 getter 的数据状态
    return this._watcherVM.$watch(() => getter(this.state, this.getters), cb, options)
  }

  // 修改 state
  replaceState (state) {
    // 唯一合法修改 state 的方式
    this._withCommit(() => {
      this._vm._data.$$state = state
    })
  }

  // 注册模块
  registerModule (path, rawModule, options = {}) {
    // 进行参数处理
    if (typeof path === 'string') path = [path]
    // 如果是开发环境那么断言检测一下，以保证程序稳定
    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
      assert(path.length > 0, 'cannot register the root module by using registerModule.')
    }

    // 注册模块
    this._modules.register(path, rawModule)
    // 把模块安装到 state 上面
    installModule(this, this.state, path, this._modules.get(path), options.preserveState)
    // 重置虚拟 store
    resetStoreVM(this, this.state)
  }

  // 取消模块注册
  unregisterModule (path) {
    // 处理一下参数
    if (typeof path === 'string') path = [path]
    // 如果是开发环境那么断言检测一下，以保证程序稳定
    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    // 取消模块注册
    this._modules.unregister(path)
    // 拿到模块，并将其从其父模块上删除
    this._withCommit(() => {
      const parentState = getNestedState(this.state, path.slice(0, -1))
      Vue.delete(parentState, path[path.length - 1])
    })
    // 重置模块，也就是重新安装
    resetStore(this)
  }

  // 热更新
  hotUpdate (newOptions) {
    // 升级模块，然后重新载入模块
    this._modules.update(newOptions)
    resetStore(this, true)
  }
  
  // 在 commit 的时候执行，主要是修改 committing 状态，执行回调，修改内容，再将 committing 状态改回去
  _withCommit (fn) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = committing
  }
}

// 通用订阅，返回一个函数，这个函数是用于从 subs 中删除插入的 fn 的
function genericSubscribe (fn, subs) {
  // 如果 fn 不存在于 subs 列表中，那么添加进 subs 中，否则不操作
  if (subs.indexOf(fn) < 0) {
    subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}

// 重置 store
function resetStore (store, hot) {
  // 先将几个重要的对象清空
  store._actions = Object.create(null)
  store._mutations = Object.create(null)
  store._wrappedGetters = Object.create(null)
  store._modulesNamespaceMap = Object.create(null)
  const state = store.state
  // 调用 installModule 重新安装模块
  installModule(store, state, [], store._modules.root, true)
  // 调用 resetStoreVM 重围 VM
  resetStoreVM(store, state, hot)
}

/**
 * resetStoreVM
 * @param  {[type]} store     store 表示当前 Store 实例
 * @param  {[type]} state     module 表示当前安装的模块
 * @param  {[type]} hot       hot 当动态改变 modules 或者热更新的时候为 true
 */
function resetStoreVM (store, state, hot) {
  // 先备份旧有的 vm ,以便以后使用
  const oldVm = store._vm

  store.getters = {}
  const wrappedGetters = store._wrappedGetters
  const computed = {}
  // 通过Object.defineProperty为每一个getter方法设置get方法
  forEachValue(wrappedGetters, (fn, key) => {
    computed[key] = () => fn(store)
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true
    })
  })

  // 先将 Vue.config.silent 存储在临时常量中，这样 new Vue 实例的时候不会报错
  const silent = Vue.config.silent
  Vue.config.silent = true
  // 实例化一个新的 Vue 对象
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })
  // 改成原先的状态
  Vue.config.silent = silent

  // 如果使用的是严格模式，那么调用 enableStrictMode 来对 store 进行处理
  if (store.strict) {
    enableStrictMode(store)
  }

  // 如果 oldVm 存在，那么先判断是否传入了 hot 如果传入了，就先将其 $$state 设为 null . 然后在调用 nextTick 来删除 oldVm 实例
  if (oldVm) {
    if (hot) {
      store._withCommit(() => {
        oldVm._data.$$state = null
      })
    }
    Vue.nextTick(() => oldVm.$destroy())
  }
}

/**
 * installModule
 * @param  {[type]} store     store 表示当前 Store 实例
 * @param  {[type]} rootState rootState 表示根 state
 * @param  {[type]} path      path 表示当前嵌套模块的路径数组
 * @param  {[type]} module    module 表示当前安装的模块
 * @param  {[type]} hot       hot 当动态改变 modules 或者热更新的时候为 true
 */
function installModule (store, rootState, path, module, hot) {
  const isRoot = !path.length
  // 获取模块的命名
  const namespace = store._modules.getNamespace(path)

  // 把当前模块名加入的 store 的 moduleNamespaceMap 中
  if (module.namespaced) {
    store._modulesNamespaceMap[namespace] = module
  }

  // 如果当前不是子模块也不是热更新状态，那么就是新增子模块，这个时候要取到父模块
  // 然后插入到父模块的子模块列表中
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1))
    const moduleName = path[path.length - 1]
    store._withCommit(() => {
      Vue.set(parentState, moduleName, module.state)
    })
  }

  // 拿到当前的上下文环境
  const local = module.context = makeLocalContext(store, namespace, path)

  // 使用模块的方法挨个为 mutation, action, getters, child 注册
  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key
    registerMutation(store, namespacedType, mutation, local)
  })

  module.forEachAction((action, key) => {
    const type = action.root ? key : namespace + key
    const handler = action.handler || action
    registerAction(store, type, handler, local)
  })

  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key
    registerGetter(store, namespacedType, getter, local)
  })

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}

/**
 *  创建本地上下文环境
 */
function makeLocalContext (store, namespace, path) {
  // 是否使用了命名空间
  const noNamespace = namespace === ''

  const local = {
    dispatch: noNamespace ? store.dispatch : (_type, _payload, _options) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) {
        type = namespace + type
        // 如果是开发环境那且 store._actions[type] 不存在，那么报错
        if (process.env.NODE_ENV !== 'production' && !store._actions[type]) {
          console.error(`[vuex] unknown local action type: ${args.type}, global type: ${type}`)
          return
        }
      }

      return store.dispatch(type, payload)
    },

    commit: noNamespace ? store.commit : (_type, _payload, _options) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) {
        type = namespace + type
        // 如果是开发环境那且 store._mutations[type] 不存在，那么报错
        if (process.env.NODE_ENV !== 'production' && !store._mutations[type]) {
          console.error(`[vuex] unknown local mutation type: ${args.type}, global type: ${type}`)
          return
        }
      }

      store.commit(type, payload, options)
    }
  }

  // getters and state object must be gotten lazily
  // because they will be changed by vm update
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters
        : () => makeLocalGetters(store, namespace)
    },
    state: {
      get: () => getNestedState(store.state, path)
    }
  })

  return local
}

function makeLocalGetters (store, namespace) {
  const gettersProxy = {}

  const splitPos = namespace.length
  Object.keys(store.getters).forEach(type => {
    if (type.slice(0, splitPos) !== namespace) return
    const localType = type.slice(splitPos)
    Object.defineProperty(gettersProxy, localType, {
      get: () => store.getters[type],
      enumerable: true
    })
  })

  return gettersProxy
}

/**
 *  registerMutation
 *  store为当前 Store 实例
 *  type为 mutation 的 key
 *  handler 为 mutation 执行的回调函数
 *  local 为当前模块的路径
 */
function registerMutation (store, type, handler, local) {
  // 首先通过 type 拿到对应的 mutations 数组，如果没有则使用空数组
  const entry = store._mutations[type] || (store._mutations[type] = [])
  // 把 wrappedMutationHandler push 到这个数组中
  // 这个函数接收一个参数 payload，这个就是我们在定义 mutation 的时候接收的额外参数
  // 这个函数执行的时候会调用 mutation 的回调函数
  entry.push(function wrappedMutationHandler (payload) {
    handler.call(store, local.state, payload)
  })
}

/**
 *  registerAction
 *  store为当前 Store 实例
 *  type为 action 的 key
 *  handler 为 action 执行的回调函数
 *  local 为当前模块的路径
 */
function registerAction (store, type, handler, local) {
  // 首先通过 type 拿到对应的 actions 数组，如果没有则使用空数组
  const entry = store._actions[type] || (store._actions[type] = [])
  // 把 wrappedMutationHandler push 到这个数组中
  // 这个函数接收一个参数 payload，这个就是我们在定义 action 的时候接收的额外参数
  // 这个函数执行的时候会调用 action 的回调函数 cb
  entry.push(function wrappedActionHandler (payload, cb) {
    // 执行 handler 并将结果存储在 res 中
    let res = handler.call(store, {
      dispatch: local.dispatch,
      commit: local.commit,
      getters: local.getters,
      state: local.state,
      rootGetters: store.getters,
      rootState: store.state
    }, payload, cb)
    // 如果 res 是一个 Promise 对象，那么调用 resolve 方法 
    if (!isPromise(res)) {
      res = Promise.resolve(res)
    }
    // 如果使用了开发者工具的话，那么出错的时候，触发开发者工具的 vuex:error 事件
    // 没有使用的话直接返回 res
    if (store._devtoolHook) {
      return res.catch(err => {
        store._devtoolHook.emit('vuex:error', err)
        throw err
      })
    } else {
      return res
    }
  })
}

/**
 *  registerGetter
 *  store为当前 Store 实例
 *  type为 getter 的 key
 *  rawGetter 为 getter 执行的回调函数
 *  local 为当前模块的路径
 */
function registerGetter (store, type, rawGetter, local) {
  if (store._wrappedGetters[type]) {
    // 如果是开发环境，那么报错
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] duplicate getter key: ${type}`)
    }
    return
  }
  store._wrappedGetters[type] = function wrappedGetter (store) {
    return rawGetter(
      local.state,
      local.getters,
      store.state,
      store.getters
    )
  }
}

// 监测 store._vm.state 的变化
function enableStrictMode (store) {
  store._vm.$watch(function () { return this._data.$$state }, () => {
    // 如果是开发环境，那么进行断言检测，以保证程序稳定
    if (process.env.NODE_ENV !== 'production') {
      assert(store._committing, `Do not mutate vuex store state outside mutation handlers.`)
    }
  }, { deep: true, sync: true })
}

/*
 * getNestedState 根据 path 查找 state 上的嵌套 state
 */
function getNestedState (state, path) {
  return path.length
    ? path.reduce((state, key) => state[key], state)
    : state
}

/**
 *  统一对象风格
 */
function unifyObjectStyle (type, payload, options) {
  if (isObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }
  // 如果是开发环境，那么进行断言检测，以保证程序稳定
  if (process.env.NODE_ENV !== 'production') {
    assert(typeof type === 'string', `Expects string as the type, but found ${typeof type}.`)
  }

  return { type, payload, options }
}

export function install (_Vue) {
  // 如果 Vue.use(vuex) 已经调用过了，那么就不执行操作，且在开发环境下会报错
  if (Vue && _Vue === Vue) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[vuex] already installed. Vue.use(Vuex) should be called only once.'
      )
    }
    return
  }
  Vue = _Vue
  // 调用 applyMixin 方法来初始化 vuex
  applyMixin(Vue)
}
