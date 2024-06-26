import type CommandStack from 'diagram-js/lib/command/CommandStack'
import type Modeler from 'bpmn-js/lib/Modeler'

export function execMultiCommands(modeler: Modeler, commands: Array<CommandContext | undefined>) {
  try {
    const commandStack = modeler!.get<CommandStack>('commandStack')
    commandStack.execute('multi-commands', commands)
  } catch (e) {
    console.error('Properties update error.')
    console.error(e)
  }
}

export function execSingleCommand(modeler: Modeler, context: CommandContext['context']) {
  try {
    const commandStack = modeler!.get<CommandStack>('commandStack')
    commandStack.execute('element.updateModdleProperties', context)
  } catch (e) {
    console.error('Properties update error.')
    console.error(e)
  }
}
