import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { createWorkInProgress } from "./ReactFiber";
import { completeWork } from "./ReactFiberCompleteWork";
import { beginWork } from "./ReactFiberBeginWork";
import {
  commitMutationEffects,
  flushPassiveEffects,
} from "./ReactFiberCommitWork";
import { NormalPriority, Scheduler } from "scheduler";

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
  console.log("root===>", root);
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

  // !2. 初始化，构建WorkInProgress树
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
  commitMutationEffects(root, root.finishedWork as Fiber); //finishedWork 为 根节点Fiber,HostRoot=3

  Scheduler.scheduleCallback(NormalPriority, () => {
    // !2.2 passive阶段, 执⾏passive effects(useEffect)
    flushPassiveEffects(root.finishedWork!);
  });

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

/**
 * <div className="border border1">          A - 根 
    <div>                                    B
      <div>                                  C
        <div>1-1-1</div>                     D
        <div>1-1-2</div>                     E
        <div>1-1-3</div>                     F
      </div>
      <div>1-2</div>                         G
      <div>                                  H
        <div>1-3-1</div>                     I
        <div>1-3-2</div>                     J
        <div>1-3-3</div>                     K
      </div>
    </div>
    <div>2-1</div>                           L
    <div>2-2</div>                           M
    <div>2-3</div>                           N
  </div>

执行流程 


步骤  当前处理的 Fiber       执行什么                接下来返回/去向                    说明
1     A                   beginWork(A)           返回 B（第一个 child）           向下
2     B                   beginWork(B)           返回 C（第一个 child）           向下
3     C                   beginWork(C)           返回 D（第一个 child）           向下
4     D                   beginWork(D)           返回 null（叶子）                叶子节点
5     D                   completeWork(D)        返回 E（D 的 sibling）           D 完成 → 兄弟
6     E                   beginWork(E)           返回 null                       叶子节点
7     E                   completeWork(E)        返回 F（E 的 sibling）           E 完成 → 兄弟
8     F                   beginWork(F)           返回 null                       叶子节点
9     F                   completeWork(F)        返回 null（F 无 sibling）        F 完成 → 向上（回到 C）
10    C                   completeWork(C)        返回 G（C 的 sibling）           C 子树结束 → 兄弟
11    G                   beginWork(G)           返回 null                       叶子节点
12    G                   completeWork(G)        返回 H（G 的 sibling）           G 完成 → 兄弟
13    H                   beginWork(H)           返回 I（第一个 child）            向下
14    I                   beginWork(I)           返回 null                       叶子节点
15    I                   completeWork(I)        返回 J（I 的 sibling）           I 完成 → 兄弟
16    J                   beginWork(J)           返回 null                       叶子节点
17    J                   completeWork(J)        返回 K（J 的 sibling）           J 完成 → 兄弟
18    K                   beginWork(K)           返回 null                       叶子节点
19    K                   completeWork(K)        返回 null（K 无 sibling）        K 完成 → 向上（回到 H）
20    H                   completeWork(H)        返回 null                       H 子树结束 → 向上（回到 B）
21    B                   completeWork(B)        返回 L（B 的 sibling）           B 子树全部完成 → A 的下一个孩子
22    L                   beginWork(L)           返回 null                       叶子节点
23    L                   completeWork(L)        返回 M（L 的 sibling）           L 完成 → 兄弟
24    M                   beginWork(M)           返回 null                       叶子节点
25    M                   completeWork(M)        返回 N（M 的 sibling）           M 完成 → 兄弟
26    N                   beginWork(N)           返回 null                       叶子节点
27    N                   completeWork(N)        返回 null                       N 完成 → 向上（回到 A）
28    A                   completeWork(A)        返回 null                       根完成，整个 render 阶段结束

*/
