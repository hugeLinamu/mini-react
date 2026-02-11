import type { EventPriority } from "react-reconciler/src/ReactEventPriorities";
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  IdleEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from "react-reconciler/src/ReactEventPriorities";
import type { DOMEventName } from "./DOMEventNames";
import { Scheduler } from "scheduler";
import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NormalPriority,
  UserBlockingPriority,
} from "scheduler/src/SchedulerPriorities";
import { EventSystemFlags, IS_CAPTURE_PHASE } from "./EventSystemFlags";
import type { Fiber } from "react-reconciler/src/ReactInternalTypes";
import {
  AnyNativeEvent,
  DispatchListener,
  DispatchQueue,
  extractEvents,
} from "./DOMPluginEventSystem";
import { getClosestInstanceFromNode } from "../client/ReactDOMComponentTree";
import { ReactSyntheticEvent } from "./plugins/ReactSyntheticEventType";
import { invokeGuardedCallbackAndCatchFirstError } from "shared/ReactErrorUtils";

/**
 * 根据事件名称，获取事件优先级，并返回对应的事件处理函数
 * @param targetContainer
 * @param domEventName dom元素的事件名，如click
 * @param eventSystemFlags
 * @returns
 */
export function createEventListenerWrapperWithPriority(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: number,
): Function {
  // 根据事件名称，获取优先级。比如click、input、drop等对应DiscreteEventPriority ，drag、scroll等对应ContinuousEventPriority，
  // message也许处于Scheduler中，根据getCurrentSchedulerPriorityLevel()获取优先级。其它是DefaultEventPriority。
  const eventPriority = getEventPriority(domEventName);
  // 根据优先级，获取不同的事件函数
  let listenerWrapper;
  switch (eventPriority) {
    case DiscreteEventPriority:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    case ContinuousEventPriority:
      listenerWrapper = dispatchContinuousEvent;
      break;
    case DefaultEventPriority:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer,
  );
}

/**
 * 处理Discrete Event（离散事件） 指的是那种：用户主动触发，立即响应，优先级最高，不能被打断
 * 例如：，click，keydown，input，submit
 * 它们属于 同步优先级（SyncLane）。
 */
function dispatchDiscreteEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent,
) {
  // ! 1. 记录上一次的事件优先级
  const previousPriority = getCurrentUpdatePriority();
  try {
    // !4. 设置当前事件优先级为DiscreteEventPriority
    setCurrentUpdatePriority(DiscreteEventPriority);
    // !5. 调用dispatchEvent，执行事件
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    // !6. 恢复
    setCurrentUpdatePriority(previousPriority);
  }
}

/**
 * 连续事件 = 高频持续触发的事件
 * 例如：mousemove，scroll，drag，pointermove，
 * 特点：会在短时间内连续触发多次，React 不会每次都同步立即执行，可以被打断
 * 优先级低于 Discrete Event
 */
function dispatchContinuousEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent,
) {
  const previousPriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(ContinuousEventPriority);
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    setCurrentUpdatePriority(previousPriority);
  }
}

export function dispatchEvent(
  domEventName: DOMEventName,
  eventSystemFlags: number,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): void {
  // 获取事件发生的具体dom元素，如 button
  const nativeEventTarget = nativeEvent.target;
  // 根据 dom元素找到对应的 fiber
  const return_targetInst = getClosestInstanceFromNode(
    nativeEventTarget as Node,
  );

  const dispatchQueue: DispatchQueue = [];

  // 给dispatchQueue添加事件
  extractEvents(
    dispatchQueue,
    domEventName,
    return_targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );

  processDispatchQueue(dispatchQueue, eventSystemFlags);
}

export function processDispatchQueue(
  dispatchQueue: DispatchQueue,
  eventSystemFlags: EventSystemFlags,
): void {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
  }
}

function processDispatchQueueItemsInOrder(
  event: ReactSyntheticEvent,
  dispatchListeners: Array<DispatchListener>,
  inCapturePhase: boolean,
): void {
  let prevInstance: Fiber | null = null;
  if (inCapturePhase) {
    // 捕获阶段，从上往下执行
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { instance, currentTarget, listener } = dispatchListeners[i];
      if (prevInstance !== instance && event.isPropagationStopped?.()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
      prevInstance = instance;
    }
  } else {
    // 冒泡阶段，从下往上执行
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { instance, currentTarget, listener } = dispatchListeners[i];
      if (prevInstance !== instance && event.isPropagationStopped?.()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
      prevInstance = instance;
    }
  }
}

function executeDispatch(
  event: ReactSyntheticEvent,
  listener: Function,
  currentTarget: EventTarget,
): void {
  const type = event.type || "unknown-event";
  // event.currentTarget = currentTarget;
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
  // event.currentTarget = null;
}

export function getEventPriority(domEventName: DOMEventName): EventPriority {
  switch (domEventName) {
    // Used by SimpleEventPlugin:
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    // Used by polyfills: (fall through)
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    // Only enableCreateEventHandleAPI: (fall through)
    case "beforeblur":
    case "afterblur":
    // Not used by React but could be by user code: (fall through)
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return DiscreteEventPriority;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    // Not used by React but could be by user code: (fall through)
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return ContinuousEventPriority;
    case "message": {
      // 我们可能在调度器回调中。
      // 最终，这种机制将被替换为检查本机调度器上的当前优先级。
      const schedulerPriority = Scheduler.getCurrentPriorityLevel();
      switch (schedulerPriority) {
        case ImmediatePriority:
          return DiscreteEventPriority;
        case UserBlockingPriority:
          return ContinuousEventPriority;
        case NormalPriority:
        case LowPriority:
          return DefaultEventPriority;
        case IdlePriority:
          return IdleEventPriority;
        default:
          return DefaultEventPriority;
      }
    }
    default:
      return DefaultEventPriority;
  }
}
