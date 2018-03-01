/**
 * mapState 方法，方便快速取值的，竟然大家都看 vuex 源码了，它肯定很熟悉了吧
 */
export const mapState = normalizeNamespace((namespace, states) => {
  const res = {}
  // 把要取的内容序列化成指定的格式，然后遍历执行回调，并赋值给 res[key]
  normalizeMap(states).forEach(({ key, val }) => {
    res[key] = function mappedState () {
      let state = this.$store.state
      let getters = this.$store.getters
      // 如果是存在命名空间，那就表示使用了模块，在模块内找内容，否则在全局 $store 中查找内容
      if (namespace) {
        // 根据模块名称在顶层的 $store 中找到模块的内容
        // 如果不存在就直接返回
        // 如果存在取出模块的 state, getters 存储在变量 state, getters 中
        const module = getModuleByNamespace(this.$store, 'mapState', namespace)
        if (!module) {
          return
        }
        state = module.context.state
        getters = module.context.getters
      }
      // 如果要取的是 getters 中的内容，那就表示它调用的是一个函数，直接函数并返回结果，否则就是取 state 中的内容，直接返回内容
      return typeof val === 'function'
        ? val.call(this, state, getters)
        : state[val]
    }
    // 标记在 devtools 中的 vuex key,将其 flag 调为 true
    res[key].vuex = true
  })
  // 返回 res 的内容，因为 res 是引用类型，虽然声明的时候使用了 const 但是还是可以为其添加内容的，毕竟我们没有改它的对象地址
  return res
})

/**
 * mapMutations 方法
 */
export const mapMutations = normalizeNamespace((namespace, mutations) => {
  const res = {}
  // 序列化好参数，将其转换为指定格式然后 forEach 遍历
  normalizeMap(mutations).forEach(({ key, val }) => {
    res[key] = function mappedMutation (...args) {
      // 从根目录的 $store 上拿到 commit 存储到 commit 上
      let commit = this.$store.commit
      // 处理命名空间的情况，如果存在命名空间，则调整参数
      if (namespace) {
        const module = getModuleByNamespace(this.$store, 'mapMutations', namespace)
        if (!module) {
          return
        }
        commit = module.context.commit
      }
      // 如果传入的 val 是一个函数，那么执行这个函数，并返回结果
      // 否则就执行 commit
      // 这里使用的是 apply 是因为 apply 最合适处理传入不确定数量的参数的情况
      return typeof val === 'function'
        ? val.apply(this, [commit].concat(args))
        : commit.apply(this.$store, [val].concat(args))
    }
  })
  return res
})

/**
 * mapGetters 方法
 */
export const mapGetters = normalizeNamespace((namespace, getters) => {
  const res = {}
  // 把所有传入的参数序列化，然后调用 forEach 进行处理
  normalizeMap(getters).forEach(({ key, val }) => {
    // 如果有命名空间，那么会自动加上，如果没有命名空间，会加上 '' ，这样其实没有改变
    val = namespace + val
    res[key] = function mappedGetter () {
      // 如果命名空间存在，但是没有找到，这个时候就直接返回一个 undefined
      if (namespace && !getModuleByNamespace(this.$store, 'mapGetters', namespace)) {
        return
      }
      // 如果现在不是线上环境且 val 并不在 $store 的列表中，那么就报错
      if (process.env.NODE_ENV !== 'production' && !(val in this.$store.getters)) {
        console.error(`[vuex] unknown getter: ${val}`)
        return
      }
      // 错误情况全部排除了，这个时候我们就可以返回指定的 getters 的计算内容了
      return this.$store.getters[val]
    }
    // 标记在 devtools 中的 vuex key,将其 flag 调为 true
    res[key].vuex = true
  })
  return res
})

/**
 * mapActions 方法，这里就不做解释了，它和 mapMutations 很像，区别是执行的是 commit, dispatch 而已
 * 和 mapMutations 的主要区别是它可以执行异步方法
 * 其实 mapMutations 也可以执行异步方法，但是它为了更好的实现编程思想造成的
 */
export const mapActions = normalizeNamespace((namespace, actions) => {
  const res = {}
  normalizeMap(actions).forEach(({ key, val }) => {
    res[key] = function mappedAction (...args) {
      let dispatch = this.$store.dispatch
      if (namespace) {
        const module = getModuleByNamespace(this.$store, 'mapActions', namespace)
        if (!module) {
          return
        }
        dispatch = module.context.dispatch
      }
      return typeof val === 'function'
        ? val.apply(this, [dispatch].concat(args))
        : dispatch.apply(this.$store, [val].concat(args))
    }
  })
  return res
})

/**
 * createNamespacedHelpers 创建基于命名空间的组件绑定辅助函数
 * 用于快速为命名空间生成 mapState, mapGetters, mapMutations, mapActions 等属性
 */
export const createNamespacedHelpers = (namespace) => ({
  mapState: mapState.bind(null, namespace),
  mapGetters: mapGetters.bind(null, namespace),
  mapMutations: mapMutations.bind(null, namespace),
  mapActions: mapActions.bind(null, namespace)
})

/**
 * 把内容序列化成一个 Map 的形式，返回一个数组，方便调用，传入参数只能是数组或者对象
 * 序列化成 { key: keyName, val: value} 的形式在数组中，这样使用 filter, forEach, every, any 等方法的时候就比较方便了
 */
function normalizeMap (map) {
  // 这里是通过检查是否是数组来判断能不是能进行 map 操作来直接转换
  // 如果是数组，那就就用 map 方法进行直接转换
  // 如果不是数组，那么就是对象，就将对象的属性名使用 Object.keys() 方法来将其属性名整合成一个数组，再利用数组的 map 方法转换
  return Array.isArray(map)
    ? map.map(key => ({ key, val: key }))
    : Object.keys(map).map(key => ({ key, val: map[key] }))
}

/**
 * 这里一个函数式编程的经典实例，首先传入回调，并返回一个函数
 * 返回的函数我们可以存在一个新的变量中，然后执行，以后就只用传入 namespace 与 map 就可以了， fn 已经常驻内存中
 */
function normalizeNamespace (fn) {
  return (namespace, map) => {
    // 这里是调节参数，是用于处理没有传入 namespace 的情况的
    if (typeof namespace !== 'string') {
      map = namespace
      namespace = ''
    } else if (namespace.charAt(namespace.length - 1) !== '/') {
    // 如果 namespace 最后一位不是 '/' 那么为了以后的处理方便，添加上 '/'
      namespace += '/'
    }
    // 返回执行回调的结果，注：这里调用 normalizeNamespace 返回的值才返回的，此时 fn 已经常驻在内存中了
    return fn(namespace, map)
  }
}

/**
 * 拿到模块名拿到对应的模块
 */
function getModuleByNamespace (store, helper, namespace) {
  // 从 store 的 map 中找到对应的模块存储在 module 中，如果有内容就是一个对象，如果没有内容，那么则是 undefined
  const module = store._modulesNamespaceMap[namespace]
  // 生产环境下不报错，如果是开发环境，且 module 不存在的话，那还是会报错的
  if (process.env.NODE_ENV !== 'production' && !module) {
    console.error(`[vuex] module namespace not found in ${helper}(): ${namespace}`)
  }
  // 返回找到的结果
  return module
}
