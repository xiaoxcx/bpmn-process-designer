/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2023-present Camunda Services GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * source: https://github.com/bpmn-io/bpmn-js-create-append-anything/blob/main/lib/util/CreateOptionsUtil.js
 */

export type BaseCreateOption<T extends string> = {
  label: string
  actionName: T
  className: string
  target: {
    type: string
    eventDefinitionType?: string
    eventGatewayType?: string
    eventDefinitionAttrs?: unknown
    cancelActivity?: boolean
    instantiate?: boolean
    isExpanded?: boolean
    triggeredByEvent?: boolean
  }
}

export type NoneEvent =
  | 'none-start-event'
  | 'none-intermediate-throwing'
  | 'none-boundary-event'
  | 'none-end-event'
export const NONE_EVENTS: BaseCreateOption<NoneEvent>[] = [
  {
    label: 'Start event',
    actionName: 'none-start-event',
    className: 'bpmn-icon-start-event-none',
    target: {
      type: 'bpmn:StartEvent'
    }
  },
  {
    label: 'Intermediate throw event',
    actionName: 'none-intermediate-throwing',
    className: 'bpmn-icon-intermediate-event-none',
    target: {
      type: 'bpmn:IntermediateThrowEvent'
    }
  },
  {
    label: 'Boundary event',
    actionName: 'none-boundary-event',
    className: 'bpmn-icon-intermediate-event-none',
    target: {
      type: 'bpmn:BoundaryEvent'
    }
  },
  {
    label: 'End event',
    actionName: 'none-end-event',
    className: 'bpmn-icon-end-event-none',
    target: {
      type: 'bpmn:EndEvent'
    }
  }
]

export type TypedStartEvent = 'message-start' | 'timer-start' | 'conditional-start' | 'signal-start'
export const TYPED_START_EVENTS: BaseCreateOption<TypedStartEvent>[] = [
  {
    label: 'Message start event',
    actionName: 'message-start',
    className: 'bpmn-icon-start-event-message',
    target: {
      type: 'bpmn:StartEvent',
      eventDefinitionType: 'bpmn:MessageEventDefinition'
    }
  },
  {
    label: 'Timer start event',
    actionName: 'timer-start',
    className: 'bpmn-icon-start-event-timer',
    target: {
      type: 'bpmn:StartEvent',
      eventDefinitionType: 'bpmn:TimerEventDefinition'
    }
  },
  {
    label: 'Conditional start event',
    actionName: 'conditional-start',
    className: 'bpmn-icon-start-event-condition',
    target: {
      type: 'bpmn:StartEvent',
      eventDefinitionType: 'bpmn:ConditionalEventDefinition'
    }
  },
  {
    label: 'Signal start event',
    actionName: 'signal-start',
    className: 'bpmn-icon-start-event-signal',
    target: {
      type: 'bpmn:StartEvent',
      eventDefinitionType: 'bpmn:SignalEventDefinition'
    }
  }
]

export type TypedIntermediateEvent =
  | 'message-intermediate-catch'
  | 'message-intermediate-throw'
  | 'timer-intermediate-catch'
  | 'escalation-intermediate-throw'
  | 'conditional-intermediate-catch'
  | 'link-intermediate-catch'
  | 'link-intermediate-throw'
  | 'compensation-intermediate-throw'
  | 'signal-intermediate-catch'
  | 'signal-intermediate-throw'
export const TYPED_INTERMEDIATE_EVENT: BaseCreateOption<TypedIntermediateEvent>[] = [
  {
    label: 'Message intermediate catch event',
    actionName: 'message-intermediate-catch',
    className: 'bpmn-icon-intermediate-event-catch-message',
    target: {
      type: 'bpmn:IntermediateCatchEvent',
      eventDefinitionType: 'bpmn:MessageEventDefinition'
    }
  },
  {
    label: 'Message intermediate throw event',
    actionName: 'message-intermediate-throw',
    className: 'bpmn-icon-intermediate-event-throw-message',
    target: {
      type: 'bpmn:IntermediateThrowEvent',
      eventDefinitionType: 'bpmn:MessageEventDefinition'
    }
  },
  {
    label: 'Timer intermediate catch event',
    actionName: 'timer-intermediate-catch',
    className: 'bpmn-icon-intermediate-event-catch-timer',
    target: {
      type: 'bpmn:IntermediateCatchEvent',
      eventDefinitionType: 'bpmn:TimerEventDefinition'
    }
  },
  {
    label: 'Escalation intermediate throw event',
    actionName: 'escalation-intermediate-throw',
    className: 'bpmn-icon-intermediate-event-throw-escalation',
    target: {
      type: 'bpmn:IntermediateThrowEvent',
      eventDefinitionType: 'bpmn:EscalationEventDefinition'
    }
  },
  {
    label: 'Conditional intermediate catch event',
    actionName: 'conditional-intermediate-catch',
    className: 'bpmn-icon-intermediate-event-catch-condition',
    target: {
      type: 'bpmn:IntermediateCatchEvent',
      eventDefinitionType: 'bpmn:ConditionalEventDefinition'
    }
  },
  {
    label: 'Link intermediate catch event',
    actionName: 'link-intermediate-catch',
    className: 'bpmn-icon-intermediate-event-catch-link',
    target: {
      type: 'bpmn:IntermediateCatchEvent',
      eventDefinitionType: 'bpmn:LinkEventDefinition',
      eventDefinitionAttrs: {
        name: ''
      }
    }
  },
  {
    label: 'Link intermediate throw event',
    actionName: 'link-intermediate-throw',
    className: 'bpmn-icon-intermediate-event-throw-link',
    target: {
      type: 'bpmn:IntermediateThrowEvent',
      eventDefinitionType: 'bpmn:LinkEventDefinition',
      eventDefinitionAttrs: {
        name: ''
      }
    }
  },
  {
    label: 'Compensation intermediate throw event',
    actionName: 'compensation-intermediate-throw',
    className: 'bpmn-icon-intermediate-event-throw-compensation',
    target: {
      type: 'bpmn:IntermediateThrowEvent',
      eventDefinitionType: 'bpmn:CompensateEventDefinition'
    }
  },
  {
    label: 'Signal intermediate catch event',
    actionName: 'signal-intermediate-catch',
    className: 'bpmn-icon-intermediate-event-catch-signal',
    target: {
      type: 'bpmn:IntermediateCatchEvent',
      eventDefinitionType: 'bpmn:SignalEventDefinition'
    }
  },
  {
    label: 'Signal intermediate throw event',
    actionName: 'signal-intermediate-throw',
    className: 'bpmn-icon-intermediate-event-throw-signal',
    target: {
      type: 'bpmn:IntermediateThrowEvent',
      eventDefinitionType: 'bpmn:SignalEventDefinition'
    }
  }
]

export type TypedBoundaryEvent =
  | 'message-boundary'
  | 'timer-boundary'
  | 'escalation-boundary'
  | 'conditional-boundary'
  | 'error-boundary'
  | 'cancel-boundary'
  | 'signal-boundary'
  | 'compensation-boundary'
  | 'non-interrupting-message-boundary'
  | 'non-interrupting-timer-boundary'
  | 'non-interrupting-escalation-boundary'
  | 'non-interrupting-conditional-boundary'
  | 'non-interrupting-signal-boundary'
export const TYPED_BOUNDARY_EVENT: BaseCreateOption<TypedBoundaryEvent>[] = [
  {
    label: 'Message boundary event',
    actionName: 'message-boundary',
    className: 'bpmn-icon-intermediate-event-catch-message',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:MessageEventDefinition'
    }
  },
  {
    label: 'Timer boundary event',
    actionName: 'timer-boundary',
    className: 'bpmn-icon-intermediate-event-catch-timer',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:TimerEventDefinition'
    }
  },
  {
    label: 'Escalation boundary event',
    actionName: 'escalation-boundary',
    className: 'bpmn-icon-intermediate-event-catch-escalation',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:EscalationEventDefinition'
    }
  },
  {
    label: 'Conditional boundary event',
    actionName: 'conditional-boundary',
    className: 'bpmn-icon-intermediate-event-catch-condition',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:ConditionalEventDefinition'
    }
  },
  {
    label: 'Error boundary event',
    actionName: 'error-boundary',
    className: 'bpmn-icon-intermediate-event-catch-error',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:ErrorEventDefinition'
    }
  },
  {
    label: 'Cancel boundary event',
    actionName: 'cancel-boundary',
    className: 'bpmn-icon-intermediate-event-catch-cancel',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:CancelEventDefinition'
    }
  },
  {
    label: 'Signal boundary event',
    actionName: 'signal-boundary',
    className: 'bpmn-icon-intermediate-event-catch-signal',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:SignalEventDefinition'
    }
  },
  {
    label: 'Compensation boundary event',
    actionName: 'compensation-boundary',
    className: 'bpmn-icon-intermediate-event-catch-compensation',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:CompensateEventDefinition'
    }
  },
  {
    label: 'Message boundary event (non-interrupting)',
    actionName: 'non-interrupting-message-boundary',
    className: 'bpmn-icon-intermediate-event-catch-non-interrupting-message',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:MessageEventDefinition',
      cancelActivity: false
    }
  },
  {
    label: 'Timer boundary event (non-interrupting)',
    actionName: 'non-interrupting-timer-boundary',
    className: 'bpmn-icon-intermediate-event-catch-non-interrupting-timer',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:TimerEventDefinition',
      cancelActivity: false
    }
  },
  {
    label: 'Escalation boundary event (non-interrupting)',
    actionName: 'non-interrupting-escalation-boundary',
    className: 'bpmn-icon-intermediate-event-catch-non-interrupting-escalation',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:EscalationEventDefinition',
      cancelActivity: false
    }
  },
  {
    label: 'Conditional boundary event (non-interrupting)',
    actionName: 'non-interrupting-conditional-boundary',
    className: 'bpmn-icon-intermediate-event-catch-non-interrupting-condition',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:ConditionalEventDefinition',
      cancelActivity: false
    }
  },
  {
    label: 'Signal boundary event (non-interrupting)',
    actionName: 'non-interrupting-signal-boundary',
    className: 'bpmn-icon-intermediate-event-catch-non-interrupting-signal',
    target: {
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:SignalEventDefinition',
      cancelActivity: false
    }
  }
]

export type TypedEndEvent =
  | 'message-end'
  | 'escalation-end'
  | 'error-end'
  | 'cancel-end'
  | 'compensation-end'
  | 'signal-end'
  | 'terminate-end'
export const TYPED_END_EVENT: BaseCreateOption<TypedEndEvent>[] = [
  {
    label: 'Message end event',
    actionName: 'message-end',
    className: 'bpmn-icon-end-event-message',
    target: {
      type: 'bpmn:EndEvent',
      eventDefinitionType: 'bpmn:MessageEventDefinition'
    }
  },
  {
    label: 'Escalation end event',
    actionName: 'escalation-end',
    className: 'bpmn-icon-end-event-escalation',
    target: {
      type: 'bpmn:EndEvent',
      eventDefinitionType: 'bpmn:EscalationEventDefinition'
    }
  },
  {
    label: 'Error end event',
    actionName: 'error-end',
    className: 'bpmn-icon-end-event-error',
    target: {
      type: 'bpmn:EndEvent',
      eventDefinitionType: 'bpmn:ErrorEventDefinition'
    }
  },
  {
    label: 'Cancel end event',
    actionName: 'cancel-end',
    className: 'bpmn-icon-end-event-cancel',
    target: {
      type: 'bpmn:EndEvent',
      eventDefinitionType: 'bpmn:CancelEventDefinition'
    }
  },
  {
    label: 'Compensation end event',
    actionName: 'compensation-end',
    className: 'bpmn-icon-end-event-compensation',
    target: {
      type: 'bpmn:EndEvent',
      eventDefinitionType: 'bpmn:CompensateEventDefinition'
    }
  },
  {
    label: 'Signal end event',
    actionName: 'signal-end',
    className: 'bpmn-icon-end-event-signal',
    target: {
      type: 'bpmn:EndEvent',
      eventDefinitionType: 'bpmn:SignalEventDefinition'
    }
  },
  {
    label: 'Terminate end event',
    actionName: 'terminate-end',
    className: 'bpmn-icon-end-event-terminate',
    target: {
      type: 'bpmn:EndEvent',
      eventDefinitionType: 'bpmn:TerminateEventDefinition'
    }
  }
]

export type Gateway =
  | 'exclusive-gateway'
  | 'parallel-gateway'
  | 'inclusive-gateway'
  | 'complex-gateway'
  | 'event-based-gateway'
export const GATEWAY: BaseCreateOption<Gateway>[] = [
  {
    label: 'Exclusive gateway',
    actionName: 'exclusive-gateway',
    className: 'bpmn-icon-gateway-xor',
    target: {
      type: 'bpmn:ExclusiveGateway'
    }
  },
  {
    label: 'Parallel gateway',
    actionName: 'parallel-gateway',
    className: 'bpmn-icon-gateway-parallel',
    target: {
      type: 'bpmn:ParallelGateway'
    }
  },
  {
    label: 'Inclusive gateway',
    actionName: 'inclusive-gateway',
    className: 'bpmn-icon-gateway-or',
    target: {
      type: 'bpmn:InclusiveGateway'
    }
  },
  {
    label: 'Complex gateway',
    actionName: 'complex-gateway',
    className: 'bpmn-icon-gateway-complex',
    target: {
      type: 'bpmn:ComplexGateway'
    }
  },
  {
    label: 'Event-based gateway',
    actionName: 'event-based-gateway',
    className: 'bpmn-icon-gateway-eventbased',
    target: {
      type: 'bpmn:EventBasedGateway',
      instantiate: false,
      eventGatewayType: 'Exclusive'
    }
  }
]

export type SubProcess =
  | 'call-activity'
  | 'transaction'
  | 'event-subprocess'
  | 'collapsed-subprocess'
  | 'expanded-subprocess'
export const SUBPROCESS: BaseCreateOption<SubProcess>[] = [
  {
    label: 'Call activity',
    actionName: 'call-activity',
    className: 'bpmn-icon-call-activity',
    target: {
      type: 'bpmn:CallActivity'
    }
  },
  {
    label: 'Transaction',
    actionName: 'transaction',
    className: 'bpmn-icon-transaction',
    target: {
      type: 'bpmn:Transaction',
      isExpanded: true
    }
  },
  {
    label: 'Event sub-process',
    actionName: 'event-subprocess',
    className: 'bpmn-icon-event-subprocess-expanded',
    target: {
      type: 'bpmn:SubProcess',
      triggeredByEvent: true,
      isExpanded: true
    }
  },
  {
    label: 'Sub-process (collapsed)',
    actionName: 'collapsed-subprocess',
    className: 'bpmn-icon-subprocess-collapsed',
    target: {
      type: 'bpmn:SubProcess',
      isExpanded: false
    }
  },
  {
    label: 'Sub-process (expanded)',
    actionName: 'expanded-subprocess',
    className: 'bpmn-icon-subprocess-collapsed',
    target: {
      type: 'bpmn:SubProcess',
      isExpanded: true
    }
  }
]

export type Task =
  | 'task'
  | 'user-task'
  | 'service-task'
  | 'send-task'
  | 'receive-task'
  | 'manual-task'
  | 'rule-task'
  | 'script-task'
export const TASK: BaseCreateOption<Task>[] = [
  {
    label: 'Task',
    actionName: 'task',
    className: 'bpmn-icon-task',
    target: {
      type: 'bpmn:Task'
    }
  },
  {
    label: 'User task',
    actionName: 'user-task',
    className: 'bpmn-icon-user',
    target: {
      type: 'bpmn:UserTask'
    }
  },
  {
    label: 'Service task',
    actionName: 'service-task',
    className: 'bpmn-icon-service',
    target: {
      type: 'bpmn:ServiceTask'
    }
  },
  {
    label: 'Send task',
    actionName: 'send-task',
    className: 'bpmn-icon-send',
    target: {
      type: 'bpmn:SendTask'
    }
  },
  {
    label: 'Receive task',
    actionName: 'receive-task',
    className: 'bpmn-icon-receive',
    target: {
      type: 'bpmn:ReceiveTask'
    }
  },
  {
    label: 'Manual task',
    actionName: 'manual-task',
    className: 'bpmn-icon-manual',
    target: {
      type: 'bpmn:ManualTask'
    }
  },
  {
    label: 'Business rule task',
    actionName: 'rule-task',
    className: 'bpmn-icon-business-rule',
    target: {
      type: 'bpmn:BusinessRuleTask'
    }
  },
  {
    label: 'Script task',
    actionName: 'script-task',
    className: 'bpmn-icon-script',
    target: {
      type: 'bpmn:ScriptTask'
    }
  }
]

export type DataObject = 'data-store-reference' | 'data-object-reference'
export const DATA_OBJECTS: BaseCreateOption<DataObject>[] = [
  {
    label: 'Data store reference',
    actionName: 'data-store-reference',
    className: 'bpmn-icon-data-store',
    target: {
      type: 'bpmn:DataStoreReference'
    }
  },
  {
    label: 'Data object reference',
    actionName: 'data-object-reference',
    className: 'bpmn-icon-data-object',
    target: {
      type: 'bpmn:DataObjectReference'
    }
  }
]

export type Participant = 'expanded-pool' | 'collapsed-pool'
export const PARTICIPANT: BaseCreateOption<Participant>[] = [
  {
    label: 'Expanded pool/participant',
    actionName: 'expanded-pool',
    className: 'bpmn-icon-participant',
    target: {
      type: 'bpmn:Participant',
      isExpanded: true
    }
  },
  {
    label: 'Empty pool/participant',
    actionName: 'collapsed-pool',
    className: 'bpmn-icon-lane',
    target: {
      type: 'bpmn:Participant',
      isExpanded: false
    }
  }
]

export type CreateOptionType =
  | NoneEvent
  | TypedStartEvent
  | TypedIntermediateEvent
  | TypedBoundaryEvent
  | TypedEndEvent
  | Gateway
  | SubProcess
  | Task
  | DataObject
  | Participant
export const CREATE_OPTIONS: BaseCreateOption<CreateOptionType>[] = [
  ...GATEWAY,
  ...TASK,
  ...SUBPROCESS,
  ...NONE_EVENTS,
  ...TYPED_START_EVENTS,
  ...TYPED_INTERMEDIATE_EVENT,
  ...TYPED_END_EVENT,
  ...TYPED_BOUNDARY_EVENT,
  ...DATA_OBJECTS,
  ...PARTICIPANT
]

export const ALL_CREATE_ACTION_NAMES = CREATE_OPTIONS.map((op) => op.actionName)
