import type Modeler from 'bpmn-js/lib/Modeler'
import { createElement } from '@shared/utils/element-utils'
import { getExtensionElementsList } from '@shared/utils/extension-elements-utils'

export const setModdleProperty = (
  element: BpmnElement,
  moddleElement: BpmnModdleEl,
  type: string,
  value?: unknown
): CommandContext => {
  const properties = { [type]: value }
  return {
    cmd: 'element.updateModdleProperties',
    context: { element, moddleElement, properties }
  }
}
export const setModdleProperties = (
  element: BpmnElement,
  moddleElement: BpmnModdleEl,
  properties: Record<string, any>
): CommandContext => {
  return {
    cmd: 'element.updateModdleProperties',
    context: { element, moddleElement, properties }
  }
}

export const setBoProperty = (
  element: BpmnElement,
  type: string,
  value?: unknown
): CommandContext => {
  const properties = { [type]: value }
  return {
    cmd: 'element.updateModdleProperties',
    context: { element, moddleElement: element.businessObject, properties }
  }
}
export const setBoProperties = (
  element: BpmnElement,
  type: string,
  properties: Record<string, any>
): CommandContext => {
  return {
    cmd: 'element.updateModdleProperties',
    context: {
      element,
      moddleElement: element.businessObject,
      properties
    }
  }
}

export const addExtensionElCommand = (
  modeler: Modeler,
  element: BpmnElement,
  businessObject: BpmnModdleEl,
  extensionElementsToAdd: BpmnModdleEl | BpmnModdleEl[]
): CommandContext => {
  if (!Array.isArray(extensionElementsToAdd)) {
    extensionElementsToAdd = [extensionElementsToAdd]
  }

  return {
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
}

export const setExtensionItemBodyCommand = (
  modeler: Modeler,
  element: BpmnElement,
  type: string,
  body: string = ''
): CommandContext | undefined => {
  return {
    cmd: 'element.updateModdleProperties',
    context: () => {
      let extensionElements = element.businessObject.get('extensionElements')
      if (!extensionElements) {
        extensionElements = createElement(modeler, 'bpmn:ExtensionElements', {
          values: [createElement(modeler, type, { body })]
        })
        return {
          element,
          moddleElement: element.businessObject,
          properties: { extensionElements }
        }
      }

      const exItem = getExtensionElementsList(element.businessObject, type)?.[0]
      if (!exItem) {
        return {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [
              ...extensionElements.get('values'),
              createElement(modeler, type, { body }, extensionElements)
            ]
          }
        }
      }

      return {
        element,
        moddleElement: exItem,
        properties: { body }
      }
    }
  }
}
