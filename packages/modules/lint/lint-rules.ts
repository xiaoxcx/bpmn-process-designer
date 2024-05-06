import conditionalFlows from 'bpmnlint/rules/conditional-flows'
import endEventRequired from 'bpmnlint/rules/end-event-required'
import eventSubProcessTypedStartEvent from 'bpmnlint/rules/event-sub-process-typed-start-event'
import fakeJoin from 'bpmnlint/rules/fake-join'
import labelRequired from 'bpmnlint/rules/label-required'
import noBpmnDi from 'bpmnlint/rules/no-bpmndi'
import noComplexGateway from 'bpmnlint/rules/no-complex-gateway'
import noDisconnected from 'bpmnlint/rules/no-disconnected'
import noDuplicateSequenceFlows from 'bpmnlint/rules/no-duplicate-sequence-flows'
import noGatewayJoinFake from 'bpmnlint/rules/no-gateway-join-fork'
import noImplicitSplit from 'bpmnlint/rules/no-implicit-split'
import noInclusiveGateway from 'bpmnlint/rules/no-inclusive-gateway'
import singleBlankStartEvent from 'bpmnlint/rules/single-blank-start-event'
import singleEventDefinition from 'bpmnlint/rules/single-event-definition'
import startEventRequired from 'bpmnlint/rules/start-event-required'
import subProcessBlankStartEvent from 'bpmnlint/rules/sub-process-blank-start-event'
import superfluousGateway from 'bpmnlint/rules/superfluous-gateway'

export type LintRuleName = string
export type CacheLintRuleName = `bpmnlint/${LintRuleName}`
export type LintRuleFlag = 'warn' | 'error' | 'info' | 'off'

type Reporter = {
  report(id: string, message: string, path?: string[] | Record<string, string[] | string>): void
}
export type LintRuleLinter = {
  check: (node: BpmnElement, reporter: Reporter) => undefined | void
}

export type LintRules = Record<LintRuleName, LintRuleFlag>

export const rules: LintRules = {
  'conditional-flows': 'error',
  'end-event-required': 'error',
  'event-sub-process-typed-start-event': 'error',
  'fake-join': 'warn',
  'label-required': 'off',
  'no-bpmndi': 'error',
  'no-complex-gateway': 'error',
  'no-disconnected': 'error',
  'no-duplicate-sequence-flows': 'error',
  'no-gateway-join-fork': 'error',
  'no-implicit-split': 'error',
  'no-inclusive-gateway': 'error',
  'single-blank-start-event': 'error',
  'single-event-definition': 'error',
  'start-event-required': 'error',
  'sub-process-blank-start-event': 'error',
  'superfluous-gateway': 'warn'
}

export const rulesCache: Record<CacheLintRuleName, LintRuleLinter> = {
  'bpmnlint/conditional-flows': conditionalFlows,
  'bpmnlint/end-event-required': endEventRequired,
  'bpmnlint/event-sub-process-typed-start-event': eventSubProcessTypedStartEvent,
  'bpmnlint/fake-join': fakeJoin,
  'bpmnlint/label-required': labelRequired,
  'bpmnlint/no-bpmndi': noBpmnDi,
  'bpmnlint/no-complex-gateway': noComplexGateway,
  'bpmnlint/no-disconnected': noDisconnected,
  'bpmnlint/no-duplicate-sequence-flows': noDuplicateSequenceFlows,
  'bpmnlint/no-gateway-join-fork': noGatewayJoinFake,
  'bpmnlint/no-implicit-split': noImplicitSplit,
  'bpmnlint/no-inclusive-gateway': noInclusiveGateway,
  'bpmnlint/single-blank-start-event': singleBlankStartEvent,
  'bpmnlint/single-event-definition': singleEventDefinition,
  'bpmnlint/start-event-required': startEventRequired,
  'bpmnlint/sub-process-blank-start-event': subProcessBlankStartEvent,
  'bpmnlint/superfluous-gateway': superfluousGateway
}
