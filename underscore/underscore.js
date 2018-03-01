(function() {

  // 先判断全局环境是什么，如果存在 self 那就是浏览器端，如果存在 global 那就是 node 端。如果是其它的神奇的地方，那就是 this 或者 {}
  var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global ||
            this ||
            {};

  // 老规矩，维稳，防止重复定义，就是为了偶尔犯浑多引用的情况
  var previousUnderscore = root._;

  // 取别名，为了压缩出更少的内容
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // 用得多的方法再取一个更短点的别名
  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create;

  // 弄一个空方法，如果某些方法必须要传回调，但是你又不想执行什么操作，那就调用它，比老哥都稳
  var Ctor = function(){};

  // 一个工具方法，用于把对象转化成 _ 对象。当然这是有一定操作的，如果它本来就是，那就不重复调用浪费资源了
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // 检查一下环境，如果不存在 exports 那就是 浏览器 环境，直接挂在 windows 对象上
  // 然后就是 nodejs 上面的挂载方式，就是 新旧 的问题，不同的写法，反正就是挂载在 global 上，开心就好
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // 版本号，能看出来我读的是 1.8.3 版本的源码不？
  _.VERSION = '1.8.3';

  // 看这名字是优化回调，具体作用老夫不知，待老夫往下读读
  var optimizeCb = function(func, context, argCount) {
    // 如果没有指定执行上下文，直接返回传入的回调方法，大爷我不伺候了
    if (context === void 0) return func;
    // 看，这里有传入参数数量哎
    switch (argCount) {
      // 看看，大佬又在用闭包了，操作也没多骚啊，就是把 value 的值常驻内存了，要用直接调，不用传
      case 1: return function(value) {
        return func.call(context, value);
      };
      // 传入的是 null,那怎么办啊，不知道啊，那就什么都不做好不好?
      // case null: ;
      case null:
      // 看看，这些都是大佬传的参数，厉不厉害，牛不牛逼，你都不知道是从哪传的，看来闭包还是要好好看啊
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    // 我要是没有 argCount 怎么办，那我就直接调用你呗，啥？风格一样？为什么不用 call， call 比 apply 快 ?  我当然知道 call 比 apply 快，我又不是大佬， 我哪知道要传入几个参数啊
    return function() {
      return func.apply(context, arguments);
    };
  };

  var builtinIteratee;

  var cb = function(value, context, argCount) {
    // 根据传入 value 的类型，分别调用不同的方法并返回结果
    // 这个 builtinIteratee 没有赋值怎么办，好可怕，会不会是 undefined ？别傻了，这里用的函数声明的方法，稳着呢
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value);
  };

  // 哎，我这里给 builtinIteratee 赋值了，还调用了上面那个 cb 函数，看看，这个操作骚不骚，算了，不骚
  _.iteratee = builtinIteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // 用习惯 ES6 的 ...rest 再用 ES5 的 arguments 类数组是不是很难过？
  // 忍不了了，但是不是所有浏览器都直接支持 ES6 的怎么办， 对，就这样 polyfill 一下
  var restArgs = function(func, startIndex) {
    // 如果没传 startIndex 怎么办？那我们就给它赋值一个呗，安全第一，安全第一
    // +startIndex 是用于把 startIndex 隐式转换成一个 Number 型，为什么说是 Number 型呢，因为 Js 没有 float, int ,double型的区别啊，全是用双精度浮点型存的，我们就统一叫法吧 
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    // 看看，闭包，又是闭包，大佬一天不用闭包装逼就难受
    return function() {
      var length = Math.max(arguments.length - startIndex, 0),
          rest = Array(length),
          index = 0;
      // 挨个存值呗，这可是好宝贝，不能丢，丢了饭碗也就没了
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      // 来，根据开始位置算，我们总共有几种情况处理然后根据情况调用 func 对它进行处理
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      // 看，刚才那里没有我的份，那怎么办呢，一定是因为我不够规范，哦，对了，我没有展开，那怎么办，我展呗，继续操作
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  // 基建，哦不对是基创，管他的呢，反正都是基
  var baseCreate = function(prototype) {
    // 不是对象你都敢来？来来来，小爷赏你个对象，走好不谢
    if (!_.isObject(prototype)) return {};
    // 如果 nativeCreate 存在，那么我就直接用 nativeCreate 呗，不用白不用
    if (nativeCreate) return nativeCreate(prototype);

    // 来，小伙，把我放在你的显式原型上，嗯，我用你创个对象，你别害羞，看，我创完了，拿走了啊，没你什么事了，刚才给你的东西你就别留着了，那不是你的
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  // 我给你属性你，你在对象里给我找，找到告诉我啊，万一没有？万一没有你就给我传个 undefined 呗，你看着是 void 0 ，哦哦，那是大佬装逼的写法，别学，undefined 挺好
  // 对了，属性名我就传一次，你记得啊，看了大佬装了那么多的逼，闭包会了吧，对，就用它
  var shallowProperty = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = shallowProperty('length');
  // 就是检查类数组的，比如 arguments 啊，{1：1，2：2，3:4,length:4} 啊，就是吓唬人的
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // 遍历麻烦？没事，大哥给你弄一个，你看这个好用不？
  _.each = _.forEach = function(obj, iteratee, context) {
    // 先给你处理方法优化一下，我动手你放心，肯定最好用
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    // 你要是一个类数组，正好，我就用调用数组的方法来调用你，省心省事
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
    // 幸好现在高级浏览器自动屏蔽原型链上面的方法了，要不然我还得用 hasOwnPrototype 来验证，那就挨个调用呗
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // each 方法我都有了，好人做到底，给你一个 map 吧。对，对，对，就是它，它还有一个小名，叫 collect 你可以用，开心不
  // map 和 each 的区别啊，区别就是一个返回值了呗，一个是直接操作你，另一个是返回一个结果数组
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // 这个方法可神奇了，就是用它来创建 reduce 方法的，为什么不直接创建 reduce 呢？
  // 这还不是因为有一个 reduceRight 呀，看到没，大佬就是这么操作的，提出公共代码，专业名词是叫什么来着，对，工厂函数，就是他，没跑了
  var createReduce = function(dir) {
    var reducer = function(obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        // 要是参数不多，小于三个的话，那还有啥意思啊，简单操作一下，意思意思得了，简单处理一下
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        // 我才是大活，挨个遍历，用传进来的回调处理内容，然后把结果存到 memo 里
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };

    return function(obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  };

  // 来，给两个小名， foldl inject 大名reduce,从左往右算
  _.reduce = _.foldl = _.inject = createReduce(1);

  // 有正当然有反喽，也是小名 foldr 大名 reduceRight，从右往左算
  _.reduceRight = _.foldr = createReduce(-1);

  // 大名 find ，小名 detect ，顾名思义一下，对，我就是用来找值的
  _.find = _.detect = function(obj, predicate, context) {
    // 你要是类数组，我就用 findIndex ，你不是，我就只能用 findKey 了.良辰只有这两种方法
    var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
    // 我找，找到了就给你，但是找不到怎么办，智商有点捉急了，看来大佬的代码也不是十全十美啊，你倒是返回一个 null 也好
    var key = keyFinder(obj, predicate, context);
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // filter select，两名都是我，你说大佬怎么这么喜欢取小名呢，神烦
  // 就是 each 一下传入数组或者对象吧，要是结果对，那就插到一个 result 里，然后把 result 还你，呐，你要的黄瓜，哦不对，你要的结果
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // every all 和filter 很像啊，不过你是返回结果，我是全对就返回 true ，你只要一点不合我心意就 false 了，不要你了
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // some any 也是如此，不过它和 every 不一样，你只要有一点合我心意，我就选你
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // contains includes include 你说你在不在我体内呢，好羞耻啊，come on 宝贝，来看看嘛
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = restArgs(function(obj, path, args) {
    var contextPath, func;
    if (_.isFunction(path)) {
      func = path;
    } else if (_.isArray(path)) {
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }
    return _.map(obj, function(context) {
      var method = func;
      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }
        if (context == null) return void 0;
        method = context[path];
      }
      return method == null ? method : method.apply(context, args);
    });
  });

  // 大佬们也不愿意做这些无聊的操作，不过一家人就要整整齐齐，一个都不能少
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // 矮子里挑大个了啊，我找找
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    // 你要是没有设置比较的过滤方法，那就我开心就好了呗，首先你们得听我的， iteratee 必须就是一个数，obj 也一定要有值，obj里面第一个也不能是对象，稳点好
    if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
      // 遍历找最大，反正每次最大的都放在 result 里面，这样返回回去的应该就是最大值了吧
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      // 竟然你设置了比较函数，那您是大佬听您的，来，您说怎么办就是怎么办，我反正只遍历
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // 和上面那个大哥差不多，不过我是查最小的，哈哈，没想到吧。我们不学 reduce ，新学到的姿势没用了啵
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // 
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  // 我也是用来排序的，不过你要告诉我排谁，也可以处理后再排哦
  _.sortBy = function(obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context);
    // 看，我就是先把你传进来的东西弄一个安全稳定的结构，然后再利用这个结构来排
    return _.pluck(_.map(obj, function(value, key, list) {
      return {
        value: value,
        index: index++,
        criteria: iteratee(value, key, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // 看到这里的话，我也一度对闭包产生了点想法，你到底想干什么啊，怎么干啊，这些参数莫名其妙的是什么毛病啊，然后，嘿嘿嘿
  // Exapmple 因可斯三破：
  // var pika = group(behavior, partition)
  // console.log(Object.prototype.toString.call(pika))  // [Object function] 
  // var result = pika(obj, iteratee, context)          // 这个时候 behavior, partition 常驻在内存里哦，不用再传，就可以直接使用，这就是函数式编程的魅力
  var group = function(behavior, partition) {
    return function(obj, iteratee, context) {
      var result = partition ? [[], []] : {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // 这仨货就是 group 的各种应用就是了，可以把 group 看成工厂函数啊，我们不搬运水，我们是函数的生产商
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;

  // 对，我就是把把传入内容转换成数组的风骚小王子，听说在 ES6 版本我出了个弟弟叫 arrayFrom ，应该挻好用的吧
  _.toArray = function(obj) {
    // 什么都没有？来来来，一个空数组拿好不谢
    if (!obj) return [];
    // 啥，你就是一个数组，这不是逗我玩呢，真当我是拷贝函数用啊，行，您是大爷，听您的，我就是拷贝函数了
    if (_.isArray(obj)) return slice.call(obj);
    // 字符串，好吧，你按我的要求分呗，成功了就给你数组，不成功就是 null 了，真害怕只有一值的情况，可怕
    if (_.isString(obj)) {
      return obj.match(reStrSymbol);
    }
    // 类数组？对喽，您才是我该服务的对象啊，一套 map 舒服不，有空常来啊
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    // 拿您没辙了，你就这么换吧，values 老兄，干巴爹
    return _.values(obj);
  };

  // 求长度，注意隐式类型转换哦， null, undefined, false, 0, -0, '', NaN 这七种请常记，他们都会隐式转化成 false 的
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // 它就不该出现在这，它应该在 group 那一族里，不乖的孩子，到处乱跑
  _.partition = group(function(result, value, pass) {
    result[pass ? 0 : 1].push(value);
  }, true);

  // first head take 都是我的名，我的名，我就是拿数组第一个内容的操作，当然你要传入内容不正确，我也不会给你乱传啊，我稳着呢
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null || array.length < 1) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // 就是一个弄数组的，你给我位置，我返回一个新数组，至于具体为什么这么麻烦，就是为了健壮性啊
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // 有先必有后喽，第一个都取了，我最后一个还能忘记了？
  _.last = function(array, n, guard) {
    if (array == null || array.length < 1) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // 除去第一个元素，返回一个新数组
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  _.compact = function(array) {
    return _.filter(array, Boolean);
  };

  // 变平变平变平，女生莫慌，不是把你们变平的，就是把数组扁平化一下，就是一个个展开数组，没啥难度，多递几个乌龟就好了
  var flatten = function(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    // 看看看，这里就一个性能优化的策略，避免重复取值，直接取变量里面的内容速度快
    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        if (shallow) {
          var j = 0, len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  _.without = restArgs(function(array, otherArrays) {
    return _.difference(array, otherArrays);
  });

  // Babe 你就是我的唯一，我就把你变成唯一，取消重复值，不过在 ES6 中另有一番骚操作 [...new Set(arr)]
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    // 调整参数位置，您要是少传一个两个的，我没法对您有意见，但是我得对下面的负责啊，不是么
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      // 排过序的就是好办，比较前面出没出现就好，其它的就只能老老实实的比呗
      if (isSorted && !iteratee) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // 把你的心我的心串一串，多了怎么办？重复的部分不要呗，省点空间，我不想那么胖
  _.union = restArgs(function(arrays) {
    return _.uniq(flatten(arrays, true, true));
  });

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      var j;
      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // 大家来找茬，找到两个不同的数组中不同的部分并返回
  _.difference = restArgs(function(array, rest) {
    rest = flatten(rest, true, true);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  });

  // 解压内容啊
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // 压缩吧，我猜应该是的，把解压的内容序列化一下
  _.zip = restArgs(_.unzip);

  // 把 list 转化成 一个键值对啊。为什么这种做捏？hash 找东西快啊
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // 又是一个工厂函数，用于从指定的数组中找内容，返回他的位置
  var createPredicateIndexFinder = function(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      // 挨个遍历找呗，这个真没有其它办法
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  };

  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // 就是查找应该加入的位置，把位置返回回去，前提是你数组最好排序好了，要不然就很僵了
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    // 看看，这里就是用的二分法哦 O(n) = logN 的，是不是很快啊
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // 还是工厂函数，就是为了下面那两货
  var createIndexFinder = function(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  };

  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // 这就是学 python 的 range 数量生成器，挺好用的东西，奇葩迭代必备
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    // 要是没有设置的话，就给你一个呗，正反我都替您想好了
    if (!step) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);
    // 迭代往数组里加数，加数，没了我你们啥也干不了
    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // 你给我传个数组，再传个数，我尽量按您的要求把数组分割成您指定的大小
  _.chunk = function(array, count) {
    if (count == null || count < 1) return [];

    var result = [];
    var i = 0, length = array.length;
    while (i < length) {
      result.push(slice.call(array, i, i += count));
    }
    return result;
  };

  // 应该是内部调用函数的方法吧，这个不确定，骚不动了
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    // 如果 callingContext 不是 boundFunc 的一个实例，那么就直接传入参数并招待 sourceFunc 再返回结果
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    // 要是是实例对象的话，那原型继承一个对象，用于它来执行 sourceFunc
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // ES5 中的 bind 方法的 polyfill,害怕，这年头还有不支持 ES5 的浏览器活着么？都21世纪了
  _.bind = restArgs(function(func, context, args) {
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var bound = restArgs(function(callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });

  // 应该是局部化的意思，具体含义容我三思
  _.partial = restArgs(function(func, boundArgs) {
    var placeholder = _.partial.placeholder;
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });

  _.partial.placeholder = _;

  // 指定一系列方法的绑定 this 指向
  _.bindAll = restArgs(function(obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  });

  // 记忆化啊，我把计算结果存在内存里面，然后就可以开心的读了啊，毕竟读内存的效率，你们懂的
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // 延迟执行， setTimeout 不解释
  _.delay = restArgs(function(func, wait, args) {
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  });

  _.defer = _.partial(_.delay, _, 1);

  // 函数节流，防止在一段时间内，同一个函数多次触发，这里面当然得使用闭包了，因为可以方便的每次执行时间开心的存起来啊，方便下次运算
  _.throttle = function(func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };

    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  };

  // 函数防抖，连续事件如 scroll 结束之后，只执行一次
  _.debounce = function(func, wait, immediate) {
    var timeout, result;

    var later = function(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArgs(function(args) {
      if (timeout) clearTimeout(timeout);
      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = _.delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };

  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // 之后调用，是不是有点拦截器的意思，好好想想，如果利用它是不是可以做成一个面向切面的方法呢
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // 之前调用
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  _.once = _.partial(_.before, 2);

  _.restArgs = restArgs;

  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var collectNonEnumProps = function(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  };

  // 取 keys 啊， ES6 标准已经实现了 Object.prototype.keys()
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // 取 Object 的里 value 的值
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // 专门为对象服务的 map 方法啊，弥补了对象不能 map 的遗憾
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
        length = keys.length,
        results = {};
    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // 将一个对象转换为元素为 [key, value] 形式的数组
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // 将一个对象的 key-value 键值对颠倒，其实就是创建一个新对象，反过来存呗，没啥意思
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // 其实就是收集一个对象的 function 。然后放在一个数组里返回，对了，使用的是函数表达式形式
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // 工厂函数，用于创建一个 Assigner 这个方法在 ES6 中已经实现了，就是 Object.assign()
  var createAssigner = function(keysFunc, defaults) {
    return function(obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  _.extend = createAssigner(_.allKeys);

  _.extendOwn = _.assign = createAssigner(_.keys);

  // 和 findIndex 很像啊，不过一个是处理数理的，一个是处理对象的
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  var keyInObj = function(value, key, obj) {
    return key in obj;
  };

  // 根据一定的需求（key 值，或者通过 predicate 函数返回真假）
  // 返回拥有一定键值对的对象副本
  _.pick = restArgs(function(obj, keys) {
    var result = {}, iteratee = keys[0];
    if (obj == null) return result;
    // 如果第二个参数是函数的话，那就是你了，皮卡丘
    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      // 妙娃种子，第二个参数不是函数，那就你上了，毕竟你处理 keys 可能是数组，也可能是连续的几个并列的参数比较厉害
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  });

  // 我是来砸楼上 pick 场子的，对着干
  _.omit = restArgs(function(obj, keys) {
    var iteratee = keys[0], context;
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1];
    } else {
      keys = _.map(flatten(keys, false, false), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  });

  _.defaults = createAssigner(_.allKeys, true);

  // 构造一个新的对象并返回
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // 克隆一个新的对象并返回
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  var eq, deepEq;
  eq = function(a, b, aStack, bStack) {
    // 比较一下，先简单的比，再深入比较
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    if (a == null || b == null) return false;
    if (a !== a) return b !== b;
    var type = typeof a;
    if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
    return deepEq(a, b, aStack, bStack);
  };

  // 深度对比是否相同，深度是什么意思呢，我这个有深度的人就告诉里，查，一查到底
  deepEq = function(a, b, aStack, bStack) {
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // 首先类名要相同
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    // 根据不同的类名来进行判断
    switch (className) {
      // 正则和字符串刚看成一类，毕竟长得挻像的是不？现在还用 new RexExp() 来构造的人不多了吧
      case '[object RegExp]':
      case '[object String]':
        return '' + a === '' + b;
      case '[object Number]':
        if (+a !== +a) return +b !== +b;
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      // 日期和布尔型也可以看成一类啊，反正隐式转换成 Number 型了
      case '[object Date]':
      case '[object Boolean]':
        return +a === +b;
      case '[object Symbol]':
        return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
    }

    var areArrays = className === '[object Array]';

    // 先判断不是数组的情况
    if (!areArrays) {
      // 如果 a 不是对象或者 b 不是对象，那就有问题了
      if (typeof a != 'object' || typeof b != 'object') return false;

      // 先检查一下两个的构造函数是不是一样，如果一样再说，不一样，那两个肯定没法一样喽
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }

    // 设定两个栈，再给栈里加值呗
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      if (aStack[length] === a) return bStack[length] === b;
    }

    aStack.push(a);
    bStack.push(b);

    // 展开数据与对象，避免递小龟，递归成本挺高的
    if (areArrays) {
      // 数组情况
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // 对象情况
      var keys = _.keys(a), key;
      length = keys.length;
      if (_.keys(b).length !== length) return false;
      while (length--) {
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // 出栈出栈
    aStack.pop();
    bStack.pop();
    return true;
  };

  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // 检查是不是一个对象啊
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // 遍历创建类型检查函数， 这一切就是为了检查数据类型，记得之前那个类型检查问题不？ var isString = function (xxx) { return typeof xxx === 'string' && xxx instanceof String }
  // 在很多情况下，它都是很好用的，直到一位大佬给出了如下 top.isString(xxx) 就尴尬了，因为 top 的 Object 与 ifream 里的 Object 不一样啊！
  // 直到有一天 Object.prototype.toString.call(xxx) 横空出世，用来判断类型准到暴
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // 检查是不是 arguments 类数组，不过这玩意最好少用， ...rest 已经很好用了
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // 据说是为了以下几个大佬专门写的兼容性
  // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236)，old v8.
  var nodelist = root.document && root.document.childNodes;
  if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // 检查是不是一个数字，排除千难万险才得以确定，不容易啊
  _.isFinite = function(obj) {
    return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // NaN 的判断，其实这里的逻辑比较乱，现在在 ES6 中可以这么写 Object.is(obj,NaN)
  _.isNaN = function(obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  // 是不是一个布尔型的值，这里我们可以锁定它的范围，然后类型，之所以写得这么长是因为要防止隐式类型转换啊
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // 判断是不是为 null
  _.isNull = function(obj) {
    return obj === null;
  };

  // 判断是不是为 undefined 之所以使用 void 0 是为了方便压缩啊，这样比较短
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // 判断一个对象中是否有指定的 key 啊
  _.has = function(obj, path) {
    if (!_.isArray(path)) {
      return obj != null && hasOwnProperty.call(obj, path);
    }
    var length = path.length;
    for (var i = 0; i < length; i++) {
      var key = path[i];
      if (obj == null || !hasOwnProperty.call(obj, key)) {
        return false;
      }
      obj = obj[key];
    }
    return !!length;
  };

  // 用于处理命名冲突，要是全局环境中有其它框架来砸场子，占了你的名字，那就只能你上了
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // 没啥卵用吧，你给我啥，我返回啥
  _.identity = function(value) {
    return value;
  };

  // 同没卵用
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(path) {
    if (!_.isArray(path)) {
      return shallowProperty(path);
    }
    return function(obj) {
      return deepGet(obj, path);
    };
  };

  _.propertyOf = function(obj) {
    if (obj == null) {
      return function(){};
    }
    return function(path) {
      return !_.isArray(path) ? obj[path] : deepGet(obj, path);
    };
  };

  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // 在给定范围的取一个随机数，整数哦，赌博禁止
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // 取现在的时间戳
  _.now = Date.now || function() {
    return new Date().getTime();
  };

  // 防 XSS 攻击，水逆退散
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped.
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // Traverses the children of `obj` along `path`. If a child is a function, it
  // is invoked with its parent as context. Returns the value of the final
  // child, or `fallback` if any child is undefined.
  _.result = function(obj, path, fallback) {
    if (!_.isArray(path)) path = [path];
    var length = path.length;
    if (!length) {
      return _.isFunction(fallback) ? fallback.call(obj) : fallback;
    }
    for (var i = 0; i < length; i++) {
      var prop = obj == null ? void 0 : obj[path[i]];
      if (prop === void 0) {
        prop = fallback;
        i = length; // Ensure we don't continue iterating.
      }
      obj = _.isFunction(prop) ? prop.call(obj) : prop;
    }
    return obj;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  var noMatch = /(.)^/;

  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  // 处理字符呗，你们几个我不欢迎，通通加个 \ 省得出事
  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // 年轻人，你想变得更强么，你想拥有全世界的宝藏么，来，读我吧，打开你模板路上的任督二脉
  _.template = function(text, settings, oldSettings) {
    // 应该是某种兼容性写法吧，如果新标准不存在，那么使用旧标准
    if (!settings && oldSettings) settings = oldSettings;
    // 相同的 key， settings 优先，他爸爸是李刚，其次选择李二家的 templateSettings
    settings = _.defaults({}, settings, _.templateSettings);

    // 用于匹配模板的正则啊，具体是什么我也看不懂，总之很牛逼就是了
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    var index = 0;
    var source = "__p+='";
    // 替换呗，把匹配到的内容用传入的函数进行一轮处理
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        // 防 XSS 攻击
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        // 插入变量
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        // 万一插入了 JavaScript 语句，那就执行一下呗，返回结果
        source += "';\n" + evaluate + "\n__p+='";
      }

      return match;
    });
    source += "';\n";

    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      // render 方法，前两个参数为 render 方法的参数， obj 为传入的 JSON 对象，传入 _ 参数使得函数内部能用 Underscore 的函数
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // 嗯嗯，我就是把你转化成 _ 对象的那一位，还给你加了一个 _chain 属性用于标记你的身份
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // 不管以前你是谁的，现在你是我的，来吧，把结果转化成 _ 对象吧
  var chainResult = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // 看，mixin 方法，合成吧黑暗大法师，把他们的方法全凑到一起吧
  _.mixin = function(obj) {
    // 其实是将方法浅拷贝到 _.prototype 上
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_, args));
      };
    });
    return _;
  };

  _.mixin(_);

  // 数组方法怎么用都用不够啊，来 pop push reverse shift sort spoice unshift 接好
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return chainResult(this, obj);
    };
  });

  // 你们是不是嫌方法不够多啊，那好啊，我把 concat, join, slice 方法给你，看看，从 Array.prototype 上面拿的，热乎的
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return chainResult(this, method.apply(this._wrapped, arguments));
    };
  });

  // 其它我没多大用，就是返回 this._wrapped 的
  _.prototype.value = function() {
    return this._wrapped;
  };

  // 起小名，起小名，起小名
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  // 给显式原型加个 toString 方法呗，就是返回  this._wrapped 的字符串表示，强制类型转换哦
  _.prototype.toString = function() {
    return String(this._wrapped);
  };

  // 你要是有 amd ，就是用 requirejs 那我就直接注册成一个 amd 模块了，要是没有的话，别怪兄弟不侠义了，直接挂浏览器全局上面了啊，要不然我也没办法，体谅一下，体谅一下
  if (typeof define == 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}());