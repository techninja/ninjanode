// What is the map?
// - Viewport around world sized space
// - Take element init and updates for placement
// - Match position with parent viewport

const {
  Container,
  Graphics,
  TilingSprite,
  Texture,
  filters: { CRTFilter },
} = window.PIXI;

export class PixiMap {
  app;
  container;
  ticker;
  stage;

  constructor({ socket, app, gameConfig }) {
    this.app = app;
    this.config = gameConfig;
    const { playArea } = gameConfig;

    this.container = new Container();

    // Container holds all map elements at top level.
    app.stage.addChild(this.container);

    // Stage container holds map contents.
    this.stage = new Container();

    const background = new TilingSprite({
      texture: Texture.from('grid'),
      width: playArea,
      height: playArea,
      x: -500,
      y: -500,
      scale: 0.25,
    });

    this.stage.addChild(background);
    this.container.addChild(this.stage);

    // Fix primary container to bottom right.
    this.container.position = { x: app.screen.width, y: app.screen.height };

    const frame = new Graphics();
    frame.circle(-50, -50, 150);
    frame.fill(0xff0000);

    this.container.addChild(frame);
    this.stage.mask = frame;

    this.filters = {
      tv: new CRTFilter({
        curvature: 2,
        lineContrast: 0.8,
      }),
    };

    this.stage.filters = Object.values(this.filters);

    // Init ticker to keep position matched.
    this.initTicker();
  }

  initTicker() {
    this.ticker = () => {
      this.tickerCallback();
    };

    this.app.ticker.add(this.ticker);
  }

  tickerCallback() {
    // TODO: Only do this on window resize?
    this.container.position = {
      x: this.app.screen.width,
      y: this.app.screen.height,
    };

    this.filters.tv.time = this.filters.tv.time + 0.1;
  }
}
