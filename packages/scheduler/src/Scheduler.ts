/**
 * 在调度器中
 * 一段时间切片(work)内，可以执行多个任务（task），每个任务（task）中有一个执行函数（callback）
 * callback 是 task 的初始值，会经过scheduleCallback封装成task
 */

import {
  PriorityLevel,
  NormalPriority,
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  UserBlockingPriority,
  NoPriority,
} from "./SchedulerPriorities";

import { peek, pop, push } from "./SchedulerMinHeap";
import { getCurrentTime } from "../../shared/utils";
import {
  lowPriorityTimeout,
  maxSigned31BitInt,
  normalPriorityTimeout,
  userBlockingPriorityTimeout,
} from "./SchedulerFeatureFlags";

export type Task = {
  id: number;
  callback: Callback | null;
  priorityLevel: PriorityLevel; // 任务优先级
  startTime: number; // 任务开始时间
  expirationTime: number; // 任务最晚应该被执行的时间点
  sortIndex: number; // 根据任务优先级，开始时间和过期时间得到的索引
};

type Callback = (arg: boolean) => Callback | null | undefined;

// 当前任务优先级
let currentPriorityLevel: PriorityLevel = NoPriority;
// 当前执行的任务
let currentTask: Task | null = null;
// 最小堆任务
let taskQueue: Array<Task> = [];
// 任务id 累加器
let taskIdCounter = 1;
// 主线程是否在调度
let isHostCallbackScheduled = false;
// 主线程是否在执行任务
let isPerformingWork = false;
// 消息循环是否在运行
let isMessageLoopRunning = false;

// 记录时间切片的起始值，时间戳
let startTime = -1;
// 时间切片的时间段
let frameInterval = 5;
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }
  // Yield now.
  return true;
}

// ! 任务进入调度器，等待调度, 根据优先级和callback 创建构建任务（Task）
function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {
  const currentTime = getCurrentTime();
  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      // Times out immediately 立即执行
      timeout = -1;
      break;
    case UserBlockingPriority:
      // Eventually times out
      timeout = userBlockingPriorityTimeout;
      break;
    case IdlePriority:
      // Never times out
      timeout = maxSigned31BitInt;
      break;
    case LowPriority:
      // Eventually times out
      timeout = lowPriorityTimeout;
      break;
    case NormalPriority:
    default:
      // Eventually times out
      timeout = normalPriorityTimeout;
      break;
  }
  const expirationTime = currentTime + timeout;
  // 构建任务
  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  // 根据 最晚应该被执行的时间点 expirationTime 排序
  newTask.sortIndex = expirationTime;
  // 将任务推入最小堆中
  push(taskQueue, newTask);
  // 没有主线程在调度，并且没有正在执行任务时，请求调度
  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback();
  }
}

function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    // 使⽤ MessageChannel 创建宏任务，来实现异步任务队列，以实现异步更新，确保 React 在执⾏更新时能够合并多个更新操作，并在下⼀个宏任务中⼀次性
    // 更新，以提⾼性能并减少不必要的重复渲染，从⽽提⾼⻚⾯性能和⽤户体验。
    schedulePerformWorkUntilDeadline();
  }
}

// !手写一个requestIdleCallback 创建一个宏任务
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);
}

// 执行work 直到时间片耗尽
function performWorkUntilDeadline() {
  const currentTime = getCurrentTime();
  startTime = currentTime;
  let hasMoreWork = true;
  try {
    hasMoreWork = flushWork(currentTime);
  } finally {
    if (hasMoreWork) {
      // If there's more work, schedule the next message event at the end
      // of the preceding one.
      schedulePerformWorkUntilDeadline();
    } else {
      isMessageLoopRunning = false;
    }
  }
}

function flushWork(initialTime: number) {
  isHostCallbackScheduled = false;
  isPerformingWork = true;

  let previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

// 取消某个任务，由于最小堆没法直接删除，因此只能初步把 task.callback 设置为null
function cancelCallback() {
  if (currentTask === null) {
    return;
  }
  return (currentTask.callback = null);
}

function getCurrentPriorityLevel() {
  return currentPriorityLevel;
}

/**
 * 时间切片
 * 一段时间切片内执行多个task , 返回为true表示还有任务没有执行完，需要继续执行
 * 1. 从堆顶取出任务
 * 2. 如果当前任务的过期时间大于当前时间， 把控制权交还给浏览器
 *
 */
function workLoop(initialTime: number) {
  let currentTime = initialTime;
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    // 当前任务的最晚应该被执行的时间点 大于当前时间 并且 把控制权交还给浏览器 时触发
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      // TODO：待搞清楚这行的逻辑
      //    1. 正常情况下：任务通过时间切片运行，不阻塞主线程。
      //    2. 异常情况下：如果一个任务等待时间太长（超过了它的过期时间），它将获得“特权”，不再受时间切片限制，必须立即被执行。
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;

      const continuationCallback = callback(didUserCallbackTimeout);
      if (typeof continuationCallback === "function") {
        currentTask.callback = continuationCallback;
        return true;
      } else {
        // 经过callback 之后，这个任务可能不在堆顶， 又由于 currentTask.callback = null， 所以后面这个任务跑到队顶时会被pop掉
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }
    } else {
      // 无效的任务
      pop(taskQueue);
    }

    // 取出下一个任务
    currentTask = peek(taskQueue);
  }

  if (currentTask !== null) {
    return true;
  }

  return false;
}

export {
  PriorityLevel,
  NormalPriority,
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  UserBlockingPriority,
  NoPriority,
  scheduleCallback, // 某个任务进入调度器，等待调度
  cancelCallback, // 取消某个任务，由于最小堆没法直接删除，因此只能初步把 task.callback 设置为null
  getCurrentPriorityLevel, // 获取当前正在执行任务的优先级
  shouldYieldToHost, // 把控制权交换给主线程
};
