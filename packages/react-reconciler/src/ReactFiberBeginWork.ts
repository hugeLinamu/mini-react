import shallowEqual from "shared/shallowEqual";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import {
  createFiberFromTypeAndProps,
  createWorkInProgress,
  isSimpleFunctionComponent,
} from "./ReactFiber";
import { renderWithHooks } from "./ReactFiberHooks";
import type { Fiber } from "./ReactInternalTypes";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  MemoComponent,
  SimpleMemoComponent,
} from "./ReactWorkTags";
import { isNum, isStr } from "shared/utils";

/**
 * beginWork 的核心职责是：根据新的 props / state，对当前 Fiber 进行 diff，创建或复用子 Fiber，并决定接下来要处理哪一个子节点
 * 判断是否可以 复用（bailout）
 * 根据 Fiber 类型，走不同的更新逻辑
 * 返回 下一个要处理的 子 Fiber
 *
 * @param current 老的 Fiber
 * @param workInProgress 正在构建的新 Fiber
 */
export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    // 原生标签
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    // 文本
    case HostText:
      return updateHostText(current, workInProgress);
    case Fragment:
      return updateHostFragment(current, workInProgress);
    case ClassComponent:
      return updateClassComponent(current, workInProgress);
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case MemoComponent:
      return updateMemoComponent(current, workInProgress);
    case SimpleMemoComponent:
      return updateSimpleMemoComponent(current, workInProgress);
  }
  // TODO

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue.",
  );
}

// 根fiber
function updateHostRoot(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {
  // render 传进来 JSX
  const nextChildren = workInProgress.memoizedState.element;
  // 此时current 和 workInProgress 为 HostRoot Fiber
  reconcileChildren(current, workInProgress, nextChildren);

  if (current) {
    current.child = workInProgress.child;
  }

  return workInProgress.child;
}

// 原生标签，div、span...
// 初次渲染 协调
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {
  const { type, pendingProps } = workInProgress;
  const isDirectTextChild = shouldSetTextContent(type, pendingProps);
  if (isDirectTextChild) {
    // 文本属性
    return null;
  }
  // 如果原生标签只有一个文本，这个时候文本不会再生成fiber节点，而是当做这个原生标签的属性
  const nextChildren = pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child;
}

// 文本没有子节点，不需要协调
function updateHostText(current: Fiber | null, workInProgress: Fiber) {
  return null;
}

// 协调 Fragment 节点
function updateHostFragment(current: Fiber | null, workInProgress: Fiber) {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// 协调类组件
function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  const instance = new type(pendingProps);
  workInProgress.stateNode = instance;
  const children = instance.render();
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}

function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  // 调用FunctionComponent 得到的新的 JSX
  const children = renderWithHooks(current, workInProgress, type, pendingProps);
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}

function updateMemoComponent(current: Fiber | null, workInProgress: Fiber) {
  const Component = workInProgress.type; // React.memo 包裹的子组件
  const type = Component.type; // React.memo 包裹的子组件的 Fiber类型
  // 组件是不是初次渲染
  if (current === null) {
    // 初次渲染
    // ! 1.
    if (
      // 是简单的函数组件 ， 并且 memo第二个参数没有传入
      isSimpleFunctionComponent(type) &&
      Component.compare === null &&
      Component.defaultProps === undefined
    ) {
      workInProgress.type = type; // 将正在工作的Fiber 的 type 改为子组件的 type 类型
      workInProgress.tag = SimpleMemoComponent; // 将正在工作的Fiber 的tag 改为 SimpleMemoComponent 把子组件当作普通函数组件处理，等下再次进入 beginWork
      return updateSimpleMemoComponent(current, workInProgress);
    }
    // ! 2. memo 传了第二个参数，直接创建子组件的 Fiber
    // 创建子组件的 Fiber
    const child = createFiberFromTypeAndProps(
      type,
      null,
      workInProgress.pendingProps,
    );
    child.return = workInProgress;
    workInProgress.child = child;
    return child;
  }

  // 组件更新阶段
  let compare = Component.compare;
  compare = compare !== null ? compare : shallowEqual;
  // 比较 props是否发生改变，如果为true，说明没有改变，直接退出更新
  if (compare(current.memoizedProps, workInProgress.pendingProps)) {
    // bail out 退出更新
    return bailoutOnAlreadyFinishedWork();
  }

  const newChild = createWorkInProgress(
    current.child as Fiber,
    workInProgress.pendingProps,
  );
  newChild.return = workInProgress;
  workInProgress.child = newChild;
  return newChild;
}

function updateSimpleMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber,
) {
  if (current !== null) {
    // 组件更新,浅比较 props有没有发生改变
    if (shallowEqual(current.memoizedProps, workInProgress.pendingProps)) {
      // 退出渲染
      return bailoutOnAlreadyFinishedWork();
    }
  }
  return updateFunctionComponent(current, workInProgress);
}

function bailoutOnAlreadyFinishedWork() {
  return null;
}

// 协调子节点，构建新的fiber树
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
) {
  if (current === null) {
    // 初次挂载，没有旧fiber，创建新的fiber树
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 更新节点，有旧 Fiber， 进入真正的 diff，
    // 决定：复用，新建，删除，移动
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
    );
  }
}

// 是文本节点
function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    isStr(props.children) ||
    isNum(props.children) ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}
