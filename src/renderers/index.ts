import { VNode } from "../vdom";
import variableRenderer from "./variableRenderer";
import conditionRenderer from "./conditionRenderer";
import loopRenderer from "./loopRenderer";

export interface RenderedContent {
  shouldRender: boolean;
  injectVariables?: Record<string, string>;
}

export interface Renderer {
  renderer: (
    currentNode: VNode,
    extraContext: string,
    rootVNode: VNode,
    index: number
  ) => boolean | RenderedContent;
  name: string;
  watchTags: string[];
}

export default {
  renderers: [variableRenderer, conditionRenderer, loopRenderer],
};
