// import TextElement from "../_components/TextNodeRender";
// import FragmentElement from "../_components/FragmentNodeRender";
// import ClassComponent from "../_components/ClassNodeRender";
// import FunctionComponent from "../_components/FunctionNodeRender";
import FunctionHooksComponent from "../_components/FunctionHooks";

import { ReactDOM } from "../which-react";
import "./index.css";

// let element = (
//   <div className="box border">
//     <h1 className="border">Lin</h1>
//     <h2>react</h2>
//   </div>
// );

ReactDOM.createRoot(document.getElementById("root")!).render(
  <FunctionHooksComponent />,
);
