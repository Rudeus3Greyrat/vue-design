import {normalizeClass, normalizeStyle, shouldSetAsProps, unmount} from "./utils.js";
import {Comment, Fragment, Text} from "./vnode.js";

const createRenderer = (options) => {
    const {createElement, insert, setElementText, patchProps, createText, setText, createComment, setComment} = options

    const patch = (n1, n2, container) => {
        console.log('old vnode', n1)
        console.log('new vnode', n2)
        if (n1 && n1.type !== n2.type) {
            unmount(n1)
            n1 = null
        }
        const {type} = n2
        if (typeof type === 'string') {
            // new vnode is of html element
            if (!n1) {
                mountElement(n2, container)
            } else {
                patchElement(n1, n2)
            }
        } else if (type === Text) {
            if (!n1) {
                const el = n2.el = createText(n2.children)
                insert(el, container)
            } else {
                const el = n2.el = n1.el
                if (n1.children !== n2.children) {
                    setText(el, n2.children)
                }
            }
        } else if (type === Comment) {
            if (!n1) {
                const el = n2.el = createComment(n2.children)
                insert(el, container)
            } else {
                const el = n2.el = n1.el
                if (n1.children !== n2.children) {
                    setComment(el, n2.children)
                }
            }
        } else if (type === Fragment) {
            if (!n1) {
                n2.children.forEach(child => patch(null, child, container))
            } else {
                patchChildren(n1, n2, container)
            }
        } else if (typeof type === 'object') {
            // new vnode is of component
            if (!n1) {
                mountComponent(n2, container)
            } else {
                patchComponent(n1, n2)
            }
        } else if (typeof type === 'xxx') {

        }
    }

    const mountElement = (vnode, container) => {
        const {type, children} = vnode
        const el = vnode.el = createElement(type)

        if (typeof children === 'string') {
            setElementText(el, children)
        } else if (Array.isArray(children)) {
            children.forEach(child => patch(null, child, el))
        }

        if (vnode.props) {
            for (const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key])
            }
        }

        insert(el, container)
    }
    const patchElement = (n1, n2) => {
        const el = n2.el = n1.el
        const oldProps = n1.props
        const newProps = n2.props
        // 1. patch props
        for (const key in newProps) {
            if (oldProps[key] !== newProps[key]) {
                patchProps(el, key, oldProps[key], newProps[key])
            }
        }
        for (const key in oldProps) {
            if (!newProps.includes(key)) {
                patchProps(el, key, oldProps[key], null)
            }
        }

        // 2. update children
        patchChildren(n1, n2, el)
    }
    const patchChildren = (n1, n2, container) => {
        if (typeof n2.children === 'string') {
            if (Array.isArray(n1.children)) {
                n1.children.forEach(child => unmount(child))
            }
            setElementText(container, n2.children)
        } else if (Array.isArray(n2.children)) {
            if (Array.isArray((n1.children))) {
                // todo core diff
                n1.children.forEach(child => unmount(child))
                n2.children.forEach(child => patch(null, child, container))
            } else {
                setElementText(container, '')
                n2.children.forEach(child => patch(null, child, container))
            }
        } else {
            if (Array.isArray((n1.children))) {
                n1.children.forEach(child => unmount(child))
            } else if (typeof n1.children === 'string') {
                setElementText(container, '')
            }
        }
    }
    const mountComponent = (vnode, container) => {
    }
    const patchComponent = (n1, n2) => {

    }
    const render = (vnode, container) => {
        if (vnode) {
            patch(container._vnode, vnode, container)
        } else {
            if (container._vnode) {
                unmount(container._vnode)
            }
        }
        container._vnode = vnode
    }

    return {
        render
    }
}

const browserRenderer = createRenderer({
    createElement: tag => document.createElement(tag),
    setElementText: (el, text) => el.textContent = text,
    insert: (el, parent, anchor = null) => parent.insertBefore(el, anchor),
    patchProps: (el, key, prevValue, nextValue) => {
        if (/^on/.test(key)) {
            const eventName = key.slice(2).toLowerCase()
            const invokers = el._vei || (el._vei = {})
            let invoker = invokers[key]
            if (nextValue) {
                if (!invoker) {
                    invoker = el._vei[key] = e => {
                        if (e.timestamp < invoker.attached) return
                        if (Array.isArray(invoker.value)) {
                            invoker.value.forEach(fn => fn(e))
                        } else {
                            invoker.value(e)
                        }
                    }
                    invoker.value = nextValue
                    invoker.attached = performance.now()
                    el.addEventListener(eventName, invoker)
                } else {
                    invoker.value = nextValue
                }
            } else if (invoker) {
                el.removeEventListener(eventName, invoker)
            }
        } else if (key === 'class') {
            el.className = normalizeClass(nextValue)
        } else if (key === 'style') {
            el.style = normalizeStyle(nextValue)
        } else if (shouldSetAsProps(el, key)) {
            const type = typeof el[key]
            if (type === 'boolean' && nextValue === '') {
                el[key] = true
            } else {
                el[key] = nextValue
            }
        } else {
            el.setAttribute(key, nextValue)
        }
    },
    createText: text => document.createTextNode(text),
    setText: (el, text) => el.nodeValue = text,
    createComment: comment => document.createComment(comment),
    setComment: (el, comment) => el.nodeValue = comment
})

export {
    createRenderer,
    browserRenderer,
}
