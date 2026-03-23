/**
 * @file UserPool.ts
 * @description Configures the Amazon Cognito User Pool for authentication.
 * Relies on environment variables populated during the build process.
 */

import { CognitoUserPool } from "amazon-cognito-identity-js";

/**
 * Data required to initialize the Cognito User Pool.
 * Values are pulled from environment variables.
 */
const poolData = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID || "us-east-1_mockpool",
  ClientId: import.meta.env.VITE_CLIENT_ID || "mock-client-id",
};

/**
 * Exported instance of the Cognito User Pool for managing user authentication.
 */
export const UserPool = new CognitoUserPool(poolData);
