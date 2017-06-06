# dabber
Dynamo Automated Backup, Benevolently Ergonomic Restore

# Instalation

If you want to install with npm you will need to configure npm to use the private Nike npm registry with the `@nike` npm scope. To do this, create a file called `.npmrc` with the following contents

```
registry=http://artifactory.nike.com/artifactory/api/npm/npm-nike
@nike:registry=http://artifactory.nike.com/artifactory/api/npm/npm-nike/
```

The `.npmrc` file can either be **project-level**, meaning it is in the root of your project, alongside the `package.json` file, or it can be in your user directory `~/.npmrc`. The per-project file simplifies your build process, since the build machine doesn't need any additional configuration, but it must be mode `600` (`chmod 600 .npmrc`) and it must be duplicated in every project you want to use it in. The user directory file means your build machine needs the same `.npmrc` file.

It's up to you which one to use, both work. Once that is done, install from npm as normal.

```
npm install --save @nike/lambda-logger-node
```

Then, require the package with `var cerberus = require('@nike/lambda-logger-node')`

If you are also using nike packages that are unscoped (that don't use the `@nike` prefix), you will need to include the unscoped registry in your `.npmrc`

```
registry=http://artifactory.nike.com/artifactory/api/npm/npm-nike
```

These are not mutually exclusive, but some problems have occured in the past with both entries. In general, when using Nike npm packages you should prefer to install with the `@nike` scope (most Nike packages are published there). If you run into an issues, please file an bug or let someone know in the `#js-cd` channel on Nike Digital's Slack.