import {renderer} from "./packages/renderer/index.js";

const vnode = {
    type: 'h1',
    props: {
        id: 'foo',
        class: ['text', {baz: true, foo: false}],
        style: [
            'color:red',
            {
                fontsize: '40px'
            }
        ],
        onClick: () => {
            console.log('clicked1')
        },
    },
    children: [
        {
            type: 'input',
            props: {
                id: 'text',
                disabled: '',
                form: 'form'
            },
            children: []
        }
    ]
}

renderer.render(vnode, document.querySelector('#app'))

