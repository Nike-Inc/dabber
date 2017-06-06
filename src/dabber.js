'use strict'

const co = require('co')
const assert = require('assert')
const AWS = require('aws-sdk')
const uuid = require('uuid')
const fuse = require('./fuse')
const promisify = require('pify')
const Zip = require('node-zip')
const fs = require('fs')

module.exports = {
  scheduleBackup,
  unscheduleBackup,
  deploy,
  removeLambda
}

var log = (...args) => console.log(...args.map(a => require('util').inspect(a, { colors: true, depth: null }))) // eslint-disable-line

const schedules = {
  business1: 'cron(0 15-23 ? * MON-FRI *)',
  business2: 'cron(0 0-2 ? * TUE-SAT *)',
  hourly: 'rate(1 hour)',
  daily: 'rate(1 day)'
}

function scheduleBackup (options) {
  let events = new AWS.CloudWatchEvents({ apiVersion: '2015-10-07', region: options.s3Region })
  let listRules = promisify(events.listRules.bind(events))
  let putRule = promisify(events.putRule.bind(events))
  let putTargets = promisify(events.putTargets.bind(events))

  return co(function * () {
    let target = yield createTarget(options)

    let rulesNeeded = getRules(options)
    let rules = yield getPages(listRules, null, 'Rules')
    for (let rule of rulesNeeded) {
      // log(rule)
      if (!rules.find(r => r.Name === rule.Name)) {
        yield putRule({
          Name: rule.Name,
          Description: `Dynamo automated backup rule`,
          ScheduleExpression: rule.schedule
        })
      }

      yield putTargets({
        Rule: rule.Name,
        Targets: [target]
      })
    }
  }).catch(error => {
    console.error(error)
  })
}

function unscheduleBackup (options) {
  // let listRuleTargets = promisify(events.listTargetsByRule.bind(events))
}

function getRules (options) {
  let rulesNeeded = []
  if (options.s === 'h' || options.s === 'hourly') rulesNeeded.push({ Name: 'Dabber-hourly', schedule: schedules['hourly'] })
  else if (options.s === 'd' || options.s === 'daily') rulesNeeded.push({ Name: 'Dabber-daily', schedule: schedules['daily'] })
  else if (options.s === 'bh' || options.s === 'business-hours') {
    rulesNeeded.push(
      { Name: 'Dabber-business1', schedule: schedules['business1'] },
      { Name: 'Dabber-business2', schedule: schedules['business2'] }
    )
  }
  return rulesNeeded
}

function createTarget (options) {
  return co(function * () {
    let lambda = yield getLambdaFunction(options.s3Region, options.name)

    assert(lambda, `Unable to find lambda named ${options.name}. Have you deployed yet?`)

    return {
      Arn: lambda.FunctionArn,
      Id: uuid(),
      Input: JSON.stringify({
        type: 'backup',
        s3Bucket: options.s3Bucket,
        s3Prefix: options.s3Prefix,
        s3Region: options.s3Region,
        dbTable: options.dbTable,
        dbRegion: options.dbRegion || options.s3Region
      })
    }
  })
}

function getPages (fn, params, prop) {
  return co(function * () {
    let nextToken = null
    let items = []
    while (nextToken !== undefined) {
      let result = yield fn(Object.assign({}, params, { Limit: 20, NextToken: nextToken }))
      items = items.concat(result[prop])
      nextToken = result.NextToken || undefined
    }
    return items
  })
}

function getLambdaFunction (region, name) {
  let lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region })
  let listFunctions = promisify(lambda.listFunctions.bind(lambda))
  return co(function * () {
    let nextToken = null
    let items = []
    while (nextToken !== undefined) {
      let result = yield listFunctions({ Marker: nextToken })
      items = items.concat(result.Functions)
      nextToken = result.NextMarker || undefined
    }
    return items.find(f => f.FunctionName === name)
  })
}

function deploy (options) {
  const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: options.region })
  const iam = new AWS.IAM({ apiVersion: '2010-05-08', region: options.region })

  const getRole = promisify(iam.getRole.bind(iam))
  const createLambdaFunction = promisify(lambda.createFunction.bind(lambda))
  const updateFunctionCode = promisify(lambda.updateFunctionCode.bind(lambda))

  return co(function * () {
    const filePath = yield fuse.bundle.run().then(producer => {
      return producer.bundles.get(fuse.bundleName).process.filePath
    })

    let roleArn = options.role
    if (roleArn.indexOf('arn:aws:iam') === -1) {
      // lookup arn if only given role name
      roleArn = yield getRole({ RoleName: options.role }).then(result => {
        return result.Role && result.Role.Arn
      })
    }

    var zipper = new Zip()
    zipper.file('lambda.js', fs.readFileSync(filePath))
    var data = Buffer.from(zipper.generate({ base64: false, compression: 'DEFLATE' }), 'binary')
    let lambdaFunction = yield getLambdaFunction(options.region, options.name)

    let result
    if (lambdaFunction) {
      let params = {
        FunctionName: options.name,
        Publish: true,
        ZipFile: data
      }

      result = yield updateFunctionCode(params)
    } else {
      let params = {
        Code: { ZipFile: data },
        Description: 'Dabber: Scheduled Dynamo Backups',
        FunctionName: options.name,
        Handler: 'lambda.handler',
        MemorySize: 128,
        Publish: true,
        Role: roleArn,
        Runtime: 'nodejs6.10',
        Timeout: 300
      }

      result = yield createLambdaFunction(params)
    }
    console.log('Dabber Lambda Successfully Created', result)
  }).catch(err => {
    console.log(err)
    throw err
  })
}

function removeLambda (options) {

}
