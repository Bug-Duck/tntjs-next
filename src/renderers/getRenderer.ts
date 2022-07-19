import { evaluate } from "../lib/common";
import { reactive } from "../reactivity";
import { VNode } from "../vdom";
import { RenderedContent, Renderer } from "./index";

const getRenderer = (
  currentNode: VNode,
  extraContext: object
): RenderedContent => {
  let buffer: {};
  // get url datas from src
  const url = currentNode.props.src;
  const type = currentNode.props.type;
  const http = new XMLHttpRequest();
  http.open("GET", url, true);
  http.send();
  const result = http.responseText;
  if (type === "text" || type === undefined) {
    currentNode.children = [
      evaluate(result, extraContext).toString()
    ]
  } else if (type === "json") {
    const datas = JSON.parse(result);
    for (const data of datas) {
      buffer[data] = reactive(evaluate(datas[data]));
    };
  }

  return {
    shouldRender: true,
    injectVariables: buffer,
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
