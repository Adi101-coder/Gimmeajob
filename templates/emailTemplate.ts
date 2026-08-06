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
  'Junior Software Engineer at {{COMPANY_NAME}}';

export const DEFAULT_CAMPAIGN_BODY = `Hi {{HR_NAME}},

I won't take much of your time, I know it's valuable.

I'm a developer actively looking for a {{JOB_ROLE}} role, and {{COMPANY_NAME}} is one of the places I'd genuinely love to be at. I've spent the last 3 years working hands-on with AI agents, debugging tricky problems, shipping features, and picking up new tools quickly whenever something needs to get done.

Honestly, I just love solving problems and building things. I'm comfortable communicating with people, I don't mind putting in the extra hours when it matters, and I try to work smart so tasks don't take longer than they need to. I also have a fair interest in marketing, so I'm not only thinking in code.

I've attached my resume if you'd like to take a look. If you feel there could be a fit at {{COMPANY_NAME}}, I'd be happy to connect whenever works for you.

Best regards,
Adit Katiyar
Email: aaditkatiyar@gmail.com
LinkedIn: https://www.linkedin.com/in/adit-katiyar-0863692b9/
Portfolio: https://www.aditkatiyar.tech/
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
