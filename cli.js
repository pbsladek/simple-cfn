#!/usr/bin/env node
'use strict'

const os = require('os')
const _ = require('lodash')
const meow = require('meow')
const chalk = require('chalk')
const simpleCfn = require('./')
const fs = require('fs')
const Promise = require('bluebird')

Promise.longStackTraces()

const cli = meow(`
  Usage
    simple-cfn deploy {stack name} {template} [--capability=CAPABILITY] [--{param key}={param value}...]
    simple-cfn deploy {stack name} {template} [--capability=CAPABILITY] [--file=/path/to/file]
    simple-cfn delete {stack name}
    simple-cfn outputs {stack name}
    simple-cfn output {stack name} {field name}

  Examples
    simple-cfn deploy my-stack template.js
    simple-cfn deploy your_stack template.yml --ImageId=ami-828283 --VpcId=vpc-828283 --capability=CAPABILITY_NAMED_IAM --capability=CAPABILITY_AUTO_EXPAND
    simple-cfn delete your_stack
    simple-cfn outputs my-stack
    simple-cfn output my-stack my-field
`)

const cmds = {
  deploy: {
    args: 3,
    exec: () => {
      const name = cli.input[1]
      const template = cli.input[2]

      let cfParams = _.omit(cli.flags, ['capability', 'file'])
      if (cfParams && Object.keys(cfParams).length > 0) {
        console.log(`${chalk.cyan('Cloud Formation Parameters')}${os.EOL}==========================`)
        console.log(_.toPairs(cfParams).map(a => `${a[0]}: ${a[1]}`).join(os.EOL))
        console.log(`==========================${os.EOL}`)
      }

      if (cli.flags.file) {
        const filePath = cli.flags.file
        console.log(`${chalk.cyan('Parsing Parameters from file')}${os.EOL}==========================`)
        console.log(filePath)
        console.log(`==========================${os.EOL}`)

        if (fs.existsSync(filePath)) {
          let parsedParams = fs.readFileSync(filePath, 'utf8')
          cfParams = parsedParams.toString()
        } else {
          return Promise.reject(new Error(chalk.red(`${filePath} does not exist. Please double check the path specified via --file.`)))
        }
      }

      let capabilities
      if (cli.flags.capability) {
        capabilities = Array.isArray(cli.flags.capability) ? cli.flags.capability : [cli.flags.capability]
        console.log(`${chalk.cyan('Cloud Formation Capabilities')}${os.EOL}==========================`)
        console.log(capabilities.join(os.EOL))
        console.log(`==========================${os.EOL}`)
      }

      return simpleCfn({ name, template, cfParams, capabilities })
    }
  },

  delete: {
    args: 2,
    exec: () => {
      const name = cli.input[1]
      return simpleCfn.delete(name)
    }
  },

  outputs: {
    args: 2,
    exec: () => {
      const name = cli.input[1]
      return simpleCfn.outputs(name)
        .then(JSON.stringify)
        .then(console.log)
    }
  },

  output: {
    args: 3,
    exec: () => {
      const name = cli.input[1]
      const field = cli.input[2]
      return simpleCfn.output(name, field)
        .then(console.log)
    }
  }
}

const exec = () => {
  const len = cli.input.length
  if (len < 1) {
    return Promise.reject(new Error(chalk.red('Invalid Usage')))
  }
  const cmdName = cli.input[0]
  const cmd = cmds[cmdName]
  if (!cmd || (len < cmd.args)) {
    return Promise.reject(new Error(chalk.red('Invalid Usage')))
  }

  return cmd.exec()
}

exec().catch(err => {
  console.error(chalk.red(err.message || err))
})
