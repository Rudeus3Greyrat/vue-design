import {currentInstance} from "../renderer/createRenderer.js";

const KeepAlive = {
    _isKeepAlive: true,
    props: {
        include: RegExp,
        exclude: RegExp,
    },
    setup(props, {slots}) {
        const cache = new Map();
        const instance = currentInstance;
        const {move, createElement} = instance.keepAliveCtx;
        const storageContainer = createElement('div');
        instance._deActivate = (vnode) => {
            move(vnode, storageContainer);
        }
        instance._activate = (vnode, container, anchor) => {
            move(vnode, container, anchor);
        }

        return () => {
            let rawVNode = slots.default && slots.default();
            if (typeof rawVNode !== 'object') {
                return rawVNode
            }
            const name = rawVNode.type.name
            if (name && ((props.include && !props.include.test(name)) || (props.exclude && props.exclude.test(name)))) {
                return rawVNode
            }
            const cachedVNode = cache.get(rawVNode.type);
            if (cachedVNode) {
                rawVNode.component = cachedVNode.component;
                rawVNode.keptAlive = true
            } else {
                cache.set(rawVNode.type, rawVNode);
            }
            rawVNode.shouldKeepAlive = true
            rawVNode.keepAliveInstance = instance
            return rawVNode
        }
    }
}

export {KeepAlive}
