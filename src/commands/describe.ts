import {CloudFormationClient, DescribeStacksCommand} from '@aws-sdk/client-cloudformation-node'
import {Command, flags} from '@oclif/command'

export default class Output extends Command {
  static description = 'Describe stacks'

  static examples = [
    '$ simple-cfn describe {stack name}',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    query: flags.string({char: 'q', description: 'search query'}),
  }

  static args = [
    {name: 'stack', required: true, description: 'stack name'},
  ]

  async run() {
    const {args} = this.parse(Output)
    const client = new CloudFormationClient({})

    const stack = args.stack || ''

    const describeStackInput = {
      StackName: stack,
    }

    const describeCommand = new DescribeStacksCommand(describeStackInput)
    try {
      const result = await client.send(describeCommand)
      this.log(result.Stacks?.join('\n'))
    } catch (error) {
      this.log(error.message)
    }
  }
}
