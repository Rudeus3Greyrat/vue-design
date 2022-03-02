import {TriggerType} from "./constant.js";
import {arrayInstrumentations} from "./array.js";
import {createReactiveMap} from "./map.js";
import {track, trigger} from "./deps.js";

// 定义一个map，存储原始对象到代理对象的映射
const reactiveMap = new Map()
// 循环遍历的键
export const ITERATE_KEY = Symbol()

const createReactive = (obj, isShallow = false, isReadonly = false) => {
    if (Object.getPrototypeOf(obj) === Map.prototype || Object.getPrototypeOf(obj) === Set.prototype) {
        return createReactiveMap(obj)
    }
    return new Proxy(obj, {
        get(target, p, receiver) {
            if (p === 'raw') return target
            // 对数组方法做代理
            if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(p)) {
                return Reflect.get(arrayInstrumentations, p, receiver)
            }
            const res = Reflect.get(target, p, receiver)
            // 在读取时追踪依赖,只在非只读且key不为内置方法比如Symbol.iterator时追踪
            if (!isReadonly && typeof p !== 'symbol') track(target, p);
            if (isShallow) {
                return res
            }
            if (typeof res === 'object' && res !== null) {
                return isReadonly ? readonly(res) : reactive(res)
            }
            return res
        },
        set(target, p, value, receiver) {
            if (isReadonly) {
                console.warn(`${p}是只读的`)
                return true
            }
            const oldVal = target[p]
            const type = Array.isArray(target)
                ? Number(p) < target.length ? TriggerType.SET : TriggerType.ADD
                : Object.prototype.hasOwnProperty.call(target, p) ? TriggerType.SET : TriggerType.ADD
            // 在设置后触发依赖
            const res = Reflect.set(target, p, value, receiver);
            // 屏蔽原型引起的更新
            if (receiver.raw === target) {
                if ((oldVal !== value) && (oldVal === oldVal || value === value)) trigger(target, p, type, value)
            }
            return res;
        },
        has(target, p) {
            // 在调用key in obj时追踪依赖
            track(target, p)
            return Reflect.has(target, p)
        },
        ownKeys(target) {
            // 在调用for-in循环时追踪依赖，数组的话本质上都是length改变时会改变for-in遍历结果
            track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
            return Reflect.ownKeys(target)
        },
        deleteProperty(target, p) {
            if (isReadonly) {
                console.warn(`${p}是只读的`)
                return true
            }
            const hadKey = Object.prototype.hasOwnProperty.call(target, p)
            const res = Reflect.deleteProperty(target, p)
            if (res && hadKey) {
                trigger(target, p, TriggerType.DELETE)
            }
            return res
        }
    });
}
const reactive = (obj) => {
    const existingProxy = reactiveMap.get(obj)
    if (existingProxy) return existingProxy
    const proxy = createReactive(obj)
    reactiveMap.set(obj, proxy)
    return proxy
};
const shallowReactive = (obj) => {
    return createReactive(obj, true)
}
const readonly = (obj) => {
    return createReactive(obj, false, true)
};
const shallowReadonly = (obj) => {
    return createReactive(obj, true, true)
}

export {reactive, shallowReactive, readonly, shallowReadonly};
