import { UserPool } from "../UserPool";
import { CognitoUserSession } from "amazon-cognito-identity-js";

/**
 * Interface representing a user profile from the backend.
 */
export interface UserProfile {
  userId: string;
  email: string;
  username: string;
}

/**
 * Helper to retrieve an access token for the current session.
 * @returns {Promise<string | null>} The JWT token or null if no session.
 */
export async function getAccessToken(): Promise<string | null> {
  const user = UserPool.getCurrentUser();
  if (!user) return null;

  return new Promise((resolve) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
      } else {
        resolve(session.getAccessToken().getJwtToken());
      }
    });
  });
}

/**
 * Fetches the current user profile from the backend API.
 * WHY: Provides a true API-backed user verification beyond Cognito session state.
 *
 * @returns {Promise<UserProfile>} The user profile data.
 * @throws {Error} If the fetch fails or user is unauthorized.
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const token = await getAccessToken();
  const API_BASE = import.meta.env.VITE_API_URL || "";

  const response = await fetch(`${API_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch current user: ${response.statusText}`);
  }

  return response.json();
}
