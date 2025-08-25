import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Get the current authenticated user from Clerk
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    // In a real implementation, you might want to fetch additional user data
    // from your database using the Clerk user ID
    return {
      id: userId,
      email: 'user@example.com', // This would come from Clerk or your database
      firstName: 'Test',
      lastName: 'User',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication - redirects to sign-in if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return user;
}

/**
 * Get the current user ID from Clerk
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}
