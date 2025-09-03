const createServerData = () => {
  const serverData = {};
  console.log("🚀 ~ createServerData ~ serverData:", serverData);

  const setServerData = (value) => {
    const { pathname } = new URL(window.location.href);
    console.log("🚀 ~ setServerData ~ pathname:", pathname);

    serverData[pathname] = value;
  };

  const getServerData = () => {
    const { pathname } = new URL(window.location.href);
    console.log("🚀 ~ setServerData ~ pathname:", pathname);
    return serverData[pathname];
  };

  return {
    setServerData,
    getServerData,
  };
};

const { setServerData, getServerData } = createServerData();

export { setServerData, getServerData };
