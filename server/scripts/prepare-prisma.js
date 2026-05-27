const fs = require('fs');
const path = require('path');

// Load environment variables from .env in the server directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Check the DATABASE_URL environment variable
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // If not set, default to SQLite local file for dev and CI
  databaseUrl = 'file:./dev.db';
  process.env.DATABASE_URL = databaseUrl;
  console.log(`DATABASE_URL not set. Defaulting to: ${databaseUrl}`);
}

// Determine provider based on databaseUrl protocol
let provider = 'sqlite';
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  provider = 'postgresql';
}

console.log(`Setting Prisma database provider to: ${provider}`);

// Replace provider in schema.prisma
const providerRegex = /provider\s*=\s*"[^"]*"/g;
// We only want to replace the provider inside the "datasource db" block
const datasourceRegex = /datasource db \{[\s\S]*?\}/;

schema = schema.replace(datasourceRegex, (match) => {
  return match.replace(providerRegex, `provider = "${provider}"`);
});

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Prisma schema updated successfully.');
