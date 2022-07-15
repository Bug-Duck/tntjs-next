/* eslint-disable no-new-func */
import { deepClone } from "./lib/common";
import { watchEffect } from "./reactivity";
import {
  createVdomFromExistingElements,
  getAttributesOfElement,
  h,
  mount,
  patch,
  VNode,
} from "./vdom";

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
