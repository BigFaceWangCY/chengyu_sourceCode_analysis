import { deepCopy } from '../util'

// 先给参数赋予默认值，这样方便在参数缺省的情况下执行不会出错
export default function createLogger ({
  collapsed = true,
  filter = (mutation, stateBefore, stateAfter) => true,
  transformer = state => state,
  mutationTransformer = mut => mut,
  logger = console
} = {}) {
  // 从这里我们可以看出，这里利用了函数式编程，返回了一个函数，当我们执行 logger 的时候，其实就是调用这个函数
  return store => {
    // 深拷贝了 store.state 这么做的原因是用于和后来状态进行对比，毕竟 logger 系统就是用于干这个的
    let prevState = deepCopy(store.state)

    // 给 sotre 的 mutation 事件添加订阅，如果触发，执行下面传入的函数
    store.subscribe((mutation, state) => {
      // 先判断 console 是否存在，如果不存在，那就 GG 了，没法下去了，直接返回
      if (typeof logger === 'undefined') {
        return
      }
      // 深拷贝一下 state ，也就是存储一下当前的状态
      const nextState = deepCopy(state)

      // 根据传入 filter() 判断，默认为 true 直接执行
      if (filter(mutation, prevState, nextState)) {
        // 初始化一些参数，如时间，格式文本函数，信息等
        const time = new Date()
        const formattedTime = ` @ ${pad(time.getHours(), 2)}:${pad(time.getMinutes(), 2)}:${pad(time.getSeconds(), 2)}.${pad(time.getMilliseconds(), 3)}`
        const formattedMutation = mutationTransformer(mutation)
        const message = `mutation ${mutation.type}${formattedTime}`
        const startMessage = collapsed
          ? logger.groupCollapsed
          : logger.group

        // 调用 console.log(groupCollapsed) 输出内容，如果出问题，不用管，直接处理输出 message
        try {
          startMessage.call(logger, message)
        } catch (e) {
          console.log(message)
        }

        // 具体的打印内容
        logger.log('%c prev state', 'color: #9E9E9E; font-weight: bold', transformer(prevState))
        logger.log('%c mutation', 'color: #03A9F4; font-weight: bold', formattedMutation)
        logger.log('%c next state', 'color: #4CAF50; font-weight: bold', transformer(nextState))

        // 执行 console.groupEnd() 其实这里面是和上面的那个异常处理是对应的，同理，出了问题执行 console.log()
        try {
          logger.groupEnd()
        } catch (e) {
          logger.log('—— log end ——')
        }
      }

      // 把当初状态存储在常驻变量中，方便下次与新的状态比较
      prevState = nextState
    })
  }
}

/**
 * 字符串重复方法，返回指定字符串多次重复后的结果
 * 在 ES6 中已经可以写成 return str.repeat(times)
 */
function repeat (str, times) {
  return (new Array(times + 1)).join(str)
}

/**
 * 在数字前面补 0 到指定位数，并返回结果
 * 在 ES6 中已经可以写成 return num.toString().padStart(maxLength, '0')
 * 在 ES5 中也可以写成 return （repeat('0', maxLength) + num).slice(-maxLength)
 */
function pad (num, maxLength) {
  return repeat('0', maxLength - num.toString().length) + num
}
