/**
 * @file play-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';

/**
 * Button to toggle between play and pause
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class PlayToggle
 */
class PlayToggle extends Button {

  constructor(player, options) {
    super(player, options);

    this.on(player, 'play', this.handlePlay);
    this.on(player, 'pause', this.handlePause);
    this.on(player, 'ended', this.handleEnded);
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-play-control ${super.buildCSSClass()}`;
  }

  /**
   * Handle click to toggle between play and pause
   *
   * @method handleClick
   */
  handleClick() {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }

  /**
   * Add the vjs-playing class to the element so it can change appearance
   *
   * @method handlePlay
   */
  handlePlay() {
    this.removeClass('vjs-ended');
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');
    // change the button text to "Pause"
    this.controlText('Pause');
  }

  /**
   * Add the vjs-paused class to the element so it can change appearance
   *
   * @method handlePause
   */
  handlePause() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    // change the button text to "Play"
    this.controlText('Play');
  }

  /**
   * Add the vjs-ended class to the element so it can change appearance
   *
   * @method handleEnded
   */
  handleEnded() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-ended');
    // change the button text to "Replay"
    this.controlText('Replay');
  }

}

PlayToggle.prototype.controlText_ = 'Play';

Component.registerComponent('PlayToggle', PlayToggle);
export default PlayToggle;
