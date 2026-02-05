import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import type { FiberRoot, Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
  // 1. 从根节点深度优先遍历整棵 Fiber 树
  recursivelyTraverseMutationEffects(root, finishedWork);
  //
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
    // todo 页面更新，修改位置 appendChild || insertBefore
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
}

function commitPlacement(finishedWork: Fiber) {
  // 插入⽗dom
  if (finishedWork.stateNode && isHost(finishedWork)) {
    // finishedWork是有dom节点
    const domNode = finishedWork.stateNode;
    // 找domNode的⽗DOM节点对应的fiber
    const parentFiber = getHostParentFiber(finishedWork);

    // 获取⽗dom节点
    let parent = parentFiber.stateNode;
    if (parent.containerInfo) {
      parent = parent.containerInfo;
    }
    // 向父节点添加 dom节点
    parent.appendChild(domNode);
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
