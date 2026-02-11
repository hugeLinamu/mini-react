import { useRef, useState } from "../which-react";

export default function UseRefComponent() {
  let ref = useRef(0);
  function handleClick() {
    console.log(ref, "ref===>");
    ref.current = ref.current + 1;
    alert("You clicked " + ref.current + " times!");
  }

  console.log("rerender");
  return (
    <div className="border">
      <h1>函数组件</h1>
      <button onClick={handleClick}>click</button>
    </div>
  );
}
