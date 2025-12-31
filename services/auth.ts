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
    // Step 1: Create user in Supabase Auth FIRST to get the UUID
    // Password is required (user sets it during registration)
    if (!data.password) {
      return { success: false, error: 'Password is required' };
    }
    
    // Use email if available, otherwise create a placeholder email for phone-based auth
    const authEmail = data.email || `${data.phoneNumber.replace(/[^0-9]/g, '')}@sovs.local`;

    // Create user in Supabase Auth with email and password
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password: data.password,
      phone: data.phoneNumber, // Also set phone number for OTP login
      options: {
        data: {
          name: `${data.name} ${data.surname}`,
          phone_number: data.phoneNumber,
        },
      },
    });

    if (authError) {
      // If auth user already exists, try to get the existing user
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        console.log('Auth user already exists, attempting to sign in to get user ID');
        
        // Try to sign in to get the user ID
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: data.password,
          });
          
          if (!signInError && signInData?.user) {
            const authUserId = signInData.user.id;
            
            // Check if user already exists in users table
            const existingUser = await usersAPI.getByPhoneOrEmail(data.phoneNumber);
            if (existingUser) {
              // User exists, return success
              return { success: true, userId: authUserId };
            }
            
            // User doesn't exist in users table, create it with the auth UUID
            try {
              await usersAPI.create({
                user_id: authUserId, // Use Supabase Auth UUID
                phone_number: data.phoneNumber,
                email: data.email,
                name: data.name,
                surname: data.surname,
                date_of_birth: data.dateOfBirth,
                status: 'pending',
              });
              return { success: true, userId: authUserId };
            } catch (createErr: any) {
              return { success: false, error: createErr.message || 'Failed to create user record' };
            }
          } else {
            return { success: false, error: signInError?.message || 'Failed to sign in existing user' };
          }
        } catch (updateErr) {
          return { success: false, error: 'User already exists but could not retrieve user ID' };
        }
      }
      
      // For other errors, return error
      return { success: false, error: authError.message };
    }

    // Step 2: Use the Supabase Auth UUID to create user in users table
    if (!authData?.user?.id) {
      return { success: false, error: 'Failed to get user ID from Supabase Auth' };
    }

    const authUserId = authData.user.id;

    try {
      // Create user in users table using the Supabase Auth UUID
      await usersAPI.create({
        user_id: authUserId, // Use Supabase Auth UUID as user_id
        phone_number: data.phoneNumber,
        email: data.email,
        name: data.name,
        surname: data.surname,
        date_of_birth: data.dateOfBirth,
        status: 'pending',
      });
    } catch (err: any) {
      // Check if user already exists (might have been created in a previous attempt)
      if (err.message && (err.message.includes('duplicate') || err.message.includes('unique'))) {
        // User already exists in users table, that's okay - return success
        console.log('User already exists in users table, continuing...');
      } else {
        // For other errors, we should clean up the auth user, but for now just return error
        console.error('Failed to create user in users table:', err);
        return { success: false, error: err.message || 'Failed to create user record' };
      }
    }

    // Update auth user metadata with the user_id (for consistency)
    await supabase.auth.updateUser({
      data: {
        user_id: authUserId,
      },
    });

    // Call register-voter cloud function to assign voter role
    try {
      const registerVoterResponse = await fetch(`${FUNCTIONS_BASE_URL}/register-voter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: authUserId,
          email: data.email || authEmail,
          phone_number: data.phoneNumber,
          name: data.name,
          surname: data.surname,
          date_of_birth: data.dateOfBirth,
          role_id: 1, // Assign voter role
        }),
      });

      if (!registerVoterResponse.ok) {
        const errorData = await registerVoterResponse.json();
        console.error('Failed to assign voter role:', errorData);
        // Don't fail the registration if role assignment fails, but log it
      } else {
        const roleData = await registerVoterResponse.json();
        console.log('Voter role assigned successfully:', roleData);
      }
    } catch (roleError: any) {
      console.error('Error calling register-voter function:', roleError.message);
      // Don't fail the registration if the cloud function call fails
    }

    // User created successfully in both Supabase Auth and users table with the same UUID
    console.log('User created successfully in Supabase Auth and users table with UUID:', authUserId);
    return { success: true, userId: authUserId };
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' };
  }
}

// Development mode: Set to true to use mock OTP (bypasses Supabase Auth)
// Set to false to use real Supabase Auth OTP (requires SMS/Email providers configured)
const USE_MOCK_OTP = false; // Using real Supabase Auth OTP

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

    // Production mode: Use Supabase Auth OTP
    const isEmail = phoneOrEmail.includes('@');
    
    if (isEmail) {
      // Send OTP for email
      const { error } = await supabase.auth.signInWithOtp({
        email: phoneOrEmail,
        options: {
          shouldCreateUser: false, // Don't create new users on login
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } else {
      // Send OTP for phone
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneOrEmail,
        options: {
          shouldCreateUser: false, // Don't create new users on login
        },
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

    // Production mode: Use Supabase Auth OTP verification
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

      // OTP verified successfully, user is now signed in
      if (data?.session) {
        console.log('User signed in successfully via email OTP');
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

      // OTP verified successfully, user is now signed in
      if (data?.session) {
        console.log('User signed in successfully via phone OTP');
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
