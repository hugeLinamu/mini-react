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

export default function TextNodeRender() {
  return (
    <div className="box border">
      <h1 className="border">Lin</h1>
      <h2>react</h2>
      omg2
    </div>
  );
}
