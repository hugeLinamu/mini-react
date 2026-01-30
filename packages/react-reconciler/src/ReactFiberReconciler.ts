import type { ReactNodeList } from "shared/ReactTypes";
import type { FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  // ! 1. 获取current
  const current = container.current;
  // 将 JSX 挂载到 HostRoot fiber 的 memoizedState 上
  current.memoizedState = { element };

  // ! 2. 调度更新
  scheduleUpdateOnFiber(container, current);
}
