# simple-cfn [![Build status](https://ci.appveyor.com/api/projects/status/n65me3x0p3wulp7n/branch/master?svg=true)](https://ci.appveyor.com/project/pbsladek/simple-cfn/branch/oclif)

simple-cfn makes the following AWS CloudFormation tasks simpler.

## Features
* Existing stacks are updated
* Generate and execute change sets
* Monitors stack progress and events
* Parameters via files (json or yaml)
* Validates templates
* Search stacks and outputs


## Install
```bash
# Global

yarn global add simple-cfn

npm install -g simple-cfn

# Local

yarn add simple-cfn --dev

npm install simple-cfn --save-dev
```

## Usage

```
  Usage
    simple-cfn deploy {stack name} {template} [--capability=CAPABILITY] [--file=/path/to/file]
    simple-cfn check {template}
    simple-cfn outputs {stack name} {field name}

  Examples
    simple-cfn deploy stack-name template.js
    simple-cfn deploy stack-name template.yml --ImageId=ami-828283 --VpcId=vpc-828283
    simple-cfn deploy stack-name template.yml --file=/home/parameters.yml
    simple-cfn check /home/parameters.yml
    simple-cfn outputs stack-name field-name
```

# License

This repo is licensed under [MIT](https://github.com/pbsladek/simple-cfn/blob/master/LICENSE)

[Local version](./LICENSE)

Original work done by [Andy Day & contributors](https://github.com/andyday)

[Original MIT license](https://github.com/Nordstrom/cfn/blob/master/LICENSE)

[Local version](./LICENSE-2)
