前两章我们讲了一些 `fratures` 中用来帮助创建和操作图元素的相关模块，但是这些内容依然只占了 `features` 中的一小部分。当我们从 `Palette` 创建元素或者通过 `ContextPad` 修改元素时，仍旧是通过其他模块来实现。

这些模块中，除了创建元素需要用到 `Create` 模块、连线会用到 `Connect` 模块之外，还有一些工具模块（像全局连线工具 `GlobalConnect`、套索选择模块 `LassoTool` 等），大部分都是依赖上文所说的 `Dragging` 与 `Selection` 模块。

而除了这两个模块之外，剩下的几十个模块中，最重要的就莫过于 `Modeling` **基本建模命令** 模块了。该模块 **依赖 `CommandStack` 与 `EventBus` 两个核心模块，通过“注册命令 `Cmd` 对应的每个操作函数 `Handler`，来实现每次操作的记录和执行**；并且 `diagram-js` 内部的 `Modeling` 本身还提供了 **依赖 `ElementFactory` 模块的元素创建方法**。

## Modeling - 基本建模工具

`Modeling` 相关的源码位于 `diagra-js/lib/feaures/modeling`，包含一个入口 `index.js`、一个模块定义函数文件 `Modeling.js`，以及一个 `cmd` 文件夹；其中 `cmd` 内部还有一个 `helper` 文件夹，包含三个工具类。

首先，入口 `index.js` 的文件内容如下：

```js
import CommandModule from '../../command';
import ChangeSupportModule from '../change-support';
import SelectionModule from '../selection';
import RulesModule from '../rules';

import Modeling from './Modeling';
import BaseLayouter from '../../layout/BaseLayouter';

export default {
  __depends__: [
    CommandModule,
    ChangeSupportModule,
    SelectionModule,
    RulesModule
  ],
  __init__: [ 'modeling' ],
  modeling: [ 'type', Modeling ],
  layouter: [ 'type', BaseLayouter ]
};
```

可见 `__depends__` 声明的依赖数组中，确实包含了 `CommandModule` 模块（也就是 `CommandStack` 等内容），并且还依赖了 `RulesModule` 和 `SelectionModule` 等。

其中，`CommandModule` 用来 **执行命令函数与记录每个命令的执行参数，用于提供撤销与恢复功能**，`RulesModule` 用来 **校验命令是否在当前条件下能够执行**。

至于 `SelectionModule`，在这些命令中并没有直接使用，但是 **部分建模操作可能需要提示用户当前的操作对象，需要用到该模块来进行提示作用**；而 `changeSupport`，则主要是 **在 `elements.changed` 事件触发时支撑图元素的更新操作，例如更新画布中的图元素显示；并且根据元素类型来确认和发送具体的 `shape.changed` 或者 `connection.changed` 等事件**。

> `BaseLayouter` 模块只是一个工具模块，提供了一个 `layoutConnection` 方法用来计算一个连线元素的新的起止点坐标。

### Cmd 与 Hanlder - 命令与命令处理函数

> 在 `CommandStack` 那一章中，我们提到过 `CommandStack` 也有一个 `register(command, handler)` 的方法来向 `CommandStack` 中注册命令与操作函数，然后我们可以直接通过 `CommandStack.execute(command, context)` 直接传递一个命令名称与参数，来调用该命令对应的处理函数；并向外发送不同函数生命周期事件等。

而在 `Modeling` 中也提供了一个 `registerHanlders` 用来注册命令与处理函数，但是这个方法不接收参数，而是直接从自身的 `getHandlers` 方法的返回值中读取数据，并通过 `CommandStack` 进行注册：

```js
export default function Modeling(eventBus, elementFactory, commandStack) {
  this._eventBus = eventBus;
  this._elementFactory = elementFactory;
  this._commandStack = commandStack;

  var self = this;

  eventBus.on('diagram.init', function() {
    self.registerHandlers(commandStack);
  });
}

Modeling.prototype.getHandlers = function() {
  return {
    'shape.append': AppendShapeHandler,
    'shape.create': CreateShapeHandler,
    'shape.delete': DeleteShapeHandler,
    'shape.move': MoveShapeHandler,
    'shape.resize': ResizeShapeHandler,
    'shape.replace': ReplaceShapeHandler,
    'shape.toggleCollapse': ToggleShapeCollapseHandler,

    'spaceTool': SpaceToolHandler,

    'label.create': CreateLabelHandler,

    'connection.create': CreateConnectionHandler,
    'connection.delete': DeleteConnectionHandler,
    'connection.move': MoveConnectionHandler,
    'connection.layout': LayoutConnectionHandler,
    'connection.updateWaypoints': UpdateWaypointsHandler,
    'connection.reconnect': ReconnectConnectionHandler,
    
    'elements.create': CreateElementsHandler,
    'elements.move': MoveElementsHandler,
    'elements.delete': DeleteElementsHandler,
    'elements.distribute': DistributeElementsHandler,
    'elements.align': AlignElementsHandler,
    
    'element.updateAttachment': UpdateAttachmentHandler
  };
};

Modeling.prototype.registerHandlers = function(commandStack) {
  forEach(this.getHandlers(), function(handler, id) {
    commandStack.registerHandler(id, handler);
  });
};
```

即是说，`Modeling` 中的命令注册与执行也是通过 `CommandStack` 模块来完成的，但是命令的管理由 `getHandlers` 方法执行。

在默认的 `Hanlders` 中，主要分为以下几种类型的命令与处理函数：

1.  `Shape` 形状类元素对应的创建、删除、移动、更改类型等 7 个命令
2. `Connection` 连线类元素对应的创建、删除、更新折线坐标等 6 个命令
3. `Elements` 所有元素都可以使用的创建、删除、对齐等 5 个命令
4. `Label` 元素对应的标签创建方法
5. `Space Tool` 空间划分模块对应的 `spaceTool` 命令
6. `Element` 元素创建对应的 **元素挂载（放置）到其他元素上** 时的处理

> **既然每个 `Handler` 实际上也是注册到 `CommandStack` 上的，那么每个 `Handler` 肯定都符合一个 `CommandHandler` 的基本结构**。即 **可能包含一个 `execute` 方法，并且还可以设置 4 个不同生命周期（执行过程/阶段）的处理函数，且最少 设置一个生命周期函数活着 `execute` 方法**。

这部分内容具体可以查看 [06-源码篇5：CommandStack 命令处理与记录的栈](./06-源码篇5：CommandStack 命令处理与记录的栈.md)。

这里我们以新的命令 `element.updateAttachment` 为例。

该命令对应的 `Handler` 为 `UpdateAttachmentHandler`：

```js
import {
  add as collectionAdd,
  remove as collectionRemove
} from '../../../util/Collections';

export default function UpdateAttachmentHandler(modeling) {
  this._modeling = modeling;
}

UpdateAttachmentHandler.$inject = [ 'modeling' ];

UpdateAttachmentHandler.prototype.execute = function(context) {
  var shape = context.shape,
      newHost = context.newHost,
      oldHost = shape.host;

  // (0) detach from old host
  context.oldHost = oldHost;
  context.attacherIdx = removeAttacher(oldHost, shape);
  // (1) attach to new host
  addAttacher(newHost, shape);
  // (2) update host
  shape.host = newHost;

  return shape;
};

UpdateAttachmentHandler.prototype.revert = function(context) {
  var shape = context.shape,
      newHost = context.newHost,
      oldHost = context.oldHost,
      attacherIdx = context.attacherIdx;

  // (2) update host
  shape.host = oldHost;
  // (1) attach to new host
  removeAttacher(newHost, shape);
  // (0) detach from old host
  addAttacher(oldHost, shape, attacherIdx);

  return shape;
};


function removeAttacher(host, attacher) {
  return collectionRemove(host && host.attachers, attacher);
}

function addAttacher(host, attacher, idx) {
  if (!host) {
    return;
  }

  var attachers = host.attachers;
  if (!attachers) {
    host.attachers = attachers = [];
  }
  collectionAdd(attachers, attacher, idx);
}
```

从源码来看，这个 `Hanlder` 本身实现了两个基础方法：`execute` 正常执行 与 `revert` 撤销执行。

`execute` 的过程就是将当前的 `shape` 添加到 `newHost` 的 `attachers` 中，互相创建一个关联关系；而 `revert` 的过程就刚好相反。

当我们需要通过 `Modeling` 来使用这个 `Handler` 时，可以直接通过调用 `Modeling` 实例上的方法：

```js
Modeling.prototype.updateAttachment = function(shape, newHost) {
  var context = {
    shape: shape,
    newHost: newHost
  };

  this._commandStack.execute('element.updateAttachment', context);
};
```

> 总的来说，**`Modeling` 本身就是注册和管理 `CommandStack` 模块的命令与处理函数，并且提供相应的方法来触发对应处理函数的执行；`Modeling` 的每个方法本身主要是进行参数处理和判读，具体的处理过程由每个 `Handler` 内部自行处理**。

### 其他模块与 Modeling 的联系

在上一章的 `MoveModule` 部分，我们知道 `Move` 模块本身是通过 `DraggingModule` 来实现元素拖拽移动的，而在拖拽结束（也就是 `drag.end 和 shape.move.end` 事件触发时）后会通过 `modeling.moveElements` 进行元素的实际位置更新。

当时 `Move` 调用 `modeling.moveElements` 时传递的参数是：

```js
modeling.moveElements(
  shapes, // 移动的元素数组
  delta, // 移动偏移量
  context.target, // 拖拽结束后鼠标所在的位置对应的元素
  {
    primaryShape: context.shape, // 拖拽开始时鼠标所在元素
    attach: isAttach // 是否是需要作为附加元素
  }
);
```

在 `Modeling` 的 `moveElements` 方法中，会从这些参数中重新设置 `MoveElementsHandler` 的需要的上下文参数对象：

```js
Modeling.prototype.moveElements = function(shapes, delta, target, hints) {
  hints = hints || {};

  var attach = hints.attach;

  var newParent = target,
      newHost;

  // 如果是要作为附加元素的话，需要设置置 host 元素，并且设置为与 target 平级
  if (attach === true) {
    newHost = target;
    newParent = target.parent;
  } else if (attach === false) {
    newHost = null;
  }

  var context = {
    shapes: shapes, // 移动的元素数组
    delta: delta, // 偏移量
    newParent: newParent, // 拖拽结束后鼠标所在的位置对应的元素
    newHost: newHost,
    hints: hints
  };

  // 通过 CommandStack 执行命令
  this._commandStack.execute('elements.move', context);
};
```

而 `MoveElementsHandler` 中则是借用 `MoveHelper` 来 **获取所有需要重新调整的元素并遍历移动**。

```js
export default function MoveElementsHandler(modeling) {
  this._helper = new MoveHelper(modeling);
}

MoveElementsHandler.$inject = [ 'modeling' ];

MoveElementsHandler.prototype.preExecute = function(context) {
  // 在 preExecute 阶段 获取所有与正在移动的元素相关的元素数组
  context.closure = this._helper.getClosure(context.shapes);
};

MoveElementsHandler.prototype.postExecute = function(context) {
	// 在 postExecute 阶段，遍历上文得到的元素数组，对 connection 和 shape 分别调用 modeling.moveConnection/layoutConnection 和 modeling.moveShape
  var hints = context.hints,
      primaryShape;

  if (hints && hints.primaryShape) {
    primaryShape = hints.primaryShape;
    hints.oldParent = primaryShape.parent;
  }

  this._helper.moveClosure(
    context.closure,
    context.delta,
    context.newParent,
    context.newHost,
    primaryShape
  );
};
```

最后会执行到对应的 `MoveShapeHandler/MoveConnectionHandler/LayoutConnectionHandler` 几个命令。

> 这个 `Handler` 为什么没有 `execute` 和 `revert` 还是能正确的执行和撤销呢？大家可以思考一下~

其实，大部分模块依赖 `Modeling` 来执行一些逻辑，本身就是 **为了保证操作栈的数据完整**，当我们执行撤销或者恢复时，不会因为某些操作被遗漏而导致整个图的绘制过程发生异常。

## 一个官方示例 - Editor

当我们查看官方提供的 `diagram-js` 的示例仓库 [diagram-js-examples](https://github.com/bpmn-io/diagram-js-examples/tree/master) 时，会发现这里只有一个 `editor` 的目录。

在 `README` 中，解释了这个目录是一个 **由 `diagram-js` 创建的一个非常简易的绘图工具**，如果有需要的话，可以在这个项目的目录设计和代码编写上寻找一些灵感。

> 因为版本比较老，这里将代码迁移到了本小册的示例仓库中。
>
> 更复杂的项目可以参考：
>
> - [timKraeuter/object-diagram-modeler](https://github.com/timKraeuter/object-diagram-modeler/tree/master)
> - [pinussilvestrus/postit-js](https://github.com/pinussilvestrus/postit-js)
> - [archimodel/archimate-js](https://github.com/archimodel/archimate-js)
>
> 当然，这些项目一定程度上已经接近了 `bpmn-js` 的结构和复杂度，对与当前的我们可能有一定难度。

当我们正常启动了项目之后，会得到这样一个界面：

![image-20231101142143151](./docs-images/09-%E6%BA%90%E7%A0%81%E7%AF%878%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%89%EF%BC%89/image-20231101142143151.png)

> 其中，`Palette` 注册了一个 **套索工具** 与 两个创建元素的按钮；`ContextPad` 中注册了一个 **删除元素** 和 **创建连线** 的功能。

然后我们把目光回到这个项目代码中，整个页面（除了 Vue 项目本身的一些基础内容之外）只是通过 **实例化一个 `Editor` 对象并通过 `bootstrapShapes` 来初始化一些元素**，而 `Editor` 本身只做参数处理，最终返回的依旧是一个 `Diagram` 的实例对象：

```js
import Diagram from 'diagram-js'

import ConnectModule from 'diagram-js/lib/features/connect'
import ContextPadModule from 'diagram-js/lib/features/context-pad'
import CreateModule from 'diagram-js/lib/features/create'
import LassoToolModule from 'diagram-js/lib/features/lasso-tool'
import ModelingModule from 'diagram-js/lib/features/modeling'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'
import MoveModule from 'diagram-js/lib/features/move'
import OutlineModule from 'diagram-js/lib/features/outline'
import PaletteModule from 'diagram-js/lib/features/palette'
import ResizeModule from 'diagram-js/lib/features/resize'
import RulesModule from 'diagram-js/lib/features/rules'
import SelectionModule from 'diagram-js/lib/features/selection'
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll'

import ProvidersModule from './providers'

/**
 * A module that changes the default diagram look.
 */
const ElementStyleModule = {
  __init__: [
    [
      'defaultRenderer',
      function (defaultRenderer) {
        // override default styles
        defaultRenderer.CONNECTION_STYLE = { fill: 'none', strokeWidth: 5, stroke: '#000' }
        defaultRenderer.SHAPE_STYLE = { fill: 'white', stroke: '#000', strokeWidth: 2 }
        defaultRenderer.FRAME_STYLE = { fill: 'none', stroke: '#000', strokeDasharray: 4, strokeWidth: 2 }
      }
    ]
  ]
}

/**
 * Our editor constructor
 *
 * @param { { container: Element, additionalModules?: Array<any> } } options
 *
 * @return {Diagram}
 */
export default function Editor(options) {
  const { container, additionalModules = [] } = options

  // default modules provided by the toolbox
  const builtinModules = [
    ConnectModule,
    ContextPadModule,
    CreateModule,
    LassoToolModule,
    ModelingModule,
    MoveCanvasModule,
    MoveModule,
    OutlineModule,
    PaletteModule,
    ResizeModule,
    RulesModule,
    SelectionModule,
    ZoomScrollModule
  ]

  // our own modules, contributing controls, customizations, and more
  const customModules = [ProvidersModule, ElementStyleModule]

  return new Diagram({
    canvas: {
      container
    },
    modules: [...builtinModules, ...customModules, ...additionalModules]
  })
}

```

只是在 `Editor` 内部，为我们 **默认加入了很多相关模块**，并且注册了三个 `Provider`。这三个 `Provider` 分别是：

```js
import ExampleContextPadProvider from './ExampleContextPadProvider' // ContextPad 上下文菜单的按钮
import ExamplePaletteProvider from './ExamplePaletteProvider' // Palette 画板工具的按钮
import ExampleRuleProvider from './ExampleRuleProvider' // Rules 模块增加的自定义规则

export default {
  __init__: ['exampleContextPadProvider', 'examplePaletteProvider', 'exampleRuleProvider'],
  exampleContextPadProvider: ['type', ExampleContextPadProvider],
  examplePaletteProvider: ['type', ExamplePaletteProvider],
  exampleRuleProvider: ['type', ExampleRuleProvider]
}
```

这里会发现，除了我们前面所讲过的几个模块之外，还添加了 `CreateModule, ConnectModule, LassToolModule, ZoomSrollModule` 等。

其中，`CreateModule` 与 `ConnectModule` 与元素创建相关，其他的则属于工具模块，用来简化或者支持某些用户操作。

### CreateModule 与 ConnectModule

`CreateModule` 整体包含三个文件，并具有四个依赖模块：

```js
import DraggingModule from '../dragging';
import PreviewSupportModule from '../preview-support';
import RulesModule from '../rules';
import SelectionModule from '../selection';

import Create from './Create';
import CreatePreview from './CreatePreview';

export default {
  __depends__: [
    DraggingModule, // 拖动事件支持
    PreviewSupportModule, // 预览效果支持
    RulesModule, // 创建前的规则校验
    SelectionModule // 创建后的元素选中
  ],
  __init__: ['create', 'createPreview'],
  create: ['type', Create], // 元素拖拽创建
  createPreview: ['type', CreatePreview] // 拖拽创建的效果预览
};
```

官方为 `Create.js` 的定义是：通过拖放操作创建元素。整个模块只提供一个 `start` 方法:

```js
this.start = function(event, elements, context) {
  if (!isArray(elements)) {
    elements = [ elements ];
  }

  var shape = find(elements, function(element) {
    return !isConnection(element);
  });

  if (!shape) {
    return;
  }

  context = assign({
    elements: elements,
    hints: {},
    shape: shape
  }, context || {});

  // make sure each element has x and y
  forEach(elements, function(element) {
    if (!isNumber(element.x)) {
      element.x = 0;
    }

    if (!isNumber(element.y)) {
      element.y = 0;
    }
  });

  var visibleElements = filter(elements, function(element) {
    return !element.hidden;
  });

  var bbox = getBBox(visibleElements);

  // center elements around cursor
  forEach(elements, function(element) {
    if (isConnection(element)) {
      element.waypoints = map(element.waypoints, function(waypoint) {
        return {
          x: waypoint.x - bbox.x - bbox.width / 2,
          y: waypoint.y - bbox.y - bbox.height / 2
        };
      });
    }

    assign(element, {
      x: element.x - bbox.x - bbox.width / 2,
      y: element.y - bbox.y - bbox.height / 2
    });
  });

  dragging.init(event, PREFIX, {
    cursor: 'grabbing',
    autoActivate: true,
    data: {
      shape: shape,
      elements: elements,
      context: context
    }
  });
};
```

也就是说，`Create` 本身 **并不负责元素创建，而是接收一个或者多个元素，来开启拖拽操作**。在 `Create` 内部，实际上是与 `MoveModule` 的处理逻辑类似，**通过注册 `create.init, create.move, create.end` 等相关事件来确认元素创建位置的合法性，最终通过 `Modeling` 模块来将创建的元素实际添加到画布上**。

至于 `CreatePreview`，则是通过监听 `create.move` 事件，在 `svg` 标签中选渲染出来对应的元素节点并更新位置，当 `create.cleanup` 时清理掉该节点。



`ConnectModule` 与 `CreateModule` 类似，只是少了一个 `PreviewSupportModule` 的依赖。

```js
import SelectionModule from '../selection';
import RulesModule from '../rules';
import DraggingModule from '../dragging';

import Connect from './Connect';
import ConnectPreview from './ConnectPreview';

export default {
  __depends__: [
    SelectionModule,
    RulesModule,
    DraggingModule
  ],
  __init__: ['connectPreview'],
  connect: [ 'type', Connect ],
  connectPreview: [ 'type', ConnectPreview ]
};

```

也提供一个 `start` 方法来开启连线操作，并且 `Connect` 本身也是通过 `dragging.init` 开启拖拽操作。

```js
this.start = function(event, start, connectionStart, autoActivate) {
  if (!isObject(connectionStart)) {
    autoActivate = connectionStart;
    connectionStart = getMid(start);
  }

  dragging.init(event, 'connect', {
    autoActivate: autoActivate,
    data: {
      shape: start,
      context: {
        start: start,
        connectionStart: connectionStart
      }
    }
  });
};
```

一样的，`Connect` 也会监听 `connect.move` 等事件，来创建预览效果和通过 `Modeling` 进行实际连接。

但是，`Connect` 还会监听 `connect.hover` 与 `connect.out` 事件，因为连线始终是在两个元素之间创建的，所以必须要找到另外一个目标元素；当 `hover` 触发时，会校验可否连线并记录该元素；当 `out` 触发时则将该元素进行移除。



所以，在这个示例中，`PaletteProvider` 与 `ContextPadProvider` 中的 **创建元素** 与 **创建连线** 的功能，分别调用执行 `create.start` 和 `connect.start` 两个方法。但因为 **连线连接的是两个已有元素，所以不需要创建一个新元素实例；而创建元素，则需要先创建一个对应的元素实例对象，然后再执行 `create.start`**。



> 但是，**目前的情况并不能实现直接在一个元素后面直接追加一个新元素并默认连接**。这个时候就需要我们引入新的模块来对 `ContextPad` 进行修改了。

### AutoPlace - 追加元素自动放置操作

在官方提供的 `bpmn-js` 的 [示例项目](https://demo.bpmn.io/s/start) 中，针对 `ContextPad` 里面的创建元素相关的操作，点击与拖拽事件是有两种不同的处理方式的。例如：

![chrome-capture-2023-11-6](./docs-images/09-%E6%BA%90%E7%A0%81%E7%AF%878%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%89%EF%BC%89/chrome-capture-2023-11-6.gif)

即：

- 点击（`click`）操作：直接在当前元素后面的空余位置追加一个新元素
- 拖拽（`drag`）操作：开启元素创建预览，并在拖拽结束后创建元素和连线

其中，拖拽创建与 `Palette` 里面的创建类似，都是借助 `Create` 来实现的，只是这里在 `create.start` 执行时会 **将当前选择的元素作为 `source` 属性传递到上下文对象中，方便在元素创建结束之后绘制连线**。

而点击之后直接在元素后面创建一个元素，则需要借助借助一个新的模块 —— `AutoPlace`。

官方对 `AutoPlace` 的定义是：A service that places elements connected to existing ones to an appropriate position in an automated fashion. 即 **一个自动将已连接的元素放置在合适位置的服务**。其实现方式与 `Create` 类似，都是在 **构造函数中注册 `autoPlace` 的相关事件监听，然后提供一个方法来发送 `autoPlace` 的相关事件触发自动放置的逻辑执行**。

```js
import { asTRBL, getMid } from '../../layout/LayoutUtil';
import { DEFAULT_DISTANCE } from './AutoPlaceUtil';

var LOW_PRIORITY = 100;

export default function AutoPlace(eventBus, modeling, canvas) {
  eventBus.on('autoPlace', LOW_PRIORITY, function(context) {
    var shape = context.shape,
        source = context.source;

    return getNewShapePosition(source, shape);
  });
  eventBus.on('autoPlace.end', function(event) {
    canvas.scrollToElement(event.shape);
  });
  
  this.append = function(source, shape, hints) {
    eventBus.fire('autoPlace.start', {
      source: source,
      shape: shape
    });

    var position = eventBus.fire('autoPlace', {
      source: source,
      shape: shape
    });

    var newShape = modeling.appendShape(source, shape, position, source.parent, hints);

    eventBus.fire('autoPlace.end', {
      source: source,
      shape: newShape
    });

    return newShape;
  };

}

AutoPlace.$inject = ['eventBus', 'modeling', 'canvas'];

// helpers //////////

function getNewShapePosition(source, element, hints) {
  if (!hints) {
    hints = {};
  }

  var distance = hints.defaultDistance || DEFAULT_DISTANCE;

  var sourceMid = getMid(source),
      sourceTrbl = asTRBL(source);

  return {
    x: sourceTrbl.right + distance + element.width / 2,
    y: sourceMid.y
  };
}
```

当然，默认情况下新建元素在创建完成后应该被选中，所以 `AutoPlaceModule` 还有一个 **默认行为模块 `AutoPlaceSelectionBehavior`**，用来确保在 `autoPlace.end` 触发时通过 `selection` 进行元素选中。

```js
export default function AutoPlaceSelectionBehavior(eventBus, selection) {
  eventBus.on('autoPlace.end', 500, function(e) {
    selection.select(e.shape);
  });
}

AutoPlaceSelectionBehavior.$inject = [ 'eventBus', 'selection' ];
```

最后，则是需要 **修改 `ContextPadProvider` 的依赖和菜单放回方法，将 `AutoPlace` 添加到依赖中**：

```js
export default function ExampleContextPadProvider(connect, contextPad, modeling, elementFactory, create, autoPlace) {
  this._connect = connect
  this._modeling = modeling
  this._elementFactory = elementFactory
  this._autoPlace = autoPlace
  this._create = create

  contextPad.registerProvider(this)
}

// 在原来的依赖基础上添加了  elementFactory, create, autoPlace 三个模块的依赖
ExampleContextPadProvider.$inject = ['connect', 'contextPad', 'modeling', 'elementFactory', 'create', 'autoPlace']

ExampleContextPadProvider.prototype.getContextPadEntries = function (element) {
  var elementFactory = this._elementFactory,
      autoPlace = this._autoPlace,
      create = this._create
  
  // 省略了原有代码

  function createShape() {
    return elementFactory.createShape({
      width: 100,
      height: 80
    })
  }

  function createElement(event) {
    const shape = createShape()
    create.start(event, shape)
  }

  function appendElement(event) {
    const shape = createShape()
    autoPlace.append(element, shape)
  }

  return {
    // ... delete
    append: {
      group: 'append',
      className: 'context-pad-icon-append',
      title: 'Append',
      action: {
        click: autoPlace ? appendStart : appendElement,
        dragstart: appendElement
      }
    },
    // ... connect
  }
}
```

当然还需要在 `Editor` 中将 `AutoPlaceModule` 添加进去。此时我们就得到了这样的效果：

![chrome-capture-2023-11-7](./docs-images/09-%E6%BA%90%E7%A0%81%E7%AF%878%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%89%EF%BC%89/chrome-capture-2023-11-7.gif)

## diagram-js 相关内容小结

当阅读到这里的时候，其实我们对 `diagram-js` （`bpmn-js` 的底层图形库）就了解的差不多了。

整个 `diagram-js` 在设计上，**主要基于依赖注入模式（`Injector`）、发布订阅模式（`EventBus`）和命令模式（`CommandStack`）三个主要的设计模式**，将图形绘制（`GraphicsFactory`） 与元素实例（`ElementFactory`） 进行拆分，通过注册表 `ElementRegistry` 来进行关联。

而在 `SVG` 的管理上，通过 `Canvas` 画布模块来统一管理；并且区分了 `Layer` 图层与 `Overlays` 覆盖物两种显示元素的区别。

当我们基于上述内容创建了一个基础的编辑器后（例如官方示例中的 `Editor`），在 `new Editor()` 的过程中便会开启 **首次依赖（`__init__`）** 的初始化，然后通过事件总线 `EventBus` 串联整个元素或者画布之类操作流程。

至于每个步骤的 **执行顺序**，则是由向 `EventBus` 中注册事件监听时的 **权重** 来进行控制，并且 **支持中途中断（这也是 `Rules` 模块能正确执行规则限制的原因之一）**。

如果我们需要引入 **撤销与恢复** 的功能，则需要 `CommandStack` 与 `Modeling` 两大模块。其中 `Modeling` 负责 **向 `CommandStack` 中注册和管理每个命令对应的 `Handler` 处理程序，并提供相应的实例方法来触发 `Handler` 执行**；而 `CommandStack` 则负责每个 `Hanlder` 的实际执行与不同生命周期的对外广播，并且提供 `Rules` 校验规则的基础实现 `CommandInterceptor`。



`bpmn-js` 在 `diagram-js` 的基础上，核心就是引入了 `moddle、moddle-xml（bpmn-moddle 的底层依赖）` 等内容来实现元素实例与 XML 字符串之间的解析与转换；而图的操作，依旧是依赖的 `diagram-js` 中的相关内容。只是针对 `BPMN` 特有的属性更新，会通过继承 `diagram-js` 提供的 `Modeling` 模块来进行扩展，确保属性更新也能正常进入操作栈。

























