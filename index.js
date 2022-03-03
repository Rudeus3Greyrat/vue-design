import {renderer} from "./packages/renderer/index.js";
import {effect, reactive} from "./packages/reactivity/index.js";

const oldVnode = {
    type: "div",
    children: [
        {
            type: 'p',
            children: '1'
        },
        {
            type: 'p',
            children: '2'
        },
        {
            type: 'p',
            children: '3'
        },
    ]
}

const newVnode = {
    type: "div",
    children: [
        {
            type: 'p',
            children: '4'
        },
        {
            type: 'p',
            children: '5'
        },
    ]
}

const data = {
    vnode: oldVnode
}

const obj = reactive(data)

effect(
    () => renderer.render(obj.vnode, document.querySelector('#app'))
)

window.setTimeout(() => obj.vnode = newVnode, 2000)

