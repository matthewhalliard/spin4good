'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const next = searchParams.get('next');

      if (token_hash && type === 'email') {
        // Add a small delay to prevent prefetch issues
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error } = await supabase.auth.verifyOtp({
          type: 'email',
          token_hash,
        });

        if (error) {
          router.push('/signup?error=expired');
        } else if (next) {
          router.push(next);
        } else {
          router.push('/signup?verified=true');
        }
      }
    };

    handleEmailConfirmation();
  }, [searchParams, router, supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-6xl mb-4">🎰</div>
        <h1 className="text-2xl font-bold mb-2">Confirming your email...</h1>
        <p className="text-purple-200">Please wait a moment</p>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  );
} 