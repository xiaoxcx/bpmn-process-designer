import BpmnLintModule from 'bpmn-js-bpmnlint'
import Resolver from './Resolver'
import { rules } from './lint-rules'

export const lintConfig = {
  linting: {
    active: true,
    bpmnlint: {
      resolver: new Resolver(),
      config: {
        rules
      }
    }
  }
}

export default BpmnLintModule
