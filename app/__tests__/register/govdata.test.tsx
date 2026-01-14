import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GovernmentDataScreen from '@/app/register/government-data';
import { governmentDBAPI } from '@/services/api';

/* -------------------- MOCKS -------------------- */

const mockPush = jest.fn();
const mockSetLanguage = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocalSearchParams: () => ({
    nationalIdNumber: '12345678901',
  }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: mockSetLanguage,
  }),
}));

jest.mock('@/services/api', () => ({
  governmentDBAPI: {
    getByNationalId: jest.fn(),
  },
}));

jest.spyOn(Alert, 'alert');

/* -------------------- TEST DATA -------------------- */

const mockGovernmentData = {
  name: 'John',
  surname: 'Doe',
  dob: '2000-01-01',
  phone_number: '5551234567',
};

/* -------------------- TESTS -------------------- */

describe('GovernmentDataScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    (governmentDBAPI.getByNationalId as jest.Mock).mockResolvedValueOnce(
      mockGovernmentData
    );

    const { getByText } = render(<GovernmentDataScreen />);

    expect(getByText('registration.fetchingInfo')).toBeTruthy();
  });

  it('renders government data when fetched', async () => {
    (governmentDBAPI.getByNationalId as jest.Mock).mockResolvedValueOnce(
      mockGovernmentData
    );

    const { getByText } = render(<GovernmentDataScreen />);

    await waitFor(() => {
      expect(getByText('John')).toBeTruthy();
      expect(getByText('Doe')).toBeTruthy();
      expect(getByText('5551234567')).toBeTruthy();
    });
  });

  it('shows error screen when no record is found', async () => {
    (governmentDBAPI.getByNationalId as jest.Mock).mockResolvedValueOnce(null);

    const { getByText } = render(<GovernmentDataScreen />);

    await waitFor(() => {
      expect(
        getByText('registration.registrationCannotContinue')
      ).toBeTruthy();
    });
  });

  it('retry button navigates back to identity screen', async () => {
    (governmentDBAPI.getByNationalId as jest.Mock).mockResolvedValueOnce(null);

    const { getByText } = render(<GovernmentDataScreen />);

    await waitFor(() => {
      fireEvent.press(getByText('registration.tryAgain'));
    });

    expect(mockPush).toHaveBeenCalledWith('/register/identity');
  });

  it('toggles language when language button is pressed', async () => {
    (governmentDBAPI.getByNationalId as jest.Mock).mockResolvedValueOnce(
      mockGovernmentData
    );

    const { getByTestId } = render(<GovernmentDataScreen />);

    await waitFor(() => {
      fireEvent.press(getByTestId('language-toggle'));
    });

    expect(mockSetLanguage).toHaveBeenCalledWith('tr');
  });

  it('shows alert for invalid email', async () => {
    (governmentDBAPI.getByNationalId as jest.Mock).mockResolvedValueOnce(
      mockGovernmentData
    );

    const { getByPlaceholderText, getByText } = render(
      <GovernmentDataScreen />
    );

    await waitFor(() => {
      fireEvent.changeText(
        getByPlaceholderText('registration.emailPlaceholder'),
        'invalid-email'
      );
    });

    fireEvent.press(getByText('registration.confirmContinue'));

    expect(Alert.alert).toHaveBeenCalled();
  });

  it('navigates to confirm screen with correct params', async () => {
    (governmentDBAPI.getByNationalId as jest.Mock).mockResolvedValueOnce(
      mockGovernmentData
    );

    const { getByText } = render(<GovernmentDataScreen />);

    await waitFor(() => {
      fireEvent.press(getByText('registration.confirmContinue'));
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/register/confirm',
      params: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2000-01-01',
        phoneNumber: '5551234567',
        email: '',
      },
    });
  });
});
