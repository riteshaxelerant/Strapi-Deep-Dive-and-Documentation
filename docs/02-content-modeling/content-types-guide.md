# Content Types Guide

## Overview

Content Types are the foundation of data modeling in Strapi. They define the structure and schema of your content, similar to database tables. This guide covers everything you need to know about creating, configuring, and managing Content Types in Strapi.

## What are Content Types?

Content Types define the structure of your content entries. Each Content Type represents a specific type of content with its own set of fields and properties.

### Types of Content Types

Strapi supports two main types:

1. **Collection Types**: For content that has multiple entries (e.g., Articles, Products, Users)
2. **Single Types**: For content that has only one entry (e.g., Homepage, Site Settings, About Page)

---

## Creating Content Types

### Method 1: Using Content Type Builder (UI)

The Content Type Builder is the visual interface for creating Content Types.

#### Step 1: Access Content Type Builder

1. Navigate to **Content-Type Builder** in the admin panel sidebar
2. Click **+ Create new collection type** or **+ Create new single type**

#### Step 2: Configure Basic Settings

- **Display Name**: The name shown in the admin panel (e.g., "Article")
- **API ID (singular)**: Used in API endpoints (e.g., "article")
- **API ID (plural)**: Plural form for API endpoints (e.g., "articles")

#### Step 3: Add Fields

Click **+ Add another field** to add fields to your Content Type.

#### Step 4: Save

Click **Save** to create the Content Type.

### Method 2: Manual Creation (Advanced)

You can manually create Content Types by creating files in your project:

```
src/api/[content-type-name]/
└── content-types/
    └── [content-type-name]/
        ├── schema.json
        └── lifecycles.js
```

---

## Field Types

Strapi provides a comprehensive set of field types for different data needs.

### Text Fields

#### Text
Single-line text input.

**Configuration Options:**
- **Name**: Field name
- **Type**: Text
- **Required**: Make field mandatory
- **Unique**: Ensure unique values
- **Default Value**: Set default text
- **Max Length**: Maximum character limit
- **Min Length**: Minimum character limit
- **Regex Pattern**: Custom validation pattern

**Use Cases:**
- Titles, names, short descriptions
- Email addresses (with validation)
- URLs, slugs

**Example:**
```json
{
  "title": {
    "type": "string",
    "required": true,
    "maxLength": 200
  }
}
```

#### Textarea
Multi-line text input.

**Configuration Options:**
- **Name**: Field name
- **Type**: Textarea
- **Required**: Make field mandatory
- **Default Value**: Set default text
- **Max Length**: Maximum character limit

**Use Cases:**
- Long descriptions
- Content summaries
- Notes and comments

#### Rich Text (WYSIWYG)
Rich text editor with formatting options.

**Configuration Options:**
- **Name**: Field name
- **Type**: Rich text
- **Required**: Make field mandatory
- **Default Value**: Set default content

**Use Cases:**
- Article content
- Blog posts
- Page content with formatting

**Features:**
- Bold, italic, underline
- Headings (H1-H6)
- Lists (ordered, unordered)
- Links
- Images
- Code blocks
- Tables

#### Markdown
Markdown text editor.

**Configuration Options:**
- **Name**: Field name
- **Type**: Markdown
- **Required**: Make field mandatory

**Use Cases:**
- Technical documentation
- Developer-friendly content
- GitHub-style content

#### Email
Email address field with validation.

**Configuration Options:**
- **Name**: Field name
- **Type**: Email
- **Required**: Make field mandatory
- **Unique**: Ensure unique email addresses
- **Default Value**: Set default email

**Use Cases:**
- User email addresses
- Contact forms
- Newsletter subscriptions

#### Password
Password field (encrypted storage).

**Configuration Options:**
- **Name**: Field name
- **Type**: Password
- **Required**: Make field mandatory
- **Min Length**: Minimum password length

**Use Cases:**
- User passwords
- API keys
- Secret tokens

#### Enumeration
Dropdown field with predefined options.

**Configuration Options:**
- **Name**: Field name
- **Type**: Enumeration
- **Required**: Make field mandatory
- **Values**: Comma-separated list of options
- **Default Value**: Default selected option

**Use Cases:**
- Status fields (draft, published, archived)
- Categories
- Priority levels
- Types

**Example:**
```json
{
  "status": {
    "type": "enumeration",
    "enum": ["draft", "published", "archived"],
    "default": "draft"
  }
}
```

---

### Numeric Fields

#### Number
Numeric input field.

**Configuration Options:**
- **Name**: Field name
- **Type**: Number
- **Required**: Make field mandatory
- **Min**: Minimum value
- **Max**: Maximum value
- **Default Value**: Default number

**Use Cases:**
- Prices, quantities
- Ratings, scores
- Age, weight, dimensions

**Example:**
```json
{
  "price": {
    "type": "decimal",
    "required": true,
    "min": 0
  }
}
```

#### Integer
Whole number field.

**Configuration Options:**
- **Name**: Field name
- **Type**: Integer
- **Required**: Make field mandatory
- **Min**: Minimum value
- **Max**: Maximum value
- **Default Value**: Default integer

**Use Cases:**
- Quantities
- Counts
- IDs

#### Decimal
Decimal number field.

**Configuration Options:**
- **Name**: Field name
- **Type**: Decimal
- **Required**: Make field mandatory
- **Min**: Minimum value
- **Max**: Maximum value
- **Precision**: Decimal places
- **Default Value**: Default decimal

**Use Cases:**
- Prices with cents
- Measurements
- Percentages

#### BigInteger
Large integer field.

**Configuration Options:**
- **Name**: Field name
- **Type**: BigInteger
- **Required**: Make field mandatory

**Use Cases:**
- Large IDs
- Timestamps
- Big numbers

---

### Date and Time Fields

#### Date
Date picker field.

**Configuration Options:**
- **Name**: Field name
- **Type**: Date
- **Required**: Make field mandatory
- **Default Value**: Default date

**Use Cases:**
- Publication dates
- Event dates
- Birth dates

#### Time
Time picker field.

**Configuration Options:**
- **Name**: Field name
- **Type**: Time
- **Required**: Make field mandatory
- **Default Value**: Default time

**Use Cases:**
- Event times
- Opening hours
- Schedules

#### DateTime
Date and time picker field.

**Configuration Options:**
- **Name**: Field name
- **Type**: DateTime
- **Required**: Make field mandatory
- **Default Value**: Default date and time

**Use Cases:**
- Timestamps
- Publication dates with time
- Event dates and times

#### Timestamp
Unix timestamp field.

**Configuration Options:**
- **Name**: Field name
- **Type**: Timestamp
- **Required**: Make field mandatory

**Use Cases:**
- System timestamps
- API timestamps
- Unix time values

---

### Media Fields

#### Media
Single media file (image, video, document).

**Configuration Options:**
- **Name**: Field name
- **Type**: Media
- **Required**: Make field mandatory
- **Allowed Types**: Images, Videos, Files, or All
- **Multiple**: Allow multiple files

**Use Cases:**
- Featured images
- Product images
- Document attachments
- Video content

**Example:**
```json
{
  "featuredImage": {
    "type": "media",
    "allowedTypes": ["images"],
    "multiple": false
  }
}
```

---

### Boolean Fields

#### Boolean
Checkbox field (true/false).

**Configuration Options:**
- **Name**: Field name
- **Type**: Boolean
- **Required**: Make field mandatory
- **Default Value**: Default boolean (true/false)

**Use Cases:**
- Feature flags
- Published status
- Active/inactive
- Checkboxes

**Example:**
```json
{
  "isPublished": {
    "type": "boolean",
    "default": false
  }
}
```

---

### JSON Fields

#### JSON
JSON data field.

**Configuration Options:**
- **Name**: Field name
- **Type**: JSON
- **Required**: Make field mandatory
- **Default Value**: Default JSON object

**Use Cases:**
- Flexible data structures
- API responses
- Configuration objects
- Metadata

**Example:**
```json
{
  "metadata": {
    "type": "json"
  }
}
```

---

### Relationship Fields

#### Relation
Connection between Content Types.

**Configuration Options:**
- **Name**: Field name
- **Type**: Relation
- **Relation Type**: 
  - One-to-One
  - One-to-Many
  - Many-to-One
  - Many-to-Many
- **Target Content Type**: Select related Content Type

**Use Cases:**
- Connecting related content
- Building content hierarchies
- Creating associations

**Example Relationships:**
- Article → Author (Many-to-One)
- Author → Articles (One-to-Many)
- Article → Categories (Many-to-Many)
- User → Profile (One-to-One)

---

### UID Field

#### UID
Unique identifier field (auto-generated slug).

**Configuration Options:**
- **Name**: Field name
- **Type**: UID
- **Required**: Make field mandatory
- **Attached Field**: Field to generate UID from (usually title)
- **Regenerate**: Option to regenerate UID

**Use Cases:**
- URL slugs
- Unique identifiers
- SEO-friendly URLs

**Example:**
```json
{
  "slug": {
    "type": "uid",
    "targetField": "title"
  }
}
```

---

## Field Configuration Options

### Common Options

Most fields share these configuration options:

- **Name**: Internal field name (used in API)
- **Display Name**: Label shown in admin panel
- **Required**: Field must have a value
- **Unique**: Values must be unique across entries
- **Default Value**: Default value for new entries
- **Private**: Hide field from API responses
- **Searchable**: Include in search functionality

### Validation Options

- **Min Length**: Minimum character/string length
- **Max Length**: Maximum character/string length
- **Min**: Minimum numeric value
- **Max**: Maximum numeric value
- **Regex Pattern**: Custom validation pattern
- **Custom Validation**: Custom validation function

---

## Content Type Settings

### General Settings

- **Display Name**: Name shown in admin panel
- **API ID**: Used in API endpoints
- **Draft/Publish**: Enable draft system
- **Internationalization**: Enable multi-language support

### Advanced Settings

- **Default Sort Attribute**: Default sorting field
- **Default Sort Order**: Ascending or descending
- **Searchable Attributes**: Fields included in search

---

## Content Type Schema Structure

When you create a Content Type, Strapi generates a `schema.json` file:

```json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article",
    "description": ""
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "content": {
      "type": "richtext"
    },
    "publishedAt": {
      "type": "datetime"
    },
    "createdAt": {
      "type": "datetime"
    },
    "updatedAt": {
      "type": "datetime"
    },
    "createdBy": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "plugin::users-permissions.user"
    },
    "updatedBy": {
      "type": "other",
      "other": {
        "type": "relation",
        "relation": "oneToOne",
        "target": "plugin::users-permissions.user"
      }
    }
  }
}
```

### Schema Properties Explained

- **kind**: `collectionType` or `singleType`
- **collectionName**: Database table name
- **info**: Content Type metadata
- **options**: Content Type options
- **attributes**: Field definitions
- **pluginOptions**: Plugin-specific options

---

## Best Practices

### Naming Conventions

1. **Content Type Names**: Use PascalCase for display names, camelCase for API IDs
   - Display: "Blog Post"
   - API ID: "blog-post"

2. **Field Names**: Use camelCase
   - Good: `featuredImage`, `publishedAt`
   - Avoid: `featured_image`, `Published-At`

3. **Consistent Naming**: Be consistent across your project

### Field Organization

1. **Logical Grouping**: Group related fields together
2. **Required Fields First**: Place required fields at the top
3. **Common Fields**: Use consistent field names (title, description, etc.)

### Performance Considerations

1. **Avoid Too Many Fields**: Keep Content Types focused
2. **Use Relations Wisely**: Don't create unnecessary relationships
3. **Index Important Fields**: Consider database indexing for searchable fields

### Data Modeling

1. **Plan Before Creating**: Design your Content Types before implementation
2. **Keep It Simple**: Start simple, add complexity as needed
3. **Reusable Components**: Use components for repeated field groups
4. **Proper Relationships**: Use appropriate relationship types

---

## Common Patterns

### Blog Post Content Type

```json
{
  "title": "string (required)",
  "slug": "uid (from title)",
  "content": "richtext",
  "excerpt": "text",
  "featuredImage": "media (image)",
  "author": "relation (many-to-one, User)",
  "categories": "relation (many-to-many, Category)",
  "tags": "relation (many-to-many, Tag)",
  "publishedAt": "datetime",
  "isFeatured": "boolean"
}
```

### Product Content Type

```json
{
  "name": "string (required)",
  "slug": "uid (from name)",
  "description": "richtext",
  "price": "decimal (required)",
  "sku": "string (unique)",
  "images": "media (multiple images)",
  "category": "relation (many-to-one, Category)",
  "brand": "relation (many-to-one, Brand)",
  "inStock": "boolean",
  "stockQuantity": "integer"
}
```

### User Profile Content Type

```json
{
  "firstName": "string",
  "lastName": "string",
  "bio": "text",
  "avatar": "media (image)",
  "website": "string",
  "socialLinks": "json",
  "user": "relation (one-to-one, User)"
}
```

---

## Modifying Content Types

### Adding Fields

1. Go to Content-Type Builder
2. Select your Content Type
3. Click **+ Add another field**
4. Configure and save

### Removing Fields

1. Go to Content-Type Builder
2. Select your Content Type
3. Click the field's delete icon
4. Confirm deletion

**Warning**: Removing fields will delete data in that field for all entries.

### Modifying Fields

1. Go to Content-Type Builder
2. Select your Content Type
3. Click on the field to edit
4. Modify settings and save

**Note**: Some changes may require database migrations.

---

## Content Type Lifecycle

Content Types go through these stages:

1. **Creation**: Define structure and fields
2. **Configuration**: Set options and validation
3. **Usage**: Create and manage entries
4. **Modification**: Update structure as needed
5. **Migration**: Handle schema changes

---

## Troubleshooting

### Common Issues

**Issue**: Field not appearing in API
- **Solution**: Check if field is marked as "Private"
- **Solution**: Verify field is saved correctly

**Issue**: Validation errors
- **Solution**: Check field requirements
- **Solution**: Verify data format matches field type

**Issue**: Relationship not working
- **Solution**: Verify both Content Types exist
- **Solution**: Check relationship type is correct

**Issue**: Cannot delete Content Type
- **Solution**: Remove all entries first
- **Solution**: Check for dependencies

---

## Next Steps

After creating Content Types:

1. **Add Relationships**: Connect related Content Types
2. **Create Components**: Build reusable field groups
3. **Set Up Dynamic Zones**: Add flexible content areas
4. **Configure Permissions**: Set up access control
5. **Test API**: Verify API endpoints work correctly

---

## References

- [Strapi Content Types Documentation](https://docs.strapi.io/dev-docs/backend-customization/models)
- [Strapi Field Types Reference](https://docs.strapi.io/dev-docs/backend-customization/models#field-types)
- [Strapi Content-Type Builder Guide](https://docs.strapi.io/user-docs/content-type-builder)

---

## Notes

### Key Takeaways

- Content Types define your data structure
- Choose appropriate field types for your needs
- Plan your Content Types before creating
- Use relationships to connect related content
- Follow naming conventions for consistency

### Important Reminders

- Collection Types = Multiple entries
- Single Types = Single entry
- Fields define the structure
- Relationships connect Content Types
- Schema files define the structure programmatically

