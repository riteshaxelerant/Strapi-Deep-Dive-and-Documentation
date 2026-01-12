import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get Stripe configuration (Stripe API key)
   * GET /stripe-demo/config
   */
  async getConfig(ctx: any) {
    try {
      // Get the Stripe key from service
      const stripeKey = await strapi
        .plugin('stripe-demo')
        .service('service')
        .getStripeKey();

      // Return the configuration (mask the key for security in response)
      ctx.body = {
        stripeKey: stripeKey || null,
      };
    } catch (error: any) {
      // Handle errors
      ctx.throw(500, error);
    }
  },

  /**
   * Save Stripe configuration (Stripe API key)
   * PUT /stripe-demo/config
   */
  async saveConfig(ctx: any) {
    try {
      // Get the Stripe key from request body
      const { stripeKey } = ctx.request.body;

      // Validate that stripeKey is provided
      if (!stripeKey || typeof stripeKey !== 'string') {
        return ctx.badRequest('Stripe key is required and must be a string');
      }

      // Save the Stripe key using service
      await strapi
        .plugin('stripe-demo')
        .service('service')
        .saveStripeKey(stripeKey);

      // Return success response
      ctx.body = {
        message: 'Stripe key saved successfully',
      };
    } catch (error: any) {
      // Handle errors
      ctx.throw(500, error);
    }
  },

  /**
   * Index method (keeping for compatibility)
   */
  index(ctx: any) {
    ctx.body = strapi
      .plugin('stripe-demo')
      .service('service')
      .getWelcomeMessage();
  },
});

export default controller;
