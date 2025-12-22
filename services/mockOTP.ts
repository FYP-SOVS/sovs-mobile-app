/**
 * Mock OTP Service
 * Simulates SMS/Email OTP delivery
 */

interface OTPRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lockedUntil?: number;
}

// In-memory storage for OTPs (in production, this would be in a secure database)
const otpStore: Record<string, OTPRecord> = {};

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

/**
 * Generate and send OTP
 */
export async function sendOTP(phoneOrEmail: string): Promise<{ success: boolean; error?: string }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

  // Store OTP
  otpStore[phoneOrEmail] = {
    code,
    expiresAt,
    attempts: 0,
  };

  // In production, send via SMS or Email
  console.log(`[MOCK] OTP for ${phoneOrEmail}: ${code} (expires in ${OTP_EXPIRY_MINUTES} minutes)`);

  return { success: true };
}

/**
 * Verify OTP
 */
export async function verifyOTP(
  phoneOrEmail: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const record = otpStore[phoneOrEmail];

  if (!record) {
    return { success: false, error: 'No OTP found. Please request a new one.' };
  }

  // Check if account is locked
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return {
      success: false,
      error: `Account locked. Please try again in ${minutesLeft} minute(s).`,
    };
  }

  // Check if OTP expired
  if (Date.now() > record.expiresAt) {
    delete otpStore[phoneOrEmail];
    return { success: false, error: 'OTP expired. Please request a new one.' };
  }

  // Check attempts
  record.attempts += 1;

  if (code === record.code) {
    // Success - clear OTP
    delete otpStore[phoneOrEmail];
    return { success: true };
  } else {
    // Failed attempt
    if (record.attempts >= MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCK_DURATION_MINUTES * 60 * 1000;
      return {
        success: false,
        error: `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`,
      };
    }

    const remainingAttempts = MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      error: `Incorrect OTP. ${remainingAttempts} attempt(s) remaining.`,
    };
  }
}

/**
 * Get stored OTP (for testing purposes only)
 */
export function getStoredOTP(phoneOrEmail: string): string | null {
  const record = otpStore[phoneOrEmail];
  if (record && Date.now() < record.expiresAt) {
    return record.code;
  }
  return null;
}



