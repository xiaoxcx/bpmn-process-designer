## BaseModeler - 没啥用的编辑器

作为以 `Base` 开头的构造函数，`BaseModeler` 基本上也无法直接用于 `xml` 的更改，或者说无法直接使用。

因为 `BaseModeler` 只是继承了 `BaseViewer`，然后对 `_createModdle` 进行了一次修改，给创建的 `moddle` 实例增加了一个 `ids` 属性，用来 **生成后续新节点的随机 `id`**。

在初始化的过程中，也增加了两个事件监听回调：

- `import.parse.complete`：导入 `xml` 解析之后，会记录所有已有元素的 `id` 属性到 `moddle` 实例的 `ids` 属性中。
- `diagram.destroy`：画布销毁时，将 `moddle` 实例中的 `ids` 属性清空



## Modeler - 基础的 BPMN2.0 文件图形编辑器

为什么说它是图形编辑器，也是因为 `Modeler` 本身只能操作图形元素，对于图形元素的具体的 **业务属性部分** 并没有提供太多的修改功能，只有在 **业务属性与画布元素显示有关** 时，才能通过调整元素的类型来实现业务属性的修改。

> 所以，业务属性的改动通常需要使用 [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel) 或者自定义一个属性面板来实现。

`Modeler` 与前面的 `NavigatedViewer、Viewer` 两个模式的扩展方式一样，都是通过引入对应的功能模块来实现 **编辑**。

```js
Modeler.prototype._interactionModules = [
  KeyboardMoveModule,
  MoveCanvasModule,
  TouchModule,
  ZoomScrollModule
];

Modeler.prototype._modelingModules = [
  AlignElementsModule,
  AutoPlaceModule,
  AutoScrollModule,
  AutoResizeModule,
  BendpointsModule,
  ConnectModule,
  ConnectionPreviewModule,
  ContextPadModule,
  CopyPasteModule,
  CreateModule,
  DistributeElementsModule,
  EditorActionsModule,
  GridSnappingModule,
  InteractionEventsModule,
  KeyboardModule,
  KeyboardMoveSelectionModule,
  LabelEditingModule,
  ModelingModule,
  ModelingFeedbackModule,
  MoveModule,
  OutlineModule,
  PaletteModule,
  ReplacePreviewModule,
  ResizeModule,
  SnappingModule,
  SearchModule
];

Modeler.prototype._modules = [].concat(
  Viewer.prototype._modules,
  Modeler.prototype._interactionModules,
  Modeler.prototype._modelingModules
);
```

但是，`Modeler` 对它默认使用的 `modules` 进行了一下区分，将 `NavigatedViewer` 使用的几个模块，与 `TouchModules` 合并到了 `_interactionModules` 中，作为 **存在互相影响的模块**。另外一些与 **建模** 相关的模块，则放到的 `_modelingModules` 中，这些模块的大致作用如下：

- `AlignElementsModule`：元素对齐
- `AutoPlaceModule`：自动追加新元素到合适位置
- `AutoScrollModule`：鼠标焦点到边缘位置时画布移动
- `AutoResizeModule`：类似 `SubProcess` 节点中子节点移动到该节点外部等情况下自动调整父元素大小
- `BendpointsModule`：连线类元素的编辑辅助，给连线添加可拖拽的辅助点等内容
- `ConnectModule`：实现从目标节点开启连线操作并完成连线
- `ConnectionPreviewModule`：连线过程中的状态预览
- `ContextPadModule`：选中内容的上下文操作菜单
- `CopyPasteModule`：复制粘贴模块
- `CreateModule`：元素拖动创建模块
- `DistributeElementsModule`：元素对齐时校验可使用对齐操作的元素
- `EditorActionsModule`：管理已注册 BPMN 特殊操作的工具
- `GridSnappingModule`：元素移动或者拖拽等操作时，实现最小整数移动（step）的操作
- `InteractionEventsModule`：对于 `Participant`、`SubProcess` 等特殊节点的事件响应区域与标记显示的处理
- `KeyboardModule`：提供键盘事件绑定和管理
- `KeyboardMoveSelectionModule`：默认的方向键控制元素移动模块
- `LabelEditingModule`：元素双击修改 `label`，依赖 `diagram-js-direct-editing`
- `ModelingModule`：提供默认的建模操作方法与实现逻辑
- `ModelingFeedbackModule`：存在协作节点时对创建写作节点外部节点时的错误提示
- `MoveModule`：画布和元素移动
- `OutlineModule`：元素高亮边框
- `PaletteModule`：左侧画板
- `ReplacePreviewModule`：元素替换工具，基于 `diagram-js` 提供的 `PopupMenu`
- `ResizeModule`：为元素提供大小调整的功能
- `SnappingModule`：元素移动或者创建时的对齐辅助线
- `SearchModule`：用于全局查询元素的模块

当我们直接使用 `Modeler` 创建编辑器时，就会得到这样的内容：

<img src="./docs-images/13-%E6%BA%90%E7%A0%81%E7%AF%8712%EF%BC%9AModeler-Viewer%E4%B9%8B%E4%B8%8A%E7%9A%84%E7%BC%96%E8%BE%91%E6%A8%A1%E5%BC%8F/image-20240102164750139.png" alt="image-20240102164750139" style="zoom:50%;" />

但是，此时从 `Palette` 中拖拽元素进行创建时则会报错，整个画布会变红，提示无法创建：

<img src="./docs-images/13-%E6%BA%90%E7%A0%81%E7%AF%8712%EF%BC%9AModeler-Viewer%E4%B9%8B%E4%B8%8A%E7%9A%84%E7%BC%96%E8%BE%91%E6%A8%A1%E5%BC%8F/image-20240102164848349.png" alt="image-20240102164848349" style="zoom:50%;" />

这是因为 **`BpmnRules` 模块中具有的默认规则**导致的。

在直接使用 `new Modeler({ container })` 创建编辑器时，画布中 **不存在 `Process` 或者 `Collaboration` 这类根节点**，所以直接创建普通的流程元素会无法找到 `parent` 节点。为了避免这种情况，`Modeler` 又提供了一个创建基础流程的方法。

### 默认提供的新流程创建方法 —— `createDiagram`

这个方法实际上非常简单，模块内部定义了一个基础的 `xml` 字符串 `initialDiagram`，然后返回 `this.importXML(initialDiagram)`。

`initialDiagram` 包含了一个 `id` 为 `Definitions_1` 的定义标签 `<bpmn:definitions>`，以及 `id` 为 `Process_1` 的 `<bpmn:process>` 根节点和一个 `id` 为 `StartEvent_1` 的开始节点。

此时页面如下：

<img src="./docs-images/13-%E6%BA%90%E7%A0%81%E7%AF%8712%EF%BC%9AModeler-Viewer%E4%B9%8B%E4%B8%8A%E7%9A%84%E7%BC%96%E8%BE%91%E6%A8%A1%E5%BC%8F/image-20240402215511560.png" alt="image-20240402215511560" style="zoom:50%;" />

从现在开始，我们就可以通过 `Palette` 与 `ContextPad` 完成一个基础的 BPMN 流程图的绘制了。

另外，在 `Modeler` 上还提供了两个静态属性 `Viewer` 与 `NavigatedViewer`，分别对应了上一章所讲的 `Viewer` 和 `NavigatedViewer`。

