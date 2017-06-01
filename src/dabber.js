'use strict'

const fs = require('fs')
const promisify = require('pify')
const co = require('co')
const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' })

const createLambdaFunction = promisify(lambda.createFunction.bind(lambda))

module.exports = {
  deploy,
  scheduleBackup,
  removeLambda
}

function scheduleBackup (options) {

}

function deploy (options) {
  // Build zip file
  let zipBuffer
  // lookup arn if only given role
  let roleArn
  var params = {
    Code: { ZipFile: zipBuffer },
    Description: 'Dabber: Scheduled Dynamo Backups',
    FunctionName: options.name,
    Handler: 'lambda,handler',
    MemorySize: 128,
    Publish: true,
    Role: roleArn,
    Runtime: 'nodejs6.10',
    Timeout: 360
  }
  return co(function * () {
    let result = yield createLambdaFunction(params)

    /*
    data = {
      CodeSha256: "",
      CodeSize: 123,
      Description: "",
      FunctionArn: "arn:aws:lambda:us-west-2:123456789012:function:MyFunction",
      FunctionName: "MyFunction",
      Handler: "source_file.handler_name",
      LastModified: "2016-11-21T19:49:20.006+0000",
      MemorySize: 128,
      Role: "arn:aws:iam::123456789012:role/service-role/role-name",
      Runtime: "nodejs4.3",
      Timeout: 123,
      Version: "1",
      VpcConfig: {
      }
    }
    */
  })
}

function removeLambda (options) {

}
