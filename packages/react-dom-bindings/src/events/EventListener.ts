// 添加冒泡事件
export function addEventBubbleListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
  passive: boolean
): Function {
  target.addEventListener(eventType, listener as any, {
    capture: false,
    passive,
  });
  return listener;
}

// 添加捕获事件
export function addEventCaptureListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
  passive: boolean
): Function {
  target.addEventListener(eventType, listener as any, {
    capture: true,
    passive,
  });
  return listener;
}

// 移除事件
export function removeEventListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
  capture: boolean
): void {
  target.removeEventListener(eventType, listener as any, capture);
}
