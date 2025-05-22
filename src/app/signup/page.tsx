'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Mail, Check, Heart, Gift, ArrowRight, Star, Shield, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

// Force dynamic rendering to avoid build-time issues with useSearchParams
export const dynamic = 'force-dynamic';

function SignupContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [selectedCharity, setSelectedCharity] = useState<any>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [charities, setCharities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user is already authenticated
    checkUser();
    
    // Check if coming from email verification
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setCurrentStep(2);
      fetchCharities();
    }
  }, [searchParams]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setEmail(user.email || '');
      
      // Check if user already has a charity selected
      const { data: profile } = await supabase
        .from('users')
        .select('selected_charity_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.selected_charity_id) {
        // User already completed signup
        router.push('/game');
      } else {
        // User needs to select charity
        setCurrentStep(2);
        fetchCharities();
      }
    }
  };

  const fetchCharities = async () => {
    const { data } = await supabase
      .from('charities')
      .select('*')
      .eq('approved', true)
      .order('name');
    
    if (data) {
      setCharities(data);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setEmailSent(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/signup?verified=true`,
      },
    });

    if (error) {
      setEmailSent(false);
      alert(error.message);
    }
    
    setLoading(false);
  };

  const handleCharitySelect = (charity: any) => {
    setSelectedCharity(charity);
  };

  const handleCharityConfirm = async () => {
    if (!selectedCharity || !user) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from('users')
      .update({ selected_charity_id: selectedCharity.id })
      .eq('id', user.id);

    if (!error) {
      setCurrentStep(3);
    }
    
    setLoading(false);
  };

  const handleComplete = () => {
    router.push('/game');
  };

  // Step 1: Account Registration
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎰</div>
            <h1 className="text-4xl font-bold text-white mb-2">Charity Slot</h1>
            <p className="text-purple-200 text-lg">Play with purpose. Win for charity.</p>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your Account</h2>
              <p className="text-gray-600">Join thousands of players making a difference</p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Continue with Magic Link</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Check Your Email</h3>
                <p className="text-gray-600">We've sent a magic link to <strong>{email}</strong></p>
                <p className="text-sm text-gray-500 mt-2">Click the link to verify your account</p>
              </div>
            )}

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield size={16} className="text-green-500" />
                  <span>Secure & Safe</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart size={16} className="text-red-500" />
                  <span>Support Charities</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Gift size={16} className="text-purple-500" />
                  <span>20 Free Credits</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Star size={16} className="text-yellow-500" />
                  <span>Real Impact</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a href="/" className="text-sm text-purple-600 hover:text-purple-700">
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Charity Selection
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="text-4xl mb-4">❤️</div>
            <h1 className="text-3xl font-bold text-white mb-2">Choose Your Charity</h1>
            <p className="text-purple-200">When you win, 100% of the pot goes to your selected charity</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
                <span className="ml-2 text-white text-sm">Account</span>
              </div>
              <div className="w-8 h-px bg-purple-400"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <span className="ml-2 text-white text-sm font-semibold">Charity</span>
              </div>
              <div className="w-8 h-px bg-gray-400"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">3</span>
                </div>
                <span className="ml-2 text-gray-400 text-sm">Credits</span>
              </div>
            </div>
          </div>

          {/* Charity Grid */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
              {charities.map((charity) => (
                <div
                  key={charity.id}
                  onClick={() => handleCharitySelect(charity)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedCharity?.id === charity.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Heart className="text-purple-500" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{charity.name}</h3>
                        {selectedCharity?.id === charity.id && (
                          <Check size={16} className="text-purple-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{charity.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedCharity && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Heart className="text-purple-500" size={24} />
                  <div>
                    <h4 className="font-semibold text-purple-800">Selected: {selectedCharity.name}</h4>
                    <p className="text-sm text-purple-600">All your winnings will be donated here</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCharityConfirm}
              disabled={!selectedCharity || loading}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                selectedCharity
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Continue to Free Credits</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Free Credits Welcome
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
                <span className="ml-2 text-white text-sm">Account</span>
              </div>
              <div className="w-8 h-px bg-green-400"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
                <span className="ml-2 text-white text-sm">Charity</span>
              </div>
              <div className="w-8 h-px bg-purple-400"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <span className="ml-2 text-white text-sm font-semibold">Credits</span>
              </div>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="text-6xl mb-6 animate-bounce">🎉</div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Welcome to Charity Slot!</h1>
            
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-6 mb-6">
              <div className="text-4xl font-bold text-green-600 mb-2">20 FREE CREDITS</div>
              <div className="text-lg text-green-700 font-semibold">Worth $5.00</div>
              <p className="text-sm text-green-600 mt-2">Start playing immediately - no payment required!</p>
            </div>

            {/* Selected Charity Reminder */}
            {selectedCharity && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Heart className="text-purple-500" size={24} />
                  <div>
                    <h3 className="font-semibold text-purple-800">{selectedCharity.name}</h3>
                    <p className="text-sm text-purple-600">Your selected charity</p>
                  </div>
                </div>
                <p className="text-xs text-purple-600 text-center">
                  When you win, 100% of the pot will be donated here
                </p>
              </div>
            )}

            {/* How It Works */}
            <div className="text-left mb-8">
              <h3 className="font-semibold text-gray-800 mb-3 text-center">How Charity Slot Works:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Each spin costs 1, 3, or 5 credits (you choose)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Every losing spin adds to the global donation pot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>When you win, the entire pot goes to your charity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Win by matching 5 symbols in any row, column, or diagonal</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Start Playing Now!</span>
              <ArrowRight size={24} />
            </button>

            <p className="text-xs text-gray-500 mt-4">
              You can purchase more credits anytime. Each credit = $0.25
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
} 