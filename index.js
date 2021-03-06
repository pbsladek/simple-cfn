/**
 * Cloud Formation Module.  Handles stack creation, deletion, and updating.  Adds
 * periodic polling to check stack status.  So that stack operations are
 * synchronous.
 */
const _ = require('lodash')
const chalk = require('chalk')
const YAML = require('yamljs')
const AWS = require('aws-sdk')
const moment = require('moment')
const filesystem = require('fs')
const Promise = require('bluebird')
const get = require('lodash/fp/get')
const merge = require('lodash/merge')
const flow = require('lodash/fp/flow')
const keyBy = require('lodash/fp/keyBy')
const sprintf = require('sprintf-js').sprintf
const mapValues = require('lodash/fp/mapValues')
const HttpsProxyAgent = require('https-proxy-agent')

const fs = Promise.promisifyAll(filesystem)

AWS.config.setPromisesDependency(Promise)

const PROXY = process.env.PROXY || process.env.https_proxy || process.env.http_proxy

const success = [
  'CREATE_COMPLETE',
  'DELETE_COMPLETE',
  'UPDATE_COMPLETE'
]

const failed = [
  'ROLLBACK_FAILED',
  'ROLLBACK_IN_PROGRESS',
  'ROLLBACK_COMPLETE',
  'UPDATE_ROLLBACK_IN_PROGRESS',
  'UPDATE_ROLLBACK_COMPLETE',
  'UPDATE_FAILED',
  'DELETE_FAILED'
]

const exists = [
  'CREATE_COMPLETE',
  'UPDATE_COMPLETE',
  'ROLLBACK_COMPLETE',
  'UPDATE_ROLLBACK_COMPLETE'
]

const colorMap = {
  CREATE_IN_PROGRESS: 'gray',
  CREATE_COMPLETE: 'green',
  CREATE_FAILED: 'red',
  DELETE_IN_PROGRESS: 'gray',
  DELETE_COMPLETE: 'green',
  DELETE_FAILED: 'red',
  DELETE_SKIPPED: 'gray',
  ROLLBACK_FAILED: 'red',
  ROLLBACK_IN_PROGRESS: 'yellow',
  ROLLBACK_COMPLETE: 'red',
  UPDATE_IN_PROGRESS: 'gray',
  UPDATE_COMPLETE: 'green',
  UPDATE_COMPLETE_CLEANUP_IN_PROGRESS: 'green',
  UPDATE_ROLLBACK_IN_PROGRESS: 'yellow',
  UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS: 'yellow',
  UPDATE_ROLLBACK_FAILED: 'red',
  UPDATE_ROLLBACK_COMPLETE: 'red',
  UPDATE_FAILED: 'red'
}

const ings = {
  create: 'Creating',
  delete: 'Deleting',
  update: 'Updating'
}

let _config = {
  checkStackInterval: 5000
}

function SimpleCfn(name, template) {
  const log = console.log
  const opts = _.isPlainObject(name) ? name : {}
  const awsOpts = {}
  let startedAt = Date.now()
  const params = opts.params
  const cfParams = opts.cfParams || {}
  const awsConfig = opts.awsConfig
  const capabilities = opts.capabilities || ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
  const tags = opts.tags || {}
  const async = opts.async
  const checkStackInterval = opts.checkStackInterval || _config.checkStackInterval
  const stackRoleName = opts.stackRoleName || ""

  if (PROXY) {
    awsOpts.httpOptions = {
      agent: new HttpsProxyAgent(PROXY)
    }
  }
  if (awsConfig) {
    _.merge(awsOpts, awsConfig)
  }

  // initialize cf
  const cf = new AWS.CloudFormation(awsOpts)

  name = opts.name || name
  template = opts.template || template

  function checkStack(action, name) {
    const logPrefix = name + ' ' + action.toUpperCase()
    const notExists = /ValidationError:\s+Stack\s+\[?.+]?\s+does not exist/
    const throttling = /Throttling:\s+Rate\s+exceeded/
    const displayedEvents = {}

    return new Promise(function (resolve, reject) {
      let interval = 0
      let running = false

      // on success:
      // 1. clear interval
      // 2. return resolved promise
      function _success() {
        clearInterval(interval)
        return resolve()
      }

      // on fail:
      // 1. build fail message
      // 2. clear interval
      // 3. return rejected promise with failed message
      function _failure(msg) {
        const fullMsg = logPrefix + ' Failed' + (msg ? ': ' + msg : '')
        clearInterval(interval)
        return reject(new Error(fullMsg))
      }

      function _processEvents(events) {
        events = _.sortBy(events, 'Timestamp')
        _.forEach(events, function (event) {
          displayedEvents[event.EventId] = true
          if (moment(event.Timestamp).valueOf() >= startedAt) {
            const color = colorMap[event.ResourceStatus] || 'gray'
            log(sprintf('[%s] %s %s: %s - %s  %s  %s',
              chalk.gray(moment(event.Timestamp).format('HH:mm:ss')),
              ings[action],
              chalk.cyan(name),
              event.ResourceType,
              event.LogicalResourceId,
              chalk[color](event.ResourceStatus),
              chalk[colorMap[event.ResourceStatus]](event.ResourceStatus),
              event.ResourceStatusReason || ''
            ))
          }
        })

        const lastEvent = _.last(events) || {}
        const timestamp = moment(lastEvent.Timestamp).valueOf()
        const resourceType = lastEvent.ResourceType
        const status = lastEvent.ResourceStatus
        const statusReason = lastEvent.ResourceStatusReason

        // Only fail/succeed on cloud formation stack resource
        // and ensure we are not finishing on a nested template
        if (resourceType === 'AWS::CloudFormation::Stack' && lastEvent.LogicalResourceId === name) {
          // if cf stack status indicates failure AND the failed event occurred during this update, notify of failure
          // if cf stack status indicates success, OR it failed before this current update, notify of success
          if (_.includes(failed, status) && (timestamp >= startedAt)) {
            _failure(statusReason)
          } else if (_.includes(success, status) || (_.includes(failed, status) && (timestamp < startedAt))) {
            _success()
          }
        }
        running = false
      }

      // provides all pagination
      function getAllStackEvents(stackName) {
        let next
        let allEvents = []

        function getStackEvents() {
          return cf.describeStackEvents({
            StackName: stackName,
            NextToken: next
          })
            .promise()
            .then(function (data) {
              next = (data || {}).NextToken
              allEvents = allEvents.concat(data.StackEvents)
              return next && !allRelevantEventsLoaded(data.StackEvents) ? getStackEvents() : Promise.resolve()
            })
        }
        return getStackEvents().then(function () {
          return allEvents
        })
      }

      // events are loaded sorted by timestamp desc (newest events first)
      // if we try to load all events we can easily run into throttling by aws api
      function allRelevantEventsLoaded(events) {
        return events.some(event => moment(event.Timestamp).valueOf() < startedAt)
      }

      function outputNewStackEvents() {
        const events = []

        if (running) {
          return
        }
        running = true

        return getAllStackEvents(name)
          .then(function (allEvents) {
            running = false
            _.forEach(allEvents, function (event) {
              // if event has already been seen, don't add to events to process list
              if (displayedEvents[event.EventId]) {
                return
              }
              events.push(event)
            })
            return _processEvents(events)
          }).catch(function (err) {
            // if stack does not exist, notify success
            if (err && notExists.test(err)) {
              return _success()
            }
            // if throttling has occurred, process events again
            if (err && throttling.test(err)) {
              log('AWS api calls are throttling')
              return _processEvents(events)
            }
            // otherwise, notify of failure
            if (err) {
              return _failure(err)
            }
          })
      }

      // call once and repeat in intervals
      outputNewStackEvents()
      interval = setInterval(outputNewStackEvents, checkStackInterval)
    })
  }

  function processCfStack(action, cfparms) {
    startedAt = Date.now()
    if (action === 'update') {
      return cf.updateStack(cfparms).promise()
        .catch(function (err) {
          if (!/No updates are to be performed/.test(err)) {
            throw err
          } else {
            log('No updates are to be performed.')
          }
        })
    }
    return cf.createStack(cfparms).promise()
  }

  function loadJs(path) {
    const tmpl = require(path)

    const fn = _.isFunction(tmpl) ? tmpl : function () {
      return tmpl
    }
    return Promise.resolve(JSON.stringify(fn(params)))
  }

  function normalizeParams(templateObject, params) {

    try {
      params = YAML.parse(params)
    } catch (error) {
      //console.log(error)
    }

    if (!params) return Promise.resolve([])
    if (!_.isPlainObject(params)) return Promise.resolve([])
    if (_.keys(params).length <= 0) return Promise.resolve([])

    // mutate params
    _.keys(params).forEach(k => {
      params[_.toLower(k)] = _.toString(params[k])
    })

    return cf.getTemplateSummary(templateObject).promise()
      .then(data => {
        const templateParams = data.Parameters || []
        return templateParams.map(p => {
          const k = _.toLower(p.ParameterKey)
          const v = params.hasOwnProperty(k) ? String(params[k]) : undefined
          return {
            ParameterKey: p.ParameterKey,
            ParameterValue: v !== undefined ? v : p.DefaultValue
          }
        })
      })
  }

  function convertTags() {
    if (!_.isPlainObject(tags)) return []
    return (Object.keys(tags)).map(function (key) {
      return {
        Key: key,
        Value: tags[key]
      }
    })
  }

  function isStringOfType(type, str) {
    let result = true
    try {
      type.parse(str)
    } catch (ignore) {
      // console.log(ignore)
      result = false
    }

    return result
  }

  function isJSONString(str) {
    return isStringOfType(JSON, str)
  }

  function isYAMLString(str) {
    return isStringOfType(YAML, str) && str.split(/\r\n|\r|\n/).length > 1
  }

  function isValidTemplateString(str) {
    return isJSONString(str) || isYAMLString(str)
  }

  function templateBodyObject(template) {
    return {
      TemplateBody: template
    }
  }

  function processTemplate(template) {
    // Check if template is located in S3
    if (isUriTemplate(template)) return Promise.resolve({ TemplateURL: template })

    // Check if template if a `js` file
    if (_.endsWith(template, '.js')) return loadJs(template).then(templateBodyObject)

    // Check if template is an object, assume this is JSON good to go
    if (_.isPlainObject(template)) return Promise.resolve(template).then(flow(JSON.stringify, templateBodyObject))

    // Check if template is a valid string, serialised json or yaml
    if (isValidTemplateString(template)) return Promise.resolve(templateBodyObject(template))

    // Default to loading template from file.
    return fs.readFileAsync(template, 'utf8').then(templateBodyObject)
  }

  function isUriTemplate(template) {
    const httpsUri = /https:\/\/s3.+amazonaws.com/
    return httpsUri.test(template)
  }

  function getStackRoleArnFromName(stackRoleName) {
    var sts = new AWS.STS();
    return sts.getCallerIdentity().promise().then(function (data) {
      if (stackRoleName) {
        return `arn:aws:iam::${data.Account}:role/${stackRoleName}`
      } else {
        return ""
      }
    }).catch(function (err) {
      console.log(`this one ${err}`);
      return ""
    });
  }

  function processStack(action, name, template) {
    return processTemplate(template)
      .then(templateObject => {
        return normalizeParams(templateObject, cfParams)
          .then(noramlizedParams => {
            return getStackRoleArnFromName(stackRoleName)
              .then(stackRoleArn => {

                var stackParams = {
                  StackName: name,
                  Capabilities: capabilities,
                  Parameters: noramlizedParams,
                  Tags: convertTags()
                }

                if (stackRoleArn) {
                  stackParams = merge({ RoleARN: stackRoleArn }, stackParams)
                }

                return processCfStack(action, merge(stackParams, templateObject))
              })
          })
      })
      .then(function () {
        return async ? Promise.resolve() : checkStack(action, name)
      })
  }

  this.stackExists = function (overrideName) {
    return cf.describeStacks({ StackName: overrideName || name }).promise()
      .then(function (data) {
        return _.includes(exists, data.Stacks[0].StackStatus)
      })
      .catch(function () {
        return false
      })
  }

  this.createOrUpdate = function () {
    return this.stackExists()
      .then(function (exists) {
        return processStack(exists ? 'update' : 'create', name, template)
      })
  }

  this.validate = function () {
    return processTemplate(template)
      .then(function (templateObject) {
        return cf.validateTemplate(templateObject).promise()
      })
  }

  this.outputs = function () {
    return cf.describeStacks({ StackName: name }).promise()
      .then(function (data) {
        return flow(
          get('Stacks[0].Outputs'),
          keyBy('OutputKey'),
          mapValues('OutputValue')
        )(data)
      })
  }

  this.output = function (field) {
    return this.outputs()
      .then(function (data) {
        return data[field] || ''
      })
  }
}

var simpleCfn = function (name, template) {
  return new SimpleCfn(name, template).createOrUpdate()
}

simpleCfn.stackExists = function (name) {
  return new SimpleCfn(name).stackExists()
}

simpleCfn.create = function (name, template) {
  return new SimpleCfn(name, template).create()
}

simpleCfn.validate = function (template, params) {
  return new SimpleCfn({
    template: template,
    params: params
  }).validate()
}

simpleCfn.outputs = function (name) {
  return new SimpleCfn(name).outputs()
}

simpleCfn.output = function (name, field) {
  return new SimpleCfn(name).output(field)
}

simpleCfn.configure = function (cfg) {
  _config = cfg
}

simpleCfn.class = SimpleCfn

module.exports = simpleCfn
