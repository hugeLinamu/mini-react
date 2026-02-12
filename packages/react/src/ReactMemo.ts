import { REACT_MEMO_TYPE } from "shared/ReactSymbols";

/**
 * memo React组件
 * @param type 要包装的组件
 * @param compare 比较函数，用于比较 props 是否发生变化，返回true表示不更新，返回false表示更新
 * @returns 包装后的组件
 */
export function memo<Props>(
  type: any,
  compare?: (oldProps: Props, newProps: Props) => boolean
) {
  const elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type, //组件
    compare: compare === undefined ? null : compare,
  };

  return elementType;
}
