import {Command, flags} from '@oclif/command'
import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation-node'
import {readFileSync} from 'fs'
import {safeLoad} from 'js-yaml'

export default class Change extends Command {
  static description = 'Create and deploy change sets'

  static examples = [
    '$ simple-cfn change {stack name} {template} [--file=/path/to/file]',
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
    const {args, flags} = this.parse(Change)
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

    const createChangeSetInput = {
      StackName: stack,
      TemplateBody: fileData,
      Parameters: params,
      ChangeSetName: 'random-name',
    }

    const createChangeSet = new CreateChangeSetCommand(createChangeSetInput)
    try {
      const results = await client.send(createChangeSet)
    } catch (err) {
      console.error(err)
    }
  }
}
