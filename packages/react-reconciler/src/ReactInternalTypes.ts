import type { Flags } from "./ReactFiberFlags";
import { Lanes } from "./ReactFiberLane";
import type { WorkTag } from "./ReactWorkTags";

export type Fiber = {
  // 标记fiber的类型，即描述的组件类型，如原生标签、函数组件、类组件、Fragment等。这里参考ReactWorkTags.js
  tag: WorkTag;

  // 标记组件在当前层级下的的唯一性
  key: null | string;

  // 组件类型
  elementType: any;

  // 标记组件类型，如果是原生组件，这里是字符串，如果是函数组件，这里是函数，如果是类组件，这里是类
  type: any;

  // 如果组件是原生标签，DOM；如果是类组件，是实例；如果是函数组件，是null
  // 如果组件是原生根节点，stateNode存的是FiberRoot.  HostRoot=3
  stateNode: any;

  // 父fiber
  return: Fiber | null;

  // 单链表结构
  // 第一个子fiber
  child: Fiber | null;
  // 下一个兄弟fiber
  sibling: Fiber | null;
  // 记录了节点在当前层级中的位置下标，用于diff时候判断节点是否需要发生移动
  index: number;

  // 新的props
  pendingProps: any;
  // 上一次渲染时使用的 props
  memoizedProps: any;

  // 不同的组件的 memoizedState 存储不同
  // 函数组件 hook 第0个hook
  // 类组件 state
  // HostRoot RootState
  memoizedState: any;

  // Effect， ,组件要新增还是删除还是更新。。。
  // 一般用 位运算 
  // |= （累加）状态位，有1取1，如 flags |= Update , flags |= Placement; 表示 这个节点：既需要 Update，又需要 Placement
  // ~=(按位取反) 状态位，
  // ChildDeletion     = 0000010000
  // ~ChildDeletion    = 1111101111  flags ~= ChildDeletion 表示ChildDeletion被删除了，其他操作还在
  flags: Flags;

  // 缓存fiber，同一个组件，在内存里永远有两份 Fiber，目的是解决在不影响当前 UI 的情况下，提前计算下一次 UI
  alternate: Fiber | null;

  // 记录要删除的子节点数组
  deletions: Array<Fiber> | null;

  // 记录effect
  updateQueue: any;

  lanes: Lanes;
  childLanes: Lanes;
};

export type Container = Element | Document | DocumentFragment;

export type FiberRoot = {
  containerInfo: Container; // DOM 容器
  current: Fiber; // 当前生效的 Fiber 树
  // 一个准备提交的Fiber work-in-progress， HostRoot
  finishedWork: Fiber | null;
  pendingLanes: Lanes;
};

