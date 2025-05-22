'use client';

import React, { useState, useEffect } from 'react';
import { UserCircle, DollarSign, Gift, Clock, TrendingUp, Menu, X, Info, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import CreditPurchaseModal from '@/components/CreditPurchaseModal';
import SlotMachine from '@/components/SlotMachine';
import RecentWinners from '@/components/RecentWinners';

export default function GamePage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [potAmount, setPotAmount] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchGlobalState();
    subscribeToUpdates();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/');
      return;
    }

    setUser(user);
    
    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*, charities(id, name, logo_url)')
      .eq('id', user.id)
      .single();

    setUserProfile(profile);
    
    // Check if user needs to select a charity
    if (!profile?.selected_charity_id) {
      // Redirect to signup flow if no charity selected
      router.push('/signup?verified=true');
      return;
    }
    
    setLoading(false);
  };

  const fetchGlobalState = async () => {
    const { data } = await supabase
      .from('global_state')
      .select('pot_total_cents')
      .single();
    
    if (data) {
      setPotAmount(data.pot_total_cents);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('global-state')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'global_state'
        },
        (payload) => {
          if (payload.new && 'pot_total_cents' in payload.new) {
            setPotAmount(payload.new.pot_total_cents);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const updateCredits = (newCredits: number) => {
    setUserProfile((prev: any) => ({ ...prev, credits: newCredits }));
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="text-2xl font-bold">Charity Slot</div>
        
        <div className="md:hidden">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-700 rounded-full py-1 px-4">
            <DollarSign size={16} className="text-green-400" />
            <span>{userProfile?.credits || 0} credits</span>
          </div>
          
          <button 
            onClick={() => setShowCreditModal(true)}
            className="bg-gray-600 hover:bg-gray-500 rounded-full py-1 px-4 flex items-center gap-2"
          >
            <Clock size={16} />
            Coming Soon
          </button>
          
          <div className="flex items-center gap-2">
            <UserCircle size={24} />
            <span className="hidden md:inline">{user?.email}</span>
          </div>
          
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 md:hidden">
          <div className="w-64 h-full bg-gray-800 p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <UserCircle size={20} />
              <span>{user?.email}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-gray-700 rounded-full py-1 px-4">
                <DollarSign size={16} className="text-green-400" />
                <span>{userProfile?.credits || 0} credits</span>
              </div>
              
              <button 
                onClick={() => {
                  setShowCreditModal(true);
                  setSidebarOpen(false);
                }}
                className="bg-gray-600 hover:bg-gray-500 rounded-full py-1 px-4 flex items-center gap-2"
              >
                <Clock size={16} />
                Coming Soon
              </button>
            </div>
            
            <hr className="border-gray-600" />
            
            {userProfile?.charities && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Your Selected Charity</h3>
                <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
                  {userProfile.charities.logo_url && (
                    <img 
                      src={userProfile.charities.logo_url}
                      alt={userProfile.charities.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium">{userProfile.charities.name}</div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleSignOut}
              className="mt-auto text-gray-400 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-gray-800 p-4">
          <h2 className="text-xl font-bold mb-4">Your Impact</h2>
          
          {userProfile?.charities && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Your Selected Charity</h3>
              <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
                {userProfile.charities.logo_url && (
                  <img 
                    src={userProfile.charities.logo_url}
                    alt={userProfile.charities.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                                  <div className="font-medium">{userProfile.charities.name}</div>
                <div className="text-sm text-gray-400">
                  Your chosen charity
                </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Symbol Values</h3>
            <div className="bg-gray-700 rounded-lg p-3 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <div>7️⃣</div>
                <div className="text-yellow-400">Premium</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>⭐️</div>
                <div className="text-yellow-400">High</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>🔔</div>
                <div className="text-yellow-400">Medium</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>🍇</div>
                <div className="text-yellow-400">Medium</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>🍋</div>
                <div className="text-yellow-400">Low</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>🕉</div>
                <div className="text-purple-400">Wild</div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-4 flex flex-col">
          {/* Pot Display */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-lg p-4 mb-6 text-center">
            <div className="text-sm mb-1">Current Donation Pot</div>
            <div className="text-3xl font-bold flex items-center justify-center gap-2">
              🔥 {formatAmount(potAmount)} in play
            </div>
            <div className="text-sm mt-1 text-red-100">
              Someone will direct this to their chosen charity!
            </div>
          </div>
          
          {/* Slot Machine */}
          <SlotMachine 
            userProfile={userProfile}
            potAmount={potAmount}
            updateCredits={updateCredits}
            onNeedCredits={() => setShowCreditModal(true)}
          />
          
          {/* Recent Winners */}
          <RecentWinners />
        </main>
      </div>
      
      {/* Modals */}
      {showCreditModal && (
        <CreditPurchaseModal
          userProfile={userProfile}
          onClose={() => setShowCreditModal(false)}
          onSuccess={(newCredits) => {
            updateCredits(newCredits);
            setShowCreditModal(false);
          }}
        />
      )}
    </div>
  );
} 