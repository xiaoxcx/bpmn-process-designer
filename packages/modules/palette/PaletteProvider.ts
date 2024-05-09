import type Palette from 'diagram-js/lib/features/palette/Palette'
import type Create from 'diagram-js/lib/features/create/Create'
import type ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory'
import type SpaceTool from 'diagram-js/lib/features/space-tool/SpaceTool'
import type LassoTool from 'diagram-js/lib/features/lasso-tool/LassoTool'
import type HandTool from 'diagram-js/lib/features/hand-tool/HandTool'
import type GlobalConnect from 'diagram-js/lib/features/global-connect/GlobalConnect'
import Translate from 'diagram-js/lib/i18n/translate/translate'

import { CREATE_OPTIONS, type BaseCreateOption } from './CreateOptionsUtil'
import { TOOLS_OPTIONS, type BaseToolOption, type ToolModuleName } from './EdtionToolOptionsUtil'

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
  tools?: ToolModuleName[]
  elements?: Array<BaseCreateOption['actionName'] | 'separator'>
  customElements?: BaseCreateOption[]
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

    palette.registerProvider(this)
  }

  getPaletteEntries() {
    const entries = {}
    const { tools = [], elements = [], customElements = [] } = this._config

    TOOLS_OPTIONS.forEach((option) => {
      const { actionName, className, label, methodName, moduleName } = option

      const targetAction = this._createToolAction(moduleName, methodName)

      entries[`${actionName}-tool`] = {
        label: label && this._translate(label),
        className,
        group: 'tools',
        action: {
          click: targetAction
        }
      }
    })

    CREATE_OPTIONS.forEach((option) => {
      const { actionName, className, label, target, group } = option

      const targetAction = this._createEntryAction(target)

      entries[`${actionName}-create`] = {
        label: label && this._translate(label),
        className,
        group: group.id,
        action: {
          click: targetAction,
          dragstart: targetAction
        }
      }
    })

    return entries
  }

  _createEntryAction(target: BaseCreateOption['target']) {
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

  _getToolModule(toolName: ToolModuleName) {
    return this[`_${toolName}`]
  }

  _createToolAction(
    moduleName: BaseToolOption['moduleName'],
    methodName: BaseToolOption['methodName']
  ) {
    const module = this._getToolModule(moduleName)
    return (event: MouseEvent) => {
      module[methodName](event)
    }
  }
}

PaletteProvider.$inject = [...injects]

export default PaletteProvider
