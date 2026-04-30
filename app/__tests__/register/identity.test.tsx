import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
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

/* -------------------- LINKING -------------------- */
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
    expect(getByText('registration.startVerification')).toBeTruthy();
  });

  it('toggles language when language button is pressed', () => {
    const { getByTestId } = render(<IdentityVerificationScreen />);

    fireEvent.press(getByTestId('language-toggle'));

    expect(mockSetLanguage).toHaveBeenCalledTimes(1);
  });

  it('starts verification when Start Verification button is pressed', async () => {
    (createDiditSession as jest.Mock).mockResolvedValueOnce({
      session_id: 'session123',
      status: 'Pending',
      url: 'https://didit.test',
    });

    const { getByPlaceholderText, getByText } = render(
      <IdentityVerificationScreen />
    );

    fireEvent.changeText(
      getByPlaceholderText('registration.phonePlaceholder'),
      '1234567890'
    );

    fireEvent.changeText(
      getByPlaceholderText('registration.emailPlaceholder'),
      'test@example.com'
    );

    fireEvent.press(getByText('registration.startVerification'));

    await waitFor(() => {
      expect(createDiditSession).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error alert if session creation fails', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    (createDiditSession as jest.Mock).mockRejectedValueOnce(
      new Error('Failed')
    );

    const { getByPlaceholderText, getByText } = render(
      <IdentityVerificationScreen />
    );

    fireEvent.changeText(
      getByPlaceholderText('registration.phonePlaceholder'),
      '1234567890'
    );

    fireEvent.changeText(
      getByPlaceholderText('registration.emailPlaceholder'),
      'test@example.com'
    );

    fireEvent.press(getByText('registration.startVerification'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
