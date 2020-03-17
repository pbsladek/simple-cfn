import {Command, flags} from '@oclif/command'
import {
  CloudFormationClient,
  UpdateStackCommand,
  UpdateStackInput,
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

    // Create stack
    const input = {
      StackName: stack,
      TemplateBody: fileData,
      Parameters: params,
    }

    const client = new CloudFormationClient({region: 'us-west-2'})
    const command = new CreateStackCommand(input)
    try {
      const results = await client.send(command)
      console.error(results)
    } catch (err) {
      console.error(err)
    }

    // Update stack
    const input = {
      StackName: stack,
      TemplateBody: fileData,
      Parameters: params,
    }

    const client = new CloudFormationClient({region: 'us-west-2'})
    const command = new UpdateStackCommand(input)
    try {
      const results = await client.send(command)
      console.error(results)
    } catch (err) {
      console.error(err)
    }
  }
}
