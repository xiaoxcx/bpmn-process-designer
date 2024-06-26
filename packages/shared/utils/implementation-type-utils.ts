import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil'
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil'

import { getExtensionElementsWithType } from './extension-elements-utils'
import { getMessageEventDefinition } from './event-definition-utils'

export type ImplementationType =
  | 'dmn'
  | 'connector'
  | 'external'
  | 'class'
  | 'expression'
  | 'delegateExpression'
  | 'script'

// Check whether an element is camunda:ServiceTaskLike
export function isServiceTaskLike(element: BpmnElement | BpmnModdleEl): boolean {
  return is(element, `flowable:ServiceTaskLike`)
}

// Returns 'true' if the given element is 'camunda:DmnCapable'
export function isDmnCapable(element: BpmnModdleEl) {
  return is(element, `flowable:DmnCapable`)
}

// Returns 'true' if the given element is 'camunda:ExternalCapable'
export function isExternalCapable(element: BpmnModdleEl) {
  return is(element, `flowable:ExternalCapable`)
}

export function getServiceTaskLikeBusinessObject(
  element: BpmnElement | BpmnModdleEl
): BpmnModdleEl | false {
  let scopedElement: BpmnElement | BpmnModdleEl = element
  if (is(scopedElement, 'bpmn:IntermediateThrowEvent') || is(scopedElement, 'bpmn:EndEvent')) {
    const messageEventDefinition = getMessageEventDefinition(scopedElement)
    if (messageEventDefinition) {
      scopedElement = messageEventDefinition
    }
  }

  return isServiceTaskLike(scopedElement) && getBusinessObject(scopedElement)
}

// Returns the implementation type of the given element.
export function getImplementationType(
  element: BpmnElement | BpmnModdleEl
): ImplementationType | undefined {
  const businessObject =
    getListenerBusinessObject(element) || getServiceTaskLikeBusinessObject(element)

  if (!businessObject) {
    return
  }

  if (isDmnCapable(businessObject)) {
    const decisionRef = businessObject.get(`flowable:decisionRef`)
    if (typeof decisionRef !== 'undefined') {
      return 'dmn'
    }
  }

  if (isServiceTaskLike(businessObject)) {
    const connectors = getExtensionElementsWithType(businessObject, `flowable:Connector`)
    if (connectors.length) {
      return 'connector'
    }
  }

  if (isExternalCapable(businessObject)) {
    const type = businessObject.get(`flowable:type`)
    if (type === 'external') {
      return 'external'
    }
  }

  const script = businessObject.get('script')
  if (typeof script !== 'undefined') {
    return 'script'
  }

  return getSimpleImplType(element)
}

export function getSimpleImplType(
  element: BpmnElement | BpmnModdleEl
): ImplementationType | undefined {
  const businessObject =
    getListenerBusinessObject(element) || getServiceTaskLikeBusinessObject(element)

  if (!businessObject) {
    return
  }

  const cls = businessObject.get(`flowable:class`)
  if (typeof cls !== 'undefined') {
    return 'class'
  }

  const expression = businessObject.get(`flowable:expression`)
  if (typeof expression !== 'undefined') {
    return 'expression'
  }

  const delegateExpression = businessObject.get(`flowable:delegateExpression`)
  if (typeof delegateExpression !== 'undefined') {
    return 'delegateExpression'
  }
}

function getListenerBusinessObject(businessObject: BpmnModdleEl): BpmnModdleEl | undefined {
  if (isAny(businessObject, [`flowable:ExecutionListener`, `flowable:TaskListener`])) {
    return businessObject
  }
}
