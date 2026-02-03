// import { useReducer, useState } from "react";

import { useReducer } from "../which-react";

export default function FunctionHooksComponent() {
  const [count, setCount] = useReducer((x: number) => x + 1, 0);

  return (
    <div>
      <h3>FunctionComponent</h3>
      <div>{count}</div>
      <button
        onClick={() => {
          console.log('213123')
          setCount(count + 1);
        }}
      >
        +1
      </button>
    </div>
  );
}
