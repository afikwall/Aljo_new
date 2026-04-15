/**
 * Stores admin-specific profile data linked to the UsersEntity via email. Each record represents one admin user's extended profile. Used to store the admin's phone number for SMS notifications on direct messages.
 */
export interface IAdminProfilesEntity {
  /** Admin's phone number in E.164 format (e.g. +12025551234). Used for SMS notifications when a direct message is sent to this admin.  */
  phone?: string;
  /** The admin user's email address. Used as the foreign key linking to UsersEntity.  */
  email?: string;
  /** Admin's display name shown in the platform UI.  */
  displayName?: string;
}

export const AdminProfilesEntity = {
  tableBlockId: "69c51956792a18ec31893dc6",
  instanceType: {} as IAdminProfilesEntity,
} as const;

/**
 * Stores singleton key-value style settings for the entire app. Each row is a named setting. Used to control feature flags like geotracking. Expected to have very few rows (one per setting).
 */
export interface IAppSettingsEntity {
  /** Human-readable description of what this setting controls  */
  description?: string;
  /** Boolean value of the setting. For geotrackingEnabled: true means GPS clock-in validation is active, false means it is disabled and staff can clock in without location check.  */
  settingValue?: boolean;
  /** Unique key identifying the setting, e.g. 'geotrackingEnabled'  */
  settingKey?: string;
  /** Email of the admin who last changed this setting  */
  updatedByEmail?: string;
}

export const AppSettingsEntity = {
  tableBlockId: "69c51958792a18ec31893e9b",
  instanceType: {} as IAppSettingsEntity,
} as const;

export type BillingRatesEntityRoleTypeEnum = "RN" | "LPN" | "CCA" | "CITR";

/**
 * Stores facility billing rates with multipliers for short notice, holidays, and overtime. Each row represents a unique facility-role combination. The billingRate is highly confidential and should only be visible to admin role. The difference between billingRate and staffRate represents ALJO's margin.
 */
export interface IBillingRatesEntity {
  /** Hourly rate billed to facility in CAD. CONFIDENTIAL: visible to admin only, never to staff or facilities. This is what the facility pays ALJO. The difference between billingRate and staffRate is ALJO's margin.  */
  billingRate?: number;
  /** Reference to Facilities table id  */
  facilityProfileId?: string;
  /** Rate multiplier applied for statutory holidays. Default 1.5 (time and a half). Applied to billing rates.  */
  holidayMultiplier?: number;
  /** Healthcare role type for this rate configuration (RN, LPN, CCA, CITR)  */
  roleType?: BillingRatesEntityRoleTypeEnum;
  /** Rate multiplier applied for overtime hours (typically over 8 hours/day or 40 hours/week). Default 1.5 (time and a half). Applied to billing rates.  */
  overtimeMultiplier?: number;
  /** Rate multiplier applied when shifts are posted less than 24 hours ahead. Default 1.0 (no premium). Example: 1.25 = 25% premium for short notice shifts.  */
  shortNoticeMultiplier?: number;
}

export const BillingRatesEntity = {
  tableBlockId: "69c5194b792a18ec3189316e",
  instanceType: {} as IBillingRatesEntity,
} as const;

/**
 * Stores date ranges that staff members have manually blocked to indicate unavailability. Used by the availability matching system to exclude staff from shift suggestions when they have blocked the shift date. Each record represents a contiguous blocked period with an optional reason.
 */
export interface IBlockedDatesEntity {
  /** Last date of the blocked range (inclusive), stored as a date value in YYYY-MM-DD format. Equal to startDate for single-day blocks.. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  endDate?: string;
  /** Optional free-text reason for blocking these dates (e.g. 'Vacation', 'Medical appointment', 'Family commitment'). Nullable.  */
  reason?: string;
  /** First date of the blocked range (inclusive), stored as a date value in YYYY-MM-DD format. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  startDate?: string;
  /** Email of the staff member who created this blocked date range — used for quick lookups without joining StaffProfiles  */
  staffEmail?: string;
  /** Foreign key reference to StaffProfiles.id — identifies which staff member blocked these dates  */
  staffProfileId?: string;
}

export const BlockedDatesEntity = {
  tableBlockId: "69c51954792a18ec31893c2c",
  instanceType: {} as IBlockedDatesEntity,
} as const;

export type BonusesEntityStatusEnum = "pending" | "paid";

/**
 * Stores bonus payment records awarded by admins to staff members. Each record represents a one-time bonus tied to a staff profile and optionally a pay period. Bonuses are included in payroll calculations when generating timesheets for the relevant period.
 */
export interface IBonusesEntity {
  /** Bonus amount in CAD dollars. Must be a positive number.  */
  amount?: number;
  /** Email of the admin who awarded the bonus  */
  awardedByEmail?: string;
  /** Email of the staff member receiving the bonus, for display and notification purposes  */
  staffEmail?: string;
  /** The end date of the pay period this bonus should be included in (YYYY-MM-DD). Set at award time to the current pay period end.. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  payPeriodEnd?: string;
  /** Status of the bonus: 'pending' (not yet included in payroll), 'paid' (included in a generated payroll run)  */
  status?: BonusesEntityStatusEnum;
  /** Timestamp when the bonus was awarded. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  awardedAt?: string;
  /** Foreign key referencing StaffProfiles.id — the staff member receiving the bonus  */
  staffProfileId?: string;
  /** Admin-provided reason or note for the bonus (e.g. 'Holiday bonus', 'Exceptional performance')  */
  reason?: string;
  /** The start date of the pay period this bonus should be included in (YYYY-MM-DD). Set at award time to the current pay period start.. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  payPeriodStart?: string;
  /** Optional reference to the timesheets record this bonus was included in, set when payroll is generated  */
  timesheetId?: string;
}

export const BonusesEntity = {
  tableBlockId: "69ca992e6dea04fa3094a625",
  instanceType: {} as IBonusesEntity,
} as const;

export type EarlyPayRequestsEntityStatusEnum =
  | "pending"
  | "approved"
  | "denied"
  | "paid";

/**
 * Stores early pay requests submitted by staff members against their earned wages for the current bi-weekly pay period. Each record tracks the requested amount, approval status, reviewer, and payout details. Approved amounts are deducted from the staff member's gross pay when payroll is generated.
 */
export interface IEarlyPayRequestsEntity {
  /** Staff-provided reason for the early pay request (required)  */
  reason?: string;
  /** The pay period start date (YYYY-MM-DD) this request applies to  */
  periodStart?: string;
  /** The pay period end date (YYYY-MM-DD) this request applies to  */
  periodEnd?: string;
  /** Admin-provided reason for denying the request. Only populated when status=denied.  */
  denialReason?: string;
  /** Current status of the early pay request: pending=awaiting review, approved=admin approved, denied=admin denied, paid=included in payroll  */
  status?: EarlyPayRequestsEntityStatusEnum;
  /** Timestamp when the early pay was included in payroll generation. Only populated when status=paid.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  paidAt?: string;
  /** The dollar amount the staff member is requesting as an early pay advance  */
  amountRequested?: number;
  /** Timestamp when the admin reviewed the request. Null until reviewed.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  reviewedAt?: string;
  /** Email of the admin who reviewed (approved or denied) the request. Null until reviewed.  */
  reviewedByEmail?: string;
  /** Foreign key reference to StaffProfiles.id — the staff member making the request  */
  staffProfileId?: string;
  /** Timestamp when the staff member submitted the request. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  requestedAt?: string;
  /** The dollar amount approved by admin (may differ from requested). Null until reviewed.  */
  amountApproved?: number;
}

export const EarlyPayRequestsEntity = {
  tableBlockId: "69c51955792a18ec31893cda",
  instanceType: {} as IEarlyPayRequestsEntity,
} as const;

export type FacilitiesEntityGeofenceModeEnum = "strict" | "flag" | "off";

export type FacilitiesEntityStatusEnum = "active" | "inactive";

/**
 * Stores facility information including contact details, type, and address. Referenced by facility managers and shift listings.
 */
export interface IFacilitiesEntity {
  /** Geofencing enforcement mode: strict blocks clock-in outside radius, flag allows but records exception  */
  geofenceMode?: FacilitiesEntityGeofenceModeEnum;
  /** Primary contact person name at the facility  */
  contactName?: string;
  /** Facility operational status  */
  status?: FacilitiesEntityStatusEnum;
  /** City where facility is located  */
  city?: string;
  /** GPS longitude coordinate for geofencing and location-based clock-in verification  */
  longitude?: number;
  /** Full street address of the facility  */
  address?: string;
  /** Primary contact phone number  */
  contactPhone?: string;
  /** Facility name (e.g., 'St. Mary's Hospital', 'Sunrise Senior Care')  */
  name?: string;
  /** Primary contact email address  */
  contactEmail?: string;
  /** GPS latitude coordinate for geofencing and location-based clock-in verification  */
  latitude?: number;
  /** Internal administrative notes about the facility  */
  notes?: string;
  /** Province where facility is located  */
  province?: string;
  /** Geofence radius in meters for clock-in verification, default 200 meters  */
  geofenceRadius?: number;
  /** Postal code for the facility address  */
  postalCode?: string;
}

export const FacilitiesEntity = {
  tableBlockId: "69c51947792a18ec31892cbf",
  instanceType: {} as IFacilitiesEntity,
} as const;

export type FacilityDocumentsEntityDocumentTypeEnum =
  | "contract"
  | "insurance"
  | "license"
  | "docusign"
  | "other";

/**
 * Each record represents a document uploaded for a specific facility. Linked to Facilities via facilityId. Stores file metadata including S3 URL, document type, expiry date, and uploader email. Used exclusively by admin users to manage facility compliance and contractual documentation.
 */
export interface IFacilityDocumentsEntity {
  /** Original file name as uploaded by the admin, e.g. 'contract_2026.pdf'.  */
  fileName?: string;
  /** S3 URL where the uploaded file is stored. Used to retrieve and display the document.  */
  fileUrl?: string;
  /** Timestamp when the document was uploaded to the system.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  uploadedAt?: string;
  /** Foreign key reference to the Facilities table. Identifies which facility this document belongs to.  */
  facilityId?: string;
  /** Human-readable name for the document, e.g. 'Service Agreement 2026' or 'Liability Insurance Certificate'.  */
  documentName?: string;
  /** Email of the admin user who uploaded the document. References the authenticated user's email.  */
  uploadedByEmail?: string;
  /** Optional expiry date for the document. Used to flag documents that are expiring soon or have already expired. Null if the document does not expire.. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  expiryDate?: string;
  /** Category of the document.  */
  documentType?: FacilityDocumentsEntityDocumentTypeEnum;
  /** Optional free-text notes about the document, e.g. renewal reminders or special conditions.  */
  notes?: string;
}

export const FacilityDocumentsEntity = {
  tableBlockId: "69c51955792a18ec31893d2b",
  instanceType: {} as IFacilityDocumentsEntity,
} as const;

export type FacilityFavoritesEntityPriorityEnum = "preferred" | "regular";

/**
 * Stores facility-staff favorite relationships. When a facility manager marks a staff member as a favorite, they get priority access to new shifts (2-hour head start). Each record is unique per facility-staff pair. Links to Facilities and StaffProfiles.
 */
export interface IFacilityFavoritesEntity {
  /** Email of the facility manager or admin who added this staff member to favorites  */
  addedByEmail?: string;
  /** Timestamp when the staff member was added to favorites. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  addedAt?: string;
  /** Optional notes about why this staff member is a favorite (e.g. 'Great with dementia patients')  */
  notes?: string;
  /** Foreign key reference to Facilities.id — the facility that favorited this staff member  */
  facilityId?: string;
  /** Foreign key reference to StaffProfiles.id — the staff member being favorited  */
  staffProfileId?: string;
  /** Priority level for this favorite: preferred (top tier, gets earliest notifications) or regular (standard favorite)  */
  priority?: FacilityFavoritesEntityPriorityEnum;
}

export const FacilityFavoritesEntity = {
  tableBlockId: "69c5194f792a18ec31893377",
  instanceType: {} as IFacilityFavoritesEntity,
} as const;

export type FacilityManagerProfilesEntityAutoScheduleModeEnum =
  | "favorites_only"
  | "favorites_first"
  | "open_to_all";

/**
 * Stores facility manager specific data linked to Users entity via email. Each manager is associated with one facility.
 */
export interface IFacilityManagerProfilesEntity {
  /** Number of minutes that favorite staff get exclusive access to a new shift before it opens to all eligible staff. Default 120 (2 hours). Only applies when autoScheduleMode = favorites_first.  */
  favoritesHeadStartMinutes?: number;
  /** Timestamp of when the facility manager last opened the Messages inbox. Used to calculate the unread message count badge in the navigation.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  lastViewedMessagesDate?: string;
  /** Direct contact phone number  */
  phone?: string;
  /** Email address linking to Users entity  */
  email?: string;
  /** Whether auto-schedule is enabled for this facility manager's facility. When true, newly posted shifts will automatically assign favorite staff members.  */
  autoScheduleEnabled?: boolean;
  /** Timestamp of when the facility manager last opened the Notifications panel. Used to calculate the unread notification count badge. Null means never viewed (all notifications are unread).. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  lastViewedNotificationsDate?: string;
  /** Auto-schedule mode: favorites_only = only assign from favorites and leave remaining open, favorites_first = favorites get a head start window then opens to all, open_to_all = no auto-assignment, open to all eligible staff immediately.  */
  autoScheduleMode?: FacilityManagerProfilesEntityAutoScheduleModeEnum;
  /** Job title (e.g., 'Director of Nursing', 'HR Manager')  */
  title?: string;
  /** Reference to Facilities table id  */
  facilityProfileId?: string;
}

export const FacilityManagerProfilesEntity = {
  tableBlockId: "69c51948792a18ec31892ccb",
  instanceType: {} as IFacilityManagerProfilesEntity,
} as const;

/**
 * Stores statutory holidays by date and province. Used by payroll and invoice generation to determine if a shift falls on a holiday and apply the appropriate multiplier. Each row represents a single holiday occurrence for a specific year and province.
 */
export interface IHolidaysEntity {
  /** The Canadian province this holiday applies to. Default is 'Nova Scotia'. Allows future multi-province support.  */
  province?: string;
  /** The exact calendar date of the holiday (YYYY-MM-DD). Used for date-matching in payroll lookups.. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  date?: string;
  /** Full name of the statutory holiday (e.g., 'Christmas Day', 'Labour Day')  */
  name?: string;
  /** Pay/billing multiplier applied when a shift falls on this holiday. Default is 1.5 (time and a half). Can be overridden per holiday if needed.  */
  multiplier?: number;
  /** The calendar year of the holiday. Useful for filtering holidays by year.  */
  year?: number;
}

export const HolidaysEntity = {
  tableBlockId: "69c5194c792a18ec318931fe",
  instanceType: {} as IHolidaysEntity,
} as const;

/**
 * undefined
 */
export interface IInvoicesEntityInvoicesEntityLineItemsItemObject {
  /** Reference to the shift this line item bills for  */
  shiftId: string;
  /** Date the shift was worked  */
  date: string;
  /** Role type of staff who worked the shift (RN, LPN, CCA, CITR)  */
  staffRole: string;
  /** Number of hours worked on this shift  */
  hours: number;
  /** Hourly billing rate charged to facility for this shift  */
  billingRate: number;
  /** Total for this line item (hours × billingRate)  */
  lineTotal: number;
}

export type InvoicesEntityInvoiceStatusEnum =
  | "draft"
  | "sent"
  | "paid"
  | "overdue";

/**
 * Stores billing invoices for facilities with period tracking, line items for shifts worked, HST calculations, payment status, and due dates. Each invoice represents a billing period for a specific facility with detailed shift-level line items.
 */
export interface IInvoicesEntity {
  /** Timestamp when the invoice was sent to the facility. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  sentAt?: string;
  /** End date of the billing period covered by this invoice. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  periodEnd?: string;
  /** Array of billing line items, each representing a shift worked with details: shiftId, date, staffRole, hours, billingRate, lineTotal  */
  lineItems?: IInvoicesEntityInvoicesEntityLineItemsItemObject[];
  /** Payment due date (typically Net 30 from sent date). ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  dueDate?: string;
  /** HST tax percentage applied to this invoice (typically 13%)  */
  hstRate?: number;
  /** Start date of the billing period covered by this invoice. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  periodStart?: string;
  /** Sum of all line items before tax (calculated from lineItems)  */
  subtotal?: number;
  /** Timestamp when payment was received from the facility. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  paidAt?: string;
  /** Auto-generated unique invoice number for tracking and reference  */
  invoiceNumber?: string;
  /** Final invoice total including tax (subtotal + hstAmount)  */
  total?: number;
  /** Reference to Facilities table id  */
  facilityProfileId?: string;
  /** Current status of the invoice in the billing lifecycle. draft=generated but not sent, sent=emailed to facility, paid=payment received, overdue=past due date without payment.  */
  invoiceStatus?: InvoicesEntityInvoiceStatusEnum;
  /** Calculated HST amount (subtotal × hstRate / 100)  */
  hstAmount?: number;
}

export const InvoicesEntity = {
  tableBlockId: "69c5194a792a18ec31893062",
  instanceType: {} as IInvoicesEntity,
} as const;

export type MessagesEntityRecipientTypeEnum =
  | "direct"
  | "team"
  | "facility"
  | "shift";

/**
 * Stores all in-app messages including direct messages, facility-wide broadcasts, and shift-specific threads. Supports threading via parentMessageId. recipientType determines the audience scope. isRead tracks per-recipient read status for direct messages. Broadcast messages (team/facility) use recipientType to scope audience.
 */
export interface IMessagesEntity {
  /** Optional subject line for the message thread.  */
  subject?: string;
  /** Reference to parent Messages record id for threading/replies. Null for top-level messages.  */
  parentMessageId?: string;
  /** Scope of the message: direct=1-on-1, team=all staff, facility=all staff at a facility, shift=shift-specific thread.  */
  recipientType?: MessagesEntityRecipientTypeEnum;
  /** Display name of the sender at time of sending.  */
  senderName?: string;
  /** Email of the user who sent the message. Required.  */
  senderEmail?: string;
  /** Reference to Facilities table id. Used for facility-scoped broadcast messages.  */
  facilityId?: string;
  /** Email of the recipient for direct messages. Null for broadcast/group messages.  */
  recipientEmail?: string;
  /** Whether the recipient has read this message. Used for direct messages to track unread status.  */
  isRead?: boolean;
  /** The full text content of the message. Required.  */
  messageBody?: string;
  /** Reference to Shifts table id. Used for shift-specific message threads.  */
  shiftId?: string;
  /** Timestamp when the message was sent. Defaults to current datetime.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  sentAt?: string;
}

export const MessagesEntity = {
  tableBlockId: "69c5194e792a18ec3189330b",
  instanceType: {} as IMessagesEntity,
} as const;

export type NotificationsEntityNotificationTypeEnum =
  | "shift_reminder"
  | "application_update"
  | "document_review"
  | "withdrawal"
  | "no_show"
  | "message"
  | "role_upgrade"
  | "onboarding"
  | "shift_trade"
  | "broadcast";

/**
 * Stores notifications for all users (staff, facility managers, admins). Each row is a notification for a specific recipient identified by email. The createdAt auto-field is used as the notification timestamp. Unread state is tracked via lastViewedNotificationsDate on the user extension entity, not per-row. Supports deep linking via linkUrl.
 */
export interface INotificationsEntity {
  /** Optional type of the related entity (shift, application, document, role_upgrade, etc.) for context.  */
  relatedEntityType?: string;
  /** Short notification headline shown in bold in the notification list.  */
  title?: string;
  /** Category of notification for icon/color styling. One of: shift_reminder, application_update, document_review, withdrawal, no_show, message, role_upgrade, onboarding, shift_trade, broadcast  */
  notificationType?: NotificationsEntityNotificationTypeEnum;
  /** Notification body/detail text. Truncated to 2 lines in the dropdown panel.  */
  body?: string;
  /** Optional ID of the related entity (shift ID, application ID, document ID, etc.) for context.  */
  relatedEntityId?: string;
  /** Email of the user who should receive this notification. Used to filter notifications per user.  */
  recipientEmail?: string;
  /** Optional deep link URL to navigate to when the notification is clicked (e.g. /staff-my-shifts, /admin-applications).  */
  linkUrl?: string;
}

export const NotificationsEntity = {
  tableBlockId: "69c51951792a18ec318935b7",
  instanceType: {} as INotificationsEntity,
} as const;

export type OrientationsEntityStatusEnum =
  | "requested"
  | "scheduled"
  | "completed"
  | "expired"
  | "denied";

/**
 * Stores orientation records linking staff members to facilities. Each record represents a staff member's orientation status at a specific facility. Used by checkEligibility to gate shift applications when requiresOrientation=true on a shift.
 */
export interface IOrientationsEntity {
  /** Foreign key reference to Facilities.id — the facility where orientation took place  */
  facilityId?: string;
  /** Datetime when the orientation was completed. Null if not yet completed.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  completedAt?: string;
  /** Reference to the Shifts record created for the orientation session (isPrivate=true). Used to auto-complete orientation when the shift is clocked out.  */
  orientationShiftId?: string;
  /** Timestamp when the staff member requested orientation at this facility. Set when status transitions to 'requested'.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  requestedAt?: string;
  /** Foreign key reference to StaffProfiles.id — the staff member who was oriented  */
  staffProfileId?: string;
  /** Optional notes about the orientation session, special instructions, or areas covered  */
  notes?: string;
  /** Current status of the orientation record  */
  status?: OrientationsEntityStatusEnum;
  /** Timestamp when the orientation request was denied by the facility manager.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  deniedAt?: string;
  /** Name or email of the person who conducted the orientation (e.g. charge nurse, facility manager)  */
  orientedBy?: string;
  /** Reason provided by the facility manager when denying an orientation request.  */
  denialReason?: string;
}

export const OrientationsEntity = {
  tableBlockId: "69c51953792a18ec31893b2a",
  instanceType: {} as IOrientationsEntity,
} as const;

/**
 * Array of role codes that this role type is allowed to claim shifts for. E.g., RN can claim ['RN','LPN','CCA','CITR']. Used to display claim eligibility rules on the Admin Settings page and enforce shift eligibility.
 */
export interface IRoleTypesEntityClaimableRolesObject {
  /** List of role codes this role can claim shifts for  */
  codes: string[];
}

/**
 * Each row represents a clinical role type (e.g., RN, LPN, CCA, CITR) with a short code used as the enum value across the platform, a full display name, and a description explaining the role's responsibilities and qualifications. Admins can add new role types here for future expansion.
 */
export interface IRoleTypesEntity {
  /** Full display name of the role type (e.g., Registered Nurse, Licensed Practical Nurse).  */
  name?: string;
  /** Whether this role type is currently active and available for use in shift postings and staff profiles. Defaults to true.  */
  isActive?: boolean;
  /** Detailed description of the role's responsibilities, qualifications, and scope of practice within the ALJO CareCrew platform.  */
  description?: string;
  /** Array of role codes that this role type is allowed to claim shifts for. E.g., RN can claim ['RN','LPN','CCA','CITR']. Used to display claim eligibility rules on the Admin Settings page and enforce shift eligibility.  */
  claimableRoles?: IRoleTypesEntityClaimableRolesObject;
  /** Short role code used as enum value across the platform (e.g., RN, LPN, CCA, CITR). Must be unique and uppercase.  */
  code?: string;
}

export const RoleTypesEntity = {
  tableBlockId: "69c5194c792a18ec318931b6",
  instanceType: {} as IRoleTypesEntity,
} as const;

export type RoleUpgradeApplicationsEntityStatusEnum =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type RoleUpgradeApplicationsEntityRequestedRoleEnum =
  | "RN"
  | "LPN"
  | "CCA"
  | "CITR";

/**
 * Stores role upgrade requests from staff members. Each record represents a single application from a staff member to advance to a higher clinical role. Linked to StaffProfiles via staffProfileId. Admins review and approve/reject applications, which triggers a role update in StaffProfiles.
 */
export interface IRoleUpgradeApplicationsEntity {
  /** Optional internal notes added by admin during review. Not visible to staff.  */
  notes?: string;
  /** The staff member's current clinical role at the time of application (e.g. CITR, CCA, LPN, RN).  */
  currentRole?: string;
  /** Timestamp when the application was submitted by the staff member.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  appliedAt?: string;
  /** Email of the admin who reviewed the application. Null until reviewed.  */
  reviewedBy?: string;
  /** Current status of the role upgrade application. Starts as pending, moves to under_review when admin begins review, then approved or rejected.  */
  status?: RoleUpgradeApplicationsEntityStatusEnum;
  /** The reason provided by the admin when rejecting an application. Null for pending or approved applications.  */
  rejectionReason?: string;
  /** Email address of the applying staff member. Denormalized for quick lookup without joining StaffProfiles.  */
  staffEmail?: string;
  /** Timestamp when the application was reviewed (approved or rejected) by an admin. Null until reviewed.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  reviewedAt?: string;
  /** Foreign key reference to the StaffProfiles table id. Links the application to the applying staff member.  */
  staffProfileId?: string;
  /** The clinical role the staff member is applying to upgrade to.  */
  requestedRole?: RoleUpgradeApplicationsEntityRequestedRoleEnum;
}

export const RoleUpgradeApplicationsEntity = {
  tableBlockId: "69c5194d792a18ec318932ae",
  instanceType: {} as IRoleUpgradeApplicationsEntity,
} as const;

export type ShiftApplicationsEntityStatusEnum =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "withdrawal_pending";

/**
 * Tracks applications from staff to shift listings, including status and assignment details.
 */
export interface IShiftApplicationsEntity {
  /** When the staff member applied to this shift. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  appliedAt?: string;
  /** Current status of the application  */
  status?: ShiftApplicationsEntityStatusEnum;
  /** Reference to Shifts table id  */
  shiftProfileId?: string;
  /** When admin or system responded to the application. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  respondedAt?: string;
  /** The reason provided by the staff member when requesting a withdrawal from a shift. Captured from the withdrawal dialog form and displayed to admins on the withdrawal review card.  */
  withdrawalReason?: string;
  /** Reference to the staff member applying  */
  staffProfileId?: string;
}

export const ShiftApplicationsEntity = {
  tableBlockId: "69c51948792a18ec31892e43",
  instanceType: {} as IShiftApplicationsEntity,
} as const;

export type ShiftsEntityRequiredRoleEnum = "RN" | "LPN" | "CCA" | "CITR";

export type ShiftsEntityStatusEnum =
  | "open"
  | "claimed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "assigned";

/**
 * Stores shift opportunities including timing, requirements, and compensation. Created by facility managers and applied to by staff.
 */
export interface IShiftsEntity {
  /** Combined date and time for shift end. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  endDateTime?: string;
  /** The pay/billing multiplier for this shift if it falls on a holiday. Defaults to 1.0 (no multiplier). Set automatically to the holiday's multiplier (e.g. 1.5) when isHoliday is true.  */
  holidayMultiplier?: number;
  /** True if the shift date falls on a statutory holiday. Automatically set by the onShiftCreated workflow by checking the Holidays table.  */
  isHoliday?: boolean;
  /** Reason provided when shift status is changed to cancelled. Nullable for non-cancelled shifts.  */
  cancelledReason?: string;
  /** Healthcare role type required for this shift  */
  requiredRole?: ShiftsEntityRequiredRoleEnum;
  /** Optional notes about orientation requirements for this shift, shown to staff when they view the shift details. Only relevant when requiresOrientation is true.  */
  orientationNotes?: string;
  /** True if shift was posted less than 24 hours before start time (qualifies for short notice pay multiplier)  */
  isShortNotice?: boolean;
  /** The StaffProfiles record ID of the staff member directly assigned to this private shift. Only set when isPrivate=true and the FM uses the 'Assign to Staff' mode. Used to filter the shift into the assigned staff member's My Shifts view.  */
  assignedStaffId?: string;
  /** Whether this shift requires staff to have a completed orientation record at the facility before they can apply. When true, checkEligibility will verify the Orientations table. Defaults to false.  */
  requiresOrientation?: boolean;
  /** Current shift status  */
  status?: ShiftsEntityStatusEnum;
  /** Billing rate (CAD/hr) captured at shift creation time from the billingRates table for this facility+role. Overridable by FM at creation. Used for invoice calculations. Visible to admin and facility managers.  */
  shiftBillingRate?: number;
  /** Reference to Facilities table id  */
  facilityProfileId?: string;
  /** Staff pay rate (CAD/hr) captured at shift creation time from the staffRates table for this facility+role. Overridable by FM at creation. Used for payroll calculations. Visible to admin and staff only.  */
  shiftStaffRate?: number;
  /** Special instructions from facility for this shift  */
  notes?: string;
  /** Number of staff slots that have been filled (claimed) for this shift. Starts at 0, increments each time a staff member claims a slot. When filledCount equals headcount, the shift is considered fully booked.  */
  filledCount?: number;
  /** Number of staff needed for this shift (default 1)  */
  headcount?: number;
  /** When true, this shift is hidden from the general staff marketplace and only visible to specific staff (e.g. favorites or directly assigned). Defaults to false (visible to all eligible staff).  */
  isPrivate?: boolean;
  /** Combined date and time for shift start. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  startDateTime?: string;
}

export const ShiftsEntity = {
  tableBlockId: "69c51948792a18ec31892e38",
  instanceType: {} as IShiftsEntity,
} as const;

export type ShiftTradesEntityStatusEnum =
  | "open"
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "admin_approved";

export type ShiftTradesEntityRequestTypeEnum = "trade" | "giveaway";

/**
 * Stores shift trade and giveaway requests initiated by staff. A trade involves swapping two shifts between staff members; a giveaway is a one-way handoff. Admin approval is required before shifts are reassigned. Links to Shifts (originalShiftId, offeredShiftId) and uses email references for staff.
 */
export interface IShiftTradesEntity {
  /** Optional reason provided by admin when rejecting a trade request  */
  rejectionReason?: string;
  /** Timestamp when a staff member accepted or admin responded to the request. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  respondedAt?: string;
  /** Optional message or reason from the requesting staff member explaining why they need coverage  */
  reason?: string;
  /** ID of the shift the requesting staff member wants to give away or trade  */
  originalShiftId?: string;
  /** Timestamp when the trade request was submitted. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  requestedAt?: string;
  /** Email of the admin or FM who approved or rejected the trade  */
  approvedByEmail?: string;
  /** ID of the shift offered in exchange (only for trade type). Null for giveaway requests.  */
  offeredShiftId?: string;
  /** Email of the staff member who accepted the trade offer (set when status moves to pending)  */
  acceptedByEmail?: string;
  /** Email of the specific staff member targeted for the trade. Null means open to all eligible staff.  */
  targetStaffEmail?: string;
  /** Email of the staff member initiating the trade or giveaway request  */
  originalStaffEmail?: string;
  /** Timestamp when admin approved or rejected the trade. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  approvedAt?: string;
  /** Current status of the trade request. open=visible to eligible staff, pending=staff accepted awaiting admin, accepted/rejected=admin decision, cancelled=requester cancelled, admin_approved=fully approved and shifts reassigned  */
  status?: ShiftTradesEntityStatusEnum;
  /** Type of request: trade means swap two shifts, giveaway means hand off with no return shift  */
  requestType?: ShiftTradesEntityRequestTypeEnum;
}

export const ShiftTradesEntity = {
  tableBlockId: "69c5194f792a18ec318933b0",
  instanceType: {} as IShiftTradesEntity,
} as const;

export type StaffAvailabilityEntityDayOfWeekEnum =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/**
 * Stores each staff member's preferred working schedule by day of week. Each record represents one day's availability window. Used by facility managers when posting shifts to see which staff prefer to work at that time. Staff can still apply for shifts outside their stated availability.
 */
export interface IStaffAvailabilityEntity {
  /** Preferred shift start time in HH:MM 24-hour format (e.g. '07:00'). Represents the earliest time the staff member prefers to start.  */
  startTime?: string;
  /** Email of the staff member. Denormalized for quick lookups without joining StaffProfiles.  */
  staffEmail?: string;
  /** Preferred shift end time in HH:MM 24-hour format (e.g. '19:00'). Represents the latest time the staff member prefers to finish.  */
  endTime?: string;
  /** Day of the week this availability record applies to.  */
  dayOfWeek?: StaffAvailabilityEntityDayOfWeekEnum;
  /** Optional start date from which this availability preference is active. Null means always active.. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  effectiveFrom?: string;
  /** Foreign key reference to StaffProfiles.id. Links this availability record to a specific staff member.  */
  staffProfileId?: string;
  /** Whether the staff member is available on this day at all. If false, they prefer not to work this day regardless of time.  */
  isAvailable?: boolean;
  /** Optional free-text notes about availability for this day (e.g. 'prefer morning shifts only', 'available after 2pm').  */
  notes?: string;
  /** Optional end date until which this availability preference is active. Null means no expiry.. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  effectiveTo?: string;
}

export const StaffAvailabilityEntity = {
  tableBlockId: "69c51950792a18ec318934dd",
  instanceType: {} as IStaffAvailabilityEntity,
} as const;

export type StaffDocumentsEntityDocumentTypeEnum =
  | "contractor_letter"
  | "resume"
  | "nursing_license"
  | "cpr_certification"
  | "liability_coverage"
  | "police_check"
  | "work_permit"
  | "sin_copy"
  | "covid_vaccination"
  | "photo_id"
  | "void_cheque"
  | "cca_certificate"
  | "government_id"
  | "background_check"
  | "tb_test";

export type StaffDocumentsEntityDocumentCategoryEnum =
  | "identification"
  | "medical"
  | "certification"
  | "other";

export type StaffDocumentsEntityReviewStatusEnum =
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired";

/**
 * Stores uploaded compliance documents for staff members with expiry tracking, review status, and admin approval workflow. Links to StaffProfiles via staffProfileId.
 */
export interface IStaffDocumentsEntity {
  /** Type of compliance document uploaded  */
  documentType?: StaffDocumentsEntityDocumentTypeEnum;
  /** Reference to the RoleUpgradeApplications record this document was uploaded for. Null for general compliance documents. Used to associate documents with specific role upgrade applications.  */
  uploadedForApplicationId?: string;
  /** Explanation provided by admin if document was rejected  */
  rejectionReason?: string;
  /** Whether this document is required for compliance. Required documents affect complianceStatus; optional documents do not. Defaults to true for all standard role-based documents.  */
  isRequired?: boolean;
  /** S3 URL of the uploaded document file  */
  fileUrl?: string;
  /** Reference to the staff profile this document belongs to  */
  staffProfileId?: string;
  /** Category grouping for the document. Used to organize documents in the UI. Options: identification, medical, certification, other. Defaults to 'other' for optional uploads.  */
  documentCategory?: StaffDocumentsEntityDocumentCategoryEnum;
  /** Expiration date of the document (if applicable). ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  expiryDate?: string;
  /** Human-readable name for optional/custom documents uploaded by staff (e.g. 'First Aid Certificate', 'Reference Letter'). Only used when documentType is not one of the standard enum values — stored as free text for optional uploads.  */
  customDocumentName?: string;
  /** Current review and validity status of the document  */
  reviewStatus?: StaffDocumentsEntityReviewStatusEnum;
  /** Original file name as uploaded by staff  */
  fileName?: string;
  /** Email of the admin or user who uploaded this document on behalf of the staff member. Null if uploaded by the staff member themselves. Used to track admin-uploaded documents in the role upgrade review flow.  */
  uploadedByEmail?: string;
}

export const StaffDocumentsEntity = {
  tableBlockId: "69c51949792a18ec31892fd5",
  instanceType: {} as IStaffDocumentsEntity,
} as const;

/**
 * undefined
 */
export interface IStaffProfilesEntityStaffProfilesEntityItemsItemObject {
  /** Name of the employer/organization  */
  company: string;
  /** Job title or role held  */
  role: string;
  /** Start date in YYYY-MM format  */
  startDate: string;
  /** End date in YYYY-MM format, or empty if current  */
  endDate?: string;
  /** Whether this is the current employer  */
  isCurrent?: boolean;
  /** Brief description of responsibilities and achievements  */
  description?: string;
}

/**
 * JSON array of previous employer records filled during onboarding or profile editing. Each entry contains company name, role title, start/end dates, and a description of responsibilities.
 */
export interface IStaffProfilesEntityPreviousEmployersObject {
  items?: IStaffProfilesEntityStaffProfilesEntityItemsItemObject[];
}

export type StaffProfilesEntityHighestEducationEnum =
  | "high_school"
  | "college"
  | "diploma"
  | "bachelors"
  | "masters"
  | "doctorate";

export type StaffProfilesEntityPaymentMethodEnum =
  | "direct_deposit"
  | "cheque"
  | "e_transfer";

export type StaffProfilesEntityRoleTypeEnum = "RN" | "LPN" | "CCA" | "CITR";

export type StaffProfilesEntityWorkPermitStatusEnum =
  | "citizen"
  | "permanent_resident"
  | "work_permit";

export type StaffProfilesEntityOnboardingStatusEnum =
  | "incomplete"
  | "pending_review"
  | "approved"
  | "rejected";

/**
 * undefined
 */
export interface IStaffProfilesEntityStaffProfilesEntityProfessionalReferencesItemObject {
  /** Reference's full name  */
  name?: string;
  /** Reference's phone number  */
  phone?: string;
  /** Professional relationship to the staff member  */
  relationship?: string;
}

/**
 * JSON array of professional certifications held by the staff member, each with a name and optional expiry date.
 */
export interface IStaffProfilesEntityCertificationsObject {
  items?: IStaffProfilesEntityStaffProfilesEntityItemsItemObject[];
}

export type StaffProfilesEntityShirtSizeEnum =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL";

export type StaffProfilesEntityComplianceStatusEnum =
  | "compliant"
  | "pending"
  | "expired"
  | "blocked";

/**
 * undefined
 */
export interface IStaffProfilesEntityStaffProfilesEntityPreferredAvailabilityItemObject {
  /** Day of the week, e.g. Mon, Tue  */
  day?: string;
  /** Shift preference: day, evening, or night  */
  shift?: string;
}

/**
 * Stores staff-specific data including credentials, specialties, and availability. Linked to Users entity via email.
 */
export interface IStaffProfilesEntity {
  /** Tracks how many approved withdrawals this staff member has had. Incremented each time a withdrawal request is approved. Used to flag frequent withdrawers (>= 3) for admin review.  */
  withdrawalCount?: number;
  /** JSON array of previous employer records filled during onboarding or profile editing. Each entry contains company name, role title, start/end dates, and a description of responsibilities.  */
  previousEmployers?: IStaffProfilesEntityPreviousEmployersObject;
  /** Phone number of emergency contact person  */
  emergencyContactPhone?: string;
  /** Total years of healthcare experience declared by the staff member during onboarding or profile editing. Used for quick reference alongside the detailed previousEmployers list.  */
  totalHealthcareYears?: number;
  /** Short 'about me' description written by the staff member  */
  bio?: string;
  /** URL to the staff member's avatar/profile photo image  */
  profilePhotoUrl?: string;
  /** JSON array of languages spoken by the staff member, e.g. ["English", "French"]  */
  languages?: string[];
  /** Province of residence for the staff member  */
  province?: string;
  /** Highest level of education completed by the staff member. Used in profile display and career advancement context.  */
  highestEducation?: StaffProfilesEntityHighestEducationEnum;
  /** City of residence for the staff member  */
  city?: string;
  /** Preferred payment method for payroll. Options: direct_deposit, cheque, e_transfer. Defaults to direct_deposit.  */
  paymentMethod?: StaffProfilesEntityPaymentMethodEnum;
  /** Date of birth for age verification and compliance requirements. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  dateOfBirth?: string;
  /** Staff member's first name  */
  firstName?: string;
  /** Healthcare role type - structured classification of staff member's professional role  */
  roleType?: StaffProfilesEntityRoleTypeEnum;
  /** Name of the educational institution where the highest degree was obtained (e.g. Dalhousie University, NSCC).  */
  institution?: string;
  /** Number of years of professional healthcare experience  */
  yearsOfExperience?: number;
  /** Staff member's street address for contact and payroll purposes  */
  streetAddress?: string;
  /** Work authorization status of the staff member  */
  workPermitStatus?: StaffProfilesEntityWorkPermitStatusEnum;
  /** Onboarding progress tracking - staff must be approved before they can claim shifts  */
  onboardingStatus?: StaffProfilesEntityOnboardingStatusEnum;
  /** JSON array of professional references with name, phone, and relationship  */
  professionalReferences?: IStaffProfilesEntityStaffProfilesEntityProfessionalReferencesItemObject[];
  /** JSON array of professional certifications held by the staff member, each with a name and optional expiry date.  */
  certifications?: IStaffProfilesEntityCertificationsObject;
  /** Whether the staff member has explicitly saved their weekly availability preferences. False by default until they save their first availability schedule. Used by admin to see which staff have configured their availability.  */
  isAvailabilitySet?: boolean;
  /** Year the staff member graduated from their highest education program (e.g. 2018).  */
  graduationYear?: number;
  /** Bank transit/routing number for direct deposit setup. Stored securely and displayed masked in the UI.  */
  bankTransitNumber?: string;
  /** Timestamp of when the staff member last opened the Notifications panel. Used to calculate the unread notification count badge. Null means never viewed (all notifications are unread).. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  lastViewedNotificationsDate?: string;
  /** Contact phone number  */
  phone?: string;
  /** Calculated average of all ratings received from facility managers. Updated automatically each time a new rating is submitted. Displayed as stars (e.g. 4.7) on staff profile and admin views.  */
  averageRating?: number;
  /** Last 4 digits of the staff member's bank account number for verification purposes. Stored masked for security.  */
  bankAccountLast4?: string;
  /** Postal code of the staff member's address  */
  postalCode?: string;
  /** Name of the staff member's bank for direct deposit (e.g., TD Canada Trust, RBC). Only relevant when paymentMethod = direct_deposit.  */
  bankName?: string;
  /** Staff member's shirt size for uniform ordering  */
  shirtSize?: StaffProfilesEntityShirtSizeEnum;
  /** Social Insurance Number (SIN) for payroll and tax purposes — stored securely  */
  sinNumber?: string;
  /** Current compliance status based on document expiry and requirements - determines if staff can work shifts  */
  complianceStatus?: StaffProfilesEntityComplianceStatusEnum;
  /** Timestamp of when the staff member last opened the Messages inbox. Used to calculate the unread message count badge in the navigation.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  lastViewedMessagesDate?: string;
  /** List of facility IDs  */
  orientedFacilityIds?: string[];
  /** Total count of ratings received by this staff member. Used alongside averageRating to show credibility (e.g. '4.7 stars from 23 ratings').  */
  totalRatings?: number;
  /** JSON array of preferred availability slots, e.g. [{"day":"Mon","shift":"day"}]  */
  preferredAvailability?: IStaffProfilesEntityStaffProfilesEntityPreferredAvailabilityItemObject[];
  /** JSON array of special clinical skills, e.g. ["Wound Care", "Dementia Care", "IV Certified"]  */
  specialSkills?: string[];
  /** Staff member's last name  */
  lastName?: string;
  /** Email address linking to Users entity  */
  email?: string;
  /** Full name of emergency contact person  */
  emergencyContactName?: string;
}

export const StaffProfilesEntity = {
  tableBlockId: "69c51948792a18ec31892dc0",
  instanceType: {} as IStaffProfilesEntity,
} as const;

export type StaffRatesEntityRoleTypeEnum = "RN" | "LPN" | "CCA" | "CITR";

/**
 * Stores staff compensation rates with multipliers for short notice, holidays, and overtime. Each row represents a unique facility-role combination. The staffRate is confidential and should only be visible to admin and staff roles, never to facility managers.
 */
export interface IStaffRatesEntity {
  /** Rate multiplier applied for statutory holidays. Default 1.5 (time and a half). Applied to staff rates.  */
  holidayMultiplier?: number;
  /** Rate multiplier applied when shifts are posted less than 24 hours ahead. Default 1.0 (no premium). Example: 1.25 = 25% premium for short notice shifts.  */
  shortNoticeMultiplier?: number;
  /** Reference to Facilities table id  */
  facilityProfileId?: string;
  /** Healthcare role type for this rate configuration (RN, LPN, CCA, CITR)  */
  roleType?: StaffRatesEntityRoleTypeEnum;
  /** Hourly rate paid to staff in CAD. CONFIDENTIAL: visible to admin + staff only, never to facilities. This is what ALJO pays the worker.  */
  staffRate?: number;
  /** Rate multiplier applied for overtime hours (typically over 8 hours/day or 40 hours/week). Default 1.5 (time and a half). Applied to staff rates.  */
  overtimeMultiplier?: number;
}

export const StaffRatesEntity = {
  tableBlockId: "69c5194b792a18ec31893159",
  instanceType: {} as IStaffRatesEntity,
} as const;

/**
 * Stores per-shift ratings from facility managers for staff members. Each record represents one rating event tied to a specific shift and facility. Supports overall rating plus optional breakdown scores. Links to StaffProfiles, Shifts, and Facilities.
 */
export interface IStaffRatingsEntity {
  /** Optional sub-score for clinical skills (1-5): competency and quality of care provided  */
  clinicalSkills?: number;
  /** Foreign key reference to Shifts.id — the specific shift this rating is for  */
  shiftId?: string;
  /** Foreign key reference to StaffProfiles.id — the staff member being rated  */
  staffProfileId?: string;
  /** Timestamp when the rating was submitted, defaults to current time. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  ratedAt?: string;
  /** Optional sub-score for reliability (1-5): did the staff show up on time and complete the shift  */
  reliabilityScore?: number;
  /** Optional sub-score for professionalism (1-5): conduct, communication, and attitude  */
  professionalism?: number;
  /** Email of the facility manager or admin who submitted this rating  */
  ratedByEmail?: string;
  /** Foreign key reference to Facilities.id — the facility where the shift took place  */
  facilityId?: string;
  /** Overall rating score from 1 to 5 stars (required)  */
  rating?: number;
  /** Optional free-text comment from the rater about the staff member's performance  */
  comment?: string;
}

export const StaffRatingsEntity = {
  tableBlockId: "69c5194e792a18ec31893356",
  instanceType: {} as IStaffRatingsEntity,
} as const;

export type TimeLogsEntityGeofenceStatusEnum =
  | "within"
  | "outside_flagged"
  | "outside_blocked";

/**
 * Stores clock in/out timestamps with GPS coordinates for geofence verification. Tracks staff attendance at facilities with automatic break deductions and total hours calculations. Links to ShiftListings, StaffProfiles, and Facilities for complete shift tracking.
 */
export interface ITimeLogsEntity {
  /** True if an admin manually adjusted the clock-in time, clock-out time, or break minutes for this time log. Used to flag records that differ from the original GPS-recorded times.  */
  adminAdjusted?: boolean;
  /** Timestamp when staff clocked in to start the shift. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  clockInTime?: string;
  /** GPS longitude coordinate at clock-in for geofence verification  */
  clockInLng?: number;
  /** Calculated total hours worked: (clockOut - clockIn - break) in hours  */
  totalHours?: number;
  /** GPS latitude coordinate at clock-out for geofence verification  */
  clockOutLat?: number;
  /** Reference to Shifts table id  */
  shiftProfileId?: string;
  /** Flag set to true when staff clocked out more than 30 minutes after shift.endDateTime. Flagged for admin review but clock-out is still allowed.  */
  lateClockOutFlagged?: boolean;
  /** GPS longitude coordinate at clock-out for geofence verification  */
  clockOutLng?: number;
  /** Reference to the staff member who clocked in/out  */
  staffProfileId?: string;
  /** Flag set to true when the raw hours worked exceed the scheduled shift duration. Total hours are capped at the scheduled duration for pay purposes.  */
  overtimeFlagged?: boolean;
  /** Admin notes explaining why the time log was adjusted (e.g. 'Staff forgot to clock out - adjusted to shift end time'). Only populated when adminAdjusted is true.  */
  adjustmentNotes?: string;
  /** Flag set to true when the system automatically clocked out the staff member because no clock-out was recorded within 2 hours after shift.endDateTime. The clockOutTime is set to shift.endDateTime in this case.  */
  autoClockOut?: boolean;
  /** When true, this time log has been approved by an admin and is permanently locked from editing by both admin and staff. Set to true via the Approve button in AdminTimesheet. Cannot be reversed through the UI.  */
  isApproved?: boolean;
  /** GPS latitude coordinate at clock-in for geofence verification  */
  clockInLat?: number;
  /** Flag set to true if staff clocked out while outside the facility geofence radius. Allows clock-out to proceed but records the anomaly for review.  */
  clockOutOutsideGeofence?: boolean;
  /** The scheduled shift duration in hours (endDateTime - startDateTime). Used to cap totalHours and detect overtime.  */
  scheduledHours?: number;
  /** Auto-calculated break deduction in minutes based on shift duration  */
  breakMinutes?: number;
  /** Flag set to true if a clock-in attempt was blocked because the staff member tried to clock in more than 30 minutes after the shift start time.  */
  isLateBlocked?: boolean;
  /** Indicates whether clock-in was within the facility's geofence boundary  */
  geofenceStatus?: TimeLogsEntityGeofenceStatusEnum;
  /** Timestamp when staff clocked out to end the shift. Null until they clock out.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  clockOutTime?: string;
}

export const TimeLogsEntity = {
  tableBlockId: "69c51949792a18ec31893029",
  instanceType: {} as ITimeLogsEntity,
} as const;

export type TimesheetsEntityPaymentStatusEnum = "pending" | "approved" | "paid";

/**
 * Stores payroll records for staff payments with references to staff profiles, facilities, shifts, and time logs. Tracks pay periods, hours worked, rates, multipliers, gross pay calculations, payment status, and early pay requests. Each record represents a payroll entry for a specific shift worked by staff.
 */
export interface ITimesheetsEntity {
  /** Email of the admin who approved this timesheet entry. Null until approved.  */
  approvedByEmail?: string;
  /** Reference to Time Logs table id  */
  timeLogProfileId?: string;
  /** Staff hourly rate applied for this shift  */
  hourlyRate?: number;
  /** Calculated gross pay: totalHours × hourlyRate × multiplier  */
  grossPay?: number;
  /** Timestamp when this timesheet was marked as paid by admin. Null until paymentStatus transitions to 'paid'. Used for audit trail and payment reporting.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  paidAt?: string;
  /** Reference to Shifts table id  */
  shiftProfileId?: string;
  /** Timestamp when this timesheet was approved by admin. Null until paymentStatus transitions to 'approved'. Used for audit trail.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  approvedAt?: string;
  /** Current payment status of this timesheet entry  */
  paymentStatus?: TimesheetsEntityPaymentStatusEnum;
  /** Reference to Facilities table id  */
  facilityProfileId?: string;
  /** Pay period start date for this timesheet entry. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  periodStart?: string;
  /** Admin-provided note explaining any manual edits to totalHours or hourlyRate before approval. Required when admin edits a timesheet row.  */
  adjustmentNote?: string;
  /** Rate multiplier applied (e.g., 1.5 for short notice, 2.0 for holidays)  */
  multiplier?: number;
  /** Total hours worked during this shift (from time log)  */
  totalHours?: number;
  /** Pay period end date for this timesheet entry. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  periodEnd?: string;
  /** Reference to the staff member who worked the shift  */
  staffProfileId?: string;
}

export const TimesheetsEntity = {
  tableBlockId: "69c51949792a18ec3189304a",
  instanceType: {} as ITimesheetsEntity,
} as const;

/**
 * undefined
 */
export interface IUsersEntity {
  /** User name  */
  name?: string;
  /** First name  */
  firstName?: string;
  /** Last name  */
  lastName?: string;
  /** Email address  */
  email?: string;
  /** Profile image URL  */
  profileImageUrl?: string;
}

export const UsersEntity = {
  tableBlockId: "68760b42d4ce152c91ce0e1c",
  instanceType: {} as IUsersEntity,
} as const;

export const AdminApplicationsPage = {
  pageBlockId: "69c5194c792a18ec318931d4",
  pageName: "AdminApplications",
} as const;

export const AdminDashboardPage = {
  pageBlockId: "69c5194b792a18ec3189313e",
  pageName: "AdminDashboard",
} as const;

export const AdminFacilityManagementPage = {
  pageBlockId: "69c5194b792a18ec3189314a",
  pageName: "AdminFacilityManagement",
} as const;

export const AdminHelpPage = {
  pageBlockId: "69c51956792a18ec31893d79",
  pageName: "AdminHelp",
} as const;

export const AdminInvoicesPage = {
  pageBlockId: "69c51953792a18ec31893bed",
  pageName: "AdminInvoices",
} as const;

export const AdminMessagesPage = {
  pageBlockId: "69c5194e792a18ec31893338",
  pageName: "AdminMessages",
} as const;

export const AdminPayrollPage = {
  pageBlockId: "69c51953792a18ec31893bd5",
  pageName: "AdminPayroll",
} as const;

export const AdminReportsPage = {
  pageBlockId: "69c51950792a18ec318934c2",
  pageName: "AdminReports",
} as const;

export const AdminSettingsPage = {
  pageBlockId: "69c5194c792a18ec318931c5",
  pageName: "AdminSettings",
} as const;

export const AdminShiftManagementPage = {
  pageBlockId: "69c51955792a18ec31893ccb",
  pageName: "AdminShiftManagement",
} as const;

export const AdminStaffManagementPage = {
  pageBlockId: "69c5194b792a18ec31893141",
  pageName: "AdminStaffManagement",
} as const;

export const AdminTimesheetPage = {
  pageBlockId: "69c51957792a18ec31893e74",
  pageName: "AdminTimesheet",
} as const;

export const FacilityDashboardPage = {
  pageBlockId: "69c5194b792a18ec3189314d",
  pageName: "FacilityDashboard",
} as const;

export const FacilityManagerHelpPage = {
  pageBlockId: "69c51956792a18ec31893d7c",
  pageName: "FacilityManagerHelp",
} as const;

export const FacilityPostShiftPage = {
  pageBlockId: "69c5194b792a18ec31893150",
  pageName: "FacilityPostShift",
} as const;

export const FMInvoicesPage = {
  pageBlockId: "69c51955792a18ec31893d1f",
  pageName: "FMInvoices",
} as const;

export const FMMessagesPage = {
  pageBlockId: "69c5194e792a18ec3189333b",
  pageName: "FMMessages",
} as const;

export const FMTimesheetPage = {
  pageBlockId: "69c51957792a18ec31893e6e",
  pageName: "FMTimesheet",
} as const;

export const LoginPage = {
  pageBlockId: "69c51948792a18ec31892e73",
  pageName: "Login",
} as const;

export const NotificationsPage = {
  pageBlockId: "69c51952792a18ec31893a2d",
  pageName: "Notifications",
} as const;

export const ProfilePage = {
  pageBlockId: "69c51948792a18ec31892e52",
  pageName: "Profile",
} as const;

export const StaffAvailableShiftsPage = {
  pageBlockId: "69c5194a792a18ec318930dd",
  pageName: "StaffAvailableShifts",
} as const;

export const StaffCareerPathPage = {
  pageBlockId: "69c5194e792a18ec31893308",
  pageName: "StaffCareerPath",
} as const;

export const StaffDashboardPage = {
  pageBlockId: "69c5194b792a18ec31893153",
  pageName: "StaffDashboard",
} as const;

export const StaffHelpPage = {
  pageBlockId: "69c51956792a18ec31893d7f",
  pageName: "StaffHelp",
} as const;

export const StaffHolidaysPage = {
  pageBlockId: "69c5194e792a18ec318932f6",
  pageName: "StaffHolidays",
} as const;

export const StaffMessagesPage = {
  pageBlockId: "69c5194e792a18ec31893335",
  pageName: "StaffMessages",
} as const;

export const StaffMyDocumentsPage = {
  pageBlockId: "69c5194c792a18ec318931cb",
  pageName: "StaffMyDocuments",
} as const;

export const StaffMyPayrollsPage = {
  pageBlockId: "69cab2f02ca87550fcc5f924",
  pageName: "StaffMyPayrolls",
} as const;

export const StaffMyProfilePage = {
  pageBlockId: "69c5194c792a18ec318931b3",
  pageName: "StaffMyProfile",
} as const;

export const StaffMyShiftsPage = {
  pageBlockId: "69c5194a792a18ec318930e0",
  pageName: "StaffMyShifts",
} as const;

export const StaffSchedulePage = {
  pageBlockId: "69c51954792a18ec31893c3e",
  pageName: "StaffSchedule",
} as const;

export const StaffTimesheetPage = {
  pageBlockId: "69c51957792a18ec31893e62",
  pageName: "StaffTimesheet",
} as const;

export type AdminAssignStaffToShiftActionInputActionEnum =
  | "assign"
  | "unassign";

/**
 * AdminAssignStaffToShift input payload
 */
export interface IAdminAssignStaffToShiftActionInput {
  /** Whether to assign or unassign the staff member  */
  action: AdminAssignStaffToShiftActionInputActionEnum;
  /** The ID of the Shifts record  */
  shiftId: string;
  /** Email of the admin performing the assignment  */
  adminEmail: string;
  /** The ID of the StaffProfiles record to assign (required for assign action)  */
  staffProfileId?: string;
}

/**
 * AdminAssignStaffToShift output payload
 */
export interface IAdminAssignStaffToShiftActionOutput {
  /** Human-readable result message  */
  message: string;
  /** Whether the operation was successful  */
  success: boolean;
}

/**
 * AdminAssignStaffToShiftAction
 * Execute code action
 */
export const AdminAssignStaffToShiftAction = {
  actionBlockId: "69c51955792a18ec31893cc8",

  inputInstanceType: {} as IAdminAssignStaffToShiftActionInput,
  outputInstanceType: {} as IAdminAssignStaffToShiftActionOutput,
} as const;

/**
 * approveRoleUpgrade input payload
 */
export interface IApproveRoleUpgradeActionInput {
  /** The new role to assign to the staff member (RN, LPN, CCA, CITR)  */
  newRole: string;
  /** The ID of the RoleUpgradeApplications record to approve  */
  applicationId: string;
  /** The ID of the StaffProfiles record to update with the new role  */
  staffProfileId: string;
  /** Email of the admin approving the application  */
  reviewedByEmail: string;
}

/**
 * approveRoleUpgrade output payload
 */
export interface IApproveRoleUpgradeActionOutput {
  /** The new role assigned to the staff member  */
  newRole: string;
  /** Whether the approval was successful  */
  success: boolean;
}

/**
 * approveRoleUpgradeAction
 * Execute code action
 */
export const ApproveRoleUpgradeAction = {
  actionBlockId: "69c5194e792a18ec318932cf",

  inputInstanceType: {} as IApproveRoleUpgradeActionInput,
  outputInstanceType: {} as IApproveRoleUpgradeActionOutput,
} as const;

/**
 * ApproveWithdrawal input payload
 */
export interface IApproveWithdrawalActionInput {
  /** The ID of the ShiftApplication record with status withdrawal_pending  */
  applicationId: string;
  /** The ID of the linked Shift record  */
  shiftId: string;
  /** The ID of the StaffProfile record for the withdrawing staff member  */
  staffProfileId: string;
  /** The current withdrawalCount value from the staff profile, to increment by 1  */
  currentWithdrawalCount?: number;
  /** The current filledCount on the shift, to decrement by 1 (default: 1) */
  currentFilledCount?: number;
}

/**
 * The item updated in the table, keys are the column names, values are the column values
 */
export interface IApproveWithdrawalActionOutputApproveWithdrawalActionOutputItemsItemObject {
  /** The id of the item to update. Must be an existing id in the table.  */
  id?: string;
  /** Item created at. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  createdAt?: string;
  /** Item updated at. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  updatedAt?: string;
  /** Item created by user id  */
  createdBy?: string;
  /** Item updated by user id  */
  updatedBy?: string;
  /** Item updated by agent id  */
  updatedByAgentId?: string;
  /** Item tenant id  */
  tenantId?: string;
  /** Tracks how many approved withdrawals this staff member has had. Incremented each time a withdrawal request is approved. Used to flag frequent withdrawers (>= 3) for admin review.  */
  withdrawalCount?: number;
  /** JSON array of previous employer records filled during onboarding or profile editing. Each entry contains company name, role title, start/end dates, and a description of responsibilities.  */
  previousEmployers?: IApproveWithdrawalActionOutputPreviousEmployersObject;
  /** Phone number of emergency contact person  */
  emergencyContactPhone?: string;
  /** Total years of healthcare experience declared by the staff member during onboarding or profile editing. Used for quick reference alongside the detailed previousEmployers list.  */
  totalHealthcareYears?: number;
  /** Short 'about me' description written by the staff member  */
  bio?: string;
  /** URL to the staff member's avatar/profile photo image  */
  profilePhotoUrl?: string;
  /** JSON array of languages spoken by the staff member, e.g. ["English", "French"]  */
  languages?: string[];
  /** Province of residence for the staff member  */
  province?: string;
  /** Highest level of education completed by the staff member. Used in profile display and career advancement context.  */
  highestEducation?: ApproveWithdrawalActionOutputHighestEducationEnum;
  /** City of residence for the staff member  */
  city?: string;
  /** Preferred payment method for payroll. Options: direct_deposit, cheque, e_transfer. Defaults to direct_deposit.  */
  paymentMethod?: ApproveWithdrawalActionOutputPaymentMethodEnum;
  /** Date of birth for age verification and compliance requirements. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  dateOfBirth?: string;
  /** Staff member's first name  */
  firstName?: string;
  /** Healthcare role type - structured classification of staff member's professional role  */
  roleType?: ApproveWithdrawalActionOutputRoleTypeEnum;
  /** Name of the educational institution where the highest degree was obtained (e.g. Dalhousie University, NSCC).  */
  institution?: string;
  /** Number of years of professional healthcare experience  */
  yearsOfExperience?: number;
  /** Staff member's street address for contact and payroll purposes  */
  streetAddress?: string;
  /** Work authorization status of the staff member  */
  workPermitStatus?: ApproveWithdrawalActionOutputWorkPermitStatusEnum;
  /** Onboarding progress tracking - staff must be approved before they can claim shifts  */
  onboardingStatus?: ApproveWithdrawalActionOutputOnboardingStatusEnum;
  /** JSON array of professional references with name, phone, and relationship  */
  professionalReferences?: IApproveWithdrawalActionOutputApproveWithdrawalActionOutputProfessionalReferencesItemObject[];
  /** JSON array of professional certifications held by the staff member, each with a name and optional expiry date.  */
  certifications?: IApproveWithdrawalActionOutputCertificationsObject;
  /** Whether the staff member has explicitly saved their weekly availability preferences. False by default until they save their first availability schedule. Used by admin to see which staff have configured their availability.  */
  isAvailabilitySet?: boolean;
  /** Year the staff member graduated from their highest education program (e.g. 2018).  */
  graduationYear?: number;
  /** Bank transit/routing number for direct deposit setup. Stored securely and displayed masked in the UI.  */
  bankTransitNumber?: string;
  /** Timestamp of when the staff member last opened the Notifications panel. Used to calculate the unread notification count badge. Null means never viewed (all notifications are unread).. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  lastViewedNotificationsDate?: string;
  /** Contact phone number  */
  phone?: string;
  /** Calculated average of all ratings received from facility managers. Updated automatically each time a new rating is submitted. Displayed as stars (e.g. 4.7) on staff profile and admin views.  */
  averageRating?: number;
  /** Last 4 digits of the staff member's bank account number for verification purposes. Stored masked for security.  */
  bankAccountLast4?: string;
  /** Postal code of the staff member's address  */
  postalCode?: string;
  /** Name of the staff member's bank for direct deposit (e.g., TD Canada Trust, RBC). Only relevant when paymentMethod = direct_deposit.  */
  bankName?: string;
  /** Staff member's shirt size for uniform ordering  */
  shirtSize?: ApproveWithdrawalActionOutputShirtSizeEnum;
  /** Social Insurance Number (SIN) for payroll and tax purposes — stored securely  */
  sinNumber?: string;
  /** Current compliance status based on document expiry and requirements - determines if staff can work shifts  */
  complianceStatus?: ApproveWithdrawalActionOutputComplianceStatusEnum;
  /** Timestamp of when the staff member last opened the Messages inbox. Used to calculate the unread message count badge in the navigation.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  lastViewedMessagesDate?: string;
  /** List of facility IDs  */
  orientedFacilityIds?: string[];
  /** Total count of ratings received by this staff member. Used alongside averageRating to show credibility (e.g. '4.7 stars from 23 ratings').  */
  totalRatings?: number;
  /** JSON array of preferred availability slots, e.g. [{"day":"Mon","shift":"day"}]  */
  preferredAvailability?: IApproveWithdrawalActionOutputApproveWithdrawalActionOutputPreferredAvailabilityItemObject[];
  /** JSON array of special clinical skills, e.g. ["Wound Care", "Dementia Care", "IV Certified"]  */
  specialSkills?: string[];
  /** Staff member's last name  */
  lastName?: string;
  /** Email address linking to Users entity  */
  email?: string;
  /** Full name of emergency contact person  */
  emergencyContactName?: string;
}

/**
 * JSON array of previous employer records filled during onboarding or profile editing. Each entry contains company name, role title, start/end dates, and a description of responsibilities.
 */
export interface IApproveWithdrawalActionOutputPreviousEmployersObject {
  items?: IApproveWithdrawalActionOutputApproveWithdrawalActionOutputItemsItemObject[];
}

export type ApproveWithdrawalActionOutputHighestEducationEnum =
  | "high_school"
  | "college"
  | "diploma"
  | "bachelors"
  | "masters"
  | "doctorate";

export type ApproveWithdrawalActionOutputPaymentMethodEnum =
  | "direct_deposit"
  | "cheque"
  | "e_transfer";

export type ApproveWithdrawalActionOutputRoleTypeEnum =
  | "RN"
  | "LPN"
  | "CCA"
  | "CITR";

export type ApproveWithdrawalActionOutputWorkPermitStatusEnum =
  | "citizen"
  | "permanent_resident"
  | "work_permit";

export type ApproveWithdrawalActionOutputOnboardingStatusEnum =
  | "incomplete"
  | "pending_review"
  | "approved"
  | "rejected";

/**
 * undefined
 */
export interface IApproveWithdrawalActionOutputApproveWithdrawalActionOutputProfessionalReferencesItemObject {
  /** Reference's full name  */
  name?: string;
  /** Reference's phone number  */
  phone?: string;
  /** Professional relationship to the staff member  */
  relationship?: string;
}

/**
 * JSON array of professional certifications held by the staff member, each with a name and optional expiry date.
 */
export interface IApproveWithdrawalActionOutputCertificationsObject {
  items?: IApproveWithdrawalActionOutputApproveWithdrawalActionOutputItemsItemObject[];
}

export type ApproveWithdrawalActionOutputShirtSizeEnum =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL";

export type ApproveWithdrawalActionOutputComplianceStatusEnum =
  | "compliant"
  | "pending"
  | "expired"
  | "blocked";

/**
 * undefined
 */
export interface IApproveWithdrawalActionOutputApproveWithdrawalActionOutputPreferredAvailabilityItemObject {
  /** Day of the week, e.g. Mon, Tue  */
  day?: string;
  /** Shift preference: day, evening, or night  */
  shift?: string;
}

/**
 * ApproveWithdrawal output payload
 */
export interface IApproveWithdrawalActionOutput {
  /** The items updated in the table  */
  items: IApproveWithdrawalActionOutputApproveWithdrawalActionOutputItemsItemObject[];
}

/**
 * ApproveWithdrawalAction
 * Approves a staff withdrawal request. Sets the ShiftApplication status to 'withdrawn', sets the linked Shift status back to 'open', decrements filledCount on the shift, and increments the staff member's withdrawalCount.
 */
export const ApproveWithdrawalAction = {
  actionBlockId: "69c5194d792a18ec31893263",

  inputInstanceType: {} as IApproveWithdrawalActionInput,
  outputInstanceType: {} as IApproveWithdrawalActionOutput,
} as const;

export type AutoAssignFavoritesToShiftActionInputRequiredRoleEnum =
  | "RN"
  | "LPN"
  | "CCA"
  | "CITR";

/**
 * AutoAssignFavoritesToShift input payload
 */
export interface IAutoAssignFavoritesToShiftActionInput {
  /** The ID of the shift to auto-assign favorites to  */
  shiftId: string;
  /** Total number of staff slots for this shift  */
  headcount: number;
  /** The facility ID to look up favorites for  */
  facilityId: string;
  /** Shift end datetime ISO string  */
  endDateTime: string;
  /** The role required for the shift  */
  requiredRole: AutoAssignFavoritesToShiftActionInputRequiredRoleEnum;
  /** Shift start datetime ISO string  */
  startDateTime: string;
}

/**
 * AutoAssignFavoritesToShift output payload
 */
export interface IAutoAssignFavoritesToShiftActionOutput {
  /** Number of favorite staff successfully auto-assigned  */
  assignedCount: number;
  /** Number of slots still open after auto-assignment  */
  remainingSlots: number;
  /** Emails of staff who were auto-assigned  */
  assignedStaffEmails: string[];
}

/**
 * AutoAssignFavoritesToShiftAction
 * Execute code action
 */
export const AutoAssignFavoritesToShiftAction = {
  actionBlockId: "69c51952792a18ec31893a48",

  inputInstanceType: {} as IAutoAssignFavoritesToShiftActionInput,
  outputInstanceType: {} as IAutoAssignFavoritesToShiftActionOutput,
} as const;

export type BulkPostShiftsActionInputRequiredRoleEnum =
  | "RN"
  | "LPN"
  | "CCA"
  | "CITR";

/**
 * BulkPostShifts input payload
 */
export interface IBulkPostShiftsActionInput {
  /** Optional notes for all shifts  */
  notes?: string;
  /** End of the date range (YYYY-MM-DD)  */
  endDate: string;
  /** Number of staff needed per shift (default 1)  */
  headcount?: number;
  /** Start of the date range (YYYY-MM-DD)  */
  startDate: string;
  /** Array of day-of-week numbers: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday  */
  daysOfWeek: number[];
  /** The role required for all shifts in this bulk post  */
  requiredRole: BulkPostShiftsActionInputRequiredRoleEnum;
  /** Shift end time in HH:MM format (e.g. '15:00')  */
  shiftEndTime: string;
  /** Shift start time in HH:MM format (e.g. '07:00')  */
  shiftStartTime: string;
  /** The facility ID to associate all shifts with  */
  facilityProfileId: string;
}

/**
 * BulkPostShifts output payload
 */
export interface IBulkPostShiftsActionOutput {
  /** Any errors encountered during creation  */
  errors: string[];
  /** Array of created shift IDs  */
  shiftIds: string[];
  /** Array of shift date strings (YYYY-MM-DD) that were created  */
  shiftDates: string[];
  /** Total number of shifts successfully created  */
  shiftsCreated: number;
}

/**
 * BulkPostShiftsAction
 * Execute code action
 */
export const BulkPostShiftsAction = {
  actionBlockId: "69c51952792a18ec31893a42",

  inputInstanceType: {} as IBulkPostShiftsActionInput,
  outputInstanceType: {} as IBulkPostShiftsActionOutput,
} as const;

/**
 * checkEligibility input payload
 */
export interface ICheckEligibilityActionInput {
  /** The ID of the shift to check eligibility against  */
  shiftId: string;
  /** The ID of the staff profile to check eligibility for  */
  staffProfileId: string;
}

/**
 * checkEligibility output payload
 */
export interface ICheckEligibilityActionOutput {
  /** Empty if eligible, list of failure reasons if not eligible  */
  reasons: string[];
  /** Whether the staff member is eligible to claim this shift  */
  eligible: boolean;
}

/**
 * checkEligibilityAction
 * Execute code action
 */
export const CheckEligibilityAction = {
  actionBlockId: "69c5194b792a18ec31893156",

  inputInstanceType: {} as ICheckEligibilityActionInput,
  outputInstanceType: {} as ICheckEligibilityActionOutput,
} as const;

/**
 * CheckEligibilityv2 input payload
 */
export interface ICheckEligibilityv2ActionInput {
  /** The ID of the StaffProfiles record to check eligibility for  */
  staffProfileId: string;
  /** The ID of the Shifts record to check eligibility against  */
  shiftId: string;
}

/**
 * CheckEligibilityv2 output payload
 */
export interface ICheckEligibilityv2ActionOutput {
  /** Whether the staff member is eligible to claim this shift  */
  eligible: boolean;
  /** Empty array if eligible, list of failure reasons if not eligible  */
  reasons: string[];
}

/**
 * CheckEligibilityv2Action
 * Execute code action
 */
export const CheckEligibilityv2Action = {
  actionBlockId: "69c51958792a18ec31893e98",

  inputInstanceType: {} as ICheckEligibilityv2ActionInput,
  outputInstanceType: {} as ICheckEligibilityv2ActionOutput,
} as const;

/**
 * CompleteOrientation input payload
 */
export interface ICompleteOrientationActionInput {
  /** The ID of the Orientations record to mark as completed  */
  orientationId: string;
  /** The ID of the StaffProfiles record to update orientedFacilityIds  */
  staffProfileId: string;
  /** The ID of the Facilities record — will be added to staff's orientedFacilityIds  */
  facilityId: string;
  /** Email of the facility manager marking the orientation as complete  */
  completedByEmail: string;
}

/**
 * CompleteOrientation output payload
 */
export interface ICompleteOrientationActionOutput {
  /** Whether the operation was successful  */
  success: boolean;
  /** Human-readable result message  */
  message: string;
}

/**
 * CompleteOrientationAction
 * Execute code action
 */
export const CompleteOrientationAction = {
  actionBlockId: "69c94e3cf32d6de1993e783e",

  inputInstanceType: {} as ICompleteOrientationActionInput,
  outputInstanceType: {} as ICompleteOrientationActionOutput,
} as const;

/**
 * DenyOrientationRequest input payload
 */
export interface IDenyOrientationRequestActionInput {
  /** Reason for denying the orientation request  */
  denialReason?: string;
  /** Email of the facility manager denying the request  */
  deniedByEmail: string;
  /** The ID of the Orientations record to deny  */
  orientationId: string;
}

/**
 * DenyOrientationRequest output payload
 */
export interface IDenyOrientationRequestActionOutput {
  message: string;
  success: boolean;
}

/**
 * DenyOrientationRequestAction
 * Execute code action
 */
export const DenyOrientationRequestAction = {
  actionBlockId: "69c51955792a18ec31893ca4",

  inputInstanceType: {} as IDenyOrientationRequestActionInput,
  outputInstanceType: {} as IDenyOrientationRequestActionOutput,
} as const;

/**
 * DenyWithdrawal input payload
 */
export interface IDenyWithdrawalActionInput {
  /** The ID of the ShiftApplication record with status withdrawal_pending  */
  applicationId: string;
}

export type DenyWithdrawalActionOutputStatusEnum =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "withdrawal_pending";

/**
 * The item updated in the table, keys are the column names, values are the column values
 */
export interface IDenyWithdrawalActionOutputDenyWithdrawalActionOutputItemsItemObject {
  /** The id of the item to update. Must be an existing id in the table.  */
  id?: string;
  /** Item created at. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  createdAt?: string;
  /** Item updated at. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  updatedAt?: string;
  /** Item created by user id  */
  createdBy?: string;
  /** Item updated by user id  */
  updatedBy?: string;
  /** Item updated by agent id  */
  updatedByAgentId?: string;
  /** Item tenant id  */
  tenantId?: string;
  /** When the staff member applied to this shift. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  appliedAt?: string;
  /** Current status of the application  */
  status?: DenyWithdrawalActionOutputStatusEnum;
  /** Reference to Shifts table id  */
  shiftProfileId?: string;
  /** When admin or system responded to the application. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  respondedAt?: string;
  /** The reason provided by the staff member when requesting a withdrawal from a shift. Captured from the withdrawal dialog form and displayed to admins on the withdrawal review card.  */
  withdrawalReason?: string;
  /** Reference to the staff member applying  */
  staffProfileId?: string;
}

/**
 * DenyWithdrawal output payload
 */
export interface IDenyWithdrawalActionOutput {
  /** The items updated in the table  */
  items: IDenyWithdrawalActionOutputDenyWithdrawalActionOutputItemsItemObject[];
}

/**
 * DenyWithdrawalAction
 * Denies a staff withdrawal request. Sets the ShiftApplication status back to 'approved', keeping the staff member assigned to the shift.
 */
export const DenyWithdrawalAction = {
  actionBlockId: "69c5194d792a18ec31893275",

  inputInstanceType: {} as IDenyWithdrawalActionInput,
  outputInstanceType: {} as IDenyWithdrawalActionOutput,
} as const;

export type GenerateInvoiceActionInputFrequencyEnum = "weekly" | "biweekly";

/**
 * GenerateInvoice input payload
 */
export interface IGenerateInvoiceActionInput {
  /** Invoice frequency: weekly (Mon-Sun) or biweekly (matching pay period). Defaults to biweekly. (default: "biweekly") */
  frequency?: GenerateInvoiceActionInputFrequencyEnum;
  /** Invoice period end date (YYYY-MM-DD)  */
  periodEnd: string;
  /** The Facilities record ID to generate the invoice for  */
  facilityId: string;
  /** Invoice period start date (YYYY-MM-DD)  */
  periodStart: string;
  /** If true, returns the invoice data without saving to the database. Use for preview modal.  */
  previewOnly?: boolean;
  /** Optional custom invoice number. If not provided, auto-generated as INV-[FACILITY_CODE]-[YYYYMMDD]-[SEQ].  */
  invoiceNumber?: string;
}

/**
 * undefined
 */
export interface IGenerateInvoiceActionOutputGenerateInvoiceActionOutputItemsItemObject {}

/**
 * undefined
 */
export interface IGenerateInvoiceActionOutputGenerateInvoiceActionOutputDayGroupsItemObject {
  date?: string;
  items?: IGenerateInvoiceActionOutputGenerateInvoiceActionOutputItemsItemObject[];
  dayLabel?: string;
  daySubtotal?: number;
}

/**
 * undefined
 */
export interface IGenerateInvoiceActionOutputGenerateInvoiceActionOutputLineItemsItemObject {
  date?: string;
  endTime?: string;
  shiftId: string;
  /** Formatted day label e.g. Mon, Feb 17  */
  dayLabel?: string;
  netHours: number;
  roleType?: string;
  isHoliday?: boolean;
  lineTotal: number;
  staffName?: string;
  startTime?: string;
  grossHours?: number;
  multiplier?: number;
  billingRate: number;
  breakMinutes?: number;
  adminAdjusted?: boolean;
  isShortNotice?: boolean;
  /** Staff initials e.g. A.B.  */
  staffInitials?: string;
  staffProfileId?: string;
  holidayMultiplier?: number;
  shortNoticeMultiplier?: number;
}

/**
 * GenerateInvoice output payload
 */
export interface IGenerateInvoiceActionOutput {
  total: number;
  hstRate: number;
  message?: string;
  success: boolean;
  subtotal: number;
  /** Line items grouped by day with subtotals  */
  dayGroups: IGenerateInvoiceActionOutputGenerateInvoiceActionOutputDayGroupsItemObject[];
  frequency?: string;
  hstAmount: number;
  /** ID of the created invoice record (null if previewOnly=true)  */
  invoiceId?: string;
  /** Line items with staff initials, grouped by day  */
  lineItems: IGenerateInvoiceActionOutputGenerateInvoiceActionOutputLineItemsItemObject[];
  periodEnd?: string;
  shiftCount?: number;
  periodStart?: string;
  facilityName?: string;
  invoiceNumber?: string;
}

/**
 * GenerateInvoiceAction
 * Execute code action
 */
export const GenerateInvoiceAction = {
  actionBlockId: "69c51953792a18ec31893b78",

  inputInstanceType: {} as IGenerateInvoiceActionInput,
  outputInstanceType: {} as IGenerateInvoiceActionOutput,
} as const;

/**
 * generatePayroll input payload
 */
export interface IGeneratePayrollActionInput {
  /** ISO date for pay period end (YYYY-MM-DD)  */
  periodEnd: string;
  /** ISO date for pay period start (YYYY-MM-DD)  */
  periodStart: string;
}

/**
 * generatePayroll output payload
 */
export interface IGeneratePayrollActionOutput {
  /** Sum of all gross pay generated, rounded to 2 decimals  */
  totalGrossPay: number;
  /** Count of new timesheet records created  */
  timesheetsCreated: number;
  /** Sum of all early pay advances deducted from gross pay  */
  totalEarlyPayDeducted: number;
  /** Number of EarlyPayRequests marked as paid  */
  earlyPayRequestsMarkedPaid: number;
}

/**
 * generatePayrollAction
 * Execute code action
 */
export const GeneratePayrollAction = {
  actionBlockId: "69c5194b792a18ec3189313b",

  inputInstanceType: {} as IGeneratePayrollActionInput,
  outputInstanceType: {} as IGeneratePayrollActionOutput,
} as const;

export type GetAvailableStaffForShiftActionInputRequiredRoleEnum =
  | "RN"
  | "LPN"
  | "CCA"
  | "CITR";

/**
 * GetAvailableStaffForShift input payload
 */
export interface IGetAvailableStaffForShiftActionInput {
  /** ISO datetime string for the shift end time (e.g. '2026-02-17T15:00:00')  */
  endDateTime: string;
  /** The role required for the shift (RN, LPN, CCA, CITR). Used to filter staff by role eligibility.  */
  requiredRole: GetAvailableStaffForShiftActionInputRequiredRoleEnum;
  /** ISO datetime string for the shift start time (e.g. '2026-02-17T07:00:00')  */
  startDateTime: string;
}

/**
 * undefined
 */
export interface IGetAvailableStaffForShiftActionOutputGetAvailableStaffForShiftActionOutputStaffItemObject {
  email: string;
  lastName?: string;
  roleType: string;
  firstName?: string;
  totalRatings?: number;
  averageRating?: number;
  staffProfileId: string;
  profilePhotoUrl?: string;
  /** Notes from the staff member's availability record for that day  */
  availabilityNotes?: string;
}

/**
 * GetAvailableStaffForShift output payload
 */
export interface IGetAvailableStaffForShiftActionOutput {
  /** List of available staff members  */
  staff: IGetAvailableStaffForShiftActionOutputGetAvailableStaffForShiftActionOutputStaffItemObject[];
  /** Total number of available staff matching the criteria  */
  availableCount: number;
}

/**
 * GetAvailableStaffForShiftAction
 * Execute code action
 */
export const GetAvailableStaffForShiftAction = {
  actionBlockId: "69c51950792a18ec31893583",

  inputInstanceType: {} as IGetAvailableStaffForShiftActionInput,
  outputInstanceType: {} as IGetAvailableStaffForShiftActionOutput,
} as const;

/**
 * GetEarlyPaySummary input payload
 */
export interface IGetEarlyPaySummaryActionInput {
  /** The ID of the StaffProfiles record to compute early pay summary for  */
  staffProfileId: string;
}

/**
 * GetEarlyPaySummary output payload
 */
export interface IGetEarlyPaySummaryActionOutput {
  /** Current pay period end date (YYYY-MM-DD)  */
  periodEnd: string;
  /** Human-readable period label e.g. 'Feb 3 - Feb 16, 2026'  */
  periodLabel: string;
  /** Current pay period start date (YYYY-MM-DD)  */
  periodStart: string;
  /** Sum of approved/paid early pay requests this period  */
  alreadyWithdrawn: number;
  /** Total gross pay earned from completed shifts this period  */
  earnedThisPeriod: number;
  /** ID of the pending request if one exists  */
  pendingRequestId?: string;
  /** Whether there is already a pending early pay request for this period  */
  hasPendingRequest: boolean;
  /** (earnedThisPeriod - alreadyWithdrawn) x 0.80, floored to 2 decimals, min 0  */
  availableForEarlyPay: number;
  /** Number of completed shifts this period  */
  completedShiftsCount: number;
}

/**
 * GetEarlyPaySummaryAction
 * Execute code action
 */
export const GetEarlyPaySummaryAction = {
  actionBlockId: "69c51955792a18ec31893d01",

  inputInstanceType: {} as IGetEarlyPaySummaryActionInput,
  outputInstanceType: {} as IGetEarlyPaySummaryActionOutput,
} as const;

/**
 * getSignedFileUrl input payload
 */
export interface IGetSignedFileUrlActionInput {
  /** The internal file URL ending with /redirect  */
  fileUrl: string;
}

/**
 * getSignedFileUrl output payload
 */
export interface IGetSignedFileUrlActionOutput {
  /** The public accebile URL of the file.  */
  signedUrl?: string;
  /** The expiration of the file.  */
  expiration?: string;
}

/**
 * getSignedFileUrlAction
 * Generates a signed URL for an internal file URL so it can be previewed or downloaded in the browser. Used by StaffMyDocuments and StaffDetailPanel pages.
 */
export const GetSignedFileUrlAction = {
  actionBlockId: "69c5194c792a18ec318931ce",

  inputInstanceType: {} as IGetSignedFileUrlActionInput,
  outputInstanceType: {} as IGetSignedFileUrlActionOutput,
} as const;

/**
 * GetStaffActivityStats input payload
 */
export interface IGetStaffActivityStatsActionInput {
  /** The ID of the StaffProfiles record to compute stats for  */
  staffProfileId: string;
}

export type GetStaffActivityStatsActionOutputReliabilityBadgeEnum =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum";

/**
 * GetStaffActivityStats output payload
 */
export interface IGetStaffActivityStatsActionOutput {
  totalRatings: number;
  averageRating: number;
  rolesPerformed: string[];
  reliabilityBadge: GetStaffActivityStatsActionOutputReliabilityBadgeEnum;
  reliabilityScore: number;
  totalHoursWorked: number;
  totalAcceptedShifts: number;
  uniqueFacilityNames: string[];
  totalShiftsCompleted: number;
  uniqueFacilitiesCount: number;
}

/**
 * GetStaffActivityStatsAction
 * Execute code action
 */
export const GetStaffActivityStatsAction = {
  actionBlockId: "69c51954792a18ec31893c6e",

  inputInstanceType: {} as IGetStaffActivityStatsActionInput,
  outputInstanceType: {} as IGetStaffActivityStatsActionOutput,
} as const;

/**
 * GiveBonusAction input payload
 */
export interface IGiveBonusActionActionInput {
  /** The ID of the StaffProfiles record receiving the bonus  */
  staffProfileId: string;
  /** Email of the staff member receiving the bonus  */
  staffEmail: string;
  /** Bonus amount in CAD dollars. Must be a positive number.  */
  amount: number;
  /** Admin-provided reason for the bonus (e.g. 'Holiday bonus', 'Exceptional performance')  */
  reason?: string;
  /** Email of the admin awarding the bonus  */
  awardedByEmail: string;
}

/**
 * GiveBonusAction output payload
 */
export interface IGiveBonusActionActionOutput {
  /** Whether the bonus was successfully awarded  */
  success: boolean;
  /** Human-readable result message  */
  message: string;
  /** ID of the created Bonuses record  */
  bonusId: string;
  /** The pay period start date this bonus is assigned to (YYYY-MM-DD)  */
  payPeriodStart?: string;
  /** The pay period end date this bonus is assigned to (YYYY-MM-DD)  */
  payPeriodEnd?: string;
}

/**
 * GiveBonusActionAction
 * Execute code action
 */
export const GiveBonusActionAction = {
  actionBlockId: "69ca99400d49b6cb8e6f8795",

  inputInstanceType: {} as IGiveBonusActionActionInput,
  outputInstanceType: {} as IGiveBonusActionActionOutput,
} as const;

/**
 * InviteFacilityManager input payload
 */
export interface IInviteFacilityManagerActionInput {
  /** Optional display name for the new facility manager  */
  name?: string;
  /** Email address of the new facility manager to invite  */
  email: string;
  /** Optional phone number for the facility manager profile  */
  phone?: string;
  /** Name of the facility (used in the invite email context)  */
  facilityName?: string;
  /** The ID of the Facilities record to link this manager to  */
  facilityProfileId: string;
}

/**
 * InviteFacilityManager output payload
 */
export interface IInviteFacilityManagerActionOutput {
  /** Human-readable result message  */
  message: string;
  /** Whether the invite was sent and profile created successfully  */
  success: boolean;
  /** True if a FM profile for this email+facility already exists  */
  alreadyExists: boolean;
  /** Whether a new FacilityManagerProfiles record was created  */
  profileCreated: boolean;
}

/**
 * InviteFacilityManagerAction
 * Execute code action
 */
export const InviteFacilityManagerAction = {
  actionBlockId: "69c51953792a18ec31893b5a",

  inputInstanceType: {} as IInviteFacilityManagerActionInput,
  outputInstanceType: {} as IInviteFacilityManagerActionOutput,
} as const;

export type ProcessEarlyPayRequestActionInputActionEnum = "approve" | "deny";

/**
 * ProcessEarlyPayRequest input payload
 */
export interface IProcessEarlyPayRequestActionInput {
  /** Whether to approve or deny the request  */
  action: ProcessEarlyPayRequestActionInputActionEnum;
  /** The ID of the EarlyPayRequests record to process  */
  requestId: string;
  /** Reason for denial (required for deny action)  */
  denialReason?: string;
  /** Amount approved (required for approve action, can differ from requested)  */
  amountApproved?: number;
  /** Email of the admin processing the request  */
  reviewedByEmail: string;
}

/**
 * ProcessEarlyPayRequest output payload
 */
export interface IProcessEarlyPayRequestActionOutput {
  message: string;
  success: boolean;
}

/**
 * ProcessEarlyPayRequestAction
 * Execute code action
 */
export const ProcessEarlyPayRequestAction = {
  actionBlockId: "69c51955792a18ec31893d04",

  inputInstanceType: {} as IProcessEarlyPayRequestActionInput,
  outputInstanceType: {} as IProcessEarlyPayRequestActionOutput,
} as const;

export type ProcessShiftTradeActionInputActionEnum = "approve" | "reject";

/**
 * processShiftTrade input payload
 */
export interface IProcessShiftTradeActionInput {
  /** Whether to approve or reject the trade  */
  action: ProcessShiftTradeActionInputActionEnum;
  /** ID of the ShiftTrades record to process  */
  tradeId: string;
  /** Email of the admin/FM processing the trade  */
  approvedByEmail: string;
  /** Reason for rejection (required when action=reject)  */
  rejectionReason?: string;
}

/**
 * processShiftTrade output payload
 */
export interface IProcessShiftTradeActionOutput {
  /** Human-readable result message  */
  message: string;
  success: boolean;
}

/**
 * processShiftTradeAction
 * Execute code action
 */
export const ProcessShiftTradeAction = {
  actionBlockId: "69c51950792a18ec318934ad",

  inputInstanceType: {} as IProcessShiftTradeActionInput,
  outputInstanceType: {} as IProcessShiftTradeActionOutput,
} as const;

/**
 * rejectRoleUpgrade input payload
 */
export interface IRejectRoleUpgradeActionInput {
  /** The ID of the RoleUpgradeApplications record to reject  */
  applicationId: string;
  /** The reason for rejecting the application (required)  */
  rejectionReason: string;
  /** Email of the admin rejecting the application  */
  reviewedByEmail: string;
}

/**
 * rejectRoleUpgrade output payload
 */
export interface IRejectRoleUpgradeActionOutput {
  /** Whether the rejection was successful  */
  success: boolean;
}

/**
 * rejectRoleUpgradeAction
 * Execute code action
 */
export const RejectRoleUpgradeAction = {
  actionBlockId: "69c5194e792a18ec318932d2",

  inputInstanceType: {} as IRejectRoleUpgradeActionInput,
  outputInstanceType: {} as IRejectRoleUpgradeActionOutput,
} as const;

/**
 * RequestOrientation input payload
 */
export interface IRequestOrientationActionInput {
  /** The ID of the Facilities record where orientation is requested  */
  facilityId: string;
  /** Email of the staff member (for notification purposes)  */
  staffEmail: string;
  /** The ID of the StaffProfiles record requesting orientation  */
  staffProfileId: string;
}

/**
 * RequestOrientation output payload
 */
export interface IRequestOrientationActionOutput {
  /** Current status of the orientation record  */
  status?: string;
  message: string;
  success: boolean;
  /** ID of the created or existing Orientations record  */
  orientationId?: string;
  /** True if an active request or scheduled orientation already exists  */
  alreadyRequested: boolean;
}

/**
 * RequestOrientationAction
 * Execute code action
 */
export const RequestOrientationAction = {
  actionBlockId: "69c51955792a18ec31893ca1",

  inputInstanceType: {} as IRequestOrientationActionInput,
  outputInstanceType: {} as IRequestOrientationActionOutput,
} as const;

/**
 * ScheduleOrientationShift input payload
 */
export interface IScheduleOrientationShiftActionInput {
  /** Optional notes about the orientation session  */
  notes?: string;
  /** The ID of the Facilities record where orientation will take place  */
  facilityId: string;
  /** Name of the person conducting the orientation  */
  orientedBy?: string;
  /** ISO datetime string for orientation end  */
  endDateTime: string;
  /** The ID of the Orientations record to schedule  */
  orientationId: string;
  /** ISO datetime string for orientation start  */
  startDateTime: string;
  /** The ID of the StaffProfiles record being oriented  */
  staffProfileId: string;
  /** Email of the facility manager scheduling the orientation  */
  scheduledByEmail: string;
}

/**
 * ScheduleOrientationShift output payload
 */
export interface IScheduleOrientationShiftActionOutput {
  message: string;
  /** ID of the created orientation shift  */
  shiftId?: string;
  success: boolean;
}

/**
 * ScheduleOrientationShiftAction
 * Execute code action
 */
export const ScheduleOrientationShiftAction = {
  actionBlockId: "69c51955792a18ec31893ca7",

  inputInstanceType: {} as IScheduleOrientationShiftActionInput,
  outputInstanceType: {} as IScheduleOrientationShiftActionOutput,
} as const;

/**
 * StaffUpdateTimeLog input payload
 */
export interface IStaffUpdateTimeLogActionInput {
  /** The ID of the time log record to update  */
  timeLogId: string;
  /** New clock-in time as ISO 8601 datetime string  */
  clockInTime: string;
  /** New clock-out time as ISO 8601 datetime string  */
  clockOutTime: string;
}

export type StaffUpdateTimeLogActionOutputGeofenceStatusEnum =
  | "within"
  | "outside_flagged"
  | "outside_blocked";

/**
 * The item updated in the table, keys are the column names, values are the column values
 */
export interface IStaffUpdateTimeLogActionOutputStaffUpdateTimeLogActionOutputItemsItemObject {
  /** The id of the item to update. Must be an existing id in the table.  */
  id?: string;
  /** Item created at. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  createdAt?: string;
  /** Item updated at. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  updatedAt?: string;
  /** Item created by user id  */
  createdBy?: string;
  /** Item updated by user id  */
  updatedBy?: string;
  /** Item updated by agent id  */
  updatedByAgentId?: string;
  /** Item tenant id  */
  tenantId?: string;
  /** True if an admin manually adjusted the clock-in time, clock-out time, or break minutes for this time log. Used to flag records that differ from the original GPS-recorded times.  */
  adminAdjusted?: boolean;
  /** Timestamp when staff clocked in to start the shift. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  clockInTime?: string;
  /** GPS longitude coordinate at clock-in for geofence verification  */
  clockInLng?: number;
  /** Calculated total hours worked: (clockOut - clockIn - break) in hours  */
  totalHours?: number;
  /** GPS latitude coordinate at clock-out for geofence verification  */
  clockOutLat?: number;
  /** Reference to Shifts table id  */
  shiftProfileId?: string;
  /** Flag set to true when staff clocked out more than 30 minutes after shift.endDateTime. Flagged for admin review but clock-out is still allowed.  */
  lateClockOutFlagged?: boolean;
  /** GPS longitude coordinate at clock-out for geofence verification  */
  clockOutLng?: number;
  /** Reference to the staff member who clocked in/out  */
  staffProfileId?: string;
  /** Flag set to true when the raw hours worked exceed the scheduled shift duration. Total hours are capped at the scheduled duration for pay purposes.  */
  overtimeFlagged?: boolean;
  /** Admin notes explaining why the time log was adjusted (e.g. 'Staff forgot to clock out - adjusted to shift end time'). Only populated when adminAdjusted is true.  */
  adjustmentNotes?: string;
  /** Flag set to true when the system automatically clocked out the staff member because no clock-out was recorded within 2 hours after shift.endDateTime. The clockOutTime is set to shift.endDateTime in this case.  */
  autoClockOut?: boolean;
  /** When true, this time log has been approved by an admin and is permanently locked from editing by both admin and staff. Set to true via the Approve button in AdminTimesheet. Cannot be reversed through the UI.  */
  isApproved?: boolean;
  /** GPS latitude coordinate at clock-in for geofence verification  */
  clockInLat?: number;
  /** Flag set to true if staff clocked out while outside the facility geofence radius. Allows clock-out to proceed but records the anomaly for review.  */
  clockOutOutsideGeofence?: boolean;
  /** The scheduled shift duration in hours (endDateTime - startDateTime). Used to cap totalHours and detect overtime.  */
  scheduledHours?: number;
  /** Auto-calculated break deduction in minutes based on shift duration  */
  breakMinutes?: number;
  /** Flag set to true if a clock-in attempt was blocked because the staff member tried to clock in more than 30 minutes after the shift start time.  */
  isLateBlocked?: boolean;
  /** Indicates whether clock-in was within the facility's geofence boundary  */
  geofenceStatus?: StaffUpdateTimeLogActionOutputGeofenceStatusEnum;
  /** Timestamp when staff clocked out to end the shift. Null until they clock out.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  clockOutTime?: string;
}

/**
 * StaffUpdateTimeLog output payload
 */
export interface IStaffUpdateTimeLogActionOutput {
  /** The items updated in the table  */
  items: IStaffUpdateTimeLogActionOutputStaffUpdateTimeLogActionOutputItemsItemObject[];
}

/**
 * StaffUpdateTimeLogAction
 * Allows a staff member to update their own clock-in and clock-out times on a completed time log. Recalculates breakMinutes and totalHours after the edit. Marks the record as staff-adjusted.
 */
export const StaffUpdateTimeLogAction = {
  actionBlockId: "69c51957792a18ec31893e5c",

  inputInstanceType: {} as IStaffUpdateTimeLogActionInput,
  outputInstanceType: {} as IStaffUpdateTimeLogActionOutput,
} as const;

/**
 * submitStaffRating input payload
 */
export interface ISubmitStaffRatingActionInput {
  /** Overall rating 1-5 stars (required)  */
  rating: number;
  /** Optional free-text comment about the staff member's performance  */
  comment?: string;
  /** ID of the completed Shift this rating is for  */
  shiftId: string;
  /** ID of the Facility where the shift took place  */
  facilityId: string;
  /** Email of the facility manager or admin submitting the rating  */
  ratedByEmail: string;
  /** Optional clinical skills sub-score 1-5  */
  clinicalSkills?: number;
  /** ID of the StaffProfiles record being rated  */
  staffProfileId: string;
  /** Optional professionalism sub-score 1-5  */
  professionalism?: number;
  /** Optional reliability sub-score 1-5  */
  reliabilityScore?: number;
}

/**
 * submitStaffRating output payload
 */
export interface ISubmitStaffRatingActionOutput {
  success: boolean;
  /** Updated total count of ratings  */
  totalRatings: number;
  /** The recalculated average rating for the staff member  */
  newAverageRating: number;
}

/**
 * submitStaffRatingAction
 * Execute code action
 */
export const SubmitStaffRatingAction = {
  actionBlockId: "69c5194f792a18ec31893392",

  inputInstanceType: {} as ISubmitStaffRatingActionInput,
  outputInstanceType: {} as ISubmitStaffRatingActionOutput,
} as const;

export type ValidateGeofenceActionInputModeEnum = "strict" | "relaxed";

/**
 * validateGeofence input payload
 */
export interface IValidateGeofenceActionInput {
  /** Validation mode: 'strict' blocks anything outside radius, 'relaxed' allows nearby with warning (default: "relaxed") */
  mode?: ValidateGeofenceActionInputModeEnum;
  /** Acceptable geofence radius in meters (default: 100) */
  radiusMeters?: number;
  /** Staff's current GPS latitude coordinate  */
  staffLatitude: number;
  /** Staff's current GPS longitude coordinate  */
  staffLongitude: number;
  /** Facility's GPS latitude coordinate  */
  facilityLatitude: number;
  /** Facility's GPS longitude coordinate  */
  facilityLongitude: number;
}

export type ValidateGeofenceActionOutputResultEnum =
  | "within"
  | "nearby"
  | "blocked";

/**
 * validateGeofence output payload
 */
export interface IValidateGeofenceActionOutput {
  /** Validation result: 'within' if inside radius, 'nearby' if outside but acceptable in relaxed mode, 'blocked' if too far  */
  result: ValidateGeofenceActionOutputResultEnum;
  /** Human-readable message explaining the validation result  */
  message: string;
  /** Calculated distance between staff and facility in meters  */
  distanceMeters: number;
}

/**
 * validateGeofenceAction
 * Execute code action
 */
export const ValidateGeofenceAction = {
  actionBlockId: "69c5194a792a18ec318930d7",

  inputInstanceType: {} as IValidateGeofenceActionInput,
  outputInstanceType: {} as IValidateGeofenceActionOutput,
} as const;
