import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer'
import { BaseViewerOptions } from 'bpmn-js/lib/BaseViewer'
import Canvas from 'diagram-js/lib/core/Canvas'
import BpmnFactory from 'bpmn-js/lib/features/modeling/BpmnFactory'

import GridLineModule from 'diagram-js-grid-bg'

export type ViewerTheme = 'dark' | 'light'
export type ViewerOptions = BaseViewerOptions & {
  theme?: ViewerTheme
}

// @ts-expect-error
const _navigationModules = NavigatedViewer.prototype._modules

export default class Viewer extends NavigatedViewer {
  _theme: ViewerTheme = 'light'
  _additionalModules = [GridLineModule]
  _modules = _navigationModules.concat(this._additionalModules)
  private _container: HTMLElement | undefined

  constructor(options: ViewerOptions) {
    super(options)
  }

  getCanvas() {
    return this.get<Canvas>('canvas')
  }
  getFactory() {
    return this.get<BpmnFactory>('bpmnFactory')
  }

  /**
   * 自适应缩放并居中
   */
  autoZoom() {
    // @ts-expect-error center 不符合格式时会自动计算中心
    this.getCanvas().zoom('fit-viewport', 'center')
  }

  /**
   * 自适应缩放并居中
   */
  autoElementCenter(element: BpmnElement) {
    const canvas = this.getCanvas()
    const viewbox = canvas.viewbox()
    const left = (viewbox.width - element.width) / 2
    const top = (viewbox.height - element.height) / 2
    this.getCanvas().scrollToElement(element, { top, left, bottom: top, right: left })
  }

  /**
   * 主题切换
   */
  toggleTheme(theme?: ViewerTheme) {
    this._theme = theme || (this._theme === 'light' ? 'dark' : 'light')
    this._container!.setAttribute('data-theme', this._theme)
  }
}
