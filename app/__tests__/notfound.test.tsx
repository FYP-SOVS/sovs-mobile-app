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

describe('NotFoundScreen', () => {
  it("renders the not found message", () => {
    const { getByText } = render(<NotFoundScreen />);

    expect(getByText("This screen doesn't exist.")).toBeTruthy();
  });

  it('renders link to home screen', () => {
    const { getByText } = render(<NotFoundScreen />);

    expect(getByText('Go to home screen!')).toBeTruthy();
  });
});
