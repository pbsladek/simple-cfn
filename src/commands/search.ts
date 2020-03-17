import {Command, flags} from '@oclif/command'
import {
  CloudFormationClient,
  ListStacksCommand,
} from '@aws-sdk/client-cloudformation-node'

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

    const input = {}
    const client = new CloudFormationClient({region: 'us-west-2'})
    const command = new ListStacksCommand(input)
    try {
      const results = await client.send(command)
      console.error(results)
    } catch (err) {
      console.error(err)
    }
  }
}
