import { useReducer, useState, useCallback } from "../which-react";
import MySlowList from "./MemoComp-Child";

function MemoComponent() {
  const [count, setCount] = useReducer((x) => x + 1, 0);
  const [text, setText] = useState("hello");

  const func = useCallback(() => {
    console.log("func");
  }, []);

  return (
    <div className="border">
      <h1>函数组件</h1>
      <button
        onClick={(e) => {
          setCount();
        }}
      >
        {count}
      </button>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
      />
      <p>{text}</p>
      {/* 非紧急更新 */}
      <MySlowList text={text} func={func} />
    </div>
  );
}

export default MemoComponent;
