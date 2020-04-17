var fs = require('graceful-fs')
var path = require('path')

var mr = require('npm-registry-mock')
var test = require('tap').test

var npm = require('../../lib/npm')
var common = require('../common-tap')

var pkg = common.pkg

var json = {
  name: 'outdated-level',
  version: '1.2.3',
  dependencies: {
    request: '^0.9.5'
  }
}

test('setup', function (t) {
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )
  process.chdir(pkg)

  t.end()
})

var expected = {
  latest: [
    pkg,
    'request',
    '0.9.5',
    '0.9.5',
    '2.27.0',
    '^0.9.5',
    null
  ],
  wanted: [
    pkg,
    'request',
    '0.9.0',
    '0.9.5',
    '2.27.0',
    '^0.9.0',
    null
  ]
}

test('outdated level none', function (t) {
  mr({ port: common.port }, function (er, s) {
    npm.load(
      {
        'outdated-level': 'none',
        loglevel: 'silent',
        registry: common.registry
      },
      function () {
        npm.install('request@0.9.5', function (er) {
          if (er) throw new Error(er)
          npm.outdated(function (err, d) {
            if (err) {
              throw err
            }
            t.is(process.exitCode, 0, 'exit code set to 0')
            // process.exitCode = 0
            t.deepEqual(d[0], expected.latest)
            t.equal(d.length, 1)
            npm.install('request@0.9.0', function (er) {
              if (er) throw new Error(er)
              npm.outdated(function (err, d) {
                if (err) {
                  throw err
                }
                t.is(process.exitCode, 0, 'exit code set to 0')
                // process.exitCode = 0
                t.deepEqual(d[0], expected.wanted)
                t.equal(d.length, 1)
                s.close()
                t.end()
              })
            })
          })
        })
      }
    )
  })
})
