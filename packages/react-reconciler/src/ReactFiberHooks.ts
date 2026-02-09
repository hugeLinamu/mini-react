import { isFn } from "shared/utils";
import { Lanes, NoLanes } from "./ReactFiberLane";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";

// Hook 链表
type Hook = {
  memoizedState: any;
  next: null | Hook;
};

// 当前正在工作的函数组件的fiber
let currentlyRenderingFiber: Fiber | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

export function renderWithHooks<Props>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: Function,
  props: Props,
): any {
  // 获取当前正在工作中的Fiber
  currentlyRenderingFiber = workInProgress;
  // 初始化
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;

  let children = Component(props);

  finishRenderingHooks();

  return children;
}

function finishRenderingHooks() {
  currentlyRenderingFiber = null;
  currentHook = null;
  workInProgressHook = null;
}

// 1. 返回当前useX函数对应的hook
// 2. 构建hook链表
function updateWorkInProgressHook(): Hook {
  let hook: Hook;

  const current = currentlyRenderingFiber?.alternate;
  if (current) {
    // ! update 阶段
    currentlyRenderingFiber!.memoizedState = current.memoizedState;
    if (workInProgressHook !== null) {
      workInProgressHook = hook = workInProgressHook.next!;
      currentHook = currentHook?.next as Hook;
    } else {
      // hook单链表的头结点
      hook = workInProgressHook = currentlyRenderingFiber?.memoizedState;
      currentHook = current.memoizedState;
    }
  } else {
    // ! mounted 阶段
    // 初始化 hook
    currentHook = null;
    hook = {
      memoizedState: null,
      next: null,
    };

    // 如果存在正在工作中的hook，则链接起来，并更改 正在工作中的hook
    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      // 在当前Fiber上的memoizedState属性挂载 hook单链表的头结点
      workInProgressHook = currentlyRenderingFiber!.memoizedState = hook;
    }
  }

  return hook;
}

/**
 *
 * @param reducer
 * @param initialArg 初始值
 * @param init
 * @returns
 */
export function useReducer<S, I, A>(
  reducer: ((state: S, action: A) => S) | null,
  initialArg: I,
  init?: (initialArg: I) => S,
) {
  // ! 1.  构建hook链表(mount、update)
  let hook: Hook = updateWorkInProgressHook(); //  { memoizedState: null, next: null };

  // 设置初始值
  let initialState: S;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg as any;
  }

  // ! 2. 区分函数组件是初次挂载还是更新
  if (!currentlyRenderingFiber?.alternate) {
    // mount
    hook.memoizedState = initialState;
  }

  // ! 3. dispatch
  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber!,
    hook,
    reducer as any,
  );

  return [hook.memoizedState, dispatch];
}

// 更新hooks的状态值，
function dispatchReducerAction<S, A>(
  fiber: Fiber,
  hook: Hook,
  reducer: ((state: S, action: A) => S) | null,
  action: any,
) {
  // 计算 hook更新后的值
  hook.memoizedState = reducer ? reducer(hook.memoizedState, action) : action;
  const root = getRootForUpdatedFiber(fiber);

  // 更新阶段，Fiber 的alternate 赋值，除了 Host Fiber，其他的Fiber只有在更新阶段才有 alternate 属性
  fiber.alternate = { ...fiber };

  scheduleUpdateOnFiber(root!, fiber, true);
}

// 根据 sourceFiber 找根节点
function getRootForUpdatedFiber(sourceFiber: Fiber): FiberRoot | null {
  let node = sourceFiber;
  let parent = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  return node.tag === HostRoot ? node.stateNode : null;
}

// 源码中useState与useReducer对比
// useState,如果state没有改变，不引起组件更新。useReducer不是如此。
// reducer 代表state修改规则，useReducer比较方便服用这个规则
export function useState<S>(initialState: (() => S) | S) {
  const init = isFn(initialState) ? (initialState as any)() : initialState;
  return useReducer(null, init);
}

export function useMemo<T>(
  nextCreate: () => T,
  deps: Array<any> | void | null,
): T {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  // 上一次的 Hook 链表中当前hook 缓存的值
  if (prevState !== null) {
    // 当前依赖项存在，需要更上一次的依赖性比较，
    // 相同则直接返回上一次 nextCreate 计算的结果
    // 不相同则重新调用 nextCreate，并缓存计算结果
    if (nextDeps !== null) {
      const prevDeps: Array<any> | null = prevState[1];
      if (areHookInputsEqual(nextDeps as any, prevDeps)) {
        return prevState[0];
      }
    }
  }
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

export function areHookInputsEqual(
  nextDeps: Array<any>,
  prevDeps: Array<any> | null,
): boolean {
  if (prevDeps === null) {
    return false;
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
