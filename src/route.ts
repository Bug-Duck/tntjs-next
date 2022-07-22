export class Route {
  #routeList: r[];
  #main: String;

  constructor() {
    /**
     * 1.第一次渲染,调用change
     * 2.当hash(#后面的值)发生变化,调用一次change
     * 3.change变化之后,改变url hash的值
     */
    this.change(window.location.hash.replace(/#/, ""));
    window.onhashchange = () => {
      this.change(window.location.hash.replace(/#/, ""));
    };
    this.#routeList = [];
  }

  useRoute(obj: r) {
    this.#routeList.push(obj);
    this.change(obj.path);
  }

  useMainRoute(path: String) {
    this.#main = path;
    this.change(path);
  }

  change(path: String) {
    /** */
    if (typeof this.#main === "undefined") return;
    if (path === "") {
      try {
        this.#routeList.forEach((i) => {
          if (i.path === this.#main) {
            i.ele.style.visibility = "visible";
            throw new Error("break");
          }
        });
      } catch (e) {
        if (e !== "break") throw e;
      }
    } else {
      this.#routeList.forEach((i) => {
        if (i.path !== path) {
          i.ele.style.visibility = "hidden";
          window.location.hash = path.toString();
        }
      });
    }
  }
}

export class r {
  #path: String;
  #pageElementObject: HTMLElement;

  constructor(path: String, pageElementObject: HTMLElement) {
    this.#pageElementObject = pageElementObject;
    this.#path = path;
  }

  get path() {
    return this.#path;
  }

  get ele() {
    return this.#pageElementObject;
  }
}

const Router = new Route();
export { Router };
