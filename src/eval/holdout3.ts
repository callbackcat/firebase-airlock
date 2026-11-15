import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Third hold-out set, and the one whose numbers are reported as the result.
 * Both earlier hold-out sets ended up informing patterns, so neither is a
 * clean test any more. These eight were written after the last change to the
 * prompts and patterns and have only ever been measured. If you tune on them,
 * write a fourth set. Every person, organisation, address and number here is
 * made up.
 *
 * Run with `EVAL_SET=holdout3 npm run eval`.
 */
const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const HOLDOUT3: Fixture[] = [
  {
    id: 'clinic-letter-to-gp',
    title: 'Consultant letter to a GP',
    text: `Northfield Cardiology Department
St Aldhelm's Hospital

Dictated 12 November 2026

Dr K. Venkatesan
Brookside Health Centre

Re: Mr Tendai Moyo, DOB 12.04.1957, 5 Alder Court, Sycamore Road, Swindon SN2 7LF
Hospital no. T0384471

Dear Dr Venkatesan,

Thank you for referring this 69-year-old retired bus driver, whom I saw in clinic today with his wife, Rutendo.

He describes chest tightness on climbing stairs for the past three months. His ECG showed sinus rhythm. An echocardiogram showed moderately reduced left ventricular function with an ejection fraction of 40%.

I have started bisoprolol 2.5 mg once daily and ramipril 2.5 mg once daily, and requested a CT coronary angiogram. I would be grateful if you could check his kidney function in two weeks.

I will see Mr Moyo again in eight weeks.

Yours sincerely,

Mr Anselm Fitzwilliam-Hart
Consultant Cardiologist
`,
    gold: [
      g('PERSON', 'Tendai'),
      g('PERSON', 'Moyo'),
      g('PERSON', 'Rutendo'),
      g('DOB', '12.04.1957'),
      g('ADDRESS', '5 Alder Court'),
      g('ADDRESS', 'Sycamore Road'),
      g('POSTCODE', 'SN2 7LF'),
      g('ID_NUMBER', 'T0384471'),
      g('PERSON', 'Venkatesan', 'other'),
      g('PERSON', 'Anselm', 'other'),
      g('PERSON', 'Fitzwilliam-Hart', 'other'),
    ],
    keep: ['bisoprolol 2.5 mg', 'ejection fraction of 40%', 'CT coronary angiogram', 'two weeks', 'eight weeks', 'chest tightness'],
  },
  {
    id: 'contact-form',
    title: 'Web contact form, all lower case',
    text: `CONTACT FORM SUBMISSION

name: liesel abendroth
email: l.abendroth@mailhaus.example
order: #A-5538201
phone: 07700 900745
message: my sofa was meant to arrive on the 9th. the driver (his name was Dariusz) rang to say he couldnt find the house and left. i live at orchard barn, low green, nr. pateley bridge - it is the last house on the track. i took a day off work for this. i want it redelivered this week or a full refund of the £1,349.
`,
    gold: [
      g('PERSON', 'liesel'),
      g('PERSON', 'abendroth'),
      g('EMAIL', 'l.abendroth@mailhaus.example'),
      g('ID_NUMBER', 'A-5538201'),
      g('PHONE', '07700 900745'),
      g('ADDRESS', 'orchard barn'),
      g('ADDRESS', 'low green'),
      g('PERSON', 'Dariusz', 'other'),
    ],
    keep: ['sofa', 'full refund', '£1,349', 'day off work'],
  },
  {
    id: 'probate-letter',
    title: 'Solicitor letter about an estate',
    text: `Pargeter Lowe Solicitors LLP
Our ref: HWL/PRB/2026/0719
Your ref: none

14 November 2026

Mrs Delphine Achterberg-Noakes
Flat 2, 30 Verulam Gardens
St Albans
AL3 4DZ

Dear Mrs Achterberg-Noakes,

Estate of the late Cuthbert James Noakes

We act for the executors of your late father's estate. Probate was granted on 28 October 2026.

Under the will dated 3 March 2019 you are to receive a legacy of £25,000 and a one-third share of the residuary estate. Your brothers, Lucian and Barnaby, receive the other two thirds.

Before we can pay the legacy we need to verify your identity. Please send a certified copy of your passport and a utility bill dated within the last three months. We will also need the details of the bank account you would like the money paid into.

We expect to make an interim payment by the end of January 2027.

Yours sincerely,

Henrietta W. Lowe
Partner
`,
    gold: [
      g('PERSON', 'Delphine'),
      g('PERSON', 'Achterberg-Noakes'),
      g('PERSON', 'Cuthbert'),
      g('PERSON', 'Noakes'),
      g('PERSON', 'Lucian'),
      g('PERSON', 'Barnaby'),
      g('ADDRESS', '30 Verulam Gardens'),
      g('POSTCODE', 'AL3 4DZ'),
      g('ID_NUMBER', 'HWL/PRB/2026/0719'),
      g('PERSON', 'Henrietta', 'other'),
    ],
    keep: ['£25,000', 'one-third share', 'Probate', 'certified copy of your passport', 'January 2027'],
  },
  {
    id: 'university-email',
    title: 'University email about an extension',
    text: `From: Student Support <support@uni-harwell.example>
To: Oluwadamilare Akinfenwa <o.akinfenwa@students.uni-harwell.example>
Subject: Extension request EX-2026-33871 - decision

Dear Oluwadamilare,

Student ID: 21904473
Module: CS3104 Distributed Systems
Assessment: Coursework 2

Your request for an extension has been approved. Your new deadline is 23:59 on Friday 4 December 2026. Work handed in after this will be capped at 40%.

The medical evidence you sent from Dr Halloran-Pike has been stored securely and will not be shared with your module leader, Prof. Ingeborg Strand.

If your circumstances change, reply to this email or book an appointment with your personal tutor.

Best wishes,
Nkechi
Student Support Team
`,
    gold: [
      g('PERSON', 'Oluwadamilare'),
      g('PERSON', 'Akinfenwa'),
      g('EMAIL', 'o.akinfenwa@students.uni-harwell.example'),
      g('ID_NUMBER', '21904473'),
      g('ID_NUMBER', 'EX-2026-33871'),
      g('PERSON', 'Halloran-Pike', 'other'),
      g('PERSON', 'Ingeborg', 'other'),
      g('PERSON', 'Strand', 'other'),
      g('PERSON', 'Nkechi', 'other'),
    ],
    keep: ['Friday 4 December 2026', 'capped at 40%', 'CS3104', 'Coursework 2', 'approved'],
  },
  {
    id: 'car-insurance-renewal',
    title: 'Car insurance renewal',
    text: `Kestrel & Vane Insurance
Your motor policy renewal

Policyholder: Mr Farrukh Tashkentov
Policy: KV-MTR-00482917
Vehicle: 2019 Skoda Octavia 1.6 TDI, registration FD19 XWK
Named driver: Mrs Gulnora Tashkentova

Your policy ends on 1 December 2026. Your renewal price is £684.20 for the year, or 11 monthly payments of £68.42 after a deposit of £68.42. Last year you paid £611.75.

Your no-claims discount is 7 years. The compulsory excess is £350.

You do not need to do anything if you want to renew. We will take payment from the card ending 3306 on 24 November 2026. If you do not want to renew, tell us before then on 0333 496 0191.

We wrote to you at 12 Kiln Way, Telford TF3 5BN. If your address has changed, let us know.
`,
    gold: [
      g('PERSON', 'Farrukh'),
      g('PERSON', 'Tashkentov'),
      g('PERSON', 'Gulnora'),
      g('PERSON', 'Tashkentova'),
      g('ID_NUMBER', 'KV-MTR-00482917'),
      g('OTHER', 'FD19 XWK'),
      g('ADDRESS', '12 Kiln Way'),
      g('POSTCODE', 'TF3 5BN'),
    ],
    keep: ['£684.20', '1 December 2026', '£611.75', '7 years', '£350', '24 November 2026', 'Skoda Octavia'],
  },
  {
    id: 'australian-medicare',
    title: 'Medicare letter from Australia',
    text: `Services Australia
Medicare

Ms Bronte Papadimitriou
Unit 7, 118 Wattle Grove Parade
Marrickville NSW 2204

Medicare card number: 2953 81746 1
Reference: MC-4471-22-8830

Dear Ms Papadimitriou,

We have assessed your claim for the specialist consultation on 28 October 2026 with Dr Lachlan O'Shaughnessy.

The fee charged was $280.00. The Medicare benefit is $81.30, which we paid into your nominated bank account (BSB 062-000, account 1182 4473) on 10 November 2026. Your out-of-pocket cost was $198.70.

This amount counts towards your Medicare Safety Net. Your family has reached $1,412.50 of the $2,615.50 threshold for 2026.

If you think this is wrong, call 132 011.
`,
    gold: [
      g('PERSON', 'Bronte'),
      g('PERSON', 'Papadimitriou'),
      g('ADDRESS', '118 Wattle Grove Parade'),
      g('POSTCODE', '2204'),
      g('ID_NUMBER', '2953 81746 1'),
      g('ID_NUMBER', 'MC-4471-22-8830'),
      g('ACCOUNT', '062-000'),
      g('ACCOUNT', '1182 4473'),
      g('PERSON', 'Lachlan', 'other'),
      g('PERSON', "O'Shaughnessy", 'other'),
    ],
    keep: ['$81.30', '$198.70', 'Medicare Safety Net', '$2,615.50', '28 October 2026'],
  },
  {
    id: 'job-offer-email',
    title: 'Recruiter email with a signature block',
    text: `Hi Séverine,

Great to speak just now. As discussed, Halden Biotech would like to offer you the Senior Analyst role at £58,000 plus a 10% bonus, starting Monday 11 January 2027.

Could you send me two things by Wednesday:
- a scan of your passport (or right-to-work share code)
- the name and email of your current line manager for a reference

I've copied in Jonty from our onboarding team, who will send the contract. If anything in it looks off, call me directly.

Speak soon,

Maeve O'Riordan-Castle
Principal Consultant | Tidewater Talent
m: 07700 900963
maeve.orc@tidewatertalent.example
linkedin.com/in/maeve-oriordan-castle-4b7719
`,
    gold: [
      g('PERSON', 'Séverine'),
      g('PERSON', 'Maeve', 'other'),
      g('PERSON', "O'Riordan-Castle", 'other'),
      g('PERSON', 'Jonty', 'other'),
      g('PHONE', '07700 900963', 'other'),
      g('EMAIL', 'maeve.orc@tidewatertalent.example', 'other'),
      g('OTHER', 'maeve-oriordan-castle-4b7719', 'other'),
    ],
    keep: ['£58,000', '10% bonus', 'Monday 11 January 2027', 'Halden Biotech', 'Senior Analyst', 'Wednesday'],
  },
  {
    id: 'possession-notice',
    title: 'Notice requiring possession from a private landlord',
    text: `NOTICE REQUIRING POSSESSION
Housing Act 1988, section 21

To: Yevgenia Kravchenko and Mateus Oliveira-Santos
Of: Ground Floor Flat, 9 Pemberton Villas, Leicester LE2 1TN

From: Cedric Ashdown-Reeve (landlord), c/o Farthing Lettings, 2 Market Place, Leicester

I give you notice that I require possession of the property above after 31 January 2027.

If you do not leave by that date, I may apply to the court for a possession order. You are entitled to stay in the property until a court orders you to leave.

Your deposit of £1,150 is protected with MyDeposits under certificate 88410276.

If you need advice, contact Shelter or Citizens Advice as soon as possible.

Signed: C. Ashdown-Reeve
Dated: 15 November 2026
`,
    gold: [
      g('PERSON', 'Yevgenia'),
      g('PERSON', 'Kravchenko'),
      g('PERSON', 'Mateus'),
      g('PERSON', 'Oliveira-Santos'),
      g('ADDRESS', '9 Pemberton Villas'),
      g('POSTCODE', 'LE2 1TN'),
      g('ID_NUMBER', '88410276'),
      g('PERSON', 'Cedric', 'other'),
      g('PERSON', 'Ashdown-Reeve', 'other'),
    ],
    keep: ['31 January 2027', 'section 21', '£1,150', 'possession order', 'Shelter', 'Citizens Advice', 'MyDeposits'],
  },
];
