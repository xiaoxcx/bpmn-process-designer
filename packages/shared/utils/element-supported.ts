import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil'
import { is } from 'bpmn-js/lib/util/ModelUtil'
import { getImplementationType } from './implementation-type-utils'

/************************* 监听器 ************************/
export const LISTENER_ALLOWED_TYPES = [
  'bpmn:Activity',
  'bpmn:Event',
  'bpmn:Gateway',
  'bpmn:SequenceFlow',
  'bpmn:Process',
  'bpmn:Participant'
]
/************************* 多实例 ************************/
export const MULTI_INSTANCE_ALLOWED_TYPES = [
  'bpmn:UserTask',
  'bpmn:ScriptTask',
  'bpmn:ServiceTask',
  'bpmn:WebServiceTask',
  'bpmn:BusinessRuleTask',
  'bpmn:EmailTask',
  'bpmn:ManualTask',
  'bpmn:SendTask',
  'bpmn:ReceiveTask',
  'bpmn:SubProcess',
  'bpmn:CallActivity'
]

// 可否配置多实例
export function isMultiInstanceSupported(element: BpmnElement) {
  if (isAny(element, MULTI_INSTANCE_ALLOWED_TYPES)) {
    return !(is(element, 'bpmn:Participant') && !element.businessObject.processRef)
  }
  return false
}
// 可否配置执行监听器
export function isExecutionListenerSupported(element: BpmnElement) {
  if (isAny(element, LISTENER_ALLOWED_TYPES)) {
    return !(
      is(element, 'bpmn:Participant') &&
      is(element, 'bpmn:Collaboration') &&
      !element.businessObject.processRef
    )
  }
  return false
}
// 可否配置任务监听器
export function isUserTaskSupported(element: BpmnElement) {
  return is(element, 'bpmn:UserTask')
}

export function isScriptTaskSupported(element: BpmnElement) {
  return is(element, 'bpmn:ScriptTask')
}

export function isServiceTaskSupported(element: BpmnElement) {
  return is(element, 'bpmn:ServiceTask')
}

export function isCallActivitySupported(element: BpmnElement) {
  return is(element, 'bpmn:CallActivity')
}

export function isDecisionTaskSupported(element: BpmnElement) {
  return is(element, 'bpmn:ServiceTask') && getImplementationType(element) === 'dmn'
}
