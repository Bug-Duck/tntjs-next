import { deepClone } from "./lib/common";
import { computed, reactive, watchEffect } from "./reactivity";
import {
  createVdomFromExistingElement,
  getAttributesOfElement,
  h,
  mount,
  patch,
  VNode,
} from "./vdom";

export type TNTData = object;

export type TNTEffect = () => any;

export type TNTComputed = Record<string, TNTEffect>;

// tweak the Window object a bit to pass type check
declare global {
  export interface Window {
    data: TNTData;
  }
}

/** Create a new TNTjs application. */
export class TNTApp {
  /** Reactive data object */
  data: object;
  #onMounted: (app: TNTApp) => void;
  #hooksCalled: string[];

  constructor() {
    this.#onMounted = () => {};
    this.#hooksCalled = [];
    this.data = {};
    window.data = {};
  }

  /**
   * Initialize and mount a new TNT Application.
   * @param container The container element to mount with.
   * @returns Mounted TNTApp instance.
   */
  mount(container: Element) {
    let isMounted = false;
    let prevVdom: VNode | null = null;
    let currentNode = null;
    this.#hooksCalled.push("mount");

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
        this.#onMounted(this);
        return;
      }
      const newVdom: VNode = deepClone(currentNode);
      patch(prevVdom, newVdom);
      prevVdom = newVdom;
      this.#removeUpdatedElements(container, currentContainer);
    });

    return this;
  }

  /**
   * Hook to create reactive data objects.
   * @param data Data to become reactive.
   * @returns Current `TNTApp` instance.
   */
  useData(data: TNTData) {
    this.#hooksCalled.push("data");
    this.data = { ...this.data, ...reactive(data) };
    window.data = this.data;
    return this;
  }

  /**
   * Hook to create computed values with ease.
   * @param computedValues Functions to calcuate each computed value.
   * @returns Current `TNTApp` instance.
   */
  useComputed(computedValues: TNTComputed) {
    this.#hooksCalled.push("computed");
    if (!this.#hooksCalled.includes("data")) {
      console.warn(
        "[TNT warn] useComputed() hook is called before useData(). Any reactive data accessed from computed functions will not be accessable.",
        "This may lead to unpredictable results or errors."
      );
    }
    for (const key in computedValues) {
      this.data[key] = computed(computedValues[key]);
    }
    window.data = this.data;
    return this;
  }

  /**
   * Hook to watch effect dependency updates.
   * @param effect Effect function to watch.
   * @returns Current `TNTApp` instance.
   */
  useEffect(effect: TNTEffect) {
    this.#hooksCalled.push("effect");
    watchEffect(effect);
    return this;
  }

  /**
   * Run the specified effect when application is mounted.
   * @param effect Effect to run when application is mounted.
   * @returns Current `TNTApp` instance.
   */
  onMounted(effect: TNTEffect) {
    this.#onMounted = effect;
    return this;
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
