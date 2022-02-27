import { activeEffect } from './effect.js';
// 存储所有副作用函数的大桶
const bucket = new WeakMap();
// 触发依赖
const trigger = (target, key) => {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  if (!deps) return;
  const effectsToRun = new Set(deps);
  // 执行依赖集合里的所有依赖
  effectsToRun.forEach((effectFn) => effectFn());
};
// 追踪依赖
const track = (target, key) => {
  // 判断对应结构是否存在，不存在则新建
  let depsMap = bucket.get(target);
  if (!depsMap) bucket.set(target, (depsMap = new Map()));
  let deps = depsMap[key];
  if (!deps) depsMap.set(key, (deps = new Set()));
  // 最终目的是把当前的effect收集进入依赖集合
  deps.add(activeEffect);
};
const reactive = (data) => {
  const obj = new Proxy(data, {
    get(target, key) {
      const res = Reflect.get(target, key);
      // 在读取时追踪依赖
      track(target, key);
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
      // 在设置后触发依赖
      trigger(target, key);
      return res;
    },
  });
  return obj;
};

export default reactive;
