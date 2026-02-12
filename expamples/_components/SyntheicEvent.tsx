import { useState } from "../which-react";
// 事件合成

export default function SyntheicEventComponent() {
  const [count, setCount] = useState(1);
  const [text, setText] = useState("");
  const [textarea, setTextAtea] = useState("");

  console.log("rerender");
  return (
    <div className="border">
      <h1>事件合成</h1>
      <button
        onClick={() => {
          setCount(count + 1);
        }}
      >
        {" click" + count}
      </button>

      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
      />
      <p>{"input val:" + text}</p>

      <textarea
        value={textarea}
        onChange={(e) => {
          setTextAtea(e.target.value);
        }}
      />
      <p>{`textarea val: ${textarea}`}</p>
    </div>
  );
}
