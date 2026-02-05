// import { useReducer, useState } from "react";

import { useReducer } from "../which-react";

export default function FunctionComponent() {
  const [count1, setCount1] = useReducer((x: number) => x + 1, 0);
  const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 4];
  // 0 删除
  return (
    <div className="border">
      <h3>函数组件</h3>
      <button
        onClick={() => {
          setCount1();
        }}
      >
        {count1}
      </button>
      <ul>
        {arr.map((item) => (
          <li key={"li" + item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
