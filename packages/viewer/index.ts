import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer'
import GridLineModule from 'diagram-js-grid-bg'

import type { BaseViewerOptions, ModuleDeclaration } from 'bpmn-js/lib/BaseViewer'
import type Canvas from 'diagram-js/lib/core/Canvas'
import type BpmnFactory from 'bpmn-js/lib/features/modeling/BpmnFactory'

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
}
