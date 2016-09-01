'use strict';

import Hammer from 'hammerjs';

class ImageZoom {
  constructor(options = {}) {
    this.options = options;
    return this;
  }

  init(selector) {
    this.$elem = $(selector);
    this.$image = this.$elem.find('img');
    this._manager = new Hammer.Manager(this.$image[0]);
    this._registerGestures();
    this._registerEvents();
    this.scale = 1;
    this.imageOffset = this.$image.offset();
    this.deltaX = 0;
    this.deltaY = 0;
  }

  _registerGestures() {
    const doubleTap = new Hammer.Tap({event: 'doubleTap', taps: 2 });
    const pan = new Hammer.Pan({direction: Hammer.DIRECTION_ALL, threshold: 0});
    const pinch = new Hammer.Pinch();

    pan.recognizeWith([pinch]);
    pinch.requireFailure([pan]);
    this._manager.add([doubleTap, pan, pinch]);
  }

  _registerEvents() {
    this._manager.on('doubleTap', e => {
      let {x, y} = e.center;
      this.scale = this.scale > 1 ? 1 : 3;
      this.$image.css('transition', 'transform 0.5s');
      this._transform(x, y, this.scale );
    });

    this._manager.on('pinch', e => {
      this.$image.css('transition', 'none');
      let {x, y} = e.center;
      this._transform(x,y,e.scale);
    });

    this._manager.on('panstart', e => {
      this.$image.css('transition', 'none');
    });

    this._manager.on('pan', e => {
      if(this.scale === 1){
        return;
      }

      this.currentDeltaX = this.deltaX + e.deltaX;
      this.currentDeltaY = this.deltaY + e.deltaY;

      this.$image.css({
        'transition': 'none',
        'transform':`translate3d(${this.currentDeltaX}px, ${this.currentDeltaY}px, 0px) scale(${this.scale})`
      });
    });

    this._manager.on('panend', e => {
        this.deltaX = this.currentDeltaX;
        this.deltaY = this.currentDeltaY;
    })
  }

  _transform(x, y, scale) {
    scale = scale < 1 ? 1: scale;

    if(scale === 1){
      x = this.x; y = this.y;
    } else {
      x-= this.imageOffset.left;
      y-= this.imageOffset.top;
    }

    this.$image.css({
      'transform-origin': `${x}px ${y}px`,
      'transform': `scale(${scale})`
    });

    this.x = x;
    this.y = y;
    this.scale = scale;
  }

  _unregisterEvents() {
    this._manager.off('pan');
    this._manager.off('pinch');
    this._manager.off('doubletap');
  }

  destroy() {
    this._unregisterEvents();
    this._manager = null;
  }
}

export default {
  ImageZoom
};
