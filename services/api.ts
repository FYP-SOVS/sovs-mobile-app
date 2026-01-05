import { FUNCTIONS_BASE_URL } from './supabase';

const API_BASE_URL = FUNCTIONS_BASE_URL;

/**
 * Call a cloud function endpoint
 */
async function callFunction<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${API_BASE_URL}/${endpoint}`;
  
  // Add query parameters
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors specifically
    if (error.message === 'Network request failed' || error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
      console.error('Network request failed:', { url, method, error: error.message });
      throw new Error(`Network request failed. Please check your internet connection and ensure the server is accessible. URL: ${url}`);
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Users API
 */
export const usersAPI = {
  /**
   * Create a new user in the users table
   */
  create: async (userData: {
    user_id?: string; // Optional: if provided, use this UUID (from Supabase Auth)
    phone_number: string;
    email?: string;
    name: string;
    surname: string;
    date_of_birth: string;
    password_hash?: string;
    two_factor_secret?: string;
    sessionid?: string;
    status?: 'pending' | 'verified' | 'suspended';
  }) => {
    return callFunction('users', {
      method: 'POST',
      body: userData,
    });
  },

  /**
   * Get user by ID
   */
  getById: async (userId: string) => {
    return callFunction(`users/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Get user by phone or email
   */
  getByPhoneOrEmail: async (phoneOrEmail: string) => {
    try {
      const response = await callFunction<{ user: any }>('find-user', {
        method: 'GET',
        params: { phone_or_email: phoneOrEmail },
      });
      return response.user;
    } catch (error) {
      return null;
    }
  },

  /**
   * Update user
   */
  update: async (userId: string, updates: Partial<{
    phone_number: string;
    email: string;
    name: string;
    surname: string;
    date_of_birth: string;
    status: 'pending' | 'verified' | 'suspended';
  }>) => {
    return callFunction(`users/${userId}`, {
      method: 'PUT',
      body: updates,
    });
  },
};

/**
 * Government DB API
 */
export const governmentDBAPI = {
  /**
   * Get government record by national ID
   */
  getByNationalId: async (nationalId: string) => {
    return callFunction(`government-db/${nationalId}`, {
      method: 'GET',
    });
  },
};

/**
 * Didit Session API
 */
export const diditSessionAPI = {
  /**
   * Create or resume a Didit verification session
   */
  create: async (params: {
    email: string;
    phoneNumber: string;
    vendorData?: string;
    metadata?: any;
    language?: string;
    returnTo?: string;
  }) => {
    return callFunction('didit-session', {
      method: 'POST',
      body: {
        email: params.email,
        phone_number: params.phoneNumber,
        vendor_data: params.vendorData,
        metadata: params.metadata,
        language: params.language,
        return_to: params.returnTo,
      },
    });
  },

  /**
   * Get session results
   */
  getResults: async (sessionId: string) => {
    return callFunction(`didit-get-session/${sessionId}`, {
      method: 'GET',
    });
  },
};
