上一章介绍了 `Palette`、`ContextPad` 和 `Overlays` 三个用来辅助绘图的扩展模块，以及如何使用和改造这三个模块。

但除了这几个模块之外，还需套涉及到 **鼠标操作、画布操作、拖拽创建等内容**（比如 `Overlays` 就需要 `element` 对应的 `change, add, remove` 等事件，`ContextPad` 需要依赖 `selection` 的事件等）。

所以这一节我们就再简单介绍一下这几个模块的功能和使用。

## TouchModule - 交互事件处理

在上一节的 `ContextPad` 和 `Overlays` 中，都额外引入了两个模块：`TouchModule` 与 `SelectionModule`，两个模块分别位于 `diagram-js/lib/features/touch` 和 `diagram-js/lib/features/selection`。

其中，`selection` 很明显的可以看出是用来 **处理元素选择** 的模块，而 `touch` 在直译过来 **触摸** 的意思，而我们直接用手触摸电脑屏幕的话电脑是没有办法响应的（触摸屏除外：dog），所以这里就指代的是 **通过鼠标去触碰元素（或者触摸屏中触摸元素）**。

在 `TouchModule` 中，包含三个小的模块：

```js
// diagram-js/lib/features/touch/index.js

import InteractionEventsModule from '../interaction-events';

import TouchInteractionEvents from './TouchInteractionEvents';
import TouchFix from './TouchFix';

export default {
  __depends__: [ InteractionEventsModule ],
  __init__: [ 'touchInteractionEvents' ],
  touchInteractionEvents: [ 'type', TouchInteractionEvents ],
  touchFix: [ 'type', TouchFix ]
};
```

其中 `InteractionEventsModule` 作为主要的 **为元素提供 `click, dblclick` 等交互事件的主要模块**，入口文件内容如下：

```js
// diagram-js/lib/features/interaction-events/index.js

import InteractionEvents from './InteractionEvents';

export default {
  __init__: [ 'interactionEvents' ],
  interactionEvents: [ 'type', InteractionEvents ]
};
```

以上相关的三个主要 `module` 的作用如下：

- `InteractionEvents`：基础的鼠标点击、移动事件的绑定处理；会将每个事件封装成 `{ element, gfx, originalEvent }` 的固定格式，其中 `element` 是当前鼠标事件对应的元素实例，`gfx` 是该元素对应的 `svg` 元素，而 `originalEvent` 则是最初的 `Dom Event` 事件对象
- `TouchInteractionEvents` 则是为触摸屏提供的事件处理模块，依赖 `Hammer.js` 实现 `pan, press, pinch, doubleTap, tap` 五种事件的处理；并且为了简化开发者的适配操作，该模块依赖 `InteractionEvents` 来对外发送事件；当 `tap, doubletap` 触发时，会发送 `element.click，element.dblclick` 事件；当 `pinch` 触发时会开始缩放画布；当 `pan` 与 `press` 相关事件触发时，会进行元素或者画布的移动。
- `TouchFix` 则只有一个功能：修复 `IOS` 系统下 `svg` 元素 `0,0` 位置与视窗原点之间没有元素时无法触发对应的 `touch` 事件，所以需要在 `SVG` 中增加一个空白元素。

> `pinch, pan` 都有对应的 `start, end` 等事件，这里不做过多解释。
>
> 一般来说，`bpmn-js` 的重度使用基本上都是在浏览器 `web` 环境下，常用的就是 `InteractionEvents` 模块，所以这里详细分析一下该模块的源码内容。

### `InteractionEvents` 鼠标事件

这个模块依赖 `EventBus, ElementRegistry, Styles` 三个模块，分别用来 **发送事件、查询元素实例与 `svg` 元素、查询预设元素样式**。

并且对外提供了 10 个方法：

- `removeHits(gfx)`：删除指定元素上的事件元素标记
- `createDefaultHit(element, gfx)`：为元素创建默认的事件元素标记
- `createWaypointsHit(gfx, waypoints)`：根据给定坐标为元素创建事件元素标记
- `createBoxHit(gfx, type, attrs)`：为元素创建一个默认的盒子标记
- `updateDefaultHit(element, gfx)`：更新指定元素的事件元素标记
- `fire(type, event, element)`：将事件进行标准封装后发送事件
- `triggerMouseEvent(eventName, event, targetElement)`：在目标元素或连线上触发交互事件 (基于原生的 `dom` 事件)
- `mouseHandler(localEventName)`：获取通过 `registerEvent` 注册的事件处理方法
- `registerEvent(node, event, localEvent, ignoredFilter)`：注册指定的事件处理方法
- `unregisterEvent(node, event, localEvent)`：移除已注册的事件处理方法

> 那么这些方法有什么作用呢？

在 `Canvas` 一章中，我们知道了元素创建之后的 `dom` 结构是这样的：

<img src="./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20221105161003829.png" alt="image-20221105161003829" style="zoom:50%;" />

而 `g.djs-shape, g.djs-connection` 和 `g.djs-visual` 这三种元素，默认是关闭了事件响应的（也就是 `css` 中设置了 `touch-action: none;` 和 `pointer-events: none;`）。

所以在没有引入 `TouchModule` 时，即使我们通过 `addEventListener` 为元素注册了事件也无法正常响应。

而 `InteractionEvents` 中，则会通过上诉的 `createDefaultHit` 等几个方法，**为元素创建一个覆盖层元素来响应鼠标事件**。

在 `InteractionEvents` 初始化的过程中，会注册 `shape.added` 和 `connection.added` 两个事件的监听方法，通过发送 `interactionEvents.createHit` 事件来触发该模块为新增的元素创建一个 `Hit` 覆盖层元素；而当元素改变时（`shape.changed` 和 `connection.changed` 触发时），则会发送 `interactionEvents.updateHit` 事件来触发该元素对应的覆盖层更新。

> 在初始化时，也会注册 `interactionEvents.createHit` 与 `interactionEvents.updateHit` 两个事件的监听函数，在函数内部调用 `createDefaultHit` 与 `updateDefaultHit` 来创建和更新覆盖层元素。这么做的原因估计也是为了方便开发者在这个覆盖层的创建过程中执行其他的操作（因为这两个事件的优先级比较低）。

当然，在画布初始化与画布销毁时，也会执行对应的 `dom` 事件绑定和解绑。

#### **`InteractionEvents` 默认提供了哪些交互事件**？

在这个模块的构造函数的函数体中，最先有这么一段代码：

```js
function allowAll(event) { return true; }

function allowPrimaryAndAuxiliary(event) {
  return isPrimaryButton(event) || isAuxiliaryButton(event);
}

export default function InteractionEvents(eventBus, elementRegistry, styles) {
  // 。。。
  
  var handlers = {};

  function mouseHandler(localEventName) {
    return handlers[localEventName];
  }

  function isIgnored(localEventName, event) {
    var filter = ignoredFilters[localEventName] || isPrimaryButton;
    return !filter(event);
  }

  var bindings = {
    click: 'element.click',
    contextmenu: 'element.contextmenu',
    dblclick: 'element.dblclick',
    mousedown: 'element.mousedown',
    mousemove: 'element.mousemove',
    mouseover: 'element.hover',
    mouseout: 'element.out',
    mouseup: 'element.mouseup',
  };

  var ignoredFilters = {
    'element.contextmenu': allowAll,
    'element.mousedown': allowPrimaryAndAuxiliary,
    'element.mouseup': allowPrimaryAndAuxiliary,
    'element.click': allowPrimaryAndAuxiliary,
    'element.dblclick': allowPrimaryAndAuxiliary
  };
  
  // ...
}
```

而在画布初始化或者销毁时，会执行这些方法：

```js
function registerEvents(svg) {
  forEach(bindings, function(val, key) {
    registerEvent(svg, key, val);
  });
}

function unregisterEvents(svg) {
  forEach(bindings, function(val, key) {
    unregisterEvent(svg, key, val);
  });
}

eventBus.on('canvas.destroy', function(event) {
  unregisterEvents(event.svg);
});

eventBus.on('canvas.init', function(event) {
  registerEvents(event.svg);
});
```

也就是说，默认情况下，`diagram-js` 在设置鼠标事件时，会为元素绑定和响应 `click、contextmenu、dblclick、mousedown、mousemove、mouseover、mouseout、mouseup` 共8种事件，并在向外发送时会重新定义事件名。

> 当然，为了减少事件绑定，所有的元素事件都是通过 **事件代理（委托）** 来实现的。

比如我们通过页面的元素审查，就可以找到所有的事件对应的绑定元素：

SVG 根节点：

![image-20231016143003263](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231016143003263.png)

某个指定元素：

![image-20231016143113063](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231016143113063.png)

#### 对页面造成的改变

但是 **本身 `diagram-js` 中通过 `Canvas` 模块创建的元素，是不支持事件响应的**，所以，即使我们为根节点添加了事件代理，也没有办法在事件触发时响应正确的元素。

此时就需要 **为每个元素添加一个对应的能识别事件触发位置** 的内容。

这时就会在 `dom` 中插入一个新的节点，来进行标识，也就是上文提到的与 `Hit` 相关的方法。

> 在 `diagram-js` 中主要分为两种元素：`shape` 与 `connection`，所以也有两种方法来创建 `Hit` 元素 -- `createBoxHit` 与 `createWaypointsHit`。

当有新的元素创建或者发生改变时，就会生成或者修改对应的 `Hit` 元素。

![image-20231016151710162](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231016151710162.png)

> 从页面上看，`Hit` 元素会比本身的元素要 **大**，猜测是为了优化用户的交互体验，毕竟如果分毫不差的话，连线类元素很难一次选中。

#### 支持的事件与参数

上文有提到了，`InteractionEvents` 会响应 8 种事件，并且在通过 `EventBus` 向外发送事件时会进行重命名与参数封装。

在 `EventBus` 一章中，也讲过：事件总线向外发送的事件，在所有的响应回调函数中，都会使用同一个事件对象作为整个事件触发过程中的上下文对象。

在 `registerEvent` 方法向 `svg` 节点中绑定事件时，就会对事件参数进行处理：

```js
export default function InteractionEvents(eventBus, elementRegistry, styles) {
  var self = this;
  var handlers = {};

  function fire(type, event, element) {
    if (isIgnored(type, event)) {
      return;
    }

    var target, gfx, returnValue;

    // 查找事件触发的实际元素，根据对应关系找到相应的元素实例
    if (!element) {
      target = event.delegateTarget || event.target;

      if (target) {
        gfx = target;
        element = elementRegistry.get(gfx);
      }
    } else {
      gfx = elementRegistry.getGraphics(element);
    }

    // 找不到元素或者标签，则不发送事件
    if (!gfx || !element) {
      return;
    }

    // 通过 eventBus 发送事件，合并上下文参数对象
    returnValue = eventBus.fire(type, {
      element: element,
      gfx: gfx,
      originalEvent: event
    });

    // 阻止原生事件响应和传播
    if (returnValue === false) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
  
  var ELEMENT_SELECTOR = 'svg, .djs-element';

  function registerEvent(node, event, localEvent, ignoredFilter) {
    // 保存事件，方便后面的 unregisterEvent 移除监听
    var handler = handlers[localEvent] = function(event) {
      fire(localEvent, event);
    };

    if (ignoredFilter) {
      ignoredFilters[localEvent] = ignoredFilter;
    }
		// 绑定代理事件
    handler.$delegate = domDelegate.bind(node, ELEMENT_SELECTOR, event, handler);
  }
}
```

其 8 种鼠标事件与其对应的事件名，都在上文的 `bindings` 对象中。

当开发过程中需要使用到这些事件时，就可以通过注册对应的事件来使用：

```vue
<script setup>
  import { onMounted } from 'vue'
  import Diagram from 'diagram-js'
  import InteractionEventsModule from 'diagram-js/lib/features/interaction-events'
  import { bootstrapShapes } from '../../utils/bootstrap.js'

  const bootstrapDiagram = (id) => {
    return new Diagram({
      canvas: { container: document.getElementById(id) },
      modules: [
        InteractionEventsModule
      ]
    })
  }

  const events = ['element.click', 'element.contextmenu', 'element.dblclick', 'element.mousedown', 'element.mousemove', 'element.hover', 'element.out', 'element.mouseup']

  onMounted(() => {
    const djs = bootstrapDiagram('touch-canvas')
    bootstrapShapes(djs.get('canvas'))

    djs.get('eventBus').on(events, ({ element, gfx, originalEvent, type }) => {
      console.log('eventType: ', type, ', element: ', element.id, gfx, originalEvent)
    })
  })
</script>

<template>
  <div id="touch-canvas" class="canvas"></div>
</template>

<style scoped>
  .canvas {
    width: 100%;
    height: 100%;
  }
</style>

```

控制台会打印如下内容：

![image-20231017143913888](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231017143913888.png)

### TouchInteractionEvents 触摸事件

整个 `TouchModule` 除了最基本的 `InteractionEvents` 之外，还有一个 `TouchInteractionEvents`。本身依赖于 `InteractionEvents` 向外部发送元素触摸事件。

而除了发送事件之外，为了简化移动端的操作，该模块还直接依赖了 `canvas` 和 `move` 模块来实现元素拖拽和画布移动等；并且，如果 `diagram-js` 初始化时有添加了 `Palette` 或者 `ContextPad`，还会对这两个模块创建的元素绑定对应的方法。

> 默认 `Palette` 与 `ContextPad` 都只适配了 `click` 或者 `drag` 事件，在移动端可能无法正常触发。

在 `TouchInteractionEvents` 中主要分为三种事件响应：

1. `tap、doubletap`：类似 `click` 与 `dblclick`，在事件触发时也会将其替换为 `element.click` 与 `element.dblclick` 事件，然后通过 `interactionEvents` 向外发送一个标准事件
2. `pan、press`：单个触摸点持续触摸或者移动的事件，由于无法与传统的鼠标事件进行关联，并且这类操作一般是进行网页的页面移动操作，所以在这个模块中，会停止这个事件的默认响应，修改为 **元素或者画布的移动操作**，由 `Move` 模块进行该操作的实现和相关事件的发送
3. `pinch`：多指（两个手指及以上）缩放操作，一样无法与传统的鼠标事件进行关联，并且这类操作一般是进行网页的整体缩放；这个操作体现在 **画布** 操作中，就相当于是进行画布的缩放操作，所以这个事件一样会停止默认的事件响应，修改为由 `Canvas` 模块的 `zoom` 方法来执行，并发送相关事件

> 这个模块的鼠标事件初始化和事件管理是由 `Hammer.js` 来实现的，这里不做过多讲述。

大致代码如下：

```js
// return a Hammer.Manager
function createTouchRecognizer(node) {}

export default function TouchInteractionEvents(injector, canvas, eventBus, elementRegistry, interactionEvents) {
  var recognizer;
  
  function handler(type, buttonType) {
    return function(event) {
      var gfx = getGfx(event.target),
          element = gfx && elementRegistry.get(gfx);
      if (buttonType) {
        event.srcEvent.button = buttonType;
      }
      return interactionEvents.fire(type, event, element);
    };
  }


  function getGfx(target) {
    var node = domClosest(target, 'svg, .djs-element', true);
    return node;
  }

  function initEvents(svg) {
    recognizer = createTouchRecognizer(svg);

    // 画布移动
    function startGrabCanvas(event) {
      var lx = 0, ly = 0;

      function update(e) {
        var dx = e.deltaX - lx,
            dy = e.deltaY - ly;

        canvas.scroll({ dx: dx, dy: dy });

        lx = e.deltaX;
        ly = e.deltaY;
      }

      function end(e) {
        recognizer.off('panmove', update);
        recognizer.off('panend', end);
        recognizer.off('pancancel', end);
      }

      recognizer.on('panmove', update);
      recognizer.on('panend', end);
      recognizer.on('pancancel', end);
    }

    // pan 与 press 触发时的 处理事件，区分移动画布还是移动元素
    function startGrab(event) {
      var gfx = getGfx(event.target),
          element = gfx && elementRegistry.get(gfx);
      if (move && canvas.getRootElement() !== element) {
        return move.start(event, element, true);
      } else {
        startGrabCanvas(event);
      }
    }

    // 画布缩放操作
    function startZoom(e) {
      var zoom = canvas.zoom(),
          mid = e.center;

      function update(e) {
        var ratio = 1 - (1 - e.scale) / 1.50,
            newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ratio * zoom));
        canvas.zoom(newZoom, mid);
        stopEvent(e);
      }

      function end(e) {
        recognizer.off('pinchmove', update);
        recognizer.off('pinchend', end);
        recognizer.off('pinchcancel', end);
        recognizer.reset(true);
      }

      recognizer.on('pinchmove', update);
      recognizer.on('pinchend', end);
      recognizer.on('pinchcancel', end);
    }

    // tap 点击事件响应，对应 click 与 dblclick
    recognizer.on('tap', handler('element.click'));
    recognizer.on('doubletap', handler('element.dblclick', 1));
		// pan 与 press 对应的移动事件
    recognizer.on('panstart', startGrab);
    recognizer.on('press', startGrab);
		// pinch 缩放事件
    recognizer.on('pinchstart', startZoom);
  }
}
```

> 移动端的事件区分和处理，可以查看：
>
> - [移动端前端常见的触摸相关事件touch、tap、swipe等整理](https://www.cnblogs.com/imwtr/p/5882166.html)，作者：[-渔人码头-](https://home.cnblogs.com/u/imwtr/)
> - [如何实现移动端事件](https://zhuanlan.zhihu.com/p/533306933)，作者：[CreditFE信用前端](https://www.zhihu.com/people/creditfe)

#### 添加了 `Palette` 与 `ContextPad` 时需要对这两个模块进行处理

在上一章的 `Palette` 与 `ContextPad` 中，我们知道这两个模块产生的 `dom` 元素，默认也是支持 `click` 与 `drag` 事件，而这两个事件正好也需要在移动端进行对应的处理。

```js
  if (contextPad) {

    eventBus.on('contextPad.create', function(event) {
      var node = event.pad.html;
      // 找到对应的dom元素
      var padRecognizer = createTouchRecognizer(node);
      // 注册相关的事件方法
      padRecognizer.on('panstart', function(event) {
        contextPad.trigger('dragstart', event, true);
      });
      padRecognizer.on('press', function(event) {
        contextPad.trigger('dragstart', event, true);
      });
      padRecognizer.on('tap', function(event) {
        contextPad.trigger('click', event);
      });
    });
  }

  if (palette) {
    eventBus.on('palette.create', function(event) {
      var node = event.container;
      var padRecognizer = createTouchRecognizer(node);

      padRecognizer.on('panstart', function(event) {
        palette.trigger('dragstart', event, true);
      });
      padRecognizer.on('press', function(event) {
        palette.trigger('dragstart', event, true);
      });
      padRecognizer.on('tap', function(event) {
        palette.trigger('click', event);
      });
    });
  }
```

从代码上可以看出来，两个模块的处理方式都是一样的。

找到对应的 `dom` 元素（根节点），绑定相应的处理事件。

其中： `pan` 与 `press` 则对应 `drag` 事件，`tap` 对应 `click` 事件，然后通过 `Palette` 或者 `ContextPad` 自身的 `trigger` 方法来对应的事件执行。



## SelectionModule - 元素选择

`SelectionModule` 从名字上来看，就代表这 **选择** 的意思，也就是用来选择元素的模块。

但是这里的选择模块，更多的其实是起到一个 **提示当前需要选中的元素** 模块，以便让用户可以很明显的感受到当前正在操作的是哪个元素。

完整的 `SelectionModule` 包含三个模块（类）：

- `SelectionBehavior`：根据外部的不同事件，来操作 `Selection` 进行元素选择的一种默认行为
- `Selection`：提供操作元素选中状态和获取当前选中元素的模块，并向外部发送相应的事件
- `selectionVisuals`：提供为元素添加选中标记的功能

> `SelectionModule` 还有两个依赖的模块：`InteractionEventsModule` 与 `OutlineModule`，其中 `InteractionEventsModule` 用来实现事件的响应（点击选择等），而 `OutlineModule` 则是为元素增加一个 `react.djs-outline` 的覆盖物元素，用来实现 **被选中时的标记状态**

### SelectionBehavior 默认选中元素的行为

这个模块中，主要 **注册一些元素操作发生之后的默认选中行为（事件）**。

在 `SelectionBehavior` 初始化的时候，就会注册 4 个事件的监听函数，在回调用调用 `Selection` 来完成元素选中（`click` 具有两种情况）。

```js
export default function SelectionBehavior(eventBus, selection, canvas, elementRegistry) {
  eventBus.on('create.end', 500, function(event){
    // ...
    selection.select(xxx)
  })
  eventBus.on('connect.end', 500, function(event){
    // ...
    selection.select(xxx)
  })
  eventBus.on('shape.move.end', 500, function(event){
    // ...
    selection.select(xxx)
  })

  eventBus.on('element.click',  function(event){
    var element = event.element;
    if (element === canvas.getRootElement()) {
      element = null;
    }
    var isSelected = selection.isSelected(element),
        isMultiSelect = selection.get().length > 1;

    // Add to selection if CTRL or SHIFT pressed
    var add = hasPrimaryModifier(event) || hasSecondaryModifier(event);

    // 需要区分当前时多选还是单选模式，并且还会判断当前元素是否已经是已经选择过的元素
    // 1. 已经被选中，且已经有多个选中元素
    if (isSelected && isMultiSelect) {
      // 1.1 按住了 ctrl 或者 shift 键的时候，会取消该元素的选中状态
      if (add) {
        return selection.deselect(element);
      } 
      // 1.2 没有按住 Ctrl 或者 shift，则只保留当前元素的选中状态（需要取消多选状态）
      else {
        return selection.select(element);
      }
    } 
    // 2. 当前元素没有被选中，则直接选中该元素（传递是否是多选模式）
    else if (!isSelected) {
      selection.select(element, add);
    } 
    // 3. 当前元素已经被选中，则取消该元素的选中状态
    else {
      selection.deselect(element);
    }
  })
}
```



### Selection

而 `Selection` 才是提供真正的选择服务的模块。

`Selection` 本身是支持 **多选** 模式的，所以这个类下面设置了一个私有属性 `_selectedElements`，用来保存所有选中的元素。

整个 `Selection` 只提供四个方法：

- `select(element)`：将指定元素设置为选中状态（即添加到 `_selectedElements` 数组中）
- `deselect(element)`：将指定元素取消选中状态（即从 `_selectedElements` 数组中移除该元素）
- `get()`：获取所有选中的元素，返回 `_selectedElements` 数组
- `isSelected(element)`：判断指定元素是否被选中（即是否在 `_selectedElements` 数组中）

除了这四个方法和一个私有属性外，在初始化时还会注册几个监听函数，用来保证选中数据的准确性：

```js
export default function Selection(eventBus, canvas) {
  this._selectedElements = [];

  var self = this;
  // 元素被移除时需要从选中数组中清除
  eventBus.on([ 'shape.remove', 'connection.remove' ], function(e) {
    var element = e.element;
    self.deselect(element);
  });
  // 画布清空时，需要清理所有选中数据和状态
  eventBus.on([ 'diagram.clear', 'root.set' ], function(e) {
    self.select(null);
  });
}
```

该模块中，除了 `select` 方法外，其他方法与一般的数组元素查找、移除的逻辑类似，只是 `deselect` 方法还会向外发送一个 `selection.changed` 的事件，将 原来选中的数据 `oldSelection` 和移除了指定元素之后的新的选中数据 `newSelection` 传递出去。

而 `select` 方法，则与 `SelectionBehavior` 中的 `element.click` 事件的回调处理函数的逻辑类似，都会区分是否是多选模式，只是这里不会出现取消选中的状态：

```js
Selection.prototype.select = function(elements, add) {
  // 获取原来的选中数据，并复制一份作为 oldSelection
  var selectedElements = this._selectedElements,
      oldSelection = selectedElements.slice();

  if (!isArray(elements)) {
    elements = elements ? [ elements ] : []; // elements 参数为 null 时直接设置空数组
  }

  var canvas = this._canvas;
  var rootElement = canvas.getRootElement();

  // 排除根元素
  elements = elements.filter(function(element) {
    var elementRoot = canvas.findRoot(element);
    return rootElement === elementRoot;
  });

  // 1. 多选模式下，add 为 true（响应 SelectionBehavior 对 element.click 事件的回调处理函数）
  // 会将该元素插入到 this._selectedElements 中
  if (add) {
    forEach(elements, function(element) {
      if (selectedElements.indexOf(element) !== -1) {
        return;
      } else {
        selectedElements.push(element);
      }
    });
  }
  // 2. 否则的话，直接将传递进来的 elements 参数直接设置为 this._selectedElements
  else {
    this._selectedElements = selectedElements = elements.slice();
  }

  // 最后发送 selection.changed 事件
  this._eventBus.fire('selection.changed', { oldSelection: oldSelection, newSelection: selectedElements });
};
```

> 当 `selection.select(null)` 执行时（例如上文的画布清空时），此时的 `_selectedElements` 也被清空。

### selectionVisuals

如果说 `Selection` 和 `SelectionBehavior` 是 **为用户提供元素选择的能力以及自动选中元素的话**，`SelectionVisuals` 就是 **为用户提供能加明显的可视化的元素选中状态标记**。也就是官方给出的注释：`A plugin that adds a visible selection UI to shapes and connections by appending the hover and selected classes to them.Makes elements selectable, too.`

这个模块核心只有两个功能：

1. `element.hover/element.out` 事件触发时，为元素添加/移除一个 `hover` 类名
2. `selection.changed/element.changed` 事件触发时，重新更新所有选中元素的 **选中标记（`selected` 类名）**

不过在更新选中标记时，也有两种情况：

1. `selection.changed` 事件回调中是 `oldSelection` 与 `newSelection` 两个数组，需要分别遍历，移除取消选择的元素的选中标记并为新选择的元素添加选中标记，然后调用 `_updateSelectionOutline(newSelection)` 来设置多选状态下的提示标记（改方法内部会判断是否是多个元素选中）
2. `element.changed` 事件则只是判断发生变化的元素是否被选中，如果是的话，再调用 `_updateSelectionOutline(selection.get())` 来更新标记（这是因为 元素改变可能包含元素尺寸的改动，此时需要更新多选状态下的提示标记大小，如果没有选中的话，则不会对这部分内容造成影响）

> 这里我们重点来看一下下面的两种情况：

```js
var MARKER_HOVER = 'hover',
    MARKER_SELECTED = 'selected';
var SELECTION_OUTLINE_PADDING = 6;

export default function SelectionVisuals(canvas, eventBus, selection) {  
  this._canvas = canvas;
  var self = this;
  
  function addMarker(e, cls) {
    canvas.addMarker(e, cls);
  }
  function removeMarker(e, cls) {
    canvas.removeMarker(e, cls);
  }
  
  eventBus.on('selection.changed', function(event) {

    function deselect(s) {
      removeMarker(s, MARKER_SELECTED);
    }
    function select(s) {
      addMarker(s, MARKER_SELECTED);
    }

    var oldSelection = event.oldSelection,
        newSelection = event.newSelection;

    forEach(oldSelection, function(e) {
      if (newSelection.indexOf(e) === -1) deselect(e);
    });

    forEach(newSelection, function(e) {
      if (oldSelection.indexOf(e) === -1) select(e);
    });

    self._updateSelectionOutline(newSelection);
  });


  eventBus.on('element.changed', function(event) {
    if (selection.isSelected(event.element)) {
      self._updateSelectionOutline(selection.get());
    }
  });
}

SelectionVisuals.prototype._updateSelectionOutline = function(selection) {
  var layer = this._canvas.getLayer('selectionOutline');
  svgClear(layer);
  var enabled = selection.length > 1;
  var container = this._canvas.getContainer();

  svgClasses(container)[enabled ? 'add' : 'remove']('djs-multi-select');

  if (!enabled) {
    return;
  }

  var bBox = addSelectionOutlinePadding(getBBox(selection));
  var rect = svgCreate('rect');

  svgAttr(rect, assign({ rx: 3 }, bBox));
  svgClasses(rect).add('djs-selection-outline');
  svgAppend(layer, rect);
};

function addSelectionOutlinePadding(bBox) {
  return {
    x: bBox.x - SELECTION_OUTLINE_PADDING,
    y: bBox.y - SELECTION_OUTLINE_PADDING,
    width: bBox.width + SELECTION_OUTLINE_PADDING * 2,
    height: bBox.height + SELECTION_OUTLINE_PADDING * 2
  };
}
```

从 `selection.changed` 的回调函数中的两个方法：`deselect(e)` 和 `select(e)` 来看，选中元素与取消元素选中时，都是元素的 `class` 类名的切换。

当选中时添加一个 `selected` 类，取消选中时则将这个类名进行移除。

上文也提到了 `SelecttionModule` 依赖 `OutlineModule` 实现元素的选中标记，`OutlineModule` 会为元素添加一个 `rect.djs-outline` 的覆盖元素，如下图：

![image-20231018141724996](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231018141724996.png)

正常情况下，这个元素不会显示，也不会响应鼠标事件；而当元素被选中时：

![image-20231018142123980](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231018142123980.png)

![image-20231018142026407](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231018142026407.png)

由图可见，多选与单选状态下，选中标记的样式也不一样。

当执行 `_updateSelectionOutline` 方法时，会找到 `selectionOutline` 的图层，也就是 `dom` 中的 `svg g.viewport g.layer-selectionOutline` 元素。

**如果选中元素个数大于1，则判断当前处于多选状态，会为画布根节点 `container`（也就是 `div.djs-container` 元素）添加一个 `djs-multi-select` 类名**，此时会调整原本的 `.selected .djs-outline` 设置的边框颜色；否则的话，则会 **移除 `container` 上的 `djs-multi-select` 类名**。

并且在选中元素大于1时，会根据所有选中元素的最小坐标原点与整体位置，计算出一个 **可以完整包裹所有选中元素的一个 `box` 对象**，然后在 `selectionOutline` 图层中创建一个 `rect 矩形元素`，将其设置为 `box` 定义的大小和位置并显示出来。

## DraggingModule 与 MoveModule - diagram-js 的 DnD 模块

`Dnd`，即 `Drag and Drop`，也就是我们常说的 拖拽 功能。

diagram-js 的元素拖拽功能由两个部分组成：`MoveModule` 与 `DraggingModule`，其中 `MoveModule` 又是依赖于 `DraggingModule` 来实现的，所以我们在使用时只需要直接引入 `MoveModule` 就可以了。

例如：

```vue
<script setup>
  import { onMounted } from 'vue'
  import Diagram from 'diagram-js'
  import MoveModule from 'diagram-js/lib/features/move'
  import ModelingModule from 'diagram-js/lib/features/modeling'
  import { bootstrapShapes } from '../../utils/bootstrap.js'

  const bootstrapDiagram = (id) => {
    return new Diagram({
      canvas: { container: document.getElementById(id) },
      modules: [MoveModule, ModelingModule]
    })
  }

  onMounted(() => {
    const djs = bootstrapDiagram('dragging-canvas')
    bootstrapShapes(djs.get('canvas'))
  })
</script>

<template>
  <div id="dragging-canvas" class="canvas"></div>
</template>
```

> 当然，需要注意的是 `MoveModule` 本身的 `ModuleDeclaration`（也就是每个模块目录中的 `index.js`，里面会进行对应模块的依赖声明和引入）没有声明对 `ModelingModule` 的依赖，但是 `Move` 模块（类）里面，是有依赖 `modeling` 模块实例的，所以使用时我们也需要在 `modules` 中引入 `ModelingModule`。

这时我们就可以正常的在页面上进行元素的拖动了。

![chrome-capture-2023-9-23](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/chrome-capture-2023-9-23.gif)

### MoveModule - 元素移动

一般来说，除了 `H5` 提供的原生的 `Drag` 和 `Drop` 事件之外，要通过 `js` 实现元素的拖拽，基本上都是通过监听 **鼠标按下 `mousedown`、松开 `mouseup` 与鼠标移动 `mousemove` 三个事件** 来实现的。

当鼠标按下时，保留下当前的元素位置和鼠标位置；当鼠标松开时，获取当前的鼠标位置；然后计算鼠标移动的距离，合并到原来的元素坐标上，得到的就是新的元素坐标；最后更新一下元素的位置即可。

但是这样一来，我们是很难确定新位置的准确性的（因为移动过程中只有鼠标在移动，无法正确的判断元素在当前位置的一个显示状态）。所以很多情况下我们都是在鼠标移动过程中实时的更新元素的位置。

> 例如我在另外一个项目里面的写法：
>
> https://github.com/miyuesc/vue-data-visualization/blob/main/src/hooks/dragEventHook.ts

而在 `diagram-js` 中的拖拽，就是通过 **第一种方式，也就是在鼠标松开之后才更新元素位置的**；也就是 `MoveModule` 中的 `Move` 模块；而为了让用户更加方便的查看当前移动位置的准确性，在 `MoveModule` 中增加了一个 `MovePreview` 模块来提供一个移动预览的效果。

那么 `Move` 模块中是完整的设置了 `mousedouwn`、`mouseup` 这些事件的监听吗？让我们接着往下看。

### Move - 元素移动事件的发起者与处理者

这个模块的源代码位于 `diagram-js/lib/features/move/Move.js`，整个模块只提供了一个 `start` 方法。在使用时，可以通过 `djs.get('move').start(event, element)` 来调用该方法。

整个 `Move` 依赖 `EventBus、Dragging、Modeling、Selection、Rules` 五个模块，分别用来：

- `EventBus`：监听某些事件与对外发送事件
- `Dragging`：实际的拖放逻辑与拖放过程中的生命周期事件，这里用来初始化拖放过程
- `Modeling`：最终的元素位置移动
- `Selection`：用来获取选中的元素，实现已选元素的整体拖动
- `Rules`：校验元素是否允许移动

在 `Move` 初始化时，会执行以下内容：

```js
import { assign, filter, groupBy, isObject } from 'min-dash';
import { classes as svgClasses } from 'tiny-svg';
import { getOriginal as getOriginalEvent } from '../../util/Event';
import { isPrimaryButton } from '../../util/Mouse';

var LOW_PRIORITY = 500,
    MEDIUM_PRIORITY = 1250,
    HIGH_PRIORITY = 1500;
var round = Math.round;

function mid(element) {
  return {
    x: element.x + round(element.width / 2),
    y: element.y + round(element.height / 2)
  };
}

export default function MoveEvents(eventBus, dragging, modeling, selection, rules) {

  // 通过 Rules 模块判断元素是否能够移动
  function canMove(shapes, delta, position, target) {
    return rules.allowed('elements.move', {
      shapes: shapes,
      delta: delta,
      position: position,
      target: target
    });
  }

	// 高优先级的监听 shape.move.start 事件，处理相关的 context 上下文对象
  eventBus.on('shape.move.start', HIGH_PRIORITY, function(event) {
    var context = event.context,
        shape = event.shape,
        shapes = selection.get().slice();

    if (shapes.indexOf(shape) === -1) {
      shapes = [ shape ];
    }

    shapes = removeNested(shapes);

    assign(context, {
      shapes: shapes,
      validatedShapes: shapes,
      shape: shape
    });
  });

	// 低优先级的shape.move.start事件，在上面的事件函数的后面执行
  // 用于判断元素是否能移动
	eventBus.on('shape.move.start', MEDIUM_PRIORITY, function(event) {
    var context = event.context,
        validatedShapes = context.validatedShapes,
        canExecute;

    canExecute = context.canExecute = canMove(validatedShapes);

    if (!canExecute) {
      return false;
    }
  });

  // 低优先级的事件，用于合并移动过程中的事件对象参数,记录移动距离和当前坐标
  eventBus.on('shape.move.move', LOW_PRIORITY, function(event) {
    var context = event.context,
        validatedShapes = context.validatedShapes,
        hover = event.hover,
        delta = { x: event.dx, y: event.dy },
        position = { x: event.x, y: event.y },
        canExecute;

    canExecute = canMove(validatedShapes, delta, position, hover);

    context.delta = delta;
    context.canExecute = canExecute;

    if (canExecute === null) {
      context.target = null;

      return;
    }

    context.target = hover;
  });

  // 移动结束之后,通过 modeling 更新元素位置
  eventBus.on('shape.move.end', function(event) {

    var context = event.context;

    var delta = context.delta,
        canExecute = context.canExecute,
        isAttach = canExecute === 'attach',
        shapes = context.shapes;

    if (canExecute === false) {
      return false;
    }

    // 计算整数移动
    delta.x = round(delta.x);
    delta.y = round(delta.y);

    if (delta.x === 0 && delta.y === 0) {
      return;
    }

    modeling.moveElements(shapes, delta, context.target, {
      primaryShape: context.shape,
      attach: isAttach
    });
  });

  // 重点:鼠标的按下事件,当鼠标按下时调用 start 方法开启元素移动
  eventBus.on('element.mousedown', function(event) {
    if (!isPrimaryButton(event)) {
      return;
    }

    var originalEvent = getOriginalEvent(event);

    // 验证必须是由默认的鼠标事件触发的
    if (!originalEvent) {
      throw new Error('must supply DOM mousedown event');
    }

    return start(originalEvent, event.element);
  });

  /**
   * Start move.
   *
   * @param {MouseEvent|TouchEvent} event
   * @param {Shape} element
   * @param {boolean} [activate]
   * @param {Object} [context]
   */
  function start(event, element, activate, context) {
    if (isObject(activate)) {
      context = activate;
      activate = false;
    }

    // 连线元素(具有 waypoints)和根元素禁止移动
    if (element.waypoints || !element.parent) {
      return;
    }

    // 如果元素有 djs-hit-no-move 类名标记,也不能移动
    if (svgClasses(event.target).has('djs-hit-no-move')) {
      return;
    }

    var referencePoint = mid(element);

    dragging.init(event, referencePoint, 'shape.move', {
      cursor: 'grabbing',
      autoActivate: activate,
      data: {
        shape: element,
        context: context || {}
      }
    });

    return true;
  }

  // 声明该方法
  this.start = start;
}

MoveEvents.$inject = [ 'eventBus', 'dragging', 'modeling', 'selection', 'rules' ];


// 返回没有嵌套关系的元素数组
function removeNested(elements) {
  var ids = groupBy(elements, 'id');

  return filter(elements, function(element) {
    while ((element = element.parent)) {
      if (ids[element.id]) {
        return false;
      }
    }

    return true;
  });
}
```

> 整个 `Move.js` 的代码也就只有这些内容。

说明这个 `Move.js`，核心作用就是 **设置鼠标事件 `mousedown` 的监听函数，来开启元素移动的状态；并且在元素移动的过程中，更新和处理上下文对象的参数，最后在移动结束后通过 `modeling` 来实现元素位置的更新**。

#### 开始移动

当我们在元素上按下鼠标时，就会触发 `element.mousedown` 事件，此时会触发调用 `this.start` 方法，通过 `dragging.init` 开始拖拽过程。

>  `dragging` 模块在 `init` 之后，就会根据鼠标移动发送相应的 `move` 事件，又会触发 `Move` 模块中的监听事件执行。这里我们下一小节 `dragging` 模块再分析。

而在 **开启元素移动状态或者元素移动过程中的数据处理过程中，都会借用 `rules` 模块执行 `elements.move` 规则的校验**。也就是说，如果我们定义了一个 `elements.move` 规则，规定了某些元素无法移动的话，则在 `shape.move.start` 事件触发时就会直接停止。

> `shape.move.start` 设置了一高一低两个优先级的监听事件，其中 **高优先级（1500）的事件用来获取需要移动的数据并组装上下文对象，低优先级（1250）事件则是从高优先级事件封装好的上下文对象中获取到将会移动的元素进行 `rules` 校验，确保无法移动的元素不会被移动**。
>
> 设置两种优先级（这两个优先级都比默认的1000要高），也是为了保证 **校验过程始终执行在参数组装之前，并且只要用户没有手动设置高优先级监听并返回 `false`，校验过程都能顺利执行**。

例如：

```js
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider'

class CustomRules extends RuleProvider {
  constructor(eventBus) {
    super(eventBus)
  }

  init() {
    this.addRule('elements.move', function (context) {
      const { shapes } = context

      if (shapes.findIndex((i) => i.id === 's1') > -1) {
        return false
      }
    })
  }
}

CustomRules.$inject = ['eventBus']

export default {
  __init__: ['customRules'],
  customRules: ['type', CustomRules]
}
```

这样当我们选中的元素中存在了 `id` 为 `s1` 的元素时，我们就无法进行元素移动了。

当然，我们也可以借助 `EventBus` 的优先级处理，来通过 `shape.move.start` 事件截断移动过程：

```vue
<script setup>
  // ... 省略上面的部分代码
  onMounted(() => {
    const djs = bootstrapDiagram('dragging-canvas')
    bootstrapShapes(djs.get('canvas'))
		// 通过eventBus实现截断
    djs.get('eventBus').on('shape.move.start', 1300, ({ context }) => {
      const validatedShapes = context.validatedShapes
      if (validatedShapes.findIndex((i) => i.id === 's1') > -1) {
        return false
      }
    })
  })
</script>
```

此时一样能实现 `customRules` 中一样的效果。

#### 移动过程中

> 这里先提示一下，`dragging.init` 接收的第三个参数会进行保存，作为后续发送事件的 **事件名前缀**，`Move.js` 中定义的前缀为 `shape.move`，所以后面在移动过程中才会发送相应的 `shape.move.move、shape.move.end` 等事件。

一般情况话，如果 **只有一个无限大的画布与一个元素**，我们在移动这个元素时 **只需要考虑移动的距离**。而当 **存在多个元素时，就需要考虑元素是否移动到了另一个元素上，并且是否能够生成嵌套关系**（这里不考虑鼠标移动到浏览器外部造成的事件无法响应的情况）。

> 当然，正常情况下画布虽然是无限大的，但是显示这个画布的元素是有限的。所以当鼠标移动到这个显式元素的边界区域时，还要考虑画布的移动。这两个模块暂时没有涉及。

所以在 `move` 的过程中，我们还需要一直判断当前鼠标移动到的位置是否有元素，并且判断是否能够将我们移动的这个元素放置在这个元素中。

所以这里会一直监听 `shape.move.move` 事件，从上下文对象中提取到 **当前鼠标所在的** `hover` 元素，然后进行判断（`canMove` 方法来调用 `Rules` 规则）。

我们可以在规则中通过 `target` 参数获取到当前鼠标所指的目标元素，来设置是否能够放置。

例如我们在上面的 `CustomRules` 中增加一个判断：

```js
init() {
  this.addRule('elements.move', function (context) {
    const { shapes, target } = context

    if (shapes.indexOf((i) => i.id === 's1') > -1) {
      return false
    }

    // 增加一个 target 的判断
    if (target && target.id === 's3') {
      return false
    }
  })
}
```

此时我们在进行移动时，如果元素拖动到了 `s3` 这个元素上，就会进行相应的提示：

<img src="./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231024135622704.png" alt="image-20231024135622704" style="zoom:50%;" />

> 当然，这个方法也可以通过注册 `shape.move.move` 的高优先级监听事件来处理，但是这种情况下可能会缺少必要的上下文事件对象属性；并且直接 `return false` 的话也会导致拖拽被中断。

#### 移动结束之后

在元素移动结束之后，即 `mouseup` 事件触发时（由 `Dragging` 模块发送），会向外发送一个 `shape.move.end` 的事件。此时 `Move` 模块会设置对应的监听函数，在这个函数中通过 `modeling.moveElements` 来实现元素的 **实际位置更新与重绘**。

当然，如果在 `Dragging` 发送的事件中，上下文对象设置了 `canExecute` 为 `false` 的话，也会立即退出函数执行，取消元素的实际移动。

> 整个 `Modeling` 是提供给开发者的 **大部分建模操作方法** 的模块，包含了很多个 `Handler` 处理程序。
>
> 由于其内容太多，会单独进行介绍。

### Dragging - 拖拽的实际处理过程与事件发送者

在 `Move` 中，只有一个 `start` 方法调用 `dragging。init()` 开启了拖拽过程，其余的内容都是通过事件监听来完成的；而 `Dragging` 就是在拖拽开启之后，来注册和管理实际的 `dom` 事件并对外发送整个拖拽过程中的状态事件。

整个 `Dragging` 对外提供了 8 个方法：

- `init`：初始化拖拽动作，设置相关的变量与事件绑定
- `move`：鼠标移动 `dom` 事件对应的绑定函数，会对外发送指定前缀的 `move` 事件
- `hover`：当 `element.hover` 事件触发时，处理相关参数的函数，也会发送对应的 `hover` 事件
- `out`：当 `element.out` 事件触发时，处理相关参数的函数，也会发送对应的 `out` 事件
- `end`：拖拽动作结束时（即鼠标抬起）对应的 `dom` 事件的绑定函数，会移除相应的 `dom` 事件监听，并发送 `end、ended` 等事件
- `cancel`：主动关闭拖拽过程的方法，也会清除 `dom` 事件的绑定函数，并触发 `cancel、canceled` 事件
- `context`：获取整个拖拽过程中的公共上下文参数的方法
- `setOptions`：设置拖拽过程中的一些配置参数

但是 `Dragging` 本身没有对外放出任何一个属性，而是通过 **闭包** 的方式 **在函数内部声明了一个 `context` 变量，通过提供的每个方法来修改变量内容，避免过程中被外界改变**。

在 `Dragging` 函数内部，还有一个 `fire` 方法，用来组装事件对象和对外发送事件：

```js
function fire(type, dragContext) {
  dragContext = dragContext || context;

  var event = eventBus.createEvent(
    assign(
      {},
      dragContext.payload,
      dragContext.data,
      { isTouch: dragContext.isTouch }
    )
  );

  if (eventBus.fire('drag.' + type, event) === false) {
    return false;
  }

  return eventBus.fire(dragContext.prefix + '.' + type, event);
}
```

#### drag.init - 初始化拖拽过程

上面说到，`Move` 模块会监听 `element.mousedown` 事件来调用 `dragging.init` 方法，开启元素拖拽的操作。

而 `init` 方法，就会记录当前元素、坐标、拖拽起点等信息，并绑定鼠标移动等 `dom` 事件的处理函数。

```js
function init(event, relativeTo, prefix, options) {
	// 同一时间只能触发一次初始化
  if (context) {
    cancel(false);
  }

  // 参数处理
  if (typeof relativeTo === 'string') {
    options = prefix;
    prefix = relativeTo;
    relativeTo = null;
  }

  // 合并配置
  options = assign({}, defaultOptions, options || {});

  var data = options.data || {},
      originalEvent, // 原始的 dom 事件对象
      globalStart, // 事件发生时的坐标
      localStart, // 在画布内对应的坐标位置
      endDrag, // 鼠标抬起时的处理事件
      isTouch; // 是否是触摸事件

  // trapClick 默认为 true，会防止拖拽过程中触发其他元素的点击事件
  if (options.trapClick) {
    endDrag = trapClickAndEnd;
  } else {
    endDrag = end;
  }

  // 根据事件对象获取相应参数
  if (event) {
    originalEvent = getOriginal(event) || event;
    globalStart = toPoint(event);

    // 阻止原始 dom 事件的继续传播
    stopPropagation(event);
    if (originalEvent.type === 'dragstart') {
      preventDefault(originalEvent);
    }
  } else {
    originalEvent = null;
    globalStart = { x: 0, y: 0 };
  }
	// 得到事件发生点相对画布原点的位置
  localStart = toLocalPoint(globalStart);
	// 没有传入相对坐标的话，默认为事件发生点的相对位置
  if (!relativeTo) {
    relativeTo = localStart;
  }

  isTouch = isTouchEvent(originalEvent);

  // 保留下拖拽过程中的全局参数对象
  context = assign({
    prefix: prefix,
    data: data,
    payload: {}, // 过程中的数据
    globalStart: globalStart,
    displacement: deltaPos(relativeTo, localStart),
    localStart: localStart,
    isTouch: isTouch
  }, options);

  // 为了测试，可以手动绑定 dom 事件
  if (!options.manual) {
    if (isTouch) {
      domEvent.bind(document, 'touchstart', trapTouch, true);
      domEvent.bind(document, 'touchcancel', cancel, true);
      domEvent.bind(document, 'touchmove', move, true);
      domEvent.bind(document, 'touchend', end, true);
    } else {
      // 阻止这两个事件的默认事件
      domEvent.bind(document, 'dragstart', preventDefault);
      domEvent.bind(document, 'selectstart', preventDefault);
      
      domEvent.bind(document, 'mousemove', move);
      domEvent.bind(document, 'mousedown', endDrag, true);
      domEvent.bind(document, 'mouseup', endDrag, true);
    }
		
    // 绑定键盘事件，响应 esc 直接取消拖拽
    domEvent.bind(document, 'keyup', checkCancel);
		// 设置监听事件，来配置 target 目标元素
    eventBus.on('element.hover', hover);
    eventBus.on('element.out', out);
  }

  // 发送事件
  fire('init');

  // 是否自动开启拖拽操作，如果为 false 的话，则会在 mousemove 触发时才开始
  if (options.autoActivate) {
    move(event, true);
  }
}
```

也正如我们预想的一样，在 `init` 方法中，除了 **初始化拖拽过程中的坐标数据** 之外，就只剩下 **原始的 `dom` 事件绑定** 了。

但是这里需要注意一下 `fire('init')` 方法:

```js
function fire(type, dragContext) {
  dragContext = dragContext || context;

  var event = eventBus.createEvent(
    assign(
      {},
      dragContext.payload,
      dragContext.data,
      { isTouch: dragContext.isTouch }
    )
  );

  if (eventBus.fire('drag.' + type, event) === false) {
    return false;
  }

  return eventBus.fire(dragContext.prefix + '.' + type, event);
}
```

这个方法中会发送两个事件：`drag.${type}` 和 `${prefix}.${type}` ，每个事件发送出去时，**事件对象的最初包含 `dragContext` 或者 `context` 中的 `playload` 与 `data` 两个数据的组合**，当然还有一个是否是触摸事件的标志位。而当第二个参数 `dragContext` 未传时，使用的就是 `Dragging` 模块中闭包保存的 `context` 对象。

当 `init()` 方法执行时，`context` 对象中就会保存 **除了相关坐标、距离和标志位之外，还会保存一个 `data` 与 `payload` 对象**，用来在整个拖拽过程中进行 **参数共享**。

例如上面的 `Move` 模块中的使用：

```js
// 假设我们移动demo中的 s2 元素，此时
dragging.init(event, referencePoint, 'shape.move', {
  cursor: 'grabbing',
  autoActivate: activate,
  data: {
    shape: element,
    context: context || {}
  }
});
```

此时 `context` 对象如下： 

```js
context = {
  prefix: 'shape.move',
  data: {
    shape: {id: 's2', width: 50, height: 50, x: 200, y: 10, parent: Object},
    context: {} // move.start() 
  },
  payload: {},
  globalStart: {x: 248, y: 121},
  displacement: {x: -3, y: -6}, 
  localStart: {x: 228, y: 41},
  isTouch: false,

  cursor: 'grabbing',
  autoActivate: false,
  threshold: 5,
  trapClick: true
}
```

当外部监听 `drag.init` 或者 `shape.move.init` 时，就会接收到由上面的 `data` 和 `payload、isTouch` 组合成的对象。

然后，就是鼠标移动时监听鼠标的移动状态了。

#### drag.move - 鼠标移动中的数据处理

首先我们看一下源代码：

```js
var DRAG_ACTIVE_CLS = 'djs-drag-active';

function move(event, activate) {
  // 从 context 中拿到初始数据并与当前事件位置进行计算
  var payload = context.payload,
      displacement = context.displacement;
  var globalStart = context.globalStart,
      globalCurrent = toPoint(event), // 当前事件的坐标
      globalDelta = deltaPos(globalCurrent, globalStart); // x y 偏移量
  var localStart = context.localStart,
      localCurrent = toLocalPoint(globalCurrent), // 当前事件坐标在画布中的位置
      localDelta = deltaPos(localCurrent, localStart); // 画布中的坐标偏移量

  // context.active 为 false，并且 activate 显示激活为 true 或者移动距离已经达到了 options 中设定的阈值
  // 这里是拖拽进行中第一次触发 move 事件执行时的逻辑
  if (!context.active && (activate || getLength(globalDelta) > context.threshold)) {
    // 记录当前坐标数据与原始 dom 事件对象到 context 对象的 payload 属性中
    assign(payload, {
      x: round(localStart.x + displacement.x),
      y: round(localStart.y + displacement.y),
      dx: 0,
      dy: 0
    }, { originalEvent: event });
		// 如果 发送出去的 drag.start 或者 ${context.prefix}.sart 返回了 false，则调用 cancel 停止拖拽
    if (false === fire('start')) {
      return cancel();
    }
		// 显示设置 已经在 move 过程中
    context.active = true;

    // 如果设置中没有设置 keepSelection 保留选中状态的话，这里会取消元素选中，
    // 但是会将数据保存在 payload.previousSelection中
    if (!context.keepSelection) {
      payload.previousSelection = selection.get();
      selection.select(null);
    }

    // 设置鼠标样式
    if (context.cursor) {
      cursorSet(context.cursor);
    }

    // 为根节点设置一个 拖拽中 的样式类名
    canvas.addMarker(canvas.getRootElement(), DRAG_ACTIVE_CLS);
  }
  // 阻止默认事件传播
  stopPropagation(event);

  // 如果是在正常的拖拽中的话，重新计算坐标数据然后合并到 context.payload 中
  if (context.active) {
    assign(payload, {
      x: round(localCurrent.x + displacement.x),
      y: round(localCurrent.y + displacement.y),
      dx: round(localDelta.x),
      dy: round(localDelta.y)
    }, { originalEvent: event });

    // 对外发送 move 相关的事件
    fire('move');
  }
}
```

在 `move` 中，主要就是进行 **当前坐标与移动偏移量** 的计算和保存，但是 **在首次执行（拖拽刚开始）时，会增加一个 `start` 的事件发送，然后才设置拖拽中状态与选中元素的处理**。

值得注意的是，在 `move` 拖拽过程中，会清空 `selection` 的选中数据，这放在 `bpmn-js` 中，就会对我们 **使用 `selection.changed` 来实现的属性面板的显示造成影响**，例如：

![chrome-capture-2023-9-25](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/chrome-capture-2023-9-25.gif)

> 因为这个项目的判断是，没有选中元素时会默认设置为 **根节点**，所以 **即使当我们先选中了元素再进行拖拽，在拖拽过程中属性面板都会改为成根节点的相关配置**，直到拖拽结束之后才会恢复为原来的样子。

**那如果在拖动过程中鼠标移动到了一个元素上，会发生什么**？

这里就涉及到在 `init` 的时候我们在 `eventBus` 中注册的 `element.hover` 和 `element.out` 两个事件了。

```js
function hover(event) {
  var payload = context.payload;

  payload.hoverGfx = event.gfx;
  payload.hover = event.element;

  fire('hover');
}

function out(event) {
  fire('out');

  var payload = context.payload;

  payload.hoverGfx = null;
  payload.hover = null;
}
```

这一步在 `Dragging` 中的处理其实很简单，`hover` 时记录当前的元素到 `payload` 中，`out` 时将这个元素清除掉即可，然后剩下的则交给 **在 `EventBus` 中注册了相关的 `drag.hover/out` 或者 `${context.prefix}.hover/out` 事件的回调函数中进行处理**。

所以在 `Move.js` 模块中有注册 `shape.move.move` 的事件，来校验 `Rules` 规则中的相关判断。

然后，就剩下拖拽结束时的处理了。

#### drag.end - 拖拽正常结束

在 `drag.init()` 方法中，注册 `mouseup` 事件对应的 回调函数时，会判断 `options.trapClick` 来确定是使用 `trapClickAndEnd` 还是 `end` 方法。而 `trapClickAndEnd` 内部其实是对 `end` 方法的一层封装，并且默认情况下 `options.trapClick` 也是 `true`。

所以我们直接来看着两个方法相关的内容：

```js
function trapClickAndEnd(event) {
  var untrap;
  if (context.active) {
    // 如果在拖拽激活的过程中，会注册一个很高优先级的 element.click 的监听事件
    untrap = installClickTrap(eventBus);
    // 400ms 后取消上面注册的事件
    setTimeout(untrap, 400);
		// 阻止 dom 事件的原生响应
    preventDefault(event);
  }
	// 调用 end 触发拖拽结束
  end(event);
}

function end(event) {
  var previousContext,
      returnValue = true;

  if (context.active) {
    if (event) {
      context.payload.originalEvent = event;
      stopPropagation(event);
    }
    // 发送 drag.end 与 ${context.prefix}.end 事件，获取其回调返回值
    returnValue = fire('end');
  }
	// 如果上面的事件回调中有返回 false，则触发 rejected 事件，表示拖拽失败
  if (returnValue === false) {
    fire('rejected');
  }
	// 清空相应的变量与事件绑定
  previousContext = cleanup(returnValue !== true);
  // 发送 drag.ended 与 ${context.prefix}.ended 事件，表示拖拽正式结束
  fire('ended', previousContext);
}

function cleanup(restore) {
  var previousContext,
      endDrag;

  fire('cleanup');
  // 重置鼠标样式
  cursorUnset();
	
  if (context.trapClick) {
    endDrag = trapClickAndEnd;
  } else {
    endDrag = end;
  }

  // 解除 dom 事件绑定
  domEvent.unbind(document, 'mousemove', move);
  domEvent.unbind(document, 'dragstart', preventDefault);
  domEvent.unbind(document, 'selectstart', preventDefault);
  domEvent.unbind(document, 'mousedown', endDrag, true);
  domEvent.unbind(document, 'mouseup', endDrag, true);
  domEvent.unbind(document, 'keyup', checkCancel);
  domEvent.unbind(document, 'touchstart', trapTouch, true);
  domEvent.unbind(document, 'touchcancel', cancel, true);
  domEvent.unbind(document, 'touchmove', move, true);
  domEvent.unbind(document, 'touchend', end, true);
	// 解除 eventBus 中的相关事件回调
  eventBus.off('element.hover', hover);
  eventBus.off('element.out', out);

  // 移除根节点的拖拽中标志类名
  canvas.removeMarker(canvas.getRootElement(), DRAG_ACTIVE_CLS);

  // 获取到 payload 中保存的原始选中元素，重新恢复选中状态
  var previousSelection = context.payload.previousSelection;
  if (restore !== false && previousSelection && !selection.get().length) {
    restoreSelection(previousSelection);
  }
	// 保留这次的事件上下文对象，清空闭包中的 context 变量引用
  previousContext = context;
  context = null;

  return previousContext;
}


var TRAP_PRIORITY = 5000;
// 以很高的优先级来避免其他地方注册的 element.click 的事件响应
export function install(eventBus, eventName) {
  eventName = eventName || 'element.click';
  function trap() {
    return false;
  }
  eventBus.once(eventName, TRAP_PRIORITY, trap);
  return function() {
    eventBus.off(eventName, trap);
  };
}
```

因为拖拽相关的 `dom` 都是绑定在 `document` 对象上的，所以 如果在一个元素上结束这个拖拽（鼠标松开，触发 `mouseup`），也会触发这个元素对应的 `click` 事件（存在父子关系就会触发内部元素的 `click` 事件）。所以这时如果我们不做处理的话，在拖拽结束的同时还会通过 `EventBus` 对外发送一个 `element.click` 事件，可能会对我们的正常业务代码带来不必要的麻烦。所以这里才会在 `mouseup` 的时候注册一个很高优先级的 `element.click` 的响应回调，并通过 `return false` 阻止其他监听回调的触发。

剩下的 `end` 方法，内容其实就很简单了。

#### drag.cancel - 主动结束拖拽

除了上述的几个方法之外，最后就剩下一个 `cancel` 了。

`cancel`，顾名思义就是 **取消** 的意思，这里用来主动结束拖拽动作。

```js
function cancel(restore) {
  var previousContext;
  if (!context) {
    return;
  }

  var wasActive = context.active;

  if (wasActive) {
    fire('cancel');
  }

  previousContext = cleanup(restore);

  if (wasActive) {
    fire('canceled', previousContext);
  }
}
```

整个方法的内容也很简单：**如果是处于正常拖拽中（`context.active` 为 `true`），才会对外发送相应的 `cancel/canceled` 事件，然后通过 `cleanup` 方法清除原来的 `dom` 事件绑定与闭包中的状态数据等**。

> 那么为什么在移动过程中除了记录事件位置之外，还需要记录一个画布的相对位置呢？

这是因为，`diagram-js` 等类似的图形绘制库，默认提供的画布都是 **几乎无限大的**，所以一个单纯的一个视窗大小的元素很大概率无法完整的显示整个图。

此时就需要处理 **边界场景**，即鼠标移动到画布边缘附近时，如何移动画布与元素。这就是 `AutoScroll` 模块来实现的了。

## AutoScrollModule - 边界情况下的画布移动

该模块位于 `diagram-js/lib/features/auto-scroll` 目录中，主要是 `AutoScroll.js`。整个 `AutoScrollModule` 需要依赖与 `DraggingModule`，但是 `AutoScroll.js` 在依赖注入系统中依赖 `eventBus` 和 `canvas`，并接收 `config` 配置项中的 `autoScroll` 配置。

`AutoScroll` 的主要功能有：

- 监听鼠标移动事件，检测鼠标是否接近绘图区域的边缘，当鼠标接近边缘时，自动触发滚动操作，使绘图区域滚动到相应的位置
- 控制滚动速度和滚动方向，以提供流畅的滚动体验
- 处理滚动过程中的边界情况，确保滚动不会超出绘图区域的范围

当然，这里监测鼠标移动，**只会在 `drag` 拖拽的过程开始后才开始监听**。

所以，`AutoScroll` 在实际代码编写中，只设置了 `drag` 事件相应的监听函数。

```js
export default function AutoScroll(config, eventBus, canvas) {
  this._canvas = canvas;
	// 合并配置项
  this._opts = assign({
    scrollThresholdIn: [ 20, 20, 20, 20 ],
    scrollThresholdOut: [ 0, 0, 0, 0 ],
    scrollRepeatTimeout: 15,
    scrollStep: 10
  }, config);

  var self = this;

  eventBus.on('drag.move', function(e) {
    // 计算当前坐标在画布中的位置
    var point = self._toBorderPoint(e);
    // 调用 startScroll 开始滚动
    self.startScroll(point);
  });

  eventBus.on([ 'drag.cleanup' ], function() {
    // drag 取消时，停止滚动
    self.stopScroll();
  });
}

AutoScroll.prototype._toBorderPoint = function(event) {
  var clientRect = this._canvas._container.getBoundingClientRect();

  var globalPosition = toPoint(event.originalEvent);

  return {
    x: globalPosition.x - clientRect.left,
    y: globalPosition.y - clientRect.top
  };
};

AutoScroll.$inject = [ 'config.autoScroll', 'eventBus', 'canvas' ];
```

其中，`AutoScroll` 接收的配置项中，包含 `scrollThresholdIn, scrollThresholdOut, scrollRepeatTimeout, scrollStep` 四个配置，分别代表：与画布的边界的最大距离（画布内）和最小距离，滚动频率，单次滚动步长。

当 `drag.move` 事件触发时，会通过 `_toBorderPoint(event)` 方法拿到原始的 `dom` 事件对象，得到 **当前事件坐标在画布容器内的相对位置**。然后通过 `startScroll` 来确定是否需要开始滚动。

#### startScroll - 根据坐标判断和开启画布滚动

这个方法接收一个参数，也就是 `_toBorderPoint` 计算得到的 **当前事件相对画布容器的坐标**。

然后，则是与 `options` 中配置的边界范围，来确定当前位置处于哪个边界，需要如何滚动。

```js
AutoScroll.prototype.startScroll = function(point) {
  var canvas = this._canvas;
  var opts = this._opts;
  var self = this;

  // canvas 容器的视口相对位置与大小
  var clientRect = canvas.getContainer().getBoundingClientRect();
	// 得到事件坐标与画布四个边界的距离
  var diff = [
    point.x,
    point.y,
    clientRect.width - point.x,
    clientRect.height - point.y
  ];
	// 停止上次的滚动，清除相应状态
  this.stopScroll();
	// 画布需要移动的距离
  var dx = 0,
      dy = 0;
	// 遍历 diff 数组，判断当前事件在哪个位置，设置对应方向的滚动距离
  for (var i = 0; i < 4; i++) {
    if (between(diff[i], opts.scrollThresholdOut[i], opts.scrollThresholdIn[i])) {
      if (i === 0) {
        dx = opts.scrollStep;
      } else if (i == 1) {
        dy = opts.scrollStep;
      } else if (i == 2) {
        dx = -opts.scrollStep;
      } else if (i == 3) {
        dy = -opts.scrollStep;
      }
    }
  }
	// x y 双轴的距离都不为0，则调用 canvas.scroll 滚动画布
  if (dx !== 0 || dy !== 0) {
    canvas.scroll({ dx: dx, dy: dy });
		// 设置定时任务继续滚动
    this._scrolling = setTimeout(function() {
      self.startScroll(point);
    }, opts.scrollRepeatTimeout);
  }
};

function between(val, start, end) {
  if (start < val && val < end) {
    return true;
  }
  return false;
}
```

根据以上判断，可以得到这样的示意图：

![image-20231026101425669](./docs-images/08-%E6%BA%90%E7%A0%81%E7%AF%877%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%BA%8C%EF%BC%89/image-20231026101425669.png)

其中蓝色区域为我们的画布区域，上下左右分别是 `scrollThresholdIn` 与 `scrollThresholdOut` 设置的四个边界范围。

而四个角，则是两个边界范围的重合区域，当鼠标在这些位置时，会同时设置 `dx` 和 `dy` 两个偏移量，从而让画布斜向滚动。

> 在 `startScroll` 执行时会首先计算 `diff` 数据并 **调用 `stopScroll`停止滚动**，因为鼠标移动到边界区域时，可能会继续移动；此时鼠标可能会依然在边界区域内，也可能已经离开了边界区域。不管哪种情况，都会调用 `startScroll` 进行计算，如果不停止原来的滚动的话，则会创建多个定时任务，触发 `bug`。
>
> 而设置定时器的原因也是因为，如果鼠标停留在边界上，说明画布的滚动位置还没有达到用户的理想状态，但是此时不会再次触发 `dom` 的 `mousemove` 事件，自然也无法监听到 `drag.move`，这样的话，不设置定时任务来实现持续滚动，用户就必须一直在这个区域内小范围不停移动鼠标，非常影响用户体验。

#### stopScroll - 停止滚动

上文说到持续滚动是通过循环创建 `setTimeout` 的定时任务来实现的，那么停止滚动只需要清除这个定时任务就可以了。

所以停止滚动的方法很简单：

```js
AutoScroll.prototype.stopScroll = function() {
  clearTimeout(this._scrolling);
};
```

> 当然，`AutoScroll` 还提供了一个 `setOptions` 的方法，用来手动修改默认的边界区域与滚动配置。

## 小结

总的来说，`TouchModule` 与 `DraggingModule` 是 `diagram-js` 中除了 `CoreModules、CommandModules、Renderer` 之外比较重要的模块了，毕竟这种类似的图形编辑库，`DnD` 都是一个绕不开的话题。

在 `diagram-js` 中，`DnD` 的核心就是 `DraggingModule`，并且大部分的元素位置调整或者拖拽布局等功能，都是借助这个模块来实现的（只要记住鼠标按下拖拽的过程，都与这个模块有关即可）。通过 `DraggingModule` 对外发送的不同拖拽生命周期的事件响应，来实现各自的功能。

另外，`diagram-js` 为了减少 `dom` 元素的事件绑定，大部分时候都采用 `TouchModule` 里面的 **事件委托** 的方式来实现 `dom` 事件的响应，然后在 `diagram-js` 的整个系统中通过 `EventBus` 来代替。

