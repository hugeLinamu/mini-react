import type { DOMEventName } from "./DOMEventNames";

// React中的事件
// 将所有基本事件注册到 allNativeEvents 变量中去
// Set: {'abort', 'auxclick',...'dblclick','focusin','focusout'}
export const allNativeEvents: Set<DOMEventName> = new Set();

// key 为 react事件名，例如 onClick, 值为 dom事件名数组，如 ["click"]
export const registrationNameDependencies: {
  [registrationName: string]: Array<DOMEventName>;
} = {};

/**
 * 事件注册，注册捕获和冒泡阶段的事件
 * @param registrationName react事件名，例如 onClick
 * @param dependencies dom事件名，例如 click
 */
export function registerTwoPhaseEvent(
  registrationName: string,
  dependencies: Array<DOMEventName>,
): void {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + "Capture", dependencies);
}

export function registerDirectEvent(
  registrationName: string,
  dependencies: Array<DOMEventName>,
) {
  registrationNameDependencies[registrationName] = dependencies;

  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}
