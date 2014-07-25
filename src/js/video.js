var videojs, setup;

videojs = require('./core.js');
setup = require('./setup.js');

if (typeof HTMLVideoElement === 'undefined') {
  videojs.elementShiv();
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your video in the DOM (weird behavior only with minified version)
setup.autoSetupTimeout(1);

module.exports = videojs;
module.exports.components = function() {
  return require('./components.js');
}
