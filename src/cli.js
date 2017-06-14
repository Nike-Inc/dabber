#! /usr/bin/env node
const dabber = require('./dabber')
const dynamo = require('./dynamo')
const inquirer = require('inquirer')
const co = require('co')
const promisify = require('pify')

// eslint-disable-next-line no-unused-expressions
require('yargs')
  .command({
    command: 'backup',
    desc: 'Do a full backup of a dynamo table',
    builder: backupOptions,
    handler: dynamo.backup
  })
  .command({
    command: 'restore',
    desc: 'Do a full restore of a dynamo table from a backup',
    builder: restoreOptions,
    handler: handleRestore
  })
  .command({
    command: 'schedule-backup',
    desc: 'Create a backup schedule for a dynamo table',
    builder: scheduleOptions,
    handler: dabber.scheduleBackup
  })
  .command({
    command: 'unschedule',
    desc: 'Delete a backup schedule for a dynamo table',
    builder: scheduleOptions,
    handler: dabber.unscheduleBackup
  })
  .command({
    command: 'deploy',
    desc: 'Deploy the dabber lambda necessary for scheduled backups',
    builder: lambdaDeployOptions,
    handler: dabber.deploy
  })
  .command({
    command: 'setup-iam-role',
    desc: 'Create an IAM role with an inline policy that can be used by the Dabber lambda',
    builder: setupRoleOptions,
    handler: dabber.setupIamRole
  })
  .command({
    command: 'cleanup',
    desc: 'Delete the dabber lambda function',
    builder: lambdaCleanupOptions,
    handler: (options) => {
      inquirer.prompt([{ type: 'confirm', name: 'proceed', message: `This will remove the Lambda function: ${options.name}.\nAre you sure you want to do this?`, default: false }])
      .then((answers) => {
        if (!answers.proceed) return
        dabber.removeLambda(options)
      })
      .catch(err => {
        console.error(err)
      })
    }
  })
  .demandCommand(1, 'Must provide at least one command')
  .help()
  .argv

function setupRoleOptions (yargs) {
  return yargs
    .option('R', {
      alias: 'region',
      desc: 'Region to setup the IAM role.',
      demandOption: true
    })
    .option('n', {
      alias: 'name',
      desc: 'name for the dabber lambda',
      default: 'dabber',
      demandOption: false
    })
}

function backupOptions (yargs) {
  return yargs
    .option('b', {
      alias: 's3Bucket',
      demandOption: true,
      describe: 'S3 Bucket to store backup in'
    })
    .option('p', {
      alias: 's3Prefix',
      demandOption: true,
      describe: 'The folder path to store the backup in (can be deep, e.g. "app/data/backups"). Datestamp and table name will be appended.'
    })
    .option('r', {
      alias: 's3Region',
      demandOption: true,
      describe: 'Region of the S3 Bucket'
    })
    .option('t', {
      alias: 'dbTable',
      demandOption: true,
      describe: 'Dynamo Table to Backup'
    })
    .option('R', {
      alias: 'dbRegion',
      demandOption: false,
      describe: 'Region of the dynamo table. Defaults to S3 region if ommited'
    })
}

function scheduleOptions (yargs) {
  return backupOptions(yargs)
    .option('s', {
      alias: 'schedule',
      desc: 'Schedule a table for backups using the dabber lambda',
      choices: ['h', 'hourly', 'bh', 'business-hours', 'd', 'daily'],
      demandOption: true
    })
    .option('n', {
      alias: 'name',
      desc: 'name for the dabber lambda',
      default: 'dabber',
      demandOption: false
    })
}

function restoreOptions (yargs) {
  return yargs
    .option('b', {
      alias: 's3Bucket',
      demandOption: true,
      describe: 'S3 Bucket to store backup in'
    })
    .option('p', {
      alias: 's3Prefix',
      demandOption: true,
      describe: 'The folder path to store the backup in (can be deep, e.g. "app/data/backups"). Datestamp and table name will be appended.'
    })
    .option('r', {
      alias: 's3Region',
      demandOption: true,
      describe: 'Region of the S3 Bucket'
    })
    .option('t', {
      alias: 'dbTable',
      demandOption: true,
      describe: 'Dynamo Table to Restore to'
    })
    .option('T', {
      alias: 's3Table',
      demandOption: false,
      default: '',
      describe: 'The name of the table that was backed up to s3. Will filter the restore options'
    })
    .option('R', {
      alias: 'dbRegion',
      demandOption: false,
      describe: 'Region of the dynamo table. Defaults to S3 region if ommited'
    })
    .option('l', {
      alias: 'list',
      desc: 'List available backups from the given prefix',
      demandOption: false
    })
}

function lambdaCleanupOptions (yargs) {
  return yargs
    .option('R', {
      alias: 'region',
      desc: 'Region to deploy the lambda.',
      demandOption: true
    })
    .option('n', {
      alias: 'name',
      desc: 'name for the dabber lambda',
      default: 'dabber',
      demandOption: false
    })
    .option('p', {
      alias: 'profile',
      desc: 'aws profile to use from the credentials chain',
      default: 'default'
    })
}

function lambdaDeployOptions (yargs) {
  return lambdaCleanupOptions(yargs)
    .option('R', {
      alias: 'region',
      desc: 'Region to deploy the lambda.',
      demandOption: true
    })
    .option('r', {
      alias: 'role',
      desc: 'IAM Role for the lambda. Can be full ARN or just Role Name',
      default: 'dabber',
      demandOption: true
    })
}

// dabber[argv.c](argv.o)

// compiler.compileFile(argv.s, argv.o, { min: argv.m })

var log = (...args) => console.log(...args.map(a => require('util').inspect(a, { colors: true, depth: null }))) // eslint-disable-line
function handleRestore (options) {
  if (!options.l) {
    return dynamo.restore(options)
  }
  let AWS = require('aws-sdk')
  let s3 = new AWS.S3({apiVersion: '2006-03-01', region: options.s3Region})
  let listObjectsV2 = promisify(s3.listObjectsV2.bind(s3))
  let prefix = options.s3Prefix

  return co(function * () {
    let files = []
    let lastToken = null
    while (lastToken !== undefined) {
      let response = yield listObjectsV2({
        Bucket: options.s3Bucket,
        ContinuationToken: lastToken || undefined,
        Prefix: options.s3Prefix
      })
      files.push(...response.Contents.map(b => b.Key))
      lastToken = response.IsTruncated ? response.NextContinuationToken : undefined
    }

    let backups = files.reduce((list, key) => {
      let folder = key.replace(prefix + '/', '')
      if (!folder || (options.s3Table && folder.indexOf(options.s3Table) === -1)) return list
      folder = folder.split('/').slice(0, 2).join('/')
      if (list.indexOf(folder) === -1) list.push(folder)
      return list
    }, [])

    if (backups.length === 0) {
      console.log(`No Backups found at ${prefix}`)
      return
    }

    let answer = yield inquirer.prompt([{ type: 'list', name: 'backup', message: `Select a backup`, choices: backups }])

    if (!answer.backup) {
      console.log('No backup selected')
      return
    }
    return dynamo.restore(Object.assign(options, { S3Prefix: `${prefix}/${answer.backup}` }))
  }).catch(e => {
    console.error(e)
  })
}
