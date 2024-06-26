import type Modeler from 'bpmn-js/lib/Modeler'
import { createElement, getBusinessObject } from '@shared/utils/element-utils'
import { getExtensionElementsWithType } from '@shared/utils/extension-elements-utils'
import { is } from 'bpmn-js/lib/util/ModelUtil'

/**
 * 单独设置某个指定对象属性的一个属性
 * @param element
 * @param moddleElement
 * @param type
 * @param value
 */
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
/**
 * 更新指定对象属性的多个属性
 * @param element
 * @param moddleElement
 * @param properties
 */
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

/**
 * 直接设置 businessObject 的单个属性
 * @param element
 * @param type
 * @param value
 */
export const setBoProperty = (
  element: BpmnElement,
  type: string,
  value?: unknown
): CommandContext => {
  return setModdleProperty(element, getBusinessObject(element), type, value)
}
/**
 * 直接设置 businessObject 的多个属性
 * @param element
 * @param properties
 */
export const setBoProperties = (
  element: BpmnElement,
  properties: Record<string, any>
): CommandContext => {
  return setModdleProperties(element, getBusinessObject(element), properties)
}

/**
 * 添加扩展属性
 * @param modeler
 * @param element
 * @param businessObject
 * @param extensionElementsToAdd
 */
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

/**
 * 直接设置某个类型的扩展元素的 body 属性
 * @param modeler
 * @param element
 * @param type
 * @param body
 */
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

      const exItem = getExtensionElementsWithType(element.businessObject, type)?.[0]
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
