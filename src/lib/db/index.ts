import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

// Create the connection and drizzle instance only if URL is provided
export const db = databaseUrl ? drizzle(neon(databaseUrl), { schema }) : null;

// Export schema for use in other files
export * from './schema';