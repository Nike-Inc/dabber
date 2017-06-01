'use strict'

const logger = require('@nike/lambda-node-logger')
const dynamo = require('./dynamo')

exports.handler = logger(handler)

function handler (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false
  logger.restoreConsoleLog()

  switch (event.type) {
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
