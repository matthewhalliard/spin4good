'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gift, Clock } from 'lucide-react';

export default function RecentWinners() {
  const [winners, setWinners] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchRecentWinners();
    subscribeToWinners();
  }, []);

  const fetchRecentWinners = async () => {
    const { data } = await supabase
      .from('donations')
      .select(`
        *,
        users!inner(email),
        charities!inner(name)
      `)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (data) {
      setWinners(data);
    }
  };

  const subscribeToWinners = () => {
    const channel = supabase
      .channel('recent-donations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations'
        },
        () => {
          fetchRecentWinners();
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

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now.getTime() - then.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getFirstName = (email: string) => {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Recent Winners</h3>
      {winners.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No recent winners yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {winners.map((winner) => (
            <div key={winner.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-green-400" />
                <span>
                  <strong>{getFirstName(winner.users.email)}</strong> directed{' '}
                  {formatAmount(winner.amount_cents)} to{' '}
                  <strong>{winner.charities.name}</strong>
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <Clock size={14} className="mr-1" />
                {getTimeAgo(winner.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 