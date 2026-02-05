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
import { HostText } from "./ReactWorkTags";

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

  // 决定复用或创建文本节点
  function updateTextNode(
    returnFiber: Fiber,
    current: Fiber | null,
    textContent: string,
  ) {
    if (current === null || current.tag !== HostText) {
      // 老节点不是文本
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      // 老节点是文本
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  /**
   * 更新元素，如果类型相同，则复用Fiber，否则创建一个新的Fiber
   */
  function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: ReactElement,
  ) {
    const elementType = element.type;
    if (current !== null) {
      if (current.elementType === elementType) {
        // 类型相同
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }

    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function updateSlot(
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    newChild: any,
  ) {
    // 判断节点是否可以复用
    const key = oldFiber !== null ? oldFiber.key : null;
    if (isText(newChild)) {
      if (key !== null) {
        // 新节点是文本，老节点不是文本
        return null;
      }
      // 有可能可以复用
      return updateTextNode(returnFiber, oldFiber, newChild + "");
    }

    if (typeof newChild === "object" && newChild !== null) {
      if (newChild.key === key) {
        return updateElement(returnFiber, oldFiber, newChild);
      } else {
        return null;
      }
    }

    return null;
  }

  function placeChild(
    newFiber: Fiber,
    lastPlacedIndex: number, // 记录的是新fiber在老fiber上的位置
    newIndex: number,
  ) {
    newFiber.index = newIndex;

    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }

    // 判断节点位置是否发生相对位置变化，是否需要移动
    const current = newFiber.alternate;
    // 复用的节点，newFiber.alternate 不为 null
    // 新创建的节点的 newFiber.alternate 为null
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        // 上一次 0 1 2
        // 这一次 0 2 1
        // 节点需要移动位置
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        // 不需要移动位置
        return oldIndex;
      }
    } else {
      // 节点是新增
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  // 将剩余的老节点放入 Map 中
  function mapRemainingChildren(oldFiber: Fiber): Map<string | number, Fiber> {
    const existingChildren: Map<string | number, Fiber> = new Map();
    let existingChild: Fiber | null = oldFiber;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }

    return existingChildren;
  }

  // 从 Map 中获取节点并更新
  function updateFromMap(
    existingChildren: Map<string | number, Fiber>,
    returnFiber: Fiber,
    newIdx: number,
    newChild: any,
  ): Fiber | null {
    if (isText(newChild)) {
      // 文本节点没有key
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, newChild + "");
    } else if (typeof newChild === "object" && newChild !== null) {
      const matchedFiber =
        existingChildren.get(newChild.key === null ? newIdx : newChild.key) ||
        null;
      return updateElement(returnFiber, matchedFiber, newChild);
    }

    return null;
  }

  /**
   * 1.  从左边往右遍历，⽐较新⽼节点，如果节点可以复⽤，继续往右，否则就停⽌
   *
   * 2.1 ， 2.2， 2.3是互斥的，只能进入其中之一
   * 2.1 所有新节点都复用了旧的节点， （但是老节点还有）。则删除剩余的老节点即可
   *     如 old： 1，2，3，4，5，6，7
   *        new： 1，2，3，4
   * 2.2 (新节点还有)，但是老节点没了。则创建新节点即可
   *     如 old： 1，2，3，4
   *        new： 1，2，3，4，5，6，7
   * 2.3 剩余场景
   *    如 old： 0，1，2，3，4
   *       new： 0，1，2，4
   *    在2之后，节点都不可复用，新⽼节点都还有剩余，老节点剩余（3，4），新节点剩余（4），因为⽼ fiber 是链表，不⽅便快速 get 与 delete 老节点,
   *    因此把⽼ fiber 链表中的节点放⼊ Map 中，后续操作这个 Map 的 get 与 delete 来复用老节点
   *    此时需要从 老节点中 get 4节点，然后 delete 3节点即可
   *
   * 3.  最后查找 Map ⾥是否还有元素，如果有，则证明是新节点⾥不能复⽤的,
   *     也就是要被删除的元素，此时删除这些元素就可以了
   */
  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<any>,
  ) {
    let resultFirstChild: Fiber | null = null; // 头节点
    let previousNewFiber: Fiber | null = null;
    let oldFiber = currentFirstChild;
    let nextOldFiber = null; // oldFiber.sibling
    let newIdx = 0;
    let lastPlacedIndex = 0;

    // ! 1. 从左往右遍历，按位置比较，如果可以复用，那就复用。不能复用，退出本轮
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        debugger;
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      // 可以复用，则返回复用的 Fiber，不能复用则返回 null
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
      if (newFiber === null) {
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }

      // 更新阶段
      if (shouldTrackSideEffects) {
        // 旧Fiber存在，但是updateSlot是创建了新的Fiber， 则删除旧的Fiber
        if (oldFiber && newFiber?.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }

      // 判断节点在DOM的相对位置是否发生变化
      //  组件更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动
      lastPlacedIndex = placeChild(newFiber as Fiber, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        // 第一个节点，不要用newIdx判断，因为有可能有null，而null不是有效fiber
        resultFirstChild = newFiber as Fiber;
      } else {
        previousNewFiber.sibling = newFiber as Fiber;
      }
      previousNewFiber = newFiber as Fiber;

      oldFiber = nextOldFiber;
    }

    // !2.1 所有新节点都复用了旧的节点， （但是老节点还有）。则删除剩余的老节点即可
    // 如 old： 1，2，3，4，5，6，7
    //    new： 1，2，3，4
    if (newIdx === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultFirstChild;
    }

    // ! 2.2 (新节点还有)，老节点没了
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        // JSX 中写null，不构建Fiber
        if (newFiber === null) {
          continue;
        }

        lastPlacedIndex = placeChild(
          newFiber as Fiber,
          lastPlacedIndex,
          newIdx,
        );

        // 记录当前元素的索引
        newFiber.index = newIdx;
        // 子Fiber中的 头节点，不能使用index，因为 null 不会被创建为fiber
        if (previousNewFiber === null) {
          resultFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultFirstChild;
    }

    // ! 2.3 剩余场景
    // 将剩余的老节点放入 Map 中
    const existingChildren = mapRemainingChildren(oldFiber);
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          existingChildren.delete(
            newFiber.key === null ? newIdx : newFiber.key,
          );
        }
        lastPlacedIndex = placeChild(
          newFiber as Fiber,
          lastPlacedIndex,
          newIdx,
        );
        if (previousNewFiber === null) {
          // 第一个节点，不要用newIdx判断，因为有可能有null，而null不是有效fiber
          resultFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    // !3. 如果新节点已经构建完了，但是老节点还有
    if (shouldTrackSideEffects) {
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
    }

    return resultFirstChild;
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
