const bundleName = 'lambda'
const {JSONPlugin, FuseBox} = require('fuse-box')

let fuseBox = FuseBox.init({
  cache: false,
  homeDir: `../src/`,
  output: `../build/$name.js`,
  ignoreModules: ['aws-sdk'],
  globals: { 'lambda': '*' },
  package: {
    name: 'lambda',
    main: 'lambda.js'
  },
  plugins: [
    JSONPlugin()
  ]
})

// Remove the AWS SDK from the lambda.
// This no longer creates the bundle itself,
// you still have to call fuseBox.run()
fuseBox.bundle(bundleName).instructions(`>lambda.js`).target('server')

fuseBox.run()
