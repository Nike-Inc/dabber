'use strict'

const Backup = require('dynamodb-backup-restore/lib/backup')
const Restore = require('dynamodb-backup-restore/lib/backup')

module.exports = {
  backup,
  restore
}

function backup (options) {
  let backup = new Backup({
    S3Bucket: options.s3Bucket,
    S3Prefix: `${options.s3Prefix}/${new Date().toISOString()}/${options.dbTable}`,
    S3Region: options.s3Region,
    DbTable: options.dbTable,
    DbRegion: options.dbRegion || options.s3Region
  })
  return backup.full()
}

function restore (options) {
  return Restore({
    S3Bucket: options.s3Bucket,
    S3Prefix: options.s3Prefix,
    S3Region: options.s3Region,
    DbTable: options.dbTable,
    DbRegion: options.dbRegion || options.s3Region,
    RestoreTime: options.restoreTime
  })
}
