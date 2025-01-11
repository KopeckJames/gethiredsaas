import { createClient } from '@/lib/supabase';

export async function checkSubscription() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return false;
    }

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_price_id, stripe_current_period_end')
      .eq('user_id', session.user.id)
      .single();

    if (error || !subscription) {
      return false;
    }

    return subscription.stripe_price_id && new Date(subscription.stripe_current_period_end) > new Date();
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

export async function getUserSubscription() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return null;
    }

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}
