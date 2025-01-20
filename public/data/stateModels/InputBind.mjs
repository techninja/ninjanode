import { store } from 'hybrids';
import { connectLocalStorage } from 'models';

export const InputBind = {
  id: true,
  device: '',
  trigger: '',
  command: '',
  [store.connect]: connectLocalStorage('InputBind'),
};
