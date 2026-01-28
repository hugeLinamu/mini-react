import { ReactNodeList } from "shared/ReactTypes";
import { createFiberRoot } from "react-reconciler/src/ReactFiberRoot";
import { updateContainer } from "react-reconciler/src/ReactFiberReconciler";
import { FiberRoot } from "react-reconciler/src/ReactInternalTypes";

type RootType = {
  render: (children: ReactNodeList) => void;
  _internalRoot: FiberRoot;
};

function ReactDOMRoot(_internalRoot: FiberRoot) {
  this._internalRoot = _internalRoot;
}

// 渲染 React 的JSX
ReactDOMRoot.prototype.render = function (children: ReactNodeList) {
  const root: FiberRoot | null = this._internalRoot;
  if (root === null) {
    throw new Error("Cannot update an unmounted root.");
  }
  console.log(children,'children--->')
  console.log(root,'root--->')
  updateContainer(children, root);
};

export const createRoot = (
  container: Element | Document | DocumentFragment,
): RootType => {
  // 创建FiberRoot，并创建一个Fiber 挂载在current上
  const root: FiberRoot = createFiberRoot(container);

  return new ReactDOMRoot(root);
};

export default {
  createRoot,
};
