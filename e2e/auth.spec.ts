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
        on: (event: string, cb: (payload?: any) => void) => {
          // Immediately trigger auth set for the listener
          if (event === 'accessToken.set') {
            setTimeout(() => cb({ sub: 'test-user-123', email: 'downscale@icloud.com' }), 100);
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
    // Wait for auth to process
    await page.waitForTimeout(2000);
    
    // Should NOT show "Sign In to Continue" 
    await expect(page.getByText('Sign In to Continue')).not.toBeVisible();
    
    // Should show authenticated view - either "My Cabinet" (auth) or empty state
    // "My Cabinet" is shown when authenticated
    await expect(page.getByText('My Cabinet')).toBeVisible();
  });

  test('should show authenticated content on Swaps page', async ({ page }) => {
    await page.goto('/swaps');
    // Wait for auth to process
    await page.waitForTimeout(2000);
    
    await expect(page.getByText('Sign In to Continue')).not.toBeVisible();
    // When authenticated, the title is "Swaps" not "Your Swaps"
    await expect(page.getByText('Swaps').first()).toBeVisible();
  });

  test('should show authenticated content on Profile page', async ({ page }) => {
    await page.goto('/profile');
    // Wait for auth to process  
    await page.waitForTimeout(2000);
    
    await expect(page.getByText('Sign In', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Test User')).toBeVisible(); // From mocked user
    await expect(page.getByText('downscale@icloud.com')).toBeVisible();
  });

  test('should allow navigation between tabs without losing auth', async ({ page }) => {
    await page.goto('/cabinet');
    await page.waitForTimeout(2000);
    await expect(page.getByText('Sign In to Continue')).not.toBeVisible();
    
    await page.goto('/swaps');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Sign In to Continue')).not.toBeVisible();
    
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Test User')).toBeVisible();
  });
});

test.describe('Public Page Hydration', () => {
  test('should render public pages without error', async ({ page }) => {
    await page.goto('/');
    // Use .first() since there are multiple "ScentSwap" text elements on the page
    await expect(page.getByText('ScentSwap').first()).toBeVisible();
    
    await page.goto('/faq');
    await expect(page.getByText('Common Questions')).toBeVisible();
    
    await page.goto('/(auth)/register');
    // Check for plan text - use exact: true to match only "Premium" plan name
    await expect(page.getByText('Premium', { exact: true })).toBeVisible();
  });
});
