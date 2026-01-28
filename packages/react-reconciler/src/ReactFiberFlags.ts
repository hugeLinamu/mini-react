export type Flags = number;

export const NoFlags = /*                      */ 0b0000000000000000000000000000;
export const Placement = /*                    */ 0b0000000000000000000000000010; // 2     新增插入，移动位置
export const Update = /*                       */ 0b0000000000000000000000000100; // 4     更新
export const ChildDeletion = /*                */ 0b0000000000000000000000010000; // 16    删除子节点
export const Passive = /*                      */ 0b0000000000000000100000000000; // 2048
