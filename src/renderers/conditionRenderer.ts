import { evaluate } from "../lib/common";
import { watchEffect } from "../reactivity";
import { VNode } from "../vdom";
import { Renderer } from "./index";

const ifRenderer = (currentNode: VNode, extraContext: string) => {
  let shouldRender = false;
  watchEffect(() => {
    const result = evaluate(currentNode.props.cond, extraContext);
    shouldRender = !!result;
    currentNode.props.rendered = shouldRender.toString();
  });
  return shouldRender;
};

const elifRenderer = (
  currentNode: VNode,
  extraContext: string,
  rootVNode: VNode,
  index: number
) => {
  let shouldRender = false;
  const allowedPreviousElementTags = ["t-if", "t-elif"];
  const previousElement = (rootVNode.children as VNode[])[
    rootVNode.children.length - 1
  ];
  if (
    index - 1 === 0 ||
    !allowedPreviousElementTags.includes(previousElement.tag) ||
    previousElement.props.rendered === "true"
  )
    return false;
  watchEffect(() => {
    const result = evaluate(currentNode.props.cond, extraContext);
    shouldRender = !!result;
    currentNode.props.rendered = shouldRender.toString();
  });
  return shouldRender;
};

const elseRenderer = (
  currentNode: VNode,
  extraContext: string,
  rootVNode: VNode,
  index: number
) => {
  let shouldRender = false;
  const allowedPreviousElementTags = ["t-if", "t-elif"];
  const previousElement = (rootVNode.children as VNode[])[
    rootVNode.children.length - 1
  ];
  if (
    index - 1 === 0 ||
    !allowedPreviousElementTags.includes(previousElement.tag)
  )
    return false;
  watchEffect(() => {
    const result = evaluate(previousElement.props.cond, extraContext);
    shouldRender = !result;
    currentNode.props.rendered = shouldRender.toString();
  });
  return shouldRender;
};

const conditionRenderer = (
  currentNode: VNode,
  extraContext: string,
  rootVNode: VNode,
  index: number
) => {
  let currentRenderer = null;
  if (currentNode.tag === "t-if") {
    currentRenderer = ifRenderer;
  } else if (currentNode.tag === "t-elif") {
    currentRenderer = elifRenderer;
  } else {
    currentRenderer = elseRenderer;
  }
  return currentRenderer(currentNode, extraContext, rootVNode, index);
};

const renderer: Renderer = {
  renderer: conditionRenderer,
  name: "conditionRenderer",
  watchTags: ["t-if", "t-elif", "t-else"],
};

export default renderer;
