const queue = new Set();
let isFlushing = false;
const p = Promise.resolve();

const queueJob = (job) => {
  queue.add(job);
  if (!isFlushing) {
    isFlushing = true;
    p.then(() => {
      try {
        queue.forEach((job) => job());
      } finally {
        isFlushing = false;
        queue.length = 0;
      }
    });
  }
};

export { queueJob };
