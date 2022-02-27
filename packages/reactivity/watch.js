import { effect } from './effect.js';

const traverse = (value, seen = new Set()) => {
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  seen.add(value);
  for (const k in value) {
    traverse(value[k], seen);
  }
  return value;
};
const watch = (source, cb, options = {}) => {
  let effectFn;
  let getter;
  if (typeof source === 'function') {
    getter = source;
  } else {
    getter = () => traverse(source);
  }

  let oldValue, newValue;
  let cleanup;

  const onInvalidate = (fn) => {
    cleanup = fn;
  };

  const job = () => {
    newValue = effectFn();
    if (cleanup) cleanup();
    cb(newValue, oldValue, onInvalidate);
    oldValue = newValue;
  };

  effectFn = effect(() => getter(), {
    lazy: true,
    scheduler: () => {
      if (options.flush === 'post') {
        const p = Promise.resolve();
        p.then(job);
      } else {
        job();
      }
    },
  });

  if (options.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }
};

export default watch;
