import { pgTable, text, timestamp, boolean, integer, serial, varchar, index } from 'drizzle-orm/pg-core';

// Members table - stores all IEEE member data
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  memberNumber: varchar('member_number', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  homeNumber: varchar('home_number', { length: 50 }),
  
  // Membership details
  membershipLevel: varchar('membership_level', { length: 100 }),
  ieeeStatus: varchar('ieee_status', { length: 100 }),
  renewYear: varchar('renew_year', { length: 10 }),
  expiryDate: timestamp('expiry_date'),
  
  // School/Organization details
  region: varchar('region', { length: 100 }),
  section: varchar('section', { length: 100 }),
  schoolSection: varchar('school_section', { length: 100 }),
  schoolName: varchar('school_name', { length: 255 }),
  schoolNumber: varchar('school_number', { length: 50 }),
  grade: varchar('grade', { length: 50 }),
  gender: varchar('gender', { length: 20 }),
  
  // Society and community memberships
  activeSocietyList: text('active_society_list'),
  technicalCommunityList: text('technical_community_list'),
  technicalCouncilList: text('technical_council_list'),
  specialInterestGroupList: text('special_interest_group_list'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  memberNumberIdx: index('member_number_idx').on(table.memberNumber),
  emailIdx: index('email_idx').on(table.email),
  nameIdx: index('name_idx').on(table.firstName, table.lastName),
  schoolIdx: index('school_idx').on(table.schoolName),
  expiryIdx: index('expiry_idx').on(table.expiryDate),
}));

// User roles for Clerk integration
export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'), // 'admin' | 'volunteer' | 'user'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Activity logs for audit trail
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  userEmail: varchar('user_email', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// CSV Upload history
export const uploadHistory = pgTable('upload_history', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  fileName: varchar('file_name', { length: 255 }),
  recordsCount: integer('records_count'),
  status: varchar('status', { length: 50 }).notNull(), // 'success' | 'failed' | 'partial'
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Persistent datasets stored in Vercel Blob
export const datasets = pgTable('datasets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  rowCount: integer('row_count').default(0),
  isActive: boolean('is_active').default(false),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types for the schema
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type UploadHistory = typeof uploadHistory.$inferSelect;
export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;
