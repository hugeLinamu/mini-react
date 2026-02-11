import { Fiber } from "react-reconciler/src/ReactInternalTypes";

const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = "__reactFiber$" + randomKey;
const internalPropsKey = "__reactProps$" + randomKey;

// 将Fiber存到dom元素上
export function precacheFiberNode(hostInst: Fiber, node: Element | Text): void {
  (node as any)[internalInstanceKey] = hostInst;
}

// 根据dom元素获取对于的Fiber
export function getClosestInstanceFromNode(targetNode: Node): null | Fiber {
  let targetInst = (targetNode as any)[internalInstanceKey];
  if (targetInst) {
    // Don't return HostRoot or SuspenseComponent here.
    return targetInst;
  }

  return null;
}

// 根据dom元素获取对于的 props
export function getFiberCurrentPropsFromNode(node: Element | Text) {
  return (node as any)[internalPropsKey] || null;
}

// 将props存到dom元素上
export function updateFiberProps(node: Element | Text, props: any): void {
  (node as any)[internalPropsKey] = props;
}
