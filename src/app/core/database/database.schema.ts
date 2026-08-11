/** SQLite DDL for customers, addresses, and quotes. */
export const DATABASE_SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    nationalityCode TEXT,
    universityName TEXT,
    universityWebsite TEXT
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerId INTEGER NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    suburb TEXT NOT NULL,
    postalCode TEXT NOT NULL,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerId INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 250),
    status TEXT NOT NULL,
    createdDate TEXT NOT NULL,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
  );
`;
