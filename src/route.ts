export class route {
  #route: String;
  #pageElementObject: HTMLElement;

  /**
   * Initialization a route.
   * @param route The route's name, like: www.xxx.com/x#page1. The "page1" is routeName
   * @param ele The element object to which the route is bound
   */
  constructor(route: String, ele: HTMLElement) {
    this.#route = route;
    this.#pageElementObject = ele;
    if (window.location.hash === this.#route) {
      this.#pageElementObject.style.display = "none";
    }
  }

  /**
   * checkout route for the page
   */
  toggle() {
    window.location.href = `${location.search}#${this.#route}`;
  }
}
