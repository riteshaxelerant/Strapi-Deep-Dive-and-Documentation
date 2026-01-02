# Plugin Development Guide

## Overview

This guide covers developing custom plugins for Strapi 5. Plugins allow you to extend Strapi's functionality, add custom features, and integrate with the admin panel. This guide covers plugin creation, structure, APIs, and best practices.

---

## Plugin Architecture

Strapi plugins consist of two main parts:

1. **Admin Panel** (`admin/`): Frontend components, pages, and UI elements visible in the admin panel
2. **Backend Server** (`server/`): Server-side logic, controllers, services, routes, and content types

Plugins can be:
- **Server-only**: Enhance API functionality without admin UI
- **Admin-only**: Add UI components without backend logic
- **Full-stack**: Complete plugins with both admin and server components

---

## Plugin Creation & Setup

### Prerequisites

- **yalc**: Must be installed globally for linking plugins during development
  ```bash
  npm install -g yalc
  # or
  yarn global add yalc
  ```

### Creating a Plugin with Plugin SDK

The Plugin SDK is the recommended way to create Strapi 5 plugins. It generates plugins without requiring a Strapi project setup.

#### Step 1: Initialize Plugin

```bash
# Using Yarn
yarn dlx @strapi/sdk-plugin init my-strapi-plugin

# Using npm
npx @strapi/sdk-plugin init my-strapi-plugin
```

The command will prompt you with setup questions:
- Plugin name
- Description
- Author information
- TypeScript or JavaScript
- Admin panel components
- Server components

#### Step 2: Link Plugin to Strapi Project

For development, link your plugin to a Strapi project:

```bash
# In plugin directory
yarn watch:link
# or
npm run watch:link
```

Then in your Strapi project:

```bash
# Using Yarn
yarn dlx yalc add --link my-strapi-plugin && yarn install

# Using npm
npx yalc add --link my-strapi-plugin && npm install
```

The plugin will be automatically detected from `node_modules` and doesn't need explicit configuration.

#### Step 3: Build for Publishing

When ready to publish:

```bash
yarn build && yarn verify
# or
npm run build && npm run verify
```

The `verify` command validates the plugin structure before publishing.

**Reference:** [Plugin Creation & Setup](https://docs.strapi.io/cms/plugins-development/create-a-plugin)

---

## Plugin Structure

### Generated Structure

When created with Plugin SDK, a plugin has this structure:

```
my-strapi-plugin/
├── admin/                    # Admin panel code
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Initializer.tsx
│   │   │   └── PluginIcon.tsx
│   │   ├── pages/            # Admin pages
│   │   │   └── App.tsx
│   │   ├── index.tsx         # Admin entry point
│   │   └── pluginId.ts       # Plugin identifier
│   └── package.json
│
├── server/                   # Server-side code
│   ├── src/
│   │   ├── config/           # Plugin configuration
│   │   ├── controllers/      # Controllers
│   │   ├── content-types/     # Content types
│   │   ├── middlewares/       # Middlewares
│   │   ├── policies/         # Policies
│   │   ├── routes/           # Routes
│   │   ├── services/         # Services
│   │   ├── bootstrap.js      # Bootstrap function
│   │   ├── destroy.js        # Cleanup function
│   │   ├── index.js          # Server entry point
│   │   └── register.js       # Register function
│   └── package.json
│
├── package.json
├── tsconfig.json             # TypeScript config (if TS)
└── README.md
```

### Key Files

**Admin Entry Point** (`admin/src/index.tsx`):
- Registers plugin with admin panel
- Exports plugin configuration

**Server Entry Point** (`server/src/index.js`):
- Registers server-side functionality
- Returns plugin components

**Bootstrap** (`server/src/bootstrap.js`):
- Runs after plugin registration
- Initialization logic

**Destroy** (`server/src/destroy.js`):
- Cleanup when Strapi shuts down

**Reference:** [Plugin Structure](https://docs.strapi.io/cms/plugins-development/plugin-structure)

---

## Plugin SDK

The Plugin SDK provides commands for plugin development:

### Development Commands

```bash
# Watch and link plugin during development
yarn watch:link

# Watch plugin (for monorepo)
yarn watch

# Build plugin
yarn build

# Verify plugin structure
yarn verify
```

### Monorepo Setup

In monorepo environments, use `watch` instead of `watch:link`:

```javascript
// webpack.config.js - Add alias for admin development
import path from 'node:path';

export default (config, webpack) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    'my-strapi-plugin': path.resolve(
      __dirname,
      '../plugins/my-strapi-plugin/admin/src'
    ),
  };
  return config;
};
```

### Local Plugin Configuration

For local plugins (not in node_modules), configure in `config/plugins.js`:

```javascript
module.exports = {
  'my-plugin': {
    enabled: true,
    resolve: './src/plugins/local-plugin',
  },
};
```

**Note**: Remove `@strapi/strapi` from plugin dev dependencies to avoid "must be used within StrapiApp" errors.

**Reference:** [Plugin SDK](https://docs.strapi.io/cms/plugins-development/plugin-sdk)

---

## Server API

The Server API allows you to add backend functionality to your plugin.

### Server Entry Point

```javascript
// server/src/index.js
module.exports = () => {
  return {
    register,
    bootstrap,
    destroy,
    config,
    controllers,
    contentTypes,
    middlewares,
    policies,
    routes,
    services,
  };
};
```

### Register Function

```javascript
// server/src/register.js
module.exports = ({ strapi }) => {
  // Plugin registration logic
  // Called when plugin is loaded
};
```

### Bootstrap Function

```javascript
// server/src/bootstrap.js
module.exports = ({ strapi }) => {
  // Initialization logic
  // Called after all plugins are registered
};
```

### Controllers

```javascript
// server/src/controllers/my-controller.js
module.exports = {
  async index(ctx) {
    ctx.body = { message: 'Hello from plugin' };
  },
};
```

### Services

```javascript
// server/src/services/my-service.js
module.exports = ({ strapi }) => ({
  async doSomething() {
    // Service logic
  },
});
```

### Routes

```javascript
// server/src/routes/index.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/my-plugin/hello',
      handler: 'my-controller.index',
      config: {
        policies: [],
      },
    },
  ],
};
```

### Content Types

```javascript
// server/src/content-types/my-content-type/schema.json
{
  "kind": "collectionType",
  "collectionName": "my_content_types",
  "info": {
    "singularName": "my-content-type",
    "pluralName": "my-content-types",
    "displayName": "My Content Type"
  },
  "attributes": {
    "title": {
      "type": "string"
    }
  }
}
```

### Middlewares

```javascript
// server/src/middlewares/my-middleware.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Middleware logic
    await next();
  };
};
```

### Policies

```javascript
// server/src/policies/my-policy.js
module.exports = async (policyContext, config, { strapi }) => {
  // Policy logic
  return true; // or false to block
};
```

**Reference:** [Server API](https://docs.strapi.io/cms/plugins-development/server-api)

---

## Admin Panel API

The Admin Panel API allows you to add UI components and pages to the admin panel.

### Admin Entry Point

```typescript
// admin/src/index.tsx
export default {
  register(app: StrapiApp) {
    // Register plugin with admin panel
    app.addMenuLink({
      to: `/plugins/my-plugin`,
      icon: MyPluginIcon,
      intlLabel: {
        id: 'my-plugin.name',
        defaultMessage: 'My Plugin',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
    });
  },

  bootstrap(app: StrapiApp) {
    // Bootstrap logic
  },

  registerTrads({ locales }: { locales: string[] }) {
    // Register translations
    return Promise.resolve({});
  },
};
```

### Adding Menu Links

```typescript
app.addMenuLink({
  to: '/plugins/my-plugin',
  icon: MyIcon,
  intlLabel: {
    id: 'my-plugin.name',
    defaultMessage: 'My Plugin',
  },
  Component: async () => {
    const component = await import('./pages/App');
    return component;
  },
  permissions: [], // Optional permissions
});
```

### Creating Pages

```typescript
// admin/src/pages/App.tsx
import { Layout, ContentLayout } from '@strapi/design-system';

const App = () => {
  return (
    <Layout>
      <ContentLayout>
        <h1>My Plugin Page</h1>
      </ContentLayout>
    </Layout>
  );
};

export default App;
```

### Using Strapi Hooks

```typescript
import { useFetchClient, useNotification } from '@strapi/helper-plugin';

const MyComponent = () => {
  const { get, post } = useFetchClient();
  const toggleNotification = useNotification();

  const fetchData = async () => {
    try {
      const { data } = await get('/my-plugin/data');
      // Handle data
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: 'Error fetching data',
      });
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
};
```

**Reference:** [Admin Panel API](https://docs.strapi.io/cms/plugins-development/admin-panel-api)

---

## Content Manager APIs

Content Manager APIs allow plugins to extend the Content Manager functionality.

### Adding Side Panels

```typescript
import { contentManagerApi } from '@strapi/strapi/admin';

contentManagerApi.addSidePanel({
  name: 'my-side-panel',
  Component: MySidePanel,
});
```

### Adding Document Actions

```typescript
contentManagerApi.addDocumentAction({
  name: 'my-action',
  Component: MyActionButton,
  permissions: ['plugin::my-plugin.action'],
});
```

### Adding Bulk Actions

```typescript
contentManagerApi.addBulkAction({
  name: 'my-bulk-action',
  Component: MyBulkActionButton,
  permissions: ['plugin::my-plugin.bulk-action'],
});
```

### Customizing Edit View

```typescript
contentManagerApi.addEditViewMiddleware({
  name: 'my-middleware',
  Component: MyEditViewComponent,
});
```

**Reference:** [Content Manager APIs](https://docs.strapi.io/cms/plugins-development/content-manager-apis)

---

## Plugin Extension

Plugins can extend other plugins or core Strapi functionality.

### Extending Core Plugins

```javascript
// Extend Users & Permissions plugin
module.exports = {
  register({ strapi }) {
    // Extend plugin functionality
  },
};
```

### Extending Custom Plugins

```javascript
// Extend another plugin
module.exports = {
  register({ strapi }) {
    const targetPlugin = strapi.plugin('target-plugin');
    // Extend target plugin
  },
};
```

**Reference:** [Plugins Extension](https://docs.strapi.io/cms/plugins-development/plugins-extension)

---

## Passing Data from Server to Admin

### Method 1: Using Plugin Config

```javascript
// server/src/index.js
module.exports = () => {
  return {
    config: {
      default: {
        myData: 'value from server',
      },
    },
  };
};
```

```typescript
// admin/src/index.tsx
import { useConfig } from '@strapi/helper-plugin';

const MyComponent = () => {
  const config = useConfig();
  const myData = config.get('plugin.my-plugin.myData');
  
  return <div>{myData}</div>;
};
```

### Method 2: Using Custom API Endpoint

```javascript
// server/src/routes/index.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/my-plugin/config',
      handler: 'config.get',
    },
  ],
};
```

```typescript
// admin/src/pages/App.tsx
const { get } = useFetchClient();

useEffect(() => {
  const fetchConfig = async () => {
    const { data } = await get('/my-plugin/config');
    // Use data
  };
  fetchConfig();
}, []);
```

**Reference:** [Pass Data from Server to Admin](https://docs.strapi.io/cms/plugins-development/guides/pass-data-from-server-to-admin)

---

## Admin Permissions for Plugins

### Defining Permissions

```javascript
// server/src/index.js
module.exports = () => {
  return {
    register({ strapi }) {
      strapi.admin.services.permission.actionProvider.register({
        section: 'plugins',
        displayName: 'My Plugin',
        uid: 'plugin::my-plugin',
        pluginName: 'my-plugin',
        subCategory: 'general',
        category: 'plugins',
      });

      strapi.admin.services.permission.conditionProvider.register({
        displayName: 'Is owner',
        name: 'isOwner',
        plugin: 'my-plugin',
        handler: (user) => {
          // Permission logic
          return true;
        },
      });
    },
  };
};
```

### Using Permissions in Admin

```typescript
import { useRBAC } from '@strapi/helper-plugin';

const MyComponent = () => {
  const { allowedActions } = useRBAC({
    create: [{ action: 'plugin::my-plugin.create' }],
    read: [{ action: 'plugin::my-plugin.read' }],
    update: [{ action: 'plugin::my-plugin.update' }],
    delete: [{ action: 'plugin::my-plugin.delete' }],
  });

  return (
    <div>
      {allowedActions.canCreate && <button>Create</button>}
      {allowedActions.canRead && <div>Read content</div>}
    </div>
  );
};
```

**Reference:** [Create Admin Permissions for Plugins](https://docs.strapi.io/cms/plugins-development/guides/admin-permissions-for-plugins)

---

## Store and Access Data

### Using Redux Store

```typescript
// admin/src/store/index.ts
import { createSlice } from '@reduxjs/toolkit';

const myPluginSlice = createSlice({
  name: 'myPlugin',
  initialState: {
    data: null,
    loading: false,
  },
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setData, setLoading } = myPluginSlice.actions;
export default myPluginSlice.reducer;
```

### Using React Context

```typescript
// admin/src/contexts/MyPluginContext.tsx
import { createContext, useContext, useState } from 'react';

const MyPluginContext = createContext(null);

export const MyPluginProvider = ({ children }) => {
  const [data, setData] = useState(null);

  return (
    <MyPluginContext.Provider value={{ data, setData }}>
      {children}
    </MyPluginContext.Provider>
  );
};

export const useMyPlugin = () => {
  const context = useContext(MyPluginContext);
  if (!context) {
    throw new Error('useMyPlugin must be used within MyPluginProvider');
  }
  return context;
};
```

### Using Local Storage

```typescript
// Store data
localStorage.setItem('my-plugin-data', JSON.stringify(data));

// Retrieve data
const data = JSON.parse(localStorage.getItem('my-plugin-data') || '{}');
```

**Reference:** [Store and Access Data](https://docs.strapi.io/cms/plugins-development/guides/store-and-access-data)

---

## Creating Components for Plugins

### Basic Component

```typescript
// admin/src/components/MyComponent.tsx
import { Box, Button } from '@strapi/design-system';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

const MyComponent = ({ title, onAction }: MyComponentProps) => {
  return (
    <Box padding={4}>
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </Box>
  );
};

export default MyComponent;
```

### Using Strapi Design System

```typescript
import {
  Box,
  Button,
  TextInput,
  Typography,
  Modal,
  Table,
} from '@strapi/design-system';

const MyComponent = () => {
  return (
    <Box>
      <Typography variant="alpha">Title</Typography>
      <TextInput placeholder="Enter text" />
      <Button variant="primary">Submit</Button>
    </Box>
  );
};
```

### Form Components

```typescript
import { useForm, Form } from '@strapi/helper-plugin';

const MyForm = () => {
  const { register, handleSubmit, errors } = useForm();

  const onSubmit = (data) => {
    // Handle form submission
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        {...register('name', { required: true })}
        error={errors.name}
      />
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

**Reference:** [Create Components for Plugins](https://docs.strapi.io/cms/plugins-development/guides/create-components-for-plugins)

---

## Complete Plugin Example

### Server Side

```javascript
// server/src/index.js
module.exports = () => {
  return {
    register({ strapi }) {
      // Register plugin
    },
    bootstrap({ strapi }) {
      // Bootstrap logic
    },
    routes: {
      type: 'admin',
      routes: [
        {
          method: 'GET',
          path: '/my-plugin/data',
          handler: 'my-controller.getData',
        },
      ],
    },
    controllers: {
      'my-controller': {
        async getData(ctx) {
          ctx.body = { data: 'Hello from plugin' };
        },
      },
    },
  };
};
```

### Admin Side

```typescript
// admin/src/index.tsx
import { StrapiApp } from '@strapi/strapi/admin';
import MyPluginIcon from './components/PluginIcon';

export default {
  register(app: StrapiApp) {
    app.addMenuLink({
      to: '/plugins/my-plugin',
      icon: MyPluginIcon,
      intlLabel: {
        id: 'my-plugin.name',
        defaultMessage: 'My Plugin',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
    });
  },
};
```

---

## Best Practices

### Development

1. **Use Plugin SDK**: Always use Plugin SDK for new plugins
2. **TypeScript**: Use TypeScript for better type safety
3. **Error Handling**: Implement proper error handling
4. **Testing**: Write tests for plugin functionality
5. **Documentation**: Document plugin APIs and usage

### Structure

1. **Separation**: Keep admin and server code separate
2. **Modularity**: Create reusable components and services
3. **Naming**: Use consistent naming conventions
4. **Organization**: Organize files logically

### Performance

1. **Lazy Loading**: Lazy load admin components
2. **Code Splitting**: Split large plugins into modules
3. **Caching**: Cache frequently accessed data
4. **Optimization**: Optimize bundle size

### Security

1. **Permissions**: Always check permissions
2. **Validation**: Validate all inputs
3. **Sanitization**: Sanitize user data
4. **Authentication**: Verify authentication

---

## Publishing Plugins

### NPM Publishing

```bash
# Build plugin
yarn build && yarn verify

# Publish to NPM
npm publish
```

### Marketplace Submission

1. Build and verify plugin
2. Create marketplace listing
3. Submit for review
4. Follow marketplace guidelines

---

## Troubleshooting

### Common Issues

**"must be used within StrapiApp" error:**
- Remove `@strapi/strapi` from plugin dev dependencies

**Plugin not loading:**
- Check plugin configuration
- Verify entry points exist
- Check console for errors

**Admin components not rendering:**
- Verify component exports
- Check routing configuration
- Ensure proper imports

---

## References

- [Plugin Creation & Setup](https://docs.strapi.io/cms/plugins-development/create-a-plugin)
- [Plugin Structure](https://docs.strapi.io/cms/plugins-development/plugin-structure)
- [Plugin SDK](https://docs.strapi.io/cms/plugins-development/plugin-sdk)
- [Admin Panel API](https://docs.strapi.io/cms/plugins-development/admin-panel-api)
- [Content Manager APIs](https://docs.strapi.io/cms/plugins-development/content-manager-apis)
- [Server API](https://docs.strapi.io/cms/plugins-development/server-api)
- [Plugins Extension](https://docs.strapi.io/cms/plugins-development/plugins-extension)
- [Pass Data from Server to Admin](https://docs.strapi.io/cms/plugins-development/guides/pass-data-from-server-to-admin)
- [Create Admin Permissions for Plugins](https://docs.strapi.io/cms/plugins-development/guides/admin-permissions-for-plugins)
- [Store and Access Data](https://docs.strapi.io/cms/plugins-development/guides/store-and-access-data)
- [Create Components for Plugins](https://docs.strapi.io/cms/plugins-development/guides/create-components-for-plugins)

---

## Notes

### Key Takeaways

- Plugins extend Strapi functionality
- Use Plugin SDK for development
- Separate admin and server code
- Follow Strapi patterns and conventions
- Test thoroughly before publishing

### Important Reminders

- Install yalc globally for development
- Use watch:link for local development
- Build and verify before publishing
- Follow security best practices
- Document your plugin thoroughly

