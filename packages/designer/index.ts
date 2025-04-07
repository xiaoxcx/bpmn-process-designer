import Viewer, { type ViewerOptions } from '@miyue-bpmn/viewer'
import Modeler from 'bpmn-js/lib/Modeler'
import { isUndefined } from 'min-dash'
import { DEFAULT_DISTANCE } from 'diagram-js/lib/features/auto-place/AutoPlaceUtil'
import Palette from 'diagram-js/lib/features/palette/Palette'

export default class Designer extends Modeler {
  getCanvas: typeof Viewer.prototype.getCanvas
  getBpmnFactory: typeof Viewer.prototype.getBpmnFactory
  getElementFactory: typeof Viewer.prototype.getElementFactory
  getRegisteredEvents: typeof Viewer.prototype.getRegisteredEvents
  autoZoomAndCenter: typeof Viewer.prototype.autoZoomAndCenter
  autoElementCenter: typeof Viewer.prototype.autoElementCenter
  toggleTheme: typeof Viewer.prototype.toggleTheme

  private _insertElement: (targetShape: BpmnElement, newElement: string, distance?: number) => void
  updatePalette: () => void

  /**
   * 创建编辑器对象
   * @param {ViewerOptions} options
   */
  constructor(options: ViewerOptions) {
    super(options)

    this.getCanvas = Viewer.prototype.getCanvas.bind(this)
    this.getBpmnFactory = Viewer.prototype.getBpmnFactory.bind(this)
    this.getElementFactory = Viewer.prototype.getElementFactory.bind(this)
    this.getRegisteredEvents = Viewer.prototype.getRegisteredEvents.bind(this)
    this.autoZoomAndCenter = Viewer.prototype.autoZoomAndCenter.bind(this)
    this.autoElementCenter = Viewer.prototype.autoElementCenter.bind(this)
    this.toggleTheme = Viewer.prototype.toggleTheme.bind(this)

    // 刷新 palette 内容
    this.updatePalette = function () {
      this.get<Palette & { _rebuild: () => void }>('palette')._rebuild()
    }

    this._insertElement = function (targetShape, newElement, distance) {
      if (!targetShape) {
        return console.error('Target shape not found')
      }
      if (isUndefined(distance)) {
        distance = DEFAULT_DISTANCE
      }
    }
  }
}
