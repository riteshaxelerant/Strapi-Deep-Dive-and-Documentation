# Roles and Permissions System

## Overview

Strapi's Role-Based Access Control (RBAC) system provides granular control over who can access and modify content. This guide covers the roles and permissions system, including default roles, custom roles, permission types, field-level permissions, and RBAC patterns.

---

## Understanding Roles and Permissions

### Key Concepts

- **Roles**: Groups that define what users can do
- **Permissions**: Specific actions that can be performed on content
- **Users**: Individual accounts assigned to roles
- **Content Types**: Resources that permissions apply to

### Two Types of Users

1. **Administrators**: Access the admin panel, manage content and settings
2. **End Users**: Consume content through frontend applications via API

---

## Default Roles

### Administrator Roles

Strapi provides default administrator roles:

#### Super Admin
- Full access to all features
- Cannot be deleted or modified
- Can manage all administrators
- Access to all settings

#### Editor
- Can create, read, update, and delete content
- Cannot access settings
- Cannot manage other administrators

#### Author
- Can create and read own content
- Can update and delete own content
- Limited access compared to Editor

#### Custom Administrator Roles
- Create custom roles with specific permissions
- Assign permissions granularly
- Control access to features and settings

### End User Roles

#### Public
- Default role for unauthenticated users
- Access to public content only
- No authentication required

#### Authenticated
- Default role for logged-in users
- Requires authentication
- Can access protected content

---

## Creating Custom Roles

### Administrator Roles

#### Step 1: Access Role Management

1. Navigate to **Settings** > **Administration Panel** > **Roles**
2. Click **+ Add new role**

#### Step 2: Configure Role

- **Name**: Role name (e.g., "Content Manager")
- **Description**: Role description
- **Permissions**: Select permissions for each content type

#### Step 3: Assign Permissions

Select permissions for:
- **Content Types**: CRUD operations
- **Plugins**: Plugin-specific permissions
- **Settings**: Settings access

#### Step 4: Save Role

Click **Save** to create the role.

### End User Roles

#### Step 1: Access Users & Permissions

1. Navigate to **Settings** > **Users & Permissions** > **Roles**
2. Click **+ Add new role**

#### Step 2: Configure Role

- **Name**: Role name (e.g., "Premium User")
- **Description**: Role description

#### Step 3: Set Permissions

Configure permissions for:
- **Content Types**: Read, create, update, delete
- **Plugins**: Plugin access
- **Settings**: User settings

---

## Permission Types

### Content Type Permissions

For each Content Type, you can set:

#### find
- **Description**: List all entries
- **API Endpoint**: `GET /api/{content-type}`
- **Use Case**: Browse content

#### findOne
- **Description**: Get single entry
- **API Endpoint**: `GET /api/{content-type}/:id`
- **Use Case**: View specific content

#### create
- **Description**: Create new entry
- **API Endpoint**: `POST /api/{content-type}`
- **Use Case**: Add new content

#### update
- **Description**: Update existing entry
- **API Endpoint**: `PUT /api/{content-type}/:id`
- **Use Case**: Edit content

#### delete
- **Description**: Delete entry
- **API Endpoint**: `DELETE /api/{content-type}/:id`
- **Use Case**: Remove content

#### publish
- **Description**: Publish content
- **API Endpoint**: `POST /api/{content-type}/:id/actions/publish`
- **Use Case**: Make content public

#### unpublish
- **Description**: Unpublish content
- **API Endpoint**: `POST /api/{content-type}/:id/actions/unpublish`
- **Use Case**: Make content private

### Plugin Permissions

Plugins can define their own permissions:
- **Upload**: Media library access
- **Users & Permissions**: User management
- **Email**: Email sending
- **GraphQL**: GraphQL API access

### Settings Permissions

Control access to:
- **Application**: General settings
- **Email**: Email configuration
- **Users & Permissions**: User management settings
- **Webhooks**: Webhook configuration

---

## Field-Level Permissions

### Overview

Field-level permissions allow you to control access to specific fields within a Content Type.

### Enabling Field-Level Permissions

1. Navigate to **Settings** > **Users & Permissions** > **Roles**
2. Select a role
3. Expand a Content Type
4. Click on a permission (e.g., "find")
5. Configure field-level access

### Field Access Options

- **All fields**: Access to all fields
- **Only specific fields**: Select which fields are accessible
- **No fields**: No field access (permission denied)

### Use Cases

- **Public API**: Expose only public fields
- **Internal API**: Expose all fields to authenticated users
- **Sensitive Data**: Hide sensitive fields from certain roles

### Example Configuration

```javascript
// Role: Public
// Content Type: Article
// Permission: find
Fields: {
  title: true,
  content: true,
  excerpt: true,
  // Hidden fields
  internalNotes: false,
  draftContent: false
}
```

---

## Permission Inheritance

### How It Works

- Permissions are inherited from roles
- Users inherit permissions from their assigned role
- Multiple roles can be assigned (permissions combine)

### Permission Hierarchy

```
Super Admin (All permissions)
  └── Editor (Content permissions)
      └── Author (Own content permissions)
```

### Combining Permissions

When a user has multiple roles:
- Permissions are combined (union)
- Most permissive access is granted
- If one role allows access, user has access

---

## RBAC Patterns

### Pattern 1: Content Creator

**Role**: Content Creator
**Permissions**:
- Create: All content types
- Read: Own content
- Update: Own content
- Delete: Own content (draft only)

**Use Case**: Blog authors, content writers

### Pattern 2: Content Manager

**Role**: Content Manager
**Permissions**:
- Create: All content types
- Read: All content
- Update: All content
- Delete: All content
- Publish: All content

**Use Case**: Content editors, managers

### Pattern 3: Content Viewer

**Role**: Content Viewer
**Permissions**:
- Read: All published content
- No create, update, or delete

**Use Case**: Reviewers, stakeholders

### Pattern 4: Premium User

**Role**: Premium User
**Permissions**:
- Read: All content (including premium)
- Create: Comments, reviews
- Update: Own comments
- Delete: Own comments

**Use Case**: Paid subscribers, members

### Pattern 5: API Consumer

**Role**: API Consumer
**Permissions**:
- Read: Specific content types
- No create, update, or delete

**Use Case**: External applications, integrations

---

## Permission Configuration

### Via Admin Panel

1. Navigate to **Settings** > **Users & Permissions** > **Roles**
2. Select or create a role
3. Configure permissions for each Content Type
4. Set field-level permissions
5. Save changes

### Programmatic Configuration

```javascript
// server/src/index.js
module.exports = ({ strapi }) => {
  strapi.server.routes([
    {
      method: 'GET',
      path: '/api/custom-endpoint',
      handler: 'custom-controller.index',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
  ]);
};
```

---

## Advanced Permission Scenarios

### Conditional Permissions

```javascript
// Custom policy for conditional access
module.exports = async (policyContext, config, { strapi }) => {
  const { id } = policyContext.params;
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  // Check if user owns the resource
  const entry = await strapi.entityService.findOne('api::article.article', id);
  
  if (entry.author.id === user.id) {
    return true; // User owns the resource
  }

  // Check if user has admin role
  if (user.role.name === 'Administrator') {
    return true;
  }

  return false;
};
```

### Dynamic Permissions

```javascript
// Check permissions dynamically
const canEdit = await strapi
  .plugin('users-permissions')
  .service('users-permissions')
  .user({ id: userId })
  .can('plugin::users-permissions.update', 'api::article.article');
```

---

## Best Practices

### Role Design

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Role Clarity**: Use clear, descriptive role names
3. **Separation of Concerns**: Separate content and administrative roles
4. **Regular Review**: Periodically review and update permissions

### Permission Management

1. **Document Permissions**: Document what each role can do
2. **Test Permissions**: Test permissions thoroughly
3. **Audit Access**: Log permission changes
4. **Monitor Usage**: Monitor permission usage

### Security

1. **Default Deny**: Deny by default, allow explicitly
2. **Field-Level Security**: Use field-level permissions for sensitive data
3. **Regular Audits**: Audit permissions regularly
4. **Remove Unused Roles**: Remove roles that are no longer needed

---

## Troubleshooting

### Common Issues

**Issue**: User cannot access content
- **Solution**: Check role permissions
- **Solution**: Verify user is assigned to correct role
- **Solution**: Check field-level permissions

**Issue**: Permission changes not taking effect
- **Solution**: Clear cache
- **Solution**: Restart Strapi server
- **Solution**: Verify user role assignment

**Issue**: API returns 403 Forbidden
- **Solution**: Check API token permissions
- **Solution**: Verify Content Type permissions
- **Solution**: Check authentication

---

## API Usage

### Checking Permissions in Code

```javascript
// In controller or service
const user = ctx.state.user;

if (!user) {
  return ctx.unauthorized('Authentication required');
}

// Check specific permission
const canUpdate = await strapi
  .plugin('users-permissions')
  .service('users-permissions')
  .user(user)
  .can('plugin::users-permissions.update', 'api::article.article');

if (!canUpdate) {
  return ctx.forbidden('Insufficient permissions');
}
```

### Programmatic Permission Assignment

```javascript
// Assign role to user
await strapi.plugin('users-permissions').service('users-permissions').updateUser(userId, {
  role: roleId
});
```

---

## References

- [Strapi Users & Permissions Documentation](https://docs.strapi.io/cms/features/users-permissions)
- [Strapi RBAC Documentation](https://docs.strapi.io/cms/features/rbac)
- [Strapi Roles and Permissions Guide](https://docs.strapi.io/user-docs/users-roles-permissions)

---

## Notes

### Key Takeaways

- Roles define what users can do
- Permissions control specific actions
- Field-level permissions provide granular control
- RBAC patterns help organize access control
- Regular audits ensure security

### Important Reminders

- Default roles: Public, Authenticated, Admin roles
- Custom roles can be created for specific needs
- Permissions apply to Content Types and plugins
- Field-level permissions control field access
- Test permissions thoroughly before production

