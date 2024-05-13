import { CamelCase } from '@shared/types/string'

export type ToolModuleName = 'hand' | 'lasso' | 'space' | 'global-connect'

export type BaseToolOption<T extends string> = {
  label: string
  actionName: T
  className: string
  moduleName: `${CamelCase<T>}Tool`
  methodName: string
}

export const TOOLS_OPTIONS: BaseToolOption<ToolModuleName>[] = [
  {
    label: 'Activate hand tool',
    actionName: 'hand',
    className: 'bpmn-icon-hand-tool',
    moduleName: 'handTool',
    methodName: 'activateHand'
  },
  {
    label: 'Activate lasso tool',
    actionName: 'lasso',
    className: 'bpmn-icon-lasso-tool',
    moduleName: 'lassoTool',
    methodName: 'activateSelection'
  },
  {
    label: 'Activate space tool',
    actionName: 'space',
    className: 'bpmn-icon-space-tool',
    moduleName: 'spaceTool',
    methodName: 'activateSelection'
  },
  {
    label: 'Activate global connect tool',
    actionName: 'global-connect',
    className: 'bpmn-icon-connection-multi',
    moduleName: 'globalConnectTool',
    methodName: 'start'
  }
]

export const ALL_TOOL_ACTION_NAMES = TOOLS_OPTIONS.map((op) => op.actionName)
