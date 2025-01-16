import type Palette from 'diagram-js/lib/features/palette/Palette'
import type Create from 'diagram-js/lib/features/create/Create'
import type ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory'
import type SpaceTool from 'diagram-js/lib/features/space-tool/SpaceTool'
import type LassoTool from 'diagram-js/lib/features/lasso-tool/LassoTool'
import type HandTool from 'diagram-js/lib/features/hand-tool/HandTool'
import type GlobalConnect from 'diagram-js/lib/features/global-connect/GlobalConnect'
import Translate from 'diagram-js/lib/i18n/translate/translate'

import { CREATE_OPTIONS, type BaseCreateOption, type CreateOptionType } from './create-options-util'
import { TOOLS_OPTIONS, type BaseToolOption, type ToolModuleName } from './edition-tool-options-util'

const injects = [
  'config.paletteEntries',
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool',
  'handTool',
  'globalConnect',
  'translate'
] as const

export type PaletteEntriesConfig = {
  tools?: Array<ToolModuleName | 'separator'>
  elements?: Array<CreateOptionType | 'separator'>
  customElements?: Array<BaseCreateOption<string> | 'separator'>
}

class PaletteProvider {
  static $inject: string[]

  private _config: PaletteEntriesConfig
  private _palette: Palette
  private _create: Create
  private _elementFactory: ElementFactory
  private _spaceTool: SpaceTool
  private _lassoTool: LassoTool
  private _handTool: HandTool
  private _globalConnect: GlobalConnect
  private _translate: typeof Translate
  private _toolOptionsMap: {}
  private _createOptionsMap: {}

  constructor(
    config: PaletteEntriesConfig,
    palette: Palette,
    create: Create,
    elementFactory: ElementFactory,
    spaceTool: SpaceTool,
    lassoTool: LassoTool,
    handTool: HandTool,
    globalConnect: GlobalConnect,
    translate: typeof Translate
  ) {
    this._config = config || {}
    this._palette = palette
    this._create = create
    this._elementFactory = elementFactory
    this._spaceTool = spaceTool
    this._lassoTool = lassoTool
    this._handTool = handTool
    this._globalConnect = globalConnect
    this._translate = translate

    this._toolOptionsMap = TOOLS_OPTIONS.reduce((m, cur) => (m[cur.actionName] = cur) && m, {})
    this._createOptionsMap = CREATE_OPTIONS.reduce((m, cur) => (m[cur.actionName] = cur) && m, {})

    palette.registerProvider(this)
  }

  getPaletteEntries() {
    const entries = {}
    const { tools = [], elements = [], customElements = [] } = this._config
    let idx: number = 0

    if (tools.length) {
      for (const tool of tools) {
        if (this._toolOptionsMap[tool]) {
          const { actionName, className, label, methodName, moduleName } =
            this._toolOptionsMap[tool]

          const targetAction = this._createToolAction(moduleName, methodName)

          entries[`${actionName}-tool`] = {
            label: label && this._translate(label),
            className,
            group: 'tools',
            action: {
              click: targetAction
            }
          }
        }
      }
      entries['tools-separator'] = this._createSeparator('tools')
    }

    if (elements.length) {
      for (const element of elements) {
        if (element === 'separator') {
          entries[`${idx}-separator`] = this._createSeparator(idx.toString())
          idx++
          continue
        }
        if (this._createOptionsMap[element]) {
          const { actionName, className, label, target } = this._createOptionsMap[element]

          const targetAction = this._createEntryAction(target)

          entries[`${actionName}-create`] = {
            label: label && this._translate(label),
            className,
            group: idx,
            action: {
              click: targetAction,
              dragstart: targetAction
            }
          }
        }
      }
    }

    if (customElements.length) {
      for (const customElement of customElements) {
        if (customElement === 'separator') {
          entries[`${idx}-separator`] = this._createSeparator(idx.toString())
          idx++
          continue
        }

        const { actionName, className, label, target } = customElement

        const targetAction = this._createEntryAction(target)

        entries[`${actionName}-create`] = {
          label: label && this._translate(label),
          className,
          group: idx,
          action: {
            click: targetAction,
            dragstart: targetAction
          }
        }
      }
    }

    return entries
  }

  _getToolModule(toolName: ToolModuleName) {
    return this[`_${toolName}`]
  }

  _createSeparator(group: string) {
    return {
      group,
      separator: true
    }
  }

  _createEntryAction(target: BaseCreateOption<string>['target']) {
    const create = this._create
    const elementFactory = this._elementFactory

    let newElement: BpmnElement

    return (event: MouseEvent) => {
      if (target.type === 'bpmn:Participant') {
        newElement = elementFactory.createParticipantShape(target)
      } else {
        newElement = elementFactory.create('shape', target)
      }

      return create.start(event, newElement)
    }
  }

  _createToolAction(
    moduleName: ToolModuleName,
    methodName: BaseToolOption<ToolModuleName>['methodName']
  ) {
    const module = this._getToolModule(moduleName)
    return (event: MouseEvent) => {
      module[methodName](event)
    }
  }
}

PaletteProvider.$inject = [...injects]

export default PaletteProvider
