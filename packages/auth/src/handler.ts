/**
 * Handlers Next de Better Auth, à réexporter tels quels :
 *
 *   // apps/<app>/src/app/api/auth/[...all]/route.ts
 *   export { GET, POST } from "@repo/auth/handler";
 */

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "./server";

export const { GET, POST } = toNextJsHandler(auth);
