import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../../(tabs)/index';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ------------------ MOCKS ------------------ */

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()), // <- important
}));


jest.mock('lucide-react-native', () => ({
  Shield: () => null,
  CheckCircle2: () => null,
  Clock: () => null,
  AlertCircle: () => null,
  LogOut: () => null,
}));

/* ------------------ TESTS ------------------ */

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard screen', () => {
    render(<DashboardScreen /> as React.ReactElement);
  });

it('logout clears storage and navigates home', async () => {
  const { getByTestId } = render(<DashboardScreen /> as React.ReactElement);

  const logoutButton = getByTestId('logout-button');

  // fireEvent.press returns void, but handleLogout is async, so we wait
  await fireEvent.press(logoutButton);

  // Wait for AsyncStorage.removeItem to be called
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith('hasSeenOnboarding');
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

});
