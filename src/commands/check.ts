import {Command, flags} from '@oclif/command'
import {
  CloudFormationClient,
  ValidateTemplateCommand,
} from '@aws-sdk/client-cloudformation-node'
import {readFileSync} from 'fs'
import {spawnSync} from 'child_process'

// TODO Handle remote S3 files
// function isUriTemplate(template: string) {
//   const httpsUri = /https:\/\/s3.+amazonaws.com/
//   return httpsUri.test(template)
// }

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
      console.log(result.stdout.toString())
    }

    const input = {
      TemplateBody: fileData,
    }

    const client = new CloudFormationClient({})
    const command = new ValidateTemplateCommand(input)
    try {
      await client.send(command)
    } catch (err) {
      console.error(err.message)
    }
  }
}
