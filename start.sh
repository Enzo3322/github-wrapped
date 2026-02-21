#!/bin/sh
# Run drizzle migrations then start the server
node -e "
const Database = require('better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const path = require('path');

const dbPath = (process.env.DATABASE_URL || 'file:./db/github-wrapped.db').replace('file:', '');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: path.join(__dirname, 'drizzle') });
sqlite.close();
console.log('Migrations applied successfully');
"
exec node server.js
