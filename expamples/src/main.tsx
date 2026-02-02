// import { createRoot } from 'react-dom/client'
import { ReactDOM, Fragment, Component } from "../which-react";
import "./index.css";

// let element = (
//   <div className="box border">
//     <h1 className="border">Lin</h1>
//     <h2>react</h2>
//   </div>
// );

/** 渲染文本节点

// 渲染文本节点1:
// ReactDOM.createRoot(document.getElementById("root")!).render("omg");

// 渲染文本节点2:
// const element = (
//   <div className="box border">
//     <h1 className="border">Lin</h1>
//     <h2>react</h2>
//     omg2
//   </div>
// );
 */

/** 渲染 fragment 节点
 * 
 
// 渲染 fragment 节点1:
const fragment1: any = (
  <>
    <h3>1</h3>
    <h4>2</h4>
  </>
);

let element = (
  <div className="box border">
    <h1 className="border">Lin</h1>
    <h2>react</h2>
    omg
    {fragment}
  </div>
);


// 渲染 fragment 节点2:
const element: any = (
  <>
    <h3>1</h3>
    <h4>2</h4>
  </>
);

// 渲染 fragment 节点3:
const element: any = (
  <Fragment key="sy">
    <h3>1</h3>
    <h4>2</h4>
  </Fragment>
);
 */

/** 渲染类组件
class ClassComponent extends Component {
  render() {
    return (
      <div>
        <h3>ClassComponent</h3>
      </div>
    );
  }
}

const element = <ClassComponent />;
 */

/** 渲染函数组件
function FunctionComponent() {
  return (
    <div>
      <h3>FunctionComponent</h3>
    </div>
  );
}

const element = <FunctionComponent />;
 */

function FunctionComponent() {
  return (
    <div>
      <h3>FunctionComponent</h3>
    </div>
  );
}

const element = <FunctionComponent />;

ReactDOM.createRoot(document.getElementById("root")!).render(element);
