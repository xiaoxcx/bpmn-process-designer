## bpmn-js Viewer

继承 bpmn-js 的 NavigatedViewer， 有基础的导入导出、画布拖拽缩放等功能。

在其基础上扩展了以下功能：
- 直接获取 Canvas、BpmnFactory、ElementRegistry 对象与类型
- 获取已注册监听事件列表
- 直接设置画布自适应显示
- 指定元素居中显示
- 主题切换（需要自行控制css样式变量）
