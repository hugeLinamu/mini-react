import { createContext, useContext, useState } from "../which-react";

export const CountContext = createContext(100);
export const ColorContext = createContext("lin");

function Child() {
  const CountCtx = useContext(CountContext);
  const ColorCtx = useContext(ColorContext);

  return (
    <div>
      <p>{`Child Count ctx ${CountCtx}`}</p>
      <p>{`Child Color ctx ${ColorCtx}`}</p>
    </div>
  );
}

export default function UseContextComponent() {
  const [count, setCount] = useState(1);
  const ColorCtx = useContext(ColorContext);


  const handleClick = () => {
    console.log("click===>");
    setCount(count + 1);
  };

  return (
    <div className="box border">
      <h1 onClick={handleClick}>UseContext</h1>
      {/* <CountContext.Provider value={count}> */}
      {/* <CountContext.Provider value={count + 1}> */}
      <ColorContext.Provider value="green">
        <ColorContext.Provider value="red">
          <ColorContext.Provider value="blue">
            <Child />
          </ColorContext.Provider>
          <Child />
        </ColorContext.Provider>
      </ColorContext.Provider>
      {/* </CountContext.Provider> */}
      {/* <p className="border">{`Current Count ${CountCtx}`}</p> */}
      {/* </CountContext.Provider> */}
    </div>
  );
}
