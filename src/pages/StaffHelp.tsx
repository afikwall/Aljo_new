import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpPageHeader } from "@/components/HelpPageHeader";
import { HelpInfoBox } from "@/components/HelpInfoBox";
import { HelpStatusBadge } from "@/components/HelpStatusBadge";

export default function StaffHelp() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <HelpPageHeader
        title="Staff Help & Guide"
        subtitle="Your complete guide to working with ALJO CareCrew."
      />

      <Accordion type="multiple" className="w-full">
        {/* Section 1: Getting Started */}
        <AccordionItem value="getting-started">
          <AccordionTrigger className="text-base font-semibold">
            Getting Started
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>Welcome to ALJO CareCrew! Here's how to get set up:</p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Register</strong> with your email address
              </li>
              <li>
                <strong>Complete your profile</strong> — name, phone number, role
                type, and emergency contact
              </li>
              <li>
                <strong>Upload required documents</strong> on the My Documents
                page
              </li>
              <li>
                <strong>Wait for admin review</strong> — your documents will be
                reviewed and approved
              </li>
              <li>
                Once all required documents are approved, your compliance status
                becomes{" "}
                <HelpStatusBadge variant="success">Compliant</HelpStatusBadge>{" "}
                and you can start applying for shifts
              </li>
            </ul>
            <HelpInfoBox>
              Complete your profile and upload all documents as soon as possible to
              minimize wait time before you can start working.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: My Documents */}
        <AccordionItem value="my-documents">
          <AccordionTrigger className="text-base font-semibold">
            My Documents
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Your <strong>role-based document checklist</strong> with a progress
              bar shows exactly what's needed. Upload photos or PDFs of each
              required document.
            </p>
            <p>
              <strong>Document status badges:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <HelpStatusBadge variant="danger">Missing</HelpStatusBadge> —
                not yet uploaded
              </li>
              <li>
                <HelpStatusBadge variant="warning">
                  Pending Review
                </HelpStatusBadge>{" "}
                — uploaded and awaiting admin review
              </li>
              <li>
                <HelpStatusBadge variant="success">Approved</HelpStatusBadge> —
                verified by admin
              </li>
              <li>
                <HelpStatusBadge variant="danger">Rejected</HelpStatusBadge> —
                needs re-upload (rejection reason shown)
              </li>
              <li>
                <HelpStatusBadge variant="danger">Expired</HelpStatusBadge> —
                document has passed its expiry date
              </li>
            </ul>
            <HelpInfoBox>
              Keep your documents current — expired documents will block you from
              claiming shifts. Re-upload before expiry dates to stay compliant.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Browsing Shifts */}
        <AccordionItem value="browsing-shifts">
          <AccordionTrigger className="text-base font-semibold">
            Browsing Shifts
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              The <strong>Available Shifts</strong> page shows all shifts you're
              eligible for based on your role.
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Filter by date</strong> — Today, Tomorrow, This Week,
                Next Week, or Custom range
              </li>
              <li>
                <strong>Filter by city</strong> — narrow down to facilities near
                you
              </li>
              <li>
                Each shift card shows <strong>facility name</strong>, city,
                date/time, duration, role badge, and{" "}
                <strong>your hourly pay rate</strong> displayed as a badge
                (e.g. "$25.00/hr")
              </li>
              <li>
                Tap any card to see <strong>full details</strong> including
                address, shift notes, and a prominent display of your pay rate
              </li>
            </ul>
            <HelpInfoBox>
              The pay rate shown on each shift card is the hourly rate you will earn
              for that shift. Billing rates (the amount facilities pay ALJO) are never
              shown to staff — you only see your own earnings.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Applying for Shifts */}
        <AccordionItem value="applying-shifts">
          <AccordionTrigger className="text-base font-semibold">
            Applying for Shifts
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Tap <strong>"Claim Shift"</strong> on any available shift. The
              system automatically verifies:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Compliance status</strong> — must be{" "}
                <HelpStatusBadge variant="success">Compliant</HelpStatusBadge>
              </li>
              <li>
                <strong>Role eligibility</strong> — RN can work RN/LPN/CCA/CITR
                shifts; LPN can work LPN/CCA/CITR; CCA can work CCA/CITR; CITR
                can only work CITR
              </li>
              <li>
                <strong>Facility orientation</strong> — if required by the
                facility
              </li>
              <li>
                <strong>Schedule conflicts</strong> — no overlapping shifts
                allowed
              </li>
            </ul>
            <p>
              If eligible, your application moves to{" "}
              <HelpStatusBadge variant="warning">Pending</HelpStatusBadge> status
              in My Shifts, awaiting admin approval.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: My Shifts */}
        <AccordionItem value="my-shifts">
          <AccordionTrigger className="text-base font-semibold">
            My Shifts
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Track all your shifts across <strong>four tabs</strong>:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <HelpStatusBadge variant="warning">Pending</HelpStatusBadge> —
                awaiting admin approval
              </li>
              <li>
                <HelpStatusBadge variant="success">Upcoming</HelpStatusBadge> —
                approved shifts; the clock-in button appears 15 minutes before
                shift start
              </li>
              <li>
                <HelpStatusBadge variant="warning">In Progress</HelpStatusBadge>{" "}
                — live green timer counting up from when you clocked in
              </li>
              <li>
                <HelpStatusBadge variant="success">Completed</HelpStatusBadge> —
                shows gross hours, break deduction, net hours, and pay summary
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Clock In & Out */}
        <AccordionItem value="clock-in-out">
          <AccordionTrigger className="text-base font-semibold">
            Clock In & Out
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Clock In:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                Opens <strong>15 minutes before</strong> shift start time
              </li>
              <li>
                <strong>GPS location is required</strong> — you must be within 200
                meters of the facility
              </li>
              <li>
                More than <strong>30 minutes late</strong> = clock-in blocked,
                contact admin
              </li>
            </ul>
            <p>
              <strong>Clock Out:</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                Clock out from the facility location when your shift ends
              </li>
              <li>
                If you forget, the system <strong>auto-clocks you out</strong> 2
                hours after the scheduled shift end
              </li>
            </ul>
            <p>
              <strong>Break deductions</strong> (auto-deducted from total hours):
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>Under 4 hours — no break deduction</li>
              <li>4–8 hours — 15 minutes</li>
              <li>8–12 hours — 30 minutes</li>
              <li>12+ hours — 45 minutes</li>
            </ul>
            <HelpInfoBox>
              Make sure location services are enabled on your device before attempting
              to clock in. Being outside the geofence radius will prevent clock-in.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 7: My Schedule */}
        <AccordionItem value="my-schedule">
          <AccordionTrigger className="text-base font-semibold">
            My Schedule
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              A <strong>monthly calendar view</strong> showing all your shifts as
              color-coded pills:
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <HelpStatusBadge variant="info">Pending</HelpStatusBadge> — blue
                pills for awaiting approval
              </li>
              <li>
                <HelpStatusBadge variant="success">Upcoming</HelpStatusBadge> —
                green pills for confirmed shifts
              </li>
              <li>
                Completed shifts shown as gray pills
              </li>
              <li>
                <strong>Holiday dates</strong> marked with gold dots
              </li>
            </ul>
            <p>
              <strong>Block dates</strong> to mark yourself as unavailable —
              blocked dates appear as red striped overlays. Tap any day to see
              details or manage your blocked dates.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Section 8: Getting Paid */}
        <AccordionItem value="getting-paid">
          <AccordionTrigger className="text-base font-semibold">
            Getting Paid
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>Gross Pay</strong> = hours worked × your hourly rate ×
              multiplier
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Holiday multiplier</strong> = 1.5× (statutory holidays
                only)
              </li>
              <li>
                <strong>No tax deductions</strong> — you are responsible for your
                own taxes as an independent contractor
              </li>
              <li>
                Payroll is processed <strong>bi-weekly</strong>
              </li>
              <li>
                View your <strong>timesheets and payment status</strong> in My
                Profile
              </li>
            </ul>
            <p>
              <strong>Early Pay:</strong> Request up to{" "}
              <strong>80% of earned wages</strong> before payday — subject to
              admin approval.
            </p>
            <HelpInfoBox>
              As an independent contractor, no income tax is withheld. Set aside
              funds for tax payments and consult a tax professional for guidance.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 9: Career Path */}
        <AccordionItem value="career-path">
          <AccordionTrigger className="text-base font-semibold">
            Career Path
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Apply for a <strong>role upgrade</strong> when you earn higher
              qualifications (e.g., CITR → CCA → LPN → RN).
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                Upload the additional required documents for your target role
              </li>
              <li>
                Track your application status:{" "}
                <HelpStatusBadge variant="warning">Pending</HelpStatusBadge> →{" "}
                <HelpStatusBadge variant="warning">Under Review</HelpStatusBadge>{" "}
                →{" "}
                <HelpStatusBadge variant="success">Approved</HelpStatusBadge> /{" "}
                <HelpStatusBadge variant="danger">Rejected</HelpStatusBadge>
              </li>
              <li>
                Once approved, your role is updated and you gain access to{" "}
                <strong>higher-level shifts</strong>
              </li>
            </ul>
            <HelpInfoBox>
              A role upgrade opens up more shift opportunities and potentially higher
              pay rates. Check the Career Path page for specific requirements.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>

        {/* Section 10: Withdrawal Policy */}
        <AccordionItem value="withdrawal-policy">
          <AccordionTrigger className="text-base font-semibold">
            Withdrawal Policy
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              You can <strong>withdraw from a shift</strong> if there are{" "}
              <strong>6 or more hours</strong> before the shift start time.
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1.5">
              <li>
                <strong>Under 6 hours before start:</strong> contact admin
                directly — do not simply not show up
              </li>
              <li>
                <strong>Frequent withdrawals</strong> are tracked and may affect
                your standing on the platform
              </li>
              <li>
                Withdrawal requests appear in My Shifts as{" "}
                <HelpStatusBadge variant="warning">
                  Withdrawal Pending
                </HelpStatusBadge>{" "}
                until admin processes them
              </li>
            </ul>
            <HelpInfoBox>
              Facilities depend on reliable staffing. Please only withdraw when absolutely
              necessary and give as much notice as possible.
            </HelpInfoBox>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}