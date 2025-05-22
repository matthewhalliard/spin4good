'use client';

import React, { useState, useEffect } from 'react';
import { Play, Heart, Shield, Users, TrendingUp, Star, Gift, ArrowRight, Menu, X, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPot, setCurrentPot] = useState(0);
  const [totalDonated, setTotalDonated] = useState(0);
  const [recentWinners, setRecentWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is already logged in
    checkUser();
    // Fetch real stats
    fetchStats();
    // Subscribe to live updates
    const unsubscribe = subscribeToUpdates();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // If user is logged in, redirect to game
      router.push('/game');
    }
  };

  const fetchStats = async () => {
    // Fetch current pot
    const { data: globalState } = await supabase
      .from('global_state')
      .select('pot_total_cents')
      .single();
    
    if (globalState) {
      setCurrentPot(globalState.pot_total_cents);
    }

    // Fetch total donated (sum of all donations)
    const { data: donations } = await supabase
      .from('donations')
      .select('amount_cents');
    
    if (donations) {
      const total = donations.reduce((sum, d) => sum + d.amount_cents, 0);
      setTotalDonated(total);
    }

    // Fetch recent winners
    const { data: winners } = await supabase
      .from('donations')
      .select(`
        *,
        users!inner(email),
        charities!inner(name)
      `)
      .order('timestamp', { ascending: false })
      .limit(3);
    
    if (winners) {
      setRecentWinners(winners);
    }

    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('landing-stats')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'global_state'
        },
        (payload) => {
          if (payload.new && 'pot_total_cents' in payload.new) {
            setCurrentPot(payload.new.pot_total_cents);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handlePlayNow = () => {
    router.push('/signup');
  };

  const features = [
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "100% to Charity",
      description: "Every winning spin directs the entire pot to your chosen charity. No fees, no cuts."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Secure & Transparent",
      description: "All donations are publicly tracked. Built with bank-level security you can trust."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Global Community",
      description: "Join thousands of players making a real difference around the world."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-500" />,
      title: "Real Impact",
      description: "Watch your contributions add up. See exactly how your spins create change."
    }
  ];

  const charities = [
    { name: "Ocean Conservation", logo: "🌊", recent: "$2,341" },
    { name: "Education Fund", logo: "📚", recent: "$1,876" },
    { name: "Medical Relief", logo: "🏥", recent: "$3,209" },
    { name: "Animal Rescue", logo: "🐕", recent: "$1,542" },
    { name: "Clean Water", logo: "💧", recent: "$2,108" },
    { name: "Hunger Relief", logo: "🍎", recent: "$1,923" }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      text: "I've donated over $500 to ocean conservation just by playing! It's addictive knowing every spin helps.",
      charity: "Ocean Conservation Alliance"
    },
    {
      name: "Mike R.", 
      text: "Finally, a game where losing still feels good because it grows the pot for someone else to win.",
      charity: "Global Education Fund"
    },
    {
      name: "Emma L.",
      text: "Won $247 for my favorite animal shelter last week. The feeling is incredible!",
      charity: "Animal Rescue League"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎰</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Charity Slot
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 transition-colors">How It Works</a>
              <a href="#charities" className="text-gray-700 hover:text-purple-600 transition-colors">Charities</a>
              <a href="#impact" className="text-gray-700 hover:text-purple-600 transition-colors">Impact</a>
              <button 
                onClick={handlePlayNow}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Play Now
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-4">
              <a href="#how-it-works" className="block text-gray-700">How It Works</a>
              <a href="#charities" className="block text-gray-700">Charities</a>
              <a href="#impact" className="block text-gray-700">Impact</a>
              <button 
                onClick={handlePlayNow}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-full"
              >
                Play Now
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Play Slots,
                <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                  {' '}Change Lives
                </span>
              </h1>
              <p className="text-xl mb-8 text-purple-200 leading-relaxed">
                The first slot machine where every spin supports charity. Win big, give bigger. 
                100% of winnings go directly to causes that matter.
              </p>
              
              {/* Live Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8 max-w-md mx-auto lg:mx-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {loading ? '...' : formatAmount(currentPot)}
                  </div>
                  <div className="text-sm text-purple-200">Current Pot</div>
                  <div className="text-xs text-purple-300">🔴 LIVE</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {loading ? '...' : formatAmount(totalDonated)}
                  </div>
                  <div className="text-sm text-purple-200">Total Donated</div>
                  <div className="text-xs text-purple-300">All Time</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={handlePlayNow}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-8 py-4 rounded-full hover:from-yellow-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  <Play size={24} />
                  Start Playing Free
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-purple-900 transition-all">
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl max-w-md w-full">
                {/* Mini Slot Machine Demo */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-4">Live Game Preview</h3>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {['⭐️', '🔔', '🍇', '🍋', '7️⃣'].map((symbol, i) => (
                      <div key={i} className="bg-black/20 rounded-lg h-12 flex items-center justify-center text-2xl animate-pulse">
                        {symbol}
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
                    Next Winner Gets {loading ? '...' : formatAmount(currentPot)}
                  </div>
                </div>
                
                {/* Recent Winners */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-center">Recent Winners:</div>
                  <div className="space-y-1 text-sm">
                    {recentWinners.length > 0 ? (
                      recentWinners.map((winner, index) => (
                        <div key={index} className="flex justify-between bg-white/10 rounded px-3 py-1">
                          <span>{winner.users.email.split('@')[0]}</span>
                          <span className="text-green-400">
                            {formatAmount(winner.amount_cents)} → {winner.charities.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between bg-white/10 rounded px-3 py-1">
                          <span>Emma</span>
                          <span className="text-green-400">$247 → Animal Rescue</span>
                        </div>
                        <div className="flex justify-between bg-white/10 rounded px-3 py-1">
                          <span>Jake</span>
                          <span className="text-green-400">$156 → Clean Water</span>
                        </div>
                        <div className="flex justify-between bg-white/10 rounded px-3 py-1">
                          <span>Lisa</span>
                          <span className="text-green-400">$203 → Education</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Charity Slot Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple to play, powerful in impact. Every spin contributes to charity, every win changes lives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎯</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">1. Choose Your Charity</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Select from dozens of verified charities across categories like education, environment, health, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎰</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">2. Spin to Win</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Every losing spin adds to the global pot. When you win, 100% goes to your chosen charity. No fees, ever.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">❤️</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">3. Make an Impact</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Track your total contributions and see real updates from the charities you've supported.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">The Math is Beautiful</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <span>You lose: Money goes to pot (builds up for charity)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <span>You win: Entire pot goes to your charity</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <span>Everyone wins: More spins = bigger charitable impact</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white p-6 rounded-xl text-center">
                <h4 className="text-xl font-semibold mb-3">Example Impact</h4>
                <div className="space-y-2 text-sm">
                  <div>100 players spin $1 each = $100 pot</div>
                  <div>1 player wins → $100 to their charity</div>
                  <div className="text-yellow-300 font-semibold">Result: $100 donated, everyone had fun!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Players Love Charity Slot</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Built for impact, designed for fun</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-all bg-white border">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charities Showcase */}
      <section id="charities" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Charities</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">All vetted organizations making real impact worldwide</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {charities.map((charity, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{charity.logo}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{charity.name}</h3>
                    <p className="text-green-600 font-medium">Recent: {charity.recent}</p>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">Latest donation from Charity Slot player</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={handlePlayNow}
              className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition-all"
            >
              View All Charities & Start Playing
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Player Stories</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Real impact from real players</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">Supporting {testimonial.charity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Spin for Good?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of players making a difference. Start with 20 free credits - no payment required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handlePlayNow}
              className="bg-yellow-500 text-black font-bold px-8 py-4 rounded-full hover:bg-yellow-400 transition-all flex items-center gap-2 text-lg"
            >
              <Gift size={24} />
              Start with Free Credits
            </button>
            <div className="text-sm opacity-75">
              No credit card required • 2-minute setup
            </div>
          </div>

          <div className="mt-8 flex justify-center items-center gap-6 text-sm opacity-75">
            <div className="flex items-center gap-2">
              <Shield size={16} />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart size={16} />
              <span>100% to charity</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} />
              <span>Instant play</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">🎰</div>
                <div className="text-xl font-bold">Charity Slot</div>
              </div>
              <p className="text-gray-400">
                The slot machine that changes the world, one spin at a time.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Game</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#how-it-works" className="hover:text-white">How to Play</a></li>
                <li><a href="/signup" className="hover:text-white">Sign Up</a></li>
                <li><a href="#" className="hover:text-white">Fair Play</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Charities</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#charities" className="hover:text-white">Browse All</a></li>
                <li><a href="#" className="hover:text-white">Apply as Charity</a></li>
                <li><a href="#impact" className="hover:text-white">Impact Reports</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Charity Slot. Making the world better, one spin at a time. Play responsibly. Must be 18+ to play.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
