import { reactive, effect, computed } from './packages/reactivity/index.js';
let data = {
  count: 0,
  num: 10,
};

const obj = reactive(data);

const price = computed(() => obj.count * obj.num);

console.log(price.value);

window.setTimeout(() => {
  obj.count = 100;
  console.log(price.value);
}, 2000);
