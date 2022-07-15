import { evaluate } from "./lib/common";

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
  } else {
    vnode.children.forEach((child) => {
      mount(child, el);
    });
  }
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
      if (newValue !== oldValue) {
        el.setAttribute(key, newValue);
      }
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
      if (typeof oldChildren === "string") {
        if (newChildren !== oldChildren) {
          el.textContent = newChildren;
        }
      } else {
        el.textContent = newChildren;
      }
    } else {
      if (typeof oldChildren === "string") {
        el.innerHTML = "";
        newChildren.forEach((child) => {
          mount(child, el);
        });
      } else {
        const commonLength = Math.min(oldChildren.length, newChildren.length);
        for (let i = 0; i < commonLength; i++) {
          patch(oldChildren[i], newChildren[i]);
        }
        if (newChildren.length > oldChildren.length) {
          newChildren.slice(oldChildren.length).forEach((child) => {
            mount(child, el);
          });
        } else if (newChildren.length < oldChildren.length) {
          oldChildren.slice(newChildren.length).forEach((child) => {
            el.removeChild(child.el);
          });
        }
      }
    }
  } else {
    // replace
  }
};
