import { ProductList, SearchBar } from "../components";
import { PRODUCT_ACTIONS, productStore } from "../stores";
import { router as GlobalRouter, withLifecycle, withSSR } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";
import { getCategories, getProducts } from "../api/productApi.js";

const renderPage = (router = GlobalRouter) => {
  const productState = productStore.getState();
  const { search: searchQuery, limit, sort, category1, category2 } = router.query;
  const { products, loading, error, totalCount, categories } = productState;
  const category = { category1, category2 };
  const hasMore = products.length < totalCount;

  return PageWrapper({
    headerLeft: `
  <h1 class="text-xl font-bold text-gray-900">
    <a href="/" data-link>쇼핑몰</a>
  </h1>
`.trim(),
    children: `
  <!-- 검색 및 필터 -->
  ${SearchBar({ searchQuery, limit, sort, category, categories })}
  
  <!-- 상품 목록 -->
  <div class="mb-6">
    ${ProductList({
      products,
      loading,
      error,
      totalCount,
      hasMore,
    })}
  </div>
`.trim(),
  });
};

export const HomePage = import.meta.env.SSR
  ? withSSR({
      renderHead: () => "<title>쇼핑몰 - 홈</title>",
      render: renderPage,
      getSSRData: async (router) => {
        const response = await Promise.all([getProducts(router.query), getCategories()]);
        console.log("🚀 ~ response:", response);
        const [
          {
            products,
            pagination: { total },
          },
          categories,
        ] = response;

        return {
          products,
          categories,
          totalCount: total,
        };
      },
      onMount: ({ products, categories, totalCount }) => {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            products,
            categories,
            totalCount: totalCount,
            loading: false,
            status: "done",
          },
        });
      },
    })
  : withLifecycle(
      {
        onMount: () => {
          loadProductsAndCategories();
        },
        watches: [
          () => {
            const { search, limit, sort, category1, category2 } = GlobalRouter.query;
            return [search, limit, sort, category1, category2];
          },
          () => loadProducts(true),
        ],
      },
      renderPage,
    );
