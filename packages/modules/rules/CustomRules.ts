import BpmnRules from 'bpmn-js/lib/features/rules/BpmnRules'
import { is } from 'bpmn-js/lib/util/ModelUtil'

import type EventBus from 'diagram-js/lib/core/EventBus'
import type { Point } from 'diagram-js/lib/util/Types'

class CustomRules extends BpmnRules {
  _baseCanCreate = BpmnRules.prototype.canCreate

  constructor(eventBus: EventBus) {
    super(eventBus)

    this.initCustom()
  }

  // @ts-expect-error
  canCreate(shape: BpmnElement, target: BpmnElement, source: BpmnElement, position: Point) {
    if (is(target, 'bpmn:Collaboration')) {
      return !target.children.length && this._baseCanCreate(shape, target, source, position)
    }
    return this._baseCanCreate(shape, target, source, position)
  }

  initCustom() {
    this.addRule('shape.create', 2000, (context) => {
      return this.canCreate(context.shape, context.target, context.source, context.position)
    })
  }
}

CustomRules.$inject = ['eventBus']

export default CustomRules
