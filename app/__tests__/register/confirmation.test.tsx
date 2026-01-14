import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ConfirmationScreen from '@/app/register/confirmation';
import { registerUser } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ------------------ Mocks ------------------ */

jest.mock('expo-router', () => {
  const mockReplace = jest.fn();

  return {
    useRouter: () => ({
      replace: mockReplace,
    }),
    useLocalSearchParams: () => ({
      sessionId: 'session-123',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '2000-01-01',
      documentNumber: 'ABC123',
    }),
    __mockReplace: mockReplace, // expose for tests
  };
});

jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

jest.mock('@/services/auth', () => ({
  registerUser: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

/* ------------------ Helpers ------------------ */

const getRouterMock = () =>
  jest.requireMock('expo-router').__mockReplace;

/* ------------------ Tests ------------------ */

describe('ConfirmationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders confirmation screen', () => {
    const { getByText } = render(<ConfirmationScreen />);

    expect(getByText('Confirm Your Information')).toBeTruthy();
  });

  it('toggles language when language button is pressed', () => {
    const { getAllByRole } = render(<ConfirmationScreen />);

    fireEvent.press(getAllByRole('button')[0]);
  });

  it('shows error if phone number is empty', () => {
    const { getByText } = render(<ConfirmationScreen />);

    fireEvent.press(getByText('Complete Registration'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'common.error',
      'Phone number is required'
    );
  });

  it('navigates to success screen on successful registration', async () => {
    (registerUser as jest.Mock).mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getByText } = render(
      <ConfirmationScreen />
    );

    fireEvent.changeText(
      getByPlaceholderText('+1234567890'),
      '5551234567'
    );

    fireEvent.press(getByText('Complete Registration'));

    await waitFor(() => {
      expect(getRouterMock()).toHaveBeenCalledWith('/register/success');
    });
  });

  it('clears persisted form data on success', async () => {
    (registerUser as jest.Mock).mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getByText } = render(
      <ConfirmationScreen />
    );

    fireEvent.changeText(
      getByPlaceholderText('+1234567890'),
      '5551234567'
    );

    fireEvent.press(getByText('Complete Registration'));

    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@confirmation_form_data'
      );
    });
  });
});
