import {reactive} from "./reactive.js";

const proxyRefs = (target) => {
    return new Proxy(target, {
        get(target, p, receiver) {
            const value = Reflect.get(target, p, receiver)
            if (value._v_isRef) {
                return value.value
            } else {
                return value
            }
        },
        set(target, p, val, receiver) {
            const value = target[p]
            if (value._v_isRef) {
                value.value = val
                return true
            } else {
                return Reflect.set(target, p, val, receiver)
            }
        }
    })
}

const ref = (value) => {
    const wrapper = {
        value
    }
    Object.defineProperty(wrapper, '_v_isRef', {
        value: true
    })

    return reactive(wrapper)
}

const toRef = (obj, key) => {
    const wrapper = {
        get value() {
            return obj[key]
        },
        set value(val) {
            obj[key] = val
        }
    }
    Object.defineProperty(obj, '_v_isRef', {
        value: true
    })
    return wrapper
}

const toRefs = (obj) => {
    const res = {}
    for (const key in obj) {
        res[key] = toRef(obj, key)
    }
    return res
}
export {
    ref,
    toRef,
    toRefs
}
