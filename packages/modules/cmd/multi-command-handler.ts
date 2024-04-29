import type CommandStack from 'diagram-js/lib/command/CommandStack'

export default class MultiCommandHandler {
  static $inject: string[]
  private readonly _commandStack: CommandStack

  constructor(commandStack: CommandStack) {
    this._commandStack = commandStack
  }

  preExecute(commands: CommandContext[] = []) {
    const commandStack = this._commandStack

    for (const command of commands) {
      if (command) {
        let context = command.context
        if (typeof context === 'function') {
          context = context()
        }
        commandStack.execute(command.cmd, context)
      }
      // commandContext && commandStack.execute(commandContext.cmd, commandContext.context)
    }
  }
}

MultiCommandHandler.$inject = ['commandStack']
