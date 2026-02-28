import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Passive, Placement, Update } from "./ReactFiberFlags";
import { type HookFlags, HookLayout, HookPassive } from "./ReactHookEffectTags";
import type { FiberRoot, Fiber } from "./ReactInternalTypes";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";

export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
  // 1. 从根节点深度优先遍历整棵 Fiber 树
  recursivelyTraverseMutationEffects(root, finishedWork);
  // 2. 处理协调产生的effects，比如flags: 如Placement 、Update、ChildDeletion、useLayoutEffect
  commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber,
) {
  let child = parentFiber.child;
  // 遍历单链表
  while (child !== null) {
    commitMutationEffects(root, child);
    child = child.sibling;
  }
}

// 提交协调的产生的effects，比如flags: 如Placement、Update、ChildDeletion
function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;
  if (flags & Placement) {
    // 页面初次渲染：为 新增插入 appendChild
    // 页面更新，修改位置 appendChild || insertBefore
    commitPlacement(finishedWork);
    // 清除flags，做非的与运算
    finishedWork.flags &= ~Placement;
  }
  // 删除子节点
  if (flags & ChildDeletion) {
    // parentFiber 是 deletions的 父dom 对应的fiber
    const parentFiber = isHostParent(finishedWork)
      ? finishedWork
      : getHostParentFiber(finishedWork);
    const parentDOM = parentFiber.stateNode;
    commitDeletions(finishedWork.deletions!, parentDOM);
    finishedWork.flags &= ~ChildDeletion;
    finishedWork.deletions = null;
  }

  // useLayoutEffect
  if (flags & Update) {
    if (finishedWork.tag === FunctionComponent) {
      // 执行 layout effect
      commitHookEffectListMount(HookLayout, finishedWork);
      finishedWork.flags &= ~Update;
    }
  }
}

function commitHookEffectListMount(hookFlags: HookFlags, finishedWork: Fiber) {
  const updateQueue = finishedWork.updateQueue;
  let lastEffect = updateQueue!.lastEffect;
  if (lastEffect !== null) {
    // 头节点
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & hookFlags) === hookFlags) {
        const create = effect.create;
        // effect 函数
        create();
      }
      effect = effect.next;
      // 因为是单向循环链表，所以条件是 effect !== firstEffect
    } while (effect !== firstEffect);
  }
}

function commitPlacement(finishedWork: Fiber) {
  // 插入⽗dom
  if (finishedWork.stateNode && isHost(finishedWork)) {
    // 找domNode的⽗DOM节点对应的fiber
    const parentFiber = getHostParentFiber(finishedWork);

    // 获取⽗dom节点
    let parentDom = parentFiber.stateNode;
    if (parentDom.containerInfo) {
      parentDom = parentDom.containerInfo;
    }

    // 向父节点添加 dom节点
    const before = getHostSibling(finishedWork);
    // 向父节点添加 dom节点
    insertOrAppendPlacementNode(finishedWork, before, parentDom);

    /**
     * 直接渲染的时候会触发下面的条件
     *   <>
          <h3>1</h3>
          <h4>2</h4>
        </>
     */
  } else {
    let kid = finishedWork.child;
    while (kid !== null) {
      commitPlacement(kid);
      kid = kid.sibling;
    }
  }
}

/**
 *  在 commit 阶段插入 DOM 时，React 用的是：parent.insertBefore(newNode, beforeNode);
 *  但问题是： Fiber 树 ≠ DOM 树
 *    右边的 fiber 可能：
 *    是函数组件（没 DOM）
 *    是还没插入的节点（Placement）
 *    是一个组件，需要往下找 child
 */
function getHostSibling(fiber: Fiber) {
  let node = fiber;
  sibling: while (1) {
    // 这个条件是因为下面 while 一直往子节点找，找不到时，需要回到父节点继续找 sibling
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node = node.sibling;
    // 如果为函数组件，stateNode 不是 dom 节点
    while (!isHost(node)) {
      // 这个节点需要 新增插入 或 移动位置
      if (node.flags & Placement) {
        // 跳到 sibling 循环
        continue sibling;
      }
      // 往下找子节点，如果没有子节点，则 跳到 sibling 循环
      if (node.child === null) {
        continue sibling;
      } else {
        node = node.child;
      }
    }

    // HostComponent|HostText 类型的Fiber，stateNode为真正的 dom 节点
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

/**
 * 根据fiber 删除子dom节点
 * @param deletions 子Fiber数组
 * @param parentDOM 父dom
 */
function commitDeletions(
  deletions: Array<Fiber>,
  parentDOM: Element | Document | DocumentFragment,
) {
  deletions.forEach((deletion) => {
    const childNode = getStateNode(deletion);
    parentDOM.removeChild(childNode);
  });
}

// 新增插入 | 位置移动
// insertBefore | appendChild
function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element,
  parent: Element,
) {
  if (before) {
    parent.insertBefore(getStateNode(node), before);
  } else {
    parent.appendChild(getStateNode(node));
  }
}

function getStateNode(fiber: Fiber) {
  let node = fiber;
  while (1) {
    if (isHost(node) && node.stateNode) {
      return node.stateNode;
    }
    node = node.child as Fiber;
  }
}

// 返回 fiber 的⽗dom节点对应的fiber
function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
  throw new Error(
    "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.",
  );
}

// 检查 fiber 是否可以是⽗ dom 节点
function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

/**
 * 遍历子节点，执行子节点的 useEffect
 * @param finishedWork  为 根节点Fiber,HostRoot=3
 */
export function flushPassiveEffects(finishedWork: Fiber) {
  // !1. 遍历⼦节点，检查⼦节点
  recursivelyTraversePassiveMountEffects(finishedWork);
  // !2. 如果有passive effects，执⾏~
  commitPassiveEffects(finishedWork);
}

function recursivelyTraversePassiveMountEffects(finishedWork: Fiber) {
  let child = finishedWork.child;
  while (child !== null) {
    // !1. 遍历子节点，检查子节点
    recursivelyTraversePassiveMountEffects(child);
    // !2. 如果有passive effects，执行~
    commitPassiveEffects(finishedWork);
    child = child.sibling;
  }
}

// 执行 useEffect
function commitPassiveEffects(finishedWork: Fiber) {
  switch (finishedWork.tag) {
    case FunctionComponent: {
      if (finishedWork.flags & Passive) {
        commitHookEffectListMount(HookPassive, finishedWork);
        finishedWork.flags &= ~Passive;
      }
      break;
    }
  }
}
