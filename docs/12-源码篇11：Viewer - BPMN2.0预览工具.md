当我们已经掌握了之前的内容以后，再来看 `bpmn-js` 或者 `dmn-js` 图形界面 的逻辑其实就很简单了。

根据 [Bpmn.js 进阶指南之原理分析与模块改造](https://juejin.cn/post/7117481147277246500) 中讲到的 `bpmn-js` 的 `Modeler` 实例化过程一节讲述的内容，`bpmn-js` 提供的编辑器模式 `Modeler` 在创建时，是会创建其它依赖模块的实例的。

而 `bpmn-js` 不止提供了 `Modeler` 模式，还有 `Viewer`、`NavigatedViewer` 等模式，只是这些模式 **都是通过继承扩展来互相关联的**，并最终继承自 `diagram-js`。

```js
Diagram
└── BaseViewer
		└── Viewer
				├── NavigatedViewer
    		└── BaseModeler
      			└── Modeler
```

`Diagram` 类在最初的几节中就已经讲解过了，所以后面的解析自然就需要从 `BaseViewer` 开始。

## BaseViewer - 无法直接使用的 `BPMN 2.0` 文件查看器

为什么 `BaseViewer` 无法使用呢？首先我们来看一下直接使用会出现什么情况：

```vue
<script setup>
  import { onMounted } from 'vue'
  import Viewer from 'bpmn-js/lib/BaseViewer'

  let viewer = null

  const initialDiagram =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
    'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ' +
    'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ' +
    'targetNamespace="http://bpmn.io/schema/bpmn" ' +
    'id="Definitions_1">' +
    '<bpmn:process id="Process_1" isExecutable="false">' +
    '<bpmn:startEvent id="StartEvent_1"/>' +
    '</bpmn:process>' +
    '<bpmndi:BPMNDiagram id="BPMNDiagram_1">' +
    '<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">' +
    '<bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">' +
    '<dc:Bounds height="36.0" width="36.0" x="173.0" y="102.0"/>' +
    '</bpmndi:BPMNShape>' +
    '</bpmndi:BPMNPlane>' +
    '</bpmndi:BPMNDiagram>' +
    '</bpmn:definitions>'

  onMounted(async () => {
    viewer = new Viewer({
      container: '#viewer-content'
    })

    await viewer.importXML(initialDiagram)
  })
</script>
```

![image-20231212102914004](./docs-images/12-%E6%BA%90%E7%A0%81%E7%AF%8711%EF%BC%9AViewer%20-%20BPMN2.0%E9%A2%84%E8%A7%88%E5%B7%A5%E5%85%B7/image-20231212102914004.png)

即在 32 行意图开始导入 xml 进行渲染时，会报出无法找到 `bpmnImporter` 这个模块（错误类型见第一章 `injector` 依赖注入模式）。

那我们回过头来看一下 `BaseViewer` 这个类对应的属性和方法，来分析为什么会导致这个错误的发生。

### new BaseViewer() - 初始化

首先，来看一下 `new BaseModeler()` 时会执行的一些方法：

```typescript
type BaseViewerOptions = {
  width?: number|string;
  height?: number|string;
  position?: string;
  container?: string|HTMLElement;
  moddleExtensions?: ModdleExtensions;
  additionalModules?: ModuleDeclaration[];
} & Record<string, any>

const DEFAULT_OPTIONS = {
  width: '100%',
  height: '100%',
  position: 'relative'
};

export default function BaseViewer(options?: BaseViewerOptions) {
  options = assign({}, DEFAULT_OPTIONS, options);

  this._moddle = this._createModdle(options);

  this._container = this._createContainer(options);
  
  addProjectLogo(this._container);

  this._init(this._container, this._moddle, options);
}

BaseViewer.prototype._createModdle = function(options) {
  const moddleOptions = assign({}, this._moddleExtensions, options.moddleExtensions);
  return new BpmnModdle(moddleOptions);
};

BaseViewer.prototype._createContainer = function(options) {
  const container = domify('<div class="bjs-container"></div>');

  assignStyle(container, {
    width: ensureUnit(options.width),
    height: ensureUnit(options.height),
    position: options.position
  });

  return container;
};

BaseViewer.prototype._init = function(container, moddle, options) {
  const baseModules = options.modules || this.getModules(options),
        additionalModules = options.additionalModules || [],
        staticModules = [
          { bpmnjs: [ 'value', this ], moddle: [ 'value', moddle ] }
        ];

  const diagramModules = [].concat(staticModules, baseModules, additionalModules);

  const diagramOptions = assign(omit(options, [ 'additionalModules' ]), {
    canvas: assign({}, options.canvas, { container: container }),
    modules: diagramModules
  });

  Diagram.call(this, diagramOptions);

  if (options && options.container) {
    this.attachTo(options.container);
  }
};

BaseViewer.prototype.getModules = function() {
  return this._modules;
};

BaseViewer.prototype._modules = [];
```

在构造函数执行结束之后，我们会得到这样一个对象实例：

![image-20231212104338307](./docs-images/12-%E6%BA%90%E7%A0%81%E7%AF%8711%EF%BC%9AViewer%20-%20BPMN2.0%E9%A2%84%E8%A7%88%E5%B7%A5%E5%85%B7/image-20231212104338307.png)

其中，**除了一个 基于 `Moddle` 和 `moddle-xml` 封装之后的 `BpmnModdle` 实例作为 `_moddle` 属性之外，还有 `_injector, invoke, get` 等方法和属性**。当然，后面这三个都是在 `Diagram.call(this, options)` 的时候，使用 `Diagram` 来实现的；并且 `bpmn-moddle` 中默认引入的几个 `descriptor json` 也已经注册。

在 `new BaseViewer` 的第一步，就是创建 `BpmnModdle` 实例，并注册 `options.moddleExtensions` 中的所有描述文件到 `moddle` 实例上。

紧接着就是 `_createContainer` 创建一个 `div.bjs-container` 的 `dom` 元素，然后向这个元素充插入 `bpmn-io` 团队的 logo 图标链接，之后进入 `_init` 方法相关的核心逻辑。

在 `_init` 内部，会重新整合我们传递进去的 `options` 参数，区分 `modules` 与 `additionalModules` 两个数组中的注册模块，与内置的 `staticModules` 进行合并，借助 `Diagram` 来完成所有注册模块的依赖关系解析和注入，最后通过 `attachTo` 将上文创建的 `_container` 元素插入到 `options.container` 指定的元素上。

所以，最终的 `dom` 也会有四层结构，包含 `options.container` 指定元素、`_container` 对应的 `div.bjs-container` 元素、`Diagram` 实例化时 `Canvas` 模块对应的父元素 `div.djs-container`、`svg` 对应画布：

![image-20231212110019715](./docs-images/12-%E6%BA%90%E7%A0%81%E7%AF%8711%EF%BC%9AViewer%20-%20BPMN2.0%E9%A2%84%E8%A7%88%E5%B7%A5%E5%85%B7/image-20231212110019715.png)

### BaseViewer 提供的一些方法和属性

在 `new BaseViewer` 创建的实例中，可以看到除了上述几个方法，还有以下方法：

- `importXML(xml, bpmnDiagram?)`：导入 `xml` 字符串，进行解析并显示到画布中
- `importDefinitions(definitions, bpmnDiagram?)`：导入一个定义对象，并解析和显示到画布中
- `open(bpmnDiagramOrId)`：打开以前导入的 `xml` 的图
- `saveXML(options)`：将画布内容保存为 `xml` 字符串
- `saveSVG()`：将画布内容保存为 `svg`
- `getModules()`：返回所有默认需要注册的 `modules` 模块定义数组
- `clear()`：清空画布与内容
- `destroy()`：销毁画布与实例
- `on(events, priority, callback, that)`：注册 `EventBus` 事件监听回调
- `off(events, callback)`：销毁某个事件的监听回调
- `getDefinitions()`：获取当前实例的 `_definitions` 属性
- `_emit(type, event)`：发送 `EventBus` 事件

其中，`clear` 与 `distroy` 都是调用的 `Diagram` 的清空和销毁方法；`on`、`off` 和 `_emit` 都是通过 `injector` 来获取到 `EventBus` 对应实例来实现事件回调的注册、销毁和发送事件；至于 `saveSVG`，则是通过 `Canvas` 模块，将 `svg` 画布中的所有内容读取出来，并按照当前画布元素的显示范围 `viewbox` 来重新生成一个对应高宽的 `svg` 元素文本，然后返回。

剩下的几个方法，则是与 `BPMN 2.0` 规范的 `xml` 解析和生成息息相关的内容。

> 在一些 `demo` 中，我们知道，`xml` 通常会分为两个部分：与业务逻辑相关的 `bpmn:xxx` 部分，以及与显示相关的 `bpmndi:xxx` 和 `di:xxx` 部分；而在开发过程中，每一个元素对应的实例实际上只有一个，包含除了 `x, y, width, height` 等显示相关的属性之外，还有 `id，type，businessObject` 等业务逻辑属性。
>
> 所以这与我们之前讲到的 `BpmnModdle` 或者 `moddle-xml` 中的 `Reader, Writer` 的解析对应规则是有区别的。

所以对于 `importXML, importDefinitions, saveXML` 等方法需要细心分析。

### `importXML` - 解析 `xml` 与格式调整和元素渲染

作为导入 `xml` 然后解析并渲染对应元素的入口函数，`importXML` 无疑是在我们的开发中用的最多的一个方法之一。

该方法接收一个 `xml` 字符串参数和一个 **可选** 的 `bpmnDiagram` 参数，其中 `xml` 是需要解析的 `BPMN 2.0` 规范字符串，会通过 `BpmnModdle` 实例进行解析（也就是 `moddle-xml` 提供的 `Reader`），得到完整的解析结果；而 `bpmnDiagram` 则是一个 `ModdleElement` 类型的对象或者对象的 `id`，这个值对应的是 `xml` 中后半部分标签名为 `bpmndi:BPMNDiagram` 的元素对应的 `id`。

当解析开始时，该方法会借助 `EventBus` 对外发送一个 `import.parse.start` 的事件将传递进去的 `xml` 字符串广播处理，开发者可以监听该事件对 `xml` 进行二次加工。

然后，则是通过 `Reader` 从 `bpmn:Definitions` 标签开始解析（当然，这也要求了最外层标签必须是 `bpmn:definitions`），得到解析结果 `parseResult`；如果解析过程中发生错误，则会对外发送 `import.parse.complete` 将 `error` 信息广播出来。

如果没有发生解析错误，根据 `moddle-xml` 一章的内容，可以知道正确解析的结果 `parseResult`，里面肯定会有 `rootElement， references， warnings， elementsById` 四个属性，其中 `rootElement` 对应的就是最外层的 `<bpmn:definitions>` 标签；结果拿到之后，一样会对外广播 `import.parse.complete` 事件，只是事件上下文对象会变成刚刚的解析结果中的四个属性；并且一样的，开发者也可以监听该事件对解析到的根节点信息进行改造。

> 这里会将 `moddle-xml` 中的默认解析结果进行重命名：`rootElement => definitions`，对外发送的 `import.parse.complete` 和后续的逻辑一样都使用 `definitions` 变量名。

当解析结束之后，会调用 `importDefinitions(definitions, bpmnDiagram)` 方法来同步执行后续逻辑，得到 `importResult`。

最后，会对外发送 `import.done` 事件，将解析过程中遇到的错误或者警告信息都传递处理；如果在广播 `import.parse.complete` 事件或者执行 `importDefinitions` 方法的过程中发生了异常，一样会广播 `import.done` 事件，将错误和警告传递出来，但是此时会中断后续逻辑的执行，直接 `throw`。

那么 `importDefinitions` 的过程中会发生什么？是哪一个阶段将图形元素渲染上去的？

### `importDefinitions` - 设置已解析的根节点对象

`importDefinitions` ，从名称上来看，就是导入一个定义，也就是将上文解析到的 `definitions` 变量绑定到 `Viewer` 实例上。

所以这里会执行 `_setDefinitions` 方法，设置 `this._definitions= definitions`；然后，同步执行 `open(bpmnDiagram)`，将 `open` 方法的返回值中的 `wanings` 参数作为函数返回值返回。

### `open` - 根据已解析的内容进行元素渲染

`open` 方法接收一个 `bpmnDiagramOrId` 参数，也就是前两个方法中的 `bpmnDiagram` 参数，可以是字符串或者 `ModdleElement` 对象实例（在 `open` 方法中，如果 `bpmnDiagramOrId` 是字符串，会在 `definitions` 对象中递归查找到该字符串对应的实例对象作为 `bpmnDiagram`）。

在执行时，首先会校验 `this._definitions` 是否存在，不存在则报错，然后找到 `bpmnDiagram` 对象；之后会调用 `clear` 方法清空画布的已有内容，保证画布干净。

最后，通过同步执行 `importBpmnDiagram(this, definitions, bpmnDiagram)` 方法来读取所有对象和渲染。

至于 `importBpmnDiagram` 方法，则与另外两个 `BpmnImporter`、`BpmnTreeWalker` 有关，三者组成一个完整的 `import` 遍历渲染模块。

> `import` 这几个模块，在 `BaseViewer` 中实际上是没有引入的，所以直接使用 `BaseViewer` 实例来执行 `importXML` 的话，会直接抛出错误： `No provider for "bpmnImporter"! (Resolving: bpmnImporter)`。

![image-20231212154015798](./docs-images/12-%E6%BA%90%E7%A0%81%E7%AF%8711%EF%BC%9AViewer%20-%20BPMN2.0%E9%A2%84%E8%A7%88%E5%B7%A5%E5%85%B7/image-20231212154015798.png)

### import modules - 遍历 definitions 渲染元素节点

上面说到，`import modules` 包含三个部分：`importBpmnDiagram` 方法，`BpmnImporter` 与 `BpmnTreeWalker` 类。其中 `BpmnImporter` 依赖与 `translate` 模块（用来翻译提示信息），会作为一个 `module` 被 `Viewer` 添加到依赖系统当中；`BpmnTreeWalker` 则是一个辅助类，不会进入依赖系统，只在 `importBpmnDiagram` 方法中作为一个不同元素的处理程序管理角色使用；而 `importBpmnDiagram` 方法，则是依赖于另外两个模块，通过 `BpmnImporter` 来实现元素的渲染，通过 `BpmnTreeWalker` 来实现 `definitions` 中的不同元素实例解析处理。

为了方便理解，我们从 `BpmnImporter` 开始。

#### `BpmnImporter` - 将 bpmn 元素添加到画布的处理程序

为了将元素添加到画布中，`BpmnImporter` 需要依赖 `Canvas` 和 `TextRenderer` 模块，分别用来显示元素和 `Label` 文本；并且，`moddle-xml` 解析出来的内容，实际上与 `bpmn-js` 中对应的元素实例是有区别的。

![2023年12月12日](./docs-images/12-%E6%BA%90%E7%A0%81%E7%AF%8711%EF%BC%9AViewer%20-%20BPMN2.0%E9%A2%84%E8%A7%88%E5%B7%A5%E5%85%B7/2023%E5%B9%B412%E6%9C%8812%E6%97%A5.png)

一个 `bpmn-js` 中的元素实例，理论上应该对应 `definitions` 中的两个 `ModdleElement` 实例对象，一个代表业务数据，一个代表图形数据。而 `BpmnImporter` 的作用就是从 `definitions` 中找到指定元素对应的两个 `ModdleElement` 实例，然后根据这两个实例数据来创建 `bpmn-js` 中的元素实例，并且通过 `Canvas` 显示到画布上。

所以 `BpmnImporter` 对外提供了两个方法：`add` 和 `addLabel`。其中 `add` 用来处理任务节点、事件节点等各种元素实例；`addLabel` 用来处理独立的 `Label` 节点，源码如下：

```js
import { assign } from 'min-dash'
import { is } from '../util/ModelUtil'
import { isLabelExternal, getExternalLabelBounds, getLabel } from '../util/LabelUtil'
import { getMid } from 'diagram-js/lib/layout/LayoutUtil'
import { isExpanded } from '../util/DiUtil'

export function elementToString(e) {
  if (!e) {
    return '<null>'
  }
  return '<' + e.$type + (e.id ? ' id="' + e.id : '') + '" />'
}

function elementData(semantic, di, attrs) {
  return assign(
    {
      id: semantic.id,
      type: semantic.$type,
      businessObject: semantic,
      di: di
    },
    attrs
  )
}

function getWaypoints(di, source, target) {
  var waypoints = di.waypoint
  if (!waypoints || waypoints.length < 2) {
    return [getMid(source), getMid(target)]
  }
  return waypoints.map(function (p) {
    return { x: p.x, y: p.y }
  })
}

function notYetDrawn(translate, semantic, refSemantic, property) {
  return new Error(
    translate('element {element} referenced by {referenced}#{property} not yet drawn', {
      element: elementToString(refSemantic),
      referenced: elementToString(semantic),
      property: property
    })
  )
}

export default function BpmnImporter(eventBus, canvas, elementFactory, elementRegistry, translate, textRenderer) {
  this._eventBus = eventBus
  this._canvas = canvas
  this._elementFactory = elementFactory
  this._elementRegistry = elementRegistry
  this._translate = translate
  this._textRenderer = textRenderer
}
BpmnImporter.$inject = ['eventBus', 'canvas', 'elementFactory', 'elementRegistry', 'translate', 'textRenderer']
BpmnImporter.prototype.add = function (semantic, di, parentElement) {
  var element,
    translate = this._translate,
    hidden
  var parentIndex
  if (is(di, 'bpmndi:BPMNPlane')) {
    var attrs = is(semantic, 'bpmn:SubProcess') ? { id: semantic.id + '_plane' } : {}
    element = this._elementFactory.createRoot(elementData(semantic, di, attrs))
    this._canvas.addRootElement(element)
  } else if (is(di, 'bpmndi:BPMNShape')) {
    var collapsed = !isExpanded(semantic, di),
      isFrame = isFrameElement(semantic)
    hidden = parentElement && (parentElement.hidden || parentElement.collapsed)
    var bounds = di.bounds
    element = this._elementFactory.createShape(
      elementData(semantic, di, {
        collapsed: collapsed,
        hidden: hidden,
        x: Math.round(bounds.x),
        y: Math.round(bounds.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
        isFrame: isFrame
      })
    )
    if (is(semantic, 'bpmn:BoundaryEvent')) {
      this._attachBoundary(semantic, element)
    }
    if (is(semantic, 'bpmn:Lane')) {
      parentIndex = 0
    }
    if (is(semantic, 'bpmn:DataStoreReference')) {
      if (!isPointInsideBBox(parentElement, getMid(bounds))) {
        parentElement = this._canvas.findRoot(parentElement)
      }
    }
    this._canvas.addShape(element, parentElement, parentIndex)
  } else if (is(di, 'bpmndi:BPMNEdge')) {
    var source = this._getSource(semantic),
      target = this._getTarget(semantic)
    hidden = parentElement && (parentElement.hidden || parentElement.collapsed)
    element = this._elementFactory.createConnection(
      elementData(semantic, di, {
        hidden: hidden,
        source: source,
        target: target,
        waypoints: getWaypoints(di, source, target)
      })
    )
    if (is(semantic, 'bpmn:DataAssociation')) {
      parentElement = this._canvas.findRoot(parentElement)
    }
    this._canvas.addConnection(element, parentElement, parentIndex)
  } else {
    throw new Error(
      translate('unknown di {di} for element {semantic}', {
        di: elementToString(di),
        semantic: elementToString(semantic)
      })
    )
  }
  if (isLabelExternal(semantic) && getLabel(element)) {
    this.addLabel(semantic, di, element)
  }
  this._eventBus.fire('bpmnElement.added', { element: element })
  return element
}
BpmnImporter.prototype._attachBoundary = function (boundarySemantic, boundaryElement) {
  var translate = this._translate
  var hostSemantic = boundarySemantic.attachedToRef
  if (!hostSemantic) {
    throw new Error(
      translate('missing {semantic}#attachedToRef', {
        semantic: elementToString(boundarySemantic)
      })
    )
  }
  var host = this._elementRegistry.get(hostSemantic.id),
    attachers = host && host.attachers
  if (!host) {
    throw notYetDrawn(translate, boundarySemantic, hostSemantic, 'attachedToRef')
  }
  boundaryElement.host = host
  if (!attachers) {
    host.attachers = attachers = []
  }
  if (attachers.indexOf(boundaryElement) === -1) {
    attachers.push(boundaryElement)
  }
}
BpmnImporter.prototype.addLabel = function (semantic, di, element) {
  var bounds, text, label
  bounds = getExternalLabelBounds(di, element)
  text = getLabel(element)
  if (text) {
    bounds = this._textRenderer.getExternalLabelBounds(bounds, text)
  }
  label = this._elementFactory.createLabel(
    elementData(semantic, di, {
      id: semantic.id + '_label',
      labelTarget: element,
      type: 'label',
      hidden: element.hidden || !getLabel(element),
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height)
    })
  )
  return this._canvas.addShape(label, element.parent)
}
BpmnImporter.prototype._getConnectedElement = function (semantic, side) {
  var element,
    refSemantic,
    type = semantic.$type,
    translate = this._translate
  refSemantic = semantic[side + 'Ref']
  if (side === 'source' && type === 'bpmn:DataInputAssociation') {
    refSemantic = refSemantic && refSemantic[0]
  }
  if ((side === 'source' && type === 'bpmn:DataOutputAssociation') || (side === 'target' && type === 'bpmn:DataInputAssociation')) {
    refSemantic = semantic.$parent
  }
  element = refSemantic && this._getElement(refSemantic)
  if (element) {
    return element
  }
  if (refSemantic) {
    throw notYetDrawn(translate, semantic, refSemantic, side + 'Ref')
  } else {
    throw new Error(
      translate('{semantic}#{side} Ref not specified', {
        semantic: elementToString(semantic),
        side: side
      })
    )
  }
}
BpmnImporter.prototype._getSource = function (semantic) {
  return this._getConnectedElement(semantic, 'source')
}
BpmnImporter.prototype._getTarget = function (semantic) {
  return this._getConnectedElement(semantic, 'target')
}
BpmnImporter.prototype._getElement = function (semantic) {
  return this._elementRegistry.get(semantic.id)
}
function isPointInsideBBox(bbox, point) {
  var x = point.x,
    y = point.y
  return x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height
}
function isFrameElement(semantic) {
  return is(semantic, 'bpmn:Group')
}
```

其中 `add` 方法接收的三个参数，分别是 `moddle-xml` 解析结果中的 **业务数据对应的 `ModdleElement` 实例 `semantic`、图形数据对应的 `moddleElement` 实例 `di`，以及该元素对应的父元素**，当然，父元素也可能为空(`semantic` 也就是 `bpmn-js` 开发中，元素实例的 `businessObject` 属性)。

当接收到上述参数之后，后续会通过 `elementData` 将 `semantic` 与 `di` 组合到一起，然后通过 `ElementFactory` 创建对应的元素实例，并通过 `canvas` 进行节点渲染。

当进入该方法时，主要有三个判断部分（判断 `di` 类型）

1. `is(di, 'bpmndi:BPMNPlane')`：这个节点类型通常表示 **根节点**，并且这类节点 **不会在画布中直接显示**；所以这里会使用 `elementFactory.createRoot` 以及 `canvas.addRootElement`
2. `is(di, 'bpmndi:BPMNShape'`：这类节点 **通常都是需要显示的形状元素节点**，也就是 **非连接线**，所以使用 `elementFactory.createShape` 来创建元素实例，通过 `canvas.addShape` 进行渲染。但是，这里面还要区分一些特殊情况，例如 任务边界事件、泳道的通道节点 `Lane` 等，这些情况下，除了创建对应的元素实例和渲染之外，还需要 **处理节点之间的绑定关系**；这是因为，在 `xml` 中，**每一个显示元素对应的图形数据标签，基本上都是同级分布的**，所以不存在父子关系，需要通过业务数据部分进行关联。
3. `is(di, 'bpmndi:BPMNEdge'`：这个类型就是代表的 **连线类** 元素，通过 `elementFactory.createConnection` 和 `canvas.addConnection` 来处理

如果 `di` 的类型判断不符合上面的三种情况，则会抛出一个 `unknown di {di} for element {semantic}` 的错误，终止后面的解析和渲染过程。

当然，除了这三种类型外，还有一种情况，就是 `isLabelExternal(semantic) && getLabel(element)`，代表 **节点是事件或者网关等需要在元素外部显示名称的节点类型，并且已经设置了对应的名称字段**，这种情况下，就需要通过 `addLabel` 方法来创建一个 `Label` 元素实例（`elementFactory.createLabel`）并且将这个元素添加到画布上（`canvas.addShape`）。

当元素已经渲染到画布上以后，还会通过 `EventBus` 发送一个 `bpmnElement.added` 的事件出来。

#### `BpmnTreeWalker` - 遍历解析结果并处理业务对象与元素对象的绑定关系

在 `importBpmnDiagram` 方法中，初始化 `BpmnTreeWalker` 会 传入一个 `visitor` 对象，而这个对象实际上是提供依赖 `BpmnImporter` 来实现的 `root` 与 `element` 两种元素的创建和渲染逻辑，以及一个 `error` 处理方法。

当 `new BpmnTreeWalker(visitor, translate)` 执行时，会创建两个对象 `handledElements` 与 `diMap`，分别记录 **已处理的元素实例** 和所有解析到的图形渲染实例 `diMap`；以及一个数组对象 `deferred`，用来记录 **需要延迟到其它元素渲染之后的一些处理方法**。

然后呢，会通过闭包的形式，在内部声明多个处理函数和辅助函数。例如 `handled(element)`, `visit()`, `handleDiagram()` 等，其中 `handleDefinitions, handleSubProcess, handleDeferred, registerDi` 四个函数会绑定到 `walker` 实例上作为实例方法。

当 `BpmnImporter` 实例初始化完成之后，会首先 **从解析结果的 `definitions` 对象中拿到 `diagrams` 数组的第一个元素，作为 `bpmnDiagram`**。这个变量 **在正常业务中，一般是所有 `DI` 对象（元素渲染属性对应的对象）的父元素、的父元素**，也就是 `xml` 中的 `<bpmndi:BPMNDiagram>` 标签。这个变量之下，会有一个 `<bpmn:BPMNPlane>` 标签，记录 **所有可见元素对应的 `di` 对象数组**，当然它本身也会通过一个属性 `bpmnElement` 指向流程的 **根节点元素**（如果存在协作节点 `Collaboration`，则指向该节点；如果没有这类节点，则指向 `Process` 节点）。

这个 `bpmnDiagram` 变量结构大致如下：

![image-20231219152921522](./docs-images/12-%E6%BA%90%E7%A0%81%E7%AF%8711%EF%BC%9AViewer%20-%20BPMN2.0%E9%A2%84%E8%A7%88%E5%B7%A5%E5%85%B7/image-20231219152921522.png)

当执行 `walker.handleDefinitions(definitions, bpmnDiagram)` 时，会校验 `definitions.diagrams` 中是否包含该 `bpmnDiagram`，如果不包含说明之前解析的 `xml` 数据有问题，则直接抛出异常 `diagram not part of bpmn:Definitions`；当 `bpmnDiagram` 对象不存在时，则会直接校验 `definitions.diagrams[0]` 是否存在，并将其作为 `bpmnDiagram` 参与后面的逻辑执行。

后面的核心逻辑就包含以下几行代码，共分为四个部分：

```js
function handleDiagram(diagram) {
  handlePlane(diagram.plane);
}
function handlePlane(plane) {
  registerDi(plane);
  forEach(plane.planeElement, handlePlaneElement);
}
function handlePlaneElement(planeElement) {
  registerDi(planeElement);
}
var registerDi = this.registerDi = function registerDi(di) {
  var bpmnElement = di.bpmnElement;

  if (bpmnElement) {
    if (diMap[bpmnElement.id]) {
      logError();
    } else {
      diMap[bpmnElement.id] = di;
      ensureCompatDiRef(bpmnElement);
    }
  } else {
    logError();
  }
};

this.handleDefinitions = function handleDefinitions(definitions, diagram) {
  // 第一部分
  diMap = {};
  handleDiagram(diagram);

  // 第二部分
  var plane = diagram.plane;

  if (!plane) {
    throw new Error();
  }

  var rootElement = plane.bpmnElement;

  if (!rootElement) {
    rootElement = findDisplayCandidate(definitions);
    if (!rootElement) {
      throw new Error();
    } else {
      logError();
      plane.bpmnElement = rootElement;
      registerDi(plane);
    }
  }
  
  // 第三部分
  var ctx = visitRoot(rootElement, plane);
  if (is(rootElement, 'bpmn:Process') || is(rootElement, 'bpmn:SubProcess')) {
    handleProcess(rootElement, ctx);
  } else if (is(rootElement, 'bpmn:Collaboration')) {
    handleCollaboration(rootElement, ctx);
    handleUnhandledProcesses(definitions.rootElements, ctx);
  } else {
    throw new Error();
  }
  
  // 第四部分
  handleDeferred(deferred);
}
```

其中，第一部分就是遍历 `bpmnDiagram.plane.planeElement`，将 `plane` 与每一个 `planeElement` 对象都保存到 `diMap` 中，并与其对应的业务对象 `bpmnElement` 进行绑定（这里的 `di.bpmnElement` 就是业务对象的原因，可以参照 `moddle-xml` 与 `bpmn-moddle`：在 `bpmndi.json` 中，`BPMNPlane` 对象的 `bpmnElement` 属于是引用类型并且类型是 `bpmn:BaseElement`，即 `bpmn.json` 中的基础对象定义）。

然后第二部分就是 **处理根节点**，并找到 `plane` 对应的根级业务对象。

第三部分，则是处理 **通过 `BpmnImporter` 提供的 `add` 方法，遍历根节点及子节点内容，并将其渲染到画布中**。在这一步中，遇到 `Association、Flow、BoundaryEvent` 等特殊节点时，则会将对应的 `Handle` 方法添加到 `deferred` 数组中，等待其他节点渲染结束之后再处理。

至于第四部分，则是处理第三步中需要延迟处理的内容，遍历 `deferred` 数组分别执行数组中保存的对应方法。

#### `importBpmnDiagram` 方法

此时再回到 `importBpmnDiagram` 方法就非常容易理解了，即 **接收一个 `diagram` 实例（也就是 `Viewer` 实例）与一个`definitions` 根对象，和一个可选参数 `bpmnDiagram`；通过 `BpmnTreeWalker` 来遍历根节点下的所有业务节点，并完成业务对象中的 `di` 属性与元素渲染对象 `DI` 实例之间的绑定关系，通过 `BpmnImporter` 将每一个元素实例渲染到画布中，完成整个解析渲染过程**。

并且在开始解析与解析渲染结束之后，还会发送 `import.render.start` 与 `import.render.complete` 事件，最后返回解析渲染过程中遇到的异常问题。



所以在 `BaseViewer` 中，`importXML` 与 `importDefinitions` 两个方法都用于解析和渲染，但是 `importDefinitions` 还是 `importXML` 的依赖方法，如果需要用 `imporyDefinitions` 处理 `xml` 字符串，则需要自己借助 `BpmnModdle` 或者其他手段来将 `xml` 解析成符合规则的对象结构。

至于剩下的 `clear`、`destroy` 等方法，根据方法名就很容易理解，就不赘述了。



## Viewer - 仅供预览显示的查看器

`Viewer`，作为 `BaseViewer` 的 **基础扩展**，只引入了部分核心功能：

1. `DrawModule`：负责 `BPMN2.0` 对应基础元素的绘制与渲染的模块集合，也是 `bpmn-js` 中不可或缺的内容。即使开发者可以通过自行扩展 `BaseViewer`，但是这部分的内容也是 **必须要按照对应格式实现** 的。
2. `ImportModule`：也就是上文的 `import modules` 中对应的内容，用来解析和处理渲染解析结果的模块；也是 `BaseViewer` 无法使用 `importXML` 的原因（因为没有引入）
3. `DrilldownModdule`：用来处理 **折叠的子流程节点的内容显示**，会在折叠子流程节点上增加一个剪头标记，用来进入子流程内部
4. `TranslateModule`：`diagram-js` 提供的 `i18n` 模块，用来提供国际化。当然，默认的这个部分 **实际上只是空处理函数，并不能实现国际化翻译**，只是为了避免其他模块中依赖 `translate` 导致初始化失败。
5. `SelectionModule`：用来实现元素的选中效果，由 `diagram-js` 提供，原理在前文有过描述
6. `OverlaysModule`：用来出发元素的覆盖物显示，由 `diagram-js` 提供，原理在前文有过描述

从这几个模块来看，`Viewer` 模式下，基本上也只能用于显示。但是，容易出现 **流程过大或者位置不居中** 等情况，导致无法完整显示所有内容；并且由于其并没有引入 **画布移动** 等模块，画布内容也只能固定无法调整显示效果，无法让人满意。

所以在这种情况下，`bpmn-js` 提供了另外一个模式 —— `NavigatedViewer`。



## NavigatedViewer - 具有鼠标控制和键盘导航功能的查看器

`NavigatedViewer` 在 `Viewer` 的基础上，引入了 `KeyboardModule` 等模块来实现对键盘、鼠标事件的基础支持。

1. `KeyboardMoveModule`：支持用键盘方向键移动画布的模块，依赖 `KeyboardModule` 来实现键盘事件的注册
2. `MoveCanvasModule`：支持鼠标控制画布移动的模块
3. `ZoomScrollModule`：支持鼠标控制画布缩放的模块







