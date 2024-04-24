import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil'
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil'
import { getImplementationType } from './implementation-type-utils'

export function isErrorSupported(element: BpmnElement | BpmnModdleEl): boolean {
  return (
    isAny(element, ['bpmn:StartEvent', 'bpmn:BoundaryEvent', 'bpmn:EndEvent']) &&
    !!getErrorEventDefinition(element)
  )
}

export function isTimerSupported(element: BpmnElement | BpmnModdleEl): boolean {
  return (
    isAny(element, ['bpmn:StartEvent', 'bpmn:IntermediateCatchEvent', 'bpmn:BoundaryEvent']) &&
    !!getTimerEventDefinition(element)
  )
}

export function isMessageSupported(element: BpmnElement | BpmnModdleEl): boolean {
  return (
    is(element, 'bpmn:ReceiveTask') ||
    (isAny(element, [
      'bpmn:StartEvent',
      'bpmn:EndEvent',
      'bpmn:IntermediateThrowEvent',
      'bpmn:BoundaryEvent',
      'bpmn:IntermediateCatchEvent'
    ]) &&
      !!getMessageEventDefinition(element))
  )
}

export function isLinkSupported(element: BpmnElement | BpmnModdleEl): boolean {
  return (
    isAny(element, ['bpmn:IntermediateThrowEvent', 'bpmn:IntermediateCatchEvent']) &&
    !!getLinkEventDefinition(element)
  )
}

export function isSignalSupported(element: BpmnElement | BpmnModdleEl): boolean {
  return is(element, 'bpmn:Event') && !!getSignalEventDefinition(element)
}

export function isEscalationSupported(element: BpmnElement | BpmnModdleEl): boolean {
  return is(element, 'bpmn:Event') && !!getEscalationEventDefinition(element)
}

export function isCompensationSupported(element: BpmnElement | BpmnModdleEl): boolean {
  return (
    isAny(element, ['bpmn:EndEvent', 'bpmn:IntermediateThrowEvent']) &&
    !!getCompensateEventDefinition(element)
  )
}

export function isServiceErrorsSupported(element: BpmnElement): boolean {
  return is(element, 'bpmn:ServiceTask') && getImplementationType(element) === 'external'
}

export function getErrorEventDefinition(
  element: BpmnElement | BpmnModdleEl
): BpmnModdleEl | undefined {
  return getEventDefinition(element, 'bpmn:ErrorEventDefinition')
}

/**
 * Get the timer definition type for a given timer event definition.
 */
export function getTimerDefinitionType(timer?: BpmnModdleEl): string | undefined {
  if (!timer) {
    return
  }

  const timeDate = timer.get('timeDate')
  if (typeof timeDate !== 'undefined') {
    return 'timeDate'
  }

  const timeCycle = timer.get('timeCycle')
  if (typeof timeCycle !== 'undefined') {
    return 'timeCycle'
  }

  const timeDuration = timer.get('timeDuration')
  if (typeof timeDuration !== 'undefined') {
    return 'timeDuration'
  }
}

export function getTimerEventDefinition(element: BpmnElement | BpmnModdleEl) {
  return getEventDefinition(element, 'bpmn:TimerEventDefinition')
}

export function getError(element: BpmnElement | BpmnModdleEl): BpmnModdleEl | undefined {
  const errorEventDefinition = getErrorEventDefinition(element)

  return errorEventDefinition && errorEventDefinition.get('errorRef')
}

export function getEventDefinition(
  element: BpmnElement | BpmnModdleEl,
  eventType: string
): BpmnModdleEl | undefined {
  const businessObject = getBusinessObject(element)

  const eventDefinitions = businessObject.get('eventDefinitions') || []

  return eventDefinitions.find((definition) => is(definition, eventType))
}

export function getMessageEventDefinition(
  element: BpmnElement | BpmnModdleEl
): BpmnModdleEl | undefined {
  if (is(element, 'bpmn:ReceiveTask')) {
    return getBusinessObject(element)
  }

  return getEventDefinition(element, 'bpmn:MessageEventDefinition')
}

export function getMessage(element: BpmnElement | BpmnModdleEl): BpmnModdleEl | undefined {
  const messageEventDefinition = getMessageEventDefinition(element)

  return messageEventDefinition && messageEventDefinition.get('messageRef')
}

export function getLinkEventDefinition(
  element: BpmnElement | BpmnModdleEl
): BpmnModdleEl | undefined {
  return getEventDefinition(element, 'bpmn:LinkEventDefinition')
}

export function getSignalEventDefinition(
  element: BpmnElement | BpmnModdleEl
): BpmnModdleEl | undefined {
  return getEventDefinition(element, 'bpmn:SignalEventDefinition')
}

export function getSignal(element: BpmnElement | BpmnModdleEl): BpmnModdleEl | undefined {
  const signalEventDefinition = getSignalEventDefinition(element)

  return signalEventDefinition && signalEventDefinition.get('signalRef')
}

export function getEscalationEventDefinition(
  element: BpmnElement | BpmnModdleEl
): BpmnModdleEl | undefined {
  return getEventDefinition(element, 'bpmn:EscalationEventDefinition')
}

export function getEscalation(element: BpmnElement | BpmnModdleEl): BpmnModdleEl | undefined {
  const escalationEventDefinition = getEscalationEventDefinition(element)

  return escalationEventDefinition && escalationEventDefinition.get('escalationRef')
}

export function getCompensateEventDefinition(
  element: BpmnElement | BpmnModdleEl
): BpmnModdleEl | undefined {
  return getEventDefinition(element, 'bpmn:CompensateEventDefinition')
}

export function getCompensateActivity(
  element: BpmnElement | BpmnModdleEl
): BpmnModdleEl | undefined {
  const compensateEventDefinition = getCompensateEventDefinition(element)

  return compensateEventDefinition && compensateEventDefinition.get('activityRef')
}

export function canHaveEventVariables(element: BpmnElement): boolean {
  return is(element, 'bpmn:StartEvent') || is(element, 'bpmn:BoundaryEvent')
}
