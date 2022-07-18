import { evaluate } from "../lib/common";
import { watchEffect } from "../reactivity";
import { VNode } from "../vdom";
import { Renderer } from "./index";

/**
 * Render attribute bindings.
 * @param currentNode Current VNode to render.
 * @param extraContext Some extra context to inject.
 * @returns Whether to continue rendering `currentNode`'s children or not.
 */
const attributeRenderer = (currentNode: VNode, extraContext: object) => {
  for (const key in currentNode.props) {
    if (!key.startsWith(":")) continue;
    if (key.startsWith(":on")) {
      console.warn(
        "[TNT warn] Using reactive binding and event listeners at the same time will cause the program to run not as expected.",
        "Please extract logic or remove one of the effect bindings."
      );
    }
    // original attribute is no longer needed
    currentNode.el.removeAttribute(key);
    watchEffect(() => {
      currentNode.el.setAttribute(
        key.slice(1),
        evaluate(currentNode.props[key], extraContext)
      );
    });
  }
  return true;
};

const renderer: Renderer = {
  renderer: attributeRenderer,
  name: "attributeRenderer",
  shouldFire(node) {
    for (const key in node.props) {
      if (key.startsWith(":")) return true;
    }
    return false;
  },
  fireOnMounted: true,
};

export default renderer;
