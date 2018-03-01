// 检查是否是浏览器环境，且浏览器下是否挂载 vue 的 devtools,如果存在就挂载在 devtoolHook 上面，否则给一个 undefined
const devtoolHook =
  typeof window !== 'undefined' &&
  window.__VUE_DEVTOOLS_GLOBAL_HOOK__

export default function devtoolPlugin (store) {
  // 如果不存在 vue devtools ，那么直接返回，不进行操作
  if (!devtoolHook) return

  store._devtoolHook = devtoolHook

  // 触发 devtool 的 vuex:init 事件，并传入 store 。这样是用初始化
  devtoolHook.emit('vuex:init', store)

  // 监听 vuex:travel-to-state 方法，用于更换 store 状态
  devtoolHook.on('vuex:travel-to-state', targetState => {
    store.replaceState(targetState)
  })

  // 订阅 store 的 mutation 事件，如果触发了 mutation 事件，那么就执行回调
  // 回调是触发 devtool 的 vuex:mutations 方法
  store.subscribe((mutation, state) => {
    devtoolHook.emit('vuex:mutation', mutation, state)
  })
}
