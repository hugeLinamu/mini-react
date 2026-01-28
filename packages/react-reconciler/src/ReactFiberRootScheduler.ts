import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";
import { FiberRoot } from "./ReactInternalTypes";
import { NormalPriority, Scheduler } from "scheduler";

export function ensureRootIsScheduled(root: FiberRoot) {
  // 推入微任务队列中
  queueMicrotask(() => {
    scheduleTaskForRootDuringMicrotask(root);
  });
}

function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
  Scheduler.scheduleCallback(
    NormalPriority,
    performConcurrentWorkOnRoot.bind(null, root),
  );
}
