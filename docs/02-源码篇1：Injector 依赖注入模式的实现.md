通过前面的介绍，相信大家对 bpmn.js 的来历和出现目的都有了基本了解，也知道 bpmn.js 是依赖 diagram.js 和 bpmn-moddle 来实现 web 端的图形绘制与 BPMN 规范文件读写的，并且各个功能模块通过 **依赖注入模式** 和 **全局事件总线** 来进行通信和确定执行顺序。

为了更好的对源码部分进行解析，我们就先从 **依赖注入模式的实现库 -- didi/Injector** 开始。

## Injector 简介

本身这个库的名字并不叫 `injector`，而是 **[didi](https://github.com/nikku/didi)**，由 **bpmn.js** 团队的核心成员 **[nikku](https://github.com/nikku)** 基于 [node-di](https://github.com/vojtajina/node-di) 这个库进行的迭代开发。之所以作者在小册里都称为 **`Injector`**，是因为这个库的 **默认导出对象** 就是一个 **名为 `Injector` 的构造函数**，且符合这个库在 bpmn.js 和 diagram.js 中的实际作用。

在 **didi** 的文档中是这么描述这个库的：

> 使用 didi 这个库（Injector）的时候，您必须遵循 “依赖注入/控制反转” 的原则，**将组件/构造函数声明与实例化过程解耦**。一旦声明了相关依赖，则 didi（Injector）在需要实例化该组件并调用的时候会重新处理每个组件的依赖关系，并保存该组件实例以供后面使用。

所以 **在整个通过 `Injector` 建立了的依赖系统中，每个组件都只会产生一个组件实例，并且依赖该组件的其他组件在调用时调用的也是同一个实例**。

## 依赖注入/控制反转

既然 `Injector` 声明了在使用时需要遵循 **依赖注入/控制反转** 原则，那么什么是依赖注入和控制反转呢？

### 依赖注入

根据 [维基百科](https://zh.wikipedia.org/wiki/%E4%BE%9D%E8%B5%96%E6%B3%A8%E5%85%A5) 的解释，依赖注入（dependency injection，DI） **属于一种软件设计模式，是实现控制反转的一种手段**。这种模式使得 **一个对象可以接收并使用它所依赖的其他对象**，并且 **只有在显示注入了依赖之后，接收方才能使用该依赖对象**。

通常在编程语言的角度，**接收方一般是对象或者构造函数/Class**，而 **依赖都采用变量的形式**。该模式的目的就是为了 **分离关注点，分离接收方与依赖**，从而实现 **低耦合与代码复用**。

### 控制反转

根据 [维基百科](https://zh.wikipedia.org/wiki/%E6%8E%A7%E5%88%B6%E5%8F%8D%E8%BD%AC) 的解释，控制反转（Inversion of Control，IoC） 则是一种 **设计原则**，主要目的是 **降低代码耦合度**，而 **依赖注入** 就是该原则的实现方式之一。

一般来说，如果要在一个构造函数中使用另外的构造函数定义的对象，常见的方法就是在该构造函数执行时调用依赖的另一个构造函数执行实例化，拿到对应实例进行后续操作。而 **控制反转则是在外部统一执行相关的构造函数的实例化，而当某个构造函数依赖另外的一个对象时，会有一个依赖调度系统找到该函数依赖的这些对象并将其引用地址传递给它**。

> `Injector` 模块就是这个 **依赖调度系统**，用来连接每个模块之间的依赖调用。

## 基础使用方式

在使用时，**Injector 需要我们预先编辑好模块/组件定义**，之后组合成一个 **对象数组** 的形式当做参数传递给 **Injector** 用来实例化一个注入器与各个模块。

例如：

```javascript
import { Injector } from 'didi';

function Car(engine) {
  this.start = function() {
    engine.start();
  };
}

function createPetrolEngine(power) {
  return {
    start: function() {
      console.log('Starting engine with ' + power + 'hp');
    }
  };
}

const power = 1184

const carModule = {
  'car': ['type', Car],
  'engine': ['factory', createPetrolEngine],
  'power': ['value', power]
};

const injector = new Injector([
  carModule
]);

console.log(injector);

injector.get('car').start();

injector.invoke(function(car) {
  console.log('started', car);
});
```

此时控制台会打印以下内容：

![image-20221215094521251](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094521251.png)

可以看到 **传递的模块定义（被修改后的）被保留在 `Injector` 实例的 `_providers` 属性中，而每个模块的 实例/预设值 都在 `Injector` 实例的 `_instances` 属性里面。**而后面通过 `injector.get('car').start()` 就可以获取到 模块定义 `Car` 所产生的实例并正确执行 `start` 方法；而通过 `injector.invoke(function (car) {})` 也可以正确读取到 `Car` 模块的实例并 **立即执行 `invoke` 传递的函数**。

那么在 `new Injector(modules)` 时到底发生了什么呢？我们接着往下看。

## Injector 构造函数

该构造函数实际位于 [didi/lib/injector.js](https://github.com/nikku/didi/blob/master/lib/injector.js)，相关代码一共约 400+ 行。

首先，先浏览一下该函数的整体构成：

```javascript
export default function Injector(modules, parent) {
  parent = parent || {
    get: function(name, strict) {
      currentlyResolving.push(name);
      if (strict === false) {
        return null;
      } else {
        throw error(`No provider for "${ name }"!`);
      }
    }
  };

  const currentlyResolving = [];
  const providers = this._providers = Object.create(parent._providers || null);
  const instances = this._instances = Object.create(null);

  const self = instances.injector = this;

  const error = function(msg) {
    const stack = currentlyResolving.join(' -> ');
    currentlyResolving.length = 0;
    return new Error(stack ? `${ msg } (Resolving: ${ stack })` : msg);
  };

  function get(name, strict) {}

  function fnDef(fn, locals) {}

  function instantiate(Type) {}

  function invoke(func, context, locals) {}

  function createPrivateInjectorFactory(childInjector) {}

  function createChild(modules, forceNewInstances) {}

  const factoryMap = {
    factory: invoke,
    type: instantiate,
    value: function(value) {
      return value;
    }
  };

  function createInitializer(moduleDefinition, injector) {}

  function loadModule(moduleDefinition) {}

  function resolveDependencies(moduleDefinitions, moduleDefinition) {}

  function bootstrap(moduleDefinitions) {}

  // public API
  this.get = get;
  this.invoke = invoke;
  this.instantiate = instantiate;
  this.createChild = createChild;

  // setup
  this.init = bootstrap(modules);
}
```

在 `Injector` 函数中，首先是定义了一系列的方法和 **实例属性**，最后通过 `bootstrap` 方法执行 **modules** 的解析。

那么我们就从 `bootstrap` 开始吧。

### bootstrap 初始化

方法内部定义如下：

```javascript
function bootstrap(moduleDefinitions) {
  const initializers = moduleDefinitions.reduce(resolveDependencies, []).map(loadModule);

  let initialized = false;

  return function() {
    if (initialized) {
      return;
    }
    initialized = true;
    initializers.forEach(initializer => initializer());
  };
}
```

这个函数还是比较好理解的，首先就是 **扁平化处理(递归处理 `__depends__` 配置)** 我们 **`new Injector(modules)` 时** 传递的 **modules** 模块定义，然后执行 `loadModule` 处理每个模块，最后返回一个闭包函数。

注意这个闭包函数中保存了一个 **布尔值 initialized**，在首次调用该返回函数之后就会将 `initialized` 设置为 `true`，目的也是为了 **防止多次触发模块解析和模块实例化**。

而最后面的 `initializers.forEach(initializer => initializer())` 也暴露了 `loadModule` 最后返回的应该是一个 **函数**。

### resolveDependencies 依赖解析

这个函数从定义来看是一个 **递归函数，并且参数是 模块定义数组，返回值一样也是模块定义数组**，只是内部做了 **前置依赖提取和重复定义覆盖**。

```javascript
function resolveDependencies(moduleDefinitions, moduleDefinition) {
  if (moduleDefinitions.indexOf(moduleDefinition) !== -1) {
    return moduleDefinitions;
  }
  
  moduleDefinitions = (moduleDefinition.__depends__ || []).reduce(resolveDependencies, moduleDefinitions);

  if (moduleDefinitions.indexOf(moduleDefinition) !== -1) {
    return moduleDefinitions;
  }

  return moduleDefinitions.concat(moduleDefinition);
}
```

这里的处理过程如下：

1. 如果 **已解析的模块定义数组** 内已经包含了该模块定义，则直接退出
2. 遍历 **新模块定义的 `__depends__` 配置**，并将所有依赖 **合并到已解析模块定义数组中**
3. 重新判读 **已解析的模块定义数组中** 是否包含新的模块定义
4. 将新的模块定义拼接到已解析模块数组中

例如我们上面例子中的 `carModule`，我们新增加一个 `driverModule`，里面有一个 `Driver` 构造函数。

```javascript
// 还是上面的 Car，createPetrolEngine，power 不变，我们新增加一个 Driver 和 driverModule

function Driver() {
  this.drive = function () {
    console.log('The driver started driving')
  }
}

const driverModule = {
  driver: ['type', Driver]
}

const carModule = {
  __depends__: [driverModule],
  car: ['type', Car],
  engine: ['factory', createPetrolEngine],
  power: ['value', power]
}

const injector = new Injector([carModule])
```

此时在 `resolveDependencies` 时，它接收到的参数是这样的：

![image-20221215094606021](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094606021.png)

而处理结束之后，返回的模块定义是这样的：

![image-20221215094617165](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094617165.png)



**虽然没有改变原来的树形模块定义的结构，但是把所有的深层依赖的模块定义都复制了一个引用地址到第一层中**，所以后面的逻辑中才能直接忽略掉 `__depends__` 配置。

### loadModule 模块加载和处理

其实这个函数的功能也可以看做是 “**模块定义格式化及构建模块初始化方法**” 的过程，因为内部主要是 **解析 `resolveDependencies` 后的模块定义，并按照规则为可以使用的模块创建并返回一个模块实例的初始化方法**，注意，这说的是 **可以使用的模块**。

源码如下：

```javascript
function loadModule(moduleDefinition) {
  const moduleExports = moduleDefinition.__exports__;
  
  if (moduleExports) {
    const nestedModules = moduleDefinition.__modules__;
    const clonedModule = Object.keys(moduleDefinition).reduce((clonedModule, key) => {
      if (key !== '__exports__' && key !== '__modules__' && key !== '__init__' && key !== '__depends__') {
        clonedModule[key] = moduleDefinition[key];
      }
      return clonedModule;
    }, Object.create(null));

    const childModules = (nestedModules || []).concat(clonedModule);
    const privateInjector = createChild(childModules);
    const getFromPrivateInjector = annotate(function(key) {
      return privateInjector.get(key);
    });
    moduleExports.forEach(function(key) {
      providers[key] = [ getFromPrivateInjector, key, 'private', privateInjector ];
    });
    const initializers = (moduleDefinition.__init__ || []).slice();
    initializers.unshift(function() {
      privateInjector.init();
    });
    moduleDefinition = Object.assign({}, moduleDefinition, {
      __init__: initializers
    });

    return createInitializer(moduleDefinition, privateInjector);
  }

  Object.keys(moduleDefinition).forEach(function(key) {
    if (key === '__init__' || key === '__depends__') {
      return;
    }
    if (moduleDefinition[key][2] === 'private') {
      providers[key] = moduleDefinition[key];
      return;
    }
    const type = moduleDefinition[key][0];
    const value = moduleDefinition[key][1];
    providers[key] = [ factoryMap[type], arrayUnwrap(type, value), type ];
  });

  return createInitializer(moduleDefinition, self);
}
```

这里可以分成 **两个部分** 来看，一个是 **模块定义中含有 `__exports__` 的类型**，另一个是 **正常的模块定义类型**。有什么区别呢？我们先分析一下它的处理逻辑就知道了。

**首先是含有 `__exports__` 的一类**：

1. 与 `resolveDependencies` 解析 `__depends__` 类似，这里会 **去除掉一些特定关键字配置**，然后解析模块定义中通过 `__modules__` 定义的 **嵌套模块**，并 **合并到当前的模块定义对象中**
2. 然后按照合并后的模块定义调用 `createChild` 创建一个 **`privateInjector`**，这个 `privateInjector` 可以看做是当前我们 `new Injector` 的一个 **子注入器，只能给这几个模块使用**
3. 遍历 `__exports__` 数组，为每一个导出模块重新创建一个 **新的实例获取方法并标记为 `private` 私有模块**
4. 最后就是重新处理模块定义与实例化方法，并添加一个 `__init__` 配置保证 **子注入器能正确初始化**，然后返回实例化方法

**然后是正常的模块配置**：

1. 遍历模块定义对象，排除指定关键字 `__init__` 和 `__depends__`（这里只排除这两个也就是说明，**只有在具有 `__exports__` 的时候才会有 `__modules__` 嵌套模块配置**）
2. 处理 `private` 私有模块，不对其模块定义进行处理直接返回
3. 根据每个模块的类型进行标准化处理
4. 最后返回一个完整的初始化方法

> 并且这里需要注意的是，**除了依赖定义会按引用地址去重之外，最后保存每个依赖定义的时候也是直接 `providers[key] = xxx`，这种情况就表示，一定情况下可以在后面用 相同名字的 依赖定义来覆盖原有的依赖定义**，这部分也是后面实现 bpmn.js 自定义的一个重要原理。

这里有一个 `factoryMap` 对象和一个 `arrayUnwrap` 方法。其源码和作用如下：

```javascript
const factoryMap = {
  factory: invoke,
  type: instantiate,
  value: function(value) {
    return value;
  }
};

function instantiate(Type) {
  const { fn, dependencies } = fnDef(Type);
  const Constructor = Function.prototype.bind.apply(fn, [ null ].concat(dependencies));
  return new Constructor();
}

function invoke(func, context, locals) {
  const { fn, dependencies } = fnDef(func, locals);
  return fn.apply(context, dependencies);
}

function arrayUnwrap(type, value) {
  if (type !== 'value' && isArray(value)) {
    value = annotate(value.slice());
  }
  return value;
}

function annotate(...args) {
  if (args.length === 1 && isArray(args[0])) {
    args = args[0];
  }

  args = [ ...args ];
  const fn = args.pop();
  fn.$inject = args;

  return fn;
}
```

**`factoryMap` 主要定义我们模块定义可用的几种定义类型**：

- `factory`：工厂类型，其定义一般 **是一个依赖某些模块实例的执行函数**
- `type`：实例类型，**一般这时候是定义的一个构造函数，内部会依赖其他模块实例**
- `value`：**常规值类型**，直接使用该依赖定义的一些值或者对象

**`arrayUnwrap` 则是处理 以数组形式声明依赖的模块定义，如果是这种形式的话会转换成 `fn.$inject = [xxx]` 的形式**。

### createInitializer 初始化方法创建

这个方法就是在 **loadModule 模块加载处理结束之后用来创建每个模块的实例化方法的**。

```javascript
function createInitializer(moduleDefinition, injector) {
  const initializers = moduleDefinition.__init__ || [];
  return function() {
    initializers.forEach(initializer => {
      if (typeof initializer === 'string') {
        injector.get(initializer);
      } else {
        injector.invoke(initializer);
      }
    });
  };
}
```

可以发现这个方法其实就是处理 `__init__` 中定义的模块，遍历该配置执行 `injector.get` 或者 `injector.invoke` 去读取某个依赖实例或者执行某个方法。

> 其实这里就可以发现，通过 `injector` 来处理的依赖，**如果这个依赖定义是一个构造函数的话，只有首次通过 `injector.get()` 去调用这个依赖时才会进行该依赖的实例化**。
>
> 并且在实例化注入器之后执行 `injector.init()` **只会初始化所有模块定义中 `__init__` 配置的依赖对象**。

此时 `Injector` 的实例化过程基本就结束了，整个过程中其实就是 **遍历每个模块定义，对每个模块定义中的依赖定义进行 标准化处理，并解析 `__exports__` 导出、`__init__` 立即初始化等配置**。

## Injector 实例属性与方法

从最开始的构造函数预览中就看到了 `Injector` 实例具有那些方法，这里再完整的对实例上的每个方法和属性进行一些解释。

### 属性 `_providers`

这里面保存了所有 **可用的依赖的标准化定义**，按照 `{ [依赖名]：标准化依赖定义 }` 的形式保存。

### 属性 `_instances`

与 `_providers` 刚好相反，这里保存的是 **所有可用依赖的具体依赖对象**，按照 `{ [依赖名]：依赖对象引用地址 }` 的形式保存。

### 方法 `init`

这个方法在上面也刚刚提到，用来 **遍历所有模块定义中的 `__init__` 指定依赖，并分别执行一次 `get` 操作来确保所有依赖实例均被创建**。

### 方法 `createChild`

用来创建一个 **子注入器**，也接收一个 `modules` 模块定义数组 与一个 **指定依赖对象的依赖名数组（可选）**。

但是 **子注入器产生的依赖实例与原 `Injector` 的依赖实例 不是同一实例**。

我们还是以之前的 `CarModule` 为例：

```javascript
import { Injector } from 'didi'

function Car(engine) {
  this.start = function () {
    engine.start()
  }
}

function ChildCar(engine) {
  this.start = function () {
    console.log('child car')
    engine.start()
  }
}

function createPetrolEngine(power) {
  return {
    start: function () {
      console.log('Starting engine with ' + power + 'hp')
    }
  }
}

const power = 1184

const carModule = {
  car: ['type', Car],
  engine: ['factory', createPetrolEngine],
  power: ['value', power]
}

const injector = new Injector([carModule])

const child = injector.createChild([{ car: ['type', ChildCar] }], ['engine'])

child.get('car').start()
injector.get('car').start()

console.log(child.get('car') === injector.get('car'))
console.log(child.get('engine') === injector.get('engine'))
```

此时打印结果如下：

![image-20221215094659361](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094659361.png)



可以发现 **不只是新定义的依赖产生的依赖对象不一样，连我们在 `createChild` 是指定的依赖也会创建一个新依赖对象**。

那么如果不指定别的依赖只单纯定义呢？我们保留上面的代码只把 `createChild` 的第二个参数移除掉看什么什么情况。

```javascript
const child = injector.createChild([{ car: ['type', ChildCar] }])

child.get('car').start()
injector.get('car').start()

console.log(child.get('car') === injector.get('car'))
console.log(child.get('engine') === injector.get('engine'))
```

此时打印结果就又不一样了：

![image-20221215094709333](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094709333.png)



说明 **只要是在使用 `createChild` 创建子注入器的时候，通过指定当前注入器的依赖对象名来创建子注入器也会重新创建一个依赖对象**。

### 方法 `instantiate`

这个方法的源码呢在上面的 `loadModule` 部分已经有展示过了，就省略掉这部分代码。

整个方法的作用其实就是 **接收一个符合规范的依赖定义，把其转为构造函数之后创建一个对应的实例然后返回**。

但是，也就是因为 **这个依赖定义会被转换成一个 “构造函数”，所以返回值始终是一个对象；而且也因为没有依赖名，所以这个对象实例和定义都不会被保存在 `injector` 实例中**

例如:

```javascript
import { Injector } from 'didi'

const returnedObj = {}
function ObjCls() {
  return returnedObj
}
function StringCls() {
  return 'some string'
}
function NumberCls() {
  return 123
}

class Foo {
  constructor(abc1, baz1) {
    this.abc = abc1
    this.baz = baz1
  }
}
Foo.$inject = ['abc', 'baz']

const module = {
  baz: ['value', 'baz-value'],
  abc: ['value', 'abc-value']
}

const injector = new Injector([module])

console.log(injector.instantiate(Foo))
console.log(injector.instantiate(ObjCls))
console.log(injector.instantiate(StringCls))
console.log(injector.instantiate(NumberCls))
console.log(injector)
```

最终打印结果如下：

![image-20221215094719409](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094719409.png)



### 方法 `get` 与 `invoke`

这两个方法在上面的内容中都有提到，`get` 是用来 **获取指定的依赖对象实例，如果不存在则会创建后返回，且每次 `get` 操作获取的对象都是同一个对象**；`invoke` 则是 **接收一个指定依赖的函数，然后调用指定依赖执行该函数**，并且 **`invoke` 可以接收一个 指定上下文 和 指定依赖集合**。

例如：

```js
import { Injector } from 'didi'

class BazType {
  constructor() {
    this.name = 'baz'
  }
}

const injector = new Injector([
  {
    foo: [
      'factory',
      function () {
        return {
          name: 'foo'
        }
      }
    ],
    bar: ['value', 'bar value'],
    baz: ['type', BazType]
  }
])

console.log(injector.get('foo'))
console.log(injector.get('bar'))
console.log(injector.get('baz'))
console.log(injector.get('foo') === injector.get('foo'))
```

![image-20221215094733367](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094733367.png)



```js
import { Injector } from 'didi'

class FooType {
  constructor() {
    this.fooIns = 'Foo instance'
  }
}

const injector = new Injector([
  {
    foo: ['type', FooType]
  }
])

console.log(injector.get('foo'))

const annotatedFn = [
  'foo',
  'bar',
  function (foo, bar) {
    console.log(foo)
    console.log(bar)
    console.log(foo === injector.get('foo'))
  }
]

injector.invoke(annotatedFn, null, { foo: new FooType(), bar: undefined })
```

![image-20221215094749591](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094749591.png)

## 依赖引用方式

在上面的介绍中有说过，`Injector` 支持的依赖定义类型可以在 `factoryMap` 中查到，也就是 **支持构造函数/类、函数、指定值或对象**，其中 **只有 构造函数/类 才会被实例化成一个依赖对象提供出来**，并且这个 **构造函数/类 也可以依赖其他对象**。现在就详细介绍一下依赖引用有哪些方式吧。

> 这部分功能实现的代码在 `didi/lib/annotation.js` 中。

在 `Injector` 实例遇到需要 **解析依赖关系生成实例（instantiate）或者调用依赖执行处理函数（invoke）时，都会使用 `fnDef` 来解析**。而 `fnDef` 的大致过程如下：

```js
function fnDef(fn, locals) {
  if (typeof locals === 'undefined') locals = {};

  if (typeof fn !== 'function') {
    if (isArray(fn)) fn = annotate(fn.slice());
  }

  const inject = fn.$inject || parseAnnotations(fn);
  const dependencies = inject.map(dep => hasOwnProp(locals, dep) ? locals[dep] : get(dep));

  return { fn, dependencies };
}

// didi/lib/annotation.js
export function annotate(...args) {
  if (args.length === 1 && isArray(args[0])) {
    args = args[0];
  }
  args = [ ...args ];
  const fn = args.pop();
  fn.$inject = args;
  
  return fn;
}
const CONSTRUCTOR_ARGS = /constructor\s*[^(]*\(\s*([^)]*)\)/m;
const FN_ARGS = /^(?:async\s+)?(?:function\s*[^(]*)?(?:\(\s*([^)]*)\)|(\w+))/m;
const FN_ARG = /\/\*([^*]*)\*\//m;

export function parseAnnotations(fn) {
  if (typeof fn !== 'function') {
    throw new Error(`Cannot annotate "${fn}". Expected a function!`);
  }

  const match = fn.toString().match(isClass(fn) ? CONSTRUCTOR_ARGS : FN_ARGS);
  if (!match) {
    return [];
  }
  const args = match[1] || match[2];

  return args && args.split(',').map(arg => {
    const argMatch = arg.match(FN_ARG);
    return (argMatch && argMatch[1] || arg).trim();
  }) || [];
}
```

1. 如果传入的依赖定义是一个 **数组**，则调用 `annotate` 将 **除最后一个参数（fn）之外的其他参数转成数组保存在 `fn.$inject` 中**
2. 如果直接传入一个函数的话，就直接读取函数的 `$inject` 属性或者通过 `parseAnnotations`**解析函数参数中的注释为依赖**
3. 最后 **遍历依赖数组从指定位置或者 `Injector` 实例中获取依赖实例保存到 `dependencies` 中**，然后返回函数和依赖对象

所以综合一下，声明外部依赖可以使用三种方式：

1. **推荐方式**，通过 `fn.$inject` 声明一个依赖对象数组
2. 通过数组方式，将外部依赖作为数组元素，在数组末尾插入函数定义
3. 通过在函数参数中定义每个参数的注释来声明依赖

例如：

```js
import { Injector } from 'didi'

class Foo {
  constructor() {
    this.fooIns = 'Foo instance'
  }
}

class Bar {
  constructor(foo) {
    this.foo = foo
    this.bar = 'bar'
  }
}
Bar.$inject = ['foo']

class Baz {
  constructor(/* bar */ a) {
    this.bar = a
    this.baz = 'baz'
  }
}

class Car {
  constructor(bar, baz, foo) {
    this.car = 'car'
    this.bar = bar
    this.baz = baz
    this.foo = foo
  }
}

function invokeBar(/* bar */ bar) {
  console.log('invoke bar', bar)
}

function invokeBaz(baz) {
  console.log('invoke baz', baz)
}
invokeBaz.$inject = ['baz']

const modules = [
  {
    __init__: ['invokeBar', 'invokeBaz'],
    foo: ['type', Foo],
    bar: ['type', Bar],
    baz: ['type', Baz],
    car: ['type', ['bar', 'baz', 'foo', Car]],
    invokeBar: ['factory', invokeBar],
    invokeBaz: ['factory', invokeBaz]
  }
]

const injector = new Injector(modules)
injector.init()

console.log(injector.get('car'))
console.log(injector)
```

![image-20221215094806621](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221215094806621.png)



可见这三种方式声明的依赖都是可以正确识别的，但是官方更加推荐的写法是 `Fn.$inject = ['dep1', 'dep2']`。

## 本章小节

作为 `bpmn.js` 与 `diagram.js` 的模块化系统的底层依赖，`Injector` 通过 **依赖注入** 的形式完美分开了不同功能模块之前的核心代码，保证使用者 **只需要了解所需依赖的功能，然后专注于各自模块的核心逻辑开发即可**。而 `Injector` 在处理依赖时 **遵循的时同名依赖定义后者覆盖前者**，所以在使用时我们也可以 **通过覆盖官方原有的依赖模块来实现自定义操作**。



