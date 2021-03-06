/**
 *  This file has been adapted from device.js:
 *    https://github.com/borismus/device.js
 */
(function(exports) {

  var MQ_TOUCH = /\(touch-enabled: (.*?)\)/;
  var FORCE_COOKIE = 'force_canonical';

 /**
  * Class responsible for deciding which version of the application to
  * load.
  */
  function VersionManager() {
    // Get a list of all versions.
    this.versions = this.getVersions();
  }

  /**
   * Parse all of the <link> elements in the <head>.
   */
  VersionManager.prototype.getVersions = function() {
    var versions = [];
    // Get all of the link rel alternate elements from the head.
    var links = document.querySelectorAll('head link[rel="alternate"]');
    // For each link element, get href, media and id.
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      var media = links[i].getAttribute('media');
      var id = links[i].getAttribute('id');
      versions.push(new Version(href, media, id));
    }
    // Return an array of Version objects.
    return versions;
  };

  /**
   * Device which version to load.
   */
  VersionManager.prototype.redirectIfNeeded = function() {
    if(this.shouldNotRedirect()) {
      return;
    }
    var version = this.findVersion(Version.prototype.matches);
    if (version) {
      version.redirect();
    }
  };

  VersionManager.prototype.shouldNotRedirect = function() {
    return this.versions.length === 0 ||
      this.readCookie(FORCE_COOKIE) === 'true';
  };

  VersionManager.prototype.readCookie = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  };

  VersionManager.prototype.findVersion = function(criteria) {
    // Go through configured versions.
    for (var i = 0; i < this.versions.length; i++) {
      var v = this.versions[i];
      // Check if this version matches based on criteria.
      if (criteria.call(v)) {
        return v;
      }
    }
    return null;
  };

  function Version(href, mediaQuery, id) {
    this.mediaQuery = mediaQuery;
    this.url = href;
    this.id = id;
  }

  /**
   * Check if this version matches the current one.
   */
  Version.prototype.matches = function() {
    // Apply a polyfill for the touch-enabled media query (not currently
    // standardized, only implemented in Firefox: http://goo.gl/LrmIa)
    var mqParser = new MQParser(this.mediaQuery);
    return mqParser.evaluate();
  };

  /**
   * Redirect to the current version.
   */
  Version.prototype.redirect = function() {
    // prevent infinite redirect loops
    if(window.location.href != this.url) {
      window.location.href = this.url;
    }
  };


  function MQParser(mq) {
    this.mq = mq;
    this.segments = [];
    this.standardSegments = [];
    this.specialSegments = [];

    this.parse();
  }

  MQParser.prototype.parse = function() {
    // Split the Media Query into segments separated by 'and'.
    this.segments = this.mq.split(/\s*and\s*/);
    // Look for segments that contain touch checks.
    for (var i = 0; i < this.segments.length; i++) {
      var seg = this.segments[i];
      // TODO: replace this check with something that checks generally for
      // unknown MQ properties.
      var match = seg.match(MQ_TOUCH);
      if (match) {
        this.specialSegments.push(seg);
      } else {
        // If there's no touch MQ, we're dealing with something standard.
        this.standardSegments.push(seg);
      }
    }
  };

  /**
   * Check if touch support matches the media query.
   */
  MQParser.prototype.evaluateTouch = function() {
    var out = true;
    for (var i = 0; i < this.specialSegments.length; i++) {
      var match = this.specialSegments[i].match(MQ_TOUCH);
      var touchValue = match[1];
      if (touchValue !== "0" && touchValue !== "1") {
        console.error('Invalid value for "touch-enabled" media query.');
      }
      var touchExpected = parseInt(touchValue, 10) === 1 ? true : false;
      out = out && (touchExpected == Modernizr.touch);
    }
    return out;
  };

  /**
   * Returns the valid media query (without touch stuff).
   */
  MQParser.prototype.getMediaQuery = function() {
    return this.standardSegments.join(' and ');
  };

  /**
   * Evaluates the media query with matchMedia.
   */
  MQParser.prototype.evaluate = function() {
    return Modernizr.mq(this.getMediaQuery()) &&
        this.evaluateTouch();

  };

  var vermgr = new VersionManager();
  vermgr.redirectIfNeeded();

})(window);