import { is } from 'bpmn-js/lib/util/ModelUtil'
import { createElement } from './element-utils'
import { execPanelCommands, execPanelMultiCommands } from './commandsExecute'
import type Modeler from 'bpmn-js/lib/Modeler'

/**
 * Get extension elements of business object. Optionally filter by type.
 */
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

export function getExExtensionElementsList(
  businessObject: BpmnModdleEl,
  type?: string
): BpmnModdleEl[] {
  return getExtensionElementsList(businessObject, `flowable:${type}`)
}

export function generateAddExtensionCommand(
  modeler: Modeler,
  element: BpmnElement,
  businessObject: BpmnModdleEl,
  extensionElementsToAdd: BpmnModdleEl | BpmnModdleEl[]
): CommandContext[] {
  if (!Array.isArray(extensionElementsToAdd)) {
    extensionElementsToAdd = [extensionElementsToAdd]
  }

  return [
    {
      cmd: 'element.updateModdleProperties',
      context: () => {
        let extensionElements = businessObject.get('extensionElements')

        if (extensionElements) {
          for (const extensionElementToAdd of extensionElementsToAdd) {
            extensionElementToAdd.$parent = extensionElements
          }
          return {
            element,
            moddleElement: extensionElements,
            properties: {
              values: [...extensionElements.get('values'), ...extensionElementsToAdd]
            }
          }
        }

        extensionElements = createElement(
          modeler,
          'bpmn:ExtensionElements',
          { values: extensionElementsToAdd },
          businessObject
        )
        for (const extensionElementToAdd of extensionElementsToAdd) {
          extensionElementToAdd.$parent = extensionElements
        }

        return {
          element,
          moddleElement: businessObject,
          properties: { extensionElements }
        }
      }
    }
  ]
}

export function addExtensionElements(
  modeler: Modeler,
  element: BpmnElement,
  businessObject: BpmnModdleEl,
  extensionElementsToAdd: BpmnModdleEl | BpmnModdleEl[]
) {
  const commands: CommandContext[] = generateAddExtensionCommand(
    modeler,
    element,
    businessObject,
    extensionElementsToAdd
  )

  execPanelMultiCommands(modeler, commands)
}

/**
 * Remove one or more extension elements. Remove bpmn:ExtensionElements afterwards if it's empty.
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

  execPanelCommands(modeler, {
    element,
    moddleElement: extensionElements,
    properties: { values }
  })
}
