// import { useReducer, useState } from "react";

import { useReducer, useState } from "../which-react";

export default function FunctionComponent() {
  const [count1, setCount1] = useReducer((x: number) => x + 1, 0);
  const [state, setState] = useState(1);

  const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [3, 2, 0, 4, 1];
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
      {count1 % 2 === 0 ? <div>null</div> : null}
      {count1 % 2 === 0 ? <div>undefined</div> : undefined}
      {count1 % 2 === 0 && <div>boolean</div>}

      <div className="border">
        <div>useState</div>
        <button onClick={() => setState(state + 1)}>{state}</button>
      </div>
    </div>
  );
}
