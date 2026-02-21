import { REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from "shared/ReactSymbols";
import type { ReactContext } from "shared/ReactTypes";

/**
 *
 * @param defaultValue Context的默认值，Provider 没有设置 value的时候，会返回这个值
 * @returns ReactContext.Provider 是一个组件，用于向子孙后代传递值
 *          ReactContext.Consumer 是一个组件，用于 子孙后代消费 【最近一个】context Provider 传递过来的值
 */
export function createContext<T>(defaultValue: T): ReactContext<T> {
  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,
    Provider: null,
    Consumer: null,
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  context.Consumer = context;

  return context;
}
