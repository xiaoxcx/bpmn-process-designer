从开篇介绍的 `bpmn-js` 依赖图中，我们可以发现 `bpmn-js` 在 **图元素** 的操作上依赖 `daigram-js`，而与 `XML` 之间的转换则是需要依赖 `bpmn-moddle`，但 `bpmn-moddle` 的依赖之一 `moddle-xml` 和它本身其实都有一个依赖包 —— `moddle`。

所以我们对 `bpmn-js` 解析处理 `xml` 的过程就从 `moddle` 开始。

![image-20221105215604929](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20221105215604929.png)

## 从入口开始

关于 `Moddle`，它的介绍是 `A library for importing meta-model based file formats into JS`，即“一个用于导入元模型文件的js库”。核心文件都在 `lib` 文件夹中，入口是 `index.js`。

`Moddle` 的最大作用就是，**提供了一种通过 `json` 文件来定义 `XML` 元模型的方式，并且实现 `XML` 字符串与 `JavaScript` 对象之间的转换**。

进入到 `index.js` 入口文件中，会发现这里只有几个默认导出的方法：

```js
// 默认导出 Moddle 类
export {
  default as Moddle
} from './moddle.js';

// 导出一个 parseNameNS 的方法
export {
  parseName as parseNameNS
} from './ns.js';

// 导出三个类型判断的方法
export {
  isBuiltIn as isBuiltInType,
  isSimple as isSimpleType,
  coerceType
} from './types.js';
```

当然，由于 `Moddle.js` 本身也需要引用下面的几个方法，所以我们先从下面的方法开始。

## ParseNameNS - 命名空间解析

这个函数的作用很简单，就是 **从一个字符串中解析出来命名空间前缀和属性（标签）名称，然后组合成一个标准对象**；如果字符串格式不对，则抛出异常。

```js
export function parseName(name, defaultPrefix) {
  var parts = name.split(/:/),
      localName, prefix;

  // no prefix (i.e. only local name)
  if (parts.length === 1) {
    localName = name;
    prefix = defaultPrefix;
  } else

  // prefix + local name
  if (parts.length === 2) {
    localName = parts[1];
    prefix = parts[0];
  } else {
    throw new Error('expected <prefix:localName> or <localName>, got ' + name);
  }

  name = (prefix ? prefix + ':' : '') + localName;

  return {
    name: name, // 完整名称
    prefix: prefix, // 命名空间
    localName: localName // 属性（标签）名
  };
}
```

代码其实也很简单：

- 将 `name` 参数按照 `:` 进行拆分，得到数组 `parts`
  1. 如果 `parts` 长度为 1，则默认传递的是一个没有命名空间的属性，那么设置命名空间是 `defaultPrefix`
  2. 如果长度是 2，则默认冒号前半截是命名空间 `prefix`，后半截是属性名
  3. 如果长度大于 3，则抛出异常
- 如果 此时 `prefix` 没有确定值的话，则会直接保留属性名 `localName`

最终，会根据上面的结果组装成一个包含 `name，prefix，localName` 的对象。例如：

![image-20231107172712578](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231107172712578.png)

这个方法 **通常用来解析 `XML` 中的标签名或者属性名，验证是否是已经注册的合法属性**，如果是没有注册的属性或者标签的话，则会在后面的过程中进行其他处理。

## Types - 内置的类型校验

整个 `types.js` 其实只有一个功能：预设几种属性类型并提供几个类型判断的方法。

这些方法，主要目的是 **将从 `XML` 中解析出来的属性，转换成符合预设的类型定义的值**。

源码如下：

```js
// 预设的 moddle 类型
var BUILTINS = {
  String: true,
  Boolean: true,
  Integer: true,
  Real: true,
  Element: true
};

// 上面的内置类型对应的实际值转换方法
var TYPE_CONVERTERS = {
  String: function(s) { return s; },
  Boolean: function(s) { return s === 'true'; },
  Integer: function(s) { return parseInt(s, 10); },
  Real: function(s) { return parseFloat(s); }
};

// 将解析值与其类型转换成实际值，Element 类型则不处理
export function coerceType(type, value) {
  var converter = TYPE_CONVERTERS[type];

  if (converter) {
    return converter(value);
  } else {
    return value;
  }
}

// 判断是否是内置类型
export function isBuiltIn(type) {
  return !!BUILTINS[type];
}

// 判断是否是简单类型
export function isSimple(type) {
  return !!TYPE_CONVERTERS[type];
}
```

其中 `moddle` 可以支持两种大类型的数据：简单类型（布尔、字符串、整数和小数）与对象类型（`Element`，在这里一般代指对象）；其中引用类型基本上只适用于 `Object` 对象，而不支持 `Array` 数组或者 `Map、Set` 之类的数据结构。

并且，由于 `XMl` 在解析时是当做字符串来处理的，所以解析出来的属性值一般都是字符串，这里就需要用 `Converter` 转换器来进行对应的转换。而默认的 `Converter` 只有简单类型对应的 4 个转换器：

- `String`：直接返回当前值（因为最初解析出来就是字符串格式）
- `Boolean`：只有 `'true'` 字符串才会当成 `true`
- `Integer`：整数类型，通过 `parseInt` 转化为 **十进制** 整数
- `Real`：小数类型，通过 `parseFloat` 进行转换

 

当我们记住了这几个工具方法之后，就可以开始研究 `moddle.js` 了。

## Moddle - 用于构建特定类型的元素的类

既然是作为可以 **创建** 特定类型元素的模块，肯定需要知道 **有哪些特定的类型以及每个类型的具体属性**，以及 **提供创建方法**。

所以 **Moddle** 的构造函数本身会接收一个参数 `packages`，用来声明有哪些特定类型的元素或属性；另外还接收一个 `config` 配置，用来确认是否需要使用严格模式创建元素。

> `strict` 开启时，会抛出一个异常中断代码执行，否则只会在控制台打印警告。

`Moddle` 函数内部，依赖 `Properties，Factory，Registry` 三个构造函数，其中：

- `Properties` 是用于获取和设置模型元素的属性的实用程序
- `Factory` 是用于创建指定类型元素的实例，并且内部的示例创建方法，实际上是构建一个新的 `ModdleElement` 类型的对象实例
- `Registry` 则是一个注册表程序，会解析 `packages` 数组中的所有元素与属性定义，并生成一个 `typeMap` 的对象

在 `Moddle` 实例创建的过程中，会为 `moddle` 实例创建以上三个类型对应的实例属性，并且这四个实例之间还存在互相引用的关系。

```js
export default function Moddle(packages, config = {}) {

  this.properties = new Properties(this);

  this.factory = new Factory(this, this.properties);
  this.registry = new Registry(packages, this.properties);

  this.typeCache = {};

  this.config = config;
}
```

首先，我们先分析一下这四个类型分别提供了哪些方法。

### Moddle.prototype

在 `Moddle` 的原型上，一共定义了 9 个方法：

```js
// 传入一个类型定义 descriptor 和 属性定义，创建一个指定类型的元素实例
Moddle.prototype.create = function(descriptor: string | object, attrs?: object) {}

// 根据传入的类型定义，返回该类型定义对应的 元素创建构造函数
Moddle.prototype.getType = function(descriptor: string | object) {}

// 直接根据 name 与 nsUri 创建一个具有 properties 中定义属性的对象
Moddle.prototype.createAny = function(name: string, nsUri: string, properties?: object) {}

// 通过uri或前缀返回已注册的类型定义 json 对象
Moddle.prototype.getPackage = function(uriOrPrefix: string) {}

// 返回所有已注册的 json 数组
Moddle.prototype.getPackages = function() {}

// 获取一个对象实例对应的具体类型定义
Moddle.prototype.getElementDescriptor = function(element: ModdleElement) {}

// 判断一个类型是否是属于指定元素定义的，省略元素实例时会查询所有已注册类型
Moddle.prototype.hasType = function(element: ModdleElement, type: string) {}
Moddle.prototype.hasType = function(type: string) {}

// 返回 property 指定的属性对应的属性定义
Moddle.prototype.getPropertyDescriptor = function(element: ModdleElement, property: unkown) {}

// 返回指定类型 type 对应的类型定义
Moddle.prototype.getTypeDescriptor = function(type: string) {}

```

从方法说明上不难看出，这几个方法主要是用来 **创建元素实例或者读取/判断元素属性** 的。

假设我们此时有这样一个 json 文件，用来进行元素类型定义：

```json
{
  "name": "Properties",
  "uri": "http://properties",
  "prefix": "props",
  "types": [
    {
      "name": "Complex",
      "properties": [
        { "name": "id", "type": "String", "isAttr": true, "isId": true }
      ]
    },
    {
      "name": "ComplexAttrs",
      "superClass": [ "Complex" ],
      "properties": [
        { "name": "attrs", "type": "Attributes", "serialize": "xsi:type" }
      ]
    },
    {
      "name": "ComplexAttrsCol",
      "superClass": [ "Complex" ],
      "properties": [
        { "name": "attrs", "type": "Attributes", "isMany": true, "serialize": "xsi:type" }
      ]
    },
    {
      "name": "ComplexCount",
      "superClass": [ "Complex" ],
      "properties": [
        { "name": "count", "type": "Integer", "isAttr": true }
      ]
    },
    {
      "name": "ComplexNesting",
      "superClass": [ "Complex" ],
      "properties": [
        { "name": "nested", "type": "Complex", "isMany": true }
      ]
    },
    {
      "name": "SimpleBody",
      "superClass": [ "Base" ],
      "properties": [
        { "name": "body", "type": "String", "isBody": true }
      ]
    },
    {
      "name": "SimpleBodyProperties",
      "superClass": [ "Base" ],
      "properties": [
        { "name": "intValue", "type": "Integer" },
        { "name": "boolValue", "type": "Boolean" },
        { "name": "str", "type": "String", "isMany": true }
      ]
    },
    {
      "name": "Base"
    },
    {
      "name": "BaseWithId",
      "superClass": [ "Base" ],
      "properties": [
        { "name": "id", "type": "String", "isAttr": true, "isId": true }
      ]
    },
    {
      "name": "BaseWithNumericId",
      "superClass": [ "BaseWithId" ],
      "properties": [
        { "name": "idNumeric", "type": "Integer", "isAttr": true, "redefines": "BaseWithId#id", "isId": true }
      ]
    },
    {
      "name": "Attributes",
      "superClass": [ "BaseWithId" ],
      "properties": [
        { "name": "realValue", "type": "Real", "isAttr": true },
        { "name": "integerValue", "type": "Integer", "isAttr": true },
        { "name": "booleanValue", "type": "Boolean", "isAttr": true },
        { "name": "defaultBooleanValue", "type": "Boolean", "isAttr": true, "default": true }
      ]
    },
    {
      "name": "SubAttributes",
      "superClass": [ "Attributes" ]
    },
    {
      "name": "Root",
      "properties": [
        { "name": "any", "type": "Base", "isMany": true }
      ]
    },
    {
      "name": "Embedding",
      "superClass": [ "BaseWithId" ],
      "properties": [
        { "name": "embeddedComplex", "type": "Complex" }
      ]
    },
    {
      "name": "ReferencingSingle",
      "superClass": [ "BaseWithId" ],
      "properties": [
        { "name": "referencedComplex", "type": "Complex", "isReference": true, "isAttr": true }
      ]
    },
    {
      "name": "ReferencingCollection",
      "superClass": [ "BaseWithId" ],
      "properties": [
        { "name": "references", "type": "Complex", "isReference": true, "isMany": true }
      ]
    },
    {
      "name": "ContainedCollection",
      "superClass": [ "BaseWithId" ],
      "properties": [
        { "name": "children", "type": "Complex", "isMany": true }
      ]
    },
    {
      "name": "MultipleSuper",
      "superClass": ["Base","BaseWithId","SimpleBody"]
    }
  ]
}
```

当我们使用这个 `Properties.json` 进行元素与属性的注册时，返回的 `model` 实例会包含以下内容：

```js
import { Moddle } from 'moddle'
import Properties from '../../model/properties.json'

const model = new Moddle([Properties])
```

![image-20231113135022709](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231113135022709.png)

其中 `factory` 与 `properties` 属性由于互相依赖的关系，与 `model` 实例存在一个循环引用；而 `registry` 中则是保存了传递进去的 `descriptor json` 定义与每种元素/属性的具体配置。

### model.create 实例创建

当我们通过 `model.create` 方法创建一个实例时，实际上返回的实例类型是 `ModdleElement`：

```js
const complexTypeInst = model.create('props:Complex', { name: 'complex', id: 'complex', idx: 1 })
const simpleBodyInst = model.create('props:SimpleBody', { body: 'simple', idx: 2 })
const attributesInst = model.create('props:Attributes', { attrs: [complexTypeInst, simpleBodyInst], idx: 3 })
console.log(complexTypeInst, simpleBodyInst, attributesInst)
```

![image-20231113135837753](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231113135837753.png)

为什么不是 `Moddle` 或者 `Factory` 等构造函数中的一种呢？这需要从源码中一步一步来理解。

首先，我们需要先了解一下 `Properties` 与 `Registry。`

## Properties - 模型实例的属性管理与配置

从 `Moddle` 构造函数那里可以得知，`Properties` 需要依赖 `Moddle` 的实例对象 `model`。

```js
export default function Properties(model) {
  this.model = model;
}
```

然后， `Properties` 提供了实例属性 **改与查** 两个类型的方法：

- 查：`get` 与 `getProperty`
- 改：`set` 与 `define`、`defineDescriptor`、`defineModel`

### `set` - 修改属性

接收三个参数 `target, name, value`，即 **接收一个目标对象 `taeget`，将 `name` 属性值设置为 `value`**。但是与 `Object.defineProperty` 和 `Reflect.set` 两个方法不同的是，这里会 **校验 `name` 与 `value` 两个参数在属性定义中的合法性**。

```js
import { assign, isString } from 'min-dash';

Properties.prototype.set = function(target, name, value) {
  if (!isString(name) || !name.length) {
    throw new TypeError('property name must be a non-empty string');
  }

  var property = this.getProperty(target, name);
  var propertyName = property && property.name;

  if (isUndefined(value)) {
    if (property) {
      delete target[propertyName];
    } else {
      delete target.$attrs[stripGlobal(name)];
    }
  } else {
    if (property) {
      if (propertyName in target) {
        target[propertyName] = value;
      } else {
        defineProperty(target, property, value);
      }
    } else {
      target.$attrs[stripGlobal(name)] = value;
    }
  }
};

function isUndefined(val) {
  return typeof val === 'undefined';
}
function defineProperty(target, property, value) {
  Object.defineProperty(target, property.name, {
    enumerable: !property.isReference,
    writable: true,
    value: value,
    configurable: true
  });
}
function stripGlobal(name) {
  return name.replace(/^:/, '');
}
```

简述一下就是：首先获取到 `name` 对应的属性定义 `property`；如果传入的值 `value` 是 `undefined` 的话，合法属性（存在 `property` 定义）则从 `target` 中直接删除，否则则从 `target.$attrs` 里面删除；如果不是 `undefined` 的话，合法属性则修改 `target` 中的对应字段属性值，不合法属性则直接赋值到 `target.$attrs` 里面。

> 这也是 `bpmn-js` 中如何删除属性以及读取其他非法属性的原理。

当然，此时写入的属性 **都是可读可编辑的**，但是 `define` 方法则与之不同。

### `define` - 为元素实例添加属性

`define` 方法，在一定层度上，就是 `Object.defineProperty` 方法：

```js
Properties.prototype.define = function(target, name, options) {
  if (!options.writable) {

    var value = options.value;
    
    options = assign({}, options, {
      get: function() { return value; }
    });

    delete options.value;
  }

  Object.defineProperty(target, name, options);
};
```

当然，这里表示 **除了显示设置属性是可编辑属性**，都会删除对象上的 `value` 属性，并重新设置 `get` 方法返回指定的 `value` 值。

在这个方法的基础上，设置了 `defineDescriptor` 与 `defineModel` 方法：

```js
Properties.prototype.defineDescriptor = function(target, descriptor) {
  this.define(target, '$descriptor', { value: descriptor });
};

Properties.prototype.defineModel = function(target, model) {
  this.define(target, '$model', { value: model });
};
```

即为目标元素 `target` 设置两个 **只读属性** `$descriptor` 与 `$model`。

### get - 读取属性

与 `set` 方法正好对应，`get` 方法就是获取元素对应的属性值。如果属于合法属性，则直接返回对应属性；如果不是合法属性，则返回 `$attrs` 里面的对应属性。

> 合法属性如果定义是 `isMany`，即表示为数组格式，如果当前没有设置该属性值的话，会初始化为一个空数组再返回。

```js
Properties.prototype.get = function(target, name) {

  var property = this.getProperty(target, name);

  if (!property) {
    return target.$attrs[stripGlobal(name)];
  }

  var propertyName = property.name;

  if (!target[propertyName] && property.isMany) {
    defineProperty(target, property, []);
  }

  return target[propertyName];
};
```

### getProperty - 获取属性的定义对象

这里的方法名叫 `getProperty`，但是实际上称为 `getPropertyDescriptor` 更为恰当，即 **获取指定属性的定义的描述对象**。

本身这个方法是依赖了 `model` 实例上的 `getPropertyDescriptor` 方法，返回的是 **这个指定实例 `target` 的指定属性 `name` 对应的 `$$descriptor` 属性**。当然，如果这个 `name` 是一个未定义的非法属性，或者包含非法符号 `:`, 则都返回的是 `null`。

```js
Properties.prototype.getProperty = function(target, name) {
  var model = this.model;

  var property = model.getPropertyDescriptor(target, name);

  if (property) {
    return property;
  }

  if (name.includes(':')) {
    return null;
  }

  const strict = model.config.strict;

  if (typeof strict !== 'undefined') {
    const error = new TypeError(`unknown property <${ name }> on <${ target.$type }>`);
    if (strict) {
      throw error;
    } else {
      typeof console !== 'undefined' && console.warn(error);
    }
  }

  return null;
};
```

> 这里还会根据 `new Moddle` 时传递的 `config` 对象中的 `strict` 属性，来确定是否需要抛出错误或者异常；当 `strict` 布尔值为 `true` 时，会抛出异常直接中断执行；反之则是通过控制台打印一个警告。
>
> 这也是为什么我们在使用 `bpmn-js` 时，直接绑定未声明属性会保留在 `$attrs` 中；虽然能正常导出 `xml` 字符串，但是再次导入控制台就会报这个警告。

## Factory - 模型元素实例的创建工厂

整个 `Factory` 实际上只做一件事，就是 **创建模型元素实例**。只是这个实例除了需要 **符合模型定义之外**，还要 **具有统一的类型与属性**。

上文 `model.create` 的示例中创建的三个元素实例，打印出来的内容中就体现了这一特点 —— **类型都是 `ModdleElement`， 并且继承自 `Base` 类型，都具有 `$type, $parent, $attrs, $descriptor, $model` 等属性**。

base.js:

```js
export default function Base() { }

Base.prototype.get = function(name) {
  return this.$model.properties.get(this, name);
};

Base.prototype.set = function(name, value) {
  this.$model.properties.set(this, name, value);
};
```

factory.js:

```js
import { forEach, bind } from 'min-dash';
import Base from './base.js';

export default function Factory(model, properties) {
  this.model = model;
  this.properties = properties;
}


Factory.prototype.createType = function(descriptor) {
  var model = this.model;

  var props = this.properties,
      prototype = Object.create(Base.prototype);

  forEach(descriptor.properties, function(p) {
    if (!p.isMany && p.default !== undefined) {
      prototype[p.name] = p.default;
    }
  });

  props.defineModel(prototype, model);
  props.defineDescriptor(prototype, descriptor);

  var name = descriptor.ns.name;


  function ModdleElement(attrs) {
    props.define(this, '$type', { value: name, enumerable: true });
    props.define(this, '$attrs', { value: {} });
    props.define(this, '$parent', { writable: true });

    forEach(attrs, bind(function(val, key) {
      this.set(key, val);
    }, this));
  }
  ModdleElement.prototype = prototype;
  ModdleElement.hasType = prototype.$instanceOf = this.model.hasType;

  props.defineModel(ModdleElement, model);
  props.defineDescriptor(ModdleElement, descriptor);

  return ModdleElement;
};
```

从上面的源码中，可以看出 `Factory` 本身只有一个方法 `createType`，用来创建一个 `ModdleElement` 类型的构造函数并返回；`ModdleElement` 继承自 `Base` 类型，提供了 `get` 与 `set` 方法，借用 `Properties` 模块的 `get` 和 `set` 方法来验证属性合法性与修改查询。

在 `createType(descriptor)` 执行时，会根据 `Base` 创建一个“原型”对象 `proptotype`，将 `model` 与传入参数 `descriptor` 作为只读属性绑定到 `$model` 与 `$descriptor` 上，并读取该类型的名称 `name`。

然后定义 `ModdleElement`，当后期执行 `new ModdleElement` 时，将会把 `name` 绑定到实例的 `$type` 属性上，并初始化 `$attrs` 与 `$parent`，然后借用 `Base` 的 `set` 方法按元素定义设置对应的属性值。

最后则是绑定原型指向与定义 `$instanceOf` 方法来判断属性继承关系（这个方法其实就是从 `descriptor` 定义中解析属性的继承关系来判断，详细内容与 `Registry` 有关联）。

并且还会为 `ModdleElement` 这个构造函数绑定 `$model` 与 `$descriptor` 两个静态属性以及 `hasType` 的静态方法。



此时就剩下 `Registry` 函数还没有分析，但是在分析 `Registry` 之前我们先来看一下它的另一个依赖构造函数 `DescriptorBuilder`。

## DescriptorBuilder - 构建元素的描述对象

该构造函数执行时需要一个参数 `nameNS`，而这个参数就是 `parseNameNS` 函数返回的 `name namespace` 标准对象。

在初始化时，会生成一个对象，保存后续 `descriptor` 中会注册的类型与属性，并生成对应的 `map` 对象：

```js
export default function DescriptorBuilder(nameNs) {
  this.ns = nameNs;
  this.name = nameNs.name;
  this.allTypes = [];
  this.allTypesByName = {};
  this.properties = [];
  this.propertiesByName = {};
}
```

回到 `model.create` 实例创建 那里的截图，如果我们展开 `$descriptor` 对象，就可以发现这个对象的格式与这里的构造函数定义如出一辙。

![image-20231114142206773](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231114142206773.png)

但是与其构造函数不同的是，这里还多了 `IdProperty` 属性，并且 `propertiesByName` 中还有两种对 `id` 属性的定义 `id` 与 `props:id`。

整个 `DescriptorBuilder` 类里面，最重要的就是 `addTrait` 方法。在 `model.create()/model.getType()` 执行时，会调用 `registry.getEffectiveDescriptor(name)`，此时就需要创建一个 `DescriptorBuilder` 实例，并且通过 `addTrait` 来构建一个属性构建对象。



`addTrait` 方法接收两个参数：`t` 和 `inherited`。其中 `t` 表示 `typeDescriptor`，在实际执行过程中会是一个 **经过扩充之后的一个元素表述对象**，包含我们在 `json` 文件中定义的该类型对应的对象，具有 `superClass、properties、meta、extends` 等多个属性；而 `inherited` 是一个布尔值，表示该属性是否 **存在继承关系**。

如果存在继承关系的话，还会校验这个定义是否是 **对原有元素定义的补充**，即 **验证这个元素对象描述是否存在 `extends` 属性**，如果存在则会抛出异常。

> 这里的 **继承** 通过 `superClass` 来指定继承对象，通过 `extends` 来表示对某个原对象描述的补充；两者不能同时存在，校验顺序为 `superClass => extends`。

报错如下：

![image-20231115145616360](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231115145616360.png)



如果继承与补充校验成功之后，则是 **遍历元素描述对象中的元素属性定义数组 `properties`，根据每一个 `property` 来将其定义进行整理和标准化**。

```js
DescriptorBuilder.prototype.addTrait = function(t, inherited) {

  if (inherited) {
    this.assertNotTrait(t);
  }

  var typesByName = this.allTypesByName,
      types = this.allTypes;

  var typeName = t.name;

  if (typeName in typesByName) {
    return;
  }

  forEach(t.properties, bind(function(p) {

    p = assign({}, p, {
      name: p.ns.localName,
      inherited: inherited
    });

    Object.defineProperty(p, 'definedBy', {
      value: t
    });

    var replaces = p.replaces,
        redefines = p.redefines;

    if (replaces || redefines) {
      this.redefineProperty(p, replaces || redefines, replaces);
    } else {
      if (p.isBody) {
        this.setBodyProperty(p);
      }
      if (p.isId) {
        this.setIdProperty(p);
      }
      this.addProperty(p);
    }
  }, this));

  types.push(t);
  typesByName[typeName] = t;
};
```

> 在后面的 `forEach` 循环中，函数体里面的 `p` 变量指代的就是描述对象的 `properties` 数组中的每一项

在循环中，首先就是像 `p` 对象中合并进去 `localName` 和 `inherited` 两个字段；并设置一个只读属性 `definedBy`，标识是被那个元素定义的。

然后，需要注意四个定义：`p.replaces, p.redefines, p.isBody, p.isId`。

当 `p.replaces` 或者 `p.redefines` 为 `truth` 时，会通过 `redefineProperty()` 方法， **将原继承到的这个属性定义（即 `superClass` 中的指定类型已经定义了一个同名属性）进行重新定义**。当然，如果原来的类型不存在该定义，则会抛出异常。

```js
DescriptorBuilder.prototype.redefineProperty = function(p, targetPropertyName, replace) {
  var nsPrefix = p.ns.prefix;
  var parts = targetPropertyName.split('#');

  var name = parseNameNs(parts[0], nsPrefix);
  var attrName = parseNameNs(parts[1], name.prefix).name;

  var redefinedProperty = this.propertiesByName[attrName];
  if (!redefinedProperty) {
    throw new Error('refined property <' + attrName + '> not found');
  } else {
    this.replaceProperty(redefinedProperty, p, replace);
  }

  delete p.redefines;
};
```

从上面的代码来看，如果要定义 `replaces` 或者 `redefines` 来覆盖父级的属性定义，需要在描述对象中定义 `replaces` 或者 `redefines` 属性并设置需要覆盖的父级元素属性。

例如我们对上面的例子进行修改，会得到以下结果：

![image-20231115152044759](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231115152044759.png)

![image-20231115152223017](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231115152223017.png)

> 一定程度上来说，`replaces` 与 `redefines` 的效果基本上差不多，只是 `replaces` 会调整 `properties` 中该属性的位置：
>
> - `replaces`：将新定义移动到 `properties` 数组的最后一位
> - `redefines`：在原地替换属性定义

至于 `isId` 与 `isBody`，则更多的时候是一个 **标识作用**，用来确定这个属性是一个 `id` 属性或者 `body` 属性。

最后，通过 `addProperty` 方法，将该定义插入到 `builder` 实例中的 `properties` 数组中，并根据属性名绑定两种命名方式到 `builder` 的 `propertiesByName` 属性上。



现在，让我们回到 `Registry` 模块上~

## Registry - 元素/属性与描述对象的注册表

在 `new Moddle()` 的初始化中，除了会实例化上述对象之外，还会实例化一个 `Registry` 注册表对象。

`Registry` 对象一共有四个属性：`packageMap`、`typeMap`、`packages`、`properties`；其中 `properties` 就是上文所讲的 `Properties` 类的对应实例，而 `packages` 则是 `new Moddle` 是传递进来的 `descriptor json` 对象数组。

```js
export default function Registry(packages, properties) {
  this.packageMap = {};
  this.typeMap = {};

  this.packages = [];

  this.properties = properties;

  forEach(packages, bind(this.registerPackage, this));
}
```

当 `new Registry` 执行时，会初始化上述的 4 个属性，然后遍历 `packages` 数组，分别对每个 `descriptor json` 的内容进行解析和注册。

`registerPackage` 函数，主要负责 **验证每个属性描述对象的 `prefix` 与 `uri` 属性是否与其他定义重复**，并 **将该描述对象 `package` 保存到 `Registry` 实例的 `packageMap` 与 `packages` 属性上**。然后 **遍历每个定义中的 `types` 数组（具体的单个元素/属性定义组成的集合）调用 `registerType` 来注册到 `Registry` 实例的 `typeMap` 上面**。

```js
Registry.prototype.registerPackage = function(pkg) {
  pkg = assign({}, pkg);

  var pkgMap = this.packageMap;

  ensureAvailable(pkgMap, pkg, 'prefix');
  ensureAvailable(pkgMap, pkg, 'uri');

  forEach(pkg.types, bind(function(descriptor) {
    this.registerType(descriptor, pkg);
  }, this));

  pkgMap[pkg.uri] = pkgMap[pkg.prefix] = pkg;
  this.packages.push(pkg);
};

Registry.prototype.registerType = function(type, pkg) {

  type = assign({}, type, {
    superClass: (type.superClass || []).slice(),
    extends: (type.extends || []).slice(),
    properties: (type.properties || []).slice(),
    meta: assign(({}, type.meta || {}))
  });

  var ns = parseNameNs(type.name, pkg.prefix),
      name = ns.name,
      propertiesByName = {};

  forEach(type.properties, bind(function(p) {

    var propertyNs = parseNameNs(p.name, ns.prefix),
        propertyName = propertyNs.name;

    if (!isBuiltInType(p.type)) {
      p.type = parseNameNs(p.type, propertyNs.prefix).name;
    }

    assign(p, { ns: propertyNs, name: propertyName });

    propertiesByName[propertyName] = p;
  }, this));


  assign(type, { ns, name, propertiesByName });

  forEach(type.extends, bind(function(extendsName) {
    var extendsNameNs = parseNameNs(extendsName, ns.prefix);
    var extended = this.typeMap[extendsNameNs.name];

    extended.traits = extended.traits || [];
    extended.traits.push(name);
  }, this));

  this.definePackage(type, pkg);

  this.typeMap[name] = type;
};

function ensureAvailable(packageMap, pkg, identifierKey) {
  var value = pkg[identifierKey];
  if (value in packageMap) {
    throw new Error('package with ' + identifierKey + ' <' + value + '> already defined');
  }
}
```

当然，在 `registrerType` 的过程中，除了最后将这个元素/属性的类型声明绑定到 `typeMap` 上之外，还会处理声明中的 `properties` 属性配置。

这个处理过程中，会 **解析每一个 `property` 的属性名 `name` 字段，并且将 `properties` 中的所有属性组成一个 `propertiesByName` 对象合并到每一个元素/属性类型定义中**。

最终，`Registry` 实例会含有如下结构：

![image-20231121160751866](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231121160751866.png)

## new Moddle() - 实例创建之后

在 上述四个依赖模块都了解清楚之后，我们在回到之前的 `Moddle` 原型方法与实例创建。

已知 `Moddle` 原型上定义了 9 个方法，差不多可以分为以下几种：

1. 元素实例创建：`create` 与 `createAny`
2. 元素构造函数生成：`getType`
3. 已注册的 `package` 描述对象查询：`getPackage` 与 `getPackages`
4. 某个属性的具体定义描述 `descriptor` 查询：`getElementDescriptor`、`getPropertyDescriptor` 与 `getTypeDescriptor`
5. 判断元素实例或者 `model` 实例上是否具有某个属性：`hasType`

并且这些方法，本质上还是对上述 `Factory、Registry、Properties` 这几个模块提供的方法的一个封装。

### 回到 model.create 实例创建

首先是 `create` 方法：

```js
Moddle.prototype.create = function(descriptor, attrs) {
  var Type = this.getType(descriptor);

  if (!Type) {
    throw new Error('unknown type <' + descriptor + '>');
  }

  return new Type(attrs);
};
```

这个方法的作用就是 **创建一个 `getType` 返回的类型构造函数对应的实例**。

而 `getType` 方法内部就是 **通过 `registry.getEffectDescriptor` 获取到我们已注册的某个指定类型的描述对象，然后通过 `factory.createType` 根据这个描述对象生成一个 `ModdleElement` 构造函数**。

```js
Moddle.prototype.getType = function(descriptor) {

  var cache = this.typeCache;

  var name = isString(descriptor) ? descriptor : descriptor.ns.name;

  var type = cache[name];

  if (!type) {
    descriptor = this.registry.getEffectiveDescriptor(name);
    type = cache[name] = this.factory.createType(descriptor);
  }

  return type;
};
```

例如：

```js
const model = new Moddle([Properties])

const ComplexType = model.getType('props:Complex')
const SimpleBody = model.getType('props:SimpleBody')
const Attributes = model.getType('props:Attributes')

console.log(ComplexType.toString(), '\n', SimpleBody.toString(), '\n', Attributes.toString())
```

会得到这样三个函数：

![image-20231122153432326](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20xml%20%E7%9A%84%E6%A0%B8%E5%BF%83%E8%A7%A3%E6%9E%90%E5%BA%93/image-20231122153432326.png)

所以 **通过 `model.create()` 创建的对象实例，类型都是 `ModdleElement`**。

### 另一个方法 —— createAny

在 `moddle.prototype` 中，还有一个方法 `createAny`，其描述也是创建一个实例。但是该方法与 `create` 的创建却有很大的区别。

```js
Moddle.prototype.createAny = function(name, nsUri, properties) {
  var nameNs = parseName(name);

  var element = {
    $type: name,
    $instanceOf: function(type) {
      return type === this.$type;
    },
    get: function(key) {
      return this[key];
    },
    set: function(key, value) {
      set(this, [ key ], value);
    }
  };

  var descriptor = {
    name: name,
    isGeneric: true,
    ns: {
      prefix: nameNs.prefix,
      localName: nameNs.localName,
      uri: nsUri
    }
  };

  this.properties.defineDescriptor(element, descriptor);
  this.properties.defineModel(element, this);
  this.properties.define(element, 'get', { enumerable: false, writable: true });
  this.properties.define(element, 'set', { enumerable: false, writable: true });
  this.properties.define(element, '$parent', { enumerable: false, writable: true });
  this.properties.define(element, '$instanceOf', { enumerable: false, writable: true });

  forEach(properties, function(a, key) {
    if (isObject(a) && a.value !== undefined) {
      element[a.name] = a.value;
    } else {
      element[key] = a;
    }
  });

  return element;
};
```

该方法不会像 `create` 一样借助 `Factory` 来创建一个 `ModdleElement` 构造函数，而是直接创建一个对象，并为这个对象创建一个私有的 `ns` 命名空间对象，然后设置其定义属性。

例如：

```js
model.createAny('other:Foo', 'http://other', {
  bar: 'BAR'
});
```

最终得到如下对象：

![image-20231207162110479](./docs-images/10-%E6%BA%90%E7%A0%81%E7%AF%879%EF%BC%9AModdle%20-%20%E5%AF%B9%E8%B1%A1%E6%A0%BC%E5%BC%8F%E7%9A%84%E6%A0%87%E5%87%86%E5%8C%96%E5%AE%9A%E4%B9%89%E5%BA%93/image-20231207162110479.png)

> 并且，也只有这种情况下，`isGeneric` 才会为 `true`。这个标识字段在 `xml` 解析和转换的时候也会使用。

## 小节

`moddle` 仓库，本身在 `bpmn-js` 或者 `dmn-js` 等基于 `diagram-js` 开发的图形绘制库中，相当于 **对元素及元素扩展属性的一个标准化处理模块**，它 **规定了如何注册元素类型与属性更新、绑定的规则**，也是最后实现 `xml` 与 `JavaScript` 对象之间互相转化的底层依赖。







