import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { createWorkInProgress } from "./ReactFiber";
import { completeWork } from "./ReactFiberCompleteWork";
import { beginWork } from "./ReactFiberBeginWork";
import { commitMutationEffects } from "./ReactFiberCommitWork";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
export const BatchedContext = /*        */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// ! 这个变量用来解决 ： 更新（setState / render）可能在任何时间、任何阶段被触发的问题
// 比如 ： render 阶段调用 setState
//        commit 阶段触发更新
//        effect 里触发更新
//        事件回调里触发更新
let executionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null; // 当前正在工作的 Fiber
let workInProgressRoot: FiberRoot | null = null; // 当前正在工作的 FiberRoot

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  isSync: boolean = false,
) {
  workInProgressRoot = root;
  workInProgress = fiber;
  if (isSync) {
    queueMicrotask(() => performConcurrentWorkOnRoot(root));
  } else {
    ensureRootIsScheduled(root);
  }
}

export function performConcurrentWorkOnRoot(root: FiberRoot) {
  // ! 1. render, 根据FiberRoot 构建fiber树 VDOM（beginWork|completeWork）
  renderRootSync(root);
  console.log("root===>",root)
  // 已经构建好的fiber树
  const finishedWork = root.current.alternate;

  root.finishedWork = finishedWork; // 根Fiber
  // ! 2. commit, 构建DOM（commitWork） VDOM->DOM
  commitRoot(root);
}

function renderRootSync(root: FiberRoot) {
  // !1. render阶段开始
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;

  // !2. 初始化
  prepareFreshStack(root);

  // !3. 遍历构建fiber树
  workLoopSync();

  // !4. render结束
  executionContext = prevExecutionContext;
  workInProgressRoot = null;
}

function commitRoot(root: FiberRoot) {
  // !1. commit阶段开始
  const prevExecutionContext = executionContext;
  executionContext |= CommitContext;

  // !2.1 mutation阶段, 渲染DOM树
  commitMutationEffects(root, root.finishedWork as Fiber); //finishedWork 为 Fiber,HostRoot=3

  // !3. commit结束
  executionContext = prevExecutionContext;
  workInProgressRoot = null;
}

function prepareFreshStack(root: FiberRoot): Fiber {
  root.finishedWork = null;
  workInProgressRoot = root; // FiberRoot
  // 对于初次渲染阶段，根据 HostRoot Fiber 创建一颗新的 Fiber 树，并挂载到 HostRoot Filber 的 alternate 上，用于本次 render 阶段的计算，而不影响当前已挂载的 Fiber 树
  // 对于更新阶段
  const rootWorkInProgress = createWorkInProgress(root.current, null); // Fiber
  if (workInProgress === null) {
    workInProgress = rootWorkInProgress;
  }
  return rootWorkInProgress;
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// 负责“Fiber 怎么一个一个被处理”
function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate;
  // !1. beginWork
  // current 是旧的Fiber， unitOfWork 是只能在构建中的新 Fiber
  // 对于初次渲染，只有 HostRoot Fiber 的 alternate 不为空，其他Fiber的 alternate 都是 null
  // 对于更新阶段，
  let next = beginWork(current, unitOfWork);
  // ! 把pendingProps更新到memoizedProps
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // 没有产生新的work
    // !2. completeWork
    completeUnitOfWork(unitOfWork);
  } else {
    // workInProgress 指向下一个要处理的 fiber
    workInProgress = next;
  }
}

// 深度优先遍历，子节点 -> 兄弟节点 -> 叔叔节点 -> 爷爷的兄弟节点...
function completeUnitOfWork(unitOfWork: Fiber) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    // 获取下一个节点
    const next = completeWork(current, completedWork);
    if (next !== null) {
      workInProgress = next;
      return;
    }
    // 没有下一个节点，获取兄弟节点
    const sibling = completedWork.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }

    // 父节点
    completedWork = returnFiber as Fiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}
