import {Command, flags} from '@oclif/command'
import {
  CloudFormationClient,
  UpdateStackCommand,
  DescribeStacksCommand,
  CreateStackCommand,
} from '@aws-sdk/client-cloudformation-node'
import {readFileSync} from 'fs'
import {safeLoad} from 'js-yaml'

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
    const client = new CloudFormationClient({region: 'us-west-2'})

    const stack = args.stack || ''
    const template = args.template || ''
    const file = flags.file || ''
    const capability = flags.capability || ''

    const fileData = readFileSync(template, 'utf8')

    let parameters
    try {
      parameters = safeLoad(readFileSync(file, 'utf8'))
    } catch (err) {
      console.log(err)
    }

    const params = []
    for (const key in parameters) {
      if (Object.prototype.hasOwnProperty.call(parameters, key)) {
        params.push({
          ParameterKey: key,
          ParameterValue: parameters[key],
        })
      }
    }

    // Check if the stack exists in the current region
    // Will need to handle pagination here
    // Split all this out more.
    const describeStackInput = {
      StackName: stack,
    }

    let found = true
    const describeCommand = new DescribeStacksCommand(describeStackInput)
    try {
      await client.send(describeCommand)
    } catch (err) {
      found = false
    }

    if (found) {
      // Update stack
      const updateInput = {
        StackName: stack,
        TemplateBody: fileData,
        Parameters: params,
      }

      const updateCommand = new UpdateStackCommand(updateInput)
      try {
        const results = await client.send(updateCommand)
        console.error(results)
      } catch (err) {
        console.error(err)
      }
    } else {
      // Create stack
      const createInput = {
        StackName: stack,
        TemplateBody: fileData,
        Parameters: params,
      }

      const createCommand = new CreateStackCommand(createInput)
      try {
        const results = await client.send(createCommand)
        console.error(results)
      } catch (err) {
        console.error(err)
      }
    }
  }
}
