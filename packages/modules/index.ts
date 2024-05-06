import GridModule from 'diagram-js-grid-bg'

import CustomCmd from './cmd'
import CustomRules from './rules'
import Translate from './translate'
import BpmnLintModule from './lint'

const modules = [CustomCmd, CustomRules, Translate, GridModule, BpmnLintModule]

export { lintConfig } from './lint'

export default modules
