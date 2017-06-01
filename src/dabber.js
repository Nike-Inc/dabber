'use strict'

const co = require('co')
const AWS = require('aws-sdk')
const fuse = require('./fuse')
const promisify = require('pify')
const zip = require('adm-zip')

module.exports = {
  deploy,
  scheduleBackup,
  removeLambda
}

function scheduleBackup (options) {

}

function deploy (options) {
  const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: options.region })
  const iam = new AWS.IAM({ apiVersion: '2010-05-08', region: options.region })

  const getRole = promisify(iam.getRole.bind(iam))
  const createLambdaFunction = promisify(lambda.createFunction.bind(lambda))

  return co(function * () {
    const filePath = yield fuse.bundle.run().then(producer => {
      return producer.bundles.get(fuse.bundleName).process.filePath
    })

    let roleArn = options.role
    if(roleArn.indexOf('arn:aws:iam') === -1) {
      // lookup arn if only given role name
      roleArn = yield getRole({ RoleName: options.role }).then(result => {
        return result.Role && result.Role.Arn
      })
    }

    var zipper = new zip();
    zipper.addLocalFile(filePath);

    var params = {
      Code: { ZipFile: zipper.toBuffer() },
      Description: 'Dabber: Scheduled Dynamo Backups',
      FunctionName: options.name,
      Handler: 'lambda.handler',
      MemorySize: 128,
      Publish: true,
      Role: roleArn,
      Runtime: 'nodejs6.10',
      Timeout: 300
    }

    let result = yield createLambdaFunction(params).catch(err => {
      console.log(err)
      throw err
    })

    console.log('Dabber Lambda Successfully Created', result)
  })
}

function removeLambda (options) {

}
