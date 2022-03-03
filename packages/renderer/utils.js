import {Fragment} from "./vnode.js";

const shouldSetAsProps = (el, key) => {
    if (key === 'form' && el.tagName === 'INPUT') return false
    return key in el
}

const normalizeClass = (value) => {
    if (typeof value === 'string') {
        return value
    } else if (typeof value === 'object') {
        let res = ''
        if (Array.isArray(value)) {
            value.forEach(item => res += ' ' + normalizeClass(item))
        } else {
            for (const key in value) {
                if (value[key]) res += ' ' + key
            }
        }
        return res
    } else {
        return ''
    }
}

// todo normalize style
const normalizeStyle = (value) => {
    if (typeof value === 'string') {
        return value
    } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
            let res = ''
            value.forEach(item => res += ';' + normalizeStyle(item))
            return res
        } else {
            return value
        }
    } else {
        return ''
    }
}

const unmount = (vnode) => {
    if (vnode.type === Fragment) {
        vnode.children.forEach(child => unmount(child))
        return
    }
    const el = vnode.el
    const parent = el.parentNode
    if (parent) parent.removeChild(el)
}

const isSameNode = (n1, n2) => {
    return n1.type === n2.type && n1.key && n1.key === n2.key
}

export {
    shouldSetAsProps,
    normalizeClass,
    normalizeStyle,
    unmount,
    isSameNode
}
