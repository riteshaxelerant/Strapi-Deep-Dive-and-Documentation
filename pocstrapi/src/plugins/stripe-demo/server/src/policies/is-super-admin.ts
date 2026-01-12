import type { Core } from '@strapi/strapi';

/**
 * Policy to check if the user is a super admin
 * Only super admins can access Stripe configuration
 * 
 * @param policyContext - The policy context containing request state
 * @param config - Policy configuration (unused in this case)
 * @param strapi - Strapi instance
 * @returns Promise<boolean> - true if user is super admin, false otherwise
 */
const isSuperAdmin = async (
  policyContext: any,
  config: any,
  { strapi }: { strapi: Core.Strapi }
): Promise<boolean> => {
  // Get the authenticated user from the context
  const { user } = policyContext.state;

  // If no user is authenticated, deny access
  if (!user || !user.id) {
    return false;
  }

  try {
    // Fetch the full user object with roles from database
    // This ensures we have the complete role information
    const adminUser = await strapi.entityService.findOne('admin::user', user.id, {
      populate: ['roles'],
    });

    if (!adminUser) {
      return false;
    }

    // Check if user has isSuperAdmin property (Strapi 5)
    if (adminUser.isSuperAdmin === true) {
      return true;
    }

    // Check if user has super admin role
    // Super admin role code is 'strapi-super-admin'
    if (adminUser.roles && Array.isArray(adminUser.roles)) {
      const hasSuperAdminRole = adminUser.roles.some(
        (role: any) => role.code === 'strapi-super-admin'
      );
      if (hasSuperAdminRole) {
        return true;
      }
    }

    return false;
  } catch (error) {
    // If there's an error, deny access for security
    strapi.log.error('Error checking super admin status:', error);
    return false;
  }
};

export default isSuperAdmin;

