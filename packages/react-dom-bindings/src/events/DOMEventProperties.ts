import type { DOMEventName } from "./DOMEventNames";

import { registerTwoPhaseEvent } from "./EventRegistry";

export const topLevelEventsToReactNames: Map<DOMEventName, string | null> =
  new Map();

// 基本事件
const simpleEventPluginEvents = [
  "abort",
  "auxClick",
  "cancel",
  "canPlay",
  "canPlayThrough",
  "click",
  "close",
  "contextMenu",
  "copy",
  "cut",
  "drag",
  "dragEnd",
  "dragEnter",
  "dragExit",
  "dragLeave",
  "dragOver",
  "dragStart",
  "drop",
  "durationChange",
  "emptied",
  "encrypted",
  "ended",
  "error",
  "gotPointerCapture",
  "input",
  "invalid",
  "keyDown",
  "keyPress",
  "keyUp",
  "load",
  "loadedData",
  "loadedMetadata",
  "loadStart",
  "lostPointerCapture",
  "mouseDown",
  "mouseMove",
  "mouseOut",
  "mouseOver",
  "mouseUp",
  "paste",
  "pause",
  "play",
  "playing",
  "pointerCancel",
  "pointerDown",
  "pointerMove",
  "pointerOut",
  "pointerOver",
  "pointerUp",
  "progress",
  "rateChange",
  "reset",
  "resize",
  "seeked",
  "seeking",
  "stalled",
  "submit",
  "suspend",
  "timeUpdate",
  "touchCancel",
  "touchEnd",
  "touchStart",
  "volumeChange",
  "scroll",
  "scrollEnd",
  "toggle",
  "touchMove",
  "waiting",
  "wheel",
];

/**
 * @description 将dom事件名和react事件名映射值存储起来，并且注册两个阶段的事件：capture和bubble 捕获和冒泡阶段
 * @param domEventName dom事件名，例如 click
 * @param reactName react事件名，例如 onClick
 */
function registerSimpleEvent(domEventName: DOMEventName, reactName: string) {
  topLevelEventsToReactNames.set(domEventName, reactName);
  registerTwoPhaseEvent(reactName, [domEventName]);
}

/** 将基本事件注册到事件系统中
 * 1. 将基本事件名映射到React事件名，例如 click -> onClick
 * 2. 并将事件名注册到事件系统中
 */
export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i];
    const domEventName = eventName.toLowerCase() as DOMEventName;
    const capitalizedEvent = eventName[0].toUpperCase() + eventName.slice(1);
    registerSimpleEvent(domEventName, "on" + capitalizedEvent);
  }
  // Special cases where event names don't match.
  registerSimpleEvent("dblclick", "onDoubleClick");
  registerSimpleEvent("focusin", "onFocus");
  registerSimpleEvent("focusout", "onBlur");
}
