import type { Core } from '@strapi/strapi';

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
   * Get welcome message (keeping original method for compatibility)
   */
  getWelcomeMessage() {
    return 'Welcome to Strapi 🚀';
  },
});

export default service;
