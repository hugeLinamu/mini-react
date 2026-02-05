import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import type { Fiber } from "./ReactInternalTypes";
import type { ReactElement } from "shared/ReactTypes";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { isArray } from "shared/utils";

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
  // 删除单个子节点
  function deleteChild(returnFiber: Fiber, childToDelete: Fiber) {
    if (!shouldTrackSideEffects) {
      return;
    }

    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      returnFiber.deletions!.push(childToDelete);
    }
  }

  // 删除整个子节点链表
  function deleteRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
  ) {
    if (!shouldTrackSideEffects) {
      return;
    }

    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }

    return null;
  }

  // 给fiber节点添加flags
  function placeSingleChild(newFiber: Fiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  function useFiber(fiber: Fiber, pendingProps: any) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  // 协调单个节点，对于页面初次渲染，创建fiber，不涉及对比复用老节点
  // new (1)
  // old 2 [1] 3 4
  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null, // 老的子节点链表
    element: ReactElement,
  ) {
    // !节点复用条件: 同一层级， key相同，类型相同
    const key = element.key; // 新元素的key
    let child = currentFirstChild;
    while (child !== null) {
      // key 相同
      if (child.key === key) {
        const elementType = element.type;
        // 类型相同,复用fiber
        if (child.elementType === elementType) {
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          // key相同，但类型不同
          // React 不认为同一层级下有两个key相同的元素
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        // key 不相同，删除单个节点
        deleteChild(returnFiber, child);
      }
      
      // key不相同，在同一层级中 继续向后查找
      child = child.sibling;
    }

    let createdFiber = createFiberFromElement(element);
    createdFiber.return = returnFiber;
    return createdFiber;
  }

  function createChild(returnFiber: Fiber, newChild: any) {
    // 对于文本节点，根据文本节点类型以及其内容，创建文本节点的Fiber
    if (isText(newChild)) {
      const created = createFiberFromText(newChild + "");
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
      }
    }
    return null;
  }

  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<any>,
  ) {
    let resultingFirstChild: Fiber | null = null; // 头节点
    let previousNewFiber: Fiber | null = null;
    let oldFiber = currentFirstChild;
    let newIdx = 0;
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        // JSX 中写null，不构建Fiber
        if (newFiber === null) {
          continue;
        }
        // 记录当前元素的索引
        newFiber.index = newIdx;
        // 子Fiber中的 头节点，不能使用index，因为 null 不会被创建为fiber
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }
    // ! TODO 待完善
    return resultingFirstChild;
  }

  // 协调单个文本节点
  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string,
  ): Fiber {
    const created = createFiberFromText(textContent);
    created.return = returnFiber;
    console.log(created, "de");
    return created;
  }

  /**
   *
   * @param returnFiber 父Fiber，协调子节点需要把子Fiber挂在父Fiber上
   * @param currentFirstChild 老的第一个子Fiber。子Fiber是一个链表，拿到第一个就可以了
   * @param newChild
   * @returns 子Fiber链表的头节点
   */
  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
  ) {
    // 文本节点
    if (isText(newChild)) {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + ""),
      );
    }

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
    // 子节点是数组
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }

    // todo
    return null;
  }

  return reconcileChildFibers;
}

function isText(newChild: any) {
  return (
    (typeof newChild === "string" && newChild !== "") ||
    typeof newChild === "number"
  );
}
