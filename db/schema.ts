import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const trackers = sqliteTable('trackers', {
  userId: text('user_id').primaryKey(),
  data: text('data').notNull(),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
});

export const studyGroups = sqliteTable('study_groups', {
 id: text('id').primaryKey(), name: text('name').notNull(), description: text('description').notNull().default(''),
 ownerId: text('owner_id').notNull(), inviteCode: text('invite_code').notNull(),
 dailyGoal: integer('daily_goal').notNull().default(120), createdAt: text('created_at').notNull(),
}, t=>[uniqueIndex('study_groups_invite_unique').on(t.inviteCode)]);
export const studyMembers = sqliteTable('study_members', {
 groupId: text('group_id').notNull().references(()=>studyGroups.id,{onDelete:'cascade'}),
 userId: text('user_id').notNull(), memberId: text('member_id').notNull(),
 displayName: text('display_name').notNull(), shareTime: integer('share_time').notNull().default(0),
 focusing: integer('focusing').notNull().default(0), heartbeat: text('heartbeat'), joinedAt: text('joined_at').notNull(),
}, t=>[primaryKey({columns:[t.groupId,t.userId]}),uniqueIndex('study_members_id_unique').on(t.memberId)]);
