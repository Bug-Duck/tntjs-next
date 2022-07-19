import { evaluate } from "../lib/common";
import { reactive } from "../reactivity";
import { VNode } from "../vdom";
import { RenderedContent, Renderer } from "./index";

const getRenderer = (
  currentNode: VNode,
  extraContext: object
): RenderedContent => {
  // get url datas from src
  const url = currentNode.props.src;
  const type = currentNode.props.type;
  const http = new XMLHttpRequest();
  if (type === "text" || type === undefiend) {
  }

  // const localVar = reactive(evaluate(currentNode.props.value, extraContext));
  return {
    shouldRender: true,
    injectVariables: { [currentNode.props.key]: localVar },
  };
};

const renderer: Renderer = {
  renderer: getRenderer,
  name: "getRenderer",
  shouldFire(node) {
    return node.tag === "t-get";
  },
};

export default renderer;
