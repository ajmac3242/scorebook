import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID || 'us-east-1_dummy',
  ClientId: import.meta.env.VITE_CLIENT_ID || 'dummy_client_id',
};

export const UserPool = new CognitoUserPool(poolData);
