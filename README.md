# Dabber
Dynamo Automated Backup, (Benevolently Ergonomic) Restore

Dabber is a Node CLI tool and AWS Lambda that helps you work with Dynamo. The CLI can

* Backup Dynamo tables
* Restore to a Dynamo table from a backup
  * Give you a list of backups to select from (COMING SOON)
* Deploy a Dabber lambda
* Create an IAM role with the necessary permissions for the Dabber Lambda (COMING SOON)
* Create Backup Schedules as CloudWatch Rules that trigger the Dabber lambda
  * Schedules require the Dabber lambda, and can be
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

# Lambda Setup
For the Dabber Lambda to work proprely it needs an IAM role with access to S3, Lambda, Events, and Dynamo.

```language-json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:AbortMultipartUpload",
                "s3:DeleteObject",
                "s3:DeleteObjectTagging",
                "s3:DeleteObjectVersion",
                "s3:DeleteObjectVersionTagging",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:GetObjectTagging",
                "s3:GetObjectTorrent",
                "s3:GetObjectVersion",
                "s3:GetObjectVersionAcl",
                "s3:GetObjectVersionTagging",
                "s3:GetObjectVersionTorrent",
                "s3:ListMultipartUploadParts",
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:PutObjectTagging",
                "s3:PutObjectVersionAcl",
                "s3:PutObjectVersionTagging",
                "s3:RestoreObject",
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:DeleteItem",
                "dynamodb:DescribeLimits",
                "dynamodb:DescribeReservedCapacity",
                "dynamodb:DescribeReservedCapacityOfferings",
                "dynamodb:DescribeStream",
                "dynamodb:DescribeTable",
                "dynamodb:DescribeTimeToLive",
                "dynamodb:GetItem",
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:ListStreams",
                "dynamodb:ListTables",
                "dynamodb:ListTagsOfResource",
                "dynamodb:PurchaseReservedCapacityOfferings",
                "dynamodb:PutItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:TagResource",
                "dynamodb:UpdateItem",
                "dynamodb:UpdateTimeToLive",
                "dynamodb:UntagResource"
            ],
            "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "logs:*"
          ],
          "Resource": "arn:aws:logs:*:*:*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject"
          ],
          "Resource": "arn:aws:s3:::*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
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
}
```

# Examples

## Backup

```
dabber backup -b "niketech-dynamo-backups" -p "dev-devportal" -r "us-west-2" -t "DevPortal_Dev_Users"
```

## Restore

```
dabber backup -b "niketech-dynamo-backups" -p "dev-devportal/2017-06-06T15:42:23.739Z/DevPortal_Dev_Users" -r "us-west-2" -t "DevPortal_Dev_Users"
```

## Deploy Lambda

```
dabber deploy -R us-west-2 -r dabber # this is an IAM role that you need to create, see the lambda setup section
```

## Schedule Backup

```
dabber schedule-backup -b "niketech-dynamo-backups" -p "devportal/prod" -r "us-west-2" -t "DevPortal_Prod_Invites" -s bh # business hours
```