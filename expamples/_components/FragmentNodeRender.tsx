import { Fragment } from "../which-react";

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
    {fragment1}
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

const fragment1: any = (
  <>
    <h3>1</h3>
    <h4>2</h4>
  </>
);

export default function FragmentComponent() {
  return (
    <div className="box border">
      <h1 className="border">Lin</h1>
      <h2>react</h2>
      omg
      {fragment1}
    </div>
  );
}
