import { supabase, FUNCTIONS_BASE_URL } from './supabase';
import { usersAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Register a new user with Supabase Auth and add to users table
 */
export async function registerUser(data: {
  phoneNumber: string;
  email?: string;
  name: string;
  surname: string;
  dateOfBirth: string;
  password?: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Step 1: Add user to users table via cloud function first
    // This creates the user record in our database
    let userId: string | undefined;
    
    try {
      const userResponse = await usersAPI.create({
        phone_number: data.phoneNumber,
        email: data.email,
        name: data.name,
        surname: data.surname,
        date_of_birth: data.dateOfBirth,
        status: 'pending',
      });
      
      userId = userResponse.user_id;
    } catch (err: any) {
      // Check if user already exists
      if (err.message && err.message.includes('duplicate') || err.message.includes('unique')) {
        // User already exists, try to get their ID
        const existingUser = await usersAPI.getByPhoneOrEmail(data.phoneNumber);
        if (existingUser) {
          userId = existingUser.user_id;
        } else {
          return { success: false, error: 'User already exists but could not retrieve user ID' };
        }
      } else {
        return { success: false, error: err.message || 'Failed to create user record' };
      }
    }

    // Step 2: Create user in Supabase Auth for authentication
    // Password is now required (user sets it during registration)
    if (!data.password) {
      return { success: false, error: 'Password is required' };
    }
    
    // Use email if available, otherwise create a placeholder email for phone-based auth
    const authEmail = data.email || `${data.phoneNumber.replace(/[^0-9]/g, '')}@sovs.local`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password: data.password,
      options: {
        data: {
          name: `${data.name} ${data.surname}`,
          phone_number: data.phoneNumber,
          user_id: userId, // Link to our users table
        },
      },
    });

    if (authError) {
      // If auth user already exists, try to sign in instead
      if (authError.message.includes('already registered')) {
        // User exists, try to update password or just continue
        console.log('Auth user already exists, but user record created successfully');
        return { success: true, userId };
      }
      
      // For other errors, return error
      return { success: false, error: authError.message };
    }

    return { success: true, userId };
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' };
  }
}

// Development mode: Set to true to use mock OTP (bypasses Supabase Auth)
const USE_MOCK_OTP = true; // Change to false when SMS/Email providers are configured

// In-memory storage for mock OTPs (for development/testing)
const mockOTPStore: Record<string, { code: string; expiresAt: number }> = {};

/**
 * Send OTP for phone/email login
 */
export async function sendOTP(phoneOrEmail: string): Promise<{ success: boolean; error?: string; otpCode?: string }> {
  try {
    // Development mode: Use mock OTP
    if (USE_MOCK_OTP) {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      
      mockOTPStore[phoneOrEmail] = { code: otpCode, expiresAt };
      
      // Log OTP to console for development
      console.log('🔐 [DEV MODE] OTP Code for', phoneOrEmail, ':', otpCode);
      console.log('📝 This OTP expires in 5 minutes');
      
      return { 
        success: true, 
        otpCode: otpCode // Return OTP for testing (you can show it in an alert)
      };
    }

    // Production mode: Use Supabase Auth
    const isEmail = phoneOrEmail.includes('@');
    
    if (isEmail) {
      // Send magic link for email
      const { error } = await supabase.auth.signInWithOtp({
        email: phoneOrEmail,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } else {
      // Send OTP for phone
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneOrEmail,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

/**
 * Verify OTP and sign in
 */
export async function verifyOTP(
  phoneOrEmail: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Development mode: Use mock OTP verification
    if (USE_MOCK_OTP) {
      const stored = mockOTPStore[phoneOrEmail];
      
      if (!stored) {
        return { success: false, error: 'No OTP found. Please request a new one.' };
      }
      
      if (Date.now() > stored.expiresAt) {
        delete mockOTPStore[phoneOrEmail];
        return { success: false, error: 'OTP expired. Please request a new one.' };
      }
      
      if (stored.code !== token) {
        return { success: false, error: 'Invalid OTP code. Please try again.' };
      }
      
      // OTP is valid - create a session
      delete mockOTPStore[phoneOrEmail];
      
      console.log('✅ [DEV MODE] OTP verified successfully for', phoneOrEmail);
      
      // Get user from users table
      const user = await usersAPI.getByPhoneOrEmail(phoneOrEmail);
      
      if (!user) {
        return { success: false, error: 'User not found in database' };
      }

      // In dev mode, store user info in AsyncStorage instead of using Supabase Auth
      // This bypasses all the Auth configuration issues
      try {
        await AsyncStorage.setItem('dev_user_session', JSON.stringify({
          user_id: user.user_id,
          phone_number: user.phone_number,
          email: user.email,
          name: user.name,
          surname: user.surname,
          date_of_birth: user.date_of_birth,
          status: user.status,
          logged_in_at: new Date().toISOString(),
        }));
        console.log('✅ [DEV MODE] User session stored locally');
      } catch (storageError) {
        console.error('Error storing dev session:', storageError);
        // Continue anyway - the OTP was valid
      }
      
      return { success: true };
    }

    // Production mode: Use Supabase Auth
    const isEmail = phoneOrEmail.includes('@');
    
    if (isEmail) {
      // For email, token is the OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email: phoneOrEmail,
        token: token,
        type: 'email',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } else {
      // For phone, token is the OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneOrEmail,
        token: token,
        type: 'sms',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'OTP verification failed' };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    // In dev mode, clear AsyncStorage
    if (USE_MOCK_OTP) {
      await AsyncStorage.removeItem('dev_user_session');
      console.log('✅ [DEV MODE] User session cleared');
      return { success: true };
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sign out failed' };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  // In dev mode, check AsyncStorage first
  if (USE_MOCK_OTP) {
    try {
      const devSession = await AsyncStorage.getItem('dev_user_session');
      if (devSession) {
        const userData = JSON.parse(devSession);
        // Return a mock user object that matches Supabase user structure
        return {
          id: userData.user_id,
          email: userData.email || `${userData.phone_number.replace(/[^0-9]/g, '')}@sovs.local`,
          phone: userData.phone_number,
          user_metadata: {
            user_id: userData.user_id,
            name: `${userData.name} ${userData.surname}`,
            phone_number: userData.phone_number,
          },
        };
      }
    } catch (error) {
      console.error('Error reading dev session:', error);
    }
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  // In dev mode, check AsyncStorage first
  if (USE_MOCK_OTP) {
    try {
      const devSession = await AsyncStorage.getItem('dev_user_session');
      if (devSession) {
        const userData = JSON.parse(devSession);
        // Return a mock session object
        return {
          user: {
            id: userData.user_id,
            email: userData.email || `${userData.phone_number.replace(/[^0-9]/g, '')}@sovs.local`,
            phone: userData.phone_number,
            user_metadata: {
              user_id: userData.user_id,
              name: `${userData.name} ${userData.surname}`,
              phone_number: userData.phone_number,
            },
          },
          access_token: 'dev_token',
          refresh_token: 'dev_refresh_token',
        };
      }
    } catch (error) {
      console.error('Error reading dev session:', error);
    }
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

