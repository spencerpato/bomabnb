import { pgTable, uuid, text, timestamp, boolean, decimal, integer, pgEnum, index, uniqueIndex, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const appRoleEnum = pgEnum('app_role', ['admin', 'partner', 'user', 'referrer']);
export const partnerStatusEnum = pgEnum('partner_status', ['pending', 'active', 'rejected', 'suspended']);
export const propertyTypeEnum = pgEnum('property_type', ['apartment', 'cottage', 'villa', 'guesthouse', 'hostel', 'other']);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phoneNumber: text('phone_number'),
  whatsappNumber: text('whatsapp_number'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  role: appRoleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userRoleIdx: uniqueIndex('user_role_unique').on(table.userId, table.role),
}));

export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  businessName: text('business_name'),
  idPassportNumber: text('id_passport_number'),
  location: text('location').notNull(),
  about: text('about'),
  status: partnerStatusEnum('status').default('pending').notNull(),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  showContactsPublicly: boolean('show_contacts_publicly').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull(),
  propertyName: text('property_name').notNull(),
  propertyType: propertyTypeEnum('property_type').notNull(),
  location: text('location').notNull(),
  googleMapsLink: text('google_maps_link'),
  description: text('description'),
  pricePerNight: decimal('price_per_night', { precision: 10, scale: 2 }).notNull(),
  numberOfUnits: integer('number_of_units').default(1).notNull(),
  maxGuestsPerUnit: integer('max_guests_per_unit').notNull(),
  amenities: text('amenities').array(),
  featuredImage: text('featured_image').notNull(),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  featureStartDate: timestamp('feature_start_date'),
  featureEndDate: timestamp('feature_end_date'),
  termsPolicies: text('terms_policies'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  partnerIdx: index('properties_partner_idx').on(table.partnerId),
  featuredIdx: index('properties_featured_idx').on(table.isFeatured),
  featureDatesIdx: index('properties_feature_dates_idx').on(table.featureStartDate, table.featureEndDate),
}));

export const propertyImages = pgTable('property_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('property_images_property_idx').on(table.propertyId),
}));

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull(),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  guestPhone: text('guest_phone').notNull(),
  checkIn: date('check_in').notNull(),
  checkOut: date('check_out').notNull(),
  numberOfGuests: integer('number_of_guests').notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('bookings_property_idx').on(table.propertyId),
  statusIdx: index('bookings_status_idx').on(table.status),
}));

export const propertyReviews = pgTable('property_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull(),
  userId: uuid('user_id'),
  reviewerName: text('reviewer_name').notNull(),
  reviewerEmail: text('reviewer_email'),
  rating: integer('rating').notNull(),
  reviewText: text('review_text'),
  deviceFingerprint: text('device_fingerprint'),
  isApproved: boolean('is_approved').default(true).notNull(),
  isFlagged: boolean('is_flagged').default(false).notNull(),
  flaggedReason: text('flagged_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('property_reviews_property_idx').on(table.propertyId),
  userIdx: index('property_reviews_user_idx').on(table.userId),
  ratingIdx: index('property_reviews_rating_idx').on(table.rating),
  approvedIdx: index('property_reviews_approved_idx').on(table.isApproved),
}));

export const reviewReplies = pgTable('review_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull(),
  partnerId: uuid('partner_id').notNull(),
  replyText: text('reply_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  reviewIdx: index('review_replies_review_idx').on(table.reviewId),
  partnerIdx: index('review_replies_partner_idx').on(table.partnerId),
}));

export const reviewReports = pgTable('review_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull(),
  reportedBy: uuid('reported_by'),
  reportReason: text('report_reason').notNull(),
  status: text('status').default('pending').notNull(),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
}, (table) => ({
  reviewIdx: index('review_reports_review_idx').on(table.reviewId),
}));

export const featureRequests = pgTable('feature_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull(),
  partnerId: uuid('partner_id').notNull(),
  durationDays: integer('duration_days').notNull(),
  paymentMethod: text('payment_method').notNull(),
  additionalRemarks: text('additional_remarks'),
  status: text('status').default('pending').notNull(),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  partnerIdx: index('feature_requests_partner_idx').on(table.partnerId),
  propertyIdx: index('feature_requests_property_idx').on(table.propertyId),
  statusIdx: index('feature_requests_status_idx').on(table.status),
}));

export const partnerNotifications = pgTable('partner_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').notNull(),
  propertyId: uuid('property_id'),
  type: text('type').default('system').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  status: text('status').default('unread').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  partnerIdx: index('partner_notifications_partner_idx').on(table.partnerId),
  statusIdx: index('partner_notifications_status_idx').on(table.status),
  propertyIdx: index('partner_notifications_property_idx').on(table.propertyId),
}));

export const globalSettings = pgTable('global_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('global_settings_key_idx').on(table.settingKey),
}));

export const referrers = pgTable('referrers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  referralCode: text('referral_code').notNull().unique(),
  businessName: text('business_name'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  status: partnerStatusEnum('status').default('pending').notNull(),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('10.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('referrers_user_idx').on(table.userId),
  codeIdx: uniqueIndex('referrers_code_idx').on(table.referralCode),
}));

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').notNull(),
  partnerId: uuid('partner_id').notNull(),
  referredAt: timestamp('referred_at').defaultNow().notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  referrerIdx: index('referrals_referrer_idx').on(table.referrerId),
  partnerIdx: index('referrals_partner_idx').on(table.partnerId),
}));

export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').notNull(),
  bookingId: uuid('booking_id').notNull(),
  partnerId: uuid('partner_id').notNull(),
  propertyId: uuid('property_id').notNull(),
  bookingAmount: decimal('booking_amount', { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  referrerIdx: index('commissions_referrer_idx').on(table.referrerId),
  bookingIdx: index('commissions_booking_idx').on(table.bookingId),
  statusIdx: index('commissions_status_idx').on(table.status),
}));

export const payoutRequests = pgTable('payout_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentDetails: jsonb('payment_details').notNull(),
  status: text('status').default('pending').notNull(),
  processedBy: uuid('processed_by'),
  processedAt: timestamp('processed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  referrerIdx: index('payout_requests_referrer_idx').on(table.referrerId),
  statusIdx: index('payout_requests_status_idx').on(table.status),
}));
