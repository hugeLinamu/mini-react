import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import type { Fiber } from "./ReactInternalTypes";
import type { ReactElement } from "shared/ReactTypes";
import { createFiberFromElement } from "./ReactFiber";

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler =
  createChildReconciler(true);
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

// wrapper function
// 协调子节点
/**
 * 生成两套不同的 children diff 实现：一套用于首次挂载（不追踪副作用），一套用于更新阶段（追踪副作用）。
 * @param shouldTrackSideEffects 表示：在 children diff 过程中，是否需要记录真实 DOM 变更的副作用（Placement / Deletion / Update）。
 * @returns
 */
function createChildReconciler(shouldTrackSideEffects: boolean) {
  // 给fiber节点添加flags
  function placeSingleChild(newFiber: Fiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  // 协调单个节点，对于页面初次渲染，创建fiber，不涉及对比复用老节点
  // new (1)
  // old 2 [1] 3 4
  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement,
  ) {
    let createdFiber = createFiberFromElement(element);
    createdFiber.return = returnFiber;
    return createdFiber;
  }

  /**
   *
   * @param returnFiber 父Fiber，协调子节点需要把子Fiber挂在父Fiber上
   * @param currentFirstChild 老的第一个子Fiber。子Fiber是一个链表，拿到第一个就可以了
   * @param newChild
   * @returns
   */
  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
  ) {
    // 检查newChild类型，单个节点、文本、数组
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          // 单个子节点
          const firstChild = placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild),
          );
          return firstChild;
        }
      }
    }

    // todo
    return null;
  }

  return reconcileChildFibers;
}
