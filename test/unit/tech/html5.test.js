/* eslint-env qunit */
let player;
let tech;

import Html5 from '../../../src/js/tech/html5.js';
import * as browser from '../../../src/js/utils/browser.js';
import document from 'global/document';

QUnit.module('HTML5', {
  setup() {
    const el = document.createElement('div');

    el.innerHTML = '<div />';
    player = {
      id() {
        return 'id';
      },
      el() {
        return el;
      },
      options_: {},
      options() {
        return this.options_;
      },
      bufferedPercent() {
        return 0;
      },
      controls() {
        return false;
      },
      usingNativeControls() {
        return false;
      },
      on() {
        return this;
      },
      off() {
        return this;
      },
      ready() {},
      addChild() {},
      trigger() {}
    };
    tech = new Html5({});
  },
  teardown() {
    tech.dispose();
    player = null;
    tech = null;
  }
});

QUnit.test('should detect whether the volume can be changed', function() {

  if (!{}.__defineSetter__) {
    QUnit.ok(true, 'your browser does not support this test, skipping it');
    return;
  }
  const testVid = Html5.TEST_VID;
  const ConstVolumeVideo = function() {
    this.volume = 1;
    this.__defineSetter__('volume', function() {});
  };

  Html5.TEST_VID = new ConstVolumeVideo();

  QUnit.ok(!Html5.canControlVolume());
  Html5.TEST_VID = testVid;
});

QUnit.test('test playbackRate', function() {
  // Android 2.3 always returns 0 for playback rate
  if (!Html5.canControlPlaybackRate()) {
    QUnit.ok('Playback rate is not supported');
    return;
  }

  tech.createEl();

  tech.el().playbackRate = 1.25;
  QUnit.strictEqual(tech.playbackRate(), 1.25);

  tech.setPlaybackRate(0.75);
  QUnit.strictEqual(tech.playbackRate(), 0.75);
});

QUnit.test('should export played', function() {
  tech.createEl();
  QUnit.deepEqual(tech.played(), tech.el().played, 'returns the played attribute');
});

QUnit.test('should remove the controls attribute when recreating the element', function() {
  player.tagAttributes = {
    controls: true
  };
  // force custom controls so the test environment is equivalent on iOS
  player.options_.nativeControlsForTouch = false;
  const el = tech.createEl();

  // On the iPhone controls are always true
  if (!browser.IS_IPHONE) {
    QUnit.ok(!el.controls, 'controls attribute is absent');
  }

  QUnit.ok(player.tagAttributes.controls, 'tag attribute is still present');
});

QUnit.test('patchCanPlayType patches canplaytype with our function, conditionally', function() {
  // the patch runs automatically so we need to first unpatch
  Html5.unpatchCanPlayType();

  const oldAV = browser.ANDROID_VERSION;
  const video = document.createElement('video');
  const canPlayType = Html5.TEST_VID.constructor.prototype.canPlayType;

  browser.ANDROID_VERSION = 4.0;
  Html5.patchCanPlayType();

  QUnit.notStrictEqual(video.canPlayType,
                 canPlayType,
                 'original canPlayType and patched canPlayType should not be equal');

  const patchedCanPlayType = video.canPlayType;
  const unpatchedCanPlayType = Html5.unpatchCanPlayType();

  QUnit.strictEqual(canPlayType,
                    Html5.TEST_VID.constructor.prototype.canPlayType,
                    'original canPlayType and unpatched canPlayType should be equal');
  QUnit.strictEqual(patchedCanPlayType,
                    unpatchedCanPlayType,
                    'patched canPlayType and function returned from unpatch are equal');

  browser.ANDROID_VERSION = oldAV;
  Html5.unpatchCanPlayType();
});

QUnit.test('should return maybe for HLS urls on Android 4.0 or above', function() {
  const oldAV = browser.ANDROID_VERSION;
  const video = document.createElement('video');

  browser.ANDROID_VERSION = 4.0;
  Html5.patchCanPlayType();

  QUnit.strictEqual(video.canPlayType('application/x-mpegurl'),
                    'maybe',
                    'android version 4.0 or above should be a maybe for x-mpegurl');
  QUnit.strictEqual(video.canPlayType('application/x-mpegURL'),
                    'maybe',
                    'android version 4.0 or above should be a maybe for x-mpegURL');
  QUnit.strictEqual(video.canPlayType('application/vnd.apple.mpegurl'),
                    'maybe',
                    'android version 4.0 or above should be a ' +
                    'maybe for vnd.apple.mpegurl');
  QUnit.strictEqual(video.canPlayType('application/vnd.apple.mpegURL'),
                    'maybe',
                    'android version 4.0 or above should be a ' +
                    'maybe for vnd.apple.mpegurl');

  browser.ANDROID_VERSION = oldAV;
  Html5.unpatchCanPlayType();
});

QUnit.test('should return a maybe for mp4 on OLD ANDROID', function() {
  const isOldAndroid = browser.IS_OLD_ANDROID;
  const video = document.createElement('video');

  browser.IS_OLD_ANDROID = true;
  Html5.patchCanPlayType();

  QUnit.strictEqual(video.canPlayType('video/mp4'),
                    'maybe',
                    'old android should return a maybe for video/mp4');

  browser.IS_OLD_ANDROID = isOldAndroid;
  Html5.unpatchCanPlayType();
});

QUnit.test('error events may not set the errors property', function() {
  QUnit.equal(tech.error(), undefined, 'no tech-level error');
  tech.trigger('error');
  QUnit.ok(true, 'no error was thrown');
});

QUnit.test('should have the source handler interface', function() {
  QUnit.ok(Html5.registerSourceHandler, 'has the registerSourceHandler function');
});

QUnit.test('native source handler canPlayType', function() {
  // Stub the test video canPlayType (used in canPlayType) to control results
  const origCPT = Html5.TEST_VID.canPlayType;

  Html5.TEST_VID.canPlayType = function(type) {
    if (type === 'video/mp4') {
      return 'maybe';
    }
    return '';
  };

  const canPlayType = Html5.nativeSourceHandler.canPlayType;

  QUnit.equal(canPlayType('video/mp4'),
              'maybe',
              'Native source handler reported type support');
  QUnit.equal(canPlayType('foo'), '', 'Native source handler handled bad type');

  // Reset test video canPlayType
  Html5.TEST_VID.canPlayType = origCPT;
});

QUnit.test('native source handler canHandleSource', function() {
  // Stub the test video canPlayType (used in canHandleSource) to control results
  const origCPT = Html5.TEST_VID.canPlayType;

  Html5.TEST_VID.canPlayType = function(type) {
    if (type === 'video/mp4') {
      return 'maybe';
    }
    return '';
  };

  const canHandleSource = Html5.nativeSourceHandler.canHandleSource;

  QUnit.equal(canHandleSource({ type: 'video/mp4', src: 'video.flv' }, {}),
              'maybe',
              'Native source handler reported type support');
  QUnit.equal(canHandleSource({ src: 'http://www.example.com/video.mp4' }, {}),
              'maybe',
              'Native source handler reported extension support');
  QUnit.equal(canHandleSource({ src: 'https://example.com/video.sd.mp4?s=foo&token=bar' }, {}),
              'maybe',
              'Native source handler reported extension support');
  QUnit.equal(canHandleSource({ src: 'https://example.com/video.sd.mp4?s=foo' }, {}),
              'maybe',
              'Native source handler reported extension support');

  // Test for issue videojs/video.js#1785 and other potential failures
  QUnit.equal(canHandleSource({ src: '' }, {}),
              '',
              'Native source handler handled empty src');
  QUnit.equal(canHandleSource({}, {}),
              '',
              'Native source handler handled empty object');
  QUnit.equal(canHandleSource({ src: 'foo' }, {}),
              '',
              'Native source handler handled bad src');
  QUnit.equal(canHandleSource({ type: 'foo' }, {}),
              '',
              'Native source handler handled bad type');

  // Reset test video canPlayType
  Html5.TEST_VID.canPlayType = origCPT;
});

if (Html5.supportsNativeTextTracks()) {
  QUnit.test('add native textTrack listeners on startup', function() {
    const adds = [];
    const rems = [];
    const tt = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn])
    };
    const el = document.createElement('div');

    el.textTracks = tt;

    /* eslint-disable no-unused-vars */
    const htmlTech = new Html5({el});
    /* eslint-enable no-unused-vars */

    QUnit.equal(adds[0][0], 'change', 'change event handler added');
    QUnit.equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    QUnit.equal(adds[2][0], 'removetrack', 'removetrack event handler added');
  });

  QUnit.test('remove all tracks from emulated list on dispose', function() {
    const adds = [];
    const rems = [];
    const tt = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn])
    };
    const el = document.createElement('div');

    el.textTracks = tt;

    const htmlTech = new Html5({el});

    htmlTech.dispose();

    QUnit.equal(adds[0][0], 'change', 'change event handler added');
    QUnit.equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    QUnit.equal(adds[2][0], 'removetrack', 'removetrack event handler added');
    QUnit.equal(rems[0][0], 'change', 'change event handler removed');
    QUnit.equal(rems[1][0], 'addtrack', 'addtrack event handler removed');
    QUnit.equal(rems[2][0], 'removetrack', 'removetrack event handler removed');
    QUnit.equal(adds[0][0], rems[0][0], 'change event handler removed');
    QUnit.equal(adds[1][0], rems[1][0], 'addtrack event handler removed');
    QUnit.equal(adds[2][0], rems[2][0], 'removetrack event handler removed');
  });
}

if (Html5.supportsNativeAudioTracks()) {
  QUnit.test('add native audioTrack listeners on startup', function() {
    const adds = [];
    const rems = [];
    const at = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn])
    };
    const el = document.createElement('div');

    el.audioTracks = at;

    /* eslint-disable no-unused-vars */
    const htmlTech = new Html5({el});
    /* eslint-enable no-unused-vars */

    QUnit.equal(adds[0][0], 'change', 'change event handler added');
    QUnit.equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    QUnit.equal(adds[2][0], 'removetrack', 'removetrack event handler added');
  });

  QUnit.test('remove all tracks from emulated list on dispose', function() {
    const adds = [];
    const rems = [];
    const at = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn])
    };
    const el = document.createElement('div');

    el.audioTracks = at;

    const htmlTech = new Html5({el});

    htmlTech.dispose();

    QUnit.equal(adds[0][0], 'change', 'change event handler added');
    QUnit.equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    QUnit.equal(adds[2][0], 'removetrack', 'removetrack event handler added');
    QUnit.equal(rems[0][0], 'change', 'change event handler removed');
    QUnit.equal(rems[1][0], 'addtrack', 'addtrack event handler removed');
    QUnit.equal(rems[2][0], 'removetrack', 'removetrack event handler removed');
    QUnit.equal(adds[0][0], rems[0][0], 'change event handler removed');
    QUnit.equal(adds[1][0], rems[1][0], 'addtrack event handler removed');
    QUnit.equal(adds[2][0], rems[2][0], 'removetrack event handler removed');
  });
}

if (Html5.supportsNativeVideoTracks()) {
  QUnit.test('add native videoTrack listeners on startup', function() {
    const adds = [];
    const rems = [];
    const vt = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn])
    };
    const el = document.createElement('div');

    el.videoTracks = vt;

    /* eslint-disable no-unused-vars */
    const htmlTech = new Html5({el});
    /* eslint-enable no-unused-vars */

    QUnit.equal(adds[0][0], 'change', 'change event handler added');
    QUnit.equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    QUnit.equal(adds[2][0], 'removetrack', 'removetrack event handler added');
  });

  QUnit.test('remove all tracks from emulated list on dispose', function() {
    const adds = [];
    const rems = [];
    const vt = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn])
    };
    const el = document.createElement('div');

    el.videoTracks = vt;

    const htmlTech = new Html5({el});

    htmlTech.dispose();

    QUnit.equal(adds[0][0], 'change', 'change event handler added');
    QUnit.equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    QUnit.equal(adds[2][0], 'removetrack', 'removetrack event handler added');
    QUnit.equal(rems[0][0], 'change', 'change event handler removed');
    QUnit.equal(rems[1][0], 'addtrack', 'addtrack event handler removed');
    QUnit.equal(rems[2][0], 'removetrack', 'removetrack event handler removed');
    QUnit.equal(adds[0][0], rems[0][0], 'change event handler removed');
    QUnit.equal(adds[1][0], rems[1][0], 'addtrack event handler removed');
    QUnit.equal(adds[2][0], rems[2][0], 'removetrack event handler removed');
  });
}

QUnit.test('should always return currentSource_ if set', function() {
  const currentSrc = Html5.prototype.currentSrc;

  QUnit.equal(currentSrc.call({el_: {currentSrc: 'test1'}}),
              'test1',
              'sould return source from element if nothing else set');
  QUnit.equal(currentSrc.call({currentSource_: {src: 'test2'}}),
              'test2',
              'sould return source from currentSource_, if nothing else set');
  QUnit.equal(currentSrc.call({currentSource_: {src: 'test2'},
                               el_: {currentSrc: 'test1'}}),
              'test2',
              'sould return source from  source set, not from element');
});

QUnit.test('should fire makeup events when a video tag is initialized late', function() {
  const lateInit = Html5.prototype.handleLateInit_;
  let triggeredEvents = [];
  const mockHtml5 = {
    readyListeners: [],
    ready(listener) {
      this.readyListeners.push(listener);
    },
    triggerReady() {
      this.readyListeners.forEach(function(listener) {
        listener.call(this);
      }, this);
    },
    trigger(type) {
      triggeredEvents.push(type);
    },
    on() {},
    off() {}
  };

  function testStates(statesObject, expectedEvents) {
    lateInit.call(mockHtml5, statesObject);
    mockHtml5.triggerReady();
    QUnit.deepEqual(triggeredEvents,
                    expectedEvents,
                    'wrong events triggered for ' +
                    `networkState:${statesObject.networkState} ` +
                    `and readyState:${statesObject.readyState || 'no readyState'}`);

    // reset mock
    triggeredEvents = [];
    mockHtml5.readyListeners = [];
  }

  // Network States
  testStates({ networkState: 0, readyState: 0 }, []);
  testStates({ networkState: 1, readyState: 0 }, ['loadstart']);
  testStates({ networkState: 2, readyState: 0 }, ['loadstart']);
  testStates({ networkState: 3, readyState: 0 }, []);

  // Ready States
  testStates({ networkState: 1, readyState: 0 }, ['loadstart']);
  testStates({ networkState: 1, readyState: 1 }, ['loadstart', 'loadedmetadata']);
  testStates({ networkState: 1, readyState: 2 },
             ['loadstart', 'loadedmetadata', 'loadeddata']);
  testStates({ networkState: 1, readyState: 3 },
             ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay']);
  testStates({ networkState: 1, readyState: 4 },
             ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough']);
});

QUnit.test('Html5.resetMediaElement should remove sources and call load', function() {
  let selector;
  const removedChildren = [];
  let removedAttribute;
  let loaded;
  const children = ['source1', 'source2', 'source3'];
  const testEl = {
    querySelectorAll(input) {
      selector = input;
      return children;
    },

    removeChild(child) {
      removedChildren.push(child);
    },

    removeAttribute(attr) {
      removedAttribute = attr;
    },

    load() {
      loaded = true;
    }
  };

  Html5.resetMediaElement(testEl);
  QUnit.equal(selector, 'source', 'we got the source elements from the test el');
  QUnit.deepEqual(removedChildren,
                  children.reverse(),
                  'we removed the children that were present');
  QUnit.equal(removedAttribute, 'src', 'we removed the src attribute');
  QUnit.ok(loaded, 'we called load on the element');
});

QUnit.test('Html5#reset calls Html5.resetMediaElement when called', function() {
  const oldResetMedia = Html5.resetMediaElement;
  let resetEl;

  Html5.resetMediaElement = (el) => {
    resetEl = el;
  };

  const el = {};

  Html5.prototype.reset.call({el_: el});

  QUnit.equal(resetEl, el, 'we called resetMediaElement with the tech\'s el');

  Html5.resetMediaElement = oldResetMedia;
});
