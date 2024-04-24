import type Modeler from 'bpmn-js/lib/Modeler'
import type BpmnFactory from 'bpmn-js/lib/features/modeling/BpmnFactory'

import Ids from 'ids'
import { is } from 'bpmn-js/lib/util/ModelUtil'

export function nextId(prefix: string): string {
  const ids = new Ids([32, 32, 1])

  return ids.nextPrefixed(`${prefix}_`)
}

export function getRoot(businessObject: BpmnModdleEl): BpmnRoot {
  let parent = businessObject

  while (parent.$parent) {
    parent = parent.$parent
  }

  return parent
}

export function createElement(
  modeler: Modeler,
  elementType: string,
  properties: Record<string, unknown>,
  parent?: BpmnModdleEl
): BpmnModdleEl {
  const factory = modeler.get<BpmnFactory>('bpmnFactory')
  const element = factory!.create(elementType, properties)

  if (parent) {
    element.$parent = parent
  }

  return element
}

export function filterElementsByType<T extends BpmnElement | BpmnModdleEl>(
  objectList: T[],
  type: string
): T[] {
  const list = objectList || []
  return list.filter((element) => is(element, type))
}

export function findRootElementsByType(
  businessObject: BpmnModdleEl,
  referencedType: string
): BpmnRoot[] {
  const root = getRoot(businessObject)
  return root.get('rootElements').filter((element: BpmnRoot) => is(element, referencedType))
}

export function findRootElementById(
  businessObject: BpmnModdleEl,
  type: string,
  id: string
): BpmnRoot | undefined {
  const elements = findRootElementsByType(businessObject, type)
  return elements.find((element) => element.id === id)
}
