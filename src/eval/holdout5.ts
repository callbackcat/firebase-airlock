import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Fifth hold-out set. holdout4 was the clean test for the third session. The
 * fourth session changed how the model is called (one call instead of two) to
 * make the scrub faster, and one of its prompts was written knowing which
 * kinds of detail holdout4 had missed, so holdout4 is no longer a clean test.
 * These eight were written after the new call was chosen on the older sets
 * and before any result from them was seen. They have only ever been
 * measured. Every person, organisation, address and number here is made up.
 *
 * The last letter is longer than one piece (over 4,000 characters), which no
 * earlier set had.
 *
 * Run with `EVAL_SET=holdout5 npm run eval`.
 */
const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const HOLDOUT5: Fixture[] = [
  {
    id: 'physio-referral',
    title: 'Physiotherapy referral',
    text: `Wensum Valley Musculoskeletal Service
Referral received: 9 November 2026

Dear Mr Adebayo,

Your GP, Dr Priyanka Raghunathan, has referred you to us for physiotherapy for lower back pain that has lasted more than twelve weeks.

We have booked you a first assessment:

Tuesday 1 December 2026 at 2.20pm
with Keziah Blackwood, Senior Physiotherapist
Thorpe Road Health Centre, first floor

The assessment takes about 40 minutes. Please wear loose clothing and bring a list of any medicines you take. If you have had an MRI or X-ray in the last year, tell us when you arrive.

If you cannot attend, call 01603 496 0142 at least 24 hours before. If you miss the appointment without telling us, you will be discharged back to your GP.

Our records show your details as:
Folarin Adebayo, 17B Carrow Hill Terrace, Norwich NR1 2AH
Hospital number: W4481920
Mobile: 07700 900381

Yours sincerely,
Bookings Team
`,
    gold: [
      g('PERSON', 'Adebayo'),
      g('PERSON', 'Folarin'),
      g('ADDRESS', '17B Carrow Hill Terrace'),
      g('POSTCODE', 'NR1 2AH'),
      g('ID_NUMBER', 'W4481920'),
      g('PHONE', '07700 900381'),
      g('PERSON', 'Raghunathan', 'other'),
      g('PERSON', 'Priyanka', 'other'),
      g('PERSON', 'Keziah', 'other'),
      g('PERSON', 'Blackwood', 'other'),
    ],
    keep: ['lower back pain', 'Tuesday 1 December 2026', '2.20pm', '40 minutes', '24 hours', 'discharged back to your GP'],
  },
  {
    id: 'parking-charge',
    title: 'Parking charge notice',
    text: `PENALTY CHARGE NOTICE
Traffic Management Act 2004

Notice number: KX60418822
Date of notice: 11 November 2026

To: Mrs Solveig Haraldsen-Pike
4 Tannery Row
Kendal
LA9 4HE

Vehicle registration: PK19 ZTU      Make: Vauxhall      Colour: Grey

A civil enforcement officer (number 0417) had reason to believe that the following contravention occurred at Stricklandgate car park on 4 November 2026 at 16:52:

Code 83: Parked in a car park without clearly displaying a valid pay and display ticket.

The penalty charge is £50. If you pay within 14 days of the date of this notice the charge is reduced to £25. If you do not pay or challenge within 28 days, the charge may increase to £75.

You can pay online or by phone on 0300 496 0184 quoting the notice number. To challenge, write to us explaining why you believe the charge should be cancelled. If you were not the driver, you are still responsible as the registered keeper.
`,
    gold: [
      g('PERSON', 'Solveig'),
      g('PERSON', 'Haraldsen-Pike'),
      g('ADDRESS', '4 Tannery Row'),
      g('POSTCODE', 'LA9 4HE'),
      g('ID_NUMBER', 'KX60418822'),
      g('ID_NUMBER', 'PK19 ZTU'),
    ],
    keep: ['£50', '14 days', '£25', '28 days', '£75', 'Code 83', 'registered keeper'],
  },
  {
    id: 'builder-texts',
    title: 'Text messages with a builder',
    text: `Mon 9 Nov
Me: Hi Dmitri, the new flat roof is leaking again where it meets the kitchen wall. Water came through the ceiling last night. Can you come and look?
Dmitri: sorry to hear. was it the corner by the boiler flue
Me: Yes that corner. You said in September it was fully sealed.
Dmitri: it was. could be the flashing lifted in the wind. i can come thursday am
Me: Thursday is fine. I've paid the full £6,800 so I expect this fixed under the guarantee.
Dmitri: guarantee covers workmanship 2 yrs, will sort it. whats the address again
Me: 31 Fenwick Gardens, the one with the green door. Please ring my wife Anneliese if I'm out, 07700 900762.
Dmitri: ok. my lad osman will come with me
Thu 12 Nov
Me: Nobody turned up this morning?
Dmitri: van broke down. tomorrow 8am definitely
Me: If it isn't fixed by Monday I'll get someone else in and send you the bill. Invoice was no. VR-2291 from Volkov Roofing if you need it.
`,
    gold: [
      g('ADDRESS', '31 Fenwick Gardens'),
      g('PERSON', 'Anneliese'),
      g('PHONE', '07700 900762'),
      g('PERSON', 'Dmitri', 'other'),
      g('PERSON', 'osman', 'other'),
      g('ID_NUMBER', 'VR-2291', 'other'),
    ],
    keep: ['flat roof', '£6,800', 'guarantee', '2 yrs', 'flashing', 'September'],
  },
  {
    id: 'pension-statement',
    title: 'Annual pension statement',
    text: `Harbourlight Workplace Pension
Annual benefit statement for the year to 5 April 2026

Member: Tomasz Wiśniewski-Grant
Member number: 00731846
National Insurance number: PA 51 27 39 C
Date of birth: 14 June 1971
Employer: Castlegate Bakeries Ltd

Your pension pot
Value at 6 April 2025                 £41,206.33
Your contributions this year          £2,340.00
Employer contributions this year      £1,755.00
Investment growth after charges       £2,918.40
Value at 5 April 2026                 £48,219.73

What this might give you
If you retire at 67 and keep paying in at the current rate, we estimate a pot of £83,500 in today's money. That could buy an income of about £4,300 a year. This is an estimate, not a promise.

Your nominated beneficiary is Katarzyna Wiśniewska (100%). If your circumstances have changed, update your nomination online or write to us.

Your selected retirement age is 67. You can change it at any time before you take your benefits.
`,
    gold: [
      g('PERSON', 'Tomasz'),
      g('PERSON', 'Wiśniewski-Grant'),
      g('ID_NUMBER', '00731846'),
      g('ID_NUMBER', 'PA 51 27 39 C'),
      g('DOB', '14 June 1971'),
      g('PERSON', 'Katarzyna'),
      g('PERSON', 'Wiśniewska'),
    ],
    keep: ['£48,219.73', '£83,500', '£4,300 a year', 'retire at 67', '£2,340.00', 'nominated beneficiary'],
  },
  {
    id: 'irish-immigration',
    title: 'Immigration registration appointment (Ireland)',
    text: `Immigration Service Delivery
Registration Office, Burgh Quay, Dublin 2

13 November 2026

Ms Thandiwe Mokoena
Apartment 12, Linenhall Court
Smithfield
Dublin 7
D07 K8R2

Application reference: IRP-2026-0558713
Passport number: A04829175

Dear Ms Mokoena,

Your appointment to renew your Irish Residence Permit (Stamp 1G) has been made for Wednesday 9 December 2026 at 10:40.

You must bring:
- your current passport
- your current Irish Residence Permit card
- a letter from your employer, Tolka Analytics, dated within the last month
- proof of private medical insurance
- the fee of €300, payable by card only

Your current permission expires on 4 January 2027. If you do not attend, you may be left without permission to remain in the State.

If the name on your passport has changed since your last registration, bring your marriage certificate or deed poll.

Registration Office
`,
    gold: [
      g('PERSON', 'Thandiwe'),
      g('PERSON', 'Mokoena'),
      g('ADDRESS', 'Linenhall Court'),
      g('POSTCODE', 'D07 K8R2'),
      g('ID_NUMBER', 'IRP-2026-0558713'),
      g('ID_NUMBER', 'A04829175'),
    ],
    keep: ['Wednesday 9 December 2026', '10:40', '€300', '4 January 2027', 'Stamp 1G', 'private medical insurance'],
  },
  {
    id: 'broadband-ticket',
    title: 'Broadband fault support email',
    text: `From: support@fernlinebroadband.example
To: g.mbeki-hartley@postbox.example
Subject: Re: No connection since Saturday [Ticket 4471-88213]

Hi Gabriel,

Thanks for getting back to me, and sorry you are still offline.

I have run a line test on your account (FB-20931744) and it shows a fault between the cabinet and your property at 8 Ropewalk Cottages. That is not something we can fix remotely, so I have booked an engineer:

Monday 16 November, between 8am and 1pm

Someone over 18 needs to be home. The engineer will call the number we have for you ending 2290 when they are on the way.

Because you have been without service for more than two full working days, you are due automatic compensation of £9.76 for each day until it is fixed. It will appear as a credit on your next bill. You do not need to claim it.

If the engineer does not arrive, reply to this email and I will escalate it. Your router login has not changed: the username is still gmbeki_hartley.

Kind regards,
Aroha Tane
Technical Support, Fernline Broadband
`,
    gold: [
      g('PERSON', 'Gabriel'),
      g('EMAIL', 'g.mbeki-hartley@postbox.example'),
      g('ID_NUMBER', 'FB-20931744'),
      g('ADDRESS', '8 Ropewalk Cottages'),
      g('OTHER', 'gmbeki_hartley'),
      g('ID_NUMBER', '4471-88213'),
      g('PERSON', 'Aroha', 'other'),
      g('PERSON', 'Tane', 'other'),
    ],
    keep: ['Monday 16 November', 'between 8am and 1pm', '£9.76', 'automatic compensation', 'two full working days', 'line test'],
  },
  {
    id: 'vet-bill-terrier',
    title: 'Vet invoice',
    text: `Millbrook Veterinary Practice
INVOICE 118204

Client: Mr R. Achterberg          Client no: C-55071
Address: Rose Cottage, Back Lane, Settle BD24 9EX
Patient: "Biscuit", border terrier, male neutered, 9 years
Date: 12/11/2026
Vet: Dr Imogen Fairweather-Osei MRCVS

Consultation (lameness, left hind)              £58.00
Sedation and two radiographs                    £214.50
Meloxicam oral suspension 32 ml                 £27.80
Joint supplement, 60 chews                      £31.00
                                     Subtotal   £331.30
                                     VAT 20%    £66.26
                                     Total      £397.56

Paid by card on the day: £397.56. Balance: £0.00

Notes: X-rays show early arthritis in the left stifle. Give meloxicam once a day with food. Stop and call us if he vomits or goes off his food. Short lead walks only for two weeks. Recheck in 3 weeks.

Insured with Paws & Whiskers, policy PW/7730215. We have sent the claim form to them for you.
`,
    gold: [
      g('PERSON', 'Achterberg'),
      g('ID_NUMBER', 'C-55071'),
      g('ADDRESS', 'Rose Cottage'),
      g('ADDRESS', 'Back Lane'),
      g('POSTCODE', 'BD24 9EX'),
      g('ID_NUMBER', 'PW/7730215'),
      g('PERSON', 'Imogen', 'other'),
      g('PERSON', 'Fairweather-Osei', 'other'),
    ],
    keep: ['£397.56', 'early arthritis', 'meloxicam once a day', 'Recheck in 3 weeks', 'two weeks', 'border terrier'],
  },
  {
    id: 'gp-record-long',
    title: 'GP record summary (two pages)',
    text: `Ashgrove Family Practice
SUMMARY OF PATIENT RECORD, printed 13 November 2026 at the patient's request

Patient: Mrs Ottoline Zubiri-Maddox
Date of birth: 2 February 1958
NHS number: 485 777 3456
Address: 5 Quince Tree Walk, Ludlow SY8 1DN
Telephone: 01584 496 0177
Registered GP: Dr Benedikt Aaltonen
Next of kin: Mr Rafael Zubiri (son), 07700 900499

ACTIVE PROBLEMS
Type 2 diabetes mellitus, diagnosed March 2014
Hypertension, diagnosed 2011
Osteoarthritis of both knees, diagnosed 2019
Chronic kidney disease stage 3a, noted June 2023

CURRENT MEDICATION
Metformin 1 g twice a day
Ramipril 5 mg once a day
Atorvastatin 20 mg at night
Paracetamol 1 g up to four times a day when needed

ALLERGIES
Penicillin (rash, 1996). Elastoplast (skin reaction).

RECENT CONSULTATIONS

14 January 2026, telephone, Dr Aaltonen
Mrs Zubiri-Maddox rang about dizziness on standing over the past fortnight. No falls. Home blood pressure readings between 104/62 and 118/70. Advised to take ramipril at night instead of the morning and to keep a diary of readings for two weeks. Blood tests requested.

29 January 2026, surgery, Nurse Practitioner Folasade Idowu
Bloods reviewed. HbA1c 58 mmol/mol (was 61 in July 2025). eGFR 52, stable. Potassium 4.6. Dizziness has settled since moving ramipril to the evening. Diabetic foot check normal, pulses present, sensation intact. Reminded about eye screening, which is overdue.

11 March 2026, surgery, Dr Aaltonen
Knee pain worse on the right, struggling with stairs at home. Examination: small effusion, crepitus, no instability. Weight 81 kg. Discussed options. She does not want an injection at present. Referred to the community physiotherapy service. Advised to avoid ibuprofen and similar tablets because of her kidney function.

2 June 2026, surgery, Dr Yevgenia Stolarz (locum)
Productive cough for ten days, low-grade temperature, chest clear on the left with crackles at the right base. Oxygen saturation 95%. Because of the penicillin allergy, prescribed doxycycline 200 mg on day one, then 100 mg a day for six days. Safety-net advice given. Chest X-ray requested if not better in three weeks.

19 June 2026, telephone, Dr Aaltonen
Cough resolved, feels well. X-ray not needed. Her son Rafael asked on her behalf whether she should have the shingles vaccine; confirmed she is eligible and booked with the nurse.

7 September 2026, surgery, Nurse Practitioner Idowu
Annual diabetes review. HbA1c 55 mmol/mol. Blood pressure 128/74. Urine albumin to creatinine ratio 4.1, slightly raised. Weight 79 kg, down 2 kg since March. Discussed diet; she walks with a neighbour, Mrs Petronella Vance, three mornings a week. Flu vaccine given, batch FL2207K. Eye screening attended in August, no retinopathy.

21 October 2026, surgery, Dr Aaltonen
Review of kidney function. eGFR 49, a small fall. Urine ratio repeated: 5.3. Explained that this is a slow change and common with diabetes and age. Plan: continue ramipril, repeat bloods in three months, consider adding dapagliflozin if the ratio stays raised. She asked about driving; no restrictions. She is the main carer for her husband, Mr Desmond Maddox, who has Parkinson's disease, and says she is tired. Carer's assessment offered and information about the Shropshire carers' support line given.

REFERRALS
Community physiotherapy, referred 11 March 2026, seen April to June 2026, discharged with exercises.
Diabetic eye screening, routine recall, next due August 2027.

IMMUNISATIONS
Influenza 7 September 2026. Shingles 30 June 2026. COVID-19 booster 12 October 2025. Pneumococcal 2023.

This summary does not include the full record. To ask for a copy of everything we hold, write to the practice manager, Mrs Hyacinth Odukoya, quoting reference SAR/2026/0419.
`,
    gold: [
      g('PERSON', 'Ottoline'),
      g('PERSON', 'Zubiri-Maddox'),
      g('DOB', '2 February 1958'),
      g('ID_NUMBER', '485 777 3456'),
      g('ADDRESS', '5 Quince Tree Walk'),
      g('POSTCODE', 'SY8 1DN'),
      g('PHONE', '01584 496 0177'),
      g('PERSON', 'Rafael'),
      g('PERSON', 'Zubiri'),
      g('PHONE', '07700 900499'),
      g('PERSON', 'Desmond'),
      g('PERSON', 'Maddox'),
      g('ID_NUMBER', 'SAR/2026/0419'),
      g('PERSON', 'Aaltonen', 'other'),
      g('PERSON', 'Benedikt', 'other'),
      g('PERSON', 'Folasade', 'other'),
      g('PERSON', 'Idowu', 'other'),
      g('PERSON', 'Yevgenia', 'other'),
      g('PERSON', 'Stolarz', 'other'),
      g('PERSON', 'Petronella', 'other'),
      g('PERSON', 'Vance', 'other'),
      g('PERSON', 'Hyacinth', 'other'),
      g('PERSON', 'Odukoya', 'other'),
    ],
    keep: [
      'Type 2 diabetes mellitus',
      'Metformin 1 g twice a day',
      'Ramipril 5 mg',
      'Penicillin',
      'HbA1c 55 mmol/mol',
      'eGFR 49',
      'dapagliflozin',
      'doxycycline',
      'Chronic kidney disease stage 3a',
      'repeat bloods in three months',
    ],
  },
];
