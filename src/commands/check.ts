import {CloudFormationClient, ValidateTemplateCommand} from '@aws-sdk/client-cloudformation-node'
import {Command, flags} from '@oclif/command'
import {spawnSync} from 'child_process'
import {readFileSync} from 'fs'

export default class Check extends Command {
  static description = 'Run validation on templates'

  static examples = [
    '$ simple-cfn check {template}',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    lint: flags.boolean({char: 'l', default: false}),
  }

  static args = [
    {name: 'template', required: true, description: 'template path'},
  ]

  async run() {
    const {args, flags} = this.parse(Check)

    const template = args.template || ''
    const cfnLint = flags.lint || ''

    // TODO Handle remote S3 files
    // const uri = isUriTemplate(template)

    const fileData = readFileSync(template, 'utf8')

    if (cfnLint) {
      const result = spawnSync('cfn-lint', [template])
      this.log(result.stdout.toString())
    }

    const input = {
      TemplateBody: fileData,
    }

    const client = new CloudFormationClient({})
    const command = new ValidateTemplateCommand(input)
    try {
      await client.send(command)
    } catch (error) {
      this.error(err.message)
    }
  }
}
