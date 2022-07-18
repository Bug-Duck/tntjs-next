import { deepClone } from "./lib/common";
import { computed, reactive, ref, trigger, watchEffect } from "./reactivity";
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
  #reactiveData: object;
  /** Computed data object */
  #computedData: object;
  /** Reference-value data object */
  #refData: object;
  /** Helper proxy for watching modifications on data */
  #dataProxy: object;
  /** Original data passed into {@link TNTApp.useData()} */
  #originalData: object;
  /** Function to run when application was first mounted */
  #onMounted: (app: TNTApp) => void;
  /** Helper array for storing currently called `TNTApp.use*` hooks. */
  #hooksCalled: string[];
  /** Effects watched in {@link TNTApp.useEffect()} */
  #watchEffects: TNTEffect[];

  constructor() {
    this.#onMounted = () => {};
    this.#hooksCalled = [];
    this.#computedData = {};
    this.#reactiveData = {};
    this.#refData = {};
    this.#watchEffects = [];
    this.#originalData = {};
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
      const extraContext = {
        ...this.#reactiveData,
      };
      // normalization for ref-based data
      for (const key in this.#computedData) {
        // commented code will not update when running attribute renderer
        // FIXME: fix inconsistent reaction of updating ref-based data
        // extraContext[key] = this.#computedData[key].value;
        extraContext[key] = this.#computedData[key];
      }
      for (const key in this.#refData) {
        // FIXME: fix inconsistent reaction of updating ref-based data
        // extraContext[key] = this.#refData[key].value;
        extraContext[key] = this.#refData[key];
      }
      vnode.el = currentContainer;
      createVdomFromExistingElement(vnode, currentContainer, extraContext);
      currentNode = h(
        container.tagName,
        getAttributesOfElement(currentContainer),
        vnode.children,
        currentContainer
      );
      if (!isMounted) {
        prevVdom = deepClone(currentNode);
        mount(prevVdom, container, extraContext);
        isMounted = true;
        this.#removeUpdatedElements(container, currentContainer);
        this.#onMounted(this);
        return;
      }
      const newVdom: VNode = deepClone(currentNode);
      patch(prevVdom, newVdom, extraContext);
      prevVdom = deepClone(newVdom);
      this.#removeUpdatedElements(container, currentContainer);
    });

    return this;
  }

  /** All defined reactive / ref data. */
  get data() {
    return this.#dataProxy;
  }

  /**
   * Generate a new TNT data proxy based on reactive and reference data.
   * The generated proxy will watch for re-assignments as well as reading values and handle edge cases.
   * @returns Proxied TNT data object.
   */
  #getDataProxy() {
    type MixedTarget = { reactive: object; computed: object; ref: object };

    const syncData = (target: MixedTarget, prop: string, value: object) => {
      // edge-case handling for re-assgining arrays
      if (Array.isArray(value)) {
        // re-creating the reactive array will drop its former effects
        // so for work-around this will clear the array and push new elements into it
        // TODO: improve performance for re-assigning reactive arrays
        target.reactive[prop].splice(0, target.reactive[prop].length);
        target.reactive[prop].push(...value);
      }
      // manually trigger an update
      trigger(this.#originalData, prop);
    };

    const handlers = {
      get(target: MixedTarget, prop: string) {
        if (prop in target.reactive) {
          return target.reactive[prop];
        }
        if (prop in target.computed) {
          return target.computed[prop].value;
        }
        if (prop in target.ref) {
          return target.ref[prop].value;
        }
        console.warn(
          `[TNT warn] You accessed a value not defined (Reading '${prop}').`
        );
        return undefined;
      },
      set(target: MixedTarget, prop: string, value: object) {
        if (prop in target.reactive) {
          syncData(target, prop, value);
          return true;
        }
        if (prop in target.ref) {
          target.ref[prop].value = value;
          return true;
        }
        console.warn(
          `[TNT warn] You set a value not defined (Reading '${prop}').`
        );
        return false;
      },
    };

    return new Proxy(
      {
        reactive: this.#reactiveData,
        computed: this.#computedData,
        ref: this.#refData,
      },
      handlers
    );
  }

  /**
   * Hook to create reactive data objects.
   * @param data Data to become reactive.
   * @returns Current `TNTApp` instance.
   */
  useData(data: TNTData) {
    this.#hooksCalled.push("data");
    this.#originalData = deepClone(data);
    this.#reactiveData = {};
    this.#refData = {};
    for (const key in data) {
      if (typeof data[key] === "object") {
        this.#reactiveData[key] = reactive(data[key]);
        continue;
      }
      // currently the only way to re-assign ref-based objects is by using `data.prop = xxx`
      // directly using `prop = xxx` will not work
      // TODO: remove limatations on reference objects
      this.#refData[key] = ref(data[key]);
    }
    this.#dataProxy = this.#getDataProxy();
    window.data = this.#dataProxy;
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
      this.#computedData[key] = computed(computedValues[key]);
    }
    this.#dataProxy = this.#getDataProxy();
    window.data = this.#dataProxy;
    return this;
  }

  /**
   * Hook to watch effect dependency updates.
   * @param effect Effect function to watch.
   * @returns Current `TNTApp` instance.
   */
  useEffect(effect: TNTEffect) {
    this.#hooksCalled.push("effect");
    this.#watchEffects.push(effect);
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
