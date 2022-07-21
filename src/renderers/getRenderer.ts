import { evaluate } from "../lib/common";
import { reactive } from "../reactivity";
import { VNode } from "../vdom";
import { RenderedContent, Renderer } from "./index";

const getRenderer = (
  currentNode: VNode,
  extraContext: object
): RenderedContent => {
  let buffer: {};
  // get url datas from src
  const getUrlResult = currentNode.props.src;
  const getDatasType = currentNode.props.type;
  const httpGetRequest = new XMLHttpRequest();
  // TODO: improve this request method to async and don't do sync operations on the main thread
  httpGetRequest.open("GET", getUrlResult, false);
  httpGetRequest.send();

  httpGetRequest.onreadystatechange = () => {
    if (getDatasType === "text") {
      const datas = httpGetRequest.responseText;
      currentNode.children = [evaluate(datas, extraContext).toString()];
    } else if (getDatasType === "json") {
      const jsonData = httpGetRequest.response;
      if (!jsonData) return;
      const data = JSON.parse(jsonData);
      buffer = reactive(data);
    }
  };

  return {
    shouldRender: true,
    injectVariables: buffer,
  };
};

const renderer: Renderer = {
  renderer: getRenderer,
  name: "getRenderer",
  shouldFire(node) {
    return node.tag === "t-get";
  },
};

export default renderer;
