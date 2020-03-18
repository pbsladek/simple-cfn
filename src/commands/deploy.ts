import {CloudFormationClient, CreateStackCommand, DescribeStacksCommand, UpdateStackCommand} from '@aws-sdk/client-cloudformation-node'
import {Command, flags} from '@oclif/command'
import {readFileSync} from 'fs'

import * as util from '../lib/util'

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
    // const capability = flags.capability || ''

    const fileData = readFileSync(template, 'utf8')
    const params = util.readParametersFile(file)

    // Split all this out more.
    const describeStackInput = {
      StackName: stack,
    }

    let found = true
    const describeCommand = new DescribeStacksCommand(describeStackInput)
    try {
      await client.send(describeCommand)
    } catch (error) {
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
        this.error(results)
      } catch (error) {
        this.error(error)
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
        this.error(results)
      } catch (error) {
        this.error(error)
      }
    }
  }
}
