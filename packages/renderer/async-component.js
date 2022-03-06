import { Text } from './vnode';

const defineAsyncComponent = (options) => {
  if (typeof options === 'function') {
    options = {
      loader: options,
    };
  }

  const { loader, onError, errorComponent, loadingComponent } = options;

  let InnerComp = null;

  let retries = 0;

  const load = () => {
    return loader().catch((err) => {
      if (onError) {
        return new Promise((resolve, reject) => {
          const retry = () => {
            resolve(load());
            retries += 1;
          };
          const fail = () => reject(err);
          onError(retry, fail, retries);
        });
      } else {
        throw error;
      }
    });
  };

  return {
    name: 'AsyncComponentWrapper',
    setup() {
      const loaded = ref(false);
      const error = shallowRef(null);
      const loading = ref(false);

      let loadingTimer = null;

      if (options.delay) {
        loadingTimer = setTimeout(() => {
          loading.value = true;
        }, options.delay);
      } else {
        loading.value = true;
      }

      load()
        .then((c) => {
          InnerComp = c;
          loaded.value = true;
        })
        .catch((err) => {
          error.value = err;
        })
        .finally(() => {
          loading.value = false;
          clearTimeout(loadingTimer);
        });

      let timer = null;
      if (options.timeout) {
        timer = setTimeout(() => {
          const err = new Error(
            `Async component timed out after ${options.timeout}ms`
          );
          error.value = err;
        }, options.timeout);
      }
      const placeholer = { type: Text, children: '' };
      return () => {
        if (loaded.value) {
          return { type: InnerComp };
        } else if (error.value && errorComponent) {
          return { type: errorComponent, props: { error: error.value } };
        } else if (loading.value && loadingComponent) {
          return { type: loadingComponent };
        } else {
          return placeholer;
        }
      };
    },
  };
};
