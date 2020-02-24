import {Command, flags} from '@oclif/command'

export default class Search extends Command {
  static description = 'Search stacks and outputs'

  static examples = [
    '$ simple-cfn deploy {stack name} [--query=\'dev\']',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    query: flags.string({char: 'q', description: 'search query'}),
  }

  static args = [
    {name: 'stack', required: true, description: 'stack name'},
  ]

  async run() {
    const {args, flags} = this.parse(Search)

    const query = flags.query || ''
    const stack = args.stack || ''

    console.log(query)
    console.log(stack)
  }
}
