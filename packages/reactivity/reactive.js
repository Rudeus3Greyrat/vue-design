import { activeEffect } from './effect.js';
import {TriggerType} from "./constant";
// 存储所有副作用函数的大桶
const bucket = new WeakMap();
// for-in循环遍历的键
const ITERATE_KEY = Symbol()
// 触发依赖
const trigger = (target, key,type) => {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  if (!deps) return;
  const effectsToRun = new Set();
  // 增加触发守卫
  deps.forEach((effect) => {
    if (effect !== activeEffect) {
      effectsToRun.add(effect);
    }
  });
  if(type===TriggerType.ADD||type===TriggerType.DELETE){
    const iterateDeps = depsMap.get(ITERATE_KEY)
    // ITERATE_KEY关联的副作用函数也需要添加到effectsToRun
    iterateDeps.forEach((effect) => {
      if (effect !== activeEffect) {
        effectsToRun.add(effect);
      }
    });
  }
  // 执行依赖集合里的所有依赖
  effectsToRun.forEach((effectFn) => {
    // 如果传入调度器，则交由调度器执行
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler();
    } else {
      effectFn();
    }
  });
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
const createReactive=(obj,isShallow=false,isReadonly=false)=>{
  return new Proxy(obj, {
    get(target, p, receiver) {
      if(p==='raw') return target
      const res = Reflect.get(target, p, receiver)
      // 在读取时追踪依赖
      if(!isReadonly) track(target, p);
      if(isShallow){
        return res
      }
        if(typeof res === 'object'&&res!==null){
          return isReadonly?readonly(res):reactive(res)
        }
        return res
    },
    set(target, p, value, receiver) {
      if(isReadonly){
        console.warn(`${p}是只读的`)
        return true
      }
      const oldVal = target[p]
      const type=Object.prototype.hasOwnProperty.call(target,p)?'SET':'ADD'
      // 在设置后触发依赖
      const res=Reflect.set(target, p, value, receiver);
      // 屏蔽原型引起的更新
      if(receiver.raw===target){
        if((oldVal!==value)&&(oldVal===oldVal||value===value)) trigger(target, p,type)
      }
      return res;
    },
    has(target, p) {
      // 在调用key in obj时追踪依赖
      track(target,p)
      return Reflect.has(target,p)
    },
    ownKeys(target) {
      // 在调用for-in循环时追踪依赖
      track(target,ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    deleteProperty(target, p) {
      if(isReadonly){
        console.warn(`${p}是只读的`)
        return true
      }
      const hadKey = Object.prototype.hasOwnProperty.call(target,p)
      const res=Reflect.deleteProperty(target,p)
      if(res&&hadKey){
        trigger(target,p,TriggerType.DELETE)
      }
      return res
    }
  });
}
const reactive = (obj) => {
  return createReactive(obj)
};
const shallowReactive=(obj)=>{
  return createReactive(obj,true)
}
const readonly = (obj) => {
  return createReactive(obj,false,true)
};
const shallowReadonly=(obj)=>{
  return createReactive(obj,true,true)
}

export { track, trigger,reactive,shallowReactive,readonly,shallowReadonly };
