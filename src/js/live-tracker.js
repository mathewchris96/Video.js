import Component from './component.js';

/* track when we are at the live edge, and other helpers for live playback */
class LiveTracker extends Component {

  isBehind_() {
    const liveCurrentTime = this.liveCurrentTime();
    const currentTime = this.player_.currentTime();
    const isBehind = liveCurrentTime !== Infinity && liveCurrentTime - 1 >= currentTime;

    if (isBehind !== this.behindLiveEdge()) {
      this.behindLiveEdge_ = isBehind;
      this.trigger('live-edge-change');
    }
  }

  // all the functionality for tracking when seek end changes
  // and for tracking how far past seek end we should be
  trackLive_() {
    this.pastSeekEnd_ = this.pastSeekEnd_ || 0;
    const lastSeekEnd = this.lastSeekEnd_;
    const seekable = this.player_.seekable();

    // skip undefined seekable
    if (!seekable || !seekable.length) {
      return;
    }

    const newSeekEnd = seekable.end(0);

    // we can only tell if we are behing live, when seekable changes
    // once we detect that seekable has changed we check the new seek
    // end against current time, with a fudge value of half a second.
    if (newSeekEnd !== lastSeekEnd) {
      this.pastSeekEnd_ = 0;
      this.lastSeekEnd_ = newSeekEnd;
      this.trigger('seek-end-change');
    }

    this.pastSeekEnd_ = this.pastSeekEnd() + 0.03;

    this.isBehind_();
  }

  /**
   * start tracking live playback
   */
  start() {
    if (this.started()) {
      return;
    }
    /*
    this.on(this.player_, 'seeked', this.handleSeekEndChange);
    this.on(this.player_, 'playing', this.handleSeekEndChange);

    // 'playing'
    this.on(this.player_, ['ended', 'pause', 'waiting']);
    this.on(this.player_, ['timeupdate', 'ended'], this.update);*/

    this.trackingInterval_ = this.setInterval(this.trackLive_, 30);
    this.trackLive_();
  }

  /**
   * stop tracking live playback
   */
  stop() {
    if (!this.started()) {
      return;
    }
    this.pastSeekEnd_ = 0;
    this.lastSeekEnd_ = null;
    this.behindLiveEdge_ = null;

    this.clearInterval(this.trackingInterval_);
    this.trackingInterval_ = null;
  }

  /**
   * A helper to get the player seekable end
   * so that we don't have to null check everywhere
   */
  seekEnd() {
    const seekable = this.player_.seekable();

    if (!seekable || !seekable.length) {
      return Infinity;
    }

    return seekable.end(0);
  }

  /**
   * A helper to get the player seekable start
   * so that we don't have to null check everywhere
   */
  seekStart() {
    const seekable = this.player_.seekable();

    if (!seekable || !seekable.length) {
      return 0;
    }

    return seekable.start(0);
  }

  /**
   * Get the live time window
   */
  liveTimeWindow() {
    const seekable = this.player_.seekable();

    if (!seekable || !seekable.length) {
      return 0;
    }

    return seekable.end(0) - seekable.start(0);
  }

  /**
   * Determines if the player is live, only checks wether this component
   * is tracking live playback or not
   */
  isLive() {
    return this.started();
  }

  /**
   * Determines if currentTime is at the live edge and won't fall behind
   * on each seek-end-change
   */
  atLiveEdge() {
    return !this.behindLiveEdge();
  }

  /**
   * get what we expect the live current time to be
   */
  liveCurrentTime() {
    return this.pastSeekEnd() + this.seekEnd();
  }

  /**
   * Returns how far past seek end we expect current time to be
   */
  pastSeekEnd() {
    return this.pastSeekEnd_ || 0;
  }

  /**
   * If we are currently behind the live edge, aka currentTime will be
   * behind on a seek-end-change
   */
  behindLiveEdge() {
    return this.behindLiveEdge_;
  }

  started() {
    return typeof this.trackingInterval_ === 'number';
  }

  /**
   * Seek to the live edge if we are behind the live edge
   */
  seekToLiveEdge() {
    if (this.atLiveEdge()) {
      return;
    }

    this.one('seek-end-change', () => {
      this.player_.currentTime(this.seekEnd());
    });
  }
}

Component.registerComponent('LiveTracker', LiveTracker);
export default LiveTracker;
