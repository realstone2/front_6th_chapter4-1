import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// Node.js 서버용 MSW 설정
export const mswServer = setupServer(...handlers);
