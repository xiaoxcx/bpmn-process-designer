import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer'
import GridLineModule from 'diagram-js-grid-bg'

import type { BaseViewerOptions, ModuleDeclaration } from 'bpmn-js/lib/BaseViewer'
import type Canvas from 'diagram-js/lib/core/Canvas'
import type EventBus from 'diagram-js/lib/core/EventBus'
import type BpmnFactory from 'bpmn-js/lib/features/modeling/BpmnFactory'
import type ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory'

export type ViewerTheme = 'dark' | 'light'
export type ViewerOptions = BaseViewerOptions & {
  theme?: ViewerTheme
}

// @ts-expect-error
const _navigationModules = NavigatedViewer.prototype._modules
const _additionalModules: ModuleDeclaration[] = [GridLineModule]

export default class Viewer extends NavigatedViewer {
  _theme: ViewerTheme = 'light'

  private _container: HTMLElement | undefined
  private _additionalModules: ModuleDeclaration[] = [GridLineModule]
  private _modules: ModuleDeclaration[] = []

  constructor(options: ViewerOptions) {
    super(options)
  }

  // 必须重写
  getModules() {
    return (this._modules = _navigationModules.concat(_additionalModules))
  }

  getCanvas() {
    return this.get<Canvas>('canvas')
  }
  getBpmnFactory() {
    return this.get<BpmnFactory>('bpmnFactory')
  }
  getElementFactory() {
    return this.get<ElementFactory>('elementFactory')
  }

  // 获取所有已注册的事件
  getRegisteredEvents() {
    const eventBus = this.get<EventBus>('eventBus')
    const allListener = (eventBus as any)._listeners as Record<string, any>
    return Object.keys(allListener).sort()
  }

  /**
   * 自适应缩放并居中
   */
  autoZoomAndCenter() {
    // @ts-expect-error center 不符合格式时会自动计算中心
    this.getCanvas().zoom('fit-viewport', 'center')
  }

  /**
   * 自适应缩放并保持指定元素居中
   */
  autoElementCenter(element: BpmnElement) {
    const canvas = this.getCanvas()
    const { width, height } = canvas.getSize()
    const { scale } = canvas.viewbox()
    const left = Math.round((width - element.width * scale) / 2)
    const top = Math.round((height - element.height * scale) / 2)

    const bottom = top
    const right = left

    this.getCanvas().scrollToElement(element, { top, left, bottom, right })
  }

  /**
   * 主题切换
   */
  toggleTheme(theme?: ViewerTheme) {
    this._theme = theme || (this._theme === 'light' ? 'dark' : 'light')
    this._container!.setAttribute('data-theme', this._theme)
  }

  /**
   * 添加 class 类名
   */
  addClass(
    elements: BpmnShape | BpmnConnection | string | Array<BpmnShape | BpmnConnection | string>,
    className: string
  ) {
    const canvas = this.getCanvas()
    if (Array.isArray(elements)) {
      elements.forEach((el) => canvas.addMarker(el, className))
    } else {
      canvas.addMarker(elements, className)
    }
  }

  /**
   * 设置样式
   */
  addStyle() {}
}
