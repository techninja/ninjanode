/**
 * @file App build and define all components in the DOM.
 */
import { define } from 'hybrids';
import * as components from './components/index.mjs';
Object.values(components).forEach((element) => {
  define(element);
});
