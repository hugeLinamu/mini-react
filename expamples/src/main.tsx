// import { createRoot } from 'react-dom/client'
import { ReactDOM } from "../which-react";
import "./index.css";

// let element = (
//   <div className="box border">
//     <h1 className="border">Lin</h1>
//     <h2>react</h2>
//   </div>
// );

// 渲染文本节点1:
// ReactDOM.createRoot(document.getElementById("root")!).render("omg");

// 渲染文本节点2:
const element = (
  <div className="box border">
    <h1 className="border">Lin</h1>
    <h2>react</h2>
    omg2
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(element);
