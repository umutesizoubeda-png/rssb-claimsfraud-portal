import type { Profile } from './types';

export async function fetchProfile(email: string | undefined): Promise<Profile | null> {
  if (!email) return null;
  try {
    const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data) return data as Profile;
  } catch { /* noop */ }
  // Fallback profile for any authenticated user without a seeded row
  return { id: 0, email: email!, full_name: email!.split('@')[0], role: 'analyst', provider_id: null };
}
