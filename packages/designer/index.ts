import Viewer, { type ViewerOptions } from '@miyue-bpmn/viewer'
import Modeler from 'bpmn-js/lib/Modeler'
import { isUndefined } from 'min-dash'
import { DEFAULT_DISTANCE } from 'diagram-js/lib/features/auto-place/AutoPlaceUtil'
import Palette from 'diagram-js/lib/features/palette/Palette'
import { ImportXMLResult } from 'bpmn-js/lib/BaseViewer'

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
  initProcess: (key?: string, name?: string) => Promise<ImportXMLResult>

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

    // 设置空流程
    this.initProcess = function (key: string = Date.now().toString(), name: string = 'Process') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  targetNamespace="http://bpmn.io/schema/bpmn"
  id="Definitions_${key}">
  <bpmn:process id="Process_${key}" name="${name}" isExecutable="true"></bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_${key}"></bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
      return this.importXML(xml)
    }

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
