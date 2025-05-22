'use client';

import { useState } from 'react';
import { X, CreditCard, Loader2, Clock } from 'lucide-react';

interface CreditPurchaseModalProps {
  userProfile: any;
  onClose: () => void;
  onSuccess: (newCredits: number) => void;
}

const creditPackages = [
  { credits: 40, price: 10, label: '40 Credits', value: '$10.00' },
  { credits: 80, price: 20, label: '80 Credits', value: '$20.00' },
  { credits: 200, price: 50, label: '200 Credits', value: '$50.00' },
  { credits: 400, price: 100, label: '400 Credits', value: '$100.00', bestValue: true },
];

export default function CreditPurchaseModal({ userProfile, onClose, onSuccess }: CreditPurchaseModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Buy Credits</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="text-center py-12">
          <div className="bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-purple-400" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3">Coming Soon!</h3>
          <p className="text-gray-300 mb-6">
            Credit purchases will be available shortly. 
          </p>
          <p className="text-sm text-gray-400 mb-8">
            For now, enjoy your free credits and help us test the game. 
            We'll notify you when purchasing goes live!
          </p>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h4 className="font-semibold mb-2">Planned Credit Packages:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {creditPackages.map((pkg) => (
                <div key={pkg.credits} className="flex justify-between">
                  <span className="text-gray-400">{pkg.label}</span>
                  <span className="text-green-400">{pkg.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
} 