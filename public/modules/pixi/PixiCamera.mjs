/**
 * @file NinjaNode Pixi.js Render Library: PixiCamera
 *   Viewport wrapper for managing a virtual camera.
 */

import { Viewport } from 'pixi-viewport';
import { Container } from 'pixi.js';

export class PixiCamera {
  viewport;
  target;
  playArea;
  filters = {};
  layers = {};
  globalContainer;

  constructor({ app, playArea, layers }) {
    this.playArea = playArea;
    this.globalContainer = new Container();

    // Setup named layers, reverse order.
    for (let index = layers.length - 1; index >= 0; index--) {
      const name = layers[index];
      this.layers[name] = new Container();
      this.globalContainer.addChild(this.layers[name]);
    }

    const viewport = new Viewport({
      // screenWidth: window.innerWidth,              // screen width used by viewport (eg, size of canvas)
      // screenHeight: window.innerHeight,            // screen height used by viewport (eg, size of canvas)
      worldWidth: playArea, // world width used by viewport (automatically calculated based on container width)
      worldHeight: playArea, // world height used by viewport (automatically calculated based on container height)
      // threshold: 5,                                // number of pixels to move to trigger an input event (e.g., drag, pinch) or disable a clicked event
      passiveWheel: false, // whether the 'wheel' event is set to passive (note: if false, e.preventDefault() will be called when wheel is used over the viewport)
      events: app.renderer.events,
      // stopPropagation: false,                      // whether to stopPropagation of events that impact the viewport (except wheel events, see options.passiveWheel)
      // forceHitArea: null,                          // change the default hitArea from world size to a new value
      // noTicker: false,                             // set this if you want to manually call update() function on each frame
      // ticker: PIXI.Ticker.shared,                  // use this PIXI.ticker for updates
      // interaction: this.app.renderer.plugins.interaction, // InteractionManager, available from instantiated WebGLRenderer/CanvasRenderer.plugins.interaction - used to calculate pointer position relative to canvas location on screen
      // divWheel: null,                              // div to attach the wheel event (uses document.body as default)
      // disableOnContextMenu: false,                 // remove oncontextmenu=() => {} from the divWheel element
    });

    // Add global container to viewport directly.
    viewport.addChild(this.globalContainer);

    // this.viewport.bounce({
    //   sides: 'all', // all, horizontal, vertical, or combination of top, bottom, right, left(e.g., 'top-bottom-right')
    //   friction: 0.5, // friction to apply to decelerate if active
    //   time: 150, // time in ms to finish bounce
    //   // bounceBox: null, // use this bounceBox instead of { x: 0, y: 0, width: viewport.worldWidth, height: viewport.worldHeight }
    //   ease: 'easeInOutSine', // ease function or name (see http://easings.net/ for supported names)
    //   underflow: 'center', // (top/bottom/center and left/right/center, or center) where to place world if too small for screen
    // });

    //   viewport
    //     .drag({
    //       // direction: 'all',                // (x, y, or all) direction to drag
    //       // pressDrag: true,                 // whether click to drag is active
    //       // wheel: true,                     // use wheel to scroll in direction (unless wheel plugin is active)
    //       // wheelScroll: 1,                  // number of pixels to scroll with each wheel spin
    //       // reverse: false,                  // reverse the direction of the wheel scroll
    //       // clampWheel: false,               // clamp wheel (to avoid weird bounce with mouse wheel)
    //       // underflow: 'center',             // (top-left, top-center, etc.) where to place world if too small for screen
    //       // factor: 1,                       // factor to multiply drag to increase the speed of movement
    //       // mouseButtons: 'all',             // changes which mouse buttons trigger drag, use: 'all', 'left', right' 'middle', or some combination, like, 'middle-right'; you may want to set viewport.options.disableOnContextMenu if you want to use right-click dragging
    //       // keyToPress: null,                // array containing https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code codes of keys that can be pressed for the drag to be triggered, e.g.: ['ShiftLeft', 'ShiftRight'}
    //       // ignoreKeyToPressOnTouch: false,  // ignore keyToPress for touch events
    //       // lineHeight: 20,                  // scaling factor for non-DOM_DELTA_PIXEL scrolling events (used for firefox mouse scrolling)
    //     })
    //     .decelerate({
    //       // friction: 0.95,              // percent to decelerate after movement
    //       // bounce: 0.8,                 // percent to decelerate when past boundaries (only applicable when viewport.bounce() is active)
    //       // minSpeed: 0.01,              // minimum velocity before stopping/reversing acceleration
    //     })
    //     .pinch({
    //       // noDrag: false,               // disable two-finger dragging
    //       // percent: 1,                  // percent to modify pinch speed
    //       // factor: 1,                   // factor to multiply two-finger drag to increase the speed of movement
    //       // center: null,                // place this point at center during zoom instead of center of two fingers
    //       // axis: 'all',                 // axis to zoom
    //     })
    //     .wheel({
    //       // percent: 0.1,                // smooth the zooming by providing the number of frames to zoom between wheel spins
    //       // interrupt: true,             // stop smoothing with any user input on the viewport
    //       // reverse: false,              // reverse the direction of the scroll
    //       // center: null,                // place this point at center during zoom instead of current mouse position
    //       // lineHeight: 20,	            // scaling factor for non-DOM_DELTA_PIXEL scrolling events
    //       // axis: 'all',                 // axis to zoom
    //     });

    //   // viewport.animate({
    //   //     time: 1000,                     // time to animate
    //   //     position: null,                 // position to move viewport
    //   //     width: null,                    // desired viewport width in world pixels (use instead of scale; aspect ratio is maintained if height is not provided)
    //   //     height: null,                   // desired viewport height in world pixels(use instead of scale; aspect ratio is maintained if width is not provided)
    //   //     scale: null,                    // scale to change zoom(scale.x = scale.y)
    //   //     scaleX: null,                   // independently change zoom in x - direction
    //   //     scaleY: null,                   // independently change zoom in y - direction
    //   //     ease: 'linear',                 // easing function to use
    //   //     callbackOnComplete: null,       // callback when animate is complete
    //   //     removeOnInterrupt: false,	   // removes this plugin if interrupted by any user input
    //   // })

    //   // viewport.clamp({
    //   //     left: false,                // whether to clamp to the left and at what value
    //   //     right: false,               // whether to clamp to the right and at what value
    //   //     top: false,                 // whether to clamp to the top and at what value
    //   //     bottom: false,              // whether to clamp to the bottom and at what value
    //   //     direction: 'all',           // (all, x, or y) using clamps of [0, viewport.worldWidth / viewport.worldHeight]; replaces left / right / top / bottom if set
    //   //     underflow: 'center',	       // where to place world if too small for screen (e.g., top - right, center, none, bottomleft)
    //   // })

    //   // viewport.clampZoom({
    //   //     minWidth: null,                 // minimum width
    //   //     minHeight: null,                // minimum height
    //   //     maxWidth: null,                 // maximum width
    //   //     maxHeight: null,                // maximum height
    //   //     minScale: null,                 // minimum scale
    //   //     maxScale: null,                 // minimum scale
    //   // })

    //   // target.start()  // starts the target moving
    //   // viewport.follow(target.get(), {
    //   //     speed: 0,           // speed to follow in pixels/frame (0=teleport to location)
    //   //     acceleration: null, // set acceleration to accelerate and decelerate at this rate; speed cannot be 0 to use acceleration
    //   //     radius: null,       // radius (in world coordinates) of center circle where movement is allowed without moving the viewport
    //   // })

    //   // viewport.mouseEdges({
    //   //     radius: null,           // distance from center of screen in screen pixels
    //   //     distance: 20,           // distance from all sides in screen pixels
    //   //     top: null,              // alternatively, set top distance (leave unset for no top scroll)
    //   //     bottom: null,           // alternatively, set bottom distance (leave unset for no top scroll)
    //   //     left: null,             // alternatively, set left distance (leave unset for no top scroll)
    //   //     right: null,            // alternatively, set right distance (leave unset for no top scroll)
    //   //     speed: 8,               // speed in pixels/frame to scroll viewport
    //   //     reverse: false,         // reverse direction of scroll
    //   //     noDecelerate: false,    // don't use decelerate plugin even if it's installed
    //   //     linear: false,          // if using radius, use linear movement (+/- 1, +/- 1) instead of angled movement (Math.cos(angle from center), Math.sin(angle from center))
    //   //     allowButtons: false,    // allows plugin to continue working even when there's a mousedown event
    //   // })

    //   // viewport.snap({
    //   //     topLeft: false,             // snap to the top-left of viewport instead of center
    //   //     friction: 0.8,              // friction/frame to apply if decelerate is active
    //   //     time: 1000,                 // time for snapping in ms
    //   //     ease: 'easeInOutSine',      // ease function or name (see http://easings.net/ for supported names)
    //   //     interrupt: true,            // pause snapping with any user input on the viewport
    //   //     removeOnComplete: false,    // removes this plugin after snapping is complete
    //   //     removeOnInterrupt: false,   // removes this plugin if interrupted by any user input
    //   //     forceStart: false,          // starts the snap immediately regardless of whether the viewport is at the desired location
    //   // })

    //   // viewport.snapZoom({
    //   //     width: 0,                   // the desired width to snap (to maintain aspect ratio, choose only width or height)
    //   //     height: 0,                  // the desired height to snap(to maintain aspect ratio, choose only width or height)
    //   //     time: 1000,                 // time for snapping in ms
    //   //     ease: 'easeInOutSine',      // ease function or name(see http://easings.net/ for supported names)
    //   //     center: null,               // place this point at center during zoom instead of center of the viewport
    //   //     interrupt: true,            // pause snapping with any user input on the viewport
    //   //     removeOnComplete: false,    // removes this plugin after snapping is complete
    //   //     removeOnInterrupt: false,   // removes this plugin if interrupted by any user input
    //   //     forceStart: false,          // starts the snap immediately regardless of whether the viewport is at the desired zoom
    //   //     noMove: false,              // zoom but do not move
    //   // })

    //   // create elements
    //   // stars(viewport, STAR_SIZE, BORDER);
    //   // target.setup(viewport);
    //   // border(viewport, BORDER);

    //   // fit and center the world into the panel
    //   // viewport.fit();
    //   // viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    // }

    // Fit and center the world into the panel.
    // viewport.fit()
    // viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    // activate plugins
    viewport.drag().pinch().wheel().decelerate();

    // Bind to resize.
    window.onresize = () => {
      this.viewport.resize(window.innerWidth, window.innerHeight);
    };

    // Add viewport to app stage (only child).
    app.stage.addChild(viewport);
    this.viewport = viewport;
  }

  toGlobalScreen({ x, y }) {
    const offset = this.viewport.getVisibleBounds();
    const gPos = this.viewport.toScreen({ x, y });
    const scale = this.viewport.scale.x;

    return {
      x: gPos.x + (offset.x < 0 ? offset.x * scale : 0),
      y: gPos.y + (offset.y < 0 ? offset.y * scale : 0),
    };
  }

  getStage(name) {
    return this.layers[name] ?? this.viewport;
  }

  addFilter(name, filter) {
    // Destroy any existing named filter.
    if (this.filters[name]) {
      this.removeFilter(name);
    }

    this.filters[name] = filter;
    this.globalContainer.filters = Object.values(this.filters);
    return filter;
  }

  removeFilter(name) {
    const filter = this.filters?.[name];
    if (filter) {
      delete this.filters[name];
      this.globalContainer.filters = Object.values(this.filters);
      filter.destroy();
    }
  }

  follow(ship) {
    this.target = ship;
    this.viewport.follow(ship.container);
  }

  unfollow(id) {
    if (this.target && (!id || this.target.id === id)) {
      this.viewport.plugins.remove('follow');
      this.viewport.fit();
      this.viewport.moveCenter(this.playArea / 2, this.playArea / 2);
      this.target = null;
    }
  }

  setZoom(scale) {
    this.viewport.scale = scale;
  }
}
