import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PLAN_PRICES = {
  free: null,
  pro: 'price_pro_monthly', // À remplacer par votre ID de prix Stripe
  enterprise: 'price_enterprise_monthly', // À remplacer par votre ID de prix Stripe
};

export async function POST(req: Request) {
  try {
    const { planId, userId } = await req.json();

    // Vérifier si l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Obtenir ou créer le client Stripe
    let stripeCustomerId = user.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Mettre à jour l'ID client Stripe dans Supabase
      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }

    // Créer la session de paiement
    const priceId = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
    if (!priceId) {
      return new NextResponse('Invalid plan', { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?canceled=true`,
      client_reference_id: userId,
      customer_update: {
        address: 'auto',
      },
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    });

    // Créer l'enregistrement d'abonnement dans Supabase
    await supabase.from('subscriptions').insert({
      user_id: userId,
      status: 'pending',
      stripe_subscription_id: null, // Sera mis à jour par le webhook
      current_period_start: new Date().toISOString(),
      current_period_end: null, // Sera mis à jour par le webhook
    });

    return new NextResponse(JSON.stringify({ sessionId: session.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 