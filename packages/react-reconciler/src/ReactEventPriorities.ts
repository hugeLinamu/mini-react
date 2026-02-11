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

export const DiscreteEventPriority: EventPriority = SyncLane;
export const ContinuousEventPriority: EventPriority = InputContinuousLane;
export const DefaultEventPriority: EventPriority = DefaultLane; // 页面初次渲染的lane 32
export const IdleEventPriority: EventPriority = IdleLane;

let currentUpdatePriority: EventPriority = NoLane;

export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority;
}

export function setCurrentUpdatePriority(newPriority: EventPriority) {
  currentUpdatePriority = newPriority;
}