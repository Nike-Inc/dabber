const bundleName = 'lambda'
const {JSONPlugin, FuseBox} = require("fuse-box");

let fuseBox = FuseBox.init({
  cache: false,
  package: {
    name: 'lambda',
    main: 'lambda.js'
  },
  homeDir: `../src/`,
  output: `../build/$name.js`,
  globals: { 'lambda': '*' },
  plugins : [
    JSONPlugin()
  ]
})

// Remove the AWS SDK from the lambda.
// This no longer creates the bundle itself,
// you still have to call fuseBox.run()
fuseBox.bundle(bundleName).instructions(`lambda.js - aws-sdk`)

module.exports = {
  bundleName,
  bundle: fuseBox
}