/* eslint-disable no-new-func */
import { deepClone } from "./lib/common";
import { watchEffect } from "./reactivity";
import { h, mount, patch, VNode } from "./vdom";

export interface RootComponent {
  render: () => VNode;
}

export class TNTApp {
  constructor(container: Element) {
    let isMounted = false;
    let prevVdom: VNode | null = null;
    let currentNode = null;

    watchEffect(() => {
      const currentContainer = currentNode?.el ?? container.children[0];
      const vnode = h(
        currentContainer.tagName,
        this.getAttributesOfElement(currentContainer),
        []
      );
      vnode.el = currentContainer;
      this.createVdomFromExistingElements(vnode, currentContainer);
      currentNode = h(
        container.tagName,
        this.getAttributesOfElement(currentContainer),
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

  getAttributesOfElement(element: Element): Record<string, string> {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++)
      attributes[element.attributes[i].name] = element.attributes[i].value;
    return attributes;
  }

  createVdomFromExistingElements(rootVNode: VNode, container: Element) {
    let isTextCreated = false;
    [...container.children].forEach((child, index) => {
      let shouldRender = true;
      const currentNode = h(
        child.tagName.toLowerCase(),
        this.getAttributesOfElement(child),
        []
      );
      currentNode.el = child;
      if (currentNode.tag === "v") {
        watchEffect(() => {
          currentNode.children = Function(
            `return ${currentNode.props.data}`
          )().toString();
        });
      }
      if (currentNode.tag === "t-if") {
        watchEffect(() => {
          const result = Function(`return ${currentNode.props.cond}`)();
          shouldRender = !!result;
        });
      }
      if (currentNode.tag === "t-else") {
        const ifElement = (rootVNode.children as VNode[])[
          rootVNode.children.length - 1
        ];
        if (index - 1 !== 0 && ifElement.tag === "t-if") {
          watchEffect(() => {
            const result = Function(`return ${ifElement.props.cond}`)();
            shouldRender = !result;
          });
        }
      }
      if (shouldRender) {
        this.createVdomFromExistingElements(currentNode, child);
      }
      (rootVNode.children as VNode[]).push(currentNode);
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
