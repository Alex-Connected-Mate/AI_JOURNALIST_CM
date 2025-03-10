'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: PlanFeature[];
  description: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    interval: 'month',
    description: 'Pour commencer avec les fonctionnalités essentielles',
    features: [
      { name: '3 sessions actives', included: true },
      { name: '20 participants par session', included: true },
      { name: 'Fonctionnalités de base', included: true },
      { name: 'Support communautaire', included: true },
      { name: 'Fonctionnalités AI', included: false },
      { name: 'Support premium', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    interval: 'month',
    description: 'Pour les professionnels qui veulent plus de fonctionnalités',
    features: [
      { name: '50 sessions actives', included: true },
      { name: '100 participants par session', included: true },
      { name: 'Toutes les fonctionnalités de base', included: true },
      { name: 'Fonctionnalités AI avancées', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'Analytics avancés', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    interval: 'month',
    description: 'Pour les grandes organisations avec des besoins spécifiques',
    features: [
      { name: 'Sessions illimitées', included: true },
      { name: 'Participants illimités', included: true },
      { name: 'Toutes les fonctionnalités', included: true },
      { name: 'AI personnalisée', included: true },
      { name: 'Support dédié', included: true },
      { name: 'Personnalisation complète', included: true },
    ],
  },
];

export default function SubscriptionPage() {
  const { user, userProfile } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.subscription_status) {
      setSelectedPlan(userProfile.subscription_status);
    }
  }, [userProfile]);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user?.id,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Error:', error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 font-bricolage">
          Choisissez votre plan
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Des solutions adaptées à tous les besoins
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`first-level-block p-8 rounded-2xl ${
              plan.id === selectedPlan
                ? 'ring-2 ring-blue-500'
                : ''
            }`}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 font-bricolage">
                  {plan.name}
                </h3>
                <p className="mt-4 text-gray-600">{plan.description}</p>
                <div className="mt-8">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600">/{plan.interval}</span>
                  )}
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.included ? (
                        <svg
                          className="h-5 w-5 text-green-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className="ml-3 text-gray-600">
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading || plan.id === selectedPlan}
                className={`mt-8 w-full cm-button py-3 ${
                  plan.id === selectedPlan
                    ? 'bg-green-500 hover:bg-green-600'
                    : ''
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading
                  ? 'Chargement...'
                  : plan.id === selectedPlan
                  ? 'Plan actuel'
                  : 'Sélectionner'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          Besoin d'une solution personnalisée ?{' '}
          <a href="/contact" className="text-blue-600 hover:text-blue-800">
            Contactez-nous
          </a>
        </p>
      </div>
    </div>
  );
} 