import {
  createVdomFromExistingElements,
  getAttributesOfElement,
} from "../index";
import { deepClone, evaluate } from "../lib/common";
import { h, VNode } from "../vdom";
import { Renderer } from "./index";

const getVNodeFromElement = (node: Element): VNode => {
  // console.log(node.children, node);
  let children: VNode[] | string = "";
  if (!node.children.length) {
    children = [];
  } else if (
    node.children[0].nodeType === Node.TEXT_NODE &&
    node.children[0].textContent.trim()
  ) {
    children = node.children[0].textContent;
  } else {
    children = [...node.children]
      .filter(
        (child) => child.children.length && child.children[0].textContent.trim()
      )
      .map((child) => getVNodeFromElement(child));
  }
  return h(
    node.tagName.toLowerCase(),
    getAttributesOfElement(node),
    children,
    node
  );
};

const loopRenderer = (currentNode: VNode, extraContext: string) => {
  const expr = currentNode.props.data.split(" in ");
  const localName = expr[0].trim();
  const loopingValue = evaluate(expr[1].trim(), extraContext);
  const originalChild: Element = deepClone(currentNode.el.children[0]);
  for (const currentData of loopingValue) {
    const currentChild = getVNodeFromElement(originalChild);
    createVdomFromExistingElements(
      currentChild,
      currentChild.el,
      `const ${localName} = ${JSON.stringify(currentData)}; ${extraContext}`
    );
    (currentNode.children as VNode[]).push(currentChild);
  }
  return false;
};

const renderer: Renderer = {
  renderer: loopRenderer,
  name: "loopRenderer",
  watchTags: ["t-for"],
};

export default renderer;
