import { ServerRouter } from "./lib/index.js";
import { HomePage } from "./pages/HomePage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";

export const render = async (url, query) => {
  const router = new ServerRouter();

  router.addRoute("/", () => HomePage);
  router.addRoute("/product/:id/", () => ProductDetailPage);
  router.addRoute(".*", () => {
    return {
      renderPage: () => {
        return {
          head: "<title>404 페이지</title>",
          html: NotFoundPage(router),
        };
      },
    };
  });

  router.start(url, query);

  const { renderPage } = router.route.handler();

  return renderPage(router);
};
