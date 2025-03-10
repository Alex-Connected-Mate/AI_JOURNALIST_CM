import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case 'checkout.session.completed':
      // Mettre à jour l'abonnement dans la base de données
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          stripe_subscription_id: session.subscription as string,
          current_period_start: new Date(session.created * 1000).toISOString(),
          current_period_end: new Date((session.created + 30 * 24 * 60 * 60) * 1000).toISOString(),
        })
        .eq('user_id', session.client_reference_id);

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        return new NextResponse('Error updating subscription', { status: 500 });
      }

      // Mettre à jour le statut de l'utilisateur
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_status: 'premium',
          stripe_customer_id: session.customer as string,
        })
        .eq('id', session.client_reference_id);

      if (userError) {
        console.error('Error updating user:', userError);
        return new NextResponse('Error updating user', { status: 500 });
      }
      break;

    case 'customer.subscription.updated':
      // Gérer les mises à jour d'abonnement
      break;

    case 'customer.subscription.deleted':
      // Gérer les suppressions d'abonnement
      const { error: cancelError } = await supabase
        .from('users')
        .update({
          subscription_status: 'free',
          subscription_end_date: new Date().toISOString(),
        })
        .eq('stripe_customer_id', session.customer);

      if (cancelError) {
        console.error('Error canceling subscription:', cancelError);
        return new NextResponse('Error canceling subscription', { status: 500 });
      }
      break;
  }

  return new NextResponse(null, { status: 200 });
} 