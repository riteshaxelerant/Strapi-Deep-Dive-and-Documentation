# Field Types Reference

## Overview

This document provides a comprehensive reference for all field types available in Strapi, including their configuration options, use cases, and examples.

---

## Text Field Types

### Text

Single-line text input field.

**Type**: `string`

**Configuration:**
- Required: Boolean
- Unique: Boolean
- Default Value: String
- Max Length: Number
- Min Length: Number
- Regex Pattern: String

**API Response:**
```json
{
  "title": "My Article Title"
}
```

**Use Cases:**
- Titles, names, short descriptions
- Email addresses (with regex validation)
- URLs, slugs
- Short text content

---

### Textarea

Multi-line text input field.

**Type**: `text`

**Configuration:**
- Required: Boolean
- Default Value: String
- Max Length: Number

**API Response:**
```json
{
  "description": "This is a longer description that can span multiple lines."
}
```

**Use Cases:**
- Long descriptions
- Content summaries
- Notes and comments
- Excerpts

---

### Rich Text

WYSIWYG rich text editor with formatting options.

**Type**: `richtext`

**Configuration:**
- Required: Boolean
- Default Value: String (HTML)

**Features:**
- Bold, italic, underline
- Headings (H1-H6)
- Lists (ordered, unordered)
- Links
- Images
- Code blocks
- Tables
- Blockquotes

**API Response:**
```json
{
  "content": "<p>This is <strong>rich text</strong> content with <em>formatting</em>.</p>"
}
```

**Use Cases:**
- Article content
- Blog posts
- Page content with formatting
- Long-form content

---

### Markdown

Markdown text editor.

**Type**: `markdown`

**Configuration:**
- Required: Boolean
- Default Value: String (Markdown)

**API Response:**
```json
{
  "content": "# Heading\n\nThis is **markdown** content."
}
```

**Use Cases:**
- Technical documentation
- Developer-friendly content
- GitHub-style content
- README files

---

### Email

Email address field with automatic validation.

**Type**: `email`

**Configuration:**
- Required: Boolean
- Unique: Boolean
- Default Value: String (email)

**Validation:**
- Automatic email format validation
- Regex pattern: Standard email format

**API Response:**
```json
{
  "email": "user@example.com"
}
```

**Use Cases:**
- User email addresses
- Contact forms
- Newsletter subscriptions
- Account emails

---

### Password

Password field with encryption.

**Type**: `password`

**Configuration:**
- Required: Boolean
- Min Length: Number
- Default Value: String (not recommended)

**Security:**
- Automatically encrypted/hashed
- Never returned in API responses

**Use Cases:**
- User passwords
- API keys
- Secret tokens
- Authentication credentials

---

### Enumeration

Dropdown field with predefined options.

**Type**: `enumeration`

**Configuration:**
- Required: Boolean
- Values: Array of strings (comma-separated in UI)
- Default Value: String (one of the values)

**API Response:**
```json
{
  "status": "published"
}
```

**Use Cases:**
- Status fields (draft, published, archived)
- Categories
- Priority levels (low, medium, high)
- Types
- Options with limited choices

**Example Configuration:**
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

## Numeric Field Types

### Number

Numeric input field (supports decimals).

**Type**: `decimal` or `float`

**Configuration:**
- Required: Boolean
- Min: Number
- Max: Number
- Default Value: Number
- Precision: Number (decimal places)

**API Response:**
```json
{
  "price": 29.99
}
```

**Use Cases:**
- Prices
- Measurements
- Percentages
- Decimal values

---

### Integer

Whole number field.

**Type**: `integer`

**Configuration:**
- Required: Boolean
- Min: Number
- Max: Number
- Default Value: Number

**API Response:**
```json
{
  "quantity": 10
}
```

**Use Cases:**
- Quantities
- Counts
- IDs
- Whole numbers only

---

### BigInteger

Large integer field.

**Type**: `biginteger`

**Configuration:**
- Required: Boolean
- Default Value: Number

**API Response:**
```json
{
  "largeId": 9223372036854775807
}
```

**Use Cases:**
- Large IDs
- Timestamps
- Big numbers
- System-generated large integers

---

## Date and Time Field Types

### Date

Date picker field (date only).

**Type**: `date`

**Configuration:**
- Required: Boolean
- Default Value: Date string

**API Response:**
```json
{
  "birthDate": "1990-01-15"
}
```

**Use Cases:**
- Publication dates
- Event dates
- Birth dates
- Important dates

---

### Time

Time picker field (time only).

**Type**: `time`

**Configuration:**
- Required: Boolean
- Default Value: Time string

**API Response:**
```json
{
  "startTime": "09:00:00"
}
```

**Use Cases:**
- Event times
- Opening hours
- Schedules
- Time-specific data

---

### DateTime

Date and time picker field.

**Type**: `datetime`

**Configuration:**
- Required: Boolean
- Default Value: DateTime string

**API Response:**
```json
{
  "publishedAt": "2024-01-15T10:30:00.000Z"
}
```

**Use Cases:**
- Timestamps
- Publication dates with time
- Event dates and times
- Created/updated timestamps

---

### Timestamp

Unix timestamp field.

**Type**: `timestamp`

**Configuration:**
- Required: Boolean
- Default Value: Number (Unix timestamp)

**API Response:**
```json
{
  "timestamp": 1705312200
}
```

**Use Cases:**
- System timestamps
- API timestamps
- Unix time values
- Epoch time

---

## Media Field Types

### Media

Media file field (images, videos, documents).

**Type**: `media`

**Configuration:**
- Required: Boolean
- Multiple: Boolean (single or multiple files)
- Allowed Types: Array
  - Images
  - Videos
  - Files
  - All

**API Response (Single):**
```json
{
  "featuredImage": {
    "id": 1,
    "name": "image.jpg",
    "alternativeText": null,
    "caption": null,
    "width": 1920,
    "height": 1080,
    "formats": {
      "thumbnail": { ... },
      "small": { ... },
      "medium": { ... },
      "large": { ... }
    },
    "hash": "image_hash",
    "ext": ".jpg",
    "mime": "image/jpeg",
    "size": 245.67,
    "url": "/uploads/image_hash.jpg",
    "previewUrl": null,
    "provider": "local",
    "provider_metadata": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**API Response (Multiple):**
```json
{
  "gallery": [
    { "id": 1, ... },
    { "id": 2, ... }
  ]
}
```

**Use Cases:**
- Featured images
- Product images
- Document attachments
- Video content
- File uploads

---

## Boolean Field Types

### Boolean

Checkbox field (true/false).

**Type**: `boolean`

**Configuration:**
- Required: Boolean
- Default Value: Boolean (true/false)

**API Response:**
```json
{
  "isPublished": true,
  "isFeatured": false
}
```

**Use Cases:**
- Feature flags
- Published status
- Active/inactive
- Checkboxes
- Toggle switches

---

## JSON Field Types

### JSON

JSON data field.

**Type**: `json`

**Configuration:**
- Required: Boolean
- Default Value: JSON object/array

**API Response:**
```json
{
  "metadata": {
    "author": "John Doe",
    "tags": ["tech", "web"],
    "customData": {
      "key": "value"
    }
  }
}
```

**Use Cases:**
- Flexible data structures
- API responses
- Configuration objects
- Metadata
- Dynamic data

---

## Relationship Field Types

### Relation

Connection between Content Types.

**Type**: `relation`

**Configuration:**
- Relation Type:
  - One-to-One
  - One-to-Many
  - Many-to-One
  - Many-to-Many
- Target Content Type: Select related Content Type

**API Response (One-to-One):**
```json
{
  "author": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**API Response (One-to-Many):**
```json
{
  "articles": [
    { "id": 1, "title": "Article 1" },
    { "id": 2, "title": "Article 2" }
  ]
}
```

**API Response (Many-to-Many):**
```json
{
  "categories": [
    { "id": 1, "name": "Tech" },
    { "id": 2, "name": "Web" }
  ]
}
```

**Use Cases:**
- Connecting related content
- Building content hierarchies
- Creating associations
- Referencing other entries

---

## UID Field Type

### UID

Unique identifier field (auto-generated slug).

**Type**: `uid`

**Configuration:**
- Required: Boolean
- Attached Field: Field to generate UID from (usually title)
- Regenerate: Option to regenerate UID

**API Response:**
```json
{
  "title": "My Article Title",
  "slug": "my-article-title"
}
```

**Use Cases:**
- URL slugs
- Unique identifiers
- SEO-friendly URLs
- Human-readable IDs

**Features:**
- Auto-generates from attached field
- URL-safe characters
- Lowercase conversion
- Special character handling

---

## Field Configuration Options

### Common Options

All fields support these common options:

#### Required
- **Type**: Boolean
- **Default**: false
- **Description**: Field must have a value

#### Unique
- **Type**: Boolean
- **Default**: false
- **Description**: Values must be unique across entries

#### Default Value
- **Type**: Varies by field type
- **Default**: null
- **Description**: Default value for new entries

#### Private
- **Type**: Boolean
- **Default**: false
- **Description**: Hide field from API responses

#### Searchable
- **Type**: Boolean
- **Default**: true
- **Description**: Include in search functionality

---

## Validation Options

### Text Validation

- **Min Length**: Minimum character count
- **Max Length**: Maximum character count
- **Regex Pattern**: Custom validation pattern

### Number Validation

- **Min**: Minimum value
- **Max**: Maximum value
- **Precision**: Decimal places (for decimal fields)

### Date Validation

- **Min Date**: Minimum date value
- **Max Date**: Maximum date value

---

## Field Type Comparison

| Field Type | Data Type | Use Case | Example |
|------------|-----------|----------|---------|
| Text | String | Short text | Title, name |
| Textarea | Text | Long text | Description |
| Rich Text | HTML | Formatted content | Article content |
| Markdown | Markdown | Markdown content | Documentation |
| Email | String | Email addresses | User email |
| Password | String | Passwords | User password |
| Enumeration | String | Limited options | Status |
| Number | Decimal | Decimal numbers | Price |
| Integer | Integer | Whole numbers | Quantity |
| Date | Date | Date only | Birth date |
| DateTime | DateTime | Date and time | Published date |
| Media | Object | Files | Images, videos |
| Boolean | Boolean | True/false | Is published |
| JSON | Object/Array | Flexible data | Metadata |
| Relation | Object/Array | Relationships | Author, categories |
| UID | String | Unique slug | URL slug |

---

## Best Practices

### Choosing Field Types

1. **Use Appropriate Types**: Choose the right type for your data
2. **Consider Validation**: Use types with built-in validation when possible
3. **Performance**: Consider database performance for large datasets
4. **API Response**: Think about how data will be consumed

### Field Naming

1. **Use camelCase**: Follow JavaScript naming conventions
2. **Be Descriptive**: Use clear, descriptive names
3. **Be Consistent**: Use consistent naming across Content Types
4. **Avoid Reserved Words**: Don't use JavaScript/Strapi reserved words

### Validation

1. **Set Required Fields**: Mark essential fields as required
2. **Use Min/Max**: Set appropriate limits for numeric fields
3. **Use Regex**: Add custom validation patterns when needed
4. **Test Validation**: Test validation rules thoroughly

---

## API Usage Examples

### Creating Entry with Fields

```javascript
// POST /api/articles
{
  "data": {
    "title": "My Article",
    "slug": "my-article",
    "content": "<p>Article content</p>",
    "publishedAt": "2024-01-15T10:30:00.000Z",
    "isPublished": true,
    "author": 1,
    "categories": [1, 2]
  }
}
```

### Filtering by Field Type

```javascript
// GET /api/articles?filters[isPublished][$eq]=true
// GET /api/articles?filters[price][$gte]=10
// GET /api/articles?filters[title][$contains]=article
```

### Sorting by Field

```javascript
// GET /api/articles?sort=publishedAt:desc
// GET /api/articles?sort=price:asc
```

---

## References

- [Strapi Field Types Documentation](https://docs.strapi.io/dev-docs/backend-customization/models#field-types)
- [Strapi API Documentation](https://docs.strapi.io/dev-docs/api/rest)

---

## Notes

### Key Takeaways

- Choose field types based on data requirements
- Use validation options to ensure data quality
- Consider API response structure
- Follow naming conventions
- Test field configurations thoroughly

