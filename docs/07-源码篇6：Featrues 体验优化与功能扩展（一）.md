上一节中有提到过，`features` 目录中，主要是一些 **功能扩展模块**，包含了 `palette` 画板、`contextPad` 上下文菜单等，此次就用两章的篇幅来讲一下这里面的一些常用模块（`bpmn-js` 中也有 `features` 目录，其中有一部分是对 `diagram-js` 中的 `features` 的功能的具体实现，也有针对 `BPMN` 特定的处理模块）。

> `features` 中的功能大多数都和其他模块互相嵌套，有的会通过依赖注入的形式使用别的模块的方法，有的则是通过 `EventBus` 来激活或者依赖事件的上下文对象。
>
> 所以对这部分的内容描述可能会比较散乱，希望大家多多包涵，也可以提出意见，我及时修改或者补充。

## Palette 画板工具栏

在之前的 `Canvas` 和 `Factory` 两章中，我们知道可以通过 API 来向画布中添加元素，但是这种方式显然无法正常提供给用户使用。

所以，我们需要一个类似 PS 中的“工具栏”之类的角色，来提供给用户 **创建元素和操作元素** 的能力。

> `Palette` 直译过来是 “调色板”，这里根据作用做了一些改动。

在 `bpmn-js` 的默认 `Modeler` 编辑模式下，体现为：

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/image-20230816152024497.png" alt="image-20230816152024497" style="zoom:50%;" />

也就是一个固定在画布左侧的元素区域，在整个 `DOM` 树结构中，体现为一个和 `SVG` 标签同级的 `DIV` 元素，样式类名为 `djs-palette`。

> 基于 `diagram-js` 实现的功能，大部分元素的类名都会带有 `djs-*` 的前缀。

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/image-20230816152650652.png" alt="image-20230816152650652" style="zoom:50%;" />

但是在 `diagram-js` 的设计中，`Palette` 只是作为一个 **固定在左侧用来显示已注册的工具** 的区域，具体的工具则需要开发者通过向 `Palette` 中注册相应的 `Provider` 来完成。

### 作为工具栏提供的能力

虽然 `Palette` 本身不提供任何工具，但是作为显示所有注册工具的区域，它自然会提供对该区域的 “显示控制”以及对注册工具的显示样式处理。

整个 `Palette` 类包含以下方法：

- `registerProvider`：注册工具
- `getEntries`：返回所有已注册的工具
- `trigger`：触发指定工具的事件
- `triggerEntry`：实际上的工具事件触发方法
- `close`：关闭（隐藏）工具栏
- `open`：打开（显示）工具栏
- `toggle`：切换工具栏区域的显示隐藏状态
- `updateToolHighlight`：调整工具栏中的 “工具” 的高亮状态（即是否在使用中）
- `isOpen`：获取工具栏的显示隐藏状态
- `isActiveTool`：判断指定工具是否在使用中
- `_getParentContainer`：获取父级元素
- `_rebuild`：重建工具栏
- `_init`：初始化工具栏，并为工具栏中的每个元素注册代理事件
- `_getProviders`：获取所有已注册的工具元素定义
- `_toggleState`：实际的工具栏显示状态调整逻辑
- `_update`：根据已注册的工具元素定义，创建对应的 DOM 元素；并调用 `open` 方法显示工具栏
- `_layoutChanged`：触发一次工具栏的重新布局
- `_needsCollapse`：根据画布高度和注册的工具元素个数，来判断是否需要显示为 **两行**

> 带 `_` 前缀的可以认为是 **私有方法**，但是可以调用。

还包含一个静态属性 `HTML_MARKUP`，用来作为工具栏的整体框架。

```js
Palette.HTML_MARKUP =
  '<div class="djs-palette">' +
    '<div class="djs-palette-entries"></div>' +
    '<div class="djs-palette-toggle"></div>' +
  '</div>';
```

其中 `djs-palette-entries` 部分是在正常显示的时候，用来放置所有工具元素的部分，而 `djs-palette-toggle`，则是在工具栏处于关闭（隐藏）状态下，用来重新打开工具栏。

当然，除了元素和类名，`Palette` 还有对应的 `CSS` 样式部分，感兴趣的同学可以直接在 [github：diagram-js.css](https://github.com/bpmn-io/diagram-js/blob/develop/assets/diagram-js.css#L381-L473) 查看源码。

这里只对一些特殊部分进行说明：

```css
/*工具栏默认是一个用绝对定位固定在左上角的元素，宽度为 46px */
.djs-palette {
  position: absolute;
  left: 20px;
  top: 20px;
  box-sizing: border-box;
  width: 48px;
}
/* 特殊的分割线元素，用来标识不同分组 */
.djs-palette .separator {
  margin: 5px;
  padding-top: 5px;
  border: none;
  border-bottom: solid 1px var(--palette-separator-color);
  clear: both;
}
/* 每个工具元素默认高宽都是 46 像素 */
.djs-palette .entry,
.djs-palette .djs-palette-toggle {
  width: 46px;
  height: 46px;
  line-height: 46px;
  cursor: default;
}
/* 高亮工具，改变字体颜色 */
.djs-palette .highlighted-entry {
  color: var(--palette-entry-selected-color) !important;
}
/* 当改变成双栏布局时，会切换宽度为 94px */
.djs-palette.two-column.open {
  width: 94px;
}
```

从上面可以看出，`Palette` 在这里只是作为控制画板工具栏的角色，为内部的元素提供了一个标准的事件处理和样式规范。

在 `diagram.init` 事件发生时，`Palette` 会进行一次初始化，整个过程会进行如下的函数调用：

```
_rebuild() -> _getProviders() -> _init() -> _update() -> getEntries() -> open()
```

其中 `_getProviders()` 就是获取所有已注册的工具元素定义，但是为了能处理多个 `Provider` 注册的情况，这里会通过 `EventBus` 来处理。

```js
Palette.prototype.registerProvider = function(priority, provider) {
  if (!provider) {
    provider = priority;
    priority = DEFAULT_PRIORITY;
  }

  this._eventBus.on('palette.getProviders', priority, function(event) {
    event.providers.push(provider);
  });

  this._rebuild();
};

Palette.prototype._getProviders = function(id) {
  var event = this._eventBus.createEvent({
    type: 'palette.getProviders',
    providers: []
  });

  this._eventBus.fire(event);

  return event.providers;
};
```

当我们需要在画板工具栏里面添加工具元素的时候，可以通过 `registerProvider` 来注册一个 `palette.getProviders` 的监听事件，向 **事件对象中的 `providers` 数组 `push` 我们需要增加的内容**。

当工具栏重建时，则通过发送这个 `palette.getProviders` 事件得到的返回值中的 `providers`，来进行渲染。

> 这里也正是借助了 `EventBus` 的同一个事件同一次触发过程中共用一个事件对象的特性来实现的。

### PaletteProvider 的规范

通过 `registerProvider` 方法可以得知，我们在向 `Palette` 中注册工具元素时，传递进去的 `providers` 应该是一个对象实例，但是这个对象实例具体应该是什么格式，就需要通过 `getProviders()` 后面的逻辑来判断了。

通过上文对 `Palette` 的所有原型方法的说明，可以看出 `_init` 主要是处理外层的DOM框架，而 `_update` 才是通过所有 `providers` 来渲染工具元素。

```js
Palette.prototype._update = function() {

  var entriesContainer = domQuery('.djs-palette-entries', this._container),
      entries = this._entries = this.getEntries();

  // 清空原有的工具元素
  domClear(entriesContainer);

 	// 遍历所有工具元素，重新生成工具元素
  forEach(entries, function(entry, id) {
    var grouping = entry.group || 'default';

    var container = domQuery('[data-group=' + escapeCSS(grouping) + ']', entriesContainer);
    if (!container) {
      container = domify('<div class="group"></div>');
      domAttr(container, 'data-group', grouping);
      entriesContainer.appendChild(container);
    }

    var html = entry.html || (
      entry.separator ?
        '<hr class="separator" />' :
        '<div class="entry" draggable="true"></div>');

    var control = domify(html);
    container.appendChild(control);

    if (!entry.separator) {
      domAttr(control, 'data-action', id);
      if (entry.title) {
        domAttr(control, 'title', entry.title);
      }
      if (entry.className) {
        addClasses(control, entry.className);
      }
      if (entry.imageUrl) {
        var image = domify('<img>');
        domAttr(image, 'src', entry.imageUrl);

        control.appendChild(image);
      }
    }
  });

  this.open();
};

Palette.prototype.getEntries = function() {
  var providers = this._getProviders();
  return providers.reduce(addPaletteEntries, {});
};

function addPaletteEntries(entries, provider) {
  var entriesOrUpdater = provider.getPaletteEntries();

  if (isFunction(entriesOrUpdater)) {
    return entriesOrUpdater(entries);
  }

  forEach(entriesOrUpdater, function(entry, id) {
    entries[id] = entry;
  });

  return entries;
}
```

在 `_update()` 的开始阶段，就会通过遍历所有 `provider`，将 `provider.getPaletteEntries()` 方法的返回值组合成一个完整对象 `entries`，然后再遍历 `entires` 的属性，来生成相应的工具元素，并显示到工具栏中。

所以，每个 `provider` **必须包含一个 `getPaletteEntries` 方法，并且该方法返回的是一个对象**。

通过遍历生成工具元素的过程中，又不难看出，`getPaletteEntries` 返回的对象中，属性名会在生成工具元素时作为 **唯一ID**，而它的属性则是控制其在工具栏中的显示状态和时间响应。

其中又可以根据 `separator` 属性来判断其是否是一个 **分割线**，或者根据 `group` 属性来确定哪些工具元素是属于 “同一分组”。

> 即工具元素的显示顺序，需要根据对象属性顺序以及 `group` 指定的分组顺序来确定，并且 `group` 的注册顺序优先级更高。

综合一下，`PaletteProvider` 的格式必须符合以下类型要求：

```typescript
export type PaletteEntryAction = (event: Event, autoActivate?: boolean) => any
export type PaletteEntry = {
  action: PaletteEntryAction | Record<'click' | 'dragstart' | 'hover', PaletteEntryAction>;
  className?: string;
  group?: string;
  html?: string;
  imageUrl?: string;
  separator?: boolean;
  title?: string;
};

export type PaletteEntries = Record<string, PaletteEntry>;

export type PaletteEntriesCallback = (entries: PaletteEntries) => PaletteEntries;

export default interface PaletteProvider {
  getPaletteEntries: () => PaletteEntriesCallback | PaletteEntries;
}
```

> `hover` 事件支持是在

### 编写一个 PaletteProvider

虽然官方给出的 `PaletteProvider` 的定义是一个 实例类型 `interface`，但是为了更加契合 `diagram-js` 中 `DIDI` 的设计思想，这里还是推荐编写一个 **类** 来实现。

所以我们可以写出这样一个演示的 `Provider`：

```js
class DemoPaletteProvider {
  constructor(palette) {
    palette.registerProvider(this)
  }
  getPaletteEntries() {
    return {
      'tool-one': {
        group: 'tools',
        className: 'tool-item',
        title: '工具 1',
        action: {
          click() {
            window.alert('使用工具1')
          }
        }
      },
      'tool-separator': {
        group: 'tools',
        separator: true
      },
      'element-one': {
        group: 'elements',
        className: 'element-creator',
        title: '元素 1',
        action: {
          click() {
            window.alert('创建元素1')
          }
        }
      },
      'element-separator': {
        group: 'elements',
        separator: true
      }
    }
  }
}
DemoPaletteProvider.$inject = ['palette']
```

然后在创建 `Diagram` 实例时将该模块引入：

```js
const djs = new Diagram({
  canvas: { container: document.getElementById('canvas') },
  modules: [
    Palette,
    {
      __init__: ['demoPaletteProvider'],
      demoPaletteProvider: ['type', DemoPaletteProvider]
    }
  ]
})
```

此时网页上会显示这样的内容：

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/image-20230817172259209.png" alt="image-20230817172259209" style="zoom:50%;" />

当我们点击对应的 `div.entry` 元素时，就会弹出相应的提示：

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/image-20230817172408209.png" alt="image-20230817172408209" style="zoom:50%;" /> <img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/image-20230817172430634.png" alt="image-20230817172430634" style="zoom:50%;" />

然后，我们只需要在对应的 `action` 中编写相应的逻辑，就可以了。

### 多个 `PaletteProvider` 的处理方式

> 那如果我希望覆盖原来的某一个工具元素，或者需要新增工具元素，需要怎么做呢？

其实从上文 `Palette` 渲染工具元素的部分就可以很容易想到解决方式了。

因为最终生成的 `entries` 是每一个 `provider` 的 `getPaletteEntries()` 方法返回值的 “对象集合”，所以只需要通过编写一个新的 `provider`，通过同名属性来覆盖原有的工具元素定义即可；而其他非同名属性，则会根据 `group` 指定的分组，插入到工具栏中。

例如：

```js
export class DemoPaletteProvider2 {
  constructor(palette) {
    palette.registerProvider(this)
  }
  getPaletteEntries() {
    return {
      'tool-one': {
        group: 'tools',
        className: 'tool-item',
        title: '新工具 1',
        action: {
          click() {
            window.alert('使用 新的工具1')
          }
        }
      },
      'element-two': {
        group: 'elements',
        className: 'element-creator',
        title: '元素 2',
        action: {
          click() {
            window.alert('创建元素2')
          }
        }
      }
    }
  }
}
DemoPaletteProvider2.$inject = ['palette']
```

其中我们定义了一个新的工具1，用 `tool-one` 来顶替原来的工具1，并且在 `elements` 分组中增加了一个 元素2 的创建按钮，此时界面会显示为：

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/image-20230817173914959.png" alt="image-20230817173914959" style="zoom:50%;" />

> 但是 `separator` 分割线并不会显示在分组最后，这也是因为 `Palette` 没有对每一个分组限制其分割线的数量，也没有调整其位置的逻辑，而是按照定义的顺序来进行显示。

但是，这种方式仅仅只能 **替换或者插入新的工具元素**，如果我们需要删除某个工具或者某一系列的工具，该怎么处理呢？

这就需要借助 `diagram-js` 依赖的 `DIDI` 模式，也就是 `Injector` 来实现。

在 “`Injector` 依赖注入模式实现” 一章中，我们知道在 `new Diagram` 时传入的 `modules` 数组，最终会通过 `Injector` 来完成各个模块之间的依赖处理和实例化，并且 `modules` 数组中的内容会被遍历解析成一个 **对象** 形式。

所以，在需要 **调整并移除原有的 `PaletteProvider` 中的某些元素时，只需要重新编写一个 `PaletteProvider` 并将其在 `modules` 数组中设置为与目标 `Provider` 一样的属性名**。

例如我们要使用上文的 `DemoPaletteProvider2` 去完全覆盖 `DemoPaletteProvider`，只需要将代码改成如下形式：

```js
const djs = new Diagram({
  canvas: { container: document.getElementById('canvas') },
  modules: [
    Palette,
    {
      __init__: ['demoPaletteProvider'],
      demoPaletteProvider: ['type', DemoPaletteProvider]
    },
    {
      demoPaletteProvider: ['type', DemoPaletteProvider2] // 同名顶替
    }
  ]
})
```

此时页面显示如下效果：

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/image-20230818142008041.png" alt="image-20230818142008041" style="zoom:50%;" />

当然，这种效果属于 **完全替换，因为 `DemoPaletteProvider` 与 `DemoPaletteProvider2` 两者注册的工具元素完全不同**，如果需要 **删除部分工具元素** 的话，除了 **复制原始 `PaletteProvider` 的代码，删除不需要的部分** 之外，也可以使用继承的方式来实现。

> 当然在使用时依然需要使用同名的模块定义来替换原来的部分

例如：

```js
export class DemoPaletteProvider3 extends DemoPaletteProvider {
  constructor(palette) {
    super(palette)
  }
  getPaletteEntries() {
    const actions = super.getPaletteEntries()
    delete actions['element-separator'] // 删除指定的元素
    return actions
  }
}
DemoPaletteProvider3.$inject = ['palette']
```

然后再重新进行引用：

```js
const djs = new Diagram({
  canvas: { container: document.getElementById('canvas') },
  modules: [
    Palette,
    {
      __init__: ['demoPaletteProvider'],
      demoPaletteProvider: ['type', DemoPaletteProvider]
    },
    {
      __init__: ['demoPaletteProvider2'],
      demoPaletteProvider: ['type', DemoPaletteProvider3], // 同名替换
      demoPaletteProvider2: ['type', DemoPaletteProvider2] // 注册新的
    }
  ]
})
```

此时会变成如下效果：

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95/image-20230818143005290.png" alt="image-20230818143005290" style="zoom:50%;" />

当然，这几种方式都是使用 **官方提供的能力，通过基础的 JS 代码来实现最简单的应用**，如果我们需要在官方的 `Palette` 中调用某些组件库的方法，就需要通过下面这种途径了。

### 借助 `Injector` 完成其他交互

在之前的内容中，有提到过 `diagram-js` 的核心是依赖的 `Injector` 来实现依赖注入的，而在依赖声明时，如果是 `type` 作为 **关键字** 声明的模块，默认会当成一个 **构造函数（类）** 来进行实例化，而这个类的 **静态属性** `$inject` 则用来声明这个模块所依赖的其他模块实例，会按照声明顺序作为参数提供给构造函数实例化的时候进行使用。

而在 `new Diagram(options)` 时，传入的参数 `options` 会作为一个 **基础对象** 绑定到 `config` 属性上，作为整个依赖系统的一个核心依赖。

所以，如果我们 **在编写某个模块的构造函数（类）时，可以通过 `$inject` 属性添加对 `config` 的引用，从而实现对外部参数或者对象的调用**。

例如，我们将上文的 `DemoPaletteProvider2` 修改为下述内容：

```js
export class DemoPaletteProvider2 {
  constructor(config, palette) {
    this._config = config
    palette.registerProvider(this)
  }
  getPaletteEntries() {
    const config = this._config
    
    return {
      'tool-one': {
        group: 'tools',
        className: 'tool-item',
        title: '新工具 1',
        action: {
          click() {
            window.alert('使用 新的工具1')
          }
        }
      },
      'element-two': {
        group: 'elements',
        className: 'element-creator',
        title: '元素 2',
        action: {
          click() {
            window.alert('创建元素2')
          }
        }
      },
      'event-one': {
        group: 'events',
        className: 'events',
        title: '事件1',
        action: {
          click() {
            console.log(config)
          }
        }
      }
    }
  }
}
DemoPaletteProvider2.$inject = ['config', 'palette']
```

然后页面显示以及打印结果如下：

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/image-20230822141159814.png" alt="image-20230822141159814" style="zoom:67%;" />

这样，我们就可以通过 `config` 对象来实现对外部方法的调用了。

例如，现在外部有一个 `ElementPlus` 的弹窗，需要通过 `Palette` 中的某个工具来打开，则可以对上述的代码进行修改：

```vue
// SFC 文件
<script setup>
  import { onMounted, ref } from 'vue'
  import Diagram from 'diagram-js'
  import Palette from 'diagram-js/lib/features/palette'
  import { DemoPaletteProvider, DemoPaletteProvider2 } from '../modules/paletteProviders.js'
  
  const dialogVisible = ref(false)
  const toggleDialog = () => {
    dialogVisible.value = !dialogVisible.value
  }

  onMounted(() => {
    const djs = new Diagram({
      canvas: { container: document.getElementById('canvas') },
      modules: [
        Palette,
        {
          __init__: ['demoPaletteProvider', 'demoPaletteProvider2'],
          demoPaletteProvider: ['type', DemoPaletteProvider],
          demoPaletteProvider2: ['type', DemoPaletteProvider2]
        }
      ],
      componentMethods: {
        toggleDialog
      }
      ]
    })
  })
</script>

<template>
  <div id="canvas" class="canvas"></div>
  <el-dialog v-model="dialogVisible" title="Tips" width="30%">
    <span>This is a message</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="dialogVisible = false"> Confirm </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
  .canvas {
    width: 100%;
    height: 100%;
  }
  .bg-gray {
    background-color: #888888; // 凸显一下
  }
</style>
```

然后我们再在 `demoPaletteProvider2` 中进行使用：

```js
export class DemoPaletteProvider2 {
  constructor(config, palette) {
    this._config = config
    palette.registerProvider(this)
  }
  getPaletteEntries() {
    const config = this._config
    
    return {
      // ...
      'event-one': {
        group: 'events',
        className: 'events bg-gray',
        title: '事件1',
        action: {
          click() {
            if (config.componentMethods) {
              config.componentMethods.toggleDialog()
            }
          }
        }
      }
    }
  }
}
DemoPaletteProvider2.$inject = ['config', 'palette']
```

则我们可以得到这样的效果：

![chrome-capture-2023-7-22](./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/chrome-capture-2023-7-22.gif)

> 当然，我们也可以通过 **模块或者闭包** 的方式，在 `paletteProvider` 中直接引用，也能达到这样的效果；但是这样会缺少一定的安全性，并且闭包变量直接绑定，也很难做到及时清理。

> 另外还有一点就是，如果这个方法里面有 `this` 的话，在将其配置到 `options` 参数中时，还需要绑定对应的 `this` 指向，不然可能会引发其他错误。

## ContextPad 元素上下文菜单

与 `Palette` 的作用类似，`ContextPad` 的作用就是为 **当前指定元素提供修改或者便捷操作**，让用户能够更加方便快速的完成对这个元素的相关操作。

除了作用之外，在代码设计上，`ContextPad` 也保持了和 `Palette` 一样的设计思路。本身 `ContextPad` 模块仅提供一个控制上下文菜单状态与基础布局的功能，通过注册对应的 `ContextPadProvider` 来实现不同情况下的菜单选项。

### 作为上下文菜单提供的能力

与 `Palette` 类似，`ContextPad` 对外提供了这些方法：

- `registerProvider`：注册元素对应的菜单项
- `getEntries`：获取某个元素/元素组对应的菜单项
- `trigger`：触发事件
- `triggerEntry`：实际的事件执行函数
- `getPad`：获取当前菜单所在的覆盖物图层，创建菜单元素并进行事件代理
- `open`：打开/显示菜单
- `close`：关闭/隐藏菜单
- `isOpen`：是否是打开/显示状态
- `isShown`：是否是关闭/隐藏状态
- `_init`：初始化依赖，注册相应的事件
- `_getProviders`：实际上的菜单项获取方法
- `_updateAndOpen`：更新位置并显示菜单图层
- `_getPosition`：获取菜单对应的显示位置

> 带 `_` 前缀的可以认为是 **私有方法**，但是可以调用。

当然，与 `Palette` 不同的是，`ContextPad` 只会 “在有需要的时候”显示，而不是一直固定显示在左侧。所以 `ContextPad` 在初始化时会注册相应的事件，在事件触发时才会调用 `open` 方法重新打开菜单面板。

```js
export default function ContextPad(canvas, config, eventBus, overlays) {
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._overlays = overlays;

  var scale = isDefined(config && config.scale) ? config.scale : {
    min: 1,
    max: 1.5
  };
  this._overlaysConfig = {
    scale: scale
  };
  this._current = null;
  this._init();
}

ContextPad.$inject = [
  'canvas',
  'config.contextPad',
  'eventBus',
  'overlays'
];

ContextPad.prototype._init = function() {
  var self = this;

  this._eventBus.on('selection.changed', function(event) {
    var selection = event.newSelection;
    var target = selection.length
      ? selection.length === 1
        ? selection[0]
        : selection
      : null;

    if (target) {
      self.open(target, true);
    } else {
      self.close();
    }
  });

  this._eventBus.on('elements.changed', function(event) {
    var elements = event.elements,
        current = self._current;

    if (!current) {
      return;
    }

    var currentTarget = current.target;
    var currentChanged = some(
      isArray(currentTarget) ? currentTarget : [ currentTarget ],
      function(element) {
        return includes(elements, element);
      }
    );

    if (currentChanged) {
      self.open(currentTarget, true);
    }
  });
};
```

以上就是 `ContextPad` 的初始化部分，可见它在初始化时 **只是记录了 `canvas`、`overlays` 与 `eventBus` 三个模块实例，并且设置了 `selection.changed` 与 `elements.changed` 两个监听事件；当 选中元素变化或者元素属性改变时，则会在第一个选择元素或者第一个发生属性更新的元素这里，打开上下文菜单**。

> `_current` 属性，是一个对象属性；在菜单需要打开时，会记录三个属性：
>
> - `target`：当前菜单打开时的目标选择元素
> - `entries`：通过 `getEntries` 得到的该元素对应的菜单项
> - `pad`：通过 `getPad` 得到的该元素对应的菜单面板所在的 `overlay` 图层

当菜单需要被打开时（调用 `open` 方法），会先判断新的 `target` 元素与 `_crrent.target` 是否一致，不一致则会 **先关闭再创建新的菜单**。

```js
ContextPad.prototype.open = function(target, force) {
  if (!force && this.isOpen(target)) {
    return;
  }

  this.close();

  this._updateAndOpen(target);
};
ContextPad.prototype._updateAndOpen = function(target) {
  var entries = this.getEntries(target),
      pad = this.getPad(target),
      html = pad.html,
      image;

  forEach(entries, function(entry, id) {
    var grouping = entry.group || 'default',
        control = domify(entry.html || '<div class="entry" draggable="true"></div>'),
        container;

    domAttr(control, 'data-action', id);

    container = domQuery('[data-group=' + escapeCSS(grouping) + ']', html);
    if (!container) {
      container = domify('<div class="group"></div>');
      domAttr(container, 'data-group', grouping);

      html.appendChild(container);
    }

    // ...
  });

  domClasses(html).add('open');

  this._current = {
    target: target,
    entries: entries,
    pad: pad
  };

  this._eventBus.fire('contextPad.open', { current: this._current });
};
ContextPad.prototype.getPad = function(target) {
  if (this.isOpen()) {
    return this._current.pad;
  }

  var self = this;
  var overlays = this._overlays;
  var html = domify('<div class="djs-context-pad"></div>');
  var position = this._getPosition(target);
  var overlaysConfig = assign({
    html: html
  }, this._overlaysConfig, position);

  domDelegate.bind(html, entrySelector, 'click', function(event) {
    self.trigger('click', event);
  });
  domDelegate.bind(html, entrySelector, 'dragstart', function(event) {
    self.trigger('dragstart', event);
  });
  domEvent.bind(html, 'mousedown', function(event) {
    event.stopPropagation();
  });

  var activeRootElement = this._canvas.getRootElement();
  this._overlayId = overlays.add(activeRootElement, 'context-pad', overlaysConfig);
  var pad = overlays.get(this._overlayId);
  this._eventBus.fire('contextPad.create', {
    target: target,
    pad: pad
  });

  return pad;
};
```

这部分代码，则是体现了 **上下文菜单的 `dom` 结构和菜单项的处理方式**。

与 `Palette` 一样，菜单的 `dom` 结构都是固定的，也有自带的默认样式；并且也通过代理的形式，来完成每个菜单项事件的触发。这里就不再赘述。

但是，由于 `ContextPad` 的菜单项需要与当前选中元素相关联，所以在 `getEntries` 方法中，与 `Palette` 有所区别。

### `getEntries` 方法与 `Palette` 的不同

回顾上文 “`PaletteProvider` 的规范”，`Palette` 的 `getEntries` 方法，只需要将所有注册的 `Provider` 中的 `getPaletteEntries()` 方法的返回值组合成一个 `entries` 对象即可，渲染的时候会根据对象的 `key` 来进行遍历渲染。

而 `ContextPad` 的 `Entries` 则需要关联当前对象 `Shape/Connection`；并且针对 **单个元素和多个元素选中，还需要显示不同的菜单**。

所以，`ContextPad` 的 `getEntries` 方法在此基础上，进行了细微改动：

```js
ContextPad.prototype.getEntries = function(target) {
  var providers = this._getProviders();

  // 定义不同的菜单项获取方法
  var provideFn = isArray(target)
    ? 'getMultiElementContextPadEntries'
    : 'getContextPadEntries';

  var entries = {};

  forEach(providers, function(provider) {

    if (!isFunction(provider[provideFn])) {
      return;
    }

    // 传递当前的 target 元素到每个 provider 的菜单项方法中
    var entriesOrUpdater = provider[provideFn](target);

    if (isFunction(entriesOrUpdater)) {
      entries = entriesOrUpdater(entries);
    } else {
      forEach(entriesOrUpdater, function(entry, id) {
        entries[id] = entry;
      });
    }
  });

  return entries;
};
// 与 palette 一致
ContextPad.prototype._getProviders = function() {
  var event = this._eventBus.createEvent({
    type: 'contextPad.getProviders',
    providers: []
  });

  this._eventBus.fire(event);

  return event.providers;
};
```

即：

- 针对单个元素和多个元素选中时，`ContextPadProvider` 需要有不同的菜单项方法
- 每个 `provider` 的 `getXXXEntries` 方法可以接收一个 `target` 参数，进行不同的菜单项返回

所以，我们可以得到一个 `ContextPadProvider` 的构造函数规范。

### `ContextPadProvider` 的规范

```typescript
import { Element } from 'diagram-js/lib/features/model/Types';
import { ContextPadTarget } from './ContextPad';

export type ContextPadEntryAction = (event: Event, target: ContextPadTarget<ElementType>, autoActivate: boolean) => void;

export type ContextPadEntry<ElementType extends Element = Element> = {
  action: ContextPadEntryAction | Record<'click' | 'dragstart', ContextPadEntryAction>;
  className?: string;
  group?: string;
  html?: string;
  imageUrl?: string;
  title?: string;
};

export type ContextPadEntries<ElementType extends Element = Element> = Record<string, ContextPadEntry<ElementType>>;

export type ContextPadEntriesCallback<ElementType extends Element = Element> = (entries: ContextPadEntries<ElementType>) => ContextPadEntries<ElementType>;


export default interface ContextPadProvider<ElementType extends Element = Element> {

  // 单个元素选中时会调用的方法
  getContextPadEntries?: (element: ElementType) => ContextPadEntriesCallback<ElementType> | ContextPadEntries<ElementType>;

  // 多个元素选中时会调用的方法
  getMultiElementContextPadEntries?: (elements: ElementType[]) => ContextPadEntriesCallback<ElementType> | ContextPadEntries<ElementType>;
}
```

在实际使用中，`ContextPadProvider` 与 `PaletteProvider` 十分相似，甚至可以看做 `ContextPadProvider` 只是比 `PaletteProvider` 多了一个 `getMultiElementContextPadEntries` 方法。

所以，我们在编写自定义的 `ContextPadProvider` 时，也可以参照之前 `PaletteProvider` 的写法。

### 实现两个 `ContextPadProvider`

与 `PaletteProvider` 还有的一点区别就是，`ContextPad` 对 `group` 的处理，并不是使用分割线，而是通过换行进行处理。

```js
export class DemoContextPadProvider {
  constructor(contextPad) {
    contextPad.registerProvider(this)
  }
  getContextPadEntries() {
    return {
      'tool-one': {
        group: 'tools',
        className: 'tool-item LikeActive',
        title: '工具 1',
        action: {
          click() {
            window.alert('使用工具1')
          }
        }
      },
      'element-one': {
        group: 'elements',
        className: 'element-creator CutePetReportActive',
        title: '元素 1',
        action: {
          click() {
            window.alert('创建元素1')
          }
        }
      }
    }
  }
}
DemoContextPadProvider.$inject = ['contextPad']

export class DemoContextPadProvider2 {
  constructor(config, contextPad) {
    this._config = config
    contextPad.registerProvider(this)
  }
  getContextPadEntries() {
    const config = this._config

    return {
      'tool-one': {
        group: 'tools',
        className: 'tool-item EmotionalMutualAssistanceActive',
        title: '新工具 1',
        action: {
          click() {
            window.alert('使用 新的工具1')
          }
        }
      },
      'element-two': {
        group: 'elements',
        className: 'element-creator FinancialExchangeActive',
        title: '元素 2',
        action: {
          click() {
            window.alert('创建元素2')
          }
        }
      },
      'element-three': {
        group: 'elements',
        className: 'element-creator FinancialExchangeActive',
        title: '元素 3',
        action: {
          click() {
            window.alert('创建元素3')
          }
        }
      },
      'element-four': {
        group: 'elements',
        className: 'element-creator FinancialExchangeActive',
        title: '元素 4',
        action: {
          click() {
            window.alert('创建元素4')
          }
        }
      },
      'event-one': {
        group: 'events',
        className: 'events FishingAtWorkActive',
        title: '事件1',
        action: {
          click() {
            if (config.componentMethods) {
              config.componentMethods.toggleDialog()
            }
          }
        }
      }
    }
  }
}
DemoContextPadProvider2.$inject = ['config', 'contextPad']
```

然后一样在 vue 组件中进行引用和初始化。

```vue
<script setup>
  import { onMounted, ref } from 'vue'
  import Diagram from 'diagram-js'
  import ContextPad from 'diagram-js/lib/features/context-pad/index.js'
  import TouchModule from 'diagram-js/lib/features/touch'
  import SelectionModule from 'diagram-js/lib/features/selection'
  import { DemoContextPadProvider, DemoContextPadProvider2 } from '../modules/contextPadProvider.js'

  const dialogVisible = ref(false)
  const toggleDialog = () => {
    dialogVisible.value = !dialogVisible.value
  }

  const bootstrapDiagram = () => {
    const djs = new Diagram({
      canvas: { container: document.getElementById('canvas') },
      modules: [
        TouchModule,
        SelectionModule,
        ContextPad,
        {
          __init__: ['demoContextPadProvider', 'demoContextPadProvider2'],
          demoContextPadProvider: ['type', DemoContextPadProvider],
          demoContextPadProvider2: ['type', DemoContextPadProvider2]
        }
      ],
      componentMethods: {
        toggleDialog
      }
    })
    return djs
  }

  const bootstrapShapes = (canvas) => {
    canvas.addShape({ id: 's1', width: 100, height: 100, x: 10, y: 10 })
    canvas.addShape({ id: 's2', width: 50, height: 50, x: 200, y: 10 })
    canvas.addShape({ id: 's3', width: 150, height: 150, x: 300, y: 300 })
  }

  onMounted(() => {
    const modeler = bootstrapDiagram()

    bootstrapShapes(modeler.get('canvas'))
  })
</script>

<template>
  <div id="canvas" class="canvas"></div>
  <el-dialog v-model="dialogVisible" title="Tips" width="30%">
    <span>This is a message</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="dialogVisible = false"> Confirm </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
  .canvas {
    width: 100%;
    height: 100%;
  }
  .bg-gray {
    background-color: #888888;
  }
</style>
```

> 当然，因为 `ContextPad` 依赖 `Selection` 模块来进行显示，而默认的元素点击等事件需要 `Touch` 模块来进行注册和代理，所以在使用时一定要确保已经引入了 `selection` 与 `touch` 模块。

此时，当我们选中元素时，就能得到对应的菜单项。

![chrome-capture-2023-8-11](./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/chrome-capture-2023-8-11.gif)

> 这里的图标来自掘金的沸点点赞图标~

当然，与 `PaletteProvider` 的处理方式类似，在注册了多个 `ContextPadProvider` 之后，所有 `Provider` 中定义的每一个工具入口 `ContextPadEntry`，也会整合成一个完成的工具集合对象。

所以，如果我们需要修改原来的某个工具，或者替换掉某个 `Provider` 中的所有内容，也可以采用与 `PaletteProvider` 一样的方法。

### 修改 `ContextPad` 的样式

上文虽然已经完成了 `Provider` 的编写，但是有时候，UI 并不会满足于当前的上下文菜单 “样式”，所以，偶尔还需要我们对 `ContextPad` 本身进行修改。

在介绍 `ContextPad` 的方法时，有介绍这么两个方法：

- `getPad`：获取当前菜单所在的覆盖物图层，创建菜单元素并进行事件代理
- `_updateAndOpen`：更新位置并显示菜单图层

在 `getPad` 这个方法中，主要代码和逻辑如下：

```js
ContextPad.prototype.getPad = function(target) {
  // 如果已经是打开状态，直接返回这个覆盖物图层实例
  if (this.isOpen()) {
    return this._current.pad;
  }
	// 代理 this
  var self = this;

  var overlays = this._overlays;
	// 定义和创建菜单所在的 dom 元素
  var html = domify('<div class="djs-context-pad"></div>');
	// 获取目标元素的位置坐标
  var position = this._getPosition(target);
	// 整合默认配置（this._overlaysConfig 包含缩放配置等）
  var overlaysConfig = assign({
    html: html
  }, this._overlaysConfig, position);
	// 代理点击与拖拽事件
  domDelegate.bind(html, entrySelector, 'click', function(event) {
    self.trigger('click', event);
  });
  domDelegate.bind(html, entrySelector, 'dragstart', function(event) {
    self.trigger('dragstart', event);
  });
	// 阻止 mousedown 事件
  domEvent.bind(html, 'mousedown', function(event) {
    event.stopPropagation();
  });

  // 添加一个顶级覆盖物图层，并保存图层id
  var activeRootElement = this._canvas.getRootElement();
  this._overlayId = overlays.add(activeRootElement, 'context-pad', overlaysConfig);

  var pad = overlays.get(this._overlayId);
	// 发送菜单已创建的事件
  this._eventBus.fire('contextPad.create', {
    target: target,
    pad: pad
  });
	// 返回覆盖物实例
  return pad;
};
```

`_updateAndOpen` 方法主要逻辑如下：

```js
ContextPad.prototype._updateAndOpen = function(target) {
  // 获取所有 Provider 组成的 entries 对象与 菜单所在的 dom 节点（html 变量）
  var entries = this.getEntries(target),
      pad = this.getPad(target),
      html = pad.html,
      image;
	// 遍历对象，创建菜单项元素
  forEach(entries, function(entry, id) {
    // 获取每个工具的分组标识 grouping，创建工具对应的dom元素
    var grouping = entry.group || 'default',
        control = domify(entry.html || '<div class="entry" draggable="true"></div>'),
        container;
		// 为工具元素添加一个 data-action 自定义属性，值为工具 id（也就是对象 key）
    domAttr(control, 'data-action', id);
		// 找到这个分组对应的 dom 元素
    container = domQuery('[data-group=' + escapeCSS(grouping) + ']', html);
    // 不存在分组元素的话，创建一个 class 为 group 的元素，并添加 data-group 标识，用于下次查询
    if (!container) {
      container = domify('<div class="group"></div>');
      domAttr(container, 'data-group', grouping);
      // 插入到菜单中
      html.appendChild(container);
    }
    // 将工具元素插入到分组
    container.appendChild(control);
    // 绑定自定义样式名
    if (entry.className) {
      addClasses(control, entry.className);
    }
    // 绑定 title 属性
    if (entry.title) {
      domAttr(control, 'title', entry.title);
    }
    // 如果有对应的图片地址，将插入该图片
    if (entry.imageUrl) {
      image = domify('<img>');
      domAttr(image, 'src', entry.imageUrl);
      image.style.width = '100%';
      image.style.height = '100%';
      control.appendChild(image);
    }
  });
  // 修改为打开状态
  domClasses(html).add('open');

  this._current = {
    target: target,
    entries: entries,
    pad: pad
  };
  // 发送菜单已打开事件 
  this._eventBus.fire('contextPad.open', { current: this._current });
};
```

以上两个方法，涉及到了整个菜单的 `dom` 结构，以及每个工具的渲染逻辑。

例如上面的例子中，所对应的 `dom` 结构如下图：

![image-20230915133707427](./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/image-20230915133707427.png)

虽然这个原来的结构，也可以通过修改默认的 `CSS` 样式来进行调整，但是某些情况下很难满足我们的需求，此时就需要对原有的 `dom` 结构进行修改。

所以，如果需要改变原有的上下文菜单结构，就需要从以上两个方法入手。

假设，我们此时拿到了一个如下的设计图：

![image-20230914151746292](./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/image-20230914151746292.png)

首先，先分析一下这个设计图对应的 `dom` 结构应该是什么样的。

1. 菜单最外层一样是一个父节点，可以沿用 `djs-context-pad` 这个节点，但是它 “更宽”
2. 依然具有分组的概念，所以可以沿用 `group` 的结构，但是需要增加一个 `group label` 的节点用来显示每个分组的名字
3. 具有完整背景色的工具元素父节点
4. 每个工具节点，需要显示图标 `icon` 与工具名称

所以，我们可以得到这样一个大致结构：

```html
<div class="djs-context-pad">
  <div class="group">
    <div class="group-label">${groupId}</div>
    <div class="group-content">
      <div class="entry">
      	<div class="entry-icon">${entry1.icon}</div>
      	<div class="entry-title">${entry1.title}</div>
      </div>
    </div>
  </div>
</div>
```

现在，让我们开始着手 `ContextPad` 的修改。

> 上文说过，当菜单调用 `open` 方法打开时，会通过 `_updateAndOpen` 来创建整个菜单结构，所以入口方法就是 `_updateAndOpen`。

而这个方法的第一步，就是通过 `getPad` 获取这个菜单所对应的父元素 `pad html`。

我们注意 `getPad` 中有这样三行行代码：

```js
var html = domify('<div class="djs-context-pad"></div>');
var position = this._getPosition(target);
var overlaysConfig = assign({ html: html }, this._overlaysConfig, position);
```

即将坐标 `position`、生成的 `dom` 节点 `html` 与 `this._overlaysConfig` 一起合并到一个变量 `overlaysConfig`，而这个 `html` 对应的元素很明显就是菜单的父级元素。

所以，我们有没有可能不重写 `getPad` 方法也能改变这个父元素呢？

答案是可以的，只需要在 `this._overlaysConfig` 中重新声明一个 `html` 属性，即可覆盖官方定义的节点。

那么我们就需要在 `_updateAndOpen` 方法加上这么几句代码：

```js
import { default as BaseContextPad } from 'diagram-js/lib/features/context-pad/ContextPad.js'

// 继承原来的上下文菜单
export default class ContextPad extends BaseContextPad {
  // 重写方法
  _updateAndOpen(target) {
    // 根据 getPad 方法，定义新的菜单节点；为了适配原来的菜单并避免冲突，增加了一个 class 类名
    const padHtml = domify(`<div class="djs-context-pad wider-pad"></div>`)
    const entrySelector = '.entry'
    const self = this
		// 一样的事件代理
    domDelegate.bind(padHtml, entrySelector, 'click', function (event) {
      self.trigger('click', event)
    })
    domDelegate.bind(padHtml, entrySelector, 'dragstart', function (event) {
      self.trigger('dragstart', event)
    })
		// 一样的事件阻止
    domEvent.bind(padHtml, 'mousedown', function (event) {
      event.stopPropagation()
    })
		// 绑定到 this._overlaysConfig 上
    this._overlaysConfig.html = padHtml
    
    // ...
  }
}
```

这样，我们就完成了最外层的菜单节点的改造。

剩下的，则是处理每一个 `group` 以及里面的工具元素。

```js
_updateAndOpen(target) {
	// ...
  
  // 一样的参数声明和获取
  let entries = this.getEntries(target),
    pad = this.getPad(target), // 一样需要调用该方法，触发里面的其他逻辑和事件
    html = pad.html,
    image

  // 遍历 entries 对象，插入 group 节点和工具节点
  forEach(entries, function (entry, id) {
    let grouping = entry.group || 'default',
      icon = domify('<div class="entry__icon"></div>'), // 定义 icon 对应的dom元素
      control = domify(entry.html || '<div class="entry" draggable="true"></div>'), // 定义每个工具对应的dom元素
      container // 每个 group 对应的 dom 元素

    // 将 icon 插入的工具元素中，并设置工具元素的 data-action 属性
    control.appendChild(icon)
    domAttr(control, 'data-action', id)
    // 查找当前分组是否已经生成了 dom 节点
    container = domQuery('[data-group=' + escapeCSS(grouping) + ']', html)
    // 不存在则创建一个节点，并插入一个 group__label 节点来显示分组名称
    if (!container) {
      container = domify(`<div class="group"><div class="group__label">${grouping}</div></div>`)
      domAttr(container, 'data-group', grouping)
			// 插入到菜单中
      html.appendChild(container)
    }
    // 向分组中插入该工具
    container.appendChild(control)

    if (entry.className) {
      addClasses(icon, entry.className)
    }

    if (entry.title) {
      domAttr(control, 'title', entry.title)
      // 插入工具名称节点
      const title = domify(`<div class="entry__title">${entry.title}</div>`)
      control.appendChild(title)
    }

    if (entry.imageUrl) {
      image = domify('<img>')
      domAttr(image, 'src', entry.imageUrl)
      image.style.width = '100%'
      image.style.height = '100%'
      icon.appendChild(image) // 图片作为图标时，只能插入到 icon 节点下
    }
  })

  domClasses(html).add('open')
  this._current = {
    target: target,
    entries: entries,
    pad: pad
  }
  this._eventBus.fire('contextPad.open', { current: this._current })
}
```

这样，当菜单打开时，我们就能得到这样一个 `dom` 结构：

![image-20230915144959806](./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/image-20230915144959806.png)

然后，配合上对应的 `CSS` 样式代码，就完成一个另外一种风格的上下文菜单：

```css
/* context pad */
.djs-context-pad.wider-pad {
    width: max-content;
    max-width: 240px;
    border-radius: 4px;
    padding: 4px 8px;
    box-sizing: border-box;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}
.djs-context-pad.wider-pad .group {
    background-color: var(--color-grey-225-10-97);
}
.djs-context-pad.wider-pad .group__label {
    width: 100%;
    line-height: 32px;
    font-weight: bold;
    background-color: #ffffff;
}
.djs-context-pad.wider-pad .entry {
    width: auto;
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    background-color: unset;
    box-shadow: none;
}
.djs-context-pad.wider-pad .entry__icon {
    width: 22px;
    height: 22px;
}
.djs-context-pad.wider-pad .entry__title {
    font-size: 12px;
}
```

> 使用 `.djs-context-pad.wider-pad` 作为限制条件，可以避免污染原有的上下文菜单样式。



## Overlays 覆盖物图层

上文 `ContextPad` 说到，上下文菜单的显示是通过创建一个 `Overlay` 图层来挂载菜单的，那么现在就接着说一下另一个十分常用的功能 —— `Overlays` 覆盖物图层。

官方对这个模块的定义是：A service that allows users to attach overlays to diagram elements. The overlay service will take care of overlay positioning during updates.

即“一个允许用户添加覆盖物到图元素的服务，并且会在图层更新期间负责更新图层的位置”。

虽然该模块在 `bpmn-js` 和 `diagram-js` 中很少使用，但是却是 `bpmn-js-token-simulation`、`bpmn-js-bpmnlint` 等多个扩展功能必不可少的依赖之一，也是为我们提供交互优化（`hover` 显示节点信息等）的实现方式之一。

### 它所提供的配置与能力

作为覆盖物，一般来说会与对应的画布元素或者坐标进行绑定，并且跟随画布缩放或者移动发生相应的改变。

所以在 `diagram-js` 中，覆盖物的添加必须要绑定一个元素作为 **定位元素**，并且会 **监听 `canvas` 画布改变与元素改变和移除等事件**。

但是为了避免在画布缩放过程中，缩放比过大或者过小造成的覆盖物显示不清楚/不完整的情况，`Overlays` 提供了一个缩放范围来进行限制，并且允许用户修改这个范围。

`Overlays` 模块的定义如下：

```typescript
type OverlaysConfig = {
  defaults?: OverlaysConfigDefault
}
type OverlaysConfigDefault = {
 show?: OverlaysConfigShow
 scale?: OverlaysConfigScale | boolean
}
type OverlaysConfigShow = {
  minZoom?: number
  maxZoom?: number
}
type OverlaysConfigScale = {
  min?: number
  max?: number
}

type OverlayContainer = {
  html: HTMLElement
  element: Element
  overlays: Overlay[]
}

type OverlayAttrs = {
  html: HTMLElement | string
  position: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
} & OverlaysConfigDefault 
type Overlay = {
  id: string
  type: string | null
  element: Element | string
} & OverlayAttrs }

class Overlays {
  _overlayDefaults: OverlaysConfigDefault;
  _overlays: Record<string, Overlay>;
  _overlayContainers: OverlayContainer[];
  _overlayRoot: HTMLElement;
  
  constractor(config: OverlaysConfig, eventBus: EventBus, canvas: Canvas, elementRegistry: EventRegistry) {}
}

Overlays.$inject = [ 'config.overlays', 'eventBus', 'canvas', 'elementRegistry' ];
```

除了 `diagram-js` 本身提供的 `eventBus` 等几个模块之外，`Overlays` 还接受一个 `OverlaysConfig` 的参数，用来限制覆盖物的缩放范围。

每个覆盖物，都是一个 `Overlay` 格式的对象，创建之后都会保存在 `_overlays` 属性中；而 `_overlayContainers`，则是记录了每个元素的所有绑定覆盖物实例和 `dom` 节点。

在 `Overlays` 模块初始化时，除了初始化以上属性之外，还会通过 `_init` 方法，注册上文说到的相关事件。

```js
export default function Overlays(config, eventBus, canvas, elementRegistry) {
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._ids = ids;
  this._overlayDefaults = assign({
    show: null,
    scale: true
  }, config && config.defaults);

  this._overlays = {};
  this._overlayContainers = [];
  this._overlayRoot = createRoot(canvas.getContainer());
  
  this._init();
}

Overlays.prototype._init = function() {
  var eventBus = this._eventBus;
  var self = this;

  function updateViewbox(viewbox) {
    self._updateRoot(viewbox);
    self._updateOverlaysVisibilty(viewbox);
    self.show();
  }

  eventBus.on('canvas.viewbox.changing', function(event) {
    self.hide();
  });

  eventBus.on('canvas.viewbox.changed', function(event) {
    updateViewbox(event.viewbox);
  });
  eventBus.on([ 'shape.remove', 'connection.remove' ], function(e) {
    var element = e.element;
    var overlays = self.get({ element: element });
    forEach(overlays, function(o) {
      self.remove(o.id);
    });
    var container = self._getOverlayContainer(element);
    if (container) {
      domRemove(container.html);
      var i = self._overlayContainers.indexOf(container);
      if (i !== -1) {
        self._overlayContainers.splice(i, 1);
      }
    }
  });
  eventBus.on('element.changed', LOW_PRIORITY, function(e) {
    var element = e.element;
    var container = self._getOverlayContainer(element, true);
    if (container) {
      forEach(container.overlays, function(overlay) {
        self._updateOverlay(overlay);
      });
      self._updateOverlayContainer(container);
    }
  });
  eventBus.on('element.marker.update', function(e) {
    var container = self._getOverlayContainer(e.element, true);
    if (container) {
      domClasses(container.html)[e.add ? 'add' : 'remove'](e.marker);
    }
  });
  eventBus.on('root.set', function() {
    self._updateOverlaysVisibilty(self._canvas.viewbox());
  });
  eventBus.on('diagram.clear', this.clear, this);
};
```

针对不同的事件，有不同的处理方式：

- `canvas.viewbox.changing`：视图变化过程中，需要隐藏所有覆盖物，减少性能开销
- `canvas.viewbox.changed`：视图改变结果，重新计算和更新覆盖物的显示
- `[ 'shape.remove', 'connection.remove' ]`：元素移除时，需要移除该元素对应的覆盖物
- `element.changed`：元素改变时，需要更新该元素对应的覆盖物
- `element.marker.update`：更新元素 `class` 类名时，需要一同更新覆盖物
- `root.set`：根节点更新时，调整覆盖物显示
- `diagram.clear`：画布清空时，同时清空所有覆盖物

当然，针对覆盖物的管理，也有对应的方法：

```typescript
export type OverlaysFilter = {
    id?: string;
    element?: Element | string;
    type?: string;
} | string;

export class Overlays {
  /**
   * 返回具有指定ID的覆盖物（单数）或具有给定类型的元素的覆盖物列表（数组）。
   * @param search The filter to be used to find the overlay(s).
   * @return The overlay(s).
   */
  get(search: OverlaysFilter): Overlay | Overlay[];
  
  /**
   * 将HTML覆盖添加到元素中作为一个覆盖物，返回生成的覆盖物对象实例。
   * @param element 元素id或者元素对象
   * @param type 可选参数，用来给覆盖物增加一个类型.
   * @param overlay 覆盖物的配置属性.
   *
   * @return The overlay's ID that can be used to get or remove it.
   */
  add(element: Element | string, overlay: OverlayAttrs): string;
  add(element: Element | string, type: string, overlay: OverlayAttrs): string;

  /**
   * 删除具有给定ID的覆盖物或者匹配给定条件的所有覆盖物图层
   */
  remove(filter: OverlaysFilter): void;

  /**
   * 验证所有覆盖物是不是都处于显示状态
   */
  isShown(): boolean;

  /**
   * 显示所有覆盖物
   */
  show(): void;

  /**
   * 隐藏所有覆盖物
   */
  hide(): void;

  /**
   * 清除所有覆盖物
   */
  clear(): void;
}
```

### 覆盖物的 dom 结构与特征

当了解了以上方法之后，我们就可以尝试给元素添加覆盖物了。

通过 `add` 方法的源码来看，为一个元素添加覆盖物会经过以下过程（方法）：

- `add()`： 参数校验与格式化，生成覆盖物 ID，并将格式化之后的参数传递给 `_addOverlay()`，最后返回 ID
- `_addOverlay()`：生成覆盖物的 `dom` 节点，并找到这个元素对应的覆盖物图层的 **根 `dom` 节点**（没有则会创建一个新的节点）；然后创建当前条件下的覆盖物图层添加到根节点下，同时插入我们参数中定义的 `html` 元素；最后将该图层实例保存到 `_overlayContainers` 与 `_overlays` 中，调用 `_updateOverlay` 方法
- `_updateOverlay()`：在 `_addOverlay` 方法创建了对应的图层 `dom` 节点之后，会通过该方法计算参数中的 `position` 定位与当前元素的位置，通过 **绝对定位** 的方式更新覆盖物坐标
- `_updateOverlayVisibilty()`：在坐标更新之后，需要通过当前激活的根元素以及当前的视图缩放比例，来判断覆盖物的显示隐藏状态
- `_updateOverlayScale()`：如果上一个方法判断之后需要显示该覆盖物，则通过该方法计算覆盖物的缩放比例，通过 `transform` 来改变元素

简化后过程如下：

```
add() // 生成id，格式化参数
 ⇩
_addOverlay() // 创建 dom 并挂载
 ⇩
_updateOverlay() // 更新覆盖物坐标
 ⇩
_updateOverlayVisibilty() // 判断是否显示
 ⇩
_updateOverlayScale() // 计算缩放比例
```

但是为了更加方便管理每一个覆盖物，在覆盖物的 `dom` 结构上，由上至下分成了

- 所有覆盖物的根节点
- 单个元素的所有覆盖物的根节点
- 单个元素的单个覆盖物的根节点
- 单个元素的单个覆盖物的实际定义节点

层级结构如下：

![image-20230919151120030](./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/image-20230919151120030.png)

在上图中，一共有 `s1, s2, s3` 三个元素，并为 `s1` 添加了一个覆盖物，为 `s2` 添加了两个覆盖物，则最终的 `dom` 结构就体现为上图所示的 **4层结构**。

**❗注意**：

1. 所有覆盖物的根节点 `div.djs-overlay-container` ，通过 **绝对定位的方式定义了所有覆盖的定位基准元素，并且没有设置高宽，来避免影响画布本身的其他鼠标事件**
2. 每一个元素的覆盖物根节点 `div.djs-overlays`，通过实时计算 **元素在画布中的相对位置，来设置这个元素的覆盖物对应的定位基准元素**
3. 每一个覆盖物 `div.djs-overlay`，位置相对于 `div.djs-overlays` 固定，坐标由创建覆盖物的 `position` 参数确定
4. 当画布被缩放时，会通过改变 `div.djs-overlay-container` 的 CSS 样式中的 `transform` 属性来实现覆盖物的同步缩放

### 通过 Overlays 实现 Tooltip 效果

除了 `bpmn` 团队自己实现的一些插件需要依赖 `Overlays` 模块之外，在平时的业务中，也有可能需要使用 `Overlays` 来实现一些业务需求。

假设现在有这样一个场景：

![image-20230920144454686](./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/image-20230920144454686.png)

> 截图来自小伙伴的开源项目：（[蒜蓉辣椒酱](https://github.com/L1yp)）https://github.com/L1yp/van

即：在鼠标移动到 **已通过的任务节点** 时，显示该流程的当前流转状态。

这个效果如果是在普通的 `dom` 节点中，我们可以很轻松的实现，毕竟现在各大组件库都有提供这样的组件（`Tooltip` 或者 `Popover`）。但是在 `diagram-js` 或者 `bpmn-js` 中，由于渲染出来的元素都是 `svg` 节点且默认不受用户直接控制，所以要实现这样的交互还是有些难度的。

> 但是 Vue 3 对应的组件库 `Element Plus`，对 `Popover` 提供了一种 **虚拟触发** 的方式，所以后面会介绍使用第三方组件库的方式。

首先，我们先编写一个基础的页面文件：

```vue
<script setup>
  import { onMounted, ref, shallowRef } from 'vue'
  import Diagram from 'diagram-js'
  import { bootstrapShapes } from '../../utils/bootstrap.js'
  import TouchModule from 'diagram-js/lib/features/touch'
  import SelectionModule from 'diagram-js/lib/features/selection'
  import OverlaysModule from 'diagram-js/lib/features/overlays'

  let overlays, shapes, modeler
  
  const htmlRef = ref(null)

  const bootstrapDiagram = () => {
    return new Diagram({
      canvas: { container: document.getElementById('overlay-canvas') },
      modules: [TouchModule, SelectionModule, OverlaysModule]
    })
  }

  onMounted(() => {
    modeler = bootstrapDiagram()
    overlays = modeler.get('overlays')
    shapes = bootstrapShapes(modeler.get('canvas'))
  })
</script>

<template>
  <div class="overlays-box">
    <div id="overlay-canvas" class="canvas"></div>
    <div class="box">
      <div class="overlay-box-mask">
        <div ref="htmlRef" class="djs-popover">
          <div class="djs-popover__content">
            <p>This is a popover</p>
            <p>使用 div 手动实现</p>
          </div>
          <div class="djs-popover__arrow-wrapper">
            <div class="djs-popover__arrow"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  .overlays-box {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .canvas {
    width: 100%;
    height: 100%;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }

  .djs-overlay {
    pointer-events: none;
  }
  
  .overlay-box-mask {
    // display: none; 预先注释，可以查看显示效果
    margin: 20vh auto;
  }
  .djs-popover {
    transform: translateX(-50%) translateY(-100%); // 使用 transform 实现居中
    // ...
  }
  // ...省略部分样式
</style>
```

> `div.djs-popover` 的结构参照了 [`Naive UI`](https://www.naiveui.com/) 的 [`Popover` 组件](https://www.naiveui.com/zh-CN/os-theme/components/popover) 的 `dom` 结构与 `CSS` 样式，具体代码见小册关联仓库。

此时，页面显示如下：

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/image-20230920165312509.png" alt="image-20230920165312509" style="zoom:50%;" />

但是为了不影响本身的页面结构，我们可以将这个信息弹窗 `div.djs-popover` 放到一个不显示（设置为 `display: none`，这里为了演示效果注释了这行代码）的节点中，也就是上文中的 `div.overlay-box-mask`，这样一来，这个弹窗就可以完全不影响页面的其他布局。

当然，实际业务中可能还需要显示 `hover` 时的元素信息，所以我们可以对上面的模板加以修改，增加一个 `shallowRef` 变量保存当前 `hover` 的元素，并在页面上显示该元素的id。

```
const hoverEl = shallowRef(null)

// ...

<div class="djs-popover__content">
  <p>This is a popover</p>
  <p>使用 div 手动实现</p>
  <p v-if="hoverEl">Hover 元素 ID: {{ hoverEl.id }}</p>
</div>
```

然后，我们就需要想办法 **将定义好的 `tooltip template` 显示到我们的这个元素上**。这里需要涉及到以下内容：

1. 既然是 `hover` 时显示，那么我们需要实现对 `element.hover` 事件的监听，这个事件在我们引入的 `TouchModule` 中有实现该事件的注册
2. `Overlays` 中并没有提供 **针对单个覆盖物的显示状态管理(只能添加和移除)**，所以我们需要 **清空原有的覆盖物再重新添加（逻辑更加简单）**
3. 在 `Vue` 中，使用 `ref` 属性绑定的 `dom` 元素，会保存该节点到这个对应变量中，所以可以使用这个 `dom ref` 变量作为添加覆盖物时的 `html` 属性
4. 在 `Vue` 模板中编写的内容，即使挂载到其他位置，当数据更新时一样会更新对应 `dom` 元素（因为 `VNode` 与实际 `dom` 的对应关系一直存在）
5. 既然是模拟的 `tooltip` 的效果，在移动到其他需要显示覆盖物的元素时需要立即 “移动” 过去，而其他情况，则需要等待一段时候后从最后一个 `hover` 的元素上移除该覆盖物

这样，就可以编写后面的代码了。

```js
const hoverEl = shallowRef(null) // 选中的元素
const htmlRef = ref(null) // template 模板
let timer = null // 记录定时器 id

// 重置定时器
const stopTimer = () => {
  timer && clearTimeout(timer)
}
// 开始定时器
const startTimer = () => {
  stopTimer()
  timer = setTimeout(() => {
    // 隐藏时需要将原来的元素索引清除掉
    hoverEl.value = null
    // 然后清空覆盖物
    overlays && overlays.clear()
  }, 2000)
}
// 初始化 element.hover 事件
const initHoverEvent = (eventBus) => {
  eventBus.on('element.hover', ({ element }) => {
    // 需要显示 overlay 的元素
    if (element && activeElementIds.indexOf(element.id) >= 0) {
      // 需要关闭之前的定时器
      stopTimer()
      if (!hoverEl.value || hoverEl.value !== element) {
      	// 元素不同时，清空原来的图层元素
      	overlays && overlays.clear()
        // 保存索引，并创建新图层
        hoverEl.value = element
        overlays.add(hoverEl.value, { html: htmlRef.value, position: { left: element.width / 2, top: 0 } })
      }
    }
    // 不需要时，则开启定时器
    else {
      startTimer()
    }
  })
}

onMounted(() => {
  modeler = bootstrapDiagram()
  overlays = modeler.get('overlays')
  shapes = bootstrapShapes(modeler.get('canvas'))

  initHoverEvent(modeler.get('eventBus'))
})
```

> 此时，我们已经完成了大部分 `tooltip` 的效果，但是依然还有不足。
>
> - 箭头位置和显示位置固定，当处于边界位置时无法调整位置（可以根据元素的坐标来设置模板的动态类名和调整覆盖物坐标，改变箭头方向等）
> - 当鼠标移动到覆盖物上时，依然会触发定时器开启，导致 2s 后覆盖物被移除（可以给覆盖物元素增加鼠标事件，来开启或者关闭定时器）
>
> 这两个问题可以当做思考题，大家可以尝试解决~

### 借助组件库中具有虚拟触发功能的 Popover 来实现（不需要依赖 Overlays）

首先，我们先来了解一下 `Element Plus` 中的 [`Popover` 组件](https://element-plus.org/zh-CN/component/popover.html#attributes)：

`Popover` 气泡卡片：与 `Tooltip` 相似，`Popover` 也是基于`ElPopper`的构建的；支持  `hover`、`click`、`focus` 或 `contextmenu` 四种触发方式，默认是 `hover` 触发；支持 `virtual-ref` 结合 `virtual-triggering` 实现外部元素触发。

>  `virtual-ref` 与 `virtual-triggering` 属性的描述在 [`Tooltip`](https://element-plus.org/zh-CN/component/tooltip.html#attributes) 的属性文档中，`virtual-triggering` 是一个标识符，`virtual-ref` 则绑定外部的 `HTMLElement` 元素。

那么此时我们就可以编写以下代码：

```vue
<script setup>
  import { onMounted, ref, unref } from 'vue'
  import Diagram from 'diagram-js'
  import { bootstrapShapes } from '../utils/bootstrap.js'
  import TouchModule from 'diagram-js/lib/features/touch'
  import SelectionModule from 'diagram-js/lib/features/selection'

  let shapes, modeler

  const activeElementIds = ['s1', 's3']

  const bootstrapDiagram = () => {
    return new Diagram({
      canvas: { container: document.getElementById('overlay-canvas') },
      modules: [TouchModule, SelectionModule, OverlaysModule]
    })
  }

  const activeSvgEl = shallowRef(null)
  const popoverRef = shallowRef(null)
  const hoverEl = shallowRef(null)

  onMounted(() => {
    modeler = bootstrapDiagram()
    overlays = modeler.get('overlays')
    shapes = bootstrapShapes(modeler.get('canvas'))
  })
</script>

<template>
  <div class="overlays-box">
    <div id="overlay-canvas" class="canvas"></div>
    <div class="box">
      <el-popover ref="popoverRef" :virtual-ref="activeSvgEl" trigger="hover" title="With title" virtual-triggering>
        <p>This is a ElPopover</p>
        <p>使用 element-plus 实现</p>
        <p v-if="hoverEl">Hover 元素 ID: {{ hoverEl.id }}</p>
      </el-popover>
    </div>
  </div>
</template>
```

在这部分代码中，我们将添加到画布中的三个元素都进行了保存 (`shapes` 对象)，并在 `template` 模板中添加了一个 **虚拟触发** 的 `ElPopover` 组件，将触发对象绑定到 `activeEl` 对象中。

> 这种情况下是通过动态去改变 `activeEl` 来调整 `popover` 的显示位置的；当然，如果确定有

此时页面如下，并且没有任何交互效果。

<img src="./docs-images/07-%E6%BA%90%E7%A0%81%E7%AF%876%EF%BC%9AFeatrues%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%80%EF%BC%89/image-20230920161354315.png" alt="image-20230920161354315" style="zoom:50%;" />

然后，我们一样需要设置 `element.hover` 事件来实现 `ElPopover` 的显示：

```js
// 实现 类 tooltip
const activeSvgEl = shallowRef(null)
const popoverRef = shallowRef(null)
const hoverEl = shallowRef(null)

const initHoverEvent = (eventBus) => {
  eventBus.on('element.hover', ({ element }) => {
    if (element && activeElementIds.indexOf(element.id) >= 0) {
      if (!hoverEl.value || hoverEl.value !== element) {
        hoverEl.value = element
        activeSvgEl.value = modeler.get('elementRegistry').getGraphics(element.id)
      }
    }
  })
}

onMounted(() => {
  modeler = bootstrapDiagram()
  shapes = bootstrapShapes(modeler.get('canvas'))

  initHoverEvent(modeler.get('eventBus'))
})
```

> 从代码量上来看，由于使用了第三方组件库的原因，我们编写的代码不管是 `js` 部分，还是 `css、html` 部分，都减少了很多内容。

由于 `ElPopover` 已经实现了 **移出元素后自动隐藏、`popover` 不会隐藏** 的效果，所以我们只需要注意 **在需要显示的时候更新虚拟触发绑定的元素变量 `activeSvgEl`**。

所以我们只需要在 **`hover` 元素进行切换时，更新对应的虚拟触发元素即可**。

> 这里与 `Overlays` 不一样的是，`ElPopover` 绑定的 `virtual-ref` 必须是一个 `dom` 元素，所以需要通过 `ElementRegistry` 模块获取到这个元素对应的 `dom` 节点。
>
> 不过，实际上 `element.hover` 事件中，回调函数参数中其实还会包含一个 `gfx` 属性，这个属性默认就是该元素对应的 `dom` 节点。所以上面的代码还可以改为：
>
> ```js
> const initHoverEvent = (eventBus) => {
>   eventBus.on('element.hover', ({ element, gfx }) => {
>     if (element && activeElementIds.indexOf(element.id) >= 0) {
>       if (!hoverEl.value || hoverEl.value !== element) {
>         hoverEl.value = element
>         activeSvgEl.value = gfx
>       }
>     }
>   })
> }
> ```









