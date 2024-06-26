import { is } from 'bpmn-js/lib/util/ModelUtil'
import { execSingleCommand } from './commands-execute'
import { addExtensionElCommand } from '@shared/utils/commands-generator'

import type Modeler from 'bpmn-js/lib/Modeler'

export type ElementFilterFn = (el: BpmnModdleEl) => boolean

/**
 * 获取扩展元素数组，支持指定 type
 * @param businessObject
 */
export function getExtensionElements(businessObject: BpmnModdleEl): BpmnModdleEl[] {
  const extensionElements = businessObject.get('extensionElements')
  if (!extensionElements) {
    return []
  }
  const values = extensionElements.get('values')
  if (!values || !values.length) {
    return []
  }
  return values
}

/**
 * 获取指定 type 的扩展元素数组
 * @param businessObject
 * @param [type]
 */
export function getExtensionElementsWithType(
  businessObject: BpmnModdleEl,
  type: string
): BpmnModdleEl[] {
  const values = getExtensionElements(businessObject)
  return values.filter((value) => is(value, type))
}

/**
 * 查找第一个指定扩展属性元素
 * @param businessObject
 * @param filter
 */
export function findExtensionElement(
  businessObject: BpmnModdleEl,
  filter: ElementFilterFn
): BpmnModdleEl | undefined {
  const values = getExtensionElements(businessObject)
  return values.find(filter)
}

/**
 *
 * @param businessObject
 * @param filter
 */
export function filterExtensionElements(
  businessObject: BpmnModdleEl,
  filter: ElementFilterFn
): BpmnModdleEl[] {
  const values = getExtensionElements(businessObject)
  return values.filter(filter)
}

/**
 * 向扩展元素中插入新元素
 * @param modeler
 * @param element
 * @param businessObject
 * @param extensionElementsToAdd
 */
export function addExtensionElements(
  modeler: Modeler,
  element: BpmnElement,
  businessObject: BpmnModdleEl,
  extensionElementsToAdd: BpmnModdleEl | BpmnModdleEl[]
) {
  const command: CommandContext = addExtensionElCommand(
    modeler,
    element,
    businessObject,
    extensionElementsToAdd
  )

  execSingleCommand(modeler, command)
}

/**
 * 从扩展元素中删除指定元素
 * @param modeler
 * @param element
 * @param businessObject
 * @param extensionElementsToRemove
 */
export function removeExtensionElements(
  modeler: Modeler,
  element: BpmnElement,
  businessObject: BpmnModdleEl,
  extensionElementsToRemove: BpmnModdleEl | BpmnModdleEl[]
) {
  if (!Array.isArray(extensionElementsToRemove)) {
    extensionElementsToRemove = [extensionElementsToRemove]
  }

  const extensionElements = businessObject.get('extensionElements'),
    values = extensionElements
      .get('values')
      .filter((value) => !extensionElementsToRemove.includes(value))

  execSingleCommand(modeler, {
    element,
    moddleElement: extensionElements,
    properties: { values }
  })
}
