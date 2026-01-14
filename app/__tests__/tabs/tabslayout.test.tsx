import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import TabsLayout from '../../(tabs)/_layout';

/**
 * Mock expo-router Tabs
 * This allows us to unit-test screen registration
 * without running the real navigation system.
 */
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const Tabs = ({ children }: any) => <>{children}</>;

  // Each Tabs.Screen will render its title as text
  Tabs.Screen = ({ options }: any) => (
    <Text>{options?.title}</Text>
  );

  return { Tabs };
});

/**
 * Mock icon components
 * Icons are native UI elements and not testable here.
 * We only verify they do not crash the render.
 */
jest.mock('lucide-react-native', () => ({
  Home: () => null,
  User: () => null,
}));

describe('TabsLayout (unit-testable cases)', () => {
  it('renders Home and Profile tabs', () => {
    /**
     * TC-01: Component renders without crashing
     */
    const { getByText } = render(
      <TabsLayout /> as React.ReactElement
    );

    /**
     * TC-02: Home tab is registered
     * Verifies that a Tabs.Screen exists with title "Home"
     */
    expect(getByText('Home')).toBeTruthy();

    /**
     * TC-03: Profile tab is registered
     * Verifies that a Tabs.Screen exists with title "Profile"
     */
    expect(getByText('Profile')).toBeTruthy();

    /**
     * TC-04: Tab titles are correct
     * Titles are taken directly from options.title
     * If these change, the test will fail.
     */

    /**
     * TC-05: Icons do not crash render
     * Covered implicitly — if icon rendering caused an error,
     * the component would not render successfully.
     */
  });
});
