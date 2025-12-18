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
 * In production, this would query actual government API
 */
const mockDatabase: Record<string, GovernmentData> = {
  // Pre-populated mock records for testing
  'NID1234567890': {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-05-15',
    phoneNumber: '+1234567890',
    email: 'john.doe@example.com',
  },
  'NID0987654321': {
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1985-03-22',
    phoneNumber: '+1987654321',
    email: undefined,
  },
  'NID5555555555': {
    firstName: 'Alice',
    lastName: 'Johnson',
    dateOfBirth: '1992-11-08',
    phoneNumber: '+1555555555',
    email: 'alice.j@example.com',
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

  // For any other ID, always generate mock data (since this is mock data)
  // In production, this would return null if user not found
  const firstNames = ['Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria', 'Christopher', 'Jennifer'];
  const lastNames = ['Brown', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Martinez', 'Jackson', 'White', 'Harris'];
  
  // Use National ID as seed for consistent data generation
  const idSeed = parseInt(nationalIdNumber.replace(/\D/g, '').slice(-6)) || 123456;
  const firstNameIndex = idSeed % firstNames.length;
  const lastNameIndex = (idSeed * 7) % lastNames.length;
  
  const firstName = firstNames[firstNameIndex];
  const lastName = lastNames[lastNameIndex];
  
  // Generate consistent date of birth based on ID
  const birthYear = 1980 + (idSeed % 30);
  const birthMonth = (idSeed % 12) + 1;
  const birthDay = (idSeed % 28) + 1;
  
  // Generate consistent phone number
  const phoneNumber = `+1${String(1000000000 + (idSeed % 9000000000)).padStart(10, '0')}`;
  
  // 50% chance of having email
  const hasEmail = (idSeed % 2) === 0;
  
  return {
    firstName,
    lastName,
    dateOfBirth: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
    phoneNumber,
    email: hasEmail ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com` : undefined,
  };
}

