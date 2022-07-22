export class Route {
  #routeList: r[];
  #main: String;

  constructor() {
    /**
     * 1.第一次渲染,调用change
     * 2.当hash(#后面的值)发生变化,调用一次change
     * 3.change变化之后,改变url hash的值
     */
    this.#change(window.location.hash.replace(/#/, ""));
    window.onhashchange = () => {
      this.#change(window.location.hash.replace(/#/, ""));
    };
    this.#routeList = [];
  }

  /**
   * load the route
   * @date 2022-07-22
   * @param {r} obj path and element (route object)
   * @returns {any}
   */
  useRoute(obj: r) {
    this.#routeList.push(obj);
    this.#change(obj.path);
  }

  /**
   * set the router main page
   * @date 2022-07-22
   * @param {String} path main page path
   * @returns {any}
   */
  useMainRoute(path: String) {
    this.#main = path;
    this.#change(path);
  }

  #change(path: String) {
    /** */
    if (typeof this.#main === "undefined") return;
    if (path === "") {
      try {
        this.#routeList.forEach((i) => {
          if (i.path === this.#main) {
            i.ele.style.visibility = "visible";
            throw new Error("break");
          } else {
            i.ele.style.visibility = "hidden";
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
        } else {
          i.ele.style.visibility = "visible";
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
