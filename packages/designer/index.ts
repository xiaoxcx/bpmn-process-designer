import Viewer, { type ViewerOptions } from '@miyue-bpmn/viewer'
import Modeler from 'bpmn-js/lib/Modeler'

export default class Designer extends Modeler {
  getCanvas: typeof Viewer.prototype.getCanvas
  getBpmnFactory: typeof Viewer.prototype.getBpmnFactory
  getElementFactory: typeof Viewer.prototype.getElementFactory
  getRegisteredEvents: typeof Viewer.prototype.getRegisteredEvents
  autoZoomAndCenter: typeof Viewer.prototype.autoZoomAndCenter
  autoElementCenter: typeof Viewer.prototype.autoElementCenter
  toggleTheme: typeof Viewer.prototype.toggleTheme

  constructor(options: ViewerOptions) {
    super(options)

    this.getCanvas = Viewer.prototype.getCanvas.bind(this)
    this.getBpmnFactory = Viewer.prototype.getBpmnFactory.bind(this)
    this.getElementFactory = Viewer.prototype.getElementFactory.bind(this)
    this.getRegisteredEvents = Viewer.prototype.getRegisteredEvents.bind(this)
    this.autoZoomAndCenter = Viewer.prototype.autoZoomAndCenter.bind(this)
    this.autoElementCenter = Viewer.prototype.autoElementCenter.bind(this)
    this.toggleTheme = Viewer.prototype.toggleTheme.bind(this)
  }
}
