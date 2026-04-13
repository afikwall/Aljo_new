import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpPageHeader } from "@/components/HelpPageHeader";
import { HelpInfoBox } from "@/components/HelpInfoBox";
import { HelpStatusBadge } from "@/components/HelpStatusBadge";

export default function FacilityManagerHelp() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <HelpPageHeader
        title="Facility Manager Guide"
        subtitle="Learn how to post shifts, manage staff, and view your invoices."
      />

      <Accordion type="multiple" className="w-full">
        {/* Section 1: Dashboard */}
        <AccordionItem value="dashboard">
          <AccordionTrigger className="text-base font-semibold">
            Dashboard
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Your dashboard shows three <strong>KPI cards</strong> at a glance:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Open Shifts</strong> — shifts you've posted that haven't
                been claimed yet
              </li>
              <li>
                <strong>Shifts Today</strong> — all shifts scheduled for today
              </li>
              <li>
                <strong>Claimed This Week</strong> — shifts that have been claimed
                by staff this week
              </li>
            </ul>
            <p>
              The <strong>Upcoming Shifts</strong> list shows the next 7 days of
              scheduled shifts with facility, date/time, role badge, and current
              status.
            </p>
            <HelpInfoBox>
              The Facility Rates card displays your configured staff rates in read-only
              mode. To update rates, contact ALJO admin.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Posting Shifts */}
        <AccordionItem value="posting-shifts">
          <AccordionTrigger className="text-base font-semibold">
            Posting Shifts
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Click the <strong>"Post New Shift"</strong> button to create a
              shift. Select the required role (RN, LPN, CCA, or CITR), date,
              start/end time, and headcount (1–20 staff).
            </p>
            <p>
              <strong>Rate fields:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Staff Rate ($/hr)</strong> — <strong>mandatory</strong>.
                This is the hourly pay rate for the staff member. It auto-populates
                from your facility's rate table when you select a role, but you can
                override the value if needed.
              </li>
              <li>
                <strong>Billing Rate ($/hr)</strong> — <strong>read-only</strong>.
                This is the rate your facility is charged by ALJO. It auto-populates
                from the billing rate table and cannot be edited. If no billing rate
                is configured for a role, you'll see a message to contact ALJO admin.
              </li>
            </ul>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                Shifts posted <strong>less than 24 hours</strong> before start are
                flagged as{" "}
                <HelpStatusBadge variant="warning">Short Notice</HelpStatusBadge>{" "}
                — this adds a surcharge to your invoice but does{" "}
                <strong>not</strong> increase staff pay
              </li>
              <li>
                Use the <strong>"Assign to Staff"</strong> toggle to create a
                private shift assigned directly to a specific staff member,
                bypassing the marketplace
              </li>
            </ul>
            <HelpInfoBox>
              Both rates are displayed on shift cards after posting. The staff rate
              is what the staff member earns. The billing rate is what your facility
              is charged — it's visible to you for transparency but managed by ALJO admin.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Orientation Management */}
        <AccordionItem value="orientation">
          <AccordionTrigger className="text-base font-semibold">
            Orientation Management
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              If your facility requires orientation before staff can work regular
              shifts:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                Staff submit <strong>orientation requests</strong> from the
                Available Shifts page
              </li>
              <li>
                You'll see pending requests in your{" "}
                <strong>dashboard</strong>
              </li>
              <li>
                Create a <strong>private orientation shift</strong> to schedule
                the session with the requesting staff member
              </li>
              <li>
                Orientation status automatically completes when the staff member{" "}
                <strong>clocks out</strong> of the orientation shift
              </li>
            </ul>
            <HelpInfoBox>
              Once orientation is complete, the staff member can apply for regular shifts
              at your facility without needing another orientation.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Viewing Invoices */}
        <AccordionItem value="invoices">
          <AccordionTrigger className="text-base font-semibold">
            Viewing Invoices
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              View invoices generated by ALJO admin in <strong>read-only</strong>{" "}
              mode. Each invoice includes:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                Line items grouped by date with staff initials, hours worked, and
                billing rate
              </li>
              <li>
                Any applicable multipliers (short notice, holiday)
              </li>
              <li>
                <strong>HST at 14%</strong> applied to the subtotal
              </li>
              <li>
                Total amount due
              </li>
            </ul>
            <HelpInfoBox>
              You can print or download invoices for your records directly from the
              invoice detail view.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: What You Cannot See */}
        <AccordionItem value="restrictions">
          <AccordionTrigger className="text-base font-semibold">
            What You Cannot See
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              For transparency, here's what is <strong>not visible</strong> to
              facility manager accounts:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>Other facilities' data or shift information</li>
              <li>
                ALJO's profit margin calculations
              </li>
              <li>
                Staff compliance documents or personal details beyond name and
                role
              </li>
              <li>
                Payroll amounts paid to staff members
              </li>
              <li>
                Other facility managers' accounts
              </li>
            </ul>
            <p>
              <strong>What you CAN see:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Staff Rate</strong> — the hourly pay for staff (editable when posting)
              </li>
              <li>
                <strong>Billing Rate</strong> — the hourly rate your facility is charged
                (read-only, for transparency)
              </li>
            </ul>
            <HelpInfoBox>
              The billing rate is visible to you for transparency so you can see exactly
              what your facility is being charged. To adjust billing rates, contact ALJO
              admin directly.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Shift Statuses */}
        <AccordionItem value="shift-statuses">
          <AccordionTrigger className="text-base font-semibold">
            Shift Statuses
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Each shift moves through the following statuses:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <HelpStatusBadge variant="info">Open</HelpStatusBadge> — posted
                and awaiting staff
              </li>
              <li>
                <HelpStatusBadge variant="success">Assigned</HelpStatusBadge> —
                staff directly assigned by admin or facility manager
              </li>
              <li>
                <HelpStatusBadge variant="success">Claimed</HelpStatusBadge> —
                staff applied and was approved
              </li>
              <li>
                <HelpStatusBadge variant="warning">In Progress</HelpStatusBadge>{" "}
                — staff has clocked in
              </li>
              <li>
                <HelpStatusBadge variant="success">Completed</HelpStatusBadge> —
                staff has clocked out
              </li>
              <li>
                <HelpStatusBadge variant="danger">Cancelled</HelpStatusBadge> —
                shift was removed
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Section 7: Role Eligibility */}
        <AccordionItem value="role-eligibility">
          <AccordionTrigger className="text-base font-semibold">
            Role Eligibility
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              When posting a shift, the required role determines which staff can
              apply. <strong>Higher-qualified staff can always fill
              lower-level positions:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Post for CITR</strong> — all roles can apply (RN, LPN,
                CCA, CITR) — widest pool
              </li>
              <li>
                <strong>Post for CCA</strong> — CCA, LPN, and RN can apply
              </li>
              <li>
                <strong>Post for LPN</strong> — LPN and RN can apply
              </li>
              <li>
                <strong>Post for RN</strong> — only RNs can apply — most
                selective
              </li>
            </ul>
            <HelpInfoBox>
              Posting for CITR gives you the widest candidate pool, while posting for RN
              ensures you get the most qualified staff. Choose based on the care level
              required.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}