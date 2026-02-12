import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  MemoComponent,
  SimpleMemoComponent,
} from "./ReactWorkTags";
import {
  precacheFiberNode,
  updateFiberProps,
} from "react-dom-bindings/src/client/ReactDOMComponentTree";
import { registrationNameDependencies } from "react-dom-bindings/src/events/EventRegistry";

export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case ClassComponent:
    case FunctionComponent:
    case Fragment:
    case MemoComponent:
    case SimpleMemoComponent:
    case HostRoot: {
      return null;
    }
    case HostComponent: {
      // 原生标签,type是标签名,如 div， span...
      const { type } = workInProgress;
      // 更新阶段
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        // 1. 创建真实DOM
        const instance = document.createElement(type);
        // 2. 初始化DOM属性
        finalizeInitialChildren(instance, null, newProps);
        // 3. 把子dom挂载到父dom上
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
      }
      // 将fiber存到dom元素上,事件绑定的时候用到
      precacheFiberNode(workInProgress, workInProgress.stateNode as Element);
      // 将props存到dom元素上,事件绑定的时候用到
      updateFiberProps(workInProgress.stateNode, newProps);
      return null;
    }
    // 文本
    case HostText: {
      workInProgress.stateNode = document.createTextNode(newProps);
      // 将Fiber存到dom元素上,事件绑定的时候用到
      precacheFiberNode(workInProgress, workInProgress.stateNode as Element);
      // 将props存到dom元素上,事件绑定的时候用到
      updateFiberProps(workInProgress.stateNode, newProps);
      return null;
    }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue.",
  );
}

function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  type: string,
  newProps: any,
) {
  if (current?.memoizedProps === newProps) {
    return;
  }

  finalizeInitialChildren(
    workInProgress.stateNode as Element,
    current?.memoizedProps,
    newProps,
  );
}

// 初始化dom属性
function finalizeInitialChildren(
  domElement: Element,
  prevProps: any,
  nextProps: any,
) {
  // 遍历老的props
  for (const propKey in prevProps) {
    const prevProp = prevProps[propKey];
    // 如果children是文本，当作文本属性处理就好了
    if (propKey === "children") {
      if (isStr(prevProp) || isNum(prevProp)) {
        domElement.textContent = "";
      }
    } else {
      // 3. 设置属性
      // 3.1 事件
      if (registrationNameDependencies[propKey]) {
        // domElement.removeEventListener("click", prevProp);
      } else {
        if (!(prevProp in prevProps)) {
          (domElement as any)[propKey] = "";
        }
      }
    }
  }
  // 遍历新的props
  for (const propKey in nextProps) {
    const nextProp = nextProps[propKey];
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        // 属性
        domElement.textContent = nextProp + "";
      }
    } else {
      // 3. 设置属性
      // 3.1 事件
      if (registrationNameDependencies[propKey]) {
        // domElement.addEventListener("click", nextProp);
      } else {
        (domElement as any)[propKey] = nextProp;
      }
    }
  }
}

// 将子元素挂载到当前元素上
function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child; // 链表结构
  while (nodeFiber !== null) {
    if (nodeFiber.tag === HostComponent || nodeFiber.tag === HostText) {
      parent.appendChild(nodeFiber.stateNode);
    } else if (nodeFiber.child !== null) {
      // 对于 Fragment 组件，会进到这个条件语句中
      // 如果node这个fiber本⾝不直接对应DOM节点，那么就往下找它的⼦节点
      nodeFiber = nodeFiber.child;
      continue;
    }
    if (nodeFiber === workInProgress) {
      return;
    }
    // 如果nodeFiber没有兄弟节点了，那么就往上找它的⽗节点
    while (nodeFiber.sibling === null) {
      if (nodeFiber.return === null || nodeFiber.return === workInProgress) {
        return;
      }
      nodeFiber = nodeFiber.return;
    }
    nodeFiber = nodeFiber.sibling;
  }
}

// fiber.stateNode是DOM节点
export function isHost(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}
