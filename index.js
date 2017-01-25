'use strict';

import Hammer from 'hammerjs';
import CustomEvent from 'custom-event';

class PhotoViewManager {
  constructor(options = {}) {
    const defaultOptions = {
      maxScale: 2,
      enableMultiZoom: false,
      snapToGrid: true,
      tapToZoom: false
    };

    this.options = Object.assign(defaultOptions, options);
    return this;
  }

  init(selector) {
    let container = typeof selector === 'string' ? document.querySelectorAll(selector)[0] : selector;
    if (!container) {
      console.warn(`You must provide a valid container for PhotoView (selector "${selector}" did not match any element)`);
      return;
    }

    this.image = container.querySelectorAll('img')[0];
    if (!this.image) {
      console.warn(`You must have a valid img tag inside your container`);
      return;
    }

    this._manager = new Hammer.Manager(this.image, { touchAction: 'pan-y' });
    this._registerGestures();
    this._registerEvents();
    this.scale = 1;
    this.deltaX = 0;
    this.deltaY = 0;
    return this;
  }
  _dispatchEvent(type, detail) {
    let event = new CustomEvent(
        type,
        {
            bubbles: true,
            cancelable: true,
            detail: detail
        }
    );

    document.dispatchEvent(event);
  }
  _registerGestures() {
    const tap = new Hammer.Tap({ event: 'zoom', taps: 1 });
    const doubleTap = new Hammer.Tap({ event: 'zoom', taps: 2 });
    const pan = new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 10 });
    const pinch = new Hammer.Pinch();
    let gestures = [pinch, doubleTap, pan];
    if(this.options.tapToZoom){
      doubleTap.recognizeWith(tap);
      tap.requireFailure(doubleTap);
      gestures.splice(2,-1, tap);
    }

    this._manager.add(gestures);
  }

  _getZoomLevel() {
    let scale;
    if (this.options.enableMultiZoom) {
      let midScale = this.options.maxScale / 2;
      scale = this.scale === 1 ? midScale : (this.scale === midScale) ? this.options.maxScale : 1;
    } else {
      scale = this.scale > 1 ? 1 : this.options.maxScale;
    }

    return scale;
  }

  handleTouchEvent() {
    this._dispatchEvent('photoview.scale.changed', {scale : this.scale})
  }

  _registerEvents() {
    this._manager.on('zoom', e => {
      let {x, y} = e.center;
      let scale = this._getZoomLevel();
      this._setTransition(true);
      this._transform(x, y, scale);
      this.handleTouchEvent();
    });

    this._manager.on('pinchstart', e => {
      clearTimeout(this.panTimer);
      this._enableGesture('pan', false);
      let {x, y} = e.center;
      this._setTransition(true);

      if (this.scale === 1) {
        this.pinchX = x;
        this.pinchY = y;
      }

    });

    this._manager.on('pinch', e => {
      if (e.additionalEvent === 'pinchout') {
        this._transform(this.pinchX, this.pinchY, this.options.maxScale);
      } else if (e.additionalEvent === 'pinchin') {
        this._transform(0, 0, 1);
      }

      this.handleTouchEvent();
    });

    this._manager.on('pinchend', e => {
      this.panTimer = setTimeout(_ => this._enableGesture('pan', true), 1000);
    });

    this._manager.on('panstart', e => {
      this._setTransition(false);
    });

    this._manager.on('pan', e => {
      if (this.scale === 1) {
        return;
      }

      e.srcEvent.stopPropagation();
      this.currentDeltaX = (isNaN(this.deltaX) ? 0 : this.deltaX) + e.deltaX;
      this.currentDeltaY = (isNaN(this.deltaY) ? 0 : this.deltaY) + e.deltaY;
      if (this.options.snapToGrid) {
        this._adjustSnapPositions();
      }

      this._setTransition(false);
      this.image.style.transform = `translate3d(${this.currentDeltaX}px, ${this.currentDeltaY}px, 0px) scale(${this.scale})`;
    });

    this._manager.on('panend', e => {
      this.deltaX = this.currentDeltaX;
      this.deltaY = this.currentDeltaY;
    });
  }

  _adjustSnapPositions() {
    let imageOffsetLeft = this.image.offsetLeft;
    let imageOffsetTop = this.image.offsetTop;
    if (this.currentDeltaX + imageOffsetLeft > this.x) {
      this.currentDeltaX = this.x - imageOffsetLeft;
    } else if (this.x - this.currentDeltaX + imageOffsetLeft > this.image.width) {
      let adjustWidth = (this.x - this.currentDeltaX + imageOffsetLeft) - this.image.width;
      this.currentDeltaX = (this.currentDeltaX + adjustWidth);
    }

    if (this.currentDeltaY + imageOffsetTop > this.y) {
      this.currentDeltaY = (this.y - imageOffsetTop);
    } else if (this.y - this.currentDeltaY + imageOffsetTop > this.image.height) {
      let adjustHeight = (this.y - this.currentDeltaY + imageOffsetTop) - this.image.height;
      this.currentDeltaY = this.currentDeltaY + adjustHeight;
    }

  }

  _transform(x, y, scale) {
    if (scale === 1) {
      x = this.x; y = this.y;
    } else {
      x -= this.image.offsetLeft;
      y -= this.image.offsetTop;
    }

    this.image.style['transformOrigin'] = `${x}px ${y}px`;
    this.image.style.transform = `scale3d(${scale},${scale},1)`;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this._onTransformEnd();
  }

  _onTransformEnd() {
    if (this.scale <= 1) {
      this.deltaX = this.deltaY = 0;
    }
  }

  _enableGesture(gesture, value) {
    this._manager.get(gesture).set({ enable: value });
  }

  _setTransition(value) {
    this.image.style.transition = value ? 'transform 0.5s' : 'none';
  }

  _unregisterEvents() {
    this._manager.off('pan');
    this._manager.off('pinch');
    this._manager.off('zoom');
  }

  reset() {
    this.image.style.transform = 'none';
  }

  destroy() {
    this._unregisterEvents();
    this._manager = null;
  }
}

class PhotoView {
  constructor(selector, options = {}) {
    this.instances = [];
    let slice = Array.prototype.slice;
    let elements = slice.call(document.querySelectorAll(selector));
    elements.forEach(item => {
      this.instances.push(
        new PhotoViewManager(options).init(item)
      );
    });

  }

  reset() {
    this.instances.forEach(photoViewInstance => {
      photoViewInstance.reset();
    });
  }

  destroy() {
    this.instances.forEach(photoViewInstance => {
      photoViewInstance.destroy();
    });

    this.instances = null;
  }
}

export default PhotoView;
