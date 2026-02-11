import type { DOMEventName } from "./DOMEventNames";
import { allNativeEvents } from "./EventRegistry";
import { EventSystemFlags, IS_CAPTURE_PHASE } from "./EventSystemFlags";
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener";
import {
  addEventCaptureListener,
  addEventBubbleListener,
} from "./EventListener";

// 注册基本事件
SimpleEventPlugin.registerEvents();

// 媒体元素
export const mediaEventTypes: Array<DOMEventName> = [
  "abort",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "encrypted",
  "ended",
  "error",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "resize",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
];

// 不适合做事件委托的 事件名字，这些事件不适合事件冒泡
// 我们不应该将这些事件委托给容器，而是应该直接在实际的目标元素上设置它们。这主要是因为这些事件在DOM中的冒泡行为并不一致。
export const nonDelegatedEvents: Set<DOMEventName> = new Set([
  "cancel",
  "close",
  "invalid",
  "load",
  "scroll",
  "scrollend",
  "toggle",
  // 为了减少字节数，我们将上述媒体事件数组插入到这个 Set 中。
  // 注意："error" 事件并不是一个独占的媒体事件，也可能发生在其他元素上。我们不会重复这个事件，而是直接从媒体事件数组中取出。
  ...mediaEventTypes,
]);

const listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);

export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  // 防止事件重复绑定
  if (!(rootContainerElement as any)[listeningMarker]) {
    (rootContainerElement as any)[listeningMarker] = true;
    // 事件绑定
    allNativeEvents.forEach((domEventName) => {
      // 特殊处理 selectionchange， 这个事件要绑定到 document 层
      if (domEventName !== "selectionchange") {
        // 有些事件在DOM上冒泡行为不一致，这些事件就不做事件委托
        if (!nonDelegatedEvents.has(domEventName)) {
          // 冒泡
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }
        // 捕获
        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    });
  }
}

/**
 * @param domEventName 事件名
 * @param isCapturePhaseListener 是否捕获阶段
 * @param target 需要绑定的目标元素
 */
export function listenToNativeEvent(
  domEventName: DOMEventName,
  isCapturePhaseListener: boolean,
  target: EventTarget,
): void {
  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    // 标记处于捕获阶段
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener,
  );
}

function addTrappedEventListener(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean,
) {
  // ! 1. 获取对应事件，事件定义在ReactDOMEventListener.js中
  // 如DiscreteEventPriority对应dispatchDiscreteEvent，ContinuousEventPriority对应dispatchContinuousEvent
  let listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags,
  );

  let isPassiveListener: boolean = false;
  // 浏览器引入了一种干预措施，使这些事件在document上默认为passive状态。
  // React不再将它们绑定到document上，但是现在改变这一点将会撤销之前的性能优势。
  // 因此，我们现在在根节点上手动模拟现有的行为。
  // https://github.com/facebook/react/issues/19651
  if (
    domEventName === "touchstart" ||
    domEventName === "touchmove" ||
    domEventName === "wheel"
  ) {
    isPassiveListener = true;
  }

  // ! 2. 绑定事件
  if (isCapturePhaseListener) {
    // * 捕获阶段
    addEventCaptureListener(
      targetContainer,
      domEventName,
      listener,
      isPassiveListener,
    );
  } else {
    addEventBubbleListener(
      targetContainer,
      domEventName,
      listener,
      isPassiveListener,
    );
  }
}
