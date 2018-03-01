/**
 * 从一个数组中找到一个符合条件的元素
 * 参数是一个数组和一个回调，回调用于检查元素是否符合要求
 * 如果有符合条件的元素，返回第一个元素，否则返回 undefined
 * let arr = []
 * console.log(arr.filter(el => el > 0))     // undefined
 * arr = [4,5,6,7]
 * console.log(arr.filter(el => el > 0))     // 4
 */
export function find (list, f) {
  return list.filter(f)[0]
}

/**
 * 深拷贝方法，默认有一个缓存参数，初始时为空数组，向下递归的时候，会不断的添加内容
 */
export function deepCopy (obj, cache = []) {
  // 如果传入的内容为 null 或者 不为 object 那么就表示到最底层了
  // 当前拷贝是一个基础的数据类型，此时直接返回内容，停止递归
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // 如果对象在缓存中找到的话，那就直接返回缓存对象
  // 因为虽然是深拷贝，但是原对象中的某几个属性同时引用了某个对象的话
  // 这个时候为了与之前对象保持一致，不应该进行深拷贝，而是直接传递引用，比如函数什么的
  const hit = find(cache, c => c.original === obj)
  if (hit) {
    return hit.copy
  }

  // 判断当前拷贝的是数组还是对象，然后生成对应的类型，然后将当前对象传入到缓存中
  const copy = Array.isArray(obj) ? [] : {}
  cache.push({
    original: obj,
    copy
  })

  // 对对象的每一个属性进行深拷贝处理，这里是用递归
  Object.keys(obj).forEach(key => {
    copy[key] = deepCopy(obj[key], cache)
  })

  // 返回内容
  return copy
}

/**
 * 给对象方法一个 forEach 方法，核心使用的是 ES6 的 Object.keys() 方法
 * let obj = {
 *   a : 5,
 *   b : 'string',
 *   c : '/reg/',
 *   d : function () { console.log('666')}
 * }
 * let arr = Object.keys(obj)
 * console.log(arr)     // ['a', 'b', 'c', 'd']
 * console.log(Object.prototype.toString.call(arr))    // [object Array]
 */
export function forEachValue (obj, fn) {
  Object.keys(obj).forEach(key => fn(obj[key], key))
}

/**
 * 判断参数是不是一个对象，返回 true,false
 * JavaScript 是通过前三位的二进制码来判断类型的， Object 的前三位是 000 . 
 * 但是 null 是全 0 。这是一个历史遗留且不好修改的 BUG,故要多添加此层进行判断
 * 也可以用 Object.prototype.toString.call(obj) === '[object Object]' 来进行判断
 */
export function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * 判断一个对象是不是 Promise 对象，只要检查它是不是有 then 方法即可。
 * 因为 Promise 的所有返回内容都是一个新的 Promise 对象，所以恒有 then 方法
 * 也可以用 Object.prototype.toString.call(val) === '[object Promise]'
 */
export function isPromise (val) {
  return val && typeof val.then === 'function'
}

/**
 * 断言方法，用于检查传入内容是否正确，
 * 如果正常则继续执行， 不正确就抛出异常，这是保证程序正常运行的一种手段
 */
export function assert (condition, msg) {
  if (!condition) throw new Error(`[vuex] ${msg}`)
}
