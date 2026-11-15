import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Second hold-out set. The first one (holdout.ts) was used to find weak points
 * once the second pass and the review marks were being built, so it stopped
 * being a clean test. These eight were written afterwards and are only ever
 * measured, never tuned on. Every person, organisation, address and number
 * here is made up.
 *
 * Run with `EVAL_SET=holdout2 npm run eval`.
 */
const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const HOLDOUT2: Fixture[] = [
  {
    id: 'job-application',
    title: 'Job application email',
    text: `Subject: Application for Night Shift Supervisor (ref NS-0412)

Dear Hiring Team,

I am writing to apply for the Night Shift Supervisor role at your Avonmouth depot. I have six years of warehouse experience, the last three as a team leader at Kestrel Freight.

My current manager, Bronagh Tierney, is happy to give a reference and can be reached on 07700 900671. I hold a counterbalance forklift licence, which I renewed in March 2026.

I live in Shirehampton, ten minutes from the depot, and can start from 4 January 2027.

Kind regards,
Emeka Nwosu
emeka.nwosu91@postbox.example
07700 900158
Flat 4, Linnet House, Station Road, Shirehampton, Bristol BS11 9XB
`,
    gold: [
      g('PERSON', 'Emeka'),
      g('PERSON', 'Nwosu'),
      g('EMAIL', 'emeka.nwosu91@postbox.example'),
      g('PHONE', '07700 900158'),
      g('ADDRESS', 'Linnet House'),
      g('ADDRESS', 'Station Road'),
      g('POSTCODE', 'BS11 9XB'),
      g('PERSON', 'Bronagh', 'other'),
      g('PERSON', 'Tierney', 'other'),
      g('PHONE', '07700 900671', 'other'),
    ],
    keep: ['Night Shift Supervisor', 'Kestrel Freight', 'six years', '4 January 2027', 'forklift'],
  },
  {
    id: 'text-messages',
    title: 'Family text messages, lower case',
    text: `Mum: did the hospital ring you back about Dads scan
Kasia: yes just now. its on the 3rd at 2.15, ward 7 at St Colmans. they said bring his medication list
Mum: ok. can you take him? i have work
Kasia: yes. his hospital number is K4420917 if they ask. dr Oyelaran is the consultant
Mum: thanks love. tell Mirek to ring me tonight
`,
    gold: [
      g('PERSON', 'Kasia'),
      g('PERSON', 'Mirek'),
      g('ID_NUMBER', 'K4420917'),
      g('PERSON', 'Oyelaran', 'other'),
    ],
    keep: ['ward 7', '2.15', 'medication list', 'scan'],
  },
  {
    id: 'irish-tax-demand',
    title: 'Tax demand from Ireland',
    text: `Revenue Commissioners
Collector-General's Division
Sarsfield House, Francis Street, Limerick

Ms Gráinne Ó Súilleabháin
Apartment 12, The Maltings
Bow Lane West
Dublin 8
D08 XK7P

PPSN: 7482913TA
Notice number: 26/1140-9983

15 November 2026

A Chara,

FINAL DEMAND - INCOME TAX 2025

Our records show that €2,318.44 remains unpaid on your Income Tax account for 2025. Interest is being charged at 0.0219% per day.

If payment is not received within 7 days of the date of this notice, the debt may be referred to the Sheriff or a solicitor for collection, or we may attach your earnings or bank account.

You can pay through myAccount or by calling 01 738 3663. If you cannot pay in full, contact us about a phased payment arrangement.

Mise le meas,
Pádraig Mac Giolla Phádraig
Collector-General
`,
    gold: [
      g('PERSON', 'Gráinne'),
      g('PERSON', 'Ó Súilleabháin'),
      g('ADDRESS', 'The Maltings'),
      g('ADDRESS', 'Bow Lane West'),
      g('POSTCODE', 'D08 XK7P'),
      g('ID_NUMBER', '7482913TA'),
      g('ID_NUMBER', '26/1140-9983'),
      g('PERSON', 'Pádraig', 'other'),
      g('PERSON', 'Mac Giolla Phádraig', 'other'),
    ],
    keep: ['€2,318.44', '7 days', 'Income Tax', 'phased payment arrangement', 'Sheriff'],
  },
  {
    id: 'vet-invoice',
    title: 'Vet invoice',
    text: `MEADOWBROOK VETERINARY CENTRE
INVOICE 004-88127

Client: Mrs R Balasubramaniam          Client ID: 20391
17 Ferndale Avenue, Harrogate HG2 8PQ
Patient: "Biscuit" (cat, female, 6 yrs)

Date        Item                              Amount
12/11/26    Consultation - Dr S. Thorne       £48.00
12/11/26    Blood panel (renal)               £96.50
12/11/26    Fluid therapy, 1 day              £120.00
                                 Total        £264.50
                                 Paid (card ending 9914)   £100.00
                                 Balance due  £164.50

Please pay the balance within 14 days. Insurance claim forms should be sent to claims@meadowbrookvets.example quoting policy PET/7730921/B.
`,
    gold: [
      g('PERSON', 'Balasubramaniam'),
      g('ADDRESS', '17 Ferndale Avenue'),
      g('POSTCODE', 'HG2 8PQ'),
      g('ID_NUMBER', '20391'),
      g('ID_NUMBER', 'PET/7730921/B'),
      g('PERSON', 'Thorne', 'other'),
    ],
    keep: ['£164.50', '14 days', 'Blood panel', 'Fluid therapy', '£264.50'],
  },
  {
    id: 'court-claim',
    title: 'County court notice of issue',
    text: `In the County Court Money Claims Centre
Claim Number: 418MC772

Claimant: Northgate Parking Enforcement Ltd
Defendant: Mr Ravindra Seneviratne, 3 Hollin Bank, Sowerby Bridge, HX6 3DE

NOTICE OF ISSUE

The claimant claims £185.00 for an unpaid parking charge plus £35.00 court fee and £50.00 legal representative's costs. Total: £270.00.

You have 14 days from the date of service to respond. You can pay the amount claimed, admit the claim and ask for time to pay, or file a defence. If you do nothing, judgment may be entered against you.

To respond online you will need the claim number above and the password R7KQ-22XM.

Issued on 12 November 2026.
`,
    gold: [
      g('PERSON', 'Ravindra'),
      g('PERSON', 'Seneviratne'),
      g('ADDRESS', '3 Hollin Bank'),
      g('POSTCODE', 'HX6 3DE'),
      g('ID_NUMBER', '418MC772'),
      g('OTHER', 'R7KQ-22XM'),
    ],
    keep: ['£270.00', '14 days', 'Northgate Parking Enforcement Ltd', 'file a defence', 'judgment'],
  },
  {
    id: 'note-to-teacher',
    title: 'Note from a parent to a teacher',
    text: `To Miss Achterhof, Class 4B

Please excuse Tobiah from swimming this Thursday. He has had an ear infection and the doctor has said no swimming for two weeks. He can do the classroom activity instead.

He will also need to leave at 2pm on Friday 20 November for a hospital appointment. His grandmother, June Castellane, will collect him from the office.

Any problems, ring me on 07700 900480.

Thanks,
Imani Castellane-Ward (Tobiah's mum)
`,
    gold: [
      g('PERSON', 'Tobiah'),
      g('PERSON', 'Imani'),
      g('PERSON', 'Castellane-Ward'),
      g('PERSON', 'June'),
      g('PHONE', '07700 900480'),
      g('PERSON', 'Achterhof', 'other'),
    ],
    keep: ['ear infection', 'two weeks', '2pm', 'Friday 20 November', 'swimming'],
  },
  {
    id: 'bank-dispute',
    title: 'Letter disputing a card payment',
    text: `Dear Sir or Madam,

Disputed card payment - current account 60-83-71 21904457

On 3 November 2026 a payment of £412.99 was taken from my account by "ELECTROHUB ONLINE". I did not make or authorise this payment. My card has not left my possession.

I reported this by phone on 4 November and was given the case reference DSP-2611-04481. I was told I would be refunded within 5 working days. That has not happened.

Under the Payment Services Regulations 2017 you must refund an unauthorised payment by the end of the next business day. Please refund £412.99 and confirm in writing within 7 days. If you do not, I will complain to the Financial Ombudsman Service.

Please pay any compensation to the same account (IBAN GB29 NWBK 6083 7121 9044 57).

Yours faithfully,

Ngozi Adeyinka-Clarke
88 Cromwell Rise, Coventry CV3 5GH
`,
    gold: [
      g('PERSON', 'Ngozi'),
      g('PERSON', 'Adeyinka-Clarke'),
      g('ADDRESS', '88 Cromwell Rise'),
      g('POSTCODE', 'CV3 5GH'),
      g('ACCOUNT', '60-83-71'),
      g('ACCOUNT', '21904457'),
      g('ID_NUMBER', 'DSP-2611-04481'),
      g('ACCOUNT', 'GB29 NWBK 6083 7121 9044 57'),
    ],
    keep: ['£412.99', 'Payment Services Regulations 2017', 'Financial Ombudsman Service', '5 working days', 'ELECTROHUB ONLINE'],
  },
  {
    id: 'home-visit-note',
    title: 'Home visit note, names without titles',
    text: `Home visit note - 13 November 2026

Visited Walter Prendergast (82) at home with his son Alasdair present. Walter lives alone at Bramble Cottage, Chapel Lane, Kirkby Lonsdale since his wife Edith died in 2024.

Walter is managing meals with help from a neighbour, Shirin, who visits most days. He had two falls in October, both in the bathroom. No injuries, but he did not tell anyone at the time.

Agreed actions:
1. Occupational therapy referral for bathroom grab rails and a shower seat.
2. Pendant alarm to be fitted. Alasdair will be the first contact (07700 900392).
3. Medication review with the GP: Walter is unsure which tablets he takes in the evening.

Next visit in 4 weeks.

Notes by Folasade Mbeki, community support worker
`,
    gold: [
      g('PERSON', 'Walter'),
      g('PERSON', 'Prendergast'),
      g('PERSON', 'Alasdair'),
      g('PERSON', 'Edith'),
      g('ADDRESS', 'Bramble Cottage'),
      g('ADDRESS', 'Chapel Lane'),
      g('PHONE', '07700 900392'),
      g('PERSON', 'Shirin', 'other'),
      g('PERSON', 'Folasade', 'other'),
      g('PERSON', 'Mbeki', 'other'),
    ],
    keep: ['two falls', 'grab rails', 'Pendant alarm', 'Medication review', '4 weeks', 'Occupational therapy'],
  },
];
