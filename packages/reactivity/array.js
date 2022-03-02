import {shouldTrack} from "./deps.js";

const arrayInstrumentations = {};

// 重写数组的查找方法，以解决在数组中只能找到代理后的对象，找不到真实对象的问题
['includes', 'indexOf', 'lastIndexOf'].forEach(method => {
    const originalMethod = Array.prototype[method]
    arrayInstrumentations[method] = function (...args) {
        let res = originalMethod.apply(this, args)
        if (res === false) {
            res = originalMethod.apply(this.raw, args)
        }
        return res
    }
});

// 重写数组的栈方法，以解决原方法在调用时同时读取和设置length属性，导致栈溢出的问题
['push', 'pop', 'shift', 'unshift', 'splice'].forEach(method => {
    const originalMethod = Array.prototype[method]
    arrayInstrumentations[method] = function (...args) {
        shouldTrack = false
        const res = originalMethod.apply(this, args)
        shouldTrack = true
        return res
    }
})


export {
    arrayInstrumentations
}
