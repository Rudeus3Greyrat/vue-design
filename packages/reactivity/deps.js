// 触发依赖
import {activeEffect} from "./effect.js";
import {TriggerType} from "./constant.js";
import {ITERATE_KEY} from "./reactive.js";
import {MAP_KEY_ITERATE_KEY} from "./map.js";

// 控制是否追踪的全局变量
export let shouldTrack = true
// 存储所有副作用函数的大桶
const bucket = new WeakMap();

export const trigger = (target, key, type, value) => {
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
    if (type === TriggerType.ADD || type === TriggerType.DELETE || (
        type === TriggerType.SET && Object.prototype.toString.call(target) === '[object Map]'
    )) {
        const iterateDeps = depsMap.get(ITERATE_KEY)
        // ITERATE_KEY关联的副作用函数也需要添加到effectsToRun
        iterateDeps.forEach((effect) => {
            if (effect !== activeEffect) {
                effectsToRun.add(effect);
            }
        });
    }
    if ((type === TriggerType.ADD || type === TriggerType.DELETE) && (
        Object.prototype.toString.call(target) === '[object Map]'
    )) {
        const iterateDeps = depsMap.get(MAP_KEY_ITERATE_KEY)
        // MAP_KEY_ITERATE_KEY关联的副作用函数也需要添加到effectsToRun
        iterateDeps.forEach((effect) => {
            if (effect !== activeEffect) {
                effectsToRun.add(effect);
            }
        });
    }
    if (type === TriggerType.ADD && Array.isArray(target)) {
        const lengthDeps = depsMap.get('length')
        // 如果是数组增加操作，会改变数组长度，与数组长度关联的副作用函数也需要添加到effectsToRun
        lengthDeps.forEach((effect) => {
            if (effect !== activeEffect) {
                effectsToRun.add(effect);
            }
        });
    }
    if (Array.isArray(target) && key === 'length') {
        // 如果变更数组length，所有索引大于等于新长度的项都会被影响，他们的effects也要加入到要触发的依赖中
        depsMap.forEach((deps, key) => {
            if (key >= value) {
                deps.forEach((effect) => {
                    if (effect !== activeEffect) {
                        effectsToRun.add(effect);
                    }
                });
            }
        })
        // 如果是数组增加操作，会改变数组长度，与数组长度关联的副作用函数也需要添加到effectsToRun
        deps.forEach((effect) => {
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
export const track = (target, key) => {
    if (!activeEffect || !shouldTrack) return
    // 判断对应结构是否存在，不存在则新建
    let depsMap = bucket.get(target);
    if (!depsMap) bucket.set(target, (depsMap = new Map()));
    let deps = depsMap.get(key);
    if (!deps) depsMap.set(key, (deps = new Set()));
    // 最终目的是把当前的effect收集进入依赖集合
    deps.add(activeEffect);
};
