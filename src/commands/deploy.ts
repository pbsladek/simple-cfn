import {Command, flags} from '@oclif/command'
import {
  CloudFormationClient,
  ListStacksCommand,
} from '@aws-sdk/client-cloudformation-node'

export default class Deploy extends Command {
  static description = 'Deploy and update stacks'

  static examples = [
    '$ simple-cfn deploy {stack name} {template} [--capability=CAPABILITY] [--file=/path/to/file]',
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
    const {args, flags} = this.parse(Deploy)

    const stack = args.stack || ''
    const template = args.template || ''
    const file = flags.file || ''
    const capability = flags.capability || ''

    const client = new CloudFormationClient({region: 'us-west-2'})
    const input = {}
    const command = new ListStacksCommand(input)
    try {
      const results = await client.send(command)
      console.error(results)
    } catch (err) {
      console.error(err)
    }
  }
}
