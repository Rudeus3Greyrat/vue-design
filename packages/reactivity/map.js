import {track, trigger} from "./deps.js";
import {TriggerType} from "./constant.js";
import {ITERATE_KEY, reactive} from "./reactive.js";

export const MAP_KEY_ITERATE_KEY = Symbol()

const mutableInstrumentations = {
    add: function (key) {
        const target = this.raw
        const hadKey = target.has(key)
        const res = target.add(key)
        if (!hadKey) trigger(target, key, TriggerType.ADD)
        return res
    },
    delete: function (key) {
        const target = this.raw
        const hadKey = target.has(key)
        const res = target.delete(key)
        if (hadKey) trigger(target, key, TriggerType.DELETE)
        return res
    },
    get: function (key) {
        const target = this.raw
        track(target, key)
        const res = target.get(key)
        return typeof res === 'object' ? reactive(res) : res
    },
    set: function (key, value) {
        const target = this.raw
        const hadKey = target.has(key)
        const oldValue = target.get(key)
        const rawValue = value.raw || value
        target.set(key, rawValue)
        if (!hadKey) {
            trigger(target, key, TriggerType.ADD)
        } else {
            if (oldValue !== value && (oldValue === oldValue || value === value)) trigger(target, key, TriggerType.SET)
        }
    },
    forEach: function (callback, thisArg) {
        const wrap = val => typeof val === 'object' ? reactive(val) : val
        const target = this.raw
        track(target, ITERATE_KEY)
        target.forEach((v, k) => {
            callback.call(thisArg, wrap(v), wrap(k), this)
        })
    },
    [Symbol.iterator]: iterationMethod,
    entries: iterationMethod,
    values: valuesIterationMethod,
    keys: keysIterationMethod
}
const wrap = val => typeof val === 'object' ? reactive(val) : val

function iterationMethod() {
    const target = this.raw
    const itr = target[Symbol.iterator]()
    track(target, ITERATE_KEY)
    return ({
        next() {
            const {value, done} = itr.next()
            return ({
                value: value ? [wrap(value[0]), wrap(value[1])] : value,
                done
            })
        },
        [Symbol.iterator]() {
            return this
        }
    })
}

function valuesIterationMethod() {
    const target = this.raw
    const itr = target.values()
    track(target, ITERATE_KEY)
    return ({
        next() {
            const {value, done} = itr.next()
            return ({
                value: wrap(value),
                done
            })
        },
        [Symbol.iterator]() {
            return this
        }
    })
}

function keysIterationMethod() {
    const target = this.raw
    const itr = target.keys()
    track(target, MAP_KEY_ITERATE_KEY)
    return ({
        next() {
            const {value, done} = itr.next()
            return ({
                value: wrap(value),
                done
            })
        },
        [Symbol.iterator]() {
            return this
        }
    })
}

export const createReactiveMap = (obj, isShallow = false, isReadonly = false) => {
    return new Proxy(obj, {
        get(target, p, receiver) {
            if (p === 'raw') return target
            if (p === 'size') {
                track(target, ITERATE_KEY)
                return Reflect.get(target, p, target)
            }
            return mutableInstrumentations[p]
        },
    });
}
