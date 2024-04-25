import { is } from 'bpmn-js/lib/util/ModelUtil'
import { execSingleCommands } from './commands-execute'
import { addExtensionElCommand } from '@shared/utils/commands-generator'
import type Modeler from 'bpmn-js/lib/Modeler'

export function getExtensionElementsList(
  businessObject: BpmnModdleEl,
  type?: string
): BpmnModdleEl[] {
  const extensionElements = businessObject.get('extensionElements')
  if (!extensionElements) {
    return []
  }
  const values = extensionElements.get('values')
  if (!values || !values.length) {
    return []
  }
  if (type) {
    return values.filter((value) => is(value, type))
  }
  return values
}

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

  execSingleCommands(modeler, command)
}

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

  execSingleCommands(modeler, {
    element,
    moddleElement: extensionElements,
    properties: { values }
  })
}
