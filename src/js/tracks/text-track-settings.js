/**
 * @file text-track-settings.js
 */
import window from 'global/window';
import Component from '../component';
import {createEl} from '../utils/dom';
import * as Fn from '../utils/fn';
import * as Obj from '../utils/obj';
import log from '../utils/log';

const LOCAL_STORAGE_KEY = 'vjs-text-track-settings';

// Configuration for the various <select> elements in the DOM of this component.
//
// Possible keys include:
//
// `default`:
//   The default option index. Only needs to be provided if not zero.
// `parser`:
//   A function which is used to parse the value from the selected option in
//   a customized way.
// `selector`:
//   The selector used to find the associated <select> element.
const selectConfigs = {
  backgroundColor: {
    selector: '.vjs-bg-color > select',
    id: 'captions-background-color-%s',
    label: 'Color',
    options: [
      ['#000', 'Black'],
      ['#FFF', 'White'],
      ['#F00', 'Red'],
      ['#0F0', 'Green'],
      ['#00F', 'Blue'],
      ['#FF0', 'Yellow'],
      ['#F0F', 'Magenta'],
      ['#0FF', 'Cyan']
    ]
  },

  backgroundOpacity: {
    selector: '.vjs-bg-opacity > select',
    id: 'captions-background-opacity-%s',
    label: 'Transparency',
    options: [
      ['1', 'Opaque'],
      ['0.5', 'Semi-Transparent'],
      ['0', 'Transparent']
    ]
  },

  color: {
    selector: '.vjs-fg-color > select',
    id: 'captions-foreground-color-%s',
    label: 'Color',
    options: [
      ['#FFF', 'White'],
      ['#000', 'Black'],
      ['#F00', 'Red'],
      ['#0F0', 'Green'],
      ['#00F', 'Blue'],
      ['#FF0', 'Yellow'],
      ['#F0F', 'Magenta'],
      ['#0FF', 'Cyan']
    ]
  },

  edgeStyle: {
    selector: '.vjs-edge-style > select',
    id: '%s',
    label: 'Text Edge Style',
    options: [
      ['none', 'None'],
      ['raised', 'Raised'],
      ['depressed', 'Depressed'],
      ['uniform', 'Uniform'],
      ['dropshadow', 'Dropshadow']
    ]
  },

  fontFamily: {
    selector: '.vjs-font-family > select',
    id: 'captions-font-family-%s',
    label: 'Font Family',
    options: [
      ['proportionalSansSerif', 'Proportional Sans-Serif'],
      ['monospaceSansSerif', 'Monospace Sans-Serif'],
      ['proportionalSerif', 'Proportional Serif'],
      ['monospaceSerif', 'Monospace Serif'],
      ['casual', 'Casual'],
      ['script', 'Script'],
      ['small-caps', 'Small Caps']
    ]
  },

  fontPercent: {
    selector: '.vjs-font-percent > select',
    id: 'captions-font-size-%s',
    label: 'Font Size',
    options: [
      ['0.50', '50%'],
      ['0.75', '75%'],
      ['1.00', '100%'],
      ['1.25', '125%'],
      ['1.50', '150%'],
      ['1.75', '175%'],
      ['2.00', '200%'],
      ['3.00', '300%'],
      ['4.00', '400%']
    ],
    default: 2,
    parser: (v) => v === '1.00' ? null : Number(v)
  },

  textOpacity: {
    selector: '.vjs-text-opacity > select',
    id: 'captions-foreground-opacity-%s',
    label: 'Transparency',
    options: [
      ['1', 'Opaque'],
      ['0.5', 'Semi-Opaque']
    ]
  },

  // Options for this object are defined below.
  windowColor: {
    selector: '.vjs-window-color > select',
    id: 'captions-window-color-%s',
    label: 'Color'
  },

  // Options for this object are defined below.
  windowOpacity: {
    selector: '.vjs-window-opacity > select',
    id: 'captions-window-opacity-%s',
    label: 'Transparency',
    options: [
      ['0', 'Transparent'],
      ['0.5', 'Semi-Transparent'],
      ['1', 'Opaque']
    ]
  }
};

selectConfigs.windowColor.options = selectConfigs.backgroundColor.options;

/**
 * Parses out option values.
 *
 * @private
 * @param  {String} value
 * @param  {Function} [parser]
 *         Optional function to adjust the value.
 * @return {Mixed}
 *         Will be `undefined` if no value exists (or if given value is "none").
 */
function parseOptionValue(value, parser) {
  if (parser) {
    value = parser(value);
  }

  if (value && value !== 'none') {
    return value;
  }
}

/**
 * Gets the value of the selected <option> element within a <select> element.
 *
 * @param  {Object} config
 * @param  {Function} [parser]
 *         Optional function to adjust the value.
 * @return {Mixed}
 */
function getSelectedOptionValue(el, parser) {
  const value = el.options[el.options.selectedIndex].value;

  return parseOptionValue(value, parser);
}

/**
 * Sets the selected <option> element within a <select> element based on a
 * given value.
 *
 * @param {Object} el
 * @param {String} value
 * @param {Function} [parser]
 *        Optional function to adjust the value before comparing.
 */
function setSelectedOption(el, value, parser) {
  if (!value) {
    return;
  }

  for (let i = 0; i < el.options.length; i++) {
    if (parseOptionValue(el.options[i].value, parser) === value) {
      el.selectedIndex = i;
      break;
    }
  }
}

/**
 * Manipulate settings of text tracks
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Component
 * @class TextTrackSettings
 */
class TextTrackSettings extends Component {

  constructor(player, options) {
    super(player, options);
    this.setDefaults();
    this.hide();

    this.updateDisplay = Fn.bind(this, this.updateDisplay);

    // Grab `persistTextTrackSettings` from the player options if not passed in child options
    if (options.persistTextTrackSettings === undefined) {
      this.options_.persistTextTrackSettings = this.options_.playerOptions.persistTextTrackSettings;
    }

    this.on(this.$('.vjs-done-button'), 'click', () => {
      this.saveSettings();
      this.hide();
    });

    this.on(this.$('.vjs-default-button'), 'click', () => {
      this.setDefaults();
      this.updateDisplay();
    });

    Obj.each(selectConfigs, config => {
      this.on(this.$(config.selector), 'change', this.updateDisplay);
    });

    if (this.options_.persistTextTrackSettings) {
      this.restoreSettings();
    }
  }

  /**
   * Create a <select> element with configured options.
   *
   * @private
   * @return {Element}
   * @method createElSelect_
   */
  createElSelect_(key) {
    const config = selectConfigs[key];
    const id = config.id.replace('%s', this.id_);

    return [
      createEl(
        'label',
        {className: 'vjs-label', textContent: config.label},
        {for: id}),
      createEl(
        'select',
        {id},
        undefined,
        config.options.map(o => {
          return createEl('option', {textContent: o[1], value: o[0]});
        }))
    ];
  }

  /**
   * Create color elements for the component
   *
   * @private
   * @return {Element}
   * @method createElColors_
   */
  createElColors_() {
    return createEl(
      'div',
      {className: 'vjs-tracksettings-colors'},
      undefined,
      [
        createEl(
          'fieldset',
          {className: 'vjs-fg-color vjs-tracksetting'},
          undefined,
          [createEl('legend', {textContent: 'Text'})].concat(
            this.createElSelect_('color'),
            createEl(
              'span',
              {className: 'vjs-text-opacity vjs-opacity'},
              undefined,
              this.createElSelect_('textOpacity')))),
        createEl(
          'fieldset',
          {className: 'vjs-bg-color vjs-tracksetting'},
          undefined,
          [createEl('legend', {textContent: 'Background'})].concat(
            this.createElSelect_('backgroundColor'),
            createEl(
              'span',
              {className: 'vjs-bg-opacity vjs-opacity'},
              undefined,
              this.createElSelect_('backgroundOpacity')))),
        createEl(
          'fieldset',
          {className: 'vjs-window-color vjs-tracksetting'},
          undefined,
          [createEl('legend', {textContent: 'Window'})].concat(
            this.createElSelect_('windowColor'),
            createEl(
              'span',
              {className: 'vjs-window-opacity vjs-opacity'},
              undefined,
              this.createElSelect_('windowOpacity'))))
      ]);
  }

  /**
   * Create font elements for the component
   *
   * @private
   * @return {Element}
   * @method createElFont_
   */
  createElFont_() {
    return createEl(
      'div',
      {className: 'vjs-tracksettings-font'},
      undefined,
      [
        createEl(
          'div',
          {className: 'vjs-font-percent vjs-tracksetting'},
          undefined,
          this.createElSelect_('fontPercent')),
        createEl(
          'div',
          {className: 'vjs-edge-style vjs-tracksetting'},
          undefined,
          this.createElSelect_('edgeStyle')),
        createEl(
          'div',
          {className: 'vjs-font-family vjs-tracksetting'},
          undefined,
          this.createElSelect_('fontFamily'))
      ]);
  }

  /**
   * Create controls for the component
   *
   * @private
   * @return {Element}
   * @method createElControls_
   */
  createElControls_() {
    return createEl(
      'div',
      {className: 'vjs-tracksettings-controls'},
      undefined,
      [
        createEl(
          'button',
          {className: 'vjs-default-button', textContent: 'Defaults'}),
        createEl(
          'button',
          {className: 'vjs-done-button', textContent: 'Done'})
      ]);
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    const settings = createEl(
      'div',
      {className: 'vjs-tracksettings'},
      undefined,
      [this.createElColors_(), this.createElFont_(), this.createElControls_()]);

    const heading = createEl(
      'div',
      {
        className: 'vjs-control-text',
        id: `TTsettingsDialogLabel-${this.id_}`,
        textContent: 'Caption Settings Dialog'
      },
      {
        'aria-level': '1',
        'role': 'heading'
      });

    const description = createEl(
      'div',
      {
        className: 'vjs-control-text',
        id: `TTsettingsDialogDescription-${this.id_}`,
        textContent: 'Beginning of dialog window. Escape will cancel and close the window.'
      });

    const doc = createEl(
      'div',
      undefined,
      {role: 'document'},
      [heading, description, settings]);

    return createEl(
      'div',
      {
        className: 'vjs-caption-settings vjs-modal-overlay',
        tabIndex: -1
      },
      {
        'role': 'dialog',
        'aria-labelledby': heading.id,
        'aria-describedby': description.id
      },
      doc);
  }

  /**
   * Gets an object of text track settings (or null).
   *
   * @return {Object}
   *         An object with config values parsed from the DOM or localStorage.
   * @method getValues
   */
  getValues() {
    return Obj.reduce(selectConfigs, (accum, config, key) => {
      const value = getSelectedOptionValue(this.$(config.selector), config.parser);

      if (value !== undefined) {
        accum[key] = value;
      }

      return accum;
    }, {});
  }

  /**
   * Sets text track settings from an object of values.
   *
   * @param {Object} values
   *        An object with config values parsed from the DOM or localStorage.
   * @method setValues
   */
  setValues(values) {
    Obj.each(selectConfigs, (config, key) => {
      setSelectedOption(this.$(config.selector), values[key], config.parser);
    });
  }

  /**
   * Sets all <select> elements to their default values.
   *
   * @method setDefaults
   */
  setDefaults() {
    Obj.each(selectConfigs, config => {
      const index = config.hasOwnProperty('default') ? config.default : 0;

      this.$(config.selector).selectedIndex = index;
    });
  }

  /**
   * Restore texttrack settings
   *
   * @method restoreSettings
   */
  restoreSettings() {
    let values;

    try {
      values = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY));
    } catch (err) {
      log.warn(err);
    }

    if (values) {
      this.setValues(values);
    }
  }

  /**
   * Save text track settings to local storage
   *
   * @method saveSettings
   */
  saveSettings() {
    if (!this.options_.persistTextTrackSettings) {
      return;
    }

    const values = this.getValues();

    try {
      if (Object.keys(values).length) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
      } else {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (err) {
      log.warn(err);
    }
  }

  /**
   * Update display of text track settings
   *
   * @method updateDisplay
   */
  updateDisplay() {
    const ttDisplay = this.player_.getChild('textTrackDisplay');

    if (ttDisplay) {
      ttDisplay.updateDisplay();
    }
  }

}

Component.registerComponent('TextTrackSettings', TextTrackSettings);

export default TextTrackSettings;
