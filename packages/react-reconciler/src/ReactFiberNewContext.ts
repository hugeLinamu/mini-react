import { ReactContext } from "shared/ReactTypes";
import { StackCursor, createCursor, pop, push } from "./ReactFiberStack";

const valueCursor: StackCursor<any> = createCursor(null);

/**
 * 
 * valueStack 保存 cursor 历史
 * cursor 保存“上一个 context 值”
 * context._currentValue 保存“当前 context 值”
 */

/** 1. 记录下context、value到stack(push)
 * export const ColorContext = createContext("lin");
 * 
 * <ColorContext.Provider value="green">
 *   <ColorContext.Provider value="red">
 *     <ColorContext.Provider value="blue">
 *       <Child />
 *     </ColorContext.Provider>
 *     <Child />
 *   </ColorContext.Provider>
 * </ColorContext.Provider>
 * 
 * 
 * default Value: "lin"
 * -----------------------
 * context:
 * index:       -1
 * valueStack:  [ ]
 * valueCursor: { current: null }
 * _currentValue : "lin"
 * -----------------------
 * 
 * context: green
 * index:       -1 0 
 * valueStack:  [ null ]
 * valueCursor: { current: "lin" }
 * _currentValue : "green"
 * 
 * context: green red
 * index:       -1 0 1
 * valueStack:  [ null , "lin" ]
 * valueCursor: { current: "green" }
 * _currentValue : "red"
 * 
 * context: green red blue
 * index:       -1 0 1 2
 * valueStack:  [ null , "lin"  , "green" ]
 * valueCursor: { current: red }
 * _currentValue : "blue"
 * 
 */
export function pushProvider<T>(context: ReactContext<T>, nextValue: T): void {
  push(valueCursor, context._currentValue);
  context._currentValue = nextValue;
}

// 2. 后代组件消费
export function readContext<T>(context: ReactContext<T>): T {
  return context._currentValue;
}


/** 3. 消费完后出栈(pop),context._currentValue 设置为上一个栈尾元素
 */
export function popProvider<T>(context: ReactContext<T>): void {
  const currentValue = valueCursor.current;
  pop(valueCursor);
  context._currentValue = currentValue;
}
