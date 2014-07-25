var Slider, SliderHandle, Component, vjslib, vjsevents;

Component = require('./component.js');
vjslib = require('./lib.js');
vjsevents = require('./events.js');

/* Slider
================================================================================ */
/**
 * The base functionality for sliders like the volume bar and seek bar
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
Slider = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    // Set property names to bar and handle to match with the child Slider class is looking for
    this.bar = this.getChild(this.options_['barName']);
    this.handle = this.getChild(this.options_['handleName']);

    this.on('mousedown', this.onMouseDown);
    this.on('touchstart', this.onMouseDown);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);
    this.on('click', this.onClick);

    this.player_.on('controlsvisible', vjslib.bind(this, this.update));

    player.on(this.playerEvent, vjslib.bind(this, this.update));

    this.boundEvents = {};
  }
});

Slider.prototype.createEl = function(type, props) {
  props = props || {};
  // Add the slider element class to all sub classes
  props.className = props.className + ' vjs-slider';
  props = vjslib.obj.merge({
    'role': 'slider',
    'aria-valuenow': 0,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    tabIndex: 0
  }, props);

  return Component.prototype.createEl.call(this, type, props);
};

Slider.prototype.onMouseDown = function(event){
  event.preventDefault();
  vjslib.blockTextSelection();

  this.boundEvents.move = vjslib.bind(this, this.onMouseMove);
  this.boundEvents.end = vjslib.bind(this, this.onMouseUp);

  vjsevents.on(document, 'mousemove', this.boundEvents.move);
  vjsevents.on(document, 'mouseup', this.boundEvents.end);
  vjsevents.on(document, 'touchmove', this.boundEvents.move);
  vjsevents.on(document, 'touchend', this.boundEvents.end);

  this.onMouseMove(event);
};

Slider.prototype.onMouseUp = function() {
  vjslib.unblockTextSelection();
  vjsevents.off(document, 'mousemove', this.boundEvents.move, false);
  vjsevents.off(document, 'mouseup', this.boundEvents.end, false);
  vjsevents.off(document, 'touchmove', this.boundEvents.move, false);
  vjsevents.off(document, 'touchend', this.boundEvents.end, false);

  this.update();
};

Slider.prototype.update = function(){
  // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
  // execution stack. The player is destroyed before then update will cause an error
  if (!this.el_) return;

  // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
  // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
  // var progress =  (this.player_.scrubbing) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();

  var barProgress,
      progress = this.getPercent(),
      handle = this.handle,
      bar = this.bar;

  // Protect against no duration and other division issues
  if (isNaN(progress)) { progress = 0; }

  barProgress = progress;

  // If there is a handle, we need to account for the handle in our calculation for progress bar
  // so that it doesn't fall short of or extend past the handle.
  if (handle) {

    var box = this.el_,
        boxWidth = box.offsetWidth,

        handleWidth = handle.el().offsetWidth,

        // The width of the handle in percent of the containing box
        // In IE, widths may not be ready yet causing NaN
        handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

        // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
        // There is a margin of half the handle's width on both sides.
        boxAdjustedPercent = 1 - handlePercent,

        // Adjust the progress that we'll use to set widths to the new adjusted box width
        adjustedProgress = progress * boxAdjustedPercent;

    // The bar does reach the left side, so we need to account for this in the bar's width
    barProgress = adjustedProgress + (handlePercent / 2);

    // Move the handle from the left based on the adjected progress
    handle.el().style.left = vjslib.round(adjustedProgress * 100, 2) + '%';
  }

  // Set the new bar width
  bar.el().style.width = vjslib.round(barProgress * 100, 2) + '%';
};

Slider.prototype.calculateDistance = function(event){
  var el, box, boxX, boxY, boxW, boxH, handle, pageX, pageY;

  el = this.el_;
  box = vjslib.findPosition(el);
  boxW = boxH = el.offsetWidth;
  handle = this.handle;

  if (this.options()['vertical']) {
    boxY = box.top;

    if (event.changedTouches) {
      pageY = event.changedTouches[0].pageY;
    } else {
      pageY = event.pageY;
    }

    if (handle) {
      var handleH = handle.el().offsetHeight;
      // Adjusted X and Width, so handle doesn't go outside the bar
      boxY = boxY + (handleH / 2);
      boxH = boxH - handleH;
    }

    // Percent that the click is through the adjusted area
    return Math.max(0, Math.min(1, ((boxY - pageY) + boxH) / boxH));

  } else {
    boxX = box.left;

    if (event.changedTouches) {
      pageX = event.changedTouches[0].pageX;
    } else {
      pageX = event.pageX;
    }

    if (handle) {
      var handleW = handle.el().offsetWidth;

      // Adjusted X and Width, so handle doesn't go outside the bar
      boxX = boxX + (handleW / 2);
      boxW = boxW - handleW;
    }

    // Percent that the click is through the adjusted area
    return Math.max(0, Math.min(1, (pageX - boxX) / boxW));
  }
};

Slider.prototype.onFocus = function(){
  vjsevents.on(document, 'keyup', vjslib.bind(this, this.onKeyPress));
};

Slider.prototype.onKeyPress = function(event){
  if (event.which == 37) { // Left Arrow
    event.preventDefault();
    this.stepBack();
  } else if (event.which == 39) { // Right Arrow
    event.preventDefault();
    this.stepForward();
  }
};

Slider.prototype.onBlur = function(){
  vjsevents.off(document, 'keyup', vjslib.bind(this, this.onKeyPress));
};

/**
 * Listener for click events on slider, used to prevent clicks
 *   from bubbling up to parent elements like button menus.
 * @param  {Object} event Event object
 */
Slider.prototype.onClick = function(event){
  event.stopImmediatePropagation();
  event.preventDefault();
};

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
SliderHandle = Component.extend();

/**
 * Default value of the slider
 *
 * @type {Number}
 * @private
 */
SliderHandle.prototype.defaultValue = 0;

/** @inheritDoc */
SliderHandle.prototype.createEl = function(type, props) {
  props = props || {};
  // Add the slider element class to all sub classes
  props.className = props.className + ' vjs-slider-handle';
  props = vjslib.obj.merge({
    innerHTML: '<span class="vjs-control-text">'+this.defaultValue+'</span>'
  }, props);

  return Component.prototype.createEl.call(this, 'div', props);
};

module.exports = {
  Slider: Slider,
  SliderHandle: SliderHandle
};
