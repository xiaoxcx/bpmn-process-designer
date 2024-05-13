import type { ModuleDeclaration } from 'bpmn-js/lib/BaseViewer'

import GridModule from 'diagram-js-grid-bg'

import CustomCmd from './cmd'
import CustomRules from './rules'
import Translate from './translate'
import BpmnLintModule from './lint'
import PaletteModule from './palette'

const allModules = [CustomCmd, CustomRules, Translate, GridModule, BpmnLintModule, PaletteModule]

const allModulesMap = {
  multiCommands: CustomCmd,
  rules: CustomRules,
  translate: Translate,
  gridBackground: GridModule,
  bpmnLint: BpmnLintModule,
  palette: PaletteModule
} as const

export type ModuleName = keyof typeof allModulesMap

export { lintConfig } from './lint'

export const getAdditionalModules = (moduleNames?: ModuleName[]) => {
  if (!moduleNames?.length) return allModulesMap
  const modules: ModuleDeclaration[] = []
  for (const moduleName of moduleNames) {
    allModulesMap[moduleName] && modules.push(allModulesMap[moduleName])
  }
  return modules
}

export default allModules
