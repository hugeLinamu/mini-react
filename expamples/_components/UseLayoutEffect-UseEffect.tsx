import {
  useReducer,
  useState,
  useLayoutEffect,
  useEffect,
} from "../which-react";

function Child({ count1, count2 }) {
  console.log("child==>");

  useLayoutEffect(() => {
    console.log("useLayoutEffect1 ----> child"); //sy-log
  }, [count1]);

  useEffect(() => {
    console.log("useLayout1 ----> child"); //sy-log
  }, [count2]);

  return <div>Child</div>;
}

export default function UseLayoutEffectUseEffectComponent() {
  const [count1, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);
  // layout effect
  useLayoutEffect(() => {
    console.log("useLayoutEffect1");
  }, [count1]);

  // passive effect
  useEffect(() => {
    console.log("useEffect2");
  }, [count2]);
  useEffect(() => {
    console.log("useEffect3");
  }, []);
  useEffect(() => {
    console.log("useEffect4");
  }, []);
  useEffect(() => {
    console.log("useEffect5");
  }, []);
  return (
    <div className="border">
      <h1>函数组件</h1>
      <button onClick={() => setCount()}>{count1}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>
      <Child count1={count1} count2={count2} />
    </div>
  );
}
