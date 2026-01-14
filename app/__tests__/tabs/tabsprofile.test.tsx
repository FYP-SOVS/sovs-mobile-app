import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../../(tabs)/profile';
import { useTranslation } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { signOut } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersAPI } from '@/services/api';

// -------------------- Mocks --------------------

jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: jest.fn(),
}));

const replaceMock = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/services/auth', () => ({
  getCurrentUser: jest.fn(() => ({
    id: 'user-123',
    user_metadata: { user_id: 'user-123' },
    phone: '1234567890',
    email: 'john@example.com',
  })),
  getCurrentSession: jest.fn(() => ({})),
  signOut: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  usersAPI: {
    getById: jest.fn(),
    getByPhoneOrEmail: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn(),
}));

// -------------------- Tests --------------------

describe('ProfileScreen', () => {
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

    (usersAPI.getById as jest.Mock).mockResolvedValue({
      name: 'John',
      surname: 'Doe',
      phone_number: '1234567890',
      email: 'john@example.com',
      date_of_birth: '2000-01-01',
      status: 'verified',
    });
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('common.loading')).toBeTruthy();
  });

  it('displays user data when fetched', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByTestId('profile-full-name')).toHaveTextContent('John Doe');
      expect(getByText('VOTER')).toBeTruthy();
      expect(getByText('1234567890')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
      expect(getByText('profile.verified')).toBeTruthy();
    });
  });

  it('shows error and retry button if no user data', async () => {
    (usersAPI.getById as jest.Mock).mockResolvedValueOnce(null);

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('No user data found')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });
  });

it('toggles language on press', async () => {
  const setLanguageMock = jest.fn();

  (useTranslation as jest.Mock).mockReturnValue({
    t: (key: string) => key,
    language: 'en',
    setLanguage: setLanguageMock,
  });

  const { getAllByTestId } = render(<ProfileScreen />);

  await waitFor(() => {
    const languageButtons = getAllByTestId('language-button');
    fireEvent.press(languageButtons[0]); // press header button
  });

  expect(setLanguageMock).toHaveBeenCalledWith('tr');
});


  it('logout signs out, clears storage, and navigates to login', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        const destructive = buttons?.find(b => b.style === 'destructive');
        destructive?.onPress?.();
      }
    );

    const { getByTestId } = render(<ProfileScreen />);

    await waitFor(() => {
      fireEvent.press(getByTestId('logout-button'));
    });

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('hasSeenOnboarding');
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});
