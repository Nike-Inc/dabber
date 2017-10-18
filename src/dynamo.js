'use strict'

const Backup = require('dynamodb-backup-restore/lib/backup')
const Restore = require('dynamodb-backup-restore/lib/restore')

module.exports = {
  backup,
  restore
}

function backup (options) {
  let prefix = `${options.s3Prefix}/${(options.datestamp || new Date().toISOString())}/${options.dbTable}`
  let backup = new Backup({
    S3Bucket: options.s3Bucket,
    S3Prefix: prefix,
    S3Region: options.s3Region,
    DbTable: options.dbTable,
    DbRegion: options.dbRegion || options.s3Region
  })
  return backup.full()
    .then(() => {
      console.log('backup complete', options.s3Bucket, prefix)
    })
}

function restore (options) {
  return Restore({
    S3Bucket: options.s3Bucket,
    S3Prefix: options.s3Prefix,
    S3Region: options.s3Region,
    DbTable: options.dbTable,
    DbRegion: options.dbRegion || options.s3Region
  })
}
