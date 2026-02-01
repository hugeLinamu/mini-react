import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
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
      console.log(workInProgress.stateNode,'===>')
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
      (domElement as any)[propKey] = nextProp;
    }
  }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child;
  while (nodeFiber !== null) {
    if (nodeFiber) {
      parent.appendChild(nodeFiber.stateNode);
    }
    nodeFiber = nodeFiber.sibling;
  }
}
