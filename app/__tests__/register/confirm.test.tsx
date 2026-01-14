import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ConfirmRegistrationScreen from '../../register/confirm';
import { useTranslation } from '@/contexts/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { registerUser } from '@/services/auth';

// -------------------- Mocks --------------------

jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: jest.fn(),
}));

const replaceMock = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/services/auth', () => ({
  registerUser: jest.fn(),
}));

// -------------------- Setup --------------------

beforeEach(() => {
  jest.clearAllMocks();

  (useRouter as jest.Mock).mockReturnValue({
    replace: replaceMock,
  });

  (useTranslation as jest.Mock).mockReturnValue({
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
  });

  (useLocalSearchParams as jest.Mock).mockReturnValue({
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '2000-01-01',
    phoneNumber: '1234567890',
    email: 'john@example.com',
  });
});

// -------------------- Tests --------------------

describe('ConfirmRegistrationScreen', () => {
  it('renders confirmation screen correctly', () => {
    const { getByText } = render(<ConfirmRegistrationScreen />);

    expect(getByText('registration.confirmRegistration')).toBeTruthy();
    expect(getByText('registration.step3')).toBeTruthy();
  });

  it('displays user data from route params', () => {
    const { getByText } = render(<ConfirmRegistrationScreen />);

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('1234567890')).toBeTruthy();
    expect(getByText('VOTER')).toBeTruthy();
  });

  it('toggles language on press', () => {
    const setLanguageMock = jest.fn();

    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
      language: 'en',
      setLanguage: setLanguageMock,
    });

    const { getByRole } = render(<ConfirmRegistrationScreen />);

    fireEvent.press(getByRole('button'));

    expect(setLanguageMock).toHaveBeenCalledWith('tr');
  });

  it('shows error if phone number is empty', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '2000-01-01',
      phoneNumber: '',
    });

    const { getByText } = render(<ConfirmRegistrationScreen />);

    fireEvent.press(getByText('registration.createAccount'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it('calls registerUser with correct data', async () => {
    (registerUser as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(<ConfirmRegistrationScreen />);

    fireEvent.press(getByText('registration.createAccount'));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        phoneNumber: '1234567890',
        email: 'john@example.com',
        name: 'John',
        surname: 'Doe',
        dateOfBirth: '2000-01-01',
      });
    });
  });

  it('navigates to success screen on successful registration', async () => {
    (registerUser as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(<ConfirmRegistrationScreen />);

    fireEvent.press(getByText('registration.createAccount'));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/register/success');
    });
  });

  it('shows error alert when registration fails', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    (registerUser as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed',
    });

    const { getByText } = render(<ConfirmRegistrationScreen />);

    fireEvent.press(getByText('registration.createAccount'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
