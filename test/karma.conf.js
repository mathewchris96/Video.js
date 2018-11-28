const generate = require('videojs-generate-karma-config');

module.exports = function(config) {
  const coverageFlag = process.env.npm_config_coverage;
  const reportCoverage = false; // process.env.TRAVIS || coverageFlag || false;

  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  const options = {
    serverBrowsers(defaults) {
      return [];
    },
    coverage: reportCoverage,
  };

  config = generate(config, options);

  config.files = [
    'dist/video-js.css',
    'test/globals-shim.js',
    'test/unit/**/*.js',
    'build/temp/browserify.js',
    'build/temp/webpack.js',
    {pattern: 'src/**/*.js', watched: true, included: false, served: false }
  ];

  config.browserStack.project = 'Video.js';

  config.frameworks.push('browserify');
  config.browserify = {
    debug: true,
    plugin: ['proxyquireify/plugin'],
    transform: [
      ['babelify', {"presets": [["@babel/preset-env", {"loose": true}]]}],
    ]
  };

  if (reportCoverage) {
    config.browserify.transform.push('browserify-istanbul');
  }

  config.concurrency = 1;

  config.preprocessors = {
    'test/**/*.js': ['browserify']
  };

};
