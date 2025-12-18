/**
 * Mock Identity Verification Service
 * Simulates third-party identity verification SDK
 */

export interface IdentityVerificationRequest {
  selfieImage: string; // base64 or URI
  idImage: string; // base64 or URI
}

export interface IdentityVerificationResponse {
  success: boolean;
  nationalIdNumber?: string;
  error?: string;
}

/**
 * Mock identity verification
 * In production, this would call a third-party SDK
 */
export async function verifyIdentity(
  request: IdentityVerificationRequest
): Promise<IdentityVerificationResponse> {
  // Validate request
  if (!request || !request.selfieImage || !request.idImage) {
    console.error('Invalid verification request:', request);
    return {
      success: false,
      error: 'Missing required images for verification.',
    };
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock: Always succeed for better UX (since this is mock data)
  const isSuccess = true;

  if (isSuccess) {
    // Use only the specified national ID numbers from the database
    const validNationalIds = [
      'NID0227634830',
      'NID0816932085',
    ];
    
    // Randomly select one of the valid NIDs
    const randomIndex = Math.floor(Math.random() * validNationalIds.length);
    const nationalIdNumber = validNationalIds[randomIndex];
    
    return {
      success: true,
      nationalIdNumber,
    };
  } else {
    return {
      success: false,
      error: 'Verification failed. Please ensure your ID is valid and your photo is clear.',
    };
  }
}

