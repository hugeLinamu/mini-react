import {
  DefaultLane,
  IdleLane,
  InputContinuousLane,
  Lane,
  Lanes,
  NoLane,
  SyncLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from "./ReactFiberLane";

export type EventPriority = Lane;

export const DiscreteEventPriority: EventPriority = SyncLane; // 离散事件优先级指的是那种：用户主动触发，立即响应，优先级最高，不能被打断，如： click
export const ContinuousEventPriority: EventPriority = InputContinuousLane; // 连续事件会在短时间内连续触发多次，React 不会每次都同步立即执行，可以被打断， 如：mousemove，scroll，drag，pointermove
export const DefaultEventPriority: EventPriority = DefaultLane; // 页面初次渲染的lane 32
export const IdleEventPriority: EventPriority = IdleLane;

let currentUpdatePriority: EventPriority = NoLane;

export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority;
}

export function setCurrentUpdatePriority(newPriority: EventPriority) {
  currentUpdatePriority = newPriority;
}

// 判断 a 是否比 b 的优先级高， a越小，说明 lane 越小，优先级越高
export function isHigherEventPriority(
  a: EventPriority,
  b: EventPriority,
): boolean {
  return a !== 0 && a < b;
}


export function lanesToEventPriority(lanes: Lanes): EventPriority {
  // 根据优先级最高的lane，返回对应的 EventPriority。这里对应Scheduler包中的优先级
  const lane = getHighestPriorityLane(lanes);
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority; // 2
  }
  return IdleEventPriority;
}
