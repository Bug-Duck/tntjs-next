import { evaluate } from "./lib/common";
import { watchEffect } from "./reactivity";
import renderers from "./renderers/index";

/** A Virtual Node representation. */
export interface VNode {
  /** Node tag name. */
  tag: string;
  /** Node properties */
  props: Record<string, string>;
  /** Node children */
  children: VNode[] | string;
  /** Actual element in DOM for the current VNode. */
  el: Element;
}

/**
 * Constructs a VNode.
 * @param tag Tag name.
 * @param props Tag attributes / properties.
 * @param children Tag children.
 * @param el Tag actual DOM element
 * @returns Constructed Virtual DOM Node.
 */
export const h = (
  tag: string,
  props: Record<string, string> = {},
  children: VNode[] | string = [],
  el?: Element
): VNode => {
  return { tag, props, children, el };
};

/**
 * Mounts a VNode to an actual DOM element.
 * @param vnode The root VNode to mount with.
 * @param container The container DOM element to contain all generated nodes.
 * @returns The container element with generated nodes appended.
 */
export const mount = (vnode: VNode, container: Element) => {
  const el = (vnode.el = document.createElement(vnode.tag));
  // processing props
  for (const key in vnode.props) {
    const value = vnode.props[key];
    if (key.startsWith(":")) {
      if (key.startsWith(":on")) {
        console.warn(
          "[TNT warn] Using reactive binding and event listeners at the same time will cause the program to run not as expected.",
          "Please extract logic or remove one of the effect bindings."
        );
      }
      watchEffect(() => {
        vnode.el.setAttribute(key.slice(1), evaluate(value));
      });
      vnode.el.removeAttribute(key);
      continue;
    }
    if (key.startsWith("on")) {
      el.addEventListener(key.slice(2).toLowerCase(), evaluate(value));
      vnode.el.removeAttribute(key);
      continue;
    }
    el.setAttribute(key, value);
  }
  // processing children
  if (typeof vnode.children === "string") {
    el.textContent = vnode.children;
    container.appendChild(el);
    return;
  }
  vnode.children.forEach((child) => {
    mount(child, el);
  });
  container.appendChild(el);
  return container;
};

/**
 * Patches the current actual element to a new VNode and replace the older one.
 * Note that this function will modify the DOM.
 * @param n1 The old VNode to be replaced.
 * @param n2 The newer VNode to update the current DOM to.
 */
export const patch = (n1: VNode, n2: VNode) => {
  if (n1.tag === n2.tag) {
    const el = (n2.el = n1.el);
    // props
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    for (const key in newProps) {
      const oldValue = oldProps[key];
      const newValue = newProps[key];
      if (newValue === oldValue) continue;
      el.setAttribute(key, newValue);
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        el.removeAttribute(key);
      }
    }

    // children
    const oldChildren = n1.children;
    const newChildren = n2.children;
    if (typeof newChildren === "string") {
      if (typeof oldChildren === "string" && newChildren !== oldChildren) {
        el.textContent = newChildren;
        return;
      }
      el.textContent = newChildren;
      return;
    }
    if (typeof oldChildren === "string") {
      el.innerHTML = "";
      newChildren.forEach((child) => {
        mount(child, el);
      });
      return;
    }
    const commonLength = Math.min(oldChildren.length, newChildren.length);
    for (let i = 0; i < commonLength; i++) {
      patch(oldChildren[i], newChildren[i]);
    }
    if (newChildren.length > oldChildren.length) {
      newChildren.slice(oldChildren.length).forEach((child) => {
        mount(child, el);
      });
      return;
    }
    if (newChildren.length < oldChildren.length) {
      oldChildren.slice(newChildren.length).forEach((child) => {
        el.removeChild(child.el);
      });
      return;
    }
    return;
  }
  throw new Error("Replacing root elements are not supported.");
};

/**
 * Helper function to get and convert attributes from an element to use the object structure.
 * @param element The element to get attributes from.
 * @returns Attributes in a single object-like structure.
 */
export const getAttributesOfElement = (
  element: Element
): Record<string, string> => {
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++)
    attributes[element.attributes[i].name] = element.attributes[i].value;
  return attributes;
};

/**
 * Generates a new VNode from existing elemnt.
 * @param rootVNode The root VNode to append children to.
 * @param container The container element to generate VNodes from.
 * @param extraContext Some extra context data to pass to `evaulate()`.
 */
export const createVdomFromExistingElement = (
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
      createVdomFromExistingElement(currentNode, child, injectContext);
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
};

/**
 * Create a new VNode from the given element.
 * @param node Element to create VNode from.
 * @returns The generated VNode object.
 */
export const createVNodeFromElement = (node: Element): VNode => {
  let children: VNode[] | string = "";
  // children edge cases handling
  if (!node.children.length) {
    children = [];
  } else if (
    node.children[0].nodeType === Node.TEXT_NODE &&
    node.children[0].textContent.trim()
  ) {
    children = node.children[0].textContent;
  } else {
    children = [...node.children]
      .filter(
        (child) => child.children.length && child.children[0].textContent.trim()
      )
      .map((child) => createVNodeFromElement(child));
  }
  return h(
    node.tagName.toLowerCase(),
    getAttributesOfElement(node),
    children,
    node
  );
};
