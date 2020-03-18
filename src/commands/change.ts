import {Command, flags} from '@oclif/command'
import {
  CloudFormationClient,
  CreateChangeSetCommand,
} from '@aws-sdk/client-cloudformation-node'
import {readFileSync} from 'fs'
import {createHash, randomBytes} from 'crypto'
import * as util from '../lib/util'

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
    // const capability = flags.capability || ''

    const fileData = readFileSync(template, 'utf8')
    const params = util.readParametersFile(file)

    // A change set name can contain only alphanumeric, case sensitive characters and hyphens.
    // It must start with an alphabetic character and cannot exceed 128 characters.
    const buf = randomBytes(20)
    const changeSetName = 'csn-' + createHash('sha1')
    .update(buf)
    .digest('hex')

    this.log(`Generated change set name: ${changeSetName}`)

    const createChangeSetInput = {
      StackName: stack,
      TemplateBody: fileData,
      Parameters: params,
      ChangeSetName: changeSetName,
    }

    const createChangeSet = new CreateChangeSetCommand(createChangeSetInput)
    try {
      await client.send(createChangeSet)
    } catch (error) {
      this.error(error)
    }

    this.log(results)
  }
}
