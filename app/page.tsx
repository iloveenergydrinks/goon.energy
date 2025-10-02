import { redirect } from 'next/navigation';

// Force dynamic rendering - don't try to generate static pages at build time
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Redirect to industrial complex as ship builder is deprecated
  redirect('/industrial');
}