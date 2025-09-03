import { getCategories, getProduct, getProducts } from "./api/productApi.js";
import { HomePage } from "./pages/HomePage.js";

import { NotFoundPage } from "./pages/NotFoundPage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { router } from "./router/router.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { productStore } from "./stores/productStore.js";

router.addRoute("/", () => {
  return {
    head: "<title>홈페이지</title>",
    html: HomePage,
    getSSRData: async () => {
      const response = await Promise.all([getProducts(router.query), getCategories()]);
      const [
        {
          products,
          pagination: { total },
        },
        categories,
      ] = response;

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products,
          categories,
          totalCount: total,
          loading: false,
          status: "done",
        },
      });

      return {
        products,
        categories,
        totalCount: total,
      };
    },
  };
});

router.addRoute("/product/:id/", () => {
  return {
    head: "<title>상품 상세 페이지</title>",
    html: ProductDetailPage,
    getSSRData: async () => {
      const response = await getProduct(router.params.id);
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: response,
      });

      return response;
    },
  };
});

router.addRoute(".*", () => {
  return {
    head: "<title>404 페이지</title>",
    html: NotFoundPage,
  };
});

export const render = async (url) => {
  router.start(url);

  console.log("🚀 ~ render ~ route: ", url, router.route);

  if (!router.route) {
    return;
  }

  return router.route.handler();
};
