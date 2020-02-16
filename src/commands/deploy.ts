import { Command, flags } from '@oclif/command'

export default class Deploy extends Command {
    static description = 'deploy cf something'

    static examples = [
        `$ simple-cfn deploy stuff and things`,
    ]

    static flags = {
        help: flags.help({ char: 'h' }),
        // flag with a value (-n, --name=VALUE)
        name: flags.string({ char: 'n', description: 'name to print' }),
        // flag with no value (-f, --force)
        force: flags.boolean({ char: 'f' }),
    }

    static args = [{ name: 'file' }]

    async run() {
        const { args, flags } = this.parse(Deploy)

        const name = flags.name || 'world'
        this.log(`hello ${name} from ./src/commands/deploy.ts`)
        if (args.file && flags.force) {
            this.log(`you input --force and --file: ${args.file}`)
        }
    }
}
