import type { Core } from '@strapi/strapi';
const Stripe = require('stripe');

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get the Stripe API key from plugin store
   * @returns Promise<string | null> The Stripe API key or null if not set
   */
  async getStripeKey(): Promise<string | null> {
    // Get plugin store for stripe-demo plugin
    const store = strapi.store({ type: 'plugin', name: 'stripe-demo' });
    
    // Get the Stripe key from store, default to null if not set
    const config = (await store.get({ key: 'config' })) as { stripeKey?: string } | null;
    
    return config?.stripeKey || null;
  },

  /**
   * Save the Stripe API key to plugin store
   * @param stripeKey - The Stripe API key to save
   * @returns Promise<void>
   */
  async saveStripeKey(stripeKey: string): Promise<void> {
    // Get plugin store for stripe-demo plugin
    const store = strapi.store({ type: 'plugin', name: 'stripe-demo' });
    
    // Save the Stripe key to store
    await store.set({ key: 'config', value: { stripeKey } });
  },

  /**
   * Create a Stripe payment intent
   * @param amount - The amount in dollars (will be converted to cents)
   * @returns Promise with payment intent object
   */
  async createPaymentIntent(amount: number) {
    try {
      // Get plugin store for stripe-demo plugin
      const store = strapi.store({ type: 'plugin', name: 'stripe-demo' });
      
      // Get the Stripe key from store
      const config = (await store.get({ key: 'config' })) as { stripeKey?: string } | null;
      const stripeKey = config?.stripeKey || null;

      // Check if Stripe key is configured
      if (!stripeKey) {
        throw new Error('Stripe API key is not configured. Please configure it in the admin panel.');
      }

      // Initialize Stripe with the API key
      const stripe = Stripe(stripeKey);

      // Create payment intent
      // Amount is in cents, so multiply by 100
      // Currency is USD
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert dollars to cents
        currency: 'usd',
      });

      return paymentIntent;
    } catch (error: any) {
      // Handle Stripe authentication errors (invalid API key)
      if (error.type === 'StripeAuthenticationError' || error.code === 'api_key_expired') {
        throw new Error('Invalid Stripe API key. Please check your API key configuration.');
      }
      
      // Re-throw custom errors (like missing key) - these are already user-friendly
      if (error.message && !error.type) {
        throw error;
      }
      
      // Handle other Stripe errors by wrapping them in a simple error message
      throw new Error(error.message || 'Failed to create payment intent with Stripe.');
    }
  },

  /**
   * Get welcome message (keeping original method for compatibility)
   */
  getWelcomeMessage() {
    return 'Welcome to Strapi 🚀';
  },
});

export default service;
