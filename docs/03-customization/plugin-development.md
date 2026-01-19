# Plugin Development Guide (Enhanced)

## Overview

This guide covers developing custom plugins for Strapi 5 using TypeScript. We'll use a real-world example - a **Stripe Demo plugin** - to walk through each step. You'll learn how to create plugins that extend Strapi's functionality, add custom features, and integrate with the admin panel.

**What You'll Learn:**

- Plugin architecture and structure
- Creating server-side functionality (controllers, services, routes)
- Building admin panel UI components
- Managing plugin configuration
- Implementing policies and permissions
- Real-world plugin example: Stripe integration

---

## Understanding Plugin Architecture

### What is a Plugin?

A plugin is a self-contained module that extends Strapi's functionality. Think of it as a mini-application within Strapi that can add new features without modifying core code.

**Plugin Components:**

1. **Server** (`server/`): Backend logic - controllers, services, routes, policies
2. **Admin** (`admin/`): Frontend UI - React components, pages, menu items

### Plugin Types

- **Server-only**: Backend functionality without admin UI (e.g., API integrations)
- **Admin-only**: UI components without backend logic (e.g., custom dashboards)
- **Full-stack**: Complete plugins with both server and admin (most common)

**Our Example:** The Stripe Demo plugin is a full-stack plugin that:

- Stores Stripe API keys (server)
- Provides admin UI to configure keys (admin)
- Creates payment intents via API (server)

---

## Plugin Structure

### Directory Structure

When you create a plugin (using Plugin SDK or manually), it follows this structure:

```
stripe-demo/
├── admin/                    # Admin panel code
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Initializer.tsx
│   │   │   └── PluginIcon.tsx
│   │   ├── pages/            # Admin pages
│   │   │   ├── App.tsx      # Main app router
│   │   │   └── HomePage.tsx # Configuration page
│   │   ├── utils/           # Utility functions
│   │   ├── translations/    # i18n translations
│   │   ├── index.ts         # Admin entry point
│   │   └── pluginId.ts      # Plugin identifier
│   └── tsconfig.json
│
├── server/                   # Server-side code
│   ├── src/
│   │   ├── config/          # Plugin configuration
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API routes
│   │   │   ├── admin/        # Admin routes
│   │   │   └── content-api/  # Public API routes
│   │   ├── policies/         # Authorization policies
│   │   ├── middlewares/       # Request middleware
│   │   ├── content-types/     # Plugin content types
│   │   ├── bootstrap.ts      # Initialization logic
│   │   ├── destroy.ts        # Cleanup logic
│   │   ├── register.ts       # Registration logic
│   │   └── index.ts          # Server entry point
│   └── tsconfig.json
│
├── package.json              # Plugin metadata and dependencies
└── README.md
```

### Key Files Explained

**Server Entry Point** (`server/src/index.ts`):

- Exports all plugin components (controllers, services, routes, etc.)
- Strapi loads this file to discover plugin functionality

**Admin Entry Point** (`admin/src/index.ts`):

- Registers plugin with admin panel
- Adds menu links and pages
- Registers translations

**Register Function** (`server/src/register.ts`):

- Called when plugin is loaded
- Use for plugin registration logic

**Bootstrap Function** (`server/src/bootstrap.ts`):

- Called after all plugins are registered
- Use for initialization that depends on other plugins

---

## Creating a Plugin

### Method 1: Using Plugin SDK (Recommended)

The Plugin SDK is the official way to create Strapi 5 plugins.

#### Step 1: Initialize Plugin

```bash
# Using Yarn
yarn dlx @strapi/sdk-plugin init stripe-demo

# Using npm
npx @strapi/sdk-plugin init stripe-demo
```

The command prompts you for:

- Plugin name: `stripe-demo`
- Description: Brief description
- Author: Your name/email
- TypeScript or JavaScript: Choose TypeScript
- Admin components: Yes (for UI)
- Server components: Yes (for backend)

#### Step 2: Local Development Setup

For local plugins (in your Strapi project), configure in `config/plugins.ts`:

```typescript
// config/plugins.ts
export default {
  "stripe-demo": {
    enabled: true,
    resolve: "./src/plugins/stripe-demo",
  },
};
```

**Note:** Local plugins don't need yalc or npm linking. They're directly accessible from your project.

#### Step 3: Development Commands

```bash
# Watch for changes and rebuild
yarn watch

# Build plugin
yarn build

# Verify plugin structure
yarn verify
```

---

## Server-Side Development

Let's examine the Stripe Demo plugin's server implementation to understand each component.

### Server Entry Point

**File:** `server/src/index.ts`

```typescript
import bootstrap from "./bootstrap";
import destroy from "./destroy";
import register from "./register";
import config from "./config";
import contentTypes from "./content-types";
import controllers from "./controllers";
import middlewares from "./middlewares";
import policies from "./policies";
import routes from "./routes";
import services from "./services";

export default {
  register, // Registration logic
  bootstrap, // Initialization logic
  destroy, // Cleanup logic
  config, // Plugin configuration
  controllers, // Request handlers
  routes, // API endpoints
  services, // Business logic
  contentTypes, // Content types (if any)
  policies, // Authorization policies
  middlewares, // Request middleware
};
```

**Learning Point:** This file exports all plugin components. Strapi reads this to understand what your plugin provides.

### Register Function

**File:** `server/src/register.ts`

```typescript
import type { Core } from "@strapi/strapi";

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // Called when plugin is loaded
  // Use for registration logic that doesn't depend on other plugins
};

export default register;
```

**When to Use:**

- Register custom services
- Set up initial configuration
- Register hooks or events

**Example:** In our Stripe plugin, we don't need registration logic, so it's empty. But you might register custom validators or extend other plugins here.

### Bootstrap Function

**File:** `server/src/bootstrap.ts`

```typescript
import type { Core } from "@strapi/strapi";

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  // Called after all plugins are registered
  // Use for initialization that depends on other plugins being loaded
};

export default bootstrap;
```

**When to Use:**

- Initialize connections (database, external APIs)
- Set up scheduled tasks
- Register event listeners

**Example:** You might initialize Stripe SDK here, but in our plugin, we initialize it on-demand in the service.

### Controllers

Controllers handle HTTP requests and send responses.

**File:** `server/src/controllers/controller.ts`

```typescript
import type { Core } from "@strapi/strapi";

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get Stripe configuration
   * GET /stripe-demo/config
   */
  async getConfig(ctx: any) {
    try {
      // Access plugin service
      const stripeKey = await strapi
        .plugin("stripe-demo")
        .service("service")
        .getStripeKey();

      ctx.body = {
        stripeKey: stripeKey || null,
      };
    } catch (error: any) {
      ctx.throw(500, error);
    }
  },

  /**
   * Save Stripe configuration
   * PUT /stripe-demo/config
   */
  async saveConfig(ctx: any) {
    try {
      const { stripeKey } = ctx.request.body;

      // Validate input
      if (!stripeKey || typeof stripeKey !== "string") {
        return ctx.badRequest("Stripe key is required and must be a string");
      }

      // Save using service
      await strapi
        .plugin("stripe-demo")
        .service("service")
        .saveStripeKey(stripeKey);

      ctx.body = {
        message: "Stripe key saved successfully",
      };
    } catch (error: any) {
      ctx.throw(500, error);
    }
  },

  /**
   * Create payment intent
   * POST /api/stripe-demo/pay
   */
  async createPaymentIntent(ctx: any) {
    try {
      const { amount } = ctx.request.body;

      // Validate amount
      if (!amount || isNaN(amount) || amount <= 0) {
        return ctx.badRequest(
          "Amount is required and must be a positive number"
        );
      }

      // Create payment intent
      const paymentIntent = await strapi
        .plugin("stripe-demo")
        .service("service")
        .createPaymentIntent(parseFloat(amount));

      ctx.body = {
        paymentIntent,
      };
    } catch (error: any) {
      strapi.log.error("Error creating payment intent:", error);
      ctx.status = 400;
      ctx.body = {
        error: {
          message: error.message || "Failed to create payment intent",
        },
      };
    }
  },
});

export default controller;
```

**Learning Points:**

- Controllers receive `ctx` (Koa context) with request/response
- Access plugin services via `strapi.plugin('plugin-name').service('service-name')`
- Always validate inputs before processing
- Return appropriate HTTP status codes
- Handle errors gracefully

### Services

Services contain reusable business logic.

**File:** `server/src/services/service.ts`

```typescript
import type { Core } from "@strapi/strapi";
const Stripe = require("stripe");

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get Stripe API key from plugin store
   */
  async getStripeKey(): Promise<string | null> {
    // Access plugin store (persistent storage)
    const store = strapi.store({ type: "plugin", name: "stripe-demo" });

    // Get configuration from store
    const config = (await store.get({ key: "config" })) as {
      stripeKey?: string;
    } | null;

    return config?.stripeKey || null;
  },

  /**
   * Save Stripe API key to plugin store
   */
  async saveStripeKey(stripeKey: string): Promise<void> {
    const store = strapi.store({ type: "plugin", name: "stripe-demo" });

    // Save to store (persists across restarts)
    await store.set({ key: "config", value: { stripeKey } });
  },

  /**
   * Create Stripe payment intent
   */
  async createPaymentIntent(amount: number) {
    try {
      // Get Stripe key from store
      const store = strapi.store({ type: "plugin", name: "stripe-demo" });
      const config = (await store.get({ key: "config" })) as {
        stripeKey?: string;
      } | null;
      const stripeKey = config?.stripeKey || null;

      // Validate key exists
      if (!stripeKey) {
        throw new Error(
          "Stripe API key is not configured. Please configure it in the admin panel."
        );
      }

      // Initialize Stripe SDK
      const stripe = Stripe(stripeKey);

      // Create payment intent (amount in cents)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert dollars to cents
        currency: "usd",
      });

      return paymentIntent;
    } catch (error: any) {
      // Handle Stripe-specific errors
      if (error.type === "StripeAuthenticationError") {
        throw new Error(
          "Invalid Stripe API key. Please check your API key configuration."
        );
      }

      throw new Error(
        error.message || "Failed to create payment intent with Stripe."
      );
    }
  },
});

export default service;
```

**Learning Points:**

- Services encapsulate business logic
- Use `strapi.store()` for persistent configuration storage
- Plugin store persists data across server restarts
- Handle external API errors appropriately
- Services are reusable across controllers

**Plugin Store:**

- Stores data in database (not files)
- Scoped to plugin: `strapi.store({ type: 'plugin', name: 'plugin-name' })`
- Use `get()` and `set()` methods
- Perfect for plugin configuration

### Routes

Routes define API endpoints for your plugin.

**Admin Routes** (`server/src/routes/admin/index.ts`):

```typescript
export default () => ({
  type: "admin", // Admin panel routes
  routes: [
    {
      method: "GET",
      path: "/config", // Full path: /stripe-demo/config
      handler: "controller.getConfig",
      config: {
        policies: ["plugin::stripe-demo.is-super-admin"],
      },
    },
    {
      method: "PUT",
      path: "/config",
      handler: "controller.saveConfig",
      config: {
        policies: ["plugin::stripe-demo.is-super-admin"],
      },
    },
  ],
});
```

**Content API Routes** (`server/src/routes/content-api/index.ts`):

```typescript
export default () => ({
  type: "content-api", // Public API routes
  routes: [
    {
      method: "GET",
      path: "/", // Full path: /api/stripe-demo/
      handler: "controller.index",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/pay", // Full path: /api/stripe-demo/pay
      handler: "controller.createPaymentIntent",
      config: {
        policies: [],
      },
    },
  ],
});
```

**Route Index** (`server/src/routes/index.ts`):

```typescript
import contentAPIRoutes from "./content-api";
import adminAPIRoutes from "./admin";

const routes = {
  "content-api": contentAPIRoutes,
  admin: adminAPIRoutes,
};

export default routes;
```

**Learning Points:**

- **Admin routes**: Accessible from admin panel (`/stripe-demo/*`)
- **Content API routes**: Public API endpoints (`/api/stripe-demo/*`)
- Handler format: `'controller.methodName'` (references controller file)
- Policies control access (we'll cover this next)

### Policies

Policies are authorization functions that control access to routes.

**File:** `server/src/policies/is-super-admin.ts`

```typescript
import type { Core } from "@strapi/strapi";

/**
 * Policy to check if user is super admin
 * Only super admins can access Stripe configuration
 */
const isSuperAdmin = async (
  policyContext: any,
  config: any,
  { strapi }: { strapi: Core.Strapi }
): Promise<boolean> => {
  const { user } = policyContext.state;

  // No user = no access
  if (!user || !user.id) {
    return false;
  }

  try {
    // Fetch full user with roles
    const adminUser = await strapi.entityService.findOne(
      "admin::user",
      user.id,
      {
        populate: ["roles"],
      }
    );

    if (!adminUser) {
      return false;
    }

    // Check if user is super admin (Strapi 5)
    if (adminUser.isSuperAdmin === true) {
      return true;
    }

    // Check for super admin role
    if (adminUser.roles && Array.isArray(adminUser.roles)) {
      return adminUser.roles.some(
        (role: any) => role.code === "strapi-super-admin"
      );
    }

    return false;
  } catch (error) {
    strapi.log.error("Error checking super admin status:", error);
    return false; // Deny on error (secure by default)
  }
};

export default isSuperAdmin;
```

**Policy Index** (`server/src/policies/index.ts`):

```typescript
import isSuperAdmin from "./is-super-admin";

export default {
  "is-super-admin": isSuperAdmin,
};
```

**Learning Points:**

- Policies return `true` (allow) or `false` (deny)
- Access user via `policyContext.state.user`
- Use `strapi.entityService` to query data
- Always handle errors (default to deny for security)
- Reference policies in routes: `'plugin::plugin-name.policy-name'`

### Plugin Configuration

**File:** `server/src/config/index.ts`

```typescript
export default {
  default: {}, // Default configuration
  validator() {}, // Configuration validator
};
```

**Learning Point:** Use this to define default plugin settings and validate configuration. In our Stripe plugin, we use the plugin store instead, but you can use this for simpler configs.

---

## Admin Panel Development

Now let's examine the admin panel implementation.

### Admin Entry Point

**File:** `admin/src/index.ts`

```typescript
import { getTranslation } from "./utils/getTranslation";
import { PLUGIN_ID } from "./pluginId";
import { Initializer } from "./components/Initializer";
import { PluginIcon } from "./components/PluginIcon";

export default {
  register(app: any) {
    // Add menu link to admin sidebar
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`, // Route path
      icon: PluginIcon, // Icon component
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: PLUGIN_ID,
      },
      Component: async () => {
        // Lazy load the main app component
        const { App } = await import("./pages/App");
        return App;
      },
      permissions: [], // Optional permissions
    });

    // Register plugin
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  // Register translations for i18n
  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(
            `./translations/${locale}.json`
          );
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
```

**Learning Points:**

- `register()` is called when admin panel loads
- `addMenuLink()` adds entry to admin sidebar
- Use lazy loading for better performance
- `registerTrads()` loads translations for internationalization

### Plugin Identifier

**File:** `admin/src/pluginId.ts`

```typescript
export const PLUGIN_ID = "stripe-demo";
```

**Learning Point:** Centralize plugin ID to avoid typos and make refactoring easier.

### Initializer Component

**File:** `admin/src/components/Initializer.tsx`

```typescript
import { useEffect, useRef } from "react";
import { PLUGIN_ID } from "../pluginId";

type InitializerProps = {
  setPlugin: (id: string) => void;
};

const Initializer = ({ setPlugin }: InitializerProps) => {
  const ref = useRef(setPlugin);

  useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);

  return null;
};

export { Initializer };
```

**Learning Point:** This component tells Strapi the plugin is ready. It's required but usually stays simple.

### Main App Router

**File:** `admin/src/pages/App.tsx`

```typescript
import { Page } from "@strapi/strapi/admin";
import { Routes, Route } from "react-router-dom";
import { HomePage } from "./HomePage";

const App = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="*" element={<Page.Error />} />
    </Routes>
  );
};

export { App };
```

**Learning Point:** Use React Router to handle navigation within your plugin. The index route shows the main page.

### Configuration Page

**File:** `admin/src/pages/HomePage.tsx`

This is a complete React component that:

1. Fetches current Stripe configuration
2. Displays a form to update it
3. Validates input
4. Saves configuration
5. Shows success/error notifications

```typescript
import { useState, useEffect } from "react";
import {
  Main,
  Box,
  Button,
  TextInput,
  Typography,
  Grid,
  Flex,
  Alert,
} from "@strapi/design-system";
import { useIntl } from "react-intl";
import { useFetchClient, useNotification } from "@strapi/strapi/admin";
import { getTranslation } from "../utils/getTranslation";
import { PLUGIN_ID } from "../pluginId";

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { get, put } = useFetchClient(); // HTTP client
  const { toggleNotification } = useNotification(); // Toast notifications

  // State management
  const [stripeKey, setStripeKey] = useState<string>("");
  const [initialKey, setInitialKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const { data } = await get(`/${PLUGIN_ID}/config`);
        if (data.stripeKey) {
          setStripeKey(data.stripeKey);
          setInitialKey(data.stripeKey);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.error?.message || "Failed to load configuration"
        );
        toggleNotification({
          type: "warning",
          message: "Failed to load configuration",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [get, toggleNotification]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!stripeKey || stripeKey.trim() === "") {
      setError("Stripe key is required");
      return;
    }

    if (
      !stripeKey.startsWith("sk_test_") &&
      !stripeKey.startsWith("sk_live_")
    ) {
      setError("Stripe key should start with sk_test_ or sk_live_");
      return;
    }

    try {
      setIsSaving(true);
      await put(`/${PLUGIN_ID}/config`, {
        stripeKey: stripeKey.trim(),
      });
      setInitialKey(stripeKey.trim());
      toggleNotification({
        type: "success",
        message: "Stripe key saved successfully",
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message || "Failed to save configuration"
      );
      toggleNotification({
        type: "warning",
        message: "Failed to save configuration",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = stripeKey !== (initialKey || "");

  return (
    <Main>
      <Box padding={8}>
        <Box paddingBottom={6}>
          <Typography variant="alpha" as="h1">
            Stripe Configuration
          </Typography>
          <Typography variant="omega" textColor="neutral600" as="p">
            Configure your Stripe API key. Only super administrators can access
            this page.
          </Typography>
        </Box>

        {error && (
          <Box paddingBottom={4}>
            <Alert
              closeLabel="Close"
              title="Error"
              variant="danger"
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Box>
        )}

        <Box background="neutral0" hasRadius padding={8} shadow="tableShadow">
          <form onSubmit={handleSubmit}>
            <Grid.Root gap={4}>
              <Grid.Item xs={12} col={12}>
                <TextInput
                  label="Stripe API Key"
                  name="stripeKey"
                  value={stripeKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setStripeKey(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your Stripe API key (e.g., sk_test_...)"
                  disabled={isLoading || isSaving}
                  error={error || undefined}
                  type="text"
                  required
                />
              </Grid.Item>

              {initialKey && !isLoading && (
                <Grid.Item xs={12} col={12}>
                  <Box background="neutral100" hasRadius padding={4}>
                    <Typography variant="pi" fontWeight="semiBold" as="p">
                      Current Configuration:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600" as="p">
                      {initialKey.substring(0, 12)}...
                      {initialKey.substring(initialKey.length - 4)}
                    </Typography>
                  </Box>
                </Grid.Item>
              )}

              <Grid.Item xs={12} col={12}>
                <Flex justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="default"
                    loading={isSaving}
                    disabled={isLoading || isSaving || !hasUnsavedChanges}
                  >
                    Save Configuration
                  </Button>
                </Flex>
              </Grid.Item>
            </Grid.Root>
          </form>
        </Box>
      </Box>
    </Main>
  );
};

export { HomePage };
```

**Learning Points:**

- Use Strapi Design System components (`@strapi/design-system`)
- `useFetchClient()` provides HTTP client (`get`, `post`, `put`, `delete`)
- `useNotification()` shows toast notifications
- `useIntl()` handles internationalization
- Handle loading and error states
- Validate inputs before submission

**Strapi Design System Components:**

- `Main`: Main content wrapper
- `Box`: Container with padding/spacing
- `Button`: Styled buttons
- `TextInput`: Form inputs
- `Typography`: Text styling
- `Grid`: Layout system
- `Alert`: Error/success messages

---

## Plugin Configuration

### Local Plugin Setup

For plugins in your project (`src/plugins/`), configure in `config/plugins.ts`:

```typescript
// config/plugins.ts
export default {
  "stripe-demo": {
    enabled: true,
    resolve: "./src/plugins/stripe-demo",
  },
};
```

**Learning Point:** Local plugins are directly accessible. No npm linking needed.

### External Plugin Setup

For plugins from npm or separate directories:

1. **Install via npm:**

```bash
npm install my-strapi-plugin
```

2. **Or use yalc for development:**

```bash
# In plugin directory
yalc publish

# In Strapi project
yalc add my-strapi-plugin
```

---

## Complete Plugin Flow

Let's trace through a complete user interaction:

### Scenario: User Configures Stripe Key

1. **User opens admin panel** → Clicks "Stripe Demo" in sidebar
2. **Admin entry point** (`admin/src/index.ts`) → Routes to `App.tsx`
3. **App router** (`admin/src/pages/App.tsx`) → Shows `HomePage`
4. **HomePage loads** → Calls `GET /stripe-demo/config`
5. **Admin route** (`server/src/routes/admin/index.ts`) → Routes to controller
6. **Policy check** → Verifies user is super admin
7. **Controller** (`server/src/controllers/controller.ts`) → Calls service
8. **Service** (`server/src/services/service.ts`) → Reads from plugin store
9. **Response** → Returns Stripe key (or null)
10. **HomePage** → Displays form with current key
11. **User saves** → Calls `PUT /stripe-demo/config`
12. **Service** → Saves to plugin store
13. **Success** → Shows notification

### Scenario: Create Payment Intent

1. **Frontend calls** → `POST /api/stripe-demo/pay` with amount
2. **Content API route** → Routes to `createPaymentIntent` controller
3. **Controller** → Validates amount, calls service
4. **Service** → Gets Stripe key from store, initializes Stripe SDK
5. **Stripe API** → Creates payment intent
6. **Response** → Returns payment intent to frontend

---

## Best Practices

### Server-Side

1. **Separate Concerns**: Controllers handle HTTP, services handle business logic
2. **Validate Inputs**: Always validate in controllers before calling services
3. **Error Handling**: Use try-catch and return appropriate HTTP status codes
4. **Plugin Store**: Use for persistent configuration (not files)
5. **Policies**: Protect sensitive routes with policies

### Admin-Side

1. **Design System**: Use Strapi Design System components for consistency
2. **Loading States**: Show loading indicators during async operations
3. **Error Handling**: Display user-friendly error messages
4. **Validation**: Validate inputs before submission
5. **Notifications**: Use toast notifications for feedback

### General

1. **TypeScript**: Use TypeScript for type safety
2. **Naming**: Use consistent naming conventions
3. **Documentation**: Comment complex logic
4. **Testing**: Test plugin functionality
5. **Security**: Always validate and sanitize inputs

---

## Common Patterns

### Accessing Plugin Services

```typescript
// From controller or service
const service = strapi.plugin("plugin-name").service("service-name");
const result = await service.methodName();
```

### Using Plugin Store

```typescript
// Get store
const store = strapi.store({ type: "plugin", name: "plugin-name" });

// Save data
await store.set({ key: "config", value: { key: "value" } });

// Get data
const config = await store.get({ key: "config" });
```

### Making HTTP Requests from Admin

```typescript
import { useFetchClient } from "@strapi/strapi/admin";

const { get, post, put, delete: del } = useFetchClient();

// GET request
const { data } = await get("/plugin-name/endpoint");

// POST request
await post("/plugin-name/endpoint", { data: "value" });
```

### Showing Notifications

```typescript
import { useNotification } from "@strapi/strapi/admin";

const { toggleNotification } = useNotification();

toggleNotification({
  type: "success", // 'success' | 'warning' | 'error'
  message: "Operation completed",
});
```

---

## Troubleshooting

### Plugin Not Loading

- Check `config/plugins.ts` has correct path
- Verify `server/src/index.ts` exports all components
- Check console for errors
- Ensure TypeScript compiles without errors

### Routes Not Working

- Verify route paths are correct
- Check handler references controller method
- Ensure policies allow access
- Check route type (`admin` vs `content-api`)

### Admin UI Not Showing

- Verify `admin/src/index.ts` registers menu link
- Check component exports are correct
- Ensure routes are set up in `App.tsx`
- Check browser console for errors

### Service Not Found

- Verify service is exported in `server/src/services/index.ts`
- Check service name matches reference
- Ensure service function returns object with methods

---

## Summary

### What We Learned

1. **Plugin Structure**: Server and admin components
2. **Server Components**: Controllers, services, routes, policies
3. **Admin Components**: Pages, components, menu links
4. **Plugin Store**: Persistent configuration storage
5. **Real-World Example**: Stripe integration plugin

### Key Takeaways

- Plugins extend Strapi without modifying core code
- Server handles backend logic, admin handles UI
- Use plugin store for configuration
- Policies control access to routes
- Design System provides consistent UI components

### Next Steps

- Create your own plugin
- Add custom content types
- Integrate with external APIs
- Build custom admin pages
- Publish to npm (optional)

---

## References

- [Strapi Plugin Development](https://docs.strapi.io/cms/plugins-development)
- [Plugin SDK](https://docs.strapi.io/cms/plugins-development/plugin-sdk)
- [Server API](https://docs.strapi.io/cms/plugins-development/server-api)
- [Admin Panel API](https://docs.strapi.io/cms/plugins-development/admin-panel-api)
- [Strapi Design System](https://design-system.strapi.io/)
