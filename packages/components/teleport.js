const Teleport = {
    _isTeleport: true,
    process(n1, n2, container, anchor, internals) {
        const {patch, patchChildren} = internals
        if (!n1) {
            const target = typeof n2.props.to === 'string' ? document.querySelector(n2.props.to) : n2.props.to;
            n2.children.forEach(child => {
                patch(null, child, target, anchor)
            });
        } else {
            patchChildren(n1, n2, container)
            if (n1.props.to !== n2.props.to) {
                const target = typeof n2.props.to === 'string' ? document.querySelector(n2.props.to) : n2.props.to;
                n2.children.forEach(child => {
                    move(child, target, anchor)
                });
            }
        }
    }
}

export {
    Teleport
}
