import { html } from 'hybrids';

export const NinjaMeter = {
  tag: 'ninja-meter',
  ratio: 0.0,
  wiggle: false,
  flipped: false,
  label: '',

  render: ({ ratio, flipped, label }) => html`
    <style>
      :host {
        display: inline-block;
        overflow: hidden;
        position: relative;
        height: 35px;
        width: 50px;
      }
      .meter {
        position: absolute;
        left: 0;
        top: 0;
      }
      .point {
        position: absolute;
        left: 22px;
        top: -4px;
        z-index: 1;
      }
      span {
        font-size: 7px;
        position: absolute;
        bottom: 0;
        display: block;
        text-align: center;
        width: 100%;
      }
    </style>
    <ninja-icon
      origin="4px 29px"
      angle=${ratio * 170 - 95}
      class="point"
      name="cust-meter-point"
    ></ninja-icon>
    <ninja-icon
      class="meter"
      name="cust-meter-to-${flipped ? 'bad' : 'good'}"
      size="50"
    ></ninja-icon>
    ${label && html`<span>${label}</span>`}
  `,
};
