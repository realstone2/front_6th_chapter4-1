// 글로벌 라우터 인스턴스

import { BASE_URL } from "../constants.js";
import { ClientRouter, ServerRouter } from "../lib/index.js";

export const router = import.meta.env.SSR ? new ServerRouter() : new ClientRouter(BASE_URL);
