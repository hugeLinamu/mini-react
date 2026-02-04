// import { useReducer, useState } from "react";

import { useReducer } from "../which-react";

export default function FunctionHooksComponent() {
  const [count, setCount] = useReducer((pre: number) => pre + 1, 1);

  return (
    <div className="box border">
      <button
        onClick={() => {
          setCount();
        }}
      >
        {count}
      </button>
    </div>
  );
}
