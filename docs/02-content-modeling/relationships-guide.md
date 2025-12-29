# Relationships Guide

## Overview

Relationships in Strapi allow you to connect Content Types together, creating associations between different pieces of content. This guide covers all relationship types, how to create them, and best practices for using them effectively.

---

## What are Relationships?

Relationships define how Content Types relate to each other. They allow you to:
- Connect related content
- Build content hierarchies
- Create associations
- Reference other entries
- Build complex data structures

---

## Relationship Types

Strapi supports four main relationship types:

1. **One-to-One**: One entry relates to exactly one other entry
2. **One-to-Many**: One entry relates to many other entries
3. **Many-to-One**: Many entries relate to one entry
4. **Many-to-Many**: Many entries relate to many other entries

---

## One-to-One Relationship

### Definition

A One-to-One relationship means each entry in one Content Type relates to exactly one entry in another Content Type, and vice versa.

### Use Cases

- User → User Profile
- Product → Product Details
- Settings → Configuration
- Page → Page Metadata

### Example: User and Profile

**User Content Type:**
- id
- username
- email
- profile (One-to-One → Profile)

**Profile Content Type:**
- id
- firstName
- lastName
- bio
- avatar
- user (One-to-One → User)

### Creating One-to-One Relationship

#### Method 1: Using Content Type Builder

1. Go to Content Type Builder
2. Select your Content Type (e.g., User)
3. Click **+ Add another field**
4. Select **Relation**
5. Choose **Has one** (One-to-One)
6. Select target Content Type (e.g., Profile)
7. Save

**Note**: Strapi will automatically create the reverse relationship in the target Content Type.

#### Method 2: Manual Schema

**User Schema:**
```json
{
  "profile": {
    "type": "relation",
    "relation": "oneToOne",
    "target": "api::profile.profile"
  }
}
```

**Profile Schema:**
```json
{
  "user": {
    "type": "relation",
    "relation": "oneToOne",
    "target": "api::user.user"
  }
}
```

### API Usage

**Creating Entry:**
```javascript
// POST /api/users
{
  "data": {
    "username": "johndoe",
    "email": "john@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Developer"
    }
  }
}
```

**Querying with Relationship:**
```javascript
// GET /api/users?populate=profile
// Returns user with profile data

// GET /api/profiles?populate=user
// Returns profile with user data
```

---

## One-to-Many Relationship

### Definition

A One-to-Many relationship means one entry in a Content Type can relate to many entries in another Content Type.

### Use Cases

- Author → Articles (one author has many articles)
- Category → Products (one category has many products)
- User → Orders (one user has many orders)
- Company → Employees (one company has many employees)

### Example: Author and Articles

**Author Content Type:**
- id
- name
- email
- articles (One-to-Many → Article)

**Article Content Type:**
- id
- title
- content
- author (Many-to-One → Author)

### Creating One-to-Many Relationship

#### Method 1: Using Content Type Builder

1. Go to Content Type Builder
2. Select your Content Type (e.g., Author)
3. Click **+ Add another field**
4. Select **Relation**
5. Choose **Has many** (One-to-Many)
6. Select target Content Type (e.g., Article)
7. Save

**Note**: The reverse relationship (Many-to-One) is automatically created in the target Content Type.

#### Method 2: Manual Schema

**Author Schema:**
```json
{
  "articles": {
    "type": "relation",
    "relation": "oneToMany",
    "target": "api::article.article",
    "mappedBy": "author"
  }
}
```

**Article Schema:**
```json
{
  "author": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::author.author"
  }
}
```

### API Usage

**Creating Entry:**
```javascript
// POST /api/articles
{
  "data": {
    "title": "My Article",
    "content": "Article content",
    "author": 1  // Author ID
  }
}
```

**Querying with Relationship:**
```javascript
// GET /api/authors?populate=articles
// Returns author with all articles

// GET /api/articles?populate=author
// Returns article with author data

// GET /api/articles?filters[author][id][$eq]=1
// Filter articles by author
```

---

## Many-to-One Relationship

### Definition

A Many-to-One relationship is the reverse of One-to-Many. Many entries in one Content Type relate to one entry in another Content Type.

### Use Cases

- Articles → Author (many articles belong to one author)
- Products → Category (many products belong to one category)
- Comments → Post (many comments belong to one post)
- Orders → Customer (many orders belong to one customer)

### Example: Articles and Author

This is the same as the One-to-Many example, viewed from the opposite side.

**Article Content Type:**
- id
- title
- content
- author (Many-to-One → Author)

**Author Content Type:**
- id
- name
- email
- articles (One-to-Many → Article)

### Creating Many-to-One Relationship

When you create a One-to-Many relationship, the Many-to-One is automatically created on the other side. You can also create it directly:

1. Go to Content Type Builder
2. Select your Content Type (e.g., Article)
3. Click **+ Add another field**
4. Select **Relation**
5. Choose **Belongs to** (Many-to-One)
6. Select target Content Type (e.g., Author)
7. Save

### API Usage

Same as One-to-Many, but viewed from the "many" side:

```javascript
// GET /api/articles?populate=author
// Returns articles with their author

// GET /api/articles?filters[author][name][$eq]=John
// Filter articles by author name
```

---

## Many-to-Many Relationship

### Definition

A Many-to-Many relationship means many entries in one Content Type can relate to many entries in another Content Type.

### Use Cases

- Articles ↔ Categories (articles can have multiple categories, categories can have multiple articles)
- Products ↔ Tags (products can have multiple tags, tags can have multiple products)
- Students ↔ Courses (students can take multiple courses, courses can have multiple students)
- Posts ↔ Authors (posts can have multiple authors, authors can write multiple posts)

### Example: Articles and Categories

**Article Content Type:**
- id
- title
- content
- categories (Many-to-Many → Category)

**Category Content Type:**
- id
- name
- slug
- articles (Many-to-Many → Article)

### Creating Many-to-Many Relationship

#### Method 1: Using Content Type Builder

1. Go to Content Type Builder
2. Select your Content Type (e.g., Article)
3. Click **+ Add another field**
4. Select **Relation**
5. Choose **Has and belongs to many** (Many-to-Many)
6. Select target Content Type (e.g., Category)
7. Save

**Note**: The reverse relationship is automatically created in the target Content Type.

#### Method 2: Manual Schema

**Article Schema:**
```json
{
  "categories": {
    "type": "relation",
    "relation": "manyToMany",
    "target": "api::category.category",
    "inversedBy": "articles"
  }
}
```

**Category Schema:**
```json
{
  "articles": {
    "type": "relation",
    "relation": "manyToMany",
    "target": "api::article.article",
    "inversedBy": "categories"
  }
}
```

### Database Structure

Many-to-Many relationships create a junction table in the database:
- `articles_categories_links`
- Contains: `article_id`, `category_id`, `article_order`, `category_order`

### API Usage

**Creating Entry:**
```javascript
// POST /api/articles
{
  "data": {
    "title": "My Article",
    "content": "Article content",
    "categories": [1, 2, 3]  // Array of category IDs
  }
}
```

**Querying with Relationship:**
```javascript
// GET /api/articles?populate=categories
// Returns articles with all categories

// GET /api/categories?populate=articles
// Returns categories with all articles

// GET /api/articles?filters[categories][id][$eq]=1
// Filter articles by category
```

---

## Relationship Configuration

### Field Options

When creating relationships, you can configure:

- **Field Name**: Name of the relationship field
- **Relation Type**: One-to-One, One-to-Many, Many-to-One, Many-to-Many
- **Target Content Type**: Which Content Type to relate to
- **Required**: Make relationship mandatory
- **Private**: Hide from API responses

### Reverse Relationships

Strapi automatically creates reverse relationships:
- One-to-One ↔ One-to-One
- One-to-Many ↔ Many-to-One
- Many-to-Many ↔ Many-to-Many

---

## Complex Relationship Patterns

### Self-Referencing Relationships

Content Types can relate to themselves:

**Example: Categories with Parent Categories**
```json
{
  "parent": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::category.category"
  },
  "children": {
    "type": "relation",
    "relation": "oneToMany",
    "target": "api::category.category",
    "mappedBy": "parent"
  }
}
```

### Multiple Relationships

Content Types can have multiple relationships:

**Article Content Type:**
- author (Many-to-One → Author)
- categories (Many-to-Many → Category)
- tags (Many-to-Many → Tag)
- relatedArticles (Many-to-Many → Article)

### Nested Relationships

Query relationships through relationships:

```javascript
// GET /api/articles?populate[author][populate]=profile
// Get article with author and author's profile

// GET /api/articles?populate[categories][populate]=parent
// Get article with categories and their parent categories
```

---

## API Query Patterns

### Populating Relationships

**Single Relationship:**
```javascript
// GET /api/articles?populate=author
```

**Multiple Relationships:**
```javascript
// GET /api/articles?populate[author]=*&populate[categories]=*
```

**Deep Population:**
```javascript
// GET /api/articles?populate=*
// Populate all relationships

// GET /api/articles?populate[author][populate]=*
// Populate author and all author relationships
```

### Filtering by Relationships

**Filter by Related Entry ID:**
```javascript
// GET /api/articles?filters[author][id][$eq]=1
```

**Filter by Related Entry Field:**
```javascript
// GET /api/articles?filters[author][name][$eq]=John
```

**Filter by Multiple Related Entries:**
```javascript
// GET /api/articles?filters[categories][id][$in][0]=1&filters[categories][id][$in][1]=2
```

### Sorting by Relationships

```javascript
// GET /api/articles?sort=author.name:asc
// Sort by related author name
```

---

## Best Practices

### Relationship Design

1. **Choose Right Type**: Use appropriate relationship type for your use case
2. **Avoid Over-Relationships**: Don't create unnecessary relationships
3. **Consider Performance**: Many relationships can impact performance
4. **Document Relationships**: Document why relationships exist

### Naming Conventions

1. **Clear Names**: Use descriptive relationship field names
2. **Consistent Naming**: Use consistent naming across Content Types
3. **Plural for Collections**: Use plural for One-to-Many and Many-to-Many
4. **Singular for Single**: Use singular for One-to-One and Many-to-One

### Performance Optimization

1. **Selective Population**: Only populate needed relationships
2. **Limit Depth**: Avoid deep nested populations
3. **Use Filters**: Filter at database level, not in application
4. **Index Relationships**: Consider database indexing

### Data Integrity

1. **Required Relationships**: Mark critical relationships as required
2. **Cascade Deletes**: Consider what happens when related entries are deleted
3. **Validation**: Validate relationship data
4. **Orphan Prevention**: Prevent orphaned relationships

---

## Common Patterns

### Pattern 1: Blog Structure

**Content Types:**
- Article (Many-to-One → Author, Many-to-Many → Category, Many-to-Many → Tag)
- Author (One-to-Many → Article)
- Category (Many-to-Many → Article)
- Tag (Many-to-Many → Article)

### Pattern 2: E-commerce

**Content Types:**
- Product (Many-to-One → Category, Many-to-Many → Tag, Many-to-One → Brand)
- Category (One-to-Many → Product, Many-to-One → Parent Category)
- Brand (One-to-Many → Product)
- Order (Many-to-One → Customer, Many-to-Many → Product)

### Pattern 3: User Management

**Content Types:**
- User (One-to-One → Profile, One-to-Many → Post)
- Profile (One-to-One → User)
- Post (Many-to-One → User, Many-to-Many → Tag)

### Pattern 4: Hierarchical Structure

**Content Types:**
- Category (Many-to-One → Parent Category, One-to-Many → Child Categories)
- Page (Many-to-One → Parent Page, One-to-Many → Child Pages)

---

## Troubleshooting

### Common Issues

**Issue**: Relationship not appearing in API
- **Solution**: Use populate parameter
- **Solution**: Check if relationship field is private

**Issue**: Cannot create relationship
- **Solution**: Verify both Content Types exist
- **Solution**: Check relationship type is correct

**Issue**: Relationship data not saving
- **Solution**: Verify target entry exists
- **Solution**: Check relationship is not required if data is missing

**Issue**: Performance issues with relationships
- **Solution**: Limit population depth
- **Solution**: Use selective population
- **Solution**: Add database indexes

---

## Migration Considerations

### Adding Relationships

1. Create relationship in Content Type Builder
2. Strapi handles database migration automatically
3. Existing entries will have null/empty relationships

### Removing Relationships

1. Remove relationship from Content Type Builder
2. Relationship data is removed from database
3. Junction tables are dropped (for Many-to-Many)

**Warning**: Removing relationships will delete relationship data.

---

## Advanced Topics

### Polymorphic Relations

Strapi supports polymorphic relations (one field can relate to multiple Content Types):

```json
{
  "relatedContent": {
    "type": "relation",
    "relation": "morphTo"
  }
}
```

### Custom Relationship Fields

Add additional fields to Many-to-Many relationships using junction tables.

### Relationship Lifecycle Hooks

Use lifecycle hooks to handle relationship changes:
- beforeCreate
- afterCreate
- beforeUpdate
- afterUpdate

---

## References

- [Strapi Relations Documentation](https://docs.strapi.io/dev-docs/backend-customization/models#relations)
- [Strapi API Relations Guide](https://docs.strapi.io/dev-docs/api/rest/relations)

---

## Notes

### Key Takeaways

- Relationships connect Content Types together
- Choose appropriate relationship type for your use case
- Use populate to include relationship data in API responses
- Consider performance when using many relationships
- Document relationships for maintainability

### Important Reminders

- One-to-One: One entry to one entry
- One-to-Many: One entry to many entries
- Many-to-One: Many entries to one entry
- Many-to-Many: Many entries to many entries
- Always use populate to get relationship data
- Relationships are bidirectional in Strapi

