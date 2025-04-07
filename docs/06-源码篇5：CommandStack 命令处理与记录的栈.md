经过前面对 `diagram.js` 的几个核心模块和依赖的解析，相信大家对它也有了一定程度的了解。但是就目前 `diagram.js` 中所提供的功能来看，是不足以满足用户的正常使用需求的，毕竟只有单纯的 **代码层面的节点新增与移除**，无法在页面上直接操作。所以 `diagram.js` 提供了一个 `features` 目录以及一个 **操作命令记录模块 `command`**，其中 `features` 里面包含了 `palette` 元素选择画板、`alignElements` 元素对齐、`contextPad` 元素上下文菜单、`keyboard` 键盘事件支持 等一系列 **扩展功能模块**，而 `command` 中则是对 **用户操作进行拦截校验并实现撤销恢复（重做）功能**。当然由于篇幅的问题，这里只着重讲解我们在 `bpmn.js` 以及自定义过程中常用的一些模块。

## Command 操作命令记录

首先作为一个 **编辑器**，最重要的功能之一就是 **操作记录的保存和提供撤销恢复（重做）**，所以 `command` 中有提供了一个 **`CommandStack` 操作命令栈** 来 **执行和记录每一个操作步骤，并提供了 撤销 `undo`、重做 `redo` 等功能**。但是在 **流程设计** 的过程中，可能有些操作在一些情况下是 **不允许被成功执行的**，所以 `command` 中又为我们提供了两个 **操作命令的基础抽象类 `CommandHandler` 与 `CommandInterceptor`**。

### 命令模式实现的操作命令记录栈

这个功能其实也可以认为是一个 **历史记录栈**，记录了 **用户** 的所有操作，有的也会包含一部分的 **操作状态**，并且都会提供 **撤销/回退** 和 **恢复/前进** 的功能。

> 关于 **撤销/恢复系统的定义和实现**，推荐大家查看这两篇文章：[**Intro to Writing Undo/Redo Systems in JavaScript（如何在 JavaScript 中编写一个撤销/恢复的系统）**](https://medium.com/fbbd/intro-to-writing-undo-redo-systems-in-javascript-af17148a852b) 与 [**Web 应用的撤销重做实现（网易云音乐技术团队）**](https://juejin.cn/post/6844903921878564872)。

首先我们先了解一下什么是命令模式？

**命令模式** 根据用途划分属于”行为型设计模式“，主要用于 **将操作命令转换为一个包含命令和请求参数的独立对象**，该转换让你能根据不同的请求将方法参数化、延迟请求执行或将其放入队列中，且能实现可撤销操作。

在命令模式中，一般 **包含四个角色：命令管理者 `Command`、命令接收与执行对象（也有称为“接收者”） `Receiver`、触发命令执行和调用对象（也称为“调用者”） `Invoker`**；在简单逻辑中我们可以直接通过 `Invoker` 执行 `Receiver` 的逻辑（强关联/强耦合）的形式来实现，但这样不利于后面的扩展，所以 **命令模式在 `Invoker` 与 `Receiver` 之间增加了一个 `Command` 来进行中转，`Invoker` 只需要发布需要执行的命令和参数，`Receiver` 则提供不同参数与处理逻辑的执行方法，中间由 `Command` 来进行对应和调用**；当然，`Command` 命令通常都是通过 `ConcreteCommand` 来创建，确保每个命令的格式一致。

大致过程如下：

![../_images/Command.jpg](https://raw.githubusercontent.com/miyuesc/blog-images/main/Command.jpg)

> 原图来自 https://design-patterns.readthedocs.io/zh_CN/latest/behavioral_patterns/command.html

以一个基础的图形编辑器来举例，整个过程大致如下：

![image-20230213151300989](https://raw.githubusercontent.com/miyuesc/blog-images/main/image-20230213151300989.png)

在画布和调用器都初始化完成之后，外界通过调用 **Editor** 实例的方法或者画板操作，触发执行相应的图形生成命令（`addLine/addCircle ...`）来创建图形元素，也可以删除元素（`removeLine/removeCircle ...`）等。

而在 `addLine、removeLine` 等方法执行的过程中，**每一次都会实例化对应的 `Command` 命令实例并通过命令的 `execute()` 方法执行相应逻辑，然后将命令实例存入到 `Invoker` 的命令栈 `commads` 中**。

在通过 `undo()` 或者键盘事件来触发 **撤销操作** 时，则是通过 **在 `Invoker` 的 `commands` 数组中找到最后一个命令实例，执行命令的 `undo()` 方法来取消上次操作**。

### 画板编辑的简易实现

在了解了命令模式的基本过程之后，我们就可以根据上面的逻辑编写一个简单的画板的撤销恢复系统。

```typescript
// 命令的抽奖类
interface Command {
  execute(): void;
  undo(): void;
}

// 添加形状
class AddShapeCommand implements Command {
  editor: DrawingEditor;
  shape: string;

  constructor(editor: DrawingEditor, shape: string) {
    this.editor = editor;
    this.shape = shape;
  }

  execute() {
    this.editor.addShape(this.shape);
  }

  undo() {
    this.editor.removeShape();
  }
}

// 移除形状
class RemoveShapeCommand implements Command {
  editor: DrawingEditor;
  shape: string;

  constructor(editor: DrawingEditor, shape: string) {
    this.editor = editor;
    this.shape = shape;
  }

  execute() {
    this.editor.removeShape();
  }

  undo() {
    this.editor.addShape(this.shape);
  }
}

// 调用器
class CommandInvoker {
  commands: Command[];

  constructor() {
    this.commands = [];
  }

  executeCommand(command: Command) {
    command.execute();
    this.commands.push(command);
  }

  undo() {
    const command = this.commands.pop();
    if (command) {
      command.undo();
    }
  }
}

class DrawingEditor {
  currentShape: string;
  invoker: CommandInvoker;
  
  constructor() {
    this.invoker = new CommandInvoker();
  }

  addLine(line: string) {
    this._addShape('line', line);
  }
  addCircle(circle: string) {
    this._addShape('circle', circle);
  }
  
  _addShape(shapeType: string, shape: string) {
    this.currentShape = shape;
    console.log(`Shape ${shape} added, type is ${shapeType}`);
  }

  removeLine(shape: string) {
    this._removeShape('line', shape)
  }
  removeCircle(shape: string) {
    this._removeShape('circle', shape)
  }
  _removeShape(shapeType: string, shape: string) {
    console.log(`Shape ${this.shape} removed, type is ${shapeType}`);
    this.shape = '';
  }
  
  undo() {
    this.invoker.undo()
  }
  
}

const editor = new DrawingEditor();

invoker.executeCommand(new AddShapeCommand(editor, 'Circle'));
invoker.executeCommand(new AddShapeCommand(editor, 'Square'));
invoker.executeCommand(new RemoveShapeCommand(editor, 'Circle'));

invoker.undo();
invoker.undo();
invoker.undo();
```

在这个示例中，`new AddShapeCommand` 和 `new RemoveShapeCommand` 就可以视作是 `concrete command` 的过程，两者继承自 `Command` 抽象类，可以确保 `invoker` 在 `execute` 命令时能正确执行。



当然，`diagram-js` 中的 `Command` 模块对这个模式进行了一些 **优化**，增加了命令 **执行前校验** 及 执行过程钩子事件等。

在 `diagram-js` 中，主要包含三个文件：

- `CommandStack`：用来执行和管理每一个 `Command` 实例的执行逻辑与执行结果，作用类似于上文的 `Invoker` 与部分 `DrawingEditor` 的功能；
- `CommandHandler`：用来构造一个 **基础** 的命令实例，作用类似于上文的 `Command`；
- `CommandInterceptor`：用来构造一个 **可拦截** 的命令实例，属于特殊的处理过程。

> `CommandHandler` 在 `v12.0.0` 被移除，其作用主要是用来提示一个 命令 `hanlder` 应该具备那些处理方法，但由于后面 `diagram-js` 的改动，不再需要这个抽象类，所有的命令 `handler` 都独立实现相应的方法，但是均可视作 `CommandHandler`。

### CommandHandler 命令处理对象

`CommandHandler` 的定义和职能其实很清晰，即 **提供一个 `execute` 执行方法，用来处理当前命令的负责的职能（例如改变元素属性、调整位置等）能正确执行**。

所以每一个 `handler` 基本上都有一个 `execute` 方法。

但是 `diagram-js` 中对 `CommandHandler` 进行了优化，将每一个命令的执行划分为 4 个阶段，也就是有四个对应的处理函数：

1. `preExecute`：预执行
2. `execute`：正常执行
3. `postExecute`：附属执行
4. `revert`：撤销操作执行时的逻辑

作为一个处理命令，至少实现上述4中方法中的一项。

> 个人猜想，这也是这个类被移除的原因之一，因为 **不能单纯的将其编写为一个抽象类**，其定义的方法都是可选实现的；但是也不能为其编写四个空函数，因为有可能会因为返回 `undefined` 而造成后续函数执行失败。

我们以官方的 `CreateShapeHandler.js` 形状元素创建命令为例：

```js
import { assign } from 'min-dash';

export default function CreateShapeHandler(canvas) {
  this._canvas = canvas;
}

CreateShapeHandler.$inject = [ 'canvas' ];

CreateShapeHandler.prototype.execute = function(context) {

  var shape = context.shape,
      positionOrBounds = context.position,
      parent = context.parent,
      parentIndex = context.parentIndex;

  if (positionOrBounds.width !== undefined) {
    assign(shape, positionOrBounds);
  } else {
    assign(shape, {
      x: positionOrBounds.x - Math.round(shape.width / 2),
      y: positionOrBounds.y - Math.round(shape.height / 2)
    });
  }

  this._canvas.addShape(shape, parent, parentIndex);

  return shape;
};

CreateShapeHandler.prototype.revert = function(context) {
  var shape = context.shape;
  this._canvas.removeShape(shape);

  return shape;
};
```

在 `execute` 方法中，主要就是 **计算新元素的坐标并将其添加到画布上**，而 `revert` 则正好相反，需要从画布中将该元素进行移除。

实际使用 `diagram-js` 或者 `bpmn-js` 的时候，我们可以通过 `modeling.createShape` 来创建元素，而 `modeling.createShape`，实际就是对参数进行 **标准化**，然后通过 `commandStack.execute('shape.create', context)` 来执行 `CreateShapeHandler` 的 `execute` 方法。

> 在 `modeling` 的构造函数中，会注册一个 `diagram.init` 的监听事件，在画布初始化时 通过 `registerHandlers` 来注册相关的命令处理函数。

![image-20230815173900183](./docs-images/06-%E6%BA%90%E7%A0%81%E7%AF%875%EF%BC%9AFeatures%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%8A%EF%BC%89/image-20230815173900183.png)

### CommandInterceptor “可拦截”的命令参数处理器

官方对 `CommandInterceptor` 的定义是 “*A utility that can be used to plug into the command execution for extension and/or validation*.” 即 “一个可以用于扩展 **和/或** 验证的命令执行插件的实用工具”。

这个工具允许你在 **一个操作命令的不同执行阶段对其进行验证或者修改**。

截止到当前的 v12.2.0 版本，`CommandInterceptor` 提供了一个命令可否执行的验证方法 `canExecute` 和 8 个命令执行阶段的处理函数：

1. `preExecute`：命令执行前的预处理阶段，可以在此阶段执行一些额外的操作。
2. `preExecuted`：命令执行前的最后一次机会，可以在此阶段执行一些最后的准备工作。
3. `execute`：命令的执行前阶段，可以在此阶段执行一些额外的操作，然后提供给命令执行函数。
4. `executed`：命令执行后的处理阶段，可以在此阶段执行一些额外的操作。
5. `postExecute`：命令执行后的清理阶段，可以在此阶段执行一些清理操作。
6. `postExecuted`：命令执行后的最后一次机会，可以在此阶段执行一些最后的操作。
7. `revert`：命令撤销阶段，用于执行命令的撤销操作。
8. `reverted`：命令撤销后的处理阶段，可以在此阶段执行一些额外的操作。

> 这个验证方法和这些处理函数，都是可选的，并非需要全部实现。

以上所有的方法都基于 `CommandInterceptor.prototype.on` 来实现的，核心是 `EventBus` 事件总线。

大致源码如下：

```js
/**
 * Intercept a command during one of the phases.
 *
 * @param {Events} [events] command(s) to intercept
 * @param {string} [hook] phase to intercept
 * @param {number} [priority]
 * @param {ComposeHandlerFunction|HandlerFunction} handlerFn
 * @param {boolean} [unwrap] whether the event should be unwrapped
 * @param {any} [that]
 */
CommandInterceptor.prototype.on = function(events, hook, priority, handlerFn, unwrap, that) {
 // 省略了参数校验处理

  if (!isArray(events)) {
    events = [ events ];
  }

  var eventBus = this._eventBus;

  forEach(events, function(event) {
    var fullEvent = [ 'commandStack', event, hook ].join('.');
    eventBus.on(fullEvent, priority, unwrap ? unwrapEvent(handlerFn, that) : handlerFn, that);
  });
};

function unwrapEvent(fn, that) {
  return function(event) {
    return fn.call(that || null, event.context, event.command, event);
  };
}

function createHook(hook) {
  /**
   * @this {CommandInterceptor}
   *
   * @param {Events} [events]
   * @param {number} [priority]
   * @param {ComposeHandlerFunction|HandlerFunction} handlerFn
   * @param {boolean} [unwrap]
   * @param {any} [that]
   */
  const hookFn = function(events, priority, handlerFn, unwrap, that) {

    if (isFunction(events) || isNumber(events)) {
      that = unwrap;
      unwrap = handlerFn;
      handlerFn = priority;
      priority = events;
      events = null;
    }

    this.on(events, hook, priority, handlerFn, unwrap, that);
  };

  return hookFn;
}

CommandInterceptor.prototype.canExecute = createHook('canExecute')
CommandInterceptor.prototype.preExecute = createHook('preExecute')
CommandInterceptor.prototype.preExecuted = createHook('preExecuted')
CommandInterceptor.prototype.execute = createHook('execute')
CommandInterceptor.prototype.executed = createHook('executed')
CommandInterceptor.prototype.postExecute = createHook('postExecute')
CommandInterceptor.prototype.postExecuted = createHook('postExecuted')
CommandInterceptor.prototype.revert = createHook('revert')
CommandInterceptor.prototype.reverted = createHook('reverted')
```

其中所有的方法都是通过 `on` 方法向 `EventBus` 中注入一个 `commandStack.[event].[hook/canExecute]` 的事件。

#### 1. `canExecute`

这个方法顾名思义，就是 **判断这个操作命令是否能够执行**。

例如 `bpmn-js` 在元素创建的过程时，会校验元素是否能够合法创建（当不存在 `Process` 等根节点时，会提示普通流程元素不能创建），那么会通过 `BpmnRules` 模块执行 `CreateRules` 中的相关规则。

这个 `CreateRules` 最终就来自于与 `CommandInterceptor`，校验方法则是通过 `canExecute` 注册一个 `CommandStack.elements.create.canExecute` 事件；当我们通过 `palette` 拉出一个元素进行创建时，就会触发 `CommandStack.elements.create.canExecute` 将相关的参数带入进去，执行对应的验证方法并返回。

这几个阶段如下图：

![image-20230620134453426](./docs-images/06-%E6%BA%90%E7%A0%81%E7%AF%875%EF%BC%9AFeatures%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%8A%EF%BC%89/image-20230620134453426.png)

> `Palette` 触发元素创建的过程后面会进行讲解。

#### 2. `hookExecute/hookExecuted`

除了 `canExecute` 带有校验的场景外，其他的 8 个方法都是 **对某个操作命令的执行过程的处理**，例如增加参数、处理异常情况等。

在 `diagram-js` 与其二开项目 `bpmn-js、dmn-js` 等，都有一个 `features/modeling` 模块，其中包含的就是各种建模方法。而这些建模方法又是来自于各个继承自 `CommandInterceptor` 的 **操作命令类（函数）**。

这些 类 通过实现 `CommanInterceptor` 中定义的某些 `hook` 方法，来实现对画布内 **元素或者元素的属性的增删改操作**。

例如 `modeling` 中提供的 `moveElements` 元素移动：

```js
export default function Modeling(eventBus, elementFactory, commandStack) {}

Modeling.prototype.moveElements = function(shapes, delta, target, hints) {
  hints = hints || {};
  var attach = hints.attach;
  var newParent = target,
      newHost;

  if (attach === true) {
    newHost = target;
    newParent = target.parent;
  } else if (attach === false) {
    newHost = null;
  }

  var context = {
    shapes: shapes,
    delta: delta,
    newParent: newParent,
    newHost: newHost,
    hints: hints
  };

  this._commandStack.execute('elements.move', context);
};
```

整个 `modeling` 提供的 `moveElements` 方法核心就是 **格式化参数**，通过 `CommandStack` 调用执行 `'elements.move'` 对应的 `MoveShapeHandler` 里定义的各种方法。

> `modeling` 在构造函数初始化时，会执行 `registerHandlers` 来向 `CommandStack` 注册内置的操作命令：
>
> ```js
> Modeling.prototype.getHandlers = function() {
>   return {
>   	// ...
>     'elements.move': MoveElementsHandler,
>   	// ...
>   };
> };
> 
> Modeling.prototype.registerHandlers = function(commandStack) {
>   forEach(this.getHandlers(), function(handler, id) {
>     commandStack.registerHandler(id, handler);
>   });
> };
> ```
>
> 感兴趣的同学可以在 [diagram-js/modeling](https://github.com/bpmn-io/diagram-js/blob/develop/lib/features/modeling/Modeling.js#L160-L164) 中查看所有的操作命令。

那么就让我们进入 `MoveShapeHandler` 里面看看它注册了哪些操作。

```js
import MoveHelper from './helper/MoveHelper';

import { add as collectionAdd, remove as collectionRemove } from '../../../util/Collections';

export default function MoveShapeHandler(modeling) {
  this._modeling = modeling;
  this._helper = new MoveHelper(modeling);
}
MoveShapeHandler.$inject = [ 'modeling' ];

MoveShapeHandler.prototype.execute = function(context) {
  var shape = context.shape,
      delta = context.delta,
      newParent = context.newParent || shape.parent,
      newParentIndex = context.newParentIndex,
      oldParent = shape.parent;

  context.oldBounds = pick(shape, [ 'x', 'y', 'width', 'height' ]);
  context.oldParent = oldParent;
  context.oldParentIndex = collectionRemove(oldParent.children, shape);

  collectionAdd(newParent.children, shape, newParentIndex);

  assign(shape, {
    parent: newParent,
    x: shape.x + delta.x,
    y: shape.y + delta.y
  });

  return shape;
};

MoveShapeHandler.prototype.postExecute = function(ctx) {
  var shape = ctx.shape,
      delta = ctx.delta,
      hints = ctx.hints;

  var modeling = this._modeling;

  if (hints.layout !== false) {
    forEach(shape.incoming, function(c) {
      modeling.layoutConnection(c, {
        connectionEnd: getMovedTargetAnchor(c, shape, delta)
      });
    });
    forEach(shape.outgoing, function(c) {
      modeling.layoutConnection(c, {
        connectionStart: getMovedSourceAnchor(c, shape, delta)
      });
    });
  }

  if (hints.recurse !== false) {
    this.moveChildren(ctx);
  }
};

MoveShapeHandler.prototype.revert = function(ctx) {
  var shape = ctx.shape,
      oldParent = ctx.oldParent,
      oldParentIndex = ctx.oldParentIndex,
      delta = ctx.delta;

  collectionAdd(oldParent.children, shape, oldParentIndex);
  
  assign(shape, {
    parent: oldParent,
    x: shape.x - delta.x,
    y: shape.y - delta.y
  });

  return shape;
};
MoveShapeHandler.prototype.moveChildren = function() {}
```

在 `execute` 方法中，会从 `context`（这里简写为 `ctx`）中获取到当前元素的相关信息：`ctx.shape, ctx.parent` 等作为 **移动之前的元素相关数据**，并将其重新设置为 `ctx.oldParent, ctx.oldBounds` 等；以 `old` 作为前缀，让其参与后面的代码逻辑执行。

然后会根据参数重新计算元素的新位置信息和新的父节点，并返回这个元素。

之后会触发 `postExecute` 方法，这里会判断和更新元素是否有子节点，使其一起更新。

至于 `revert`，则是在 **撤销** 的时候，将 `oldParent` 等信息提取出来，并重新计算之前的位置信息，将其恢复到上一状态。

> 那么 `commandInterceptor` 定义的 8 个 `hook` 函数，他们的执行顺序是怎么样的？又是怎么保证在撤销或者恢复的时候新旧状态能完全对应呢？
>
> 这就涉及到 `CommandStack` 的代码设计了。

### CommandStack 命令记录栈

这个模块在上面说到的命令模式中，充当了 `Invoker` 的角色，用来 **执行命令**，并且 **记录每个命令的执行参数（上下文）**，提供撤销、恢复的功能。

整个 `CommandStack` 包含了 4 个核心属性、一个基础属性和两个用来完善和执行的命令函数的属性。

```js
export default function CommandStack(eventBus, injector) {
	// 核心属性
  // 1. 记录每个命令的处理函数（类）
  this._handlerMap = {};
  // 2. 命令的历史记录栈
  this._stack = [];
  // 3. 当前栈位置下标
  this._stackIdx = -1;
  // 4. 当前执行的命令包含的操作和配置
  this._currentExecution = {
    actions: [],
    dirty: [],
    trigger: null
  };

  // 记录 eventBus 和 injector 实例索引的属性
  this._injector = injector;
  this._eventBus = eventBus;

  // action id，用来标识 多个命令是否是同一操作产生的关键
  this._uid = 1;

  // 画布实例销毁时清空栈
  eventBus.on([ 'diagram.destroy', 'diagram.clear' ], function() {
    this.clear(false);
  }, this);
}
CommandStack.$inject = [ 'eventBus', 'injector' ];
```

**栈** 的核心就是 “**先进先出**”，在 `JavaScript` 中大都是以数组的形式来模拟一个栈；当执行一个新的操作时，会向栈中 `push` 一次操作，并将索引 **向后移动** 一位；当触发撤销时，则逆向执行 **当前索引指向** 的操作，同时将索引前移一位；而当索引在栈中时，如果执行了新的操作，则需要截取掉 **索引到栈顶** 部分的操作记录，重新向新的栈顶 `push` 这次操作，然后移动索引。

所以在 `CommandStack` 中，注册了一个 `_stack` 属性，用来保存所有已执行的命令及上下文内容（`CommandStackAction`）；而 `_stackIdx` 则是当前命令位置对应的下标。

但是，**在 `CommandStack` 中，`_uid` 才是标识一个用户操作的关键**，而不是 `_stackIdx`。

> 栈的存在时为了保证命令的执行顺序，而一个用户操作可能会依次执行多个命令。
>
> 例如为 事件节点添加名称时，除了会执行更新事件节点信息的命令，还需要执行创建 `Label` 等命令。而 `uid` 的存在，则是保证一个用户操作中执行的所有命令的确定性，避免 撤销恢复 等操作无法完全或者正确执行每一个步骤。

在 `_handlerMap` 中，保存了 **每一个已注册命令的命令名称和命令执行函数**，这个函数就继承自上文所说的 `CommandInterceptor`。

`_currentExecution` 中有 **四个属性**（另外一个会在执行过程中动态赋值）：

- `actions`：用于记录当前命令执行过程中的所有命令动作（`CommandStackAction`），每个命令动作包含了命令的名称和上下文等信息。
- `dirty`： 用于记录在命令执行过程中被修改或影响的元素，以便在命令执行完成后通知其他组件进行相应的更新。
- `trigger`： 用于标识当前命令执行是由哪种操作触发的，可以在命令执行完成后根据不同的触发类型进行相应的处理，可以是 'execute'、'undo'、'redo'、'clear' 或 null。
- `atomic`：原子性标志，通过在执行过程中设置这个属性来避免命令的嵌套（在执行过程中触发其他命令的执行，影响命令栈的准确性）。

为了保证每一个操作的原子性，在 `CommandStack` 中，通过定义的 `_atomicDo` 方法，接收一个函数作为参数，在执行时修改 `_currentExecution` 的 `atomic` 属性。

```js
CommandStack.prototype._atomicDo = function(fn) {
  const execution = this._currentExecution;
  execution.atomic = true;
  try {
    fn();
  } finally {
    execution.atomic = false;
  }
};
```

#### 命令注册

在 `CommandStack` 中，提供了两个方法用来注册操作命令：`register` 与 `registerHandler`。

- `register`：直接将 **操作命令实例** 注册到 `_handlerMap` 中，如果有重名操作，则会直接抛出异常，而不是进行替换。
- `registerHandler`：将 **操作命令类（构造函数）** 通过 `injector` 进行依赖注入并且实例化，之后将实例通过 `register` 方法注册到 `_handlerMap` 中。

```js
// 省略了参数验证
CommandStack.prototype.register = function(command, handler) {
  this._setHandler(command, handler);
};

CommandStack.prototype.registerHandler = function(command, handlerCls) {
  const handler = this._injector.instantiate(handlerCls);
  this.register(command, handler);
};

CommandStack.prototype._setHandler = function(command, handler) {
  if (this._handlerMap[command]) {
    throw new Error('overriding handler for command <' + command + '>');
  }
  this._handlerMap[command] = handler;
};
```

虽然两个方法最终都是向 `_handlerMap` 中注册一个命令实例，并且 `registerHandler` 内部也是调用的 `register` 方法；但两者适应的场景却不一样。

`CommandStack` 提供了一个 **私有方法** `_getHandler`，可以通过命令名称获取到 `_handlerMap` 中对应的命令（当然也可以直接从 `diagram-js` 实例或者 `injector` 中直接读取 `CommandStack` 的实例，拿到完整的 `_handlerMap`）。

如果有需求的话，我们可以直接获取到指定命令实例，**将其移除后，修改特定的 `hook` 阶段处理函数，再通过 `registerHandler` 重新注册到命令栈中**。

> 当然，一般情况下不推荐使用这一类方式来对某些命令进行改造。

#### 命令执行

当命令注册到 `CommandStack` 之中以后，我们就可以通过该模块来实现对命令的执行了。

> 在 `diagram-js` 和 `bpmn-js` 中，通常不会直接通过 `CommandStack` 模块来调用某个命令，而是通过 `Modeling` 来间接调用。
>
> `Modeling` 原型上的方法大部分都是如此，后面会细说。

上文也说到，`CommandStack` 在命令模式中还充当了 `Invoker` 调用者的角色，所以它提供了一个 `execute` 方法来执行命令：

```typescript
CommandStack.prototype.execute = function(command: string, context: CommandContext): void {}
```

该方法接收两个参数：

1. `command`：指定命令名称字符串，对用上文 `register` 注册过程中的命令名称
2. `context`：命令执行过程中的上下文对象，整个命令执行的每个生命周期会 **共享** 该对象。

> 所以上文例子中的 `MoveShapeHandler` 可以直接在 `execute` 阶段向 `context` 对象中增加新的属性，在 `revert` 阶段可以直接读取该属性进行计算。

整个执行过程分为三个主要阶段：

1. `_pushAction(action)`：将当前的操作命令、操作上下文对象添加到 **当前执行命令对象 `_currentExecution` 中**。
2. `_internalExecute(action)`：执行命令，并且分阶段调用命令所注册的对应方法（`preExecute`，`execute`，`postExecute` 等）。
3. `_popAction()`：清空 `_currentExecution`。

阅读过源码的同学，可能会疑问在 `_internalExecute` 方法中为什么还会执行一次 `_pushAction(action)` 与 `_popAction`。

这里我们用一部分简化的代码来说明：

```js
CommandStack.prototype.execute = function(command, context) {
  this._currentExecution.trigger = 'execute';

  const action = { command: command, context: context };

  this._pushAction(action);
  this._internalExecute(action);
  this._popAction();
};

CommandStack.prototype._pushAction = function(action) {
  const execution = this._currentExecution,
        actions = execution.actions;

  const baseAction = actions[0];

  if (execution.atomic) {
    throw new Error('illegal invocation in <execute> or <revert> phase (action: ' + action.command + ')');
  }

  if (!action.id) {
    action.id = (baseAction && baseAction.id) || this._createId();
  }

  actions.push(action);
};

CommandStack.prototype._popAction = function() {
  const execution = this._currentExecution,
        trigger = execution.trigger,
        actions = execution.actions,
        dirty = execution.dirty;

  actions.pop();

  if (!actions.length) {
    this._eventBus.fire('elements.changed', { elements: uniqueBy('id', dirty.reverse()) });

    dirty.length = 0;

    this._fire('changed', { trigger: trigger });

    execution.trigger = null;
  }
};

CommandStack.prototype._internalExecute = function(action, redo) {
  const command = action.command,
        context = action.context;

  const handler = this._getHandler(command);

  this._pushAction(action);

  if (!redo) {
    this._fire(command, 'preExecute', action);

    if (handler.preExecute) {
      handler.preExecute(context);
    }

    this._fire(command, 'preExecuted', action);
  }

  
  this._atomicDo(() => {
    this._fire(command, 'execute', action);
    if (handler.execute) {
      this._markDirty(handler.execute(context));
    }
    this._executedAction(action, redo);
    this._fire(command, 'executed', action);
  });

  if (!redo) {
    this._fire(command, 'postExecute', action);

    if (handler.postExecute) {
      handler.postExecute(context);
    }

    this._fire(command, 'postExecuted', action);
  }

  this._popAction();
};

CommandStack.prototype._atomicDo = function(fn) {
  const execution = this._currentExecution;
  execution.atomic = true;
  try {
    fn();
  } finally {
    execution.atomic = false;
  }
};
CommandStack.prototype._fire = function(command, qualifier, event) {
  if (arguments.length < 3) {
    event = qualifier;
    qualifier = null;
  }
  const names = qualifier ? [ command + '.' + qualifier, qualifier ] : [ command ];
  let result;
  event = this._eventBus.createEvent(event);
  for (const name of names) {
    result = this._eventBus.fire('commandStack.' + name, event);
    if (event.cancelBubble) {
      break;
    }
  }
  return result;
};
```

在 `execute(command, context)` 执行过程中，会将参数 `command` 与 `context` 组合成一个 `action` 对象，然后执行 `_pushAction(action)`。

此时的 `this._currentExecution` 的 `actions` 还是一个空数组，所以这个方法中获取到的 `baseAction` 实际上是 `undefined`，也就会给 `action` 对象增加一个新的自增 `id` 属性，用来标识当前操作的 **整体性**。

而 `_internalExecute(action)` 执行过程中在调用 `_pushAction(action)` 时，`this._currentExecution.actions` 中的每一个 `action` 对象都会具有一样的 `id` 属性，在后面的 `redo`、`undo` 过程中就能更好的区分。

而通过 `this._atomicDo()` 来执行命令的 “执行” 过程，也是为了避免在命令的 `execute` 过程中嵌套调用 `commandStack.execute` 来执行新命令。

> 另外，从 `_internalExecute(action)` 方法中，也不难看出，一个命令在 **首次执行（不是通过 `redo` 执行）** 时，会触发 6 个不同的事件，并且都可以通过 `eventBus` 进行监听，这个功能就涉及到上文所说的 `CommandInterceptor` 了。
>
> 而每个事件对应的参数，也都是当前命令对应的 `action` 对象。

> 并且，在命令的执行过程中，每个执行周期都会向外部发送相应的 `execute/executed` 事件，并且对该事件的响应回调函数参数，默认也是当前命令的 `action` 对象。

所以我们才能通过注册相应的事件，来对 `action` 中的数据进行修改或者扩充，或者通过 `eventBus` 的特性，来对某些事件进行拦截。

这里我们以官方的属性面板中的一个 **元素属性批量更新操作** 的 Hanlder 命令来进行演示。

### MultiCommandHandler 批量命令执行

整个模块分为 三个部分：

1. 编写具体的 hanlder，也就是 `MultiCommandHandler.js`，需要包含必要的 `hookExecute` 方法。
2. 向 `commandStack` 中注册该 `hanlder`，按照 `injector` 的思想，可以编写一个模块，依赖 `commandStack` ，在初始化阶段调用 `commandStack.registerHanlder`。这个文件也就是 `CommandInitializer.js`
3. 一个用来配置模块注册关系的 `index.js` 入口

其中第一部分是核心逻辑，其余两个则比较简单。

```js
// 1. CommandInitializer.js
import MultiCommandHandler from "./MultiCommandHandler"

const HANDLERS = {
  "panel.multi-command": MultiCommandHandler
}

function CommandInitializer(eventBus, commandStack) {
  eventBus.on("diagram.init", function() {
    Object.keys(HANDLERS).forEach(id =>
      commandStack.registerHandler(id, HANDLERS[id])
    )
  })
}
// 必须依赖 eventBus 和 commandStack，当然也可以根据自己的需求增加新的依赖
CommandInitializer.$inject = ["eventBus", "commandStack"]

export default CommandInitializer

// 2. index.js 入口
import CommandInitializer from './CommandInitializer'

const CustomCmd = {
  // 需要在 init 阶段就进行实例化，触发 MultiCommandHandler 函数的执行，向 commandStack 中注册对应的handler
  __init__: ['commandInitializer'],
  commandInitializer: ['type', CommandInitializer]
}
export default CustomCmd

```

然后在进行 bpmn-js 的 modeler 实例化的时候进行引入即可。

```js
import Modeler from 'bpmn-js/lib/Modeler'
import CustomCmd from '@/bpmn/cmd'

const bpmnModeler = new Modeler({
  container: '#container',
  additionalModules: [ CustomCmd ]
})
```

此时就已经向 `commandStack` 中注册了一个 `panel.multi-command` 的处理命令。

接下来，就是 `MultiCommandHandler.js`：

```js
export default class MultiCommandHandler {
  constructor(commandStack) {
    this._commandStack = commandStack
  }

  preExecute(context = []) {
    const commandStack = this._commandStack

    const exec = command => {
      commandStack.execute(command.cmd, command.context)
    }

    context.forEach(exec)
  }
}

MultiCommandHandler.$inject = ["commandStack"]
```

整个 `MultiCommandHandler` 的核心逻辑就是，在 `preExecute` 阶段，调用 `commandStack` 执行 `context` 参数中定义的每一个命令。

> 这里的 `hookExecute` 为什么是 `preExecute`，而不是 `execute` 或者 `postExecute` 呢？

根据上文 **命令执行** 一节中提到的内容，在 `command.execute()` 方法执行过程中，如果 `hanlder` 中定义的有 `execute` 和 `executed` 方法的话，会通过 `commandStack._atomicDo` 来包装其执行。

而 `_atomicDo` 方法为了避免 **非法嵌套命令**，会在执行时将 `commandStack._currentExecution.atomic` 置为 `true`，并在整个 `execute` 和 `executed` 阶段完成之后再恢复。

如果我们将这里的 `preExecute` 改为 `execute`，则会因为 内部命令的执行导致异常。如下图所示：

![image-20230815164910628](./docs-images/06-%E6%BA%90%E7%A0%81%E7%AF%875%EF%BC%9AFeatures%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%8A%EF%BC%89/image-20230815164910628.png)

当然，这个报错仅仅在将 `preExecute` 改为 `execute` 时才会出现，如果我们将其修改为 `postExecute`，实际上依然可以正确执行我们的 “批量属性更新”。

> 因为整个 `handler` 会作为一个命令进行一次完整的 预执行 `preExecute`、执行 `execute`、执行后 `postExecute` 函数调用，而只有 `execute` 会验证命令嵌套。改为 `postExecute` 目前看来只是在 “执行流程看起来比较怪异”。

**除了通过 `CommandHandler` 来注册操作命令和执行逻辑之外，我们还可以通过 `CommandInterceptor` 来处理每个命令执行过程中的参数处理和验证**。

大致代码如下：

```js
// MultiCommandInterceptor.js
import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor"

class MultiCommandInterceptor extends CommandInterceptor {
  constructor(eventBus) {
    super(eventBus)

    this.preExecute(["panel.multi-command"], function(event) {
      console.log(
        "Command panel.multi-command preExecute, context obj is: ",
        event
      )
    })

    this.preExecuted(["panel.multi-command"], function(event) {
      console.log(
        "Command panel.multi-command preExecuted, context obj is: ",
        event
      )
    })

    this.execute(["panel.multi-command"], function(event) {
      console.log(
        "Command panel.multi-command execute, context obj is: ",
        event
      )
    })

    this.executed(["panel.multi-command"], function(event) {
      console.log(
        "Command panel.multi-command executed, context obj is: ",
        event
      )
    })

    this.postExecute(["panel.multi-command"], function(event) {
      console.log(
        "Command panel.multi-command postExecute, context obj is: ",
        event
      )
    })

    this.postExecuted(["panel.multi-command"], function(event) {
      console.log(
        "Command panel.multi-command postExecuted, context obj is: ",
        event
      )
    })
  }
}

MultiCommandInterceptor.$inject = ["eventBus"]

export default MultiCommandInterceptor


// 一样需要在上文提到的 index.js 中将其添加进去。
import CommandInitializer from './CommandInitializer'
import MultiCommandInterceptor from './MultiCommandInterceptor'

const CustomCmd = {
  // 需要在 init 阶段就进行实例化，触发 MultiCommandHandler 函数的执行，向 commandStack 中注册对应的handler
  __init__: ['commandInitializer', 'multiCommandInterceptor'],
  commandInitializer: ['type', CommandInitializer],
  multiCommandInterceptor: ['type', MultiCommandInterceptor]
}
export default CustomCmd
```

这样我们再进行属性更新时，就会触发上面注册的几个 `hookExecute` 的相关逻辑：

![image-20230816094848303](./docs-images/06-%E6%BA%90%E7%A0%81%E7%AF%875%EF%BC%9AFeatures%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%8A%EF%BC%89/image-20230816094848303.png)

如果我们在使用 `eventBus` 来监听上述几个命令执行周期的话，也一样能够得到对应的结果：

```js
const hookEvents = [
  'preExecute',
  'preExecuted',
  'execute',
  'executed',
  'postExecute',
  'postExecuted'
]
for (const hookEvent of hookEvents) {
  bpmnModeler.on(`commandStack.panel.multi-command.${hookEvent}`, 2000, function (event) {
    console.log('eventBus fire, eventName is: ', hookEvent, 'event obj is: ', event)
  })
}
```

此时控制台会打印如下内容：

![image-20230816102033197](./docs-images/06-%E6%BA%90%E7%A0%81%E7%AF%875%EF%BC%9AFeatures%20%E4%BD%93%E9%AA%8C%E4%BC%98%E5%8C%96%E4%B8%8E%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%EF%BC%88%E4%B8%8A%EF%BC%89/image-20230816102033197.png)

## 本章小结

这一章主要内容是解析了 `diagram-js` 的核心模块之一 —— `CommandStack` 命令记录栈的部分逻辑。

整个 `CommandStack` 依赖于 `EventBus` 模块，通过注册 `CommandHandler`(操作命令的构造函数，一个约束命令对象组成的概念) 来提供相应的能力。

并且为了更好的验证和扩展每个命令的执行，提供了 `canExecute` 的命令执行前校验的方法，还将每个命令的执行划分为了 `preExecute`、`execute`、`posetExecute` 三个阶段。

通过将 命令的上下文对象 `context` 与对应的 `command` 命令进行组装和保存，配合单次命令执行过程中统一的 `id` 属性，来确保每个命令的附属操作都能顺利且有序的保存在操作记录栈中。

在每个阶段的执行前与执行后，`CommandStack` 还会借助 `EventBus` 将当前的命令对应的 `action` 对象（也就是命令 `command` 和上下文 `context`）通过 `commandStack.${command}.${hookExecute/hookExecuted}` 事件发送处理，开发者可以通过注册对应的事件来处理和变更这个命令在某些情况下的特殊参数和逻辑。

`CommandInterceptor` 的概念就是对此操作的一个具体实现，通过在实例化时向 `EventBus` 中注册相关的命令处理周期的监听函数，来处理命令执行过程中的上下文参数。

