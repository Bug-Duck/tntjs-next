import { VNode } from "../vdom";
import variableRenderer from "./variableRenderer";
import conditionRenderer from "./conditionRenderer";
import loopRenderer from "./loopRenderer";

/** Return values for rendered contents. */
export interface RenderedContent {
  /** Weather the current node should render on page. */
  shouldRender: boolean;
  /** A collection of variable values to inject into the children renderers. */
  injectVariables?: Record<string, string>;
}

/** A standard renderer model for builtin or custom renderers. */
export interface Renderer {
  /**
   * The main renderer function.
   * @param currentNode VNode to render.
   * @param extraContext Some extra variable context to render the content
   * @param rootVNode Root VNode of the currently rendering VNode.
   * @param index The current position of currentNode in rootVNode's children list.
   * @returns Whether to render currentNode's children elements if returned a boolean, higher level reference elsewise (see {@link RenderedContent}).
   */
  renderer: (
    currentNode: VNode,
    extraContext: string,
    rootVNode: VNode,
    index: number
  ) => boolean | RenderedContent;
  /** Name of current renderer, only for debugging purposes. */
  name: string;
  /**
   * Tags to watch.
   * When any of these tags updates, TNT will fire the current renderer function automaticly.
   */
  watchTags: string[];
}

const renderers: Renderer[] = [
  variableRenderer,
  conditionRenderer,
  loopRenderer,
];

export default {
  /** Builtin renderers. */
  renderers,
};
