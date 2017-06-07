# Dabber
Dynamo Automated Backup, (Benevolently Ergonomic) Restore

Dabber is a Node CLI tool and AWS Lambda that helps you work with Dynamo. The CLI can

* Backup Dynamo tables
* Restore to a Dynamo table from a backup
  * Give you a list of backups to select from (COMING SOON)
* Deploy a Dabber lambda
* Create an IAM role with the necessary permissions for the Dabber Lambda (COMING SOON)
* Create Backup Schedules as CloudWatch Rules that trigger the Dabber lambda
  * Schedules require the Dabber lambda, and can `be
    * Daily
    * Hourly
    * Business Hourly (8AM-6PM, PST, Hourly)
* Remove Backup Schedules (COMING SOON)

Once, installed the cli tool should be self-explanatory. Just run `dabber` to see the options.

# Installation

Install with npm

```
npm i @nike/dabber -g
```

> Until this package is open-sourced, you must configure the @nike scope with the CDT artifactory. Put this in an `.npmrc` file in your project root

```
registry=http://artifactory.nike.com/artifactory/api/npm/npm-nike
@nike:registry=http://artifactory.nike.com/artifactory/api/npm/npm-nike/
```

# How to use

Dabber is two pieces: a CLI and a Lambda. The CLI can perform one-off backups and restores from your machine. It can also deploy a Lambda and create CloudWatch rules that trigger the lambda to perform scheduled backups. You only need to deploy ***one*** lambda for Dabber, per account; after that you can create as many backup schedules as you want against the same lambda, since each schedule is a trigger that describes the backup operation for the lambda.

## Lambda Permissions
For the Dabber Lambda to work proprely it needs an IAM role with access to S3, Lambda, Events, and Dynamo. The easiest way to set this up is to create a role in IAM and write the following as an inline policy.

```language-json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:PutObject",
                "dynamodb:BatchGetItem",
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "logs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

It also needs Trust Relationships, described by this policy
```language-json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "events.amazonaws.com",
          "ec2.amazonaws.com",
          "states.us-west-2.amazonaws.com",
          "lambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
```

# CLI Docs

Dabber uses commands for each action. If you installed it globally, the format is

```
dabber [command] [...options]
```

## Backup

```
Options:
  --help          Show help                                            [boolean]
  -b, --s3Bucket  S3 Bucket to store backup in                        [required]
  -p, --s3Prefix  The folder path to store the backup in (can be deep, e.g.
                  "app/data/backups"). Datestamp and table name will be
                  appended.                                           [required]
  -r, --s3Region  Region of the S3 Bucket                             [required]
  -t, --dbTable   Dynamo Table to Backup                              [required]
  -R, --dbRegion  Region of the dynamo table. Defaults to S3 region if ommited
```
**Example**
```
dabber backup -b "niketech-dynamo-backups" -p "dev-devportal" -r "us-west-2" -t "DevPortal_Dev_Users"
```

## Restore

```
Options:
  --help          Show help                                            [boolean]
  -b, --s3Bucket  S3 Bucket to store backup in                        [required]
  -p, --s3Prefix  The folder path to store the backup in (can be deep, e.g.
                  "app/data/backups"). Datestamp and table name will be
                  appended.                                           [required]
  -r, --s3Region  Region of the S3 Bucket                             [required]
  -t, --dbTable   Dynamo Table to Backup                              [required]
  -R, --dbRegion  Region of the dynamo table. Defaults to S3 region if ommited
```

**Example**
```
dabber backup -b "niketech-dynamo-backups" -p "dev-devportal/2017-06-06T15:42:23.739Z/DevPortal_Dev_Users" -r "us-west-2" -t "DevPortal_Dev_Users"
```

## Deploy
Deploy the Dabber Lambda
```
Options:
  --help         Show help                                             [boolean]
  -n, --name     name for the dabber lambda                  [default: "dabber"]
  -p, --profile  aws profile to use from the credentials chain
                                                            [default: "default"]
  -R, --region   Region to deploy the lambda.                         [required]
  -r, --role     IAM Role for the lambda. Can be full ARN or just Role Name
                                                                      [required]
```

**Example**
```
dabber deploy -R us-west-2 -r dabber # this is an IAM role that you need to create, see the lambda setup section
```

## Cleanup (COMING SOON)
Remove the dabber lambda
```
Options:
  --help         Show help                                             [boolean]
  -n, --name     name for the dabber lambda                  [default: "dabber"]
  -p, --profile  aws profile to use from the credentials chain
                                                            [default: "default"]
```

**Example**
```
dabber cleanup
```

## Schedule Backup
Create a backup schedule in Cloudwatch Rules
```
Options:
  --help          Show help                                            [boolean]
  -b, --s3Bucket  S3 Bucket to store backup in                        [required]
  -p, --s3Prefix  The folder path to store the backup in (can be deep, e.g.
                  "app/data/backups"). Datestamp and table name will be
                  appended.                                           [required]
  -r, --s3Region  Region of the S3 Bucket                             [required]
  -t, --dbTable   Dynamo Table to Backup                              [required]
  -R, --dbRegion  Region of the dynamo table. Defaults to S3 region if ommited
  -s, --schedule  Schedule a table for backups using the dabber lambda
       [required] [choices: "h", "hourly", "bh", "business-hours", "d", "daily"]
  -n, --name      name for the dabber lambda                 [default: "dabber"]
```

**Example**
```
dabber schedule-backup -b "niketech-dynamo-backups" -p "devportal/prod" -r "us-west-2" -t "DevPortal_Prod_Invites" -s bh # business hours
```

### Unschedule (COMING SOON)
Remove a backup schedule
```
Options:
  --help          Show help                                            [boolean]
  -b, --s3Bucket  S3 Bucket to store backup in                        [required]
  -p, --s3Prefix  The folder path to store the backup in (can be deep, e.g.
                  "app/data/backups"). Datestamp and table name will be
                  appended.                                           [required]
  -r, --s3Region  Region of the S3 Bucket                             [required]
  -t, --dbTable   Dynamo Table to Backup                              [required]
  -R, --dbRegion  Region of the dynamo table. Defaults to S3 region if ommited
  -s, --schedule  Schedule a table for backups using the dabber lambda
       [required] [choices: "h", "hourly", "bh", "business-hours", "d", "daily"]
  -n, --name      name for the dabber lambda                 [default: "dabber"]
```

**Example**
```
dabber unschedule-backup -b "niketech-dynamo-backups" -p "devportal/prod" -r "us-west-2" -t "DevPortal_Prod_Invites" -s bh # business hours
```