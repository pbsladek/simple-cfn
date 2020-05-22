import {CloudFormationClient, DescribeStacksCommand} from '@aws-sdk/client-cloudformation-node'
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
    const {args} = this.parse(Exists)
    const client = new CloudFormationClient({})
    const region = await client.config.region()

    const stack = args.stack || ''

    const describeStackInput = {
      StackName: stack,
    }

    const describeCommand = new DescribeStacksCommand(describeStackInput)
    try {
      const results = await client.send(describeCommand)
      const result = results.Stacks?.pop()

      if (result?.StackName === stack) {
        this.log(`Stack ${result?.StackName} exists in region ${region}`)
      }
    } catch (error) {
      this.log(error.message)
    }
  }
}
