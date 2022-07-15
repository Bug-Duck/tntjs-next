import { evaluate } from "./lib/common";
import renderers from "./renderers/index";

export interface VNode {
  tag: string;
  props: Record<string, string>;
  children: VNode[] | string;
  el: Element;
}

export const h = (
  tag: string,
  props: Record<string, string> = {},
  children: VNode[] | string = [],
  el?: Element
): VNode => {
  return { tag, props, children, el };
};

export const mount = (vnode: VNode, root: Element) => {
  const el = (vnode.el = document.createElement(vnode.tag));
  // processing props
  for (const key in vnode.props) {
    const value = vnode.props[key];
    if (key.startsWith("on")) {
      el.addEventListener(key.slice(2).toLowerCase(), evaluate(value));
      continue;
    }
    el.setAttribute(key, value);
  }
  // processing children
  if (typeof vnode.children === "string") {
    el.textContent = vnode.children;
    root.appendChild(el);
    return;
  }
  vnode.children.forEach((child) => {
    mount(child, el);
  });
  root.appendChild(el);
};

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
