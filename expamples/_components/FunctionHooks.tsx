// import { useReducer, useState } from "react";

import { useReducer } from "../which-react";

export default function FunctionHooksComponent() {
  const [count, setCount] = useReducer((pre: number) => pre + 1, 0);

  return (
    <div className="box border">
      {count % 2 === 0 ? (
        <button
          onClick={() => {
            setCount();
          }}
        >
          {count}
        </button>
      ) : (
        <span
          onClick={() => {
            setCount();
          }}
        >
          click {count}
        </span>
      )}
    </div>
  );
}
