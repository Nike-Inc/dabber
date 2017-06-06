#! /usr/bin/env node
const dabber = require('./dabber')
const dynamo = require('./dynamo')

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
    builder: backupOptions,
    handler: dynamo.restore
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
    command: 'cleanup',
    desc: 'Delete the dabber lambda function',
    builder: lambdaCleanupOptions,
    handler: dabber.removeLambda
  })
  .demandCommand(1, 'Must provide at least one command')
  .help()
  .argv

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

function lambdaCleanupOptions (yargs) {
  return yargs
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
      demandOption: true
    })
}

// dabber[argv.c](argv.o)

// compiler.compileFile(argv.s, argv.o, { min: argv.m })
