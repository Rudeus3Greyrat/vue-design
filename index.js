import {effect, ref} from "./packages/reactivity/index.js";

function renderer(domString, container) {
    container.innerHTML = domString
}

const count = ref(1)

effect(() => {
    renderer(`<h1>${count.value}</h1>`, document.querySelector('#app'))
})

window.setTimeout(() => count.value = 2, 2000)
