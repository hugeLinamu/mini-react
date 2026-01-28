// import { createRoot } from 'react-dom/client'
import { ReactDOM } from "../which-react";
import "./index.css";


const element = <div className="box border">
  <h1 className="border">Lin</h1>
</div>;

ReactDOM.createRoot(document.getElementById("root")!).render(element);
