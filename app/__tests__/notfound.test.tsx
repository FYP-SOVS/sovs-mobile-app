import React from 'react';
import { render } from '@testing-library/react-native';
import NotFoundScreen from '@/app/+not-found';

// -------------------- MOCK expo-router --------------------
jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('NotFoundScreen', () => {
  it("renders the not found message", () => {
    const { getByText } = render(<NotFoundScreen />);

    expect(getByText('notFound.message')).toBeTruthy();
  });

  it('renders link to home screen', () => {
    const { getByText } = render(<NotFoundScreen />);

    expect(getByText('notFound.goHome')).toBeTruthy();
  });
});
