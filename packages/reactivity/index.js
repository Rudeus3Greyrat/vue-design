import reactive from './reactive.js';
import effect from './effect.js';

let data = {
  message: 'Hello',
  name: 'Mei',
};

const obj = reactive(data);

effect(() => {
  effect(() => console.log(obj.name));
  console.log(obj.message);
});

window.setTimeout(() => (obj.message = 'World'), 4000);
