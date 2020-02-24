import {Command, flags} from '@oclif/command'

export default class Exists extends Command {
  static description = 'Check if a stack exists'

  static examples = [
    '$ simple-cfn deploy {stack name}',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [
    {name: 'stack', required: true, description: 'stack name'},
  ]

  async run() {
    const {args, flags} = this.parse(Exists)

    const stack = args.stack || ''

    console.log(stack)
  }
}
