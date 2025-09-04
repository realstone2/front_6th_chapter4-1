export const withSSR = ({ render, onMount, getSSRData, renderHead }) => {
  return {
    renderPage: async (router) => {
      const serverData = await getSSRData?.(router);
      onMount?.(serverData);
      const html = render(router);
      return {
        html,
        serverData,
        head: renderHead?.(serverData),
      };
    },
  };
};
