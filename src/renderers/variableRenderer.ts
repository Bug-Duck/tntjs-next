import { evaluate } from "../lib/common";
import { watchEffect } from "../reactivity";
import { VNode } from "../vdom";
import { Renderer } from "./index";

const variableRenderer = (currentNode: VNode, extraContext: string) => {
  watchEffect(() => {
    currentNode.children = evaluate(
      currentNode.props.data,
      extraContext
    ).toString();
  });
  return true;
};

const renderer: Renderer = {
  renderer: variableRenderer,
  name: "variableRenderer",
  watchTags: ["v"],
};

export default renderer;
