import type { EntityKind } from '../airlock';
import { SAMPLE_LETTER } from '../sample';

/**
 * Labelled test letters for the scrub step. Every person, organisation,
 * address and number here is made up.
 *
 * `gold` lists the shortest strings that must not be readable in what leaves
 * the device. A surname is listed on its own, so hiding "Ms Eleanor" but
 * leaving "Whitfield" counts as a miss. `who` separates the person the letter
 * is about from staff and third parties, because those misses differ in cost.
 *
 * `keep` lists facts the cloud model needs to be useful. Hiding them is
 * over-redaction.
 */
export interface Gold {
  kind: EntityKind;
  value: string;
  who?: 'subject' | 'other';
}

export interface Fixture {
  id: string;
  title: string;
  text: string;
  gold: Gold[];
  keep: string[];
  /** The useful facts that are medical terms. Counted on their own. */
  medical?: string[];
}

const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const FIXTURES: Fixture[] = [
  {
    id: 'clinic',
    title: 'Missed clinic appointment',
    text: SAMPLE_LETTER,
    gold: [
      g('PERSON', 'Eleanor'),
      g('PERSON', 'Whitfield'),
      g('PERSON', 'Bielak', 'other'),
      g('ADDRESS', '14 Larch Close'),
      g('POSTCODE', 'RG1 4QT'),
      g('ID_NUMBER', '943 476 5919'),
      g('DOB', '03/07/1984'),
      g('ACCOUNT', '20-00-00'),
      g('ACCOUNT', '12345678'),
      g('EMAIL', 'eleanor.whitfield@example.com'),
    ],
    keep: ['Northbridge Community Clinic', 'Tuesday 8 December 2026', '£42.50', '48 hours'],
  },
  {
    id: 'council-tax',
    title: 'Council tax reminder',
    text: `Harrowden Borough Council
Revenues and Benefits

Mr Oluwaseun Adebayo
Flat 3, 27 Millrace Road
Leeds
LS6 2QP

Account reference: 70041882936

REMINDER NOTICE - COUNCIL TAX 2026/27

Dear Mr Adebayo,

Our records show that the instalment of £164.00 due on 1 November 2026 has not been paid. You must pay this amount within 7 days of the date of this notice. If you do not, you will lose the right to pay by instalments and the full remaining balance of £820.00 will become due.

If you have already paid, please ignore this reminder. If you are struggling to pay, call us on 0113 496 0147 before 22 November 2026 so we can talk about a payment plan.

Yours sincerely,
Priya Ramanathan
Recovery Officer
`,
    gold: [
      g('PERSON', 'Oluwaseun'),
      g('PERSON', 'Adebayo'),
      g('PERSON', 'Ramanathan', 'other'),
      g('ADDRESS', '27 Millrace Road'),
      g('POSTCODE', 'LS6 2QP'),
      g('ID_NUMBER', '70041882936'),
    ],
    keep: ['Harrowden Borough Council', '£164.00', '7 days', '£820.00', '22 November 2026'],
  },
  {
    id: 'landlord',
    title: 'Informal rent increase from a landlord',
    text: `Dear Siobhán,

I hope you and Declan are settling in well at 8 Tanner's Yard.

I'm writing to let you know that from 1 January 2027 the rent for the flat will go up from £1,150 to £1,240 a month. This is the first increase since you moved in. Under the tenancy agreement I have to give you at least one month's notice, which this letter does.

Please update your standing order before the January payment. The account details are the same as before: sort code 40-11-62, account 31926819, in the name of M J Halloran.

If you want to talk it through, ring me on 07700 900456 or email mjhalloran@example.com.

Kind regards,
Maurice Halloran
`,
    gold: [
      g('PERSON', 'Siobhán'),
      g('PERSON', 'Declan'),
      g('PERSON', 'Halloran', 'other'),
      g('PERSON', 'Maurice', 'other'),
      g('ADDRESS', "8 Tanner's Yard"),
      g('ACCOUNT', '40-11-62', 'other'),
      g('ACCOUNT', '31926819', 'other'),
      g('PHONE', '07700 900456', 'other'),
      g('EMAIL', 'mjhalloran@example.com', 'other'),
    ],
    keep: ['1 January 2027', '£1,240', "one month's notice"],
  },
  {
    id: 'bank-caps',
    title: 'Bank letter with the name and address in capitals',
    text: `Calder & Wye Bank
Customer Accounts

MRS NGUYEN THI LAN
92 ST AIDAN'S TERRACE
MANCHESTER
M14 5GL

Date: 5 November 2026

Dear Mrs Nguyen,

YOUR ACCOUNT IS OVERDRAWN WITHOUT AN ARRANGEMENT

Your current account (sort code 16-58-10, account number 00573921) went overdrawn by £212.37 on 3 November 2026. You do not have an arranged overdraft, so we are charging interest at 39.9% EAR on the overdrawn balance.

Please pay in enough to bring the account back into credit by 19 November 2026. If the account stays overdrawn we may restrict your debit card (4111 1111 1111 1111) and report the missed payments to credit reference agencies.

If you are in financial difficulty we want to help. Call our support team on 0161 496 0102.

Yours sincerely,
Customer Accounts Team
`,
    gold: [
      g('PERSON', 'Nguyen'),
      g('PERSON', 'THI LAN'),
      g('ADDRESS', "92 ST AIDAN'S TERRACE"),
      g('POSTCODE', 'M14 5GL'),
      g('ACCOUNT', '16-58-10'),
      g('ACCOUNT', '00573921'),
      g('CARD', '4111 1111 1111 1111'),
    ],
    keep: ['Calder & Wye Bank', '£212.37', '39.9% EAR', '19 November 2026'],
  },
  {
    id: 'parking',
    title: 'Parking charge notice',
    text: `Lowmoor Parking Services Ltd
PARKING CHARGE NOTICE

Notice number: LB40372916
Vehicle registration: KM19 ZTX
Date of event: 24 October 2026, 14:52
Location: Station Approach car park, Bristol

To the registered keeper:
Zbigniew Wiśniewski
5 Orchard Lea
Bristol
BS7 9DN

The vehicle above was parked without a valid ticket displayed. A charge of £100.00 is now payable. If you pay within 14 days of the date of this notice, the charge is reduced to £60.00.

You can appeal within 28 days. Appeals must be made in writing and should include the notice number. If you were not the driver, you must tell us the driver's full name and address.

Pay online or by phone on 0117 496 0188.
`,
    gold: [
      g('PERSON', 'Zbigniew'),
      g('PERSON', 'Wiśniewski'),
      g('ADDRESS', '5 Orchard Lea'),
      g('POSTCODE', 'BS7 9DN'),
      g('ID_NUMBER', 'LB40372916'),
      g('OTHER', 'KM19 ZTX'),
    ],
    keep: ['Lowmoor Parking Services Ltd', '£100.00', '£60.00', '14 days', '28 days'],
  },
  {
    id: 'tax-penalty',
    title: 'Late filing penalty',
    text: `National Revenue Service
Self Assessment

Our ref: 48213 77905
National Insurance number: AB 12 34 56 C

Ms Aroha Ngata-Williams
Top Floor Flat
61 Cobbler's Row
Edinburgh
EH6 5NP

Dear Ms Ngata-Williams,

LATE FILING PENALTY

We did not receive your tax return for the year ended 5 April 2026 by the deadline of 31 October 2026. Because the return is late, we have charged a fixed penalty of £100.

You should send the return now. If it is more than three months late we will charge £10 for each further day, up to 90 days. You can appeal against the penalty within 30 days if you had a reasonable excuse, such as serious illness or bereavement.

If you think you do not need to complete a return, phone 0131 496 0155 and tell us why.
`,
    gold: [
      g('PERSON', 'Aroha'),
      g('PERSON', 'Ngata-Williams'),
      g('ADDRESS', "61 Cobbler's Row"),
      g('POSTCODE', 'EH6 5NP'),
      g('ID_NUMBER', 'AB 12 34 56 C'),
      g('ID_NUMBER', '48213 77905'),
    ],
    keep: ['31 October 2026', 'fixed penalty of £100', '£10 for each further day', '30 days'],
  },
  {
    id: 'school',
    title: 'School attendance letter',
    text: `Fernbank Primary School

12 November 2026

Dear Mr and Mrs Okonkwo-Hughes,

I am writing about your daughter Amara in class 4B. Amara has now been absent for nine school days this half term, and her attendance has fallen to 83%. We have not received a reason for the absences on 3, 4 and 5 November.

Good attendance matters, and we would like to understand whether there is anything making it hard for Amara to come to school. Please come to a meeting with me and our attendance officer, Mrs Jacqueline Abara, on Thursday 19 November 2026 at 3:30pm.

If attendance does not improve, we are required to refer the matter to the local authority, which can issue a penalty notice of £80 per parent.

Please confirm you can attend by calling the school office on 020 7946 0321 or emailing office@fernbank-primary.example.

Yours sincerely,
Gareth Pembroke
Headteacher
`,
    gold: [
      g('PERSON', 'Okonkwo-Hughes'),
      g('PERSON', 'Amara'),
      g('PERSON', 'Abara', 'other'),
      g('PERSON', 'Pembroke', 'other'),
    ],
    keep: ['Fernbank Primary School', '83%', 'Thursday 19 November 2026', '£80 per parent'],
  },
  {
    id: 'energy',
    title: 'Energy billing complaint',
    text: `Brightwell Energy
Customer account: 8840-2291-07

Mr Dafydd ap Rhys
Ty Gwyn
Heol y Felin
Aberystwyth
SY23 1LX

Dear Mr ap Rhys,

Thank you for your complaint of 28 October 2026 about the estimated bill of £1,318.44 for the period 1 July to 30 September.

We have looked at the meter readings for the electricity meter at your property (serial number S19K0048213). The reading you gave us by phone, 48,210, is lower than our estimate of 51,960. We have rebilled the account using your reading and the corrected bill is £402.17.

Because we took more than eight weeks to resolve your complaint, you now have the right to take it to the Energy Ombudsman free of charge. You have 12 months from the date of this letter to do so.

We have applied a goodwill credit of £40.00 to your account. Your Direct Debit will change to £96.00 a month from 1 December 2026.

Yours sincerely,
Hannah Østergaard
Complaints Resolution
`,
    gold: [
      g('PERSON', 'Dafydd'),
      g('PERSON', 'ap Rhys'),
      g('PERSON', 'Østergaard', 'other'),
      g('ADDRESS', 'Ty Gwyn'),
      g('ADDRESS', 'Heol y Felin'),
      g('POSTCODE', 'SY23 1LX'),
      g('ID_NUMBER', '8840-2291-07'),
      g('ID_NUMBER', 'S19K0048213'),
    ],
    keep: ['£402.17', 'eight weeks', 'Energy Ombudsman', '12 months', '£40.00'],
  },
  {
    id: 'disciplinary',
    title: 'Invitation to a disciplinary hearing',
    text: `PRIVATE AND CONFIDENTIAL

Kestrel Logistics Ltd
Human Resources

Rajesh Venkataraman
Employee number 004417
By email: raj.venkat@example.com

13 November 2026

Dear Rajesh,

INVITATION TO A DISCIPLINARY HEARING

You are required to attend a disciplinary hearing on Friday 20 November 2026 at 10:00 in Meeting Room 2 at the Doncaster depot. The hearing will be chaired by Fiona MacAllister, Operations Manager. Tom Brzezinski from HR will take notes.

The hearing will consider the allegation that on 6 November 2026 you left the depot during your shift without permission, leaving a loaded vehicle unattended. Statements from your supervisor, Lukas Petrov, and the CCTV log are enclosed.

You have the right to be accompanied by a work colleague or a trade union representative. If the allegation is upheld, the outcome could be a final written warning.

If you cannot attend, contact me on 01632 960177 as soon as possible.

Yours sincerely,
Charlotte Adeyemi
HR Business Partner
`,
    gold: [
      g('PERSON', 'Rajesh'),
      g('PERSON', 'Venkataraman'),
      g('PERSON', 'MacAllister', 'other'),
      g('PERSON', 'Brzezinski', 'other'),
      g('PERSON', 'Petrov', 'other'),
      g('PERSON', 'Adeyemi', 'other'),
      g('ID_NUMBER', '004417'),
      g('EMAIL', 'raj.venkat@example.com'),
    ],
    keep: ['Kestrel Logistics Ltd', 'Friday 20 November 2026', 'trade union representative', 'final written warning'],
  },
  {
    id: 'insurance',
    title: 'Insurance claim refused, two policyholders',
    text: `Marlowe Mutual Insurance
Claims Department

Policy number: HM/2209/774102
Claim reference: CL-88213-B

Dr Yasmin El-Sayed & Mr Callum Fraser
The Old Bakery
3 Withy Lane
Totnes
TQ9 5EJ

Dear Dr El-Sayed and Mr Fraser,

YOUR CLAIM FOR WATER DAMAGE

We are sorry to tell you that we cannot pay your claim for the damage to the kitchen ceiling reported on 19 October 2026.

Our surveyor's report found that the leak was caused by gradual seepage from a bath seal over a period of months. Your policy excludes damage that happens gradually (section 4, exclusion 7). It covers sudden and unexpected escapes of water only.

If you disagree, you can ask us to review the decision within 8 weeks. Send any new evidence, such as a plumber's report, to the address above. If you are still unhappy after our final response, you can refer your complaint to the Financial Ombudsman Service within 6 months.

Yours sincerely,
Bernard Achterberg
Senior Claims Handler
Direct line: 01632 960243
`,
    gold: [
      g('PERSON', 'Yasmin'),
      g('PERSON', 'El-Sayed'),
      g('PERSON', 'Callum'),
      g('PERSON', 'Fraser'),
      g('PERSON', 'Achterberg', 'other'),
      g('ADDRESS', 'The Old Bakery'),
      g('ADDRESS', '3 Withy Lane'),
      g('POSTCODE', 'TQ9 5EJ'),
      g('ID_NUMBER', 'HM/2209/774102'),
      g('ID_NUMBER', 'CL-88213-B'),
    ],
    keep: ['gradual seepage', 'section 4, exclusion 7', '8 weeks', '6 months'],
  },
  {
    id: 'debt',
    title: 'Letter before claim from a debt recovery firm',
    text: `Ashdown Recoveries LLP

Our client: Brightwell Energy
Our reference: AR/55102/JK
Amount claimed: £1,902.66

Ms Jadwiga Kowalczyk-O'Brien
Flat 12, Mariner Court
Dock Street
Hull
HU1 1TB

LETTER BEFORE CLAIM

Dear Ms Kowalczyk-O'Brien,

We act for the client named above. Our client says you owe £1,902.66 for energy supplied to Flat 12, Mariner Court between March 2024 and February 2025.

You have 30 days from the date of this letter to reply. If you do not reply, our client may start court proceedings without further notice, which could increase the amount you owe and affect your credit record.

You should complete the enclosed reply form. If you say you need debt advice, we will wait at least a further 30 days. If you dispute the debt, tell us why and send any documents you rely on. Part of this debt may be more than six years old and you may wish to take advice about that.

Yours faithfully,
Ashdown Recoveries LLP
`,
    gold: [
      g('PERSON', 'Jadwiga'),
      g('PERSON', "Kowalczyk-O'Brien"),
      g('ADDRESS', 'Mariner Court'),
      g('ADDRESS', 'Dock Street'),
      g('POSTCODE', 'HU1 1TB'),
      g('ID_NUMBER', 'AR/55102/JK'),
    ],
    keep: ['LETTER BEFORE CLAIM', '£1,902.66', '30 days', 'six years'],
  },
  {
    id: 'blood-test',
    title: 'Blood test results from a GP practice',
    text: `Riverside Medical Practice

Patient: Thandiwe Mokoena
Born: 14 February 1991
Patient number: 485 777 3456

Dear Thandiwe,

Your blood test results from 4 November 2026 are back. Your ferritin level is 9 µg/L, which is below the normal range and suggests iron deficiency. Your haemoglobin is 118 g/L, which is slightly low.

Dr Imogen Castellanos would like you to start ferrous fumarate 210 mg tablets, one tablet twice a day, and to repeat the blood test in 8 weeks. Please collect the prescription from Hartley's Pharmacy on Bridge Street.

If you get severe stomach pain or black stools that worry you, contact the practice. To book the repeat test, text your name and date of birth to 07700 900812.

With best wishes,
Riverside Medical Practice
`,
    gold: [
      g('PERSON', 'Thandiwe'),
      g('PERSON', 'Mokoena'),
      g('PERSON', 'Castellanos', 'other'),
      g('DOB', '14 February 1991'),
      g('ID_NUMBER', '485 777 3456'),
    ],
    keep: ['Riverside Medical Practice', 'ferritin', '9 µg/L', '210 mg', '8 weeks'],
  },
];
