import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Setup MSW Server for Node/Vitest environment.
 */
export const server = setupServer(...handlers);
