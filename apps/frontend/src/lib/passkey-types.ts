/**
 * Tipos compartidos entre cliente y servidor para flujos WebAuthn / Passkey.
 */

export interface PasskeyLoginResponse {
  verified: boolean;
  access_token?: string;
  refresh_token?: string;
  action_link?: string;
  error?: string;
}

export interface PasskeyStepUpResponse {
  verified: boolean;
  ts?: string;
  error?: string;
}

export interface PasskeyRegisterResponse {
  verified: boolean;
  error?: string;
}
