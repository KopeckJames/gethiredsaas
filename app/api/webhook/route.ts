import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: session?.metadata?.userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: subscription.items.data[0].price.id,
        stripe_current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      });
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    await supabase
      .from('user_subscriptions')
      .update({
        stripe_price_id: subscription.items.data[0].price.id,
        stripe_current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  return new NextResponse(null, { status: 200 })
};
