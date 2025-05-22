'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Heart, Check } from 'lucide-react';

interface CharitySelectorProps {
  userId: string;
  onSelect: (charityId: string) => void;
  onClose: () => void;
}

export default function CharitySelector({ userId, onSelect, onClose }: CharitySelectorProps) {
  const [charities, setCharities] = useState<any[]>([]);
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    const { data } = await supabase
      .from('charities')
      .select('*')
      .eq('approved', true)
      .order('name');

    if (data) {
      setCharities(data);
    }
    setLoading(false);
  };

  const handleSelect = async () => {
    if (!selectedCharity) return;

    const { error } = await supabase
      .from('users')
      .update({ selected_charity_id: selectedCharity })
      .eq('id', userId);

    if (!error) {
      onSelect(selectedCharity);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Choose Your Charity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-300 mb-6">
          Select the charity where your winnings will be directed. You can change this later.
        </p>

        {loading ? (
          <div className="text-center py-8">Loading charities...</div>
        ) : (
          <div className="grid gap-4 mb-6">
            {charities.map((charity) => (
              <div
                key={charity.id}
                onClick={() => setSelectedCharity(charity.id)}
                className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedCharity === charity.id
                    ? 'ring-2 ring-green-500 bg-gray-600'
                    : 'hover:bg-gray-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {charity.logo_url ? (
                      <img
                        src={charity.logo_url}
                        alt={charity.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
                        <Heart className="text-gray-400" size={24} />
                      </div>
                    )}
                    {selectedCharity === charity.id && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{charity.name}</h3>
                    {charity.description && (
                      <p className="text-gray-300 text-sm mt-1">{charity.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleSelect}
            disabled={!selectedCharity}
            className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold"
          >
            Select Charity
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 