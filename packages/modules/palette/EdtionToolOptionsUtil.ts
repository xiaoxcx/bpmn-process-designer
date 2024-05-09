export type ToolModuleName = 'handTool' | 'lassoTool' | 'spaceTool' | 'globalConnect'

export type BaseToolOption = {
  label: string
  actionName: string
  className: string
  moduleName: ToolModuleName
  methodName: string
}

export const TOOLS_OPTIONS: BaseToolOption[] = [
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
    moduleName: 'globalConnect',
    methodName: 'start'
  }
]
