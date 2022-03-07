import {Fragment} from './vnode.js';

const shouldSetAsProps = (el, key) => {
    if (key === 'form' && el.tagName === 'INPUT') return false;
    return key in el;
};

const normalizeClass = (value) => {
    if (typeof value === 'string') {
        return value;
    } else if (typeof value === 'object') {
        let res = '';
        if (Array.isArray(value)) {
            value.forEach((item) => (res += ' ' + normalizeClass(item)));
        } else {
            for (const key in value) {
                if (value[key]) res += ' ' + key;
            }
        }
        return res;
    } else {
        return '';
    }
};

// todo normalize style
const normalizeStyle = (value) => {
    if (typeof value === 'string') {
        return value;
    } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
            let res = '';
            value.forEach((item) => (res += ';' + normalizeStyle(item)));
            return res;
        } else {
            return value;
        }
    } else {
        return '';
    }
};

const unmount = (vnode) => {
    const needTransition = vnode.transition
    if (vnode.type === Fragment) {
        vnode.children.forEach((child) => unmount(child));
        return;
    } else if (typeof vnode.type === 'object') {
        if (vnode.shouldKeepAlive) {
            vnode.keepAliveInstance._deActivate(vnode)
        }
        unmount(vnode.component.subTree);
        return;
    }
    const el = vnode.el;
    const parent = el.parentNode;
    if (parent) {
        const performRemove = () => parent.removeChild(el)
        if (needTransition) {
            needTransition.leave(el, performRemove)
        } else {
            performRemove()
        }
    }
};

const isSameNode = (n1, n2) => {
    return n1.type === n2.type && n1.key && n1.key === n2.key;
};

const lis = (arr) => {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
};

const resolveProps = (options, propsData) => {
    const props = {};
    const attrs = {};
    for (const key in propsData) {
        if (key in options || /^on/.test(key)) {
            props[key] = propsData[key];
        } else {
            attrs[key] = propsData[key];
        }
    }
    return {props, attrs};
};

const hasPropsChange = (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    if (prevKeys.length !== nextKeys.length) return true;
    nextKeys.forEach((key) => {
        if (nextProps[key] !== prevProps[key]) return true;
    });
    return false;
};

export {
    shouldSetAsProps,
    normalizeClass,
    normalizeStyle,
    unmount,
    isSameNode,
    lis,
    resolveProps,
    hasPropsChange,
};
