import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Pressable } from 'react-native';
import IdentityVerificationScreen from '@/app/register/identity';

/* -------------------- ROUTER -------------------- */
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({}),
}));

/* -------------------- WEB BROWSER -------------------- */
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'success' }),
  maybeCompleteAuthSession: jest.fn(),
}));

/* -------------------- LINKING (✅ FIX HERE) -------------------- */
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'test://callback'),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

/* -------------------- ASYNC STORAGE -------------------- */
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

/* -------------------- LANGUAGE CONTEXT -------------------- */
const mockSetLanguage = jest.fn();

jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: mockSetLanguage,
  }),
}));

/* -------------------- DIDIT API -------------------- */
jest.mock('@/services/diditSession', () => ({
  createDiditSession: jest.fn(),
  getDiditSessionResults: jest.fn(),
}));

import { createDiditSession } from '@/services/diditSession';

/* -------------------- TESTS -------------------- */
describe('IdentityVerificationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders identity verification screen', () => {
    const { getByText } = render(<IdentityVerificationScreen />);

    expect(getByText('registration.identityVerification')).toBeTruthy();
    expect(getByText('Start Verification')).toBeTruthy();
  });

it('toggles language when language button is pressed', () => {
  const { getByTestId } = render(<IdentityVerificationScreen />);

  fireEvent.press(getByTestId('language-toggle'));

  expect(mockSetLanguage).toHaveBeenCalledTimes(1);
});


  it('starts verification when Start Verification button is pressed', async () => {
    (createDiditSession as jest.Mock).mockResolvedValueOnce({
      success: true,
      url: 'https://didit.test',
      session_id: 'session123',
    });

    const { getByText } = render(<IdentityVerificationScreen />);

    fireEvent.press(getByText('Start Verification'));

    await waitFor(() => {
      expect(createDiditSession).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error alert if session creation fails', async () => {
    jest.spyOn(Alert, 'alert');

    (createDiditSession as jest.Mock).mockRejectedValueOnce(
      new Error('Failed'),
    );

    const { getByText } = render(<IdentityVerificationScreen />);

    fireEvent.press(getByText('Start Verification'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
