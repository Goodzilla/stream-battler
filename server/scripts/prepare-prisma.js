const fs = require('fs');
const path = require('path');

// Load environment variables from .env in the server directory
const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Check the DATABASE_URL environment variable
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // If not set, default to SQLite local file for dev and CI
  databaseUrl = 'file:./dev.db';
  process.env.DATABASE_URL = databaseUrl;
  console.log(`DATABASE_URL not set. Defaulting to: ${databaseUrl}`);
  
  // Write to a temporary .env file so that Prisma CLI can read it
  fs.writeFileSync(envPath, `DATABASE_URL="file:./dev.db"\nJWT_SECRET="dev-super-secret-key-12345!"\n`, 'utf8');
  console.log(`Created temporary .env file at: ${envPath}`);
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
