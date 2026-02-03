import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";

export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case ClassComponent:
    case FunctionComponent:
    case Fragment:
    case HostRoot: {
      return null;
    }
    case HostComponent: {
      // 原生标签,type是标签名,如 div， span...
      const { type } = workInProgress;
      // 1. 创建真实DOM
      const instance = document.createElement(type);
      // 2. 初始化DOM属性
      finalizeInitialChildren(instance, newProps);
      // 3. 把子dom挂载到父dom上
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
      return null;
    }
    // 文本
    case HostText: {
      workInProgress.stateNode = document.createTextNode(newProps);
      console.log(workInProgress.stateNode, "===>");
      return null;
    }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue.",
  );
}

// 初始化dom属性
function finalizeInitialChildren(domElement: Element, props: any) {
  for (const propKey in props) {
    const nextProp = props[propKey];
    // 如果children是文本，当作文本属性处理就好了
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        domElement.textContent = nextProp + "";
      }
    } else {
      // 3. 设置属性
      // 3.1 事件
      if (propKey === "onClick") {
        domElement.addEventListener("click", nextProp);
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
