/**
 * 간단한 SSR 라우터
 */
export class ServerRouter {
  #currentUrl;

  #routes;
  #route;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  get targetUrl() {
    return this.#currentUrl;
  }

  get query() {
    const { search } = new URL(this.#currentUrl, "http://localhost:3000");
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  #findRoute() {
    const { pathname } = new URL(this.#currentUrl, "http://localhost:3000");
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  start(url) {
    this.#currentUrl = url;
    this.#route = this.#findRoute();
  }
}
