/**
 * Admin routes for Stripe Demo plugin
 * These routes are accessible from the admin panel
 */
export default () => ({
  type: 'admin',
  routes: [
    /**
     * GET /stripe-demo/config
     * Get Stripe configuration (Stripe API key)
     * Only accessible by super admin
     */
    {
      method: 'GET',
      path: '/config',
      handler: 'controller.getConfig',
      config: {
        policies: ['plugin::stripe-demo.is-super-admin'],
      },
    },
    /**
     * PUT /stripe-demo/config
     * Save Stripe configuration (Stripe API key)
     * Only accessible by super admin
     */
    {
      method: 'PUT',
      path: '/config',
      handler: 'controller.saveConfig',
      config: {
        policies: ['plugin::stripe-demo.is-super-admin'],
      },
    },
  ],
});
