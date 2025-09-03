const createServerData = () => {
  const serverData = {};

  const setServerData = (value) => {
    const { pathname } = new URL(window.location.href);

    serverData[pathname] = value;
  };

  const getServerData = () => {
    const { pathname } = new URL(window.location.href);
    return serverData[pathname];
  };

  return {
    setServerData,
    getServerData,
  };
};

const { setServerData, getServerData } = createServerData();

export { setServerData, getServerData };
