前面说过，通过 `Canvas` 模块的 `addShape/addConnection` 新增元素时，会使用 `GraphicsFactory` 与 `ElementRegistry` 来生成 SVG 节点和注册元素与 SVG 节点的绑定关系。那么 这两个模块具体还有哪些作用、剩下的一个 `ElementFactory` 又是做什么的？

这里我先大概说明一下每个模块的功能和其他依赖：

- `ElementRegistry`：依赖 `EventBus`，**实例注册表**，内部保存所有可见元素与 SVG 节点之间的对应关系并提供相关查找方法
- `GraphicsFactory`：依赖 `EventBus` 和 `ElementRegistry`，负责元素实例对应的 SVG 元素创建和更新等操作
- `ElementFactory`：**最原始的符合 BPMN 规范的元素实例定义和创建**，本身不依赖别的模块

> 当然我们在 `Canvas` 一节讲到可以通过 `canvas.addShape/canvas.addConnection` 创建元素，并显示到页面上；但是其实在这个过程中是没有设置元素样式的，这部分功能就与 `diagra-js/lib/draw` 下面的绘制模块有关系了，这一章我们也会对这些模块进行一些讲解。

## `ElementRegistry` 元素注册表

作为 **保存元素实例与元素 SVG 节点** 的注册表模块，实例内部有一个 `_elements` 属性，以对象的形式保存相关数据。

例如我们通过 `Canvas` 创建了以下两个图形：

```js
canvas.addShape({ id: '1', type: 'FOOO', x: 10, y: 20, width: 40, height: 40 });
canvas.addShape({ id: '2', type: 'BAR', x: 100, y: 200, width: 40, height: 40 });
```

![image-20221117204313413](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221117204313413.png)

> 大家可以根据之前 `Canvas` 的内容猜想一下此时 `ElementRegistry` 中注册了几个实例



结果是已经保存了三个元素实例，其中包含一个 **根节点**：

![image-20221117204336970](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221117204336970.png)

其中 `_elements` 对象的 **键名是每个元素实例的 ID，包含 `element` 元素实例对象、`gfx` 元素对应的 SVG 节点、`secondaryGfx` 元素的辅助 SVG 节点**，不过在 bpmn.js 的默认功能中，`secondaryGfx` 是一个基本没有使用的配置项。

而 ID 为 `__implicitroot_0` 的元素则是我们的根元素，在上一节 `Canvas 基础画布处理模块` 中的 **创建元素** 部分中有解释过：在画布最初初始化结束后，整个画布是空的，也不存在根元素；而我们通过 `addShape/addConnection` 创建新的元素挂载到画布上时，默认会通过 `canvas.setRootElement(canvas.addRootElement(null))` 来创建一个根元素（也是一个画布）的，也就是此时的 `__implicitroot_0`。

我们也说过，`ElementRegistry` 不仅是用来保存元素实例和 SVG 节点之间的对应关系，还会提供 **相应的查找方法**。那么具体提供了哪些方法呢？请看：

1. `get` 获取指定的 **元素实例**
2. `getGraphics` 获取指定元素的 SVG 节点
3. `getAll` 获取 **所有元素实例**
4. `remove` 从注册表中移除某个实例
5. `updateId` 更新某个元素实例的 ID
6. `updateGraphics` 更新某个元素的 SVG 节点
7. `add` 新增一个依赖关系

另外还有 **类似数组的遍历方法**：`filter` 筛选、`forEach` 遍历、`find` 查找；这里也可以将 `get`、`getAll`、`getGraphics` 划分为 **查询类方法**，`updateId`、`updategraphics` 划为 **更新类方法**，而 `remove` 自然就是 **移除类方法**，`add` 就是 **新增类方法**。

### 1. 查询类方法

这三个方法中，`get` 和 `getAll` 都是用来 **获取元素实例** 的，`get` 方法接收一个参数 `filter`，可以是指定的 **元素 id** 或者 **元素对应的 SVG 节点**，返回值就是 `elementRegistry._elements` 中对应的关系对象中的 `element` 属性值。

而 `getGraghics` 则接收的是 **元素实例对象或者元素ID**，不能接收 SVG 节点（本身就是用来获取 SVG 节点的，肯定不能用这个来查了）。

例如我们使用一下方法来查询上面创建的一些元素：

```js
function queryMethods() {
  console.log(elementRegistry.get('1'))
  console.log(elementRegistry.getGraphics('2'))
  console.log(elementRegistry.get(elementRegistry.getGraphics('2')))
  console.log(elementRegistry.getAll())
}
```

那么打印结果如下:

![image-20221117211612453](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221117211612453.png)

### 2. 更新类方法

更新类的两个方法，其实从方法名就可以看出它们的作用：`updateId` 更新元素和实例的ID，而 `updateGraphics` 则用来更新指定元素实例的 SVG 节点。

其中，`updateId` 接收一个元素指定条件参数 `filter` 和一个新 ID 字符串，内部调用 `get` 方法来获取指定元素，所以 `filter` 参数类型也与 `get` 一致；而 `updateId` 通过接收 **指定实例或者实例ID** 来确定需要更新的元素对象，另外接收一个 SVG 节点来替换原有节点。

**值得注意的是，`updateId` 过程中还会发送一个 `element.updateId` 事件，然后通过 `remove` 先从注册表中移除掉原有元素关系之后再通过 `add` 方法重新注册对应关系，整个过程中除了修改元素对应 SVG 节点 的 ID 属性之外不会修改 SVG 画布中的内容；而 `updateGraphics` 则是 直接在注册表中使用新的 SVG 节点替换掉对应元素实例的 `gfx` 属性，并不会操作 SVG 画布的实际更新**。

例如：

```js
import { create as svgCreate } from 'tiny-svg'

function updateMethods() {
  elementRegistry.updateId('1', 'new-1')

  const shape2 = elementRegistry.get('2')
  const newGfx = svgCreate('react', {
    fill: '#010101',
    width: 200,
    height: 200,
    x: 40,
    y: 40
  })
  console.log(elementRegistry.updateGraphics(shape2, newGfx))
  console.log(elementRegistry._elements)
}
```

整个过程中我们更改了原来 id 为 1 的元素为 `new-1`，更新了 id 为 2 的节点的 svg 节点为一个新的 `react` 节点，最终结果如下：

![image-20221117222746974](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221117222746974.png)



![image-20221117222606771](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221117222606771.png)

可以看到 `updateId` 最终修改了注册表和 SVG 节点的id，而 `updateGraghics` 则只修改了注册表，对 SVG 元素并没有实际操作，也不会删除原来的 SVG 节点。

### 3. 新增与移除

因为这两类分别都只有一个方法，所以就一起分析了。

`add` 方法，**新注册一组元素与实例的联系**，接收一个元素实例与一个 SVG 节点。

`remove` 方法，**从注册表中移除一组元素和实例的联系**，这里只需要接收一个实例或者实例 ID 即可。

总的来说，这两个方法 **基本上都不会过多操作 SVG 元素，只有在 `remove` 的时候会将指定实例的 SVG 节点的 `data-element-id` 属性移除掉**。

假设我们依然在本小节开始的时候创建的两个图形的基础上来修改，最初状态如下：

![image-20221125154505439](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221125154505439.png)

而当我们调用以下方法 **删除掉 `id 为 1` 的元素，并创建一个新的 `id 为 new-add-1` 的实例** 时

```js
function addAndRemove() {
  // 与 canvas.addShape 类似，需要定义一个元素实例并设置parent
  const el = { id: 'new-add-1', x: 10, y: 20, width: 40, height: 40 }
  canvas._setParent(el, canvas.getRootElement())
  const gfx = graphicsFactory.create('shape', el)

  elementRegistry.add(el, gfx)

  elementRegistry.remove('1')

  console.log(elementRegistry)
}
```

我们会得到这样的结果：

![image-20221125154735148](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221125154735148.png)

可以清楚的看到，SVG 画布中的元素并没有一同被移除，而新增的节点实例因为没有指定形状，也没有显示在画布中。

## `GraphicsFactory` SVG 节点控制工厂

作为 SVG 节点的控制部分，其职责主要包含以下内容。

### 1. 创建 `create` 和 更新 `update` SVG 节点实例

在 `create` 创建新节点时，虽然需要指定 `type`，然而最终该方法只会创建一系列包装元素 —— `g` 标签（也就是 **实际节点的容器**），例如上面的 `ElementRegistry 小节中的 “新增和移除”`，生成的新节点如下：

![image-20221205145425037](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221205145425037.png)

可以很清晰的看到，除了在 **画布根节点** 下创建了一系列 `g` 分组标签之外，并没有其他的可见元素（例如 `rect`、`path` 等），也没有指定元素位置（即 `transform` 属性）。至于什么会创建这么多个分组标签，可以通过源码部分来了解：

```js
GraphicsFactory.prototype.create = function(type, element, parentIndex) {
  var childrenGfx = this._getChildrenContainer(element.parent);
  return this._createContainer(type, childrenGfx, parentIndex, isFrameElement(element));
};

GraphicsFactory.prototype._getChildrenContainer = function(element) {
  var gfx = this._elementRegistry.getGraphics(element);

  var childrenGfx;

  if (!element.parent) {
    childrenGfx = gfx;
  } else {
    childrenGfx = getChildren(gfx);
    if (!childrenGfx) {
      childrenGfx = svgCreate('g');
      svgClasses(childrenGfx).add('djs-children');

      svgAppend(gfx.parentNode, childrenGfx);
    }
  }

  return childrenGfx;
};

GraphicsFactory.prototype._createContainer = function(type, childrenGfx, parentIndex, isFrame) {
  var outerGfx = svgCreate('g');
  svgClasses(outerGfx).add('djs-group');

  if (typeof parentIndex !== 'undefined') {
    prependTo(outerGfx, childrenGfx, childrenGfx.childNodes[parentIndex]);
  } else {
    svgAppend(childrenGfx, outerGfx);
  }

  var gfx = svgCreate('g');
  svgClasses(gfx).add('djs-element');
  svgClasses(gfx).add('djs-' + type);

  if (isFrame) {
    svgClasses(gfx).add('djs-frame');
  }

  svgAppend(outerGfx, gfx);

  var visual = svgCreate('g');
  svgClasses(visual).add('djs-visual');

  svgAppend(gfx, visual);

  return gfx;
};

function isFrameElement(element) {
  return !!(element && element.isFrame);
}

function getChildren(gfx) {
  return gfx.parentNode.childNodes[1];
}
```

在 `create` 方法的执行过程中，首先通过 `_getChildrenContainer(element.parent)` 来 **查找元素的挂载对象节点**，这里判断了 `element.parent` 属性是否存在来确定是否是根节点（即 `if(!element.parent)` 为真时则是根节点）；但如果不是（即目的是给某个指定元素对应的 SVG 节点添加子节点），则会找到对应指定节点的 `g.djs-group` 标签，查找该节点下的 **第二个元素是否存在**，不存在则创建一个 `g.djs-children` 标签，最后返回相应的节点（只会是根节点或者指定节点内部的 `g.djs-children` 节点）。

然后通过 `_createContainer` 方法来创建相应的“包装节点”，并挂载到 `_getChildrenContainer` 的结果上。

例如我们在最初的画布上创建三个新的元素，其中设置一个节点为原始画布中 `id` 为 1 的节点的子元素，代码如下：

```js
export function graphicsUpdate() {
  const el1 = { id: 'new-add-1', x: 10, y: 200, width: 40, height: 40 }
  canvas._setParent(el1, canvas.getRootElement())
  const gfx1 = graphicsFactory.create('shape', el1)

  const el2 = { id: 'new-add-2', x: 100, y: 20, width: 40, height: 40, hidden: true }
  canvas._setParent(el2, canvas.getRootElement())
  const gfx2 = graphicsFactory.create('shape', el2)

  const el3 = { id: 'new-child-3', x: 100, y: 20, width: 10, height: 10 }
  canvas._setParent(el3, elementRegistry.get('1'))
  const gfx3 = graphicsFactory.create('shape', el3)
}
```

最终 DOM 结构和显示内容效果如下：

![image-20221207160958162](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221207160958162.png)

> 需要注意的是，在设置为指定节点的 **子节点** 时，指定节点 **必须可以在 `ElementRegistry` 中查询到对应关系并找到 SVG 节点，否则会直接抛出异常 `Uncaught TypeError: Cannot read properties of undefined (reading 'parentNode')`**

![image-20221207154133754](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221207154133754.png)

> 从上面的代码和 DOM 结构中可以看出，`create` 执行后创建的标签结构如下：
>
> ```
> |-- g.djs-group
> 	|-- g.djs-element.djs-(shape|connection)
> 		|-- g.djs-visual
> 			|-- path|rect|circle... // 实际的可见元素定义
> 	|-- g.djs-children
> 		|-- ... // 其他节点子元素定义
> ```



而 `update` 更新节点则与 `create` 不同，它的作用 **并不是更新 `create` 创建的 SVG 分组节点，而是清空对应的 `g` 分组标签，然后在内部创建对应的类型节点，并且接收一个 `hidden` 参数来控制该节点的显示和隐藏**。

源码如下：

```js
GraphicsFactory.prototype.update = function(type, element, gfx) {
  // 查找节点的父级节点
  if (!element.parent) {
    return;
  }

  // 找到并清空元素对应的 g.djs-visual 分组标签
  var visual = this._clear(gfx);

  // 根据指定类型调用 SVG 节点绘制方法
  if (type === 'shape') {
    this.drawShape(visual, element);
    translate(gfx, element.x, element.y);
  } else
  if (type === 'connection') {
    this.drawConnection(visual, element);
  } else {
    // 非 shape 和 connection 类型则抛出错误信息
    throw new Error('unknown type: ' + type);
  }

  // 根据配置控制显示和隐藏
  if (element.hidden) {
    svgAttr(gfx, 'display', 'none');
  } else {
    svgAttr(gfx, 'display', 'block');
  }
};
```

如果我们在上面示例代码的基础上增加对应的 `update` 操作，就可以在画布中显示对应的节点可见元素:

```js
export function graphicsUpdate() {
  const el1 = { id: 'new-add-1', x: 10, y: 200, width: 40, height: 40 }
  canvas._setParent(el1, canvas.getRootElement())
  const gfx1 = graphicsFactory.create('shape', el1)

  const el2 = { id: 'new-add-2', x: 100, y: 20, width: 40, height: 40, hidden: true }
  canvas._setParent(el2, canvas.getRootElement())
  const gfx2 = graphicsFactory.create('shape', el2)

  const el3 = { id: 'new-child-3', x: 100, y: 20, width: 10, height: 10 }
  canvas._setParent(el3, elementRegistry.get('1'))
  const gfx3 = graphicsFactory.create('shape', el3)

  graphicsFactory.update('shape', el1, gfx1)
  graphicsFactory.update('shape', el2, gfx2)
  graphicsFactory.update('shape', el3, gfx3)
}
```

最终我们就可以得到这样的显示效果：

![image-20221207153805766](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221207153805766.png)



### 2. 形状节点绘制与形状路径获取。

这里主要有四个方法：

- `getShapePath` 和 `getConnectionPath` 用来获取对应的形状/连线的 `path` 路径
- `drawShape` 和 `drawConnection` 用来绘制对应的形状/连线

而这四个方法内部都是 **通过 `eventBus` 来接收对应事件函数的计算结果**，所以 `GraphicsFactory` 模块本质上也 **不会进行节点的路径计算和SVG 实例创建，只根据相应结果进行渲染，它只创建和渲染“节点容器”**（真正的节点形状的路径定义和创建在 `lib/draw` 目录下，抽象类 `BaseRenderer` 的默认实现类 `DefaultRenderer` 中）。

### 3. 清空和移除

作为 SVG 节点的控制模块，`GraphicsFactory` 自然也支持清空节点和移除节点；但是它与 `Canvas` 和 `ElementRegistry` 的移除不一样，只会处理 SVG 节点的移除和子节点清空，而不会更新注册表中的。

首先我们来看一下他们的源码：

```js
GraphicsFactory.prototype._clear = function(gfx) {
  var visual = getVisual(gfx);

  domClear(visual);

  return visual;
};

GraphicsFactory.prototype.remove = function(element) {
  var gfx = this._elementRegistry.getGraphics(element);

  svgRemove(gfx.parentNode);
};
```

其中的 `_clear` 方法在上面的 `update` 方法中也有使用，其作用就是 **清除 `g.djs-visual` 节点下的内容并返回这个清空后的 g 标签实例**，而 `remove` 则是直接通过 `ElementRegistry` 找到对应的 SVG 节点，然后从父节点中清除掉这部分内容。

我们依然以上文中的基础代码为例，验证一下 `remove` 和 `_clear` 方法：

```js
export function graphicsRemove() {
  graphicsFactory.remove('1')
  console.log(elementRegistry)
}

export function graphicsClear() {
  graphicsFactory._clear(elementRegistry.getGraphics('2'))
  console.log(elementRegistry)
}
```

![image-20221208141918615](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221208141918615.png)

![image-20221208144714120](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221208144714120.png)

![image-20221208144551110](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221208144551110.png)

## 课间小憩

与上一节的 `Canvas` 中的 `addShape/addConnection` 与 `removeShape/removeConnection` 结合起来，就可以很清晰的看到，`Canvas` 模块中提供的 **元素增加和移除** 其实是 `GraphicsFactory` 与 `ElementRegistry` 模块的结合，然后在中间穿插相应的事件。

`GraphicsFactory` 专注于 SVG 内部节点元素的处理，`ElementRegistry` 则保存实例与节点的对应关系；我们可以通过 `ElementRegistry` 来避免查找节点时对 DOM 树的多次遍历，也可以直接通过 `GraphicsFactory` 来处理元素的不同展示形态；而 `Canvas` 则侧重于 **整体操作**，并通过 `EventBus` 来触发一系列的副作用。

![canvas](https://raw.githubusercontent.com/miyuesc/blog-images/main/Canvas.png)

## `ElementFactory` 图形实例定义与创建

作为 `diagram.js` 的 **基础图元定义** 模块，本身并不依赖其他模块，并且只提供了几个实例创建方法，其整体源码如下：

```js
import { create } from '../model';
import { assign } from 'min-dash';

export default function ElementFactory() {
  this._uid = 12;
}

ElementFactory.prototype.createRoot = function(attrs) {
  return this.create('root', attrs);
};

ElementFactory.prototype.createLabel = function(attrs) {
  return this.create('label', attrs);
};

ElementFactory.prototype.createShape = function(attrs) {
  return this.create('shape', attrs);
};

ElementFactory.prototype.createConnection = function(attrs) {
  return this.create('connection', attrs);
};

ElementFactory.prototype.create = function(type, attrs) {
  attrs = assign({}, attrs || {});

  if (!attrs.id) {
    attrs.id = type + '_' + (this._uid++);
  }

  return create(type, attrs);
};
```

当然，从源码中其实可以发现，核心逻辑还是在 `model` 中的 `create` 方法里面，那么我们进入到 `model (diagram-js/lib/fearures/model/index.js)` 中再进行分析:

```js
import { assign } from 'min-dash';
import inherits from 'inherits-browser';

import Refs from 'object-refs';

var parentRefs = new Refs({ name: 'children', enumerable: true, collection: true }, { name: 'parent' }),
    labelRefs = new Refs({ name: 'labels', enumerable: true, collection: true }, { name: 'labelTarget' }),
    attacherRefs = new Refs({ name: 'attachers', collection: true }, { name: 'host' }),
    outgoingRefs = new Refs({ name: 'outgoing', collection: true }, { name: 'source' }),
    incomingRefs = new Refs({ name: 'incoming', collection: true }, { name: 'target' });

export function Base() {
  Object.defineProperty(this, 'businessObject', {
    writable: true
  });
  Object.defineProperty(this, 'label', {
    get: function() {
      return this.labels[0];
    },
    set: function(newLabel) {
      var label = this.label,
          labels = this.labels;

      if (!newLabel && label) {
        labels.remove(label);
      } else {
        labels.add(newLabel, 0);
      }
    }
  });
  parentRefs.bind(this, 'parent');
  labelRefs.bind(this, 'labels');
  outgoingRefs.bind(this, 'outgoing');
  incomingRefs.bind(this, 'incoming');
}

export function Shape() {
  Base.call(this);
  parentRefs.bind(this, 'children');
  attacherRefs.bind(this, 'host');
  attacherRefs.bind(this, 'attachers');
}
inherits(Shape, Base);

export function Root() {
  Shape.call(this);
}
inherits(Root, Shape);

export function Label() {
  Shape.call(this);
  labelRefs.bind(this, 'labelTarget');
}
inherits(Label, Shape);

export function Connection() {
  Base.call(this);
  outgoingRefs.bind(this, 'source');
  incomingRefs.bind(this, 'target');
}
inherits(Connection, Base);

var types = {
  connection: Connection,
  shape: Shape,
  label: Label,
  root: Root
};

export function create(type, attrs) {
  var Type = types[type];
  if (!Type) {
    throw new Error('unknown type: <' + type + '>');
  }
  return assign(new Type(), attrs);
}
```

可以看到 `model` 中主要是定义了一个 **基础类 `Base`** 与四个 **衍生类 `Shape, Root, Label, Connection`**，其中 `Root` 和 `Lebel` 也继承自 `Shape`，大致关系如下：

![image-20221208163317579](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221208163317579.png)

当然，每个类都有自己特殊的一些属性定义（`Root` 除外）：

![image-20221208174907328](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221208174907328.png)

其中，**`businessObject`** 作为每个元素实例都具有的属性，在 `diagram.js` 和 `bpmn.js` 等其他扩展库中，都作为一个 **保存元素实例业务配置** 的属性来使用，`label` 则是用来绑定 **该元素的外部名称节点实例**；而其他属性则是通过 `object-refs` 来进行的元素之间 **来源关系、层级关系** 的绑定，也是 `bpmn.js` 中每个节点实例的基础组成。

在一个正常的流程图中，它们之间是这样的一个关系： 

![image-20221209162312240](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221209162312240.png)

## object-refs 的原理和作用

这个库是由 `bpmn.js` 团队的主要成员之一 —— [nikku](https://github.com/nikku) 编写的一个 **实现 JavaScript 中对象之间双向引用** 的库，目前已经转移到 [bpmn-io/object-refs](https://github.com/bpmn-io/object-refs) 中。

其中主要实现的是一个构造函数 `Refs`，接收 **两个符合属性表述规则的配置对象**。

```typescript
type AttributeDescriptor = {
  name: string; // 属性名称
  collection?: boolean; // 是否是集合属性（也就是可设置为多个），默认为false
  enumerable?: boolean; // 是否是可枚举属性，默认也是 false
}

function Refs(a: AttributeDescriptor, b: AttributeDescriptor) {
  if (!(this instanceof Refs)) {
    return new Refs(a, b);
  }

  a.inverse = b;
  b.inverse = a;

  this.props = {};
  this.props[a.name] = a;
  this.props[b.name] = b;
}
```

在 `new Refs(a, b)` 时，只进行对象之间的 **引用属性定义**，而引用关系的实际绑定则需要通过 `Refs` 实例的 `bind` 方法。

```typescript
Refs.prototype.bind = function(target: object, property: string) {
  if (typeof property === 'string') {
    if (!this.props[property]) {
      throw new Error('no property <' + property + '> in ref');
    }
    property = this.props[property];
  }

  if (property.collection) {
    defineCollectionProperty(this, property, target);
  } else {
    defineProperty(this, property, target);
  }
};

function hasOwnProperty(e, property) {
  return Object.prototype.hasOwnProperty.call(e, property.name || property);
}

function defineCollectionProperty(ref, property, target) {
  var collection = Collection.extend(target[property.name] || [], ref, property, target);
  
  Object.defineProperty(target, property.name, {
    enumerable: property.enumerable,
    value: collection
  });

  if (collection.length) {
    collection.forEach(function(o) {
      ref.set(o, property.inverse, target);
    });
  }
}


function defineProperty(ref, property, target) {
  var inverseProperty = property.inverse;
  var _value = target[property.name];

  Object.defineProperty(target, property.name, {
    configurable: property.configurable,
    enumerable: property.enumerable,
    get: function() {
      return _value;
    },
    set: function(value) {
      if (value === _value) {
        return;
      }
      var old = _value;
      _value = null;

      if (old) {
        ref.unset(old, inverseProperty, target);
      }
      
      _value = value;
      
      ref.set(_value, inverseProperty, target);
    }
  });
}
```

> 完整代码大家可以在项目仓库中查看。

这里大致解释一下 `bind` 的过程：该方法接收一个 **对象 `target`** 和 **指定属性名 `property`**，根据 `Refs` 定义中的属性配置，如果是 **集合（`collection` 为 `true`）** 类型，则通过 `defineCollectionProperty` 来为该属性添加相应的 **数据获取和更新方法**；如果是 **非集合类型（对象）** 的属性时，则直接通过 `defineProperty` 来处理 **属性值的获取和更新**。

当然，既然是 **双向引用**，那么 **在属性更新时，就肯定会触发相应的绑定数据改变**。

与 `Vue 2` 比较类似的是，`object-refs` 对 **数组** 属性和 **对象属性** 的处理方式也不一样：

- 如果是 **数组** 属性，则是通过 **给这个属性通过 `Object.defineProperty` 新增几个操作方法 `add, remove, contains`，并设置一个 `__refs_collection: true` 的标识属性**
  1. `add`：该方法作为为这个数组属性 **添加新元素** 的方法，本身在使用时接收 **一个必填参数 `element` 新增元素和一个可选参数 `idx` 指定位置**，并且内部会进行一次查询操作，在 `element` 与已有元素重复时，则会直接退出；而如果指定了位置的话，则会通过数组的 `splice` 方法进行插入，当然这个操作可能会导致其他已有元素位置发生改变；最后更新这个对象的关联对象
  2. `contains`：查询元素是否存在，内部是通过 `indexOf(element) !== -1` 来实现的
  3. `remove`：内部也是通过 `indexOf` 进行查询的，存在的话则通过 `splice` 来删除指定的元素，并更新相关的绑定依赖
- 如果是 **对象** 属性，则是直接通过 `Object.defineProperty` 来修改该属性的默认 `getter/setter`，只是在 `set` 新数据时会重新更新对应的依赖

这里以官方的示例代码来演示一下：

**首先，先定义一个 `Refs` 实例和两个依赖数据**

```js
var refs = Refs({ name: 'wheels', collection: true, enumerable: false }, { name: 'car' });

var car = { name: 'toyota' };
var wheels = [{ pos: 'front-left' }, { pos: 'front-right' }];
```

此时这几个实例依然保持最原始的状态：

![image-20221213105550808](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221213105550808.png)

然后，我们通过 `refs.bind` 来为 `car` 绑定对 `wheels` 引用：

```js
refs.bind(car, 'wheels');
```

此时打印的内容就会发生改变：

![image-20221213105843582](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221213105843582.png)

这里是因为 `refs.bind(car, 'wheels')` 实际只是给 `car` 对象增加了一个 `wheels` 属性，并且设置为了一个空数组，但是 **并没有发生数据改变**，所以 `wheels` 数组并没有发生什么变化。

而当我们通过 `car.wheels.add(wheels[0])` 来将 `wheels` 数组的第一个元素添加到 `car.wheels` 的属性中时，就会同时触发 `wheels[0]` 的对象属性更新：

![image-20221213110433136](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221213110433136.png)

当然，实际上 `car.wheels[0]` 与 `wheels[0]` 都是同一个对象，他们的地址指针是一样的（这也是能直接通过 `indexOf` 查找的原因）。

然后我们通过 `car.wheels.add(wheels[1]); car.wheels.remove(wheels[0])` 将 `wheels[1]` 添加进去并移除掉 `car` 对第一个 `wheels` 元素的依赖：

![image-20221213110932169](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221213110932169.png)

**但是，如果我们在 `bind` 时反过来的话，则结果又不一样了**：

```js
var refs = Refs({ name: 'wheels', collection: true, enumerable: false }, { name: 'car' });

var car = { name: 'toyota' };
var wheels = [{ pos: 'front-left' }, { pos: 'front-right' }];

refs.bind(wheels, 'car');
```

![image-20221213112655462](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221213112655462.png)

此时代表的是 **为 `wheels` 数组创建一个新的属性 `car`，如果需要将 `wheels.car` 设置为 `car` 实例的话，可以直接赋值**：

```js
wheels.car = car
```

![image-20221213113523521](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221213113523521.png)

这时 `wheels` 数组中会增加一个只读属性 `car`，并且原来的 `car` 对象也会添加一个 `wheels` 属性来绑定当前的 `wheels` 数组，但是与前面不同的是，**此时的 `car.wheels` 中第一个元素就是 `wheels` 数组，因为之前的 `refs` 实例定义的 `wheels` 是一个 集合 属性，所以会被当成数组处理；而在进行 `wheels.car = car` 时会触发 `Object.defineProperty` 重新定义的新的赋值更新方法，触发原来 `car` 对象的更新，将 `wheels` 数组作为一个元素插入到 `car.wheels` 中**。

> 这一部分内容可能有一点绕，需要大家实际操作才更加容易理解。

## BaseRenderer 与 DefaultRenderer

在 `GraphicsFactory` 的“形状节点绘制与形状路径获取”中，有提到过它 **本身不会进行元素的路径计算和生成，而是通过 `eventBus` 获取相应事件的返回值来进行处理和渲染（挂载）**，而 **路径计算与元素创建以及对应的事件函数注册**，都在 `BaseRenderer` 和 `DefaultRenderer` 中。这也是 `new Diagram()` 时为什么它的 `CoreModule` 会包含 `DrawModule (DefaultRenderer 和 Styles)`。

`BaseRenderer` 作为 **实现 Shape 和 Connection 绘制的基础类**，个人认为本身可以看成是一个 **抽象类**，定义了 **五个元素绘制的相关方法**，并且在实例化过程中定义了元素绘制的对应事件处理函数。

```js
var DEFAULT_RENDER_PRIORITY = 1000;
export default function BaseRenderer(eventBus, renderPriority) {
  var self = this;
  renderPriority = renderPriority || DEFAULT_RENDER_PRIORITY;

  // 注册元素绘制的事件监听，返回该模块创建的 svg 元素
  eventBus.on([ 'render.shape', 'render.connection' ], renderPriority, function(evt, context) {
    var type = evt.type,
        element = context.element,
        visuals = context.gfx,
        attrs = context.attrs;

    // 校验
    if (self.canRender(element)) {
      // 分类创建
      if (type === 'render.shape') {
        return self.drawShape(visuals, element, attrs);
      } else {
        return self.drawConnection(visuals, element, attrs);
      }
    }
  });
  
  // 注册元素路径查询的事件监听，返回该元素对应的 path 路径
  eventBus.on([ 'render.getShapePath', 'render.getConnectionPath' ], renderPriority, function(evt, element) {
    // 校验
    if (self.canRender(element)) {
      // 分类计算
      if (evt.type === 'render.getShapePath') {
        return self.getShapePath(element);
      } else {
        return self.getConnectionPath(element);
      }
    }
  });
}

// 是否可以绘制该元素，要求返回一个布尔值
BaseRenderer.prototype.canRender = function() {};

// 非连线类元素的绘制方法，返回一个创建好的 SVG 节点
BaseRenderer.prototype.drawShape = function() {};

// 连线类元素的绘制方法，返回一个创建好的 SVG 节点
BaseRenderer.prototype.drawConnection = function() {};

// 非连线类元素的绘制路径计算，一般是一个字符串
BaseRenderer.prototype.getShapePath = function() {};

// 连线类元素的绘制路径计算，一般是一个字符串
BaseRenderer.prototype.getConnectionPath = function() {};
```

`DefaultRenderer` 则是作为 `BaseRenderer` 的 **实现类**，在内部定义了三个默认样式，并实现了对应的五个方法。

```js
import inherits from 'inherits-browser';
import BaseRenderer from './BaseRenderer';

// 设置最低优先级的默认渲染器, 这样才会在没有其他自定义 renderer 的情况下调用
var DEFAULT_RENDER_PRIORITY = 1;

export default function DefaultRenderer(eventBus, styles) {
  BaseRenderer.call(this, eventBus, DEFAULT_RENDER_PRIORITY);

  this.CONNECTION_STYLE = styles.style([ 'no-fill' ], { strokeWidth: 5, stroke: 'fuchsia' });
  this.SHAPE_STYLE = styles.style({ fill: 'white', stroke: 'fuchsia', strokeWidth: 2 });
  this.FRAME_STYLE = styles.style([ 'no-fill' ], { stroke: 'fuchsia', strokeDasharray: 4, strokeWidth: 2 });
}
inherits(DefaultRenderer, BaseRenderer);

// 默认全部可显示
DefaultRenderer.prototype.canRender = function() {
  return true;
};

// 非连线元素 默认都是一个 rect 矩形元素，高宽则是由我们传递的参数来确定的
DefaultRenderer.prototype.drawShape = function drawShape(visuals, element, attrs) {
  var rect = svgCreate('rect');
  
 	// 根据参数设置高宽，位置默认都是 0,0， 有外层的 g.djs-element 来确定
  svgAttr(rect, {
    x: 0,
    y: 0,
    width: element.width || 0,
    height: element.height || 0
  });

  // 根据默认样式和传入的元素参数设置对应的样式
  if (isFrameElement(element)) {
    svgAttr(rect, assign({}, this.FRAME_STYLE, attrs || {}));
  } else {
    svgAttr(rect, assign({}, this.SHAPE_STYLE, attrs || {}));
  }

  // 将元素插入到对应的 g.djs-visual 中
  svgAppend(visuals, rect);

  // 返回 rect dom 实例
  return rect;
};

// 连线元素 默认都是一个 polyline 折线元素，由传递参数来控制显示路径
DefaultRenderer.prototype.drawConnection = function drawConnection(visuals, connection, attrs) {
  var line = createLine(connection.waypoints, assign({}, this.CONNECTION_STYLE, attrs || {}));
  // 将元素插入到对应的 g.djs-visual 中
  svgAppend(visuals, line);
  // 返回 polyline dom 实例
  return line;
};

// 非连线元素 的路径计算过程
DefaultRenderer.prototype.getShapePath = function getShapePath(shape) {
  var x = shape.x,
      y = shape.y,
      width = shape.width,
      height = shape.height;

  var shapePath = [
    [ 'M', x, y ],
    [ 'l', width, 0 ],
    [ 'l', 0, height ],
    [ 'l', -width, 0 ],
    [ 'z' ]
  ];
  return componentsToPath(shapePath);
};

// 连线元素 的路径计算过程
DefaultRenderer.prototype.getConnectionPath = function getConnectionPath(connection) {
  var waypoints = connection.waypoints;
  var idx, point, connectionPath = [];
  for (idx = 0; (point = waypoints[idx]); idx++) {
    point = point.original || point;
    connectionPath.push([ idx === 0 ? 'M' : 'L', point.x, point.y ]);
  }
  return componentsToPath(connectionPath);
};

DefaultRenderer.$inject = [ 'eventBus', 'styles' ];

// 替换为字符串格式
export function componentsToPath(elements) {
  return elements.join(',').replace(/,?([A-z]),?/g, '$1');
}

// 将坐标数组组合成相应的 path 路径字符串
export function toSVGPoints(points) {
  var result = '';
  for (var i = 0, p; (p = points[i]); i++) {
    result += p.x + ',' + p.y + ' ';
  }
  return result;
}

// polyline 创建工具方法
export function createLine(points, attrs) {
  var line = svgCreate('polyline');
  svgAttr(line, { points: toSVGPoints(points) });
  if (attrs) {
    svgAttr(line, attrs);
  }
  return line;
}
```

> PS:
>
> 当然，在仅仅使用 `Diagram` 默认配置，并通过 `Canvas` 模块来创建 `Shape` 或者 `Connection` 元素时，本身 **并不会调用 `'render.getShapePath', 'render.getConnectionPath'` 两个事件来获取元素路径，而是直接通过 `'render.shape', 'render.connection'` 来创建 svg 元素**。

## Styles 样式管理

作为样式管理模块，`Styles` 主要提供了三个 **类名 -> 样式 合并计算** 的方法，当然也有提供了默认类名与样式的对应关系。

> 这里的类名只是作为一个 `key` 使用，并不会绑定到 SVG 节点上作为 `class`。

而在实际开发过程中，我们可以通过 **重写** 该模块来实现 **新的默认样式调整**，或者 **通过包装公共方法来对样式进行预处理** 的形式改变 `Styles` 模块中的默认对应关系。

首先我们先来看一下它的源码：

```js
import { isArray, assign, reduce } from 'min-dash';

export default function Styles() {

  var defaultTraits = {
    'no-fill': { fill: 'none' },
    'no-border': { strokeOpacity: 0.0 },
    'no-events': { pointerEvents: 'none' }
  };

  var self = this;

  // 样式合并
  this.style = function(traits, additionalAttrs) {
    if (!isArray(traits) && !additionalAttrs) {
      additionalAttrs = traits;
      traits = [];
    }
    var attrs = reduce(traits, function(attrs, t) {
      return assign(attrs, defaultTraits[t] || {});
    }, {});
    return additionalAttrs ? assign(attrs, additionalAttrs) : attrs;
  };

  // 添加 class 属性到 合并样式 中
  this.cls = function(className, traits, additionalAttrs) {
    var attrs = this.style(traits, additionalAttrs);
    return assign(attrs, { 'class': className });
  };

  // 合并自定义样式
  this.computeStyle = function(custom, traits, defaultStyles) {
    if (!isArray(traits)) {
      defaultStyles = traits;
      traits = [];
    }
    return self.style(traits || [], assign({}, defaultStyles, custom || {}));
  };
}
```

> 所以 `DefaultRenderer` 中声明的 `CONNECTION_STYLE` 几个属性其实就是与 `defaultTraits` 中某个属性合并后的 SVG 样式对象。

例如：

```js
const diagram = new Diagram({
  canvas: { container: document.getElementById('container') }
})

const styles = diagram.get('styles')

console.log(styles.style(['no-fill'], { strokeWidth: 5, stroke: 'fuchsia' }))
console.log(styles.style({ fill: 'white', stroke: 'fuchsia', strokeWidth: 2 }))
console.log(styles.cls('class1', ['no-events', 'no-fill'], { fill: 'white', strokeWidth: 2 }))
console.log(styles.cls('class2', { fill: 'white', stroke: 'fuchsia' }))
console.log(styles.computeStyle({ cursor: 'pointer' }, ['no-events', 'no-fill'], { fill: 'black', strokeWidth: 10 }))
console.log(styles.computeStyle({ cursor: 'pointer' }, { fill: 'black', stroke: 'fuchsia' }))
```

最后得到的内容如下：

![image-20221213163132054](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221213163132054.png)



**而当我们需要重新修改这些默认值或者合并策略时，可以仿照 `Style` 的模式进行改写，然后在 `new Diagram(config)` 时将改写的模块覆盖原有的 `Style` 模块即可**。

> 因为这几个方法并没有通过 `prototype` 挂载到原型上，所以直接继承的方式不容易实现。

比如我现在需要在 `style` 方法中，增加我们一个预设的样式配置，而这个配置需要从 `new Diagram(config)` 中的 `config.styles` 中读取，那么我们就可以通过一下方式进行改造：

```js
import { isArray } from 'min-dash'

export default function CustomStyles(config) {
  this._defaultStyles = {
    'no-fill': { fill: 'burlywood' },
    normal: { fill: 'none', stroke: 'burlywood' },
    line: { fill: 'none', stroke: '#000', strokeWidth: '10px' },
    ...(config || {})
  }
}

CustomStyles.$inject = ['config.styles']

CustomStyles.prototype.style = function (traits, additionalAttrs) {
  if (!isArray(traits) && !additionalAttrs) {
    additionalAttrs = traits
    traits = []
  }
  const attrs = traits.reduce((attrsMap, t) => {
    // 没有对应属性时使用 默认的 normal 配置
    return { ...attrsMap, ...(this._defaultStyles[t] || this._defaultStyles['normal']) }
  }, {})
  return { ...attrs, ...(additionalAttrs || {}) }
}
CustomStyles.prototype.cls = function (className, traits, additionalAttrs) {
  const attrs = this.style(traits, additionalAttrs)
  // 添加默认的 class
  return { ...attrs, class: className + ' demo' }
}
CustomStyles.prototype.computeStyle = function (custom, traits, defaultStyles) {
  if (!isArray(traits)) {
    defaultStyles = traits
    traits = []
  }
  // 修改为 自定义部分延后
  return this.style(traits || [], { ...(custom || {}), ...defaultStyles })
}
```

然后在 `new Diagram()` 中插入相关配置：

```js
import Diagram from 'diagram-js'
import CustomStyles from '../examples/CustomStyles.js'

export function initDiagram() {
  diagram = new Diagram({
    canvas: { container: document.getElementById('container') },
    modules: [{ styles: ['type', CustomStyles] }],
    styles: {
      red: { fill: 'red' }
    }
  })
  canvas = diagram.get('canvas')
  return diagram
}
```

此时如果我们再使用上面的那部分打印方法来计，则会得到不同的结果：

![image-20221213173233789](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20221213173233789.png)



## 本章小节

本章节主要是作为 `Canvas` 模块的部分功能依赖模块说明，以及基础的元素 `Models` 定义的相关实现。

在 `diagram.js` 的几个核心模块中，`Canvas` 作为最核心的模块，实现了元素和画布的各种操作方法，而 `ElementRegistry` 与 `GraphicsFactory` 则是为其提供补充方法；其中 `ElementRegistry` 作为元素实例与 SVG 节点之间的关系注册表，用来连接 SVG 元素操作与 JavaScript 对象；`GraphicsFactory` 则单纯的负责 SVG 节点的相关操作。

`model.js` 中则是定义了 **基础的图元实例属性**，通过 `object-refs` 来绑定每种图元之间的对应关系，并提供了对应的实例创建方法；`ElementFactory` 则仅仅是作为一个图元实例的创建模块，提供了几个直接创建对应类型图元的方法，在 `bpmn.js` 中也对其进行了扩展，让其能更好的适配 `BPMN2.0` 规范元素的创建。
