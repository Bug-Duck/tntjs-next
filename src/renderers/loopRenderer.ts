import { deepClone, evaluate } from "../lib/common";
import {
  createVdomFromExistingElement,
  createVNodeFromElement,
  VNode,
} from "../vdom";
import { Renderer } from "./index";

/**
 * Render a `<t-for />` loop.
 * @param currentNode Currently rendering VNode.
 * @param extraContext Some extra context to fill in to the evaluation process.
 * @returns Whether to continue rendering its children or not.
 */
const loopRenderer = (currentNode: VNode, extraContext: string) => {
  const expr = currentNode.props.data.split(" in ");
  const localName = expr[0].trim();
  const loopingValue = evaluate(expr[1].trim(), extraContext);
  const originalChild: Element = deepClone(currentNode.el.children[0]);
  for (const currentData of loopingValue) {
    const currentChild = createVNodeFromElement(originalChild);
    // custom rendering logic
    createVdomFromExistingElement(
      currentChild,
      currentChild.el,
      `const ${localName} = ${JSON.stringify(currentData)}; ${extraContext};`
    );
    (currentNode.children as VNode[]).push(currentChild);
  }
  // do not render its children since they're already rendered
  return false;
};

const renderer: Renderer = {
  renderer: loopRenderer,
  name: "loopRenderer",
  watchTags: ["t-for"],
};

export default renderer;
