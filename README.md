# simple-cfn [![Build Status](https://travis-ci.com/pbsladek/simple-cfn.svg?branch=master)](https://travis-ci.com/pbsladek/simple-cfn) [![Coverage Status](https://coveralls.io/repos/github/pbsladek/simple-cfn/badge.svg?branch=master)](https://coveralls.io/github/pbsladek/simple-cfn?branch=master) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

simple-cfn makes the following AWS CloudFormation tasks simpler.
##### Create / Update Stack
* If the stack already exists, it Updates; otherwise, it Creates.
* Monitors stack progress, logging events.
* Can read parameters from json or yaml files.
* Returns a Promise.  Resolves when stack Create / Update is done, Rejects if there is an error.

##### Validate Templates
* Checks if a template is valid
* Returns a Promise.  Resolves when template is valid, Rejects if there is an error.

## Install Options
```bash
# Global

yarn global add simple-cfn

npm install -g simple-cfn

# Local

yarn add simple-cfn --dev

npm install simple-cfn --save-dev
```

## CLI Usage

```
  Usage
    simple-cfn deploy {stack name} {template} [--{param key}={param value}...]
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