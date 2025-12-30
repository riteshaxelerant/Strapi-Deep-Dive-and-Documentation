# Import/Export and Bulk Operations Guide

## Overview

This guide covers content import/export workflows and bulk operations in Strapi. Strapi provides official CLI commands (`strapi export` and `strapi import`) for data management starting from version 4.6.0. These commands are not available in the admin panel but can be run via command line. This guide covers both the official CLI methods and programmatic approaches using APIs and custom scripts.

---

## Important Note: Strapi Import/Export Status

**Strapi provides built-in import/export functionality via CLI commands**, but not through the admin panel. The `strapi export` and `strapi import` commands are available starting from **Strapi version 4.6.0 and later**.

### Available Methods

1. **CLI Commands** - Official `strapi export` and `strapi import` commands (recommended for full backups)
2. **REST API** - Programmatic import/export (for selective data operations)
3. **GraphQL API** - Query and mutate data (for flexible data operations)
4. **Custom Scripts** - Node.js scripts using Strapi APIs (for complex workflows)
5. **Database-Level Operations** - Direct database access (advanced, not recommended)

**Quick Start:**
```bash
# Export all data
yarn strapi export -f my-backup

# Import data
yarn strapi import -f my-backup.tar.gz.enc
```

---

## Official Strapi CLI Import/Export

Strapi provides official CLI commands for data management. These commands are part of the Data Management feature and are available in Strapi 4.6.0 and later.

### Data Export (`strapi export`)

The `strapi export` command exports data from a local Strapi instance. By default, it creates an encrypted and compressed `.tar.gz.enc` file containing:

- Project configuration
- Entities (all content)
- Links (relations between entities)
- Assets (files stored in uploads folder)
- Schemas
- `metadata.json` file

#### Basic Export Command

```bash
# Using Yarn
yarn strapi export

# Using npm
npm run strapi export
```

#### Export with Custom Filename

```bash
# Using Yarn
yarn strapi export -f my-export

# Using npm
npm run strapi export -- -f my-export
```

#### Export Options

**Disable Encryption:**
```bash
yarn strapi export --no-encrypt
```

**Disable Compression:**
```bash
yarn strapi export --no-compress
```

**Custom Encryption Key:**
```bash
yarn strapi export --key my-encryption-key
```

**Export Only Specific Types:**
```bash
# Export only content (entities and relations)
yarn strapi export --only content

# Export only files
yarn strapi export --only files

# Export only configuration
yarn strapi export --only config
```

**Exclude Specific Types:**
```bash
# Exclude files and content
yarn strapi export --exclude files,content
```

#### Export Archive Structure

The exported `.tar` archive contains:
```
export_202401011230.tar
├── metadata.json
├── configuration/
│   └── configuration_00001.jsonl
├── entities/
│   └── entities_00001.jsonl
├── links/
│   └── links_00001.jsonl
└── schemas/
    └── schemas_00001.jsonl
```

Each folder contains `.jsonl` files (JSON Lines format) where each line represents a single record.

**Important Notes:**
- Admin users and API tokens are **not** exported
- Media from third-party providers (Cloudinary, AWS S3) are **not** included
- Schemas are always exported (required for import)

**Reference:** [Strapi Data Export Documentation](https://docs.strapi.io/cms/data-management/export)

---

### Data Import (`strapi import`)

The `strapi import` command imports data from an exported archive file. It expects the same structure produced by `strapi export`.

#### Basic Import Command

```bash
# Using Yarn
yarn strapi import -f /path/to/export/file.tar.gz.enc

# Using npm
npm run strapi import -- -f /path/to/export/file.tar.gz.enc
```

#### Import Options

**Provide Encryption Key:**
```bash
yarn strapi import -f /path/to/file.tar.gz.enc --key my-encryption-key
```

**Bypass Prompts (for automation):**
```bash
yarn strapi import -f /path/to/file.tar.gz.enc --force --key my-encryption-key
```

**Import Only Specific Types:**
```bash
# Import only configuration
yarn strapi import -f /path/to/file.tar.gz.enc --only config
```

**Exclude Specific Types:**
```bash
# Exclude files from import
yarn strapi import -f /path/to/file.tar.gz.enc --exclude files
```

#### Import Archive Format

The import command supports:
- Encrypted and compressed: `.tar.gz.enc`
- Compressed only: `.tar.gz`
- Encrypted only: `.tar.enc`
- Plain archive: `.tar`

Compression and encryption are detected automatically from file extensions.

#### Manual Archive Modification

You can extract, modify, and re-import archives:

```bash
# Extract archive
yarn strapi export --no-encrypt --no-compress -f my-export
tar -xf my-export.tar

# Edit .jsonl files as needed
# Then recreate archive
tar -cf my-export.tar configuration entities links schemas metadata.json

# Import modified archive
yarn strapi import -f my-export.tar
```

**Important Warnings:**
- ⚠️ `strapi import` **deletes all existing data** (database and uploads) before importing
- ⚠️ Source and target schemas **must match** for successful import
- ⚠️ Restored data does **not** include Admin users table
- ⚠️ `createdBy` and `updatedBy` fields will be empty after import

**Reference:** [Strapi Data Import Documentation](https://docs.strapi.io/cms/data-management/import)

---

### Data Transfer

Strapi provides a `strapi transfer` command for transferring data between Strapi instances. This is useful for moving data between environments (development, staging, production).

**Reference:** [Strapi Data Transfer Documentation](https://docs.strapi.io/cms/data-management/transfer)

---

### Data Management Feature

The Data Management feature in Strapi provides comprehensive tools for:
- Creating backups
- Migrating data between environments
- Restoring from backups
- Managing data across instances

**Reference:** [Strapi Data Management Feature](https://docs.strapi.io/cms/features/data-management)

---

## Content Export Workflows

### Method 1: Export via REST API

Export content by querying the REST API and saving the data.

#### Basic Export Script

```javascript
// export-content.js
const axios = require('axios');
const fs = require('fs');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'your-api-token';

async function exportContentType(contentType, outputFile) {
  try {
    // Fetch all entries
    const response = await axios.get(
      `${STRAPI_URL}/api/${contentType}?pagination[limit]=-1&populate=*`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );

    // Save to file
    fs.writeFileSync(
      outputFile,
      JSON.stringify(response.data.data, null, 2)
    );

    console.log(`Exported ${response.data.data.length} entries to ${outputFile}`);
  } catch (error) {
    console.error('Export failed:', error.message);
  }
}

// Export articles
exportContentType('articles', './exports/articles.json');
```

#### Advanced Export with Relationships

```javascript
async function exportWithRelations(contentType) {
  const entries = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(
      `${STRAPI_URL}/api/${contentType}`,
      {
        params: {
          'pagination[page]': page,
          'pagination[pageSize]': 100,
          'populate': '*'
        },
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );

    entries.push(...response.data.data);
    
    hasMore = page < response.data.meta.pagination.pageCount;
    page++;
  }

  return entries;
}
```

### Method 2: Export via GraphQL

If you have GraphQL enabled, you can export using GraphQL queries:

```javascript
const { GraphQLClient } = require('graphql-request');

const client = new GraphQLClient(`${STRAPI_URL}/graphql`, {
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`
  }
});

const query = `
  query GetAllArticles {
    articles {
      data {
        id
        attributes {
          title
          content
          publishedAt
          author {
            data {
              id
              attributes {
                name
              }
            }
          }
        }
      }
    }
  }
`;

async function exportViaGraphQL() {
  const data = await client.request(query);
  fs.writeFileSync('./exports/articles-graphql.json', JSON.stringify(data, null, 2));
}
```

### Method 3: Export to CSV

Convert JSON export to CSV format:

```javascript
const { Parser } = require('json2csv');

async function exportToCSV(contentType) {
  const entries = await exportWithRelations(contentType);
  
  // Flatten nested objects for CSV
  const flattened = entries.map(entry => ({
    id: entry.id,
    title: entry.attributes.title,
    content: entry.attributes.content,
    publishedAt: entry.attributes.publishedAt,
    // Add more fields as needed
  }));

  const parser = new Parser();
  const csv = parser.parse(flattened);
  
  fs.writeFileSync(`./exports/${contentType}.csv`, csv);
}
```

### Method 4: Database-Level Export

For advanced users, you can export directly from the database:

```javascript
// Using database connection
const knex = require('knex')({
  client: 'postgresql',
  connection: {
    host: 'localhost',
    database: 'strapi',
    user: 'strapi',
    password: 'password'
  }
});

async function exportFromDatabase(tableName) {
  const rows = await knex(tableName).select('*');
  fs.writeFileSync(`./exports/${tableName}.json`, JSON.stringify(rows, null, 2));
}
```

---

## Content Import Workflows

### Method 1: Import via REST API

Import content by reading JSON files and creating entries via API.

#### Basic Import Script

```javascript
// import-content.js
const axios = require('axios');
const fs = require('fs');

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'your-api-token';

async function importContentType(contentType, inputFile) {
  try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    for (const entry of data) {
      await axios.post(
        `${STRAPI_URL}/api/${contentType}`,
        { data: entry.attributes || entry },
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log(`Imported ${data.length} entries`);
  } catch (error) {
    console.error('Import failed:', error.message);
  }
}

// Import articles
importContentType('articles', './exports/articles.json');
```

#### Advanced Import with Error Handling

```javascript
async function importWithErrorHandling(contentType, inputFile) {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const entry of data) {
    try {
      const entryData = entry.attributes || entry;
      
      // Handle relationships
      if (entryData.author) {
        // Resolve author ID if needed
        entryData.author = await resolveRelationship('authors', entryData.author);
      }

      await axios.post(
        `${STRAPI_URL}/api/${contentType}`,
        { data: entryData },
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        entry: entry.id || entry.attributes?.title,
        error: error.message
      });
    }
  }

  console.log('Import Results:', results);
  return results;
}

async function resolveRelationship(contentType, identifier) {
  // Find entry by ID, slug, or other identifier
  const response = await axios.get(
    `${STRAPI_URL}/api/${contentType}?filters[slug][$eq]=${identifier}`,
    {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    }
  );

  return response.data.data[0]?.id || identifier;
}
```

#### Import with Relationships

```javascript
async function importWithRelations(contentType, inputFile) {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  // First pass: Import entries without relationships
  const importedEntries = [];
  
  for (const entry of data) {
    const entryData = { ...entry.attributes || entry };
    delete entryData.author; // Remove relationships temporarily
    delete entryData.categories;
    
    const response = await axios.post(
      `${STRAPI_URL}/api/${contentType}`,
      { data: entryData },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    importedEntries.push({
      oldId: entry.id,
      newId: response.data.data.id,
      relationships: {
        author: entry.attributes?.author?.data?.id,
        categories: entry.attributes?.categories?.data?.map(c => c.id)
      }
    });
  }

  // Second pass: Update relationships
  for (const entry of importedEntries) {
    if (entry.relationships.author || entry.relationships.categories) {
      await axios.put(
        `${STRAPI_URL}/api/${contentType}/${entry.newId}`,
        {
          data: {
            author: entry.relationships.author,
            categories: entry.relationships.categories
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
}
```

### Method 2: Import from CSV

```javascript
const csv = require('csv-parser');
const fs = require('fs');

async function importFromCSV(csvFile, contentType) {
  const entries = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (row) => {
        entries.push(row);
      })
      .on('end', async () => {
        for (const entry of entries) {
          try {
            await axios.post(
              `${STRAPI_URL}/api/${contentType}`,
              { data: entry },
              {
                headers: {
                  'Authorization': `Bearer ${API_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (error) {
            console.error(`Failed to import: ${entry.title}`, error.message);
          }
        }
        resolve();
      });
  });
}
```

### Method 3: Batch Import

Import multiple entries in batches for better performance:

```javascript
async function batchImport(contentType, data, batchSize = 10) {
  const batches = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(entry =>
        axios.post(
          `${STRAPI_URL}/api/${contentType}`,
          { data: entry.attributes || entry },
          {
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        )
      )
    );
    
    console.log(`Imported batch of ${batch.length} entries`);
  }
}
```

---

## Bulk Operations

### Bulk Update

Update multiple entries at once:

```javascript
async function bulkUpdate(contentType, updates) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const update of updates) {
    try {
      await axios.put(
        `${STRAPI_URL}/api/${contentType}/${update.id}`,
        { data: update.data },
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ id: update.id, error: error.message });
    }
  }

  return results;
}

// Example usage
bulkUpdate('articles', [
  { id: 1, data: { isPublished: true } },
  { id: 2, data: { isPublished: true } },
  { id: 3, data: { category: 5 } }
]);
```

### Bulk Delete

Delete multiple entries:

```javascript
async function bulkDelete(contentType, ids) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const id of ids) {
    try {
      await axios.delete(
        `${STRAPI_URL}/api/${contentType}/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`
          }
        }
      );
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ id, error: error.message });
    }
  }

  return results;
}

// Example usage
bulkDelete('articles', [1, 2, 3, 4, 5]);
```

### Bulk Publish/Unpublish

Publish or unpublish multiple entries:

```javascript
async function bulkPublish(contentType, ids, publish = true) {
  const updates = ids.map(id => ({
    id,
    data: { publishedAt: publish ? new Date().toISOString() : null }
  }));

  return await bulkUpdate(contentType, updates);
}

// Publish multiple articles
bulkPublish('articles', [1, 2, 3], true);

// Unpublish multiple articles
bulkPublish('articles', [4, 5, 6], false);
```

### Bulk Status Update

Update status for multiple entries:

```javascript
async function bulkStatusUpdate(contentType, filters, status) {
  // First, get entries matching filters
  const response = await axios.get(
    `${STRAPI_URL}/api/${contentType}`,
    {
      params: {
        'filters': filters,
        'pagination[limit]': -1
      },
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    }
  );

  const ids = response.data.data.map(entry => entry.id);
  
  // Update all matching entries
  return await bulkUpdate(contentType, ids.map(id => ({
    id,
    data: { status }
  })));
}

// Example: Update all draft articles to published
bulkStatusUpdate('articles', { status: { $eq: 'draft' } }, 'published');
```

### Bulk Relationship Update

Update relationships for multiple entries:

```javascript
async function bulkRelationshipUpdate(contentType, updates) {
  const results = {
    success: 0,
    failed: 0
  };

  for (const update of updates) {
    try {
      // Get current entry
      const current = await axios.get(
        `${STRAPI_URL}/api/${contentType}/${update.id}?populate=*`,
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`
          }
        }
      );

      // Merge with new relationships
      const updatedData = {
        ...current.data.data.attributes,
        ...update.relationships
      };

      await axios.put(
        `${STRAPI_URL}/api/${contentType}/${update.id}`,
        { data: updatedData },
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      results.success++;
    } catch (error) {
      results.failed++;
    }
  }

  return results;
}
```

---

## Using Strapi Programmatic API

For more advanced operations, you can use Strapi's programmatic API within custom scripts:

```javascript
// strapi-import.js
const Strapi = require('@strapi/strapi');

async function importWithStrapiAPI() {
  const strapi = await Strapi().load();
  
  const data = JSON.parse(fs.readFileSync('./exports/articles.json', 'utf8'));

  for (const entry of data) {
    await strapi.entityService.create('api::article.article', {
      data: entry.attributes || entry
    });
  }

  await strapi.destroy();
}
```

---

## Third-Party Solutions

### Strapi Import/Export Plugin (Community)

While not officially maintained, community plugins may exist. Always verify compatibility with Strapi 5 before use.

### Custom Plugin Development

You can create a custom plugin for import/export functionality:

```javascript
// src/plugins/import-export/admin/src/index.js
export default {
  register(app) {
    app.addMenuLink({
      to: '/plugins/import-export',
      icon: 'cloud-download',
      intlLabel: {
        id: 'import-export.title',
        defaultMessage: 'Import/Export',
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

### Export Best Practices

1. **Include Relationships**: Use `populate=*` to include all relationships
2. **Handle Pagination**: Strapi paginates results, handle multiple pages
3. **Export Metadata**: Include IDs, timestamps, and other metadata
4. **Format Data**: Export in a format that's easy to import later
5. **Validate Data**: Verify exported data before using for import

### Import Best Practices

1. **Backup First**: Always backup your database before importing
2. **Validate Data**: Validate data structure before importing
3. **Handle Relationships**: Resolve relationships correctly
4. **Error Handling**: Implement proper error handling and logging
5. **Batch Processing**: Process in batches to avoid timeouts
6. **Dry Run**: Test imports on a development environment first

### Bulk Operations Best Practices

1. **Use Filters**: Use API filters to target specific entries
2. **Batch Size**: Process in reasonable batch sizes
3. **Error Handling**: Handle errors gracefully
4. **Logging**: Log all operations for audit trails
5. **Testing**: Test bulk operations on small datasets first

---

## Security Considerations

1. **API Tokens**: Store API tokens securely, never commit to version control
2. **Permissions**: Ensure API tokens have appropriate permissions
3. **Validation**: Validate all imported data
4. **Rate Limiting**: Be aware of API rate limits
5. **Backup**: Always backup before bulk operations

---

## Troubleshooting

### Common Issues

**Issue**: Import fails with relationship errors
- **Solution**: Import entries first, then update relationships in a second pass

**Issue**: Timeout errors during bulk operations
- **Solution**: Reduce batch size or implement retry logic

**Issue**: Data format mismatches
- **Solution**: Validate data structure before import

**Issue**: Missing required fields
- **Solution**: Ensure all required fields are present in import data

---

## Example: Complete Import/Export Workflow

```javascript
// complete-workflow.js
const axios = require('axios');
const fs = require('fs');

class StrapiImportExport {
  constructor(strapiUrl, apiToken) {
    this.strapiUrl = strapiUrl;
    this.apiToken = apiToken;
    this.headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async export(contentType, outputFile) {
    const entries = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `${this.strapiUrl}/api/${contentType}`,
        {
          params: {
            'pagination[page]': page,
            'pagination[pageSize]': 100,
            'populate': '*'
          },
          headers: this.headers
        }
      );

      entries.push(...response.data.data);
      hasMore = page < response.data.meta.pagination.pageCount;
      page++;
    }

    fs.writeFileSync(outputFile, JSON.stringify(entries, null, 2));
    console.log(`Exported ${entries.length} entries to ${outputFile}`);
    return entries;
  }

  async import(contentType, inputFile) {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const results = { success: 0, failed: 0, errors: [] };

    for (const entry of data) {
      try {
        await axios.post(
          `${this.strapiUrl}/api/${contentType}`,
          { data: entry.attributes || entry },
          { headers: this.headers }
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id: entry.id, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdate(contentType, updates) {
    const results = { success: 0, failed: 0 };
    
    for (const update of updates) {
      try {
        await axios.put(
          `${this.strapiUrl}/api/${contentType}/${update.id}`,
          { data: update.data },
          { headers: this.headers }
        );
        results.success++;
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  }
}

// Usage
const importer = new StrapiImportExport(
  'http://localhost:1337',
  'your-api-token'
);

// Export
await importer.export('articles', './exports/articles.json');

// Import
const results = await importer.import('articles', './exports/articles.json');
console.log('Import results:', results);
```

---

## References

### Official Strapi Documentation

- [Strapi Data Management Feature](https://docs.strapi.io/cms/features/data-management) - Overview of data management capabilities
- [Strapi Data Export Documentation](https://docs.strapi.io/cms/data-management/export) - Official export command documentation
- [Strapi Data Import Documentation](https://docs.strapi.io/cms/data-management/import) - Official import command documentation
- [Strapi Data Transfer Documentation](https://docs.strapi.io/cms/data-management/transfer) - Transfer data between instances

### API Documentation

- [Strapi REST API Documentation](https://docs.strapi.io/dev-docs/api/rest) - REST API reference
- [Strapi GraphQL API Documentation](https://docs.strapi.io/dev-docs/api/graphql) - GraphQL API reference
- [Strapi Programmatic API](https://docs.strapi.io/dev-docs/backend-customization/programmatic-usage) - Programmatic usage guide

---

## Notes

### Key Takeaways

- Strapi 5 does not have built-in import/export in admin panel
- Use REST API or GraphQL API for import/export operations
- Create custom scripts for bulk operations
- Always backup before bulk operations
- Handle relationships carefully during import
- Test on development environment first

### Important Reminders

- API tokens are required for programmatic access
- Handle pagination for large datasets
- Validate data before import
- Test thoroughly before production use
- Document your import/export workflows

