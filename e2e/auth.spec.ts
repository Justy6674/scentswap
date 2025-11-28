import { test, expect } from '@playwright/test';

test.describe('Authenticated User Flow', () => {
  // Mock the Outseta object to simulate a logged-in user
  // This bypasses the need for a real token/network call which fails on localhost
  // and proves that the APP LOGIC correctly handles the authenticated state.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.Outseta = {
        getUser: async () => ({
          Uid: 'test-user-123',
          Email: 'downscale@icloud.com',
          FirstName: 'Test',
          LastName: 'User',
        }),
        getJwtPayload: async () => ({
          sub: 'test-user-123',
          email: 'downscale@icloud.com',
          'outseta:planUid': 'vW5RoJm4', // Premium
        }),
        getAccessToken: () => 'mock-jwt-token',
        setAccessToken: () => {},
        on: (event, cb) => {
          // Immediately trigger auth set for the listener
          if (event === 'accessToken.set') {
            cb({ sub: 'test-user-123', email: 'downscale@icloud.com' });
          }
        },
        off: () => {},
        auth: { open: () => {} },
        profile: { open: () => {} },
      };
    });
  });

  test('should show authenticated content on Cabinet page', async ({ page }) => {
    await page.goto('/cabinet');
    
    // Should NOT show "Sign In to Continue"
    await expect(page.getByText('Sign In to Continue')).not.toBeVisible();
    
    // Should show empty state or listing content
    // "Your cabinet is empty" or "Add listing" button
    await expect(page.getByText('Your Swap Cabinet')).toBeVisible();
    // Cabinet page has specific text for empty state:
    // "Sign in to add fragrances" is the auth wall (should NOT be visible)
    // "Your cabinet is empty" is the authenticated empty state
    await expect(page.getByText('Sign in to add fragrances')).not.toBeVisible();
  });

  test('should show authenticated content on Swaps page', async ({ page }) => {
    await page.goto('/swaps');
    await expect(page.getByText('Sign In to Continue')).not.toBeVisible();
    await expect(page.getByText('Your Swaps')).toBeVisible();
    // Auth wall text:
    await expect(page.getByText('Sign in to view and manage')).not.toBeVisible();
  });

  test('should show authenticated content on Profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('Sign In', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Test User')).toBeVisible(); // From mocked user
    await expect(page.getByText('downscale@icloud.com')).toBeVisible();
  });

  test('should allow navigation between tabs without losing auth', async ({ page }) => {
    await page.goto('/cabinet');
    await expect(page.getByText('Sign In to Continue')).not.toBeVisible();
    
    await page.goto('/swaps');
    await expect(page.getByText('Sign In to Continue')).not.toBeVisible();
    
    await page.goto('/profile');
    await expect(page.getByText('Test User')).toBeVisible();
  });
});

test.describe('Public Page Hydration', () => {
  test('should render public pages without error', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ScentSwap')).toBeVisible();
    
    await page.goto('/faq');
    await expect(page.getByText('Common Questions')).toBeVisible();
    
    await page.goto('/(auth)/register');
    // Check for plan text
    await expect(page.getByText('Premium')).toBeVisible();
  });
});
