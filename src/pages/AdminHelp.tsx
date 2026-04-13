import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpPageHeader } from "@/components/HelpPageHeader";
import { HelpInfoBox } from "@/components/HelpInfoBox";
import { HelpStatusBadge } from "@/components/HelpStatusBadge";

export default function AdminHelp() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <HelpPageHeader
        title="Admin Help & Guide"
        subtitle="Everything you need to know to manage the ALJO CareCrew platform."
      />

      <Accordion type="multiple" className="w-full">
        {/* Section 1: Dashboard */}
        <AccordionItem value="dashboard">
          <AccordionTrigger className="text-base font-semibold">
            Dashboard
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              The Admin Dashboard provides a real-time overview of platform activity through
              <strong> KPI cards</strong> at the top of the page.
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Active Staff</strong> — total staff with{" "}
                <HelpStatusBadge variant="success">Compliant</HelpStatusBadge> status
              </li>
              <li>
                <strong>Open Shifts</strong> — shifts currently unassigned and available
              </li>
              <li>
                <strong>Pending Onboarding</strong> — staff awaiting document review
              </li>
              <li>
                <strong>Pending Payroll</strong> — timesheets awaiting approval
              </li>
              <li>
                <strong>Pending Applications</strong> — shift applications awaiting review
              </li>
            </ul>
            <p>
              The <strong>pay period banner</strong> displays the current bi-weekly pay period dates
              and includes quick action buttons for generating payroll.
            </p>
            <HelpInfoBox>
              The Alerts section highlights expired compliance documents and today's open shifts
              so you can take immediate action.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Staff Management */}
        <AccordionItem value="staff-management">
          <AccordionTrigger className="text-base font-semibold">
            Staff Management
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Manage all staff members across four tabs:{" "}
              <strong>All Staff</strong>, <strong>Pending Onboarding</strong>,{" "}
              <strong>Onboarding</strong>, and <strong>Role Upgrades</strong>.
            </p>
            <p>
              Review uploaded documents per staff member — you can{" "}
              <HelpStatusBadge variant="success">Approve</HelpStatusBadge> or{" "}
              <HelpStatusBadge variant="danger">Reject</HelpStatusBadge> each
              document with a rejection reason.
            </p>
            <p>
              <strong>Required documents by role:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>All Roles (RN, LPN, CCA, CITR)</strong> — Government ID,
                Background Check, TB Test, COVID Vaccination
              </li>
              <li>
                <strong>RN &amp; LPN</strong> — additionally require Nursing
                License + CPR Certification
              </li>
              <li>
                <strong>CCA</strong> — additionally requires CPR Certification
              </li>
              <li>
                <strong>CITR</strong> — base documents only
              </li>
            </ul>
            <HelpInfoBox>
              Compliance status auto-updates after you review each document. Once all
              required documents are approved, the staff member becomes Compliant and can
              apply for shifts.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Facility Management */}
        <AccordionItem value="facility-management">
          <AccordionTrigger className="text-base font-semibold">
            Facility Management
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Add and edit facilities with their name, address, city, province, and
              contact information.
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Rates Tab</strong> — Configure{" "}
                <strong>Staff Rates</strong> (what staff are paid) and{" "}
                <strong>Billing Rates</strong> (what facilities are charged) per
                role. Each rate includes a base rate, short notice multiplier, and
                holiday multiplier.
              </li>
              <li>
                <strong>Logins Tab</strong> — Invite facility managers by email to
                create their login accounts.
              </li>
              <li>
                <strong>Documents Tab</strong> — Upload facility contracts,
                insurance certificates, and licenses.
              </li>
            </ul>
            <HelpInfoBox>
              Configure geofence settings (latitude, longitude, radius) for each facility
              to enable GPS-based clock-in verification for staff.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section: Rate Visibility & Control */}
        <AccordionItem value="rate-visibility">
          <AccordionTrigger className="text-base font-semibold">
            Rate Visibility & Control
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              As an admin, you have <strong>full control</strong> over both rate types
              when posting shifts:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Staff Rate</strong> — the hourly pay rate for the staff member.
                You can see and edit this field on all shift forms and shift cards.
              </li>
              <li>
                <strong>Billing Rate</strong> — the hourly rate the facility pays ALJO.
                You can see and edit this field on all shift forms and shift cards.
              </li>
            </ul>
            <p>
              <strong>Visibility by role:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Admin</strong> — full read/write access to both staff rate and
                billing rate everywhere
              </li>
              <li>
                <strong>Facility Manager</strong> — can enter/edit staff rate when posting
                shifts. Can <em>see</em> billing rate (read-only, auto-populated from
                the facility rate table)
              </li>
              <li>
                <strong>Staff</strong> — can only see the staff rate (their hourly pay)
                on shift cards and shift details. Staff{" "}
                <strong>never</strong> see the billing rate
              </li>
            </ul>
            <HelpInfoBox>
              Both rates are saved to each shift record. Configure default rates per
              facility and role in the Facility Management → Rates tab. These defaults
              auto-populate when a role is selected in the Post Shift form.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Shift Applications */}
        <AccordionItem value="shift-applications">
          <AccordionTrigger className="text-base font-semibold">
            Shift Applications
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Review pending shift applications showing shift details (facility,
              date/time, role) and applicant profile (name, role, compliance
              status).
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Approve</strong> — assigns the staff member to the shift
                and updates the shift status to{" "}
                <HelpStatusBadge variant="success">Assigned</HelpStatusBadge>
              </li>
              <li>
                <strong>Reject</strong> — keeps the shift open for other
                applicants to claim
              </li>
            </ul>
            <HelpInfoBox>
              Applications are processed on a first-come-first-served basis. Review
              applications promptly to ensure shifts are filled in time.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Shift Management */}
        <AccordionItem value="shift-management">
          <AccordionTrigger className="text-base font-semibold">
            Shift Management
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Manually assign eligible staff to open shifts. The system
              automatically checks role eligibility and schedule conflicts before
              allowing assignment.
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                You can also <strong>unassign</strong> staff from a shift, which
                returns the shift to{" "}
                <HelpStatusBadge variant="info">Open</HelpStatusBadge> status
              </li>
              <li>
                Use <strong>filters</strong> to find shifts by status, facility,
                role, or date range
              </li>
            </ul>
            <HelpInfoBox>
              The system prevents double-booking — if a staff member is already assigned
              to an overlapping shift, the assignment will be blocked.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Payroll */}
        <AccordionItem value="payroll">
          <AccordionTrigger className="text-base font-semibold">
            Payroll
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Generate payroll for a bi-weekly period — the system creates
              timesheets from completed time logs automatically.
            </p>
            <p>
              <strong>Four tabs for managing timesheets:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <HelpStatusBadge variant="warning">Pending</HelpStatusBadge> —
                needs review before approval
              </li>
              <li>
                <HelpStatusBadge variant="success">Approved</HelpStatusBadge> —
                ready to be paid
              </li>
              <li>
                <HelpStatusBadge variant="info">Paid</HelpStatusBadge> — payment
                completed
              </li>
              <li>
                <strong>All</strong> — view all timesheets across statuses
              </li>
            </ul>
            <p>
              You can approve timesheets individually or use{" "}
              <strong>bulk-approve</strong> for all pending items. Before
              approving, you may <strong>edit hours or rates</strong> — an
              adjustment note is required for the audit trail.
            </p>
            <p>
              After sending external payment, mark timesheets as{" "}
              <HelpStatusBadge variant="info">Paid</HelpStatusBadge>.
            </p>
            <HelpInfoBox>
              The Staff Outstanding Balances section shows unpaid amounts per staff
              member, giving you a clear view of pending obligations.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 7: Invoices */}
        <AccordionItem value="invoices">
          <AccordionTrigger className="text-base font-semibold">
            Invoices
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Generate facility invoices using <strong>billing rates + 14% HST</strong>.
              Line items are grouped by day showing staff initials, hours worked,
              billing rate, and any applicable multipliers.
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                Choose <strong>weekly</strong> or <strong>bi-weekly</strong>{" "}
                frequency options when generating invoices
              </li>
              <li>
                Mark invoices as <strong>Sent</strong> after delivering them to the
                facility, then <strong>Paid</strong> when payment is received
              </li>
              <li>
                Overdue invoices are flagged automatically so you never lose track
              </li>
            </ul>
            <HelpInfoBox>
              Billing rates are configured per-facility in the Facility Management section.
              Short notice and holiday multipliers are applied automatically.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 8: Early Pay Requests */}
        <AccordionItem value="early-pay">
          <AccordionTrigger className="text-base font-semibold">
            Early Pay Requests
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Staff can request up to <strong>80% of earned wages</strong> before
              the regular payday. Requests appear for admin review.
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Approve</strong> — with optional amount adjustment (you
                can approve a different amount than requested)
              </li>
              <li>
                <strong>Deny</strong> — a reason is required when denying a
                request
              </li>
            </ul>
            <HelpInfoBox>
              Approved early pay amounts are automatically deducted from the staff
              member's next payroll run. No manual adjustments needed.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}