import { useReducer, useState, useCallback } from "../which-react";

function ChildComp({ onClick }: { onClick: () => void }) {
  console.log("ChildComp render");
  return <div onClick={onClick}>ChildComp</div>;
}

export default function FunctionComponent() {
  const [count1, setCount1] = useReducer((x: number) => x + 1, 0);
  const [state, setState] = useState(1);

  const handleClick = useCallback(() => {
    setCount1();
  }, [count1]);

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
      <ChildComp onClick={handleClick} />

      <div className="border">
        <div>useState</div>
        <button onClick={() => setState(state + 1)}>{state}</button>
      </div>
    </div>
  );
}
