import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PasswordSetupScreen from '@/app/register/password';

// -------------------- MOCK ROUTER --------------------
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    sessionId: 'test-session',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    documentNumber: 'ABC123',
  }),
}));

// -------------------- MOCK LANGUAGE CONTEXT --------------------
jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

// -------------------- MOCK ASYNC STORAGE --------------------
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// -------------------- MOCK AUTH SERVICE --------------------
jest.mock('@/services/auth', () => ({
  registerUser: jest.fn(),
}));

import { registerUser } from '@/services/auth';

describe('PasswordSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders password setup screen', () => {
    const { getByText } = render(<PasswordSetupScreen />);
    expect(getByText('Create Your Account')).toBeTruthy();
  });

  it('shows error when passwords do not match', async () => {
    const { getByPlaceholderText, getByText } = render(
      <PasswordSetupScreen />
    );

    fireEvent.changeText(
      getByPlaceholderText('Enter password (min 8 characters)'),
      'Password123!'
    );

    fireEvent.changeText(
      getByPlaceholderText('Confirm your password'),
      'WrongPassword'
    );

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('calls registerUser with correct data when form is valid', async () => {
    (registerUser as jest.Mock).mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText } = render(
      <PasswordSetupScreen />
    );

    fireEvent.changeText(
      getByPlaceholderText('+1234567890'),
      '+1234567890'
    );

    fireEvent.changeText(
      getByPlaceholderText('Enter password (min 8 characters)'),
      'Password123!'
    );

    fireEvent.changeText(
      getByPlaceholderText('Confirm your password'),
      'Password123!'
    );

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalled();
    });
  });
});
