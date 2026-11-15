import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Fourth hold-out set. holdout3 was the clean test for the second session;
 * its misses then informed the third session, so it is a development set now.
 * These eight were written while the third session's first change was being
 * measured, before any result from it was seen, and have only ever been
 * measured. Every person, organisation, address and number here is made up.
 *
 * Run with `EVAL_SET=holdout4 npm run eval`.
 */
const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const HOLDOUT4: Fixture[] = [
  {
    id: 'discharge-summary',
    title: 'Hospital discharge summary',
    text: `DISCHARGE SUMMARY
Ward 14 (Respiratory), Carrow Vale General Hospital

Patient: OKPARA, Chidinma Adaeze          MRN: 5502817
DOB: 09-Sep-1988                          Admitted: 08/11/2026
Address: 23 Tollgate Mews, Norwich NR3 4EJ  Discharged: 13/11/2026
GP: Dr F Nakamura-Ellis, Heigham Road Surgery

Diagnosis: Community-acquired pneumonia, right lower lobe.

Summary: Admitted via A&E with fever, productive cough and oxygen saturations of 89% on air. Chest X-ray confirmed consolidation. Treated with IV co-amoxiclav for 48 hours, then switched to oral antibiotics. Now saturating at 96% on air and mobilising independently.

Medication on discharge: amoxicillin 500 mg three times a day for 5 more days. Paracetamol as needed.

Follow-up: repeat chest X-ray in 6 weeks. GP to review if symptoms have not settled in 7 days.

Next of kin informed: husband, Obinna (07700 900217).

Completed by: Dr Wilhelmina Sørensen, FY2
`,
    gold: [
      g('PERSON', 'OKPARA'),
      g('PERSON', 'Chidinma'),
      g('PERSON', 'Adaeze'),
      g('PERSON', 'Obinna'),
      g('ID_NUMBER', '5502817'),
      g('DOB', '09-Sep-1988'),
      g('ADDRESS', '23 Tollgate Mews'),
      g('POSTCODE', 'NR3 4EJ'),
      g('PHONE', '07700 900217'),
      g('PERSON', 'Nakamura-Ellis', 'other'),
      g('PERSON', 'Wilhelmina', 'other'),
      g('PERSON', 'Sørensen', 'other'),
    ],
    keep: ['pneumonia', 'amoxicillin 500 mg', '6 weeks', '7 days', '96% on air', 'co-amoxiclav'],
  },
  {
    id: 'energy-debt-email',
    title: 'Energy supplier email about a debt',
    text: `Subject: Your Brightwell Energy account 8840217-03 is overdue

Hello Cosmin,

Your balance of £612.47 has been overdue since 14 October. We have tried to reach you by phone on the number ending 4409 and by post at Flat 9, Peverell Court.

If we do not hear from you by 29 November 2026, we may apply for a warrant to fit a prepayment meter at your home.

You can avoid this. Reply to this email or call 0800 496 0733 and we can set up a repayment plan based on what you can afford. If someone in your home is over 65, has a child under 5 or relies on medical equipment, tell us and we will add you to our Priority Services Register.

You may also be able to get help from StepChange or your local council's hardship fund.

Regards,
Ines
Collections Team, Brightwell Energy
`,
    gold: [
      g('PERSON', 'Cosmin'),
      g('ID_NUMBER', '8840217-03'),
      g('ADDRESS', 'Peverell Court'),
      g('PERSON', 'Ines', 'other'),
    ],
    keep: ['£612.47', '29 November 2026', 'prepayment meter', 'Priority Services Register', 'StepChange', 'repayment plan'],
  },
  {
    id: 'group-chat',
    title: 'Group chat about a shared house',
    text: `Dervla: has anyone heard back from the landlord about the damp in the back bedroom
Suleiman: nope. i emailed mr pettigrew twice last week
Dervla: ok im going to ring environmental health monday. can everyone send me photos
Hye-jin: sent. also the deposit cert says its in my name only?? ref is DPS-77120934
Suleiman: thats wrong, we all paid. mine went from my monzo to pettigrew lettings, £425 on 2 sept
Dervla: right. ill put it all in one email and cc you both. whats your email hye-jin
Hye-jin: hyejin.seo@webmail.example
`,
    gold: [
      g('PERSON', 'Dervla'),
      g('PERSON', 'Suleiman'),
      g('PERSON', 'Hye-jin'),
      g('EMAIL', 'hyejin.seo@webmail.example'),
      g('ID_NUMBER', 'DPS-77120934'),
      g('PERSON', 'pettigrew', 'other'),
    ],
    keep: ['damp', 'environmental health', '£425', 'deposit'],
  },
  {
    id: 'school-meeting-notes',
    title: 'Notes of a school support meeting',
    text: `Notes of meeting held Thursday 12 November 2026, 3.45pm, Larkfield Primary

Present: Roisin Adeyemi-Walsh (parent), Gethin Probert (class teacher), Agnieszka Dąbrowska (SENCo)
Apologies: Dr Callum Iwu (educational psychologist)

About: Fintan, Year 4

Roisin said Fintan has been coming home upset and is refusing to read aloud. She thinks it started after he moved tables in October. His older sister Niamh had similar difficulties at the same age.

Gethin said Fintan works well in small groups but shuts down in whole-class reading. His reading age was assessed at 6 years 8 months in September.

Agnieszka explained the next steps. The school will start a 10-week phonics catch-up programme, three sessions a week, and will ask Dr Iwu to observe Fintan in class before Christmas.

Agreed: Roisin to share the optician's report. Gethin to move Fintan back to his old table. Review meeting on 21 January 2027.
`,
    gold: [
      g('PERSON', 'Roisin'),
      g('PERSON', 'Adeyemi-Walsh'),
      g('PERSON', 'Fintan'),
      g('PERSON', 'Niamh'),
      g('PERSON', 'Gethin', 'other'),
      g('PERSON', 'Probert', 'other'),
      g('PERSON', 'Agnieszka', 'other'),
      g('PERSON', 'Dąbrowska', 'other'),
      g('PERSON', 'Iwu', 'other'),
    ],
    keep: ['10-week phonics catch-up programme', '6 years 8 months', '21 January 2027', 'read aloud', 'Larkfield Primary'],
  },
  {
    id: 'canada-tax-notice',
    title: 'Tax notice from Canada',
    text: `Canada Revenue Agency
Sudbury Tax Centre

Jean-Baptiste Tremblay-Okoro
204-1180 Rue Saint-Denis
Montréal QC  H2X 3J6

Social insurance number: 046 454 286
Tax year: 2025
Date issued: Nov 10, 2026

NOTICE OF REASSESSMENT

We have reassessed your 2025 income tax and benefit return. We changed your employment income on line 10100 from $61,400 to $64,950 based on a T4 slip we received from Atelier Marchand Inc.

Result: you owe $1,062.18, including $48.30 in arrears interest.

Pay by December 10, 2026 to avoid more interest. If you disagree, you have 90 days from the date of this notice to file an objection.

For questions, call 1-800-959-8281 and have this notice ready.
`,
    gold: [
      g('PERSON', 'Jean-Baptiste'),
      g('PERSON', 'Tremblay-Okoro'),
      g('ADDRESS', '204-1180 Rue Saint-Denis'),
      g('POSTCODE', 'H2X 3J6'),
      g('ID_NUMBER', '046 454 286'),
    ],
    keep: ['$1,062.18', 'December 10, 2026', '90 days', 'NOTICE OF REASSESSMENT', '$64,950', 'file an objection'],
  },
  {
    id: 'tenant-reference',
    title: 'Reference from a previous landlord',
    text: `To whom it may concern,

I confirm that Bao Tran and his partner Mirela Constantinescu rented my property at 6 Sandpiper Close, Exmouth from March 2023 to October 2026.

The rent of £1,050 a month was always paid on time by standing order. They kept the house and garden in very good condition and I returned their deposit in full. I had no complaints from the neighbours on either side.

They are leaving only because Bao's job has moved to Plymouth. I would happily rent to them again.

You are welcome to phone me on 07700 900834 if you need anything further.

Yours faithfully,
Winifred Ashworth-Deane
`,
    gold: [
      g('PERSON', 'Bao'),
      g('PERSON', 'Tran'),
      g('PERSON', 'Mirela'),
      g('PERSON', 'Constantinescu'),
      g('ADDRESS', '6 Sandpiper Close'),
      g('PERSON', 'Winifred', 'other'),
      g('PERSON', 'Ashworth-Deane', 'other'),
      g('PHONE', '07700 900834', 'other'),
    ],
    keep: ['£1,050', 'paid on time', 'deposit in full', 'March 2023', 'October 2026'],
  },
  {
    id: 'dental-estimate',
    title: 'Dental treatment estimate',
    text: `Quayside Dental Care
Treatment estimate

Patient: Mx Ariadne Vasilakis-Boyd (ref QD/11482)
Dentist: Hamid Rostami BDS
Date: 13/11/2026

Proposed treatment                         Fee
Examination and two X-rays                 £65.00
Root canal treatment, upper left molar     £495.00
Porcelain crown, same tooth                £640.00
Hygienist visit (30 min)                   £72.00
                                 Total     £1,272.00

This estimate is valid for 3 months. A deposit of 50% is payable when you book the root canal appointment. We offer interest-free payment over 10 months through Tabeo, subject to a credit check.

If you have a dental plan, bring your membership number to your next visit. Our records show plan number DP-4471-0092 for you.

To book, call 01392 496 0150 or reply to this message.
`,
    gold: [
      g('PERSON', 'Ariadne'),
      g('PERSON', 'Vasilakis-Boyd'),
      g('ID_NUMBER', 'QD/11482'),
      g('ID_NUMBER', 'DP-4471-0092'),
      g('PERSON', 'Hamid', 'other'),
      g('PERSON', 'Rostami', 'other'),
    ],
    keep: ['£1,272.00', 'Root canal treatment', '3 months', '50%', 'Porcelain crown', '10 months'],
  },
  {
    id: 'flight-booking',
    title: 'Flight booking confirmation',
    text: `BOOKING CONFIRMED - reference XQ7RLM

Passengers
1. SIDDIQUI / ZAINAB MS      Passport: 518204477     Frequent flyer: SB 4471 0092 18
2. SIDDIQUI / IDRIS MSTR (child, 7)   Passport: 549917302

Outbound: Sat 19 Dec 2026, Manchester (MAN) 10:25 to Lahore (LHE) 23:40, flight SB 218
Return:   Sat 2 Jan 2027, Lahore (LHE) 02:15 to Manchester (MAN) 06:50, flight SB 219

Baggage: 2 x 23 kg each. Seats: 31A, 31B.
Total paid: £1,486.00 to card ending 7731.

Contact: zainab.siddiqui77@netmail.example / +44 7700 900605
Emergency contact: Tariq Siddiqui, +44 7700 900118

Check in online from 48 hours before departure. Your child must travel with the adult named on this booking.
`,
    gold: [
      g('PERSON', 'SIDDIQUI'),
      g('PERSON', 'ZAINAB'),
      g('PERSON', 'IDRIS'),
      g('PERSON', 'Tariq'),
      g('ID_NUMBER', 'XQ7RLM'),
      g('ID_NUMBER', '518204477'),
      g('ID_NUMBER', '549917302'),
      g('ID_NUMBER', 'SB 4471 0092 18'),
      g('EMAIL', 'zainab.siddiqui77@netmail.example'),
      g('PHONE', '+44 7700 900605'),
      g('PHONE', '+44 7700 900118'),
    ],
    keep: ['Sat 19 Dec 2026', 'Manchester', 'Lahore', '£1,486.00', '48 hours', '23 kg'],
  },
];
