import {
  useReducer,
  useState,
  useLayoutEffect,
  useEffect,
} from "../which-react";

export default function UseLayoutEffectUseEffectComponent() {
  const [count1, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);
  // layout effect
//   useLayoutEffect(() => {
//     console.log("useLayoutEffect"); //sy-log
//   }, [count1]);
  // passive effect
  useLayoutEffect(() => {
    console.log("useEffect1"); //sy-log
  }, []);
  useEffect(() => {
    console.log("useEffect2"); //sy-log
  }, []);
  useEffect(() => {
    console.log("useEffect3"); //sy-log
  }, []);
  useEffect(() => {
    console.log("useEffect4"); //sy-log
  }, []);
    useEffect(() => {
    console.log("useEffect5"); //sy-log
  }, []);
  return (
    <div className="border">
      <h1>函数组件</h1>
      <button onClick={() => setCount()}>{count1}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>
    </div>
  );
}
