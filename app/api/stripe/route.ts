import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

// Mark route as dynamic to allow cookie usage
export const dynamic = 'force-dynamic';

const settingsUrl = absoluteUrl("/settings");

export async function GET() {
  try {
    const session = await getSession();
    const supabase = createClient();
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!userId || !userEmail) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subscription?.stripe_customer_id) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: settingsUrl,
      });

      return new NextResponse(JSON.stringify({ url: stripeSession.url }));
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: settingsUrl,
      cancel_url: settingsUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "Genius Pro",
              description: "Unlimited AI Generations"
            },
            unit_amount: 2000,
            recurring: {
              interval: "month"
            }
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
    })

    return new NextResponse(JSON.stringify({ url: stripeSession.url }))
  } catch (error) {
    console.log("[STRIPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};
