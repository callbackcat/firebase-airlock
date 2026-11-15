import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Sixth hold-out set, for round 2 of the speed work. holdout5 became a
 * development set when its misses were written up and used. These eight were
 * written before any round 2 change was made and are measured once, at the
 * end. Three are heavy with medical vocabulary, two name several staff or
 * third parties, one is a lower-case chat and one is from outside the UK.
 * Every person, organisation, address and number here is made up.
 *
 * `medical` marks the useful facts that are medicines, conditions, tests,
 * procedures or doses, so they can be counted on their own.
 *
 * Run with `EVAL_SET=holdout6 npm run eval`.
 */
const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const HOLDOUT6: Fixture[] = [
  {
    id: 'cardiology-clinic',
    title: 'Cardiology clinic letter',
    text: `Department of Cardiology, Tyne Bridge Infirmary
Clinic date: 10 November 2026     Dictated: 11 November 2026

Dear Dr Oyinlola,

Re: Mr Bartholomew Eze-Lindgren, DOB 17/04/1962, NHS 706 251 8849
19 Greywell Mews, Gateshead NE8 3LB

Diagnoses
1. Paroxysmal atrial fibrillation, first documented August 2026
2. Hypertension
3. Obstructive sleep apnoea, on CPAP

Current medication: Apixaban 5 mg twice daily, Bisoprolol 5 mg once daily, Candesartan 8 mg once daily, Atorvastatin 40 mg at night.

I reviewed Mr Eze-Lindgren in clinic today with his partner, Marisol. He has had three episodes of palpitations since August, each lasting under an hour. His echocardiogram shows a structurally normal heart with an ejection fraction of 58%. The 7-day Holter monitor recorded two short runs of atrial fibrillation, fastest rate 142.

His CHA2DS2-VASc score is 2, so he should stay on Apixaban long term. I have increased Bisoprolol from 2.5 mg to 5 mg. If episodes continue we will discuss Flecainide or catheter ablation.

Please repeat his kidney function and full blood count in three months. I will see him again in six months.

Yours sincerely,
Dr Katarina Adeyemo-Strand, Consultant Cardiologist
Secretary: Lorna Whitcher, 0191 496 0127
`,
    gold: [
      g('PERSON', 'Bartholomew'),
      g('PERSON', 'Eze-Lindgren'),
      g('DOB', '17/04/1962'),
      g('ID_NUMBER', '706 251 8849'),
      g('ADDRESS', '19 Greywell Mews'),
      g('POSTCODE', 'NE8 3LB'),
      g('PERSON', 'Marisol'),
      g('PERSON', 'Oyinlola', 'other'),
      g('PERSON', 'Katarina', 'other'),
      g('PERSON', 'Adeyemo-Strand', 'other'),
      g('PERSON', 'Lorna', 'other'),
      g('PERSON', 'Whitcher', 'other'),
    ],
    keep: ['Paroxysmal atrial fibrillation', 'Apixaban 5 mg', 'Bisoprolol', 'Candesartan 8 mg', 'ejection fraction of 58%', 'Holter monitor', 'Flecainide', 'catheter ablation', 'six months', 'Obstructive sleep apnoea'],
    medical: ['Paroxysmal atrial fibrillation', 'Apixaban 5 mg', 'Bisoprolol', 'Candesartan 8 mg', 'ejection fraction of 58%', 'Holter monitor', 'Flecainide', 'catheter ablation', 'Obstructive sleep apnoea'],
  },
  {
    id: 'pharmacy-review',
    title: 'Pharmacy medicines review',
    text: `Haddow & Finch Pharmacy
Structured medicines review, 12 November 2026

Patient: Mrs Agnieszka Thorburn (age 78)
Address: Flat 6, Mariners Lodge, Whitby
Patient ID: HF-0092817
Reviewed by: Jamal Okeke-Ross, Pharmacist

Medicines you told us you take
Levothyroxine 75 micrograms, each morning before food
Amlodipine 5 mg, each morning
Alendronic acid 70 mg, once a week on Sundays
Adcal-D3, two tablets a day
Omeprazole 20 mg, each morning
Co-codamol 30/500, up to eight a day
Senna, two at night when needed

What we noticed
You take Levothyroxine and Adcal-D3 at the same time. Calcium stops Levothyroxine being absorbed, so leave four hours between them.
You have taken Omeprazole for six years. Ask your GP whether you still need it.
Co-codamol is probably the cause of your constipation. Paracetamol alone may be enough on most days.
Your last thyroid blood test was fourteen months ago.

We have written to your surgery with these points. If you want to talk it through, ask for Jamal or ring 01947 496 0166. Your daughter Kasia collected your copy on your behalf.
`,
    gold: [
      g('PERSON', 'Agnieszka'),
      g('PERSON', 'Thorburn'),
      g('ADDRESS', 'Mariners Lodge'),
      g('ID_NUMBER', 'HF-0092817'),
      g('PERSON', 'Kasia'),
      g('PERSON', 'Jamal', 'other'),
      g('PERSON', 'Okeke-Ross', 'other'),
    ],
    keep: ['Levothyroxine 75 micrograms', 'Amlodipine 5 mg', 'Alendronic acid 70 mg', 'Adcal-D3', 'Omeprazole 20 mg', 'Co-codamol', 'Senna', 'four hours', 'thyroid blood test', 'constipation'],
    medical: ['Levothyroxine 75 micrograms', 'Amlodipine 5 mg', 'Alendronic acid 70 mg', 'Adcal-D3', 'Omeprazole 20 mg', 'Co-codamol', 'Senna', 'thyroid blood test', 'constipation'],
  },
  {
    id: 'care-plan-meeting',
    title: 'Mental health care plan review',
    text: `Community Mental Health Team (East)
Care plan review, Monday 9 November 2026

Service user: Ravindra Pallister-Nkemelu ("Ravi"), RiO number 2077418
Present: Ravi; his sister, Anjali Pallister; Dr Sebastian Voss (consultant psychiatrist); Marguerite Daley (care coordinator); Tunde Abiodun (support worker, Larch House); Felicity Ormerod (housing officer)
Apologies: Gareth Nyambura (employment adviser)

Summary
Ravi has bipolar affective disorder. He has been stable on Lithium 800 mg at night since May, level 0.7 last month. Quetiapine was reduced to 150 mg in September and he reports sleeping seven hours. No thoughts of self-harm.

Ravi said he finds the shared kitchen at Larch House stressful. Tunde confirmed two arguments with another resident. Felicity will ask about a self-contained flat; the waiting time is around four months.

Anjali is worried that Ravi has stopped going to his art group. Marguerite will visit weekly for the next month instead of fortnightly.

Dr Voss explained that Lithium needs blood tests every three months, including kidney and thyroid function, and that Ravi must avoid ibuprofen.

Crisis plan: Ravi will ring Marguerite on 07700 900058 in office hours, or the crisis line at night. Anjali has agreed to be contacted if he misses two visits.

Next review: February 2027.
`,
    gold: [
      g('PERSON', 'Ravindra'),
      g('PERSON', 'Pallister-Nkemelu'),
      g('PERSON', 'Ravi'),
      g('ID_NUMBER', '2077418'),
      g('PERSON', 'Anjali'),
      g('PERSON', 'Pallister'),
      g('PERSON', 'Voss', 'other'),
      g('PERSON', 'Sebastian', 'other'),
      g('PERSON', 'Marguerite', 'other'),
      g('PERSON', 'Daley', 'other'),
      g('PERSON', 'Tunde', 'other'),
      g('PERSON', 'Abiodun', 'other'),
      g('PERSON', 'Felicity', 'other'),
      g('PERSON', 'Ormerod', 'other'),
      g('PERSON', 'Gareth', 'other'),
      g('PERSON', 'Nyambura', 'other'),
      g('PHONE', '07700 900058', 'other'),
    ],
    keep: ['bipolar affective disorder', 'Lithium 800 mg', 'Quetiapine', 'every three months', 'ibuprofen', 'four months', 'February 2027', 'Crisis plan', 'weekly'],
    medical: ['bipolar affective disorder', 'Lithium 800 mg', 'Quetiapine', 'ibuprofen'],
  },
  {
    id: 'family-chat',
    title: 'Family group chat about a hospital stay',
    text: `mum's op 🏥
nkechi: has anyone heard from the ward
dele: rang at 9. she's back from theatre, hip went fine. nurse called bisi said she's groggy
nkechi: thank god. did they say when she can come home
dele: maybe friday if physio are happy. they want someone staying with her for two weeks
auntie funmi: i can do the first week. dele can you pick me up from the station thursday
dele: yes. what time
auntie funmi: train gets in 14:10
nkechi: i'll do the second week. someone needs to tell her gp, is it still dr ashworth
dele: no he retired, it's dr mwangi now. mum's nhs number is on the fridge if they ask, i think it's 934 600 1182
nkechi: also the key safe code is 4471 dont put that anywhere else
dele: ward said bring her own tablets in. the amlodipine and the one for her thyroid
auntie funmi: levothyroxine. and her eye drops
nkechi: ok. ward 9 visiting is 2 to 8. ask for mrs olatunji bed 14
`,
    gold: [
      g('PERSON', 'nkechi'),
      g('PERSON', 'dele'),
      g('PERSON', 'funmi'),
      g('PERSON', 'olatunji'),
      g('ID_NUMBER', '934 600 1182'),
      g('OTHER', '4471'),
      g('PERSON', 'bisi', 'other'),
      g('PERSON', 'ashworth', 'other'),
      g('PERSON', 'mwangi', 'other'),
    ],
    keep: ['hip', 'friday', 'two weeks', 'amlodipine', 'levothyroxine', 'ward 9', '14:10', 'eye drops'],
    medical: ['amlodipine', 'levothyroxine', 'eye drops'],
  },
  {
    id: 'us-benefits-statement',
    title: 'Health insurance statement (United States)',
    text: `Cascadia Health Alliance
EXPLANATION OF BENEFITS. This is not a bill.

Member: Thaddeus Okonkwo-Reyes          Member ID: CHA 884 207 316
Group: 0041772                           Claim number: 26-3319-88170
Mailing address: 2218 Juniper Ridge Road, Apt 4C, Bend, OR 97703

Patient: Thaddeus Okonkwo-Reyes
Provider: Deschutes Orthopedic Associates (in network)
Rendering physician: Ingrid Halvorsen, MD
Date of service: October 21, 2026

Service                              Billed      Plan paid   You owe
Office visit, established patient    $285.00     $171.20     $40.00
X-ray, knee, 3 views                 $198.00     $96.40      $24.10
Corticosteroid injection, knee       $412.00     $233.60     $58.40
Total                                $895.00     $501.20     $122.50

Your deductible for 2026 is $1,500. You have met $1,500 of it.
Your out-of-pocket maximum is $4,000. You have paid $2,310.75 toward it.

If you disagree with this decision you may appeal within 180 days. Call Member Services at 1-800-555-0142 or write to the address on your member card. Para asistencia en español, llame al mismo número.
`,
    gold: [
      g('PERSON', 'Thaddeus'),
      g('PERSON', 'Okonkwo-Reyes'),
      g('ID_NUMBER', 'CHA 884 207 316'),
      g('ID_NUMBER', '26-3319-88170'),
      g('ADDRESS', '2218 Juniper Ridge Road'),
      g('POSTCODE', '97703'),
      g('PERSON', 'Ingrid', 'other'),
      g('PERSON', 'Halvorsen', 'other'),
    ],
    keep: ['$122.50', '$501.20', '180 days', 'Corticosteroid injection', 'out-of-pocket maximum', '$1,500', 'This is not a bill', 'X-ray'],
    medical: ['Corticosteroid injection', 'X-ray'],
  },
  {
    id: 'repair-complaint',
    title: 'Complaint response naming several staff',
    text: `Stage 1 complaint response
Our reference: CMP-2026-04417

Dear Mr and Mrs Castellanos,

Thank you for your complaint of 28 October about the kitchen fitted at 7 Orchard Paddock.

I have spoken to everyone involved. Our surveyor, Hamish Balfour-Ito, measured the room on 2 September. The design was drawn by Poppy Achterberg and approved by you on 9 September. The fitters, Leszek and his apprentice Kieran Dunmore, installed the units between 12 and 16 October.

I agree that two things went wrong. The worktop was cut 40 mm short, which Mr Balfour-Ito accepts was his measuring error. And Mrs Castellanos was told by our showroom manager, Deborah Quaye, that the dishwasher would be plumbed in the same week, which did not happen.

To put this right we will replace the worktop at no cost on 24 November, plumb in the dishwasher the same day, and refund £300 of the fitting charge. Leszek will do the work himself.

I do not uphold the complaint about the colour of the doors, which match the sample you signed for.

If you are not satisfied you can ask for a stage 2 review within 28 days by writing to Rhodri Maddocks, Operations Director.

Yours sincerely,
Simone Verhoeven
Customer Relations
`,
    gold: [
      g('PERSON', 'Castellanos'),
      g('ADDRESS', '7 Orchard Paddock'),
      g('ID_NUMBER', 'CMP-2026-04417'),
      g('PERSON', 'Hamish', 'other'),
      g('PERSON', 'Balfour-Ito', 'other'),
      g('PERSON', 'Poppy', 'other'),
      g('PERSON', 'Achterberg', 'other'),
      g('PERSON', 'Leszek', 'other'),
      g('PERSON', 'Kieran', 'other'),
      g('PERSON', 'Dunmore', 'other'),
      g('PERSON', 'Deborah', 'other'),
      g('PERSON', 'Quaye', 'other'),
      g('PERSON', 'Rhodri', 'other'),
      g('PERSON', 'Maddocks', 'other'),
      g('PERSON', 'Simone', 'other'),
      g('PERSON', 'Verhoeven', 'other'),
    ],
    keep: ['40 mm short', '24 November', '£300', '28 days', 'stage 2 review', 'dishwasher', 'worktop'],
  },
  {
    id: 'occupational-health',
    title: 'Occupational health report',
    text: `Meridian Occupational Health
Report to management. Confidential.

Employee: Ms Oluwaseun Fairbairn       Payroll no: 300418
Employer: Pennine Water Services       Referred by: Graham Lockyer, Network Manager
Date of assessment: 5 November 2026    Assessed by: Dr Mirembe Castell

Background
Ms Fairbairn is a field technician. She has been absent since 14 September following surgery for carpal tunnel syndrome in her right hand.

Current position
The wound has healed. Grip strength is about 60% of the left hand. She has some numbness in the thumb and index finger which her surgeon expects to improve over three to six months. She takes Naproxen 250 mg when needed and wears a wrist splint at night.

Fitness for work
She is fit to return on a phased basis from 16 November: half days for two weeks, then full days. For eight weeks she should not use vibrating tools, lift more than 5 kg with the right hand or drive for more than an hour without a break.

In my opinion the condition is likely to be covered by the Equality Act 2010. Carpal tunnel syndrome in the left hand is possible in future given the nature of the work.

I have discussed this report with Ms Fairbairn and she has agreed to its release. I will review her in January.

Dr M Castell MFOM
`,
    gold: [
      g('PERSON', 'Oluwaseun'),
      g('PERSON', 'Fairbairn'),
      g('ID_NUMBER', '300418'),
      g('PERSON', 'Graham', 'other'),
      g('PERSON', 'Lockyer', 'other'),
      g('PERSON', 'Mirembe', 'other'),
      g('PERSON', 'Castell', 'other'),
    ],
    keep: ['carpal tunnel syndrome', 'Naproxen 250 mg', 'wrist splint', '16 November', 'vibrating tools', '5 kg', 'Equality Act 2010', 'eight weeks', 'phased'],
    medical: ['carpal tunnel syndrome', 'Naproxen 250 mg', 'wrist splint'],
  },
  {
    id: 'conveyancing-letter',
    title: 'Solicitor’s letter about a house purchase',
    text: `Thackeray Bone LLP, Solicitors
Our ref: HM/PUR/118-2026

12 November 2026

Dear Ms Nakagawa and Mr Pemberton-Diallo,

Purchase of 22 Sextons Meadow, Bury St Edmunds
Seller: the estate of the late Winifred Garroway

I am pleased to say we are ready to exchange contracts. Before we do, please note the following.

The seller's executor, Mr Ambrose Garroway, has confirmed that probate was granted on 3 October. The local search shows no planning applications within 200 metres. The survey by Elspeth Royle MRICS recommends replacing the flat roof over the utility room within two years; you told me you are content to proceed.

Your mortgage offer from Fenland Building Society (account 40-88-21 30071196) is for £212,000 and expires on 15 January 2027. Your deposit of £53,000 must reach our client account by 20 November. Please ring me before sending money and never rely on bank details sent by email.

Completion is proposed for Friday 11 December 2026. Stamp duty of £2,750 is payable.

If you have questions, call me or my assistant, Jocasta Fenn, on 01284 496 0193.

Yours sincerely,
Horatio Mbeki
Partner
`,
    gold: [
      g('PERSON', 'Nakagawa'),
      g('PERSON', 'Pemberton-Diallo'),
      g('ADDRESS', '22 Sextons Meadow'),
      g('ID_NUMBER', 'HM/PUR/118-2026'),
      g('ACCOUNT', '30071196'),
      g('PERSON', 'Winifred', 'other'),
      g('PERSON', 'Garroway', 'other'),
      g('PERSON', 'Ambrose', 'other'),
      g('PERSON', 'Elspeth', 'other'),
      g('PERSON', 'Royle', 'other'),
      g('PERSON', 'Jocasta', 'other'),
      g('PERSON', 'Fenn', 'other'),
      g('PERSON', 'Horatio', 'other'),
      g('PERSON', 'Mbeki', 'other'),
    ],
    keep: ['£212,000', '15 January 2027', '£53,000', '20 November', 'Friday 11 December 2026', '£2,750', 'flat roof', 'exchange contracts'],
  },
];
