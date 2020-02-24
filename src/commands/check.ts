import {Command, flags} from '@oclif/command'

export default class Check extends Command {
  static description = 'Run validation on templates'

  static examples = [
    '$ simple-cfn check {template}',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [
    {name: 'template', required: true, description: 'template path'},
  ]

  async run() {
    const {args, flags} = this.parse(Check)

    const template = args.template || ''

    console.log(template)
  }
}
