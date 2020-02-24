import {Command, flags} from '@oclif/command'

export default class Change extends Command {
  static description = 'Create and deploy change sets'

  static examples = [
    '$ simple-cfn change {stack name} {template} [--file=/path/to/file]',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    file: flags.string({char: 'f', description: 'path to parameter file'}),
    capability: flags.string({char: 'c', description: 'capability'}),
  }

  static args = [
    {name: 'stack', required: true, description: 'stack name'},
    {name: 'template', required: true, description: 'template path'},
  ]

  async run() {
    const {args, flags} = this.parse(Change)

    const stack = args.stack || ''
    const template = args.template || ''
    const file = flags.file || ''
    const capability = flags.capability || ''

    console.log(file)
    console.log(stack)
    console.log(template)
    console.log(capability)
  }
}
