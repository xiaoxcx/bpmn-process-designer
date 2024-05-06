import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor'
import EventBus from 'diagram-js/lib/core/EventBus'

class MultiCommandInterceptor extends CommandInterceptor {
  constructor(eventBus: EventBus) {
    super(eventBus)

    this.preExecute(['multi-commands'], function (event) {
      // console.log('Command multi-commands preExecute, context obj is: ', event)
    })

    this.preExecuted(['multi-commands'], function (event) {
      // console.log('Command multi-commands preExecuted, context obj is: ', event)
    })

    this.execute(['multi-commands'], function (event) {
      // console.log('Command multi-commands execute, context obj is: ', event)
    })

    this.executed(['multi-commands'], function (event) {
      // console.log('Command multi-commands executed, context obj is: ', event)
    })

    this.postExecute(['multi-commands'], function (event) {
      // console.log('Command multi-commands postExecute, context obj is: ', event)
    })

    this.postExecuted(['multi-commands'], function (event) {
      // console.log('Command multi-commands postExecuted, context obj is: ', event)
    })
  }
}

MultiCommandInterceptor.$inject = ['eventBus']

export default MultiCommandInterceptor
