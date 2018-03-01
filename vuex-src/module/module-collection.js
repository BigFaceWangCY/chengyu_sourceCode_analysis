import Module from './module'
import { assert, forEachValue } from '../util'

export default class ModuleCollection {
  // 构造函数
  constructor (rawRootModule) {
    // 注册模块
    this.register([], rawRootModule, false)
  }

  // 拿到模块
  get (path) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root)
  }
 
  // 获取命名空间的名字
  getNamespace (path) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }

  // 升级模块
  update (rawRootModule) {
    // 调用 update 方法，这里容易引起疑惑的是模块里也叫这个名字啊，怎么办，这里其实调用的是下面的 update 方法
    // 如果要调用本方法进行递归的话，只会使用 this.update()
    update([], this.root, rawRootModule)
  }

  // 注册模块
  register (path, rawModule, runtime = true) {
    // 如果当前非线上环境，那么使用断言来检查它是不是合法的模块
    if (process.env.NODE_ENV !== 'production') {
      assertRawModule(path, rawModule)
    }

    // 实例化一个模块，参数就是要注册的模块
    const newModule = new Module(rawModule, runtime)
    // 如果是根模块，那么就挂载在 this.root 上面
    if (path.length === 0) {
      this.root = newModule
    } else {
      // 如果不是根模块，那么取它的父模块，将其添加到其父模块下
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path[path.length - 1], newModule)
    }

    // 如果实例化的对象还有子模块，那么使用 forEachValue 递归注册其所有的子孙模块
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }

  // 取消模块的注册
  unregister (path) {
    // 取出模块的父模块，因为使用了模块，所以最上面是 root ，肯定是位于第二级，所以不用担心这里会出问题
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    // 如果当前模块正在执行，那么不能取消注册，否则就取消注册
    if (!parent.getChild(key).runtime) return

    parent.removeChild(key)
  }
}

// 升级模块
function update (path, targetModule, newModule) {
  // 如果当前环境不是线上环境，那就代表是开发环境，执行模块断言，检查是否错误
  // 之所以这么做，是因为线上环境很多报错与警告会取消
  if (process.env.NODE_ENV !== 'production') {
    assertRawModule(path, newModule)
  }

  // 调用指定模块的 update 方法，并将新的模块传入
  targetModule.update(newModule)

  // 对新模块的子模块进行遍历操作
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
            'manual reload is needed'
          )
        }
        return
      }
      // 递归遍历子模块
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}

// 函数断言对象，包含两个属性，一个是用于判断传入内容是否是函数的方法，另一个是说明
const functionAssert = {
  assert: value => typeof value === 'function',
  expected: 'function'
}

// 对象断言对象，包含两个属性，一个是用于判断传入内容是否是函数或者是一个有属性方法叫 handler 的对象，另一个是说明
const objectAssert = {
  assert: value => typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'),
  expected: 'function or object with "handler" function'
}

const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
}


function assertRawModule (path, rawModule) {
  Object.keys(assertTypes).forEach(key => {
    // 如果在模块中不存在 getters, mutations, actions 那么就直接返回
    // 有的话，就继续进行操作
    if (!rawModule[key]) return

    // 给对应的断言方法起个别名，类似于 java 中的反射，这样的话，在下面的操作中，就可以使用同一个名字了
    const assertOptions = assertTypes[key]

    // 挨个进行断言操作，如果不正确，则生成错误信息并显示
    forEachValue(rawModule[key], (value, type) => {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}

// 生成断言信息，如果错误的情况下，那么就返回它。这里其实就是简单的拼接字符串
function makeAssertionMessage (path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
