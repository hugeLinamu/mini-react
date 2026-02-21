// 抽象出 stack

export type StackCursor<T> = { current: T };

// 栈
const valueStack: Array<any> = [];
// 当前索引
let index = -1;

// cursor,记录栈尾元素。valueStack[index]记录的是上一个栈尾元素
export function createCursor<T>(defaultValue: T): StackCursor<T> {
  return { current: defaultValue };
}

// function isEmpty() {
//   return index === -1;
// }

export function push<T>(cursor: StackCursor<T>, value: T): void {
  index++;

  valueStack[index] = cursor.current; // 保存旧值
  cursor.current = value; // 更新最新的值

}

export function pop<T>(cursor: StackCursor<T>): void {
  if (index < 0) {
    return;
  }

  cursor.current = valueStack[index];
  valueStack[index] = null;
  index--;
}
