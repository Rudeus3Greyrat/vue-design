import {
  isSameNode,
  lis,
  normalizeClass,
  normalizeStyle,
  shouldSetAsProps,
  unmount,
} from './utils.js';
import { Comment, Fragment, Text } from './vnode.js';

const createRenderer = (options) => {
  const {
    createElement,
    insert,
    setElementText,
    patchProps,
    createText,
    setText,
    createComment,
    setComment,
  } = options;

  const patch = (n1, n2, container, anchor) => {
    console.log('old vnode', n1);
    console.log('new vnode', n2);
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }
    const { type } = n2;
    if (typeof type === 'string') {
      // new vnode is of html element
      if (!n1) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2);
      }
    } else if (type === Text) {
      if (!n1) {
        const el = (n2.el = createText(n2.children));
        insert(el, container);
      } else {
        const el = (n2.el = n1.el);
        if (n1.children !== n2.children) {
          setText(el, n2.children);
        }
      }
    } else if (type === Comment) {
      if (!n1) {
        const el = (n2.el = createComment(n2.children));
        insert(el, container);
      } else {
        const el = (n2.el = n1.el);
        if (n1.children !== n2.children) {
          setComment(el, n2.children);
        }
      }
    } else if (type === Fragment) {
      if (!n1) {
        n2.children.forEach((child) => patch(null, child, container));
      } else {
        patchChildren(n1, n2, container);
      }
    } else if (typeof type === 'object') {
      // new vnode is of component
      if (!n1) {
        mountComponent(n2, container);
      } else {
        patchComponent(n1, n2);
      }
    } else if (typeof type === 'xxx') {
    }
  };

  const mountElement = (vnode, container, anchor) => {
    const { type, children } = vnode;
    const el = (vnode.el = createElement(type));

    if (typeof children === 'string') {
      setElementText(el, children);
    } else if (Array.isArray(children)) {
      children.forEach((child) => patch(null, child, el));
    }

    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key]);
      }
    }

    insert(el, container, anchor);
  };
  const patchElement = (n1, n2) => {
    const el = (n2.el = n1.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    // 1. patch props
    for (const key in newProps) {
      if (oldProps[key] !== newProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }
    for (const key in oldProps) {
      if (!newProps.includes(key)) {
        patchProps(el, key, oldProps[key], null);
      }
    }

    // 2. update children
    patchChildren(n1, n2, el);
  };
  const patchChildren = (n1, n2, container) => {
    if (typeof n2.children === 'string') {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => unmount(child));
      }
      setElementText(container, n2.children);
    } else if (Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        // core diff
        patchKeyedChildren3(n1.children, n2.children, container);
      } else {
        setElementText(container, '');
        n2.children.forEach((child) => patch(null, child, container));
      }
    } else {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => unmount(child));
      } else if (typeof n1.children === 'string') {
        setElementText(container, '');
      }
    }
  };

  // core diff-simple diff
  const patchKeyedChildren1 = (oldChildren, newChildren, container) => {
    const oldLen = oldChildren.length;
    const newLen = newChildren.length;
    let lastIndex = 0;
    for (let i = 0; i < newLen; i++) {
      const newVnode = newChildren[i];
      let find = false;
      for (let j = 0; j < oldLen; j++) {
        const oldVnode = oldChildren[j];
        if (isSameNode(oldVnode, newVnode)) {
          find = true;
          patch(oldVnode, newVnode, container);
          if (j < lastIndex) {
            // move node
            const prevNode = newChildren[i - 1];
            if (prevNode) {
              const anchor = prevNode.el.nextSibling;
              insert(newVnode.el, container, anchor);
            }
          }
          lastIndex = Math.max(lastIndex, j);
          break;
        }
      }
      if (!find) {
        //  add new node
        const prevNode = newChildren[i - 1];
        let anchor;
        if (prevNode) {
          anchor = prevNode.el.nextSibling;
        } else {
          anchor = container.firstChild;
        }
        patch(null, newVnode, container, anchor);
      }
    }
    // remove old not used dom noe
    for (let i = 0; i < oldLen; i++) {
      const oldVnode = oldChildren[i];
      let find = false;
      for (let j = 0; j < newLen; j++) {
        const newVnode = newChildren[j];
        if (isSameNode(oldVnode, newVnode)) {
          find = true;
          break;
        }
      }
      // not used dom
      if (!find) {
        unmount(oldVnode);
      }
    }
  };
  //core diff-two end diff
  const patchKeyedChildren2 = (oldChildren, newChildren, container) => {
    let oldStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let newStartIdx = 0;
    let newEndIdx = newChildren.length - 1;

    let oldStartVNode = oldChildren[oldStartIdx];
    let oldEndVNode = oldChildren[oldEndIdx];
    let newStartVNode = newChildren[newStartIdx];
    let newEndVNode = newChildren[newEndIdx];

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (!oldStartVNode) {
        oldStartVNode = oldChildren[++oldStartIdx];
      } else if (isSameNode(oldStartVNode, newStartVNode)) {
        patch(oldStartVNode, newStartVNode, container);
        oldStartVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (isSameNode(oldEndVNode, newEndVNode)) {
        patch(oldEndVNode, newEndVNode, container);
        oldEndVNode = oldChildren[--oldEndIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (isSameNode(oldStartVNode, newEndVNode)) {
        patch(oldStartVNode, newEndVNode, container);
        insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling);
        oldStartVNode = oldChildren[++oldStartIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (isSameNode(oldEndVNode, newStartVNode)) {
        patch(oldEndVNode, newStartVNode, container);
        insert(oldEndVNode, container, oldStartVNode.el);
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else {
        const idxInOld = oldChildren.findIndex((c) =>
          isSameNode(c, newStartVNode)
        );
        if (idxInOld > 0) {
          patch(oldChildren[idxInOld], newStartVNode, container);
          insert(oldChildren[idxInOld].el, container, oldStartVNode.el);
          oldChildren[idxInOld] = undefined;
        } else {
          patch(null, newStartVNode, container, oldStartVNode.el);
        }
        newStartVNode = newChildren[++newStartIdx];
      }
    }

    if (oldStartIdx > oldEndIdx && newStartIdx <= newEndIdx) {
      for (let i = newStartIdx; i <= newEndIdx; i++) {
        patch(null, newChildren[i], container, oldStartVNode.el);
      }
    } else if (newStartIdx > newEndIdx && oldStartIdx <= oldEndIdx) {
      for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        unmount(oldChildren[i]);
      }
    }
  };
  // core diff-fast diff
  const patchKeyedChildren3 = (oldChildren, newChildren, container) => {
    // patch pre vnode
    let j = 0;
    while (oldChildren[j].key === newChildren[j].key) {
      patch(oldChildren[j], newChildren[j], container);
      j += 1;
    }

    // patch post vnode
    let oldEnd = oldChildren.length - 1;
    let newEnd = newChildren.length - 1;
    while (oldChildren[oldEnd].key === newChildren[newEnd].key) {
      patch(oldChildren[oldEnd], newChildren[newEnd]);
      oldEnd -= 1;
      newEnd -= 1;
    }

    // handle with remaining nodes
    if (oldEnd < j && newEnd >= j) {
      // mount all remaining new nodes
      const anchor =
        newEnd + 1 < newChildren.length ? newChildren[newEnd + 1].el : null;
      for (let i = j; i <= newEnd; i++) {
        patch(null, newChildren[i], container, anchor);
      }
    } else if (newEnd < j && oldEnd >= j) {
      // unmount all remaining old nodes
      for (let i = j; i <= oldEnd; i++) {
        unmount(oldChildren[i]);
      }
    } else {
      // todo none ideal i.e. remaining nodes for both old children and new children
      const count = newEnd - j + 1;
      const source = new Array(count).fill(-1);
      const oldStart = j;
      const newStart = j;
      const newKeyIndex = {};
      let moved = false;
      let pos = 0;
      let patched = 0;
      for (let i = newStart; i <= newEnd; i++) {
        newKeyIndex[newChildren[i].key] = i;
      }
      for (let i = oldStart; i <= oldEnd; i++) {
        const oldVNode = oldChildren[i];
        if (patched <= count) {
          const newIndex = newKeyIndex[oldVNode.key];
          if (newIndex) {
            patch(
              oldVNode,
              newChildren[newIndex],
              container,
              newChildren[newEnd].el
            );
            patched += 1;
            source[newIndex - newStart] = i;
            if (newIndex < pos) {
              moved = true;
            } else {
              pos = newIndex;
            }
          } else {
            unmount(oldVNode);
          }
        } else {
          unmount(oldVNode);
        }
      }
      if (moved) {
        // move dom
        const seq = lis(source);
        let s = seq.length - 1;
        let i = count - 1;
        for (; i >= 0; i -= 1) {
          if (source[i] === -1) {
            const pos = i + newStart;
            const nextPos = pos + 1;
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            patch(null, newChildren[pos], container, anchor);
          } else if (i !== seq[s]) {
            // need move
            const pos = i + newStart;
            const nextPos = pos + 1;
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            insert(newChildren[pos], container, anchor);
          } else {
            s -= 1;
          }
        }
      }
    }
  };
  const mountComponent = (vnode, container) => {};
  const patchComponent = (n1, n2) => {};
  const render = (vnode, container) => {
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else {
      if (container._vnode) {
        unmount(container._vnode);
      }
    }
    container._vnode = vnode;
  };

  return {
    render,
  };
};

const browserRenderer = createRenderer({
  createElement: (tag) => document.createElement(tag),
  setElementText: (el, text) => (el.textContent = text),
  insert: (el, parent, anchor = null) => parent.insertBefore(el, anchor),
  patchProps: (el, key, prevValue, nextValue) => {
    if (/^on/.test(key)) {
      const eventName = key.slice(2).toLowerCase();
      const invokers = el._vei || (el._vei = {});
      let invoker = invokers[key];
      if (nextValue) {
        if (!invoker) {
          invoker = el._vei[key] = (e) => {
            if (e.timestamp < invoker.attached) return;
            if (Array.isArray(invoker.value)) {
              invoker.value.forEach((fn) => fn(e));
            } else {
              invoker.value(e);
            }
          };
          invoker.value = nextValue;
          invoker.attached = performance.now();
          el.addEventListener(eventName, invoker);
        } else {
          invoker.value = nextValue;
        }
      } else if (invoker) {
        el.removeEventListener(eventName, invoker);
      }
    } else if (key === 'class') {
      el.className = normalizeClass(nextValue);
    } else if (key === 'style') {
      el.style = normalizeStyle(nextValue);
    } else if (shouldSetAsProps(el, key)) {
      const type = typeof el[key];
      if (type === 'boolean' && nextValue === '') {
        el[key] = true;
      } else {
        el[key] = nextValue;
      }
    } else {
      el.setAttribute(key, nextValue);
    }
  },
  createText: (text) => document.createTextNode(text),
  setText: (el, text) => (el.nodeValue = text),
  createComment: (comment) => document.createComment(comment),
  setComment: (el, comment) => (el.nodeValue = comment),
});

export { createRenderer, browserRenderer };
