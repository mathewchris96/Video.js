/* eslint-env qunit */
import * as Events from '../../src/js/utils/events.js';
import document from 'global/document';

QUnit.module('Events');

QUnit.test('should add and remove an event listener to an element', function() {
  QUnit.expect(1);

  const el = document.createElement('div');
  const listener = function() {
    QUnit.ok(true, 'Click Triggered');
  };

  Events.on(el, 'click', listener);
  // 1 click
  Events.trigger(el, 'click');
  Events.off(el, 'click', listener);
  // No click should happen.
  Events.trigger(el, 'click');
});

QUnit.test('should add and remove multiple event listeners to an element with a single call', function() {
  QUnit.expect(6);

  const el = document.createElement('div');
  const listener = function() {
    QUnit.ok(true, 'Callback triggered');
  };

  Events.on(el, ['click', 'event1', 'event2'], listener);

  Events.trigger(el, 'click');
  Events.trigger(el, 'click');
  Events.off(el, 'click', listener);
  // No click should happen.
  Events.trigger(el, 'click');

  Events.trigger(el, 'event1');
  Events.trigger(el, 'event1');
  Events.off(el, 'event1', listener);
  // No event1 should happen.
  Events.trigger(el, 'event1');

  Events.trigger(el, 'event2');
  Events.trigger(el, 'event2');
  Events.off(el, 'event2', listener);
  // No event2 should happen.
  Events.trigger(el, 'event2');
});

QUnit.test('should be possible to pass data when you trigger an event', function() {
  QUnit.expect(6);
  const el = document.createElement('div');
  const fakeData1 = 'Fake Data 1';
  const fakeData2 = {txt: 'Fake Data 2'};

  const listener = function(evt, hash) {
    QUnit.ok(true, 'Callback triggered');
    deepEqual(fakeData1, hash.d1, 'Shoulbe be passed to the handler');
    deepEqual(fakeData2, hash.d2, 'Shoulbe be passed to the handler');
  };

  Events.on(el, ['event1', 'event2'], listener);
  Events.trigger(el, 'event1', { d1: fakeData1, d2: fakeData2});
  Events.trigger(el, 'event2', { d1: fakeData1, d2: fakeData2});

});

QUnit.test('should remove all listeners of a type', function() {
  const el = document.createElement('div');
  let clicks = 0;
  const listener = function() {
    clicks++;
  };
  const listener2 = function() {
    clicks++;
  };

  Events.on(el, 'click', listener);
  Events.on(el, 'click', listener2);
    // 2 clicks
  Events.trigger(el, 'click');

  QUnit.ok(clicks === 2, 'both click listeners fired');

  Events.off(el, 'click');
  // No click should happen.
  Events.trigger(el, 'click');

  QUnit.ok(clicks === 2, 'no click listeners fired');
});

QUnit.test('should remove all listeners of an array of types', function() {
  const el = document.createElement('div');
  let calls = 0;
  const listener = function() {
    calls++;
  };
  const listener2 = function() {
    calls++;
  };

  Events.on(el, ['click', 'event1'], listener);
  Events.on(el, ['click', 'event1'], listener2);
  // 2 calls
  Events.trigger(el, 'click');
  // 2 calls
  Events.trigger(el, 'event1');

  QUnit.ok(calls === 4, 'both click listeners fired');

  Events.off(el, ['click', 'event1']);
  // No click should happen.
  Events.trigger(el, 'click');
  // No event1 should happen.
  Events.trigger(el, 'event1');

  QUnit.ok(calls === 4, 'no event listeners fired');
});

QUnit.test('should remove all listeners from an element', function() {
  QUnit.expect(2);

  const el = document.createElement('div');
  const listener = function() {
    QUnit.ok(true, 'Fake1 Triggered');
  };
  const listener2 = function() {
    QUnit.ok(true, 'Fake2 Triggered');
  };

  Events.on(el, 'fake1', listener);
  Events.on(el, 'fake2', listener2);

  Events.trigger(el, 'fake1');
  Events.trigger(el, 'fake2');

  Events.off(el);

  // No listener should happen.
  Events.trigger(el, 'fake1');
  Events.trigger(el, 'fake2');
});

QUnit.test('should listen only once', function() {
  QUnit.expect(1);

  const el = document.createElement('div');
  const listener = function() {
    QUnit.ok(true, 'Click Triggered');
  };

  Events.one(el, 'click', listener);
  // 1 click
  Events.trigger(el, 'click');
  // No click should happen.
  Events.trigger(el, 'click');
});

QUnit.test('should listen only once in multiple events from a single call', function() {
  QUnit.expect(3);

  const el = document.createElement('div');
  const listener = function() {
    QUnit.ok(true, 'Callback Triggered');
  };

  Events.one(el, ['click', 'event1', 'event2'], listener);
  // 1 click
  Events.trigger(el, 'click');
  // No click should happen.
  Events.trigger(el, 'click');
  // event1 must be handled.
  Events.trigger(el, 'event1');
  // No event1 should be handled.
  Events.trigger(el, 'event1');
  // event2 must be handled.
  Events.trigger(el, 'event2');
  // No event2 should be handled.
  Events.trigger(el, 'event2');
});

QUnit.test('should stop immediate propagtion', function() {
  QUnit.expect(1);

  const el = document.createElement('div');

  Events.on(el, 'test', function(e) {
    QUnit.ok(true, 'First listener fired');
    e.stopImmediatePropagation();
  });

  Events.on(el, 'test', function(e) {
    QUnit.ok(false, 'Second listener fired');
  });

  Events.trigger(el, 'test');
});

QUnit.test('should bubble up DOM unless bubbles == false', function() {
  QUnit.expect(3);

  const outer = document.createElement('div');
  const inner = outer.appendChild(document.createElement('div'));

  // Verify that if bubbles === true, event bubbles up dom.
  Events.on(inner, 'bubbles', function(e) {
    QUnit.ok(true, 'Inner listener fired');
  });
  Events.on(outer, 'bubbles', function(e) {
    QUnit.ok(true, 'Outer listener fired');
  });
  Events.trigger(inner, { type: 'bubbles', target: inner, bubbles: true });

  // Only change 'bubbles' to false, and verify only inner handler is called.
  Events.on(inner, 'nobub', function(e) {
    QUnit.ok(true, 'Inner listener fired');
  });
  Events.on(outer, 'nobub', function(e) {
    QUnit.ok(false, 'Outer listener fired');
  });
  Events.trigger(inner, { type: 'nobub', target: inner, bubbles: false });
});

QUnit.test('should have a defaultPrevented property on an event that was prevent from doing default action', function() {
  QUnit.expect(2);

  const el = document.createElement('div');

  Events.on(el, 'test', function(e) {
    QUnit.ok(true, 'First listener fired');
    e.preventDefault();
  });

  Events.on(el, 'test', function(e) {
    QUnit.ok(e.defaultPrevented, 'Should have `defaultPrevented` to signify preventDefault being called');
  });

  Events.trigger(el, 'test');
});

QUnit.test('should have relatedTarget correctly set on the event', function() {
  QUnit.expect(2);

  const el1 = document.createElement('div');
  const el2 = document.createElement('div');
  const relatedEl = document.createElement('div');

  Events.on(el1, 'click', function(e) {
    QUnit.equal(e.relatedTarget, relatedEl, 'relatedTarget is set for all browsers when related element is set on the event');
  });

  Events.trigger(el1, { type: 'click', relatedTarget: relatedEl });

  Events.on(el2, 'click', function(e) {
    QUnit.equal(e.relatedTarget, null, 'relatedTarget is null when none is provided');
  });

  Events.trigger(el2, { type: 'click', relatedTarget: undefined });
});
