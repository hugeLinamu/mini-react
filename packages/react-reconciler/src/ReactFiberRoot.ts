import { createFiber } from "./ReactFiber";
import { NoLanes } from "./ReactFiberLane";
import type { Container, Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";

export function createFiberRoot(containerInfo: Container): FiberRoot {
  // 创建一个FiberRoot
  const root: FiberRoot = new FiberRootNode(containerInfo);
  // 创建一个HostRoot类型的Fiber
  const uninitializedFiber: Fiber = createFiber(HostRoot, null, null);
  // HostRoot类型的Fiber挂载到root上
  root.current = uninitializedFiber;
  // 将root挂载到 HostRoot类型的Fiber上
  uninitializedFiber.stateNode = root;
  return root;
}

export function FiberRootNode(containerInfo: Container) {
  this.containerInfo = containerInfo;
  this.current = null;
  this.finishedWork = null;
  this.pendingLanes = NoLanes;
}
