目录结构
```
    .
    ├── applyMiddleware.js         // 使用中间件模块，有了它就可以组合中间件一起使用
    ├── bindActionCreators.js
    ├── combineReducers.js
    ├── compose.js                 // 组成函数，用于把函数列表组合成一个嵌套执行的函数
    ├── createStore.js
    ├── index.js                   // 主函数，用于导出库的 API 函数
    └── utils                      // 工具文件夹，用于存放一些工具函数
        ├── actionTypes.js
        ├── isPlainObject.js
        └── warning.js
```


index.js
```
    import createStore from './createStore'
    import combineReducers from './combineReducers'
    import bindActionCreators from './bindActionCreators'
    import applyMiddleware from './applyMiddleware'
    import compose from './compose'
    import warning from './utils/warning'
    import __DO_NOT_USE__ActionTypes from './utils/actionTypes'
    
    /*
     * 这是一个空函数，用于检查当前代码是否被压缩，如果当前代码是压缩后的，
     * 且当前环境不为 production 那么那么警告用户
     */
    function isCrushed() {}
    
    if (
      process.env.NODE_ENV !== 'production' &&
      typeof isCrushed.name === 'string' &&
      isCrushed.name !== 'isCrushed'
    ) {
      warning(
        'You are currently using minified code outside of NODE_ENV === "production". ' +
          'This means that you are running a slower development build of Redux. ' +
          'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' +
          'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' +
          'to ensure you have the correct code for your production build.'
      )
    }
    
    /*
     * 导出包中所包含的方法
     */
    export {
      createStore,
      combineReducers,
      bindActionCreators,
      applyMiddleware,
      compose,
      __DO_NOT_USE__ActionTypes
    }
```   



工具函数

我们可以看出， redux 引用了三个工具函数文件，且这三个工具函数是不对外暴露的，那么这三个工具函数文件中分别有什么内容呢？现在我们来简单的解析一下



actionType.js
```
    /*
     * 一个私有的函数，用于生成一个随机字符串
     * 使用 toString(36) 就是利用 toString 的特性将其转化成 36 进制的， 为 0-9， a-z
     * 然后从 substring(7) 从第 7 位开始取内容，这样就可以取一个有效的，不含 0. 且位数足够长也足够短的字符串
     */
    const randomString = () =>
      Math.random()
        .toString(36)
        .substring(7)
        .split('')
        .join('.')
    
    /*
     * 生成一个 actionTypes 类型，就是一个单纯的对象
     */
    const ActionTypes = {
      INIT: `@@redux/INIT${randomString()}`,
      REPLACE: `@@redux/REPLACE${randomString()}`,
      PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
    }
    
    export default ActionTypes
```

isPlainObject.js
```
    /*
     * 用于检查传入的参数是不是一个简单的对象
     * 主要是用于检查这个对象是不是被继承
     */
    export default function isPlainObject(obj) {
      if (typeof obj !== 'object' || obj === null) return false
    
      let proto = obj
      while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto)
      }
    
      return Object.getPrototypeOf(obj) === proto
    }
```

warning.js
```
    /*
     * 导出一个函数用于输出警告信息
     */
    export default function warning(message) {
      // 如果 console 对象存在，且有 error 方法，那么就用它输出错误信息
      // 之所以这么写，是因为某些情况化，会重新定义 console 以防止别人调试代码
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error(message)
      }
        
      try {
        // 抛出异常
        throw new Error(message)
      } catch (e) {}
    }
```

compose.js
```
    /*
     * 组成函数，用于把函数列表组合成一个嵌套执行的函数
     */
    export default function compose(...funcs) {
      // 如果没有传入参数，那么直接返回一个无用函数
      // function (arg) { return arg }
      if (funcs.length === 0) {
        return arg => arg
      }
    
      // 如果只传入了一个参数，那么就返回第一个函数
      if (funcs.length === 1) {
        return funcs[0]
      }
    
      // 如果传入的函数列表有很多项目，那么就组全成一个嵌套执行的函数，并返回
      // 比如传入的的是  compose(a, b, c, d, e)
      // 那么返回 a(b(c(d(e(...args))))), 在函数外只有 let func = compose(a,b,c,d,e) func(12,13) 就可以调用执行了
      return funcs.reduce((a, b) => (...args) => a(b(...args)))
    }
```
applyMiddleware.js
```
    import compose from './compose'
    
    /*
     * 导出一个函数，用于使用中间件模块，有了它就可以组合中间件一起使用
     */
    export default function applyMiddleware(...middlewares) {
      // 创建一个 store
      return createStore => (...args) => {
        const store = createStore(...args)
        let dispatch = () => {
          throw new Error(
            `Dispatching while constructing your middleware is not allowed. ` +
              `Other middleware would not be applied to this dispatch.`
          )
        }
    
        // 给中间件提供了 store.getState 方法与 dispatch 方法，相当于提供了一个简易的 store
        const middlewareAPI = {
          getState: store.getState,
          dispatch: (...args) => dispatch(...args)
        }
        // 挨个遍历执行中间件
        const chain = middlewares.map(middleware => middleware(middlewareAPI))
        // 把多个中间件组合起来, 如果存在 fn1, fn2, fn3, fn4 那么 dispatch 就会变成
        // dispatch = fn1(fn2(fn3(fn4(store.dispatch))))
        dispatch = compose(...chain)(store.dispatch)
    
        // 返回中间件处理过的 store, dispatch
        return {
          ...store,
          dispatch
        }
      }
    }
```

bindActionCreators.js
```
    /*
     * 返回一个 dispatch 函数，这个函数是绑定了 this 对象的。 this 指向其初始传入的对象
     */
    function bindActionCreator(actionCreator, dispatch) {
      return function() {
        return dispatch(actionCreator.apply(this, arguments))
      }
    }
    
    /*
     * 导出一个工具函数，用于将 dispatch 绑定 this 上下文
     */
    export default function bindActionCreators(actionCreators, dispatch) {
      // 如果传入的是一个函数，一般情况就是用 function 模拟的 class, 这个时候直接返回绑定了上下文的函数
      if (typeof actionCreators === 'function') {
        return bindActionCreator(actionCreators, dispatch)
      }
     
      // 如果传入的不是一个对象，那么抛出异常
      // 私以为判断函数可以这么写 Object.prototype.toString.call(actionCreators) !== '[object Object]' 比较好
      if (typeof actionCreators !== 'object' || actionCreators === null) {
        throw new Error(
          `bindActionCreators expected an object or a function, instead received ${
            actionCreators === null ? 'null' : typeof actionCreators
          }. ` +
            `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
        )
      }
    
      // 如果传入的是一个对象，那么遍历对象的属性，对对象中每一个是 function 的属性进行绑定，然后返回
      const keys = Object.keys(actionCreators)
      const boundActionCreators = {}
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const actionCreator = actionCreators[key]
        if (typeof actionCreator === 'function') {
          boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
        }
      }
      return boundActionCreators
    }
```

combineReducers.js
```
    import ActionTypes from './utils/actionTypes'
    import warning from './utils/warning'
    import isPlainObject from './utils/isPlainObject'
    
    // 如果要从 state 中出数据，但是 state 中是不存在该属性的，那么组合一个对应的错误信息
    // 告诉用户在哪一个 action 中，取什么类型的数据错误
    function getUndefinedStateErrorMessage(key, action) {
      const actionType = action && action.type
      const actionDescription =
        (actionType && `action "${String(actionType)}"`) || 'an action'
    
      return (
        `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
        `To ignore an action, you must explicitly return the previous state. ` +
        `If you want this reducer to hold no value, you can return null instead of undefined.`
      )
    }
    
    // 获取意外状态下的错误形成信息
    function getUnexpectedStateShapeWarningMessage(
      inputState,
      reducers,
      action,
      unexpectedKeyCache
    ) {
      const reducerKeys = Object.keys(reducers)
      // 检查是 store 初始的时候形成的还是收到 action 时形成
      const argumentName =
        action && action.type === ActionTypes.INIT
          ? 'preloadedState argument passed to createStore'
          : 'previous state received by the reducer'
    
      // 如果没有传入 reducer 信息，那么直接返回错误信息，提示用户需要信息
      if (reducerKeys.length === 0) {
        return (
          'Store does not have a valid reducer. Make sure the argument passed ' +
          'to combineReducers is an object whose values are reducers.'
        )
      }
    
      // 如果传入的 state 不是一个简单对象，那么返回错误信息，告知用户 state 应为简单对象
      if (!isPlainObject(inputState)) {
        return (
          `The ${argumentName} has unexpected type of "` +
          {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
          `". Expected argument to be an object with the following ` +
          `keys: "${reducerKeys.join('", "')}"`
        )
      }
    
      // 先收集未预料的 Key。这些 key 不存在于 reducers 中也不存在于 unexpectedKeyCache 中
      const unexpectedKeys = Object.keys(inputState).filter(
        key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
      )
    
      // 把所有的未预料 key 放入缓存中
      unexpectedKeys.forEach(key => {
        unexpectedKeyCache[key] = true
      })
    
      // 如果当前 action 类型是 REPLACE 那么洗洗睡吧，啥都不干了
      if (action && action.type === ActionTypes.REPLACE) return
    
      // 如果存在未预料的 key 那么组装错误信息并返回
      if (unexpectedKeys.length > 0) {
        return (
          `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
          `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
          `Expected to find one of the known reducer keys instead: ` +
          `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
        )
      }
    }
    
    // 断言 reducer 模型
    function assertReducerShape(reducers) {
      // 对传入的 reducers 列表中的每一个 reducer 来进行断言操作
      Object.keys(reducers).forEach(key => {
        const reducer = reducers[key]
        const initialState = reducer(undefined, { type: ActionTypes.INIT })
    
        // 如果初始 state 为 undefined ，那么抛出异常，因为初始 state 要为对象类型
        if (typeof initialState === 'undefined') {
          throw new Error(
            `Reducer "${key}" returned undefined during initialization. ` +
              `If the state passed to the reducer is undefined, you must ` +
              `explicitly return the initial state. The initial state may ` +
              `not be undefined. If you don't want to set a value for this reducer, ` +
              `you can use null instead of undefined.`
          )
        }
    
        // 这里用于检测 action 的 type 处理是否有 default 如果没有，那么也会抛出一个异常，因为 reducer 至少返回一个稳定的 state
        if (
          typeof reducer(undefined, {
            type: ActionTypes.PROBE_UNKNOWN_ACTION()
          }) === 'undefined'
        ) {
          throw new Error(
            `Reducer "${key}" returned undefined when probed with a random type. ` +
              `Don't try to handle ${
                ActionTypes.INIT
              } or other actions in "redux/*" ` +
              `namespace. They are considered private. Instead, you must return the ` +
              `current state for any unknown actions, unless it is undefined, ` +
              `in which case you must return the initial state, regardless of the ` +
              `action type. The initial state may not be undefined, but can be null.`
          )
        }
      })
    }
    
    /**
     * 导出一个公共函数，用于把传入的多个 reducer 对象组合成一个对象，以确保在 reducer 分门别类的同时 store 唯一
     */
    export default function combineReducers(reducers) {
      const reducerKeys = Object.keys(reducers)
      const finalReducers = {}
      for (let i = 0; i < reducerKeys.length; i++) {
        const key = reducerKeys[i]
    
        // 如果当前是开发环境，且引用了没有定义好的 action ，那么报出警告
        if (process.env.NODE_ENV !== 'production') {
          if (typeof reducers[key] === 'undefined') {
            warning(`No reducer provided for key "${key}"`)
          }
        }
    
        // 如果 reducers[key] 是一个 function 类型的，那么说明它是最终的 reducer ，将它放入结果对象中
        if (typeof reducers[key] === 'function') {
          finalReducers[key] = reducers[key]
        }
      }
      const finalReducerKeys = Object.keys(finalReducers)
    
      let unexpectedKeyCache
      if (process.env.NODE_ENV !== 'production') {
        unexpectedKeyCache = {}
      }
    
      // 断言最终的结果对象是一个 reducer
      let shapeAssertionError
      try {
        assertReducerShape(finalReducers)
      } catch (e) {
        shapeAssertionError = e
      }
    
      // 返回结合函数，这个函数其实也就是最终的 reducer
      return function combination(state = {}, action) {
        // 如果结果对象不是一个 reducer 那么抛出异常
        if (shapeAssertionError) {
          throw shapeAssertionError
        }
    
        // 如果当前是开发环境，那么获取意外状态下的错误形成信息，有则改之，无则加勉
        if (process.env.NODE_ENV !== 'production') {
          const warningMessage = getUnexpectedStateShapeWarningMessage(
            state,
            finalReducers,
            action,
            unexpectedKeyCache
          )
          if (warningMessage) {
            warning(warningMessage)
          }
        }
    
        let hasChanged = false
        const nextState = {}
        // 每次调用 reducers 的时候遍历执行，如果有变化，就返回新值，否则就返回原值
        for (let i = 0; i < finalReducerKeys.length; i++) {
          const key = finalReducerKeys[i]
          const reducer = finalReducers[key]
          const previousStateForKey = state[key]
          const nextStateForKey = reducer(previousStateForKey, action)
          if (typeof nextStateForKey === 'undefined') {
            const errorMessage = getUndefinedStateErrorMessage(key, action)
            throw new Error(errorMessage)
          }
          nextState[key] = nextStateForKey
          hasChanged = hasChanged || nextStateForKey !== previousStateForKey
        }
        return hasChanged ? nextState : state
      }
    }
```

createStore.js
```
    import $$observable from 'symbol-observable'
    
    import ActionTypes from './utils/actionTypes'
    import isPlainObject from './utils/isPlainObject'
    
    /*
     * 导出一个共工的 createStore 方法，用于创建唯一的 store
     */
    export default function createStore(reducer, preloadedState, enhancer) {
      // 如果只传了两个参数，调整一个参数位置
      if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
        enhancer = preloadedState
        preloadedState = undefined
      }
    
      // 如果传入了增强函数，那么判断增强函数状态，为函数时执行，否则抛出异常
      if (typeof enhancer !== 'undefined') {
        if (typeof enhancer !== 'function') {
          throw new Error('Expected the enhancer to be a function.')
        }
    
        return enhancer(createStore)(reducer, preloadedState)
      }
    
      // 检查 reducer 的类型
      if (typeof reducer !== 'function') {
        throw new Error('Expected the reducer to be a function.')
      }
    
      let currentReducer = reducer
      let currentState = preloadedState
      let currentListeners = []
      let nextListeners = currentListeners
      let isDispatching = false
    
      // 工具函数，用于检查观察者可用
      function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
          nextListeners = currentListeners.slice()
        }
      }
    
      /*
       * 获取 state 内容，如果当前正在操作，那么抛出异常
       */
      function getState() {
        if (isDispatching) {
          throw new Error(
            'You may not call store.getState() while the reducer is executing. ' +
              'The reducer has already received the state as an argument. ' +
              'Pass it down from the top reducer instead of reading it from the store.'
          )
        }
    
        return currentState
      }
    
      /*
       * 注册观察者
       */
      function subscribe(listener) {
        // 观察者必须是一个回调函数
        if (typeof listener !== 'function') {
          throw new Error('Expected the listener to be a function.')
        }
    
        if (isDispatching) {
          throw new Error(
            'You may not call store.subscribe() while the reducer is executing. ' +
              'If you would like to be notified after the store has been updated, subscribe from a ' +
              'component and invoke store.getState() in the callback to access the latest state. ' +
              'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
          )
        }
    
        let isSubscribed = true
    
        ensureCanMutateNextListeners()
        nextListeners.push(listener)
    
        // 返回一个反注册函数，用于取消部分观察者
        return function unsubscribe() {
          // 当前在观察中，那么不允许取消
          if (!isSubscribed) {
            return
          }
    
          if (isDispatching) {
            throw new Error(
              'You may not unsubscribe from a store listener while the reducer is executing. ' +
                'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
            )
          }
    
          isSubscribed = false
    
          // 检查并重置观察者列表
          ensureCanMutateNextListeners()
          const index = nextListeners.indexOf(listener)
          nextListeners.splice(index, 1)
        }
      }
    
      /*
       * 分发 action
       */
      function dispatch(action) {
        // 检查 action 类型是否为简单对象
        if (!isPlainObject(action)) {
          throw new Error(
            'Actions must be plain objects. ' +
              'Use custom middleware for async actions.'
          )
        }
    
        // 检查 action.type 是否正确传入
        if (typeof action.type === 'undefined') {
          throw new Error(
            'Actions may not have an undefined "type" property. ' +
              'Have you misspelled a constant?'
          )
        }
    
        // 当前执行中不允许再操作
        if (isDispatching) {
          throw new Error('Reducers may not dispatch actions.')
        }
    
        // 执行 reducer 里面的 action 具体内容
        try {
          isDispatching = true
          currentState = currentReducer(currentState, action)
        } finally {
          isDispatching = false
        }
    
        // 调用观察者，将监听结果下发
        const listeners = (currentListeners = nextListeners)
        for (let i = 0; i < listeners.length; i++) {
          const listener = listeners[i]
          listener()
        }
    
        return action
      }
    
      /*
       * 更换 reducer
       */
      function replaceReducer(nextReducer) {
        if (typeof nextReducer !== 'function') {
          throw new Error('Expected the nextReducer to be a function.')
        }
    
        currentReducer = nextReducer
        dispatch({ type: ActionTypes.REPLACE })
      }
    
      /*
       * 可监听的，其实就是观察者模式的一种实现方式
       */
      function observable() {
        const outerSubscribe = subscribe
        return {
          subscribe(observer) {
            if (typeof observer !== 'object' || observer === null) {
              throw new TypeError('Expected the observer to be an object.')
            }
    
            function observeState() {
              if (observer.next) {
                observer.next(getState())
              }
            }
    
            observeState()
            const unsubscribe = outerSubscribe(observeState)
            return { unsubscribe }
          },
    
          [$$observable]() {
            return this
          }
        }
      }
    
      // 初始化
      dispatch({ type: ActionTypes.INIT })
    
      return {
        dispatch,
        subscribe,
        getState,
        replaceReducer,
        [$$observable]: observable
      }
    }
    


```