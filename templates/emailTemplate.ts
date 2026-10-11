/**
 * ============================================================
 *  EMAIL CAMPAIGN TEMPLATE — edit this file
 * ============================================================
 *
 * Available placeholders (replaced automatically per recipient):
 *
 *   {{HR_NAME}}      — Recruiter name from Excel (Name column)
 *   {{COMPANY_NAME}} — Company from Excel (Company column)
 *   {{POSITION}}     — Recruiter title from Excel (Title column)
 *   {{JOB_ROLE}}     — Role you enter in the dashboard campaign form
 *   {{TODAY}}        — Current date
 *
 * After editing, run from project root:
 *   npm run sync-template
 *
 * Then restart the backend if it is already running.
 * ============================================================
 */

export const DEFAULT_CAMPAIGN_SUBJECT =
  'saw you on reddit, had to reach out';

export const DEFAULT_CAMPAIGN_BODY = `Not gonna waste your time with a cover-letter voice, I was on Reddit, saw something crazzzy, had to tell, your company came up in a thread about hiring, I figured I'd email a real person instead of becoming application #847 in a portal.

Hey, I'm reaching out for the {{JOB_ROLE}} role at your workplace.

Over the last 3 years, I've focused on AI agents and shipping real-world products, from building automated email deliverability systems and launching an iOS app independently to building PolySplit.io. I've collaborated with multiple founders, delivered projects under tight deadlines, presented research at conferences, and won multiple hackathons.

I take ownership, move fast, and build things that solve real problems. My work has also contributed to roughly $40K in additional startup profit.

I'd love to build something meaningful with your team. Give me a real problem or technical challenge, and let me prove what I bring to the table.

hope u have a good day

Best regards,
Adit Katiyar
Email: aaditkatiyar@gmail.com
Portfolio: https://aditkatiyar.com
`;
/**
 * Optional: static signature block appended by the app is NOT automatic.
 * Include your name, email, phone, and links directly in the body above.
 */

export const TEMPLATE_VARIABLES = [
  'HR_NAME',
  'COMPANY_NAME',
  'POSITION',
  'JOB_ROLE',
  'TODAY',
] as const;
