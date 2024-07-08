import type Modeler from 'bpmn-js/lib/Modeler'

import { createElement, getBusinessObject } from '@shared/utils/element-utils'
import { findExtensionElement } from '@shared/utils/extension-elements-utils'

/**
 * 单独设置某个指定对象属性的一个属性
 * @param element
 * @param moddleElement
 * @param type
 * @param value
 */
export const setModdlePropertyCommand = (
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
export const setModdlePropertiesCommand = (
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
  return setModdlePropertyCommand(element, getBusinessObject(element), type, value)
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
  return setModdlePropertiesCommand(element, getBusinessObject(element), properties)
}

/**
 * 直接设置 ModdleElement 类型元素的单个属性
 * @param element
 * @param moddleElement
 * @param type
 * @param value
 */
export const setModdleElProperty = (
  element: BpmnElement,
  moddleElement: BpmnModdleEl,
  type: string,
  value?: unknown
): CommandContext => {
  return setModdlePropertyCommand(element, moddleElement, type, value)
}
/**
 * 直接设置 ModdleElement 类型元素的多个属性
 * @param element
 * @param moddleElement
 * @param properties
 */
export const setModdleElProperties = (
  element: BpmnElement,
  moddleElement: BpmnModdleEl,
  properties: Record<string, any>
): CommandContext => {
  return setModdlePropertiesCommand(element, moddleElement, properties)
}

/**
 * 添加扩展元素对应的命令对象
 * @param modeler
 * @param element
 * @param extensionElementsToAdd
 */
export const addExtensionElCommand = (
  modeler: Modeler,
  element: BpmnElement,
  extensionElementsToAdd: BpmnModdleEl | BpmnModdleEl[]
): CommandContext => {
  if (!Array.isArray(extensionElementsToAdd)) {
    extensionElementsToAdd = [extensionElementsToAdd]
  }

  const businessObject = getBusinessObject(element)

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
 * 直接设置某个类型(type)的扩展元素的属性对应的命令对象
 * @param modeler
 * @param element
 * @param type
 * @param properties
 */
export const setExtensionItemPropsCommand = (
  modeler: Modeler,
  element: BpmnElement,
  type: string,
  properties: Record<string, unknown>
): CommandContext | undefined => {
  const businessObject = getBusinessObject(element)

  return {
    cmd: 'element.updateModdleProperties',
    context: () => {
      let extensionElements = businessObject.get('extensionElements')

      if (!extensionElements) {
        extensionElements = createElement(modeler, 'bpmn:ExtensionElements', {
          values: [createElement(modeler, type, { ...properties })]
        })
        return {
          element,
          moddleElement: businessObject,
          properties: { extensionElements }
        }
      }

      const exItem = findExtensionElement(businessObject, type)

      if (!exItem) {
        return {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [
              ...extensionElements.get('values'),
              createElement(modeler, type, { ...properties }, extensionElements)
            ]
          }
        }
      }

      return {
        element,
        moddleElement: exItem,
        properties: { ...properties }
      }
    }
  }
}
