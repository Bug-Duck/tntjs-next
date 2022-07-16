import { deepClone } from "./lib/common";
import { watchEffect } from "./reactivity";
import {
  createVdomFromExistingElement,
  getAttributesOfElement,
  h,
  mount,
  patch,
  VNode,
} from "./vdom";

/** Create a new TNTjs application. */
export class TNTApp {
  /**
   * Initialize and mount a new TNT Application.
   * @param container The container element to mount with.
   */
  mount(container: Element) {
    let isMounted = false;
    let prevVdom: VNode | null = null;
    let currentNode = null;

    // app lifecycle loop
    watchEffect(() => {
      const currentContainer = currentNode?.el ?? container.children[0];
      const vnode = h(
        currentContainer.tagName,
        getAttributesOfElement(currentContainer),
        []
      );
      vnode.el = currentContainer;
      createVdomFromExistingElement(vnode, currentContainer);
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

  /**
   * Remove older child elements.
   * @param element The root element to check children length.
   * @param toRemove The child element to remove.
   */
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
