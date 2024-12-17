/**
 * @file Slide group element definition.
 */
import { html, children } from 'hybrids';

export const NinjaSlides = {
  tag: 'ninja-slides',
  items: children(({ tag }) => tag == 'ninja-slide'),
  height: 100,
  width: 100,
  unit: '%', // Any CSS unit is allowed. Defaults here.

  // Sets and returns active item by name
  index: {
    connect: (host) => {
      const activeItemIndex = host.items.findIndex(({ active }) => active) || 0;
      host.index = activeItemIndex;
    },
    observe: (host, index) => {
      // Set slide active states based on index.
      host.items.forEach(
        (slide, slideIndex) => (slide.active = slideIndex == index)
      );
    },
    value: 0,
  },
  home: '',

  render: ({ height, width, unit, items, index }) => html`
    <style>
      :host {
        display: block;
        position: relative;
        overflow: hidden;
      }
      .slide-wrapper {
        width: ${`${width - 1}${unit}`};
        box-shadow:
          -3px 0 0 0 var(--border-color),
          3px 0 0 0 var(--border-color),
          0 -3px 0 0 var(--border-color),
          0 3px 0 0 var(--border-color);
        overflow: hidden;
        margin: 3px;
      }
      .slides {
        height: 100%;
        display: grid;
        width: ${`${items.length * width}${unit}`};
        grid-template-columns: repeat(${items.length}, 1fr);
        transition: margin-left 0.5s ease;
        margin-left: ${`-${index * width}${unit}`};
      }
    </style>
    <div class="slide-wrapper">
      <div class="slides is-boxed">
        <slot></slot>
      </div>
    </div>
  `,
};
