import { diditSessionAPI } from './api';

export interface DiditSessionStartRequest {
  email: string;
  phoneNumber: string;
  vendorData?: string;
  metadata?: any;
  language?: string;
  returnTo?: string;
}

/**
 * Create or resume a Didit verification session
 */
export async function createDiditSession(params: DiditSessionStartRequest) {
  try {
    return await diditSessionAPI.create(params);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create Didit session');
  }
}

/**
 * Get session results from Didit
 */
export async function getDiditSessionResults(sessionId: string) {
  try {
    return await diditSessionAPI.getResults(sessionId);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to retrieve session results');
  }
}
