# Components and Dynamic Zones

## Overview

Components and Dynamic Zones are powerful features in Strapi that allow you to create reusable content structures and flexible layouts. This guide covers how to create, use, and manage components and dynamic zones effectively.

---

## What are Components?

Components are reusable field groups that can be used across multiple Content Types. They allow you to define a set of fields once and reuse them wherever needed, promoting consistency and reducing duplication.

### Types of Components

1. **Single Components**: Used once per Content Type (e.g., SEO metadata)
2. **Repeatable Components**: Can be used multiple times (e.g., FAQ items, testimonials)

### Benefits of Components

- **Reusability**: Define once, use everywhere
- **Consistency**: Same structure across Content Types
- **Maintainability**: Update once, changes everywhere
- **Organization**: Group related fields together

---

## Creating Components

### Method 1: Using Content Type Builder (UI)

#### Step 1: Access Component Builder

1. Navigate to **Content-Type Builder** in admin panel
2. Click **+ Create new component**

#### Step 2: Configure Component

- **Display Name**: Name shown in admin panel (e.g., "SEO Metadata")
- **Category**: Organize components into categories (e.g., "shared", "content")
- **Type**: Choose Single or Repeatable

#### Step 3: Add Fields

Add fields to your component just like Content Types:
- Click **+ Add another field**
- Configure each field
- Save the component

#### Step 4: Use Component

- Go to a Content Type
- Click **+ Add another field**
- Select **Component**
- Choose your component

### Method 2: Manual Creation

Create component files manually:

```
src/components/
└── [category]/
    └── [component-name]/
        └── schema.json
```

**Example Structure:**
```
src/components/
├── shared/
│   ├── seo/
│   │   └── schema.json
│   └── metadata/
│       └── schema.json
└── content/
    ├── hero/
    │   └── schema.json
    └── cta/
        └── schema.json
```

---

## Component Schema

### Single Component Schema

```json
{
  "collectionName": "components_shared_seo",
  "info": {
    "displayName": "SEO",
    "description": "Search engine optimization metadata"
  },
  "options": {},
  "attributes": {
    "metaTitle": {
      "type": "string",
      "maxLength": 60
    },
    "metaDescription": {
      "type": "text",
      "maxLength": 160
    },
    "metaImage": {
      "type": "media",
      "allowedTypes": ["images"]
    },
    "keywords": {
      "type": "text"
    }
  }
}
```

### Repeatable Component Schema

```json
{
  "collectionName": "components_content_faq_item",
  "info": {
    "displayName": "FAQ Item",
    "description": "Frequently asked question item"
  },
  "options": {},
  "attributes": {
    "question": {
      "type": "string",
      "required": true
    },
    "answer": {
      "type": "richtext",
      "required": true
    }
  }
}
```

---

## Common Component Examples

### SEO Component

**Use Case**: Add SEO metadata to any Content Type

**Fields:**
- metaTitle (Text)
- metaDescription (Textarea)
- metaImage (Media)
- keywords (Text)

**Usage:**
- Articles
- Pages
- Products
- Any content needing SEO

### Address Component

**Use Case**: Store address information

**Fields:**
- street (Text)
- city (Text)
- state (Text)
- zipCode (Text)
- country (Text)

**Usage:**
- User profiles
- Business listings
- Event locations
- Contact information

### Social Links Component

**Use Case**: Store social media links

**Fields:**
- facebook (Text)
- twitter (Text)
- instagram (Text)
- linkedin (Text)
- website (Text)

**Usage:**
- User profiles
- Business profiles
- Author information

### Hero Section Component

**Use Case**: Hero/banner sections

**Fields:**
- title (Text)
- subtitle (Text)
- image (Media)
- ctaText (Text)
- ctaLink (Text)

**Usage:**
- Homepage
- Landing pages
- Page headers

### FAQ Item Component (Repeatable)

**Use Case**: Frequently asked questions

**Fields:**
- question (Text)
- answer (Rich Text)

**Usage:**
- Product pages
- Service pages
- Help pages

### Testimonial Component (Repeatable)

**Use Case**: Customer testimonials

**Fields:**
- name (Text)
- role (Text)
- company (Text)
- content (Rich Text)
- avatar (Media)
- rating (Integer)

**Usage:**
- Homepage
- Product pages
- About pages

---

## Using Components in Content Types

### Adding Single Component

1. Go to Content Type Builder
2. Select your Content Type
3. Click **+ Add another field**
4. Select **Component**
5. Choose **Single component**
6. Select your component
7. Save

**Result in Schema:**
```json
{
  "seo": {
    "type": "component",
    "repeatable": false,
    "component": "shared.seo"
  }
}
```

### Adding Repeatable Component

1. Go to Content Type Builder
2. Select your Content Type
3. Click **+ Add another field**
4. Select **Component**
5. Choose **Repeatable component**
6. Select your component
7. Save

**Result in Schema:**
```json
{
  "faqItems": {
    "type": "component",
    "repeatable": true,
    "component": "content.faq-item"
  }
}
```

---

## Component Categories

Organize components into categories for better management:

### Shared Components
Components used across multiple Content Types:
- SEO
- Metadata
- Address
- Social Links

### Content Components
Components for content sections:
- Hero
- CTA
- Text Block
- Image Gallery

### Form Components
Components for form fields:
- Form Field
- Form Section
- Validation Rules

### Layout Components
Components for page structure:
- Section
- Column
- Grid
- Container

---

## Dynamic Zones

### What are Dynamic Zones?

Dynamic Zones are flexible content areas that allow content editors to mix and match different components. They provide ultimate flexibility for building pages and content layouts.

### Benefits of Dynamic Zones

- **Flexibility**: Mix different components in any order
- **Editor Control**: Content editors choose what to add
- **Reusability**: Use same components across zones
- **Page Builder Feel**: Similar to page builder functionality

### When to Use Dynamic Zones

- **Page Content**: Flexible page layouts
- **Landing Pages**: Custom landing page sections
- **Article Content**: Mix text, images, videos
- **Product Descriptions**: Flexible product content
- **Any Flexible Content**: Where structure varies

---

## Creating Dynamic Zones

### Step 1: Create Components

First, create the components you want to use in your dynamic zone:
- Text Block
- Image
- Video
- CTA
- Gallery
- etc.

### Step 2: Add Dynamic Zone to Content Type

1. Go to Content Type Builder
2. Select your Content Type
3. Click **+ Add another field**
4. Select **Dynamic Zone**
5. Name your zone (e.g., "content", "sections")
6. Select components to include
7. Save

### Step 3: Configure Components

- **Min Components**: Minimum number of components required
- **Max Components**: Maximum number of components allowed
- **Allowed Components**: Which components can be used

---

## Dynamic Zone Schema

```json
{
  "content": {
    "type": "dynamiczone",
    "components": [
      "content.text-block",
      "content.image",
      "content.video",
      "content.cta",
      "content.gallery"
    ]
  }
}
```

---

## Dynamic Zone Examples

### Page Content Zone

**Components:**
- Text Block
- Image
- Image Gallery
- Video
- CTA Button
- Quote
- Code Block

**Use Case**: Flexible page content

### Landing Page Sections

**Components:**
- Hero Section
- Features Grid
- Testimonials
- Pricing Table
- FAQ Section
- Contact Form

**Use Case**: Custom landing pages

### Article Content

**Components:**
- Paragraph
- Heading
- Image
- Quote
- Code Block
- Video Embed

**Use Case**: Rich article content

---

## Working with Components and Dynamic Zones

### In the Admin Panel

1. **Adding Components**: Click **+ Add component** in component field
2. **Reordering**: Drag and drop to reorder
3. **Removing**: Click delete icon
4. **Editing**: Click component to edit fields

### In Dynamic Zones

1. **Adding Components**: Click **+ Add component to [zone name]**
2. **Select Component**: Choose from available components
3. **Fill Fields**: Complete component fields
4. **Reorder**: Drag to reorder components
5. **Remove**: Click delete icon

---

## API Usage

### Creating Entry with Component

```javascript
// POST /api/articles
{
  "data": {
    "title": "My Article",
    "seo": {
      "metaTitle": "Article Title",
      "metaDescription": "Article description",
      "metaImage": 1
    }
  }
}
```

### Creating Entry with Repeatable Component

```javascript
// POST /api/products
{
  "data": {
    "name": "Product Name",
    "faqItems": [
      {
        "question": "Question 1?",
        "answer": "Answer 1"
      },
      {
        "question": "Question 2?",
        "answer": "Answer 2"
      }
    ]
  }
}
```

### Creating Entry with Dynamic Zone

```javascript
// POST /api/pages
{
  "data": {
    "title": "My Page",
    "content": [
      {
        "__component": "content.text-block",
        "title": "Section Title",
        "text": "Section content"
      },
      {
        "__component": "content.image",
        "image": 1,
        "caption": "Image caption"
      },
      {
        "__component": "content.cta",
        "text": "Click here",
        "link": "/contact"
      }
    ]
  }
}
```

### Querying with Components

```javascript
// GET /api/articles?populate=seo
// GET /api/products?populate=faqItems
// GET /api/pages?populate=content
```

---

## Best Practices

### Component Design

1. **Single Responsibility**: Each component should have one purpose
2. **Reusability**: Design components to be reusable
3. **Consistency**: Use consistent field names and types
4. **Documentation**: Document component purpose and usage

### Organization

1. **Categories**: Organize components into logical categories
2. **Naming**: Use clear, descriptive names
3. **Grouping**: Group related components together
4. **Structure**: Maintain consistent structure

### Performance

1. **Limit Components**: Don't create too many components
2. **Optimize Queries**: Use populate selectively
3. **Cache**: Consider caching for frequently used components

### Dynamic Zones

1. **Limit Components**: Don't include too many component types
2. **Clear Purpose**: Each zone should have a clear purpose
3. **Documentation**: Document which components to use
4. **Validation**: Consider min/max component limits

---

## Component vs Dynamic Zone

### Use Components When:
- Structure is fixed
- Same fields needed in multiple places
- Consistency is important
- Reusability is key

### Use Dynamic Zones When:
- Structure is flexible
- Content varies per entry
- Editor control is needed
- Page builder functionality required

---

## Common Patterns

### Pattern 1: SEO Everywhere

Create SEO component, add to all Content Types:
- Articles
- Pages
- Products
- Categories

### Pattern 2: Flexible Content

Create dynamic zone with content components:
- Text blocks
- Images
- Videos
- CTAs

### Pattern 3: Reusable Sections

Create repeatable components for sections:
- FAQ items
- Testimonials
- Features
- Team members

### Pattern 4: Nested Components

Components can contain other components:
- Hero section with CTA component
- Card with image and text components
- Section with multiple nested components

---

## Troubleshooting

### Common Issues

**Issue**: Component not appearing in Content Type
- **Solution**: Verify component is saved
- **Solution**: Check component category and name

**Issue**: Dynamic Zone not showing components
- **Solution**: Verify components are added to zone
- **Solution**: Check component configuration

**Issue**: Component data not saving
- **Solution**: Verify all required fields are filled
- **Solution**: Check field validation rules

**Issue**: API not returning component data
- **Solution**: Use populate parameter
- **Solution**: Check component field is not private

---

## Migration and Updates

### Updating Components

1. Go to Content Type Builder
2. Select component
3. Make changes
4. Save

**Note**: Changes affect all Content Types using the component

### Removing Components

1. Remove component from all Content Types
2. Delete component from Content Type Builder

**Warning**: This will delete component data from all entries

---

## Advanced Usage

### Component Relationships

Components can have relationships:
```json
{
  "author": {
    "type": "component",
    "component": "shared.author",
    "attributes": {
      "name": "string",
      "bio": "text",
      "user": {
        "type": "relation",
        "relation": "oneToOne",
        "target": "plugin::users-permissions.user"
      }
    }
  }
}
```

### Conditional Components

Use lifecycle hooks to conditionally show/hide components based on other fields.

### Component Validation

Add custom validation to component fields using lifecycle hooks.

---

## References

- [Strapi Components Documentation](https://docs.strapi.io/dev-docs/backend-customization/models#components)
- [Strapi Dynamic Zones Guide](https://docs.strapi.io/user-docs/content-type-builder/components-and-dynamic-zones)

---

## Notes

### Key Takeaways

- Components promote reusability and consistency
- Dynamic Zones provide flexibility for content editors
- Organize components into logical categories
- Use components for fixed structures
- Use dynamic zones for flexible content
- Document component purpose and usage

### Important Reminders

- Single Components = Used once
- Repeatable Components = Used multiple times
- Dynamic Zones = Mix and match components
- Components are reusable across Content Types
- Changes to components affect all usages

