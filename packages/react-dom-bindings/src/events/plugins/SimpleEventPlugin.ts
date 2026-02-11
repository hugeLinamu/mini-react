import type { Fiber } from "react-reconciler/src/ReactInternalTypes";
import { DOMEventName } from "../DOMEventNames";
import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from "../DOMEventProperties";
import {
  accumulateSinglePhaseListeners,
  type AnyNativeEvent,
  type DispatchQueue,
} from "../DOMPluginEventSystem";
import { IS_CAPTURE_PHASE, type EventSystemFlags } from "../EventSystemFlags";

function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
): void {
  // 获取 react 事件名，如 click->onClick ， 根据dom事件名获取对应的 React 事件名
  const reactName = topLevelEventsToReactNames.get(domEventName);
  if (reactName === undefined) {
    return;
  }
  // 是否捕获阶段
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  // 如果是 scroll 事件，或者是 scrollend 事件，那么只会在冒泡阶段触发
  const accumulateTargetOnly =
    !inCapturePhase &&
    (domEventName === "scroll" || domEventName === "scrollend");
    
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    inCapturePhase,
    accumulateTargetOnly,
    nativeEvent,
  );
  if (listeners.length > 0) {
    dispatchQueue.push({ event: nativeEvent, listeners });
  }
}

export { registerSimpleEvents as registerEvents, extractEvents };
