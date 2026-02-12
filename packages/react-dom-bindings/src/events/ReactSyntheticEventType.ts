import type { Fiber } from "react-reconciler/src/ReactInternalTypes";


/**
 * React合成事件的基础类型
 */
type BaseSyntheticEvent = {
  isPersistent: () => boolean;
  isPropagationStopped: () => boolean;
  _targetInst: Fiber;
  nativeEvent: Event;
  target?: any;
  relatedTarget?: any;
  type: string;
  currentTarget: null | EventTarget;
};

/**
 * React 已知的事件类型
 */
export type KnownReactSyntheticEvent = BaseSyntheticEvent & {
  _reactName: string;
};

/**
 * 非法的事件 或 React 不支持的事件
 */
export type UnknownReactSyntheticEvent = BaseSyntheticEvent & {
  _reactName: null;
};

export type ReactSyntheticEvent =
  | KnownReactSyntheticEvent
  | UnknownReactSyntheticEvent;
