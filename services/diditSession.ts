import { diditSessionAPI } from './api';

/**
 * Create a Didit verification session
 */
export async function createDiditSession(vendorData?: string, metadata?: any, language?: string) {
  try {
    return await diditSessionAPI.create(vendorData, metadata, language);
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

