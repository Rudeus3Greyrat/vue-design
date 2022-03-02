import effect from './effect.js';
import {track, trigger} from "./deps.js";

const computed = (getter) => {
    let value;
    let dirty = true;

    const effectFn = effect(getter, {
        lazy: true,
        scheduler() {
            if (!dirty) {
                dirty = true;
                trigger(obj, 'value');
            }
        },
    });

    const obj = {
        get value() {
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            track(obj, 'value');
            return value;
        },
    };
    return obj;
};

export default computed;
