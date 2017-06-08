'use strict'

const logger = require('@nike/lambda-node-logger')
const dynamo = require('./dynamo')
const promisify = require('pify')

exports.handler = logger(handler)

function handler (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false
  logger.restoreConsoleLog()

  switch (event.type) {
    case 'run-schedule':
      logger.info('running schedules', event)
      return runSchedule(event, context, callback)
    case 'backup':
      logger.info('performing dynamo backup', event.dbTable)
      dynamo.backup(event)
        .then(r => callback(null, r))
        .catch(err => callback(err))
      return
    default:
      logger.error('unknown event type', event.type)
      callback(new Error(`Unknown event type: ${event.type}`))
      break
  }
}

function runSchedule (event, context, callback) {
  let arn = context.invokedFunctionArn
  let region = arn.split(':')[3]

  // invokedFunctionArn: 'arn:aws:lambda:us-west-2:539783510382:function:dabber'

  const AWS = require('aws-sdk')
  const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: region })
  const invokeLambda = promisify(lambda.invoke.bind(lambda))

  let schedules = event.schedules.map(schedule => invokeLambda({
    FunctionName: arn,
    InvocationType: 'Event',
    LogType: 'None',
    Payload: JSON.stringify(Object.assign({ type: 'backup' }, schedule))
  }))

  Promise.all(schedules)
    .then(() => callback(null, 'done'))
    .catch(err => callback(err))
}
