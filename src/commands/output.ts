import {CloudFormationClient, DescribeStacksCommand} from '@aws-sdk/client-cloudformation-node'
import {Command, flags} from '@oclif/command'

export default class Output extends Command {
  static description = 'Retrieve stacks outputs'

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
    const {args, flags} = this.parse(Output)
    const client = new CloudFormationClient({region: 'us-west-2'})

    const query = flags.query || ''
    const stack = args.stack || ''

    // Check if the stack exists in the current region
    // Will need to handle pagination here
    // Split all this out more.
    const describeStackInput = {
      StackName: stack,
    }

    const describeCommand = new DescribeStacksCommand(describeStackInput)
    try {
      await client.send(describeCommand)
    } catch (error) {
      this.log(error)
    }
  }
}
