# dabber
Dynamo Automated Backup, Benevolently Ergonomic Restore


# Permissions
* Lambda needs permission to execute, and tables and s3 bucket
* cloudwatch events need permission on lambda (and alias if used)

# Deploying the dabber lambda
Dabber uses a lambda to operate. It is possible to use a single dabber lambda for all dynamo backups in your account, but this will require the dabber lambda to have permissions on all the tables it needs to backup. You may want to group your Dynamo tables into groups by Application and deploy a dabber lambda for each of this, to limit the permissions necessary on each one. If you do this, 