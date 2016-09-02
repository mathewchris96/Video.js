/**
 * @file button.js
 */
import ClickableComponent from './clickable-component.js';
import Component from './component';
import log from './utils/log.js';
import assign from 'object.assign';

/**
 * Base class for all buttons.
 *
 * @extends ClickableComponent
 */
class Button extends ClickableComponent {

  /**
   * Create the `Button`s DOM element.
   *
   * @param {string} [tag=button]
   *        Element's node type. e.g. 'button'
   *
   * @param {Object} [props={}]
   *        An object of properties that should be set on the element.
   *
   * @param {Object} [attributes={}]
   *        An object of attributes that should be set on the element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl(tag = 'button', props = {}, attributes = {}) {
    props = assign({
      className: this.buildCSSClass()
    }, props);

    if (tag !== 'button') {
      log.warn(`Creating a Button with an HTML element of ${tag} is deprecated; use ClickableComponent instead.`);

      // Add properties for clickable element which is not a native HTML button
      props = assign({
        tabIndex: 0
      }, props);

      // Add ARIA attributes for clickable element which is not a native HTML button
      attributes = assign({
        role: 'button'
      }, attributes);
    }

    // Add attributes for button element
    attributes = assign({

      // Necessary since the default button type is "submit"
      'type': 'button',

      // let the screen reader user know that the text of the button may change
      'aria-live': 'polite'
    }, attributes);

    const el = Component.prototype.createEl.call(this, tag, props, attributes);

    this.createControlTextEl(el);

    return el;
  }

  /**
   * Add a child `Component` inside of this `Button`.
   *
   * @param {string|Component} child
   *        The name or instance of a child to add.
   *
   * @param {Object} [options={}]
   *        The key/value store of options that will get passed to children of
   *        the child.
   *
   * @return {Component}
   *         The `Component` that gets added as a child. When using a string the
   *         `Component` will get created by this process.
   *
   * @deprecated since version 5
   */
  addChild(child, options = {}) {
    const className = this.constructor.name;

    log.warn(`Adding an actionable (user controllable) child to a Button (${className}) is not supported; use a ClickableComponent instead.`);

    // Avoid the error message generated by ClickableComponent's addChild method
    return Component.prototype.addChild.call(this, child, options);
  }

  /**
   * Enable the `Button` element so that it can be activated or clicked. Use this with
   * {@link Button#disable}.
   *
   * @return {Component}
   *         Returns itself; method is chainable.
   */
  enable() {
    super.enable();
    this.el_.removeAttribute('disabled');
  }

  /**
   * Enable the `Button` element so that it cannot be activated or clicked. Use this with
   * {@link Button#enable}.
   *
   * @return {Component}
   *         Returns itself; method is chainable.
   */
  disable() {
    super.disable();
    this.el_.setAttribute('disabled', 'disabled');
  }

  /**
   * This gets called when a `Button` has focus and `keydown` is triggered via a key
   * press.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to get called.
   *
   * @listens {keydown}
   */
  handleKeyPress(event) {

    // Ignore Space (32) or Enter (13) key operation, which is handled by the browser for a button.
    if (event.which === 32 || event.which === 13) {
      return;
    }

    // Pass keypress handling up for unsupported keys
    super.handleKeyPress(event);
  }
}

Component.registerComponent('Button', Button);
export default Button;
