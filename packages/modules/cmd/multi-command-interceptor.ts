import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor'
import EventBus from 'diagram-js/lib/core/EventBus'

class MultiCommandInterceptor extends CommandInterceptor {
  constructor(eventBus: EventBus) {
    super(eventBus)

    this.preExecute(['panel.multi-command'], function (event) {
      // console.log('Command panel.multi-command preExecute, context obj is: ', event)
    })

    this.preExecuted(['panel.multi-command'], function (event) {
      // console.log('Command panel.multi-command preExecuted, context obj is: ', event)
    })

    this.execute(['panel.multi-command'], function (event) {
      // console.log('Command panel.multi-command execute, context obj is: ', event)
    })

    this.executed(['panel.multi-command'], function (event) {
      // console.log('Command panel.multi-command executed, context obj is: ', event)
    })

    this.postExecute(['panel.multi-command'], function (event) {
      // console.log('Command panel.multi-command postExecute, context obj is: ', event)
    })

    this.postExecuted(['panel.multi-command'], function (event) {
      // console.log('Command panel.multi-command postExecuted, context obj is: ', event)
    })
  }
}

MultiCommandInterceptor.$inject = ['eventBus']

export default MultiCommandInterceptor
