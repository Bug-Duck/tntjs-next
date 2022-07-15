/* eslint-disable no-new-func */
import { deepClone } from "./lib/common";
import { watchEffect } from "./reactivity";
import renderers from "./renderers/index";
import { h, mount, patch, VNode } from "./vdom";

export interface RootComponent {
  render: () => VNode;
}

export const getAttributesOfElement = (
  element: Element
): Record<string, string> => {
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++)
    attributes[element.attributes[i].name] = element.attributes[i].value;
  return attributes;
};

export const createVdomFromExistingElements = (
  rootVNode: VNode,
  container: Element,
  extraContext = ""
) => {
  let isTextCreated = false;
  [...container.children].forEach((child, index) => {
    let shouldRender = true;
    let injectContext = extraContext;
    const currentNode = h(
      child.tagName.toLowerCase(),
      getAttributesOfElement(child),
      []
    );
    currentNode.el = child;
    renderers.renderers.forEach((renderer) => {
      if (!renderer.watchTags.includes(currentNode.tag)) return;
      const renderResult = renderer.renderer(
        currentNode,
        injectContext,
        rootVNode,
        index
      );
      if (typeof renderResult === "boolean") {
        shouldRender = !renderResult ? renderResult : shouldRender;
        return;
      }
      shouldRender = renderResult.shouldRender || shouldRender;
      for (const variableName in renderResult.injectVariables) {
        injectContext += `const ${variableName} = ${JSON.stringify(
          renderResult.injectVariables[variableName]
        )};`;
      }
    });
    if (shouldRender) {
      createVdomFromExistingElements(currentNode, child, injectContext);
    }
    (rootVNode.children as VNode[]).push(currentNode);
    if (rootVNode.tag === "t-for") console.log(rootVNode);
  });
  if (rootVNode.children.length) {
    return;
  }
  container.childNodes.forEach((child) => {
    if (isTextCreated) return;
    if (!child.TEXT_NODE) return;
    if (!child.textContent.trim()) return;
    rootVNode.children = child.textContent;
    isTextCreated = true;
  });
};

export class TNTApp {
  constructor(container: Element) {
    let isMounted = false;
    let prevVdom: VNode | null = null;
    let currentNode = null;

    watchEffect(() => {
      const currentContainer = currentNode?.el ?? container.children[0];
      const vnode = h(
        currentContainer.tagName,
        getAttributesOfElement(currentContainer),
        []
      );
      vnode.el = currentContainer;
      createVdomFromExistingElements(vnode, currentContainer);
      currentNode = h(
        container.tagName,
        getAttributesOfElement(currentContainer),
        vnode.children,
        currentContainer
      );
      if (!isMounted) {
        prevVdom = deepClone(currentNode);
        mount(prevVdom, container);
        isMounted = true;
        this.#removeUpdatedElements(container, currentContainer);
        return;
      }
      const newVdom: VNode = deepClone(currentNode);
      patch(prevVdom, newVdom);
      prevVdom = newVdom;
      this.#removeUpdatedElements(container, currentContainer);
    });
  }

  #removeUpdatedElements(element: Element, toRemove: Element) {
    if (element.children.length > 1) toRemove.remove();
  }
}

export {
  computed,
  getTrackableObject,
  reactive,
  ref,
  targetMap,
  watchEffect,
} from "./reactivity";
export { h, mount, patch } from "./vdom";
