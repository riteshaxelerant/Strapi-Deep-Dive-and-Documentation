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
   * Create a Stripe payment intent
   * POST /api/stripe-demo/pay
   */
  async createPaymentIntent(ctx: any) {
    try {
      // Get amount from request body
      const { amount } = ctx.request.body;

      // Validate amount - must be a number and greater than 0
      if (!amount || isNaN(amount) || amount <= 0) {
        return ctx.badRequest('Amount is required and must be a positive number');
      }

      // Convert amount to number
      const amountNumber = parseFloat(amount);

      // Create payment intent using service
      const paymentIntent = await strapi
        .plugin('stripe-demo')
        .service('service')
        .createPaymentIntent(amountNumber);

      // Return the payment intent
      ctx.body = {
        paymentIntent,
      };
    } catch (error: any) {
      // Handle errors and return proper error response
      strapi.log.error('Error creating payment intent:', error);
      
      ctx.status = 400;
      ctx.body = {
        error: {
          message: error.message || 'Failed to create payment intent',
        },
      };
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
