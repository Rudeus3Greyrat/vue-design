// 全局的当前激活的副作用函数
export let activeEffect;
// effect 栈
const effectStack = [];
// 把副作用函数从所有依赖集合中删除
const cleanup = (effectFn) => {
  // 获得effectFn的所有依赖集合组成的数组deps
  const deps = effectFn.deps;
  // 从每一个依赖集合中删除effectFn
  deps.forEach((dep) => dep.delete(effectFn));
  // 既然effectFn不作为任何的依赖了，所以它的deps需要置空
  effectFn.deps = [];
};
// 注册副作用函数的函数
const effect = (fn) => {
  const effectFn = () => {
    // 打扫屋子再请客
    cleanup(effectFn);
    // 调用副作用函数时将副作用函数赋值给activeEffect
    activeEffect = effectFn;
    // 将当前副作用函数入栈
    effectStack.push(effectFn);
    // 实际调用副作用函数
    fn();
    // 当前副作用函数调用完成后，出栈，并把activeEffect还原为上一个值
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };

  effectFn.deps = [];

  effectFn();
};
export default effect;
