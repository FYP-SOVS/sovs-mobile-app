/**
 * Mock Government Database Service
 * Simulates querying official government database
 */

export interface GovernmentData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  phoneNumber: string;
  email?: string;
}

/**
 * Mock government database
 * Uses actual data from the government_db table
 */
const mockDatabase: Record<string, GovernmentData> = {
  'NID0227634830': {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-05-15',
    phoneNumber: '+1234567890',
    email: undefined,
  },
  'NID0816932085': {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-05-15',
    phoneNumber: '+1234567890',
    email: undefined,
  },
};

/**
 * Query government database by National ID Number
 */
export async function fetchGovernmentData(
  nationalIdNumber: string
): Promise<GovernmentData | null> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Check if record exists in predefined mock database
  if (mockDatabase[nationalIdNumber]) {
    return { ...mockDatabase[nationalIdNumber] };
  }

  // If not found in mock database, return null
  // In production, this would query the actual government API
  return null;
}

