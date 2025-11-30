/**
 * Admin Authentication Utility
 * 
 * Hardcoded email whitelist for admin access.
 * This is a simple approach that requires code deployment to add new admins.
 * Email is the common identifier between Outseta and Supabase.
 */

const ADMIN_EMAILS = [
  'downscale@icloud.com',
  'test@scentswap.com.au',  // Temporary for AI testing
  'admin@test.com',  // Development testing access
];

/**
 * Check if a user is an admin based on their email address
 * @param email - User's email address
 * @returns true if the email is in the admin whitelist
 */
export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get the list of admin emails (for debugging/display purposes)
 * @returns Array of admin email addresses
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}

