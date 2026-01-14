import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegistrationSuccessScreen from '@/app/register/success';

// -------------------- MOCK expo-router --------------------
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// -------------------- MOCK LanguageContext --------------------
jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

// -------------------- TESTS --------------------
describe('RegistrationSuccessScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders success messages', () => {
    const { getByText } = render(<RegistrationSuccessScreen />);

    expect(getByText('registration.successTitle')).toBeTruthy();
    expect(getByText('registration.successDescription')).toBeTruthy();
    expect(getByText('registration.identityVerified')).toBeTruthy();
    expect(getByText('registration.accountCreated')).toBeTruthy();
    expect(getByText('registration.readyToVote')).toBeTruthy();
  });

  it('navigates to tabs when continue button is pressed', () => {
    const { getByText } = render(<RegistrationSuccessScreen />);

    fireEvent.press(
      getByText('registration.continueToDashboard')
    );

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
