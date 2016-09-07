'use strict';

import Hammer from 'hammerjs';

class PhotoView {
  constructor(options = {}) {
    this.options = options;
    return this;
  }

  init(selector) {
    let container = document.querySelectorAll(selector)[0];

    if (!container) {
      console.warn(`You must provide a valid container for PhotoView (selector "${selector}" did not match any element)`);
      return;
    }

    this.image = container.querySelectorAll('img')[0];

    if (!this.image) {
      console.warn(`You must have a valid img tag inside your container`);
      return;
    }

    this._manager = new Hammer.Manager(this.image);
    this._registerGestures();
    this._registerEvents();
    this.scale = 1;
    this.imageOffset = {top: this.image.offsetTop, left: this.image.offsetLeft};
    this.deltaX = 0;
    this.deltaY = 0;
  }

  _registerGestures() {
    const zoom = new Hammer.Tap({event: 'zoom', taps: 2 });
    const pan = new Hammer.Pan({direction: Hammer.DIRECTION_ALL, threshold: 0});
    const pinch = new Hammer.Pinch();

    pan.recognizeWith([pinch]);
    pinch.requireFailure([pan]);
    this._manager.add([zoom, pan, pinch]);
  }

  _registerEvents() {
    this._manager.on('zoom', e => {
      let {x, y} = e.center;
      this.scale = this.scale > 1 ? 1 : 3;
      this.image.style.transition = 'transform 0.5s';
      this._transform(x, y, this.scale );
    });

    this._manager.on('pinch', e => {
      this.image.style.transition = 'none';
      let {x, y} = e.center;
      this._transform(x,y,e.scale);
    });

    this._manager.on('panstart', e => {
      this.image.style.transition = 'none';
    });

    this._manager.on('pan', e => {
      if(this.scale === 1){
        return;
      }

      this.currentDeltaX = this.deltaX + e.deltaX;
      this.currentDeltaY = this.deltaY + e.deltaY;
      this.image.style.transition = 'none';
      this.image.style.transform = `translate3d(${this.currentDeltaX}px, ${this.currentDeltaY}px, 0px) scale(${this.scale})`;
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

    this.image.style['transformOrigin'] = `${x}px ${y}px`;
    this.image.style.transform = `scale(${scale})`;

    this.x = x;
    this.y = y;
    this.scale = scale;
  }

  _unregisterEvents() {
    this._manager.off('pan');
    this._manager.off('pinch');
    this._manager.off('zoom');
  }

  destroy() {
    this._unregisterEvents();
    this._manager = null;
  }
}

export default {
  PhotoView
};
