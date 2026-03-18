import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Cognito
vi.mock('amazon-cognito-identity-js', () => {
  const CognitoUserPool = vi.fn().mockImplementation(function() {
    this.getCurrentUser = vi.fn();
  });
  const CognitoUser = vi.fn().mockImplementation(function() {
    this.authenticateUser = vi.fn();
  });
  const AuthenticationDetails = vi.fn().mockImplementation(function() {});

  return {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
  }
})
