import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Final test set. Measured once.
 *
 * These documents were written from short briefs (document type and
 * situation) by an author who had not seen how detection works: not the
 * patterns, not the prompts, not the earlier results. Every person,
 * organisation, address and number here is made up.
 *
 * `gold` lists the shortest strings that must not be readable in what leaves
 * the device. Where a name appears in two cases (for example in a header in
 * capitals and again in the body) both forms are listed.
 * `medicalHigh` is the part of `medical` whose loss would change what the
 * document means. `quasi` lists quasi-identifiers (towns, employers,
 * occupations, dated events) that appear word for word.
 */
const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const FINAL_SET: Fixture[] = [
  {
    id: 'final-cardiology-clinic',
    title: 'Cardiology clinic letter to GP',
    text: `Brackenfield Heart Centre
Department of Cardiology
Clinic date: 3 November 2026        Dictated: 4 November 2026

Dr Angharad Pritchard-Lowe
Tollgate Lane Surgery
Stourbridge

Dear Dr Pritchard-Lowe,

Re: Mr Oluwaseun ADEYEMI, DOB 22/03/1958
NHS No: 999 204 7716   Hospital No: BH-0388142
9 Quarry Bank Mews, Stourbridge DY8 3QT   Tel: 07700 900214

Diagnoses:
1. Paroxysmal atrial fibrillation, first documented August 2026
2. Hypertension
3. Type 2 diabetes mellitus

Current medication: bisoprolol 2.5 mg once daily, ramipril 5 mg once daily, metformin 500 mg twice daily.

I reviewed Mr Adeyemi in the arrhythmia clinic today. He attended with his wife, Folasade, who tells me he has had three further episodes of palpitations since September, each lasting up to two hours, with breathlessness on the stairs. He has had no chest pain, syncope or ankle swelling. He continues to work part time as a minicab driver and is anxious about his licence.

On examination his pulse was 78 and regular and his blood pressure was 148/86. His ECG today shows sinus rhythm. The echocardiogram of 12 October shows a mildly dilated left atrium with preserved left ventricular function (ejection fraction 55%).

His CHA2DS2-VASc score is 3. We discussed anticoagulation and he has agreed to start apixaban 5 mg twice daily. I have increased bisoprolol to 5 mg once daily. Please would you repeat his kidney function in four weeks.

I have told Seun that he must inform the DVLA only if his symptoms are distracting or disabling, and that he should not drive during an episode. I will see him again in three months with a 7-day ECG monitor beforehand.

Yours sincerely,

Dr Matthias Oyelaran-Beck
Consultant Cardiologist
Secretary: Joanne Tipple, 01632 960418

cc Mr O Adeyemi
`,
    gold: [
      g('PERSON', 'Oluwaseun'),
      g('PERSON', 'ADEYEMI'),
      g('PERSON', 'Adeyemi'),
      g('PERSON', 'Seun'),
      g('PERSON', 'Folasade'),
      g('DOB', '22/03/1958'),
      g('ID_NUMBER', '999 204 7716'),
      g('ID_NUMBER', 'BH-0388142'),
      g('ADDRESS', '9 Quarry Bank Mews'),
      g('POSTCODE', 'DY8 3QT'),
      g('PHONE', '07700 900214'),
      g('PERSON', 'Angharad', 'other'),
      g('PERSON', 'Pritchard-Lowe', 'other'),
      g('PERSON', 'Matthias', 'other'),
      g('PERSON', 'Oyelaran-Beck', 'other'),
      g('PERSON', 'Joanne', 'other'),
      g('PERSON', 'Tipple', 'other'),
      g('PHONE', '01632 960418', 'other'),
    ],
    keep: [
      'Paroxysmal atrial fibrillation',
      'apixaban 5 mg twice daily',
      'bisoprolol to 5 mg once daily',
      'ejection fraction 55%',
      'CHA2DS2-VASc score is 3',
      'kidney function in four weeks',
      'three months',
      'DVLA',
    ],
    medical: [
      'Paroxysmal atrial fibrillation',
      'apixaban 5 mg twice daily',
      'bisoprolol to 5 mg once daily',
      'ejection fraction 55%',
      'CHA2DS2-VASc score is 3',
      'kidney function in four weeks',
    ],
    medicalHigh: ['Paroxysmal atrial fibrillation', 'apixaban 5 mg twice daily', 'bisoprolol to 5 mg once daily'],
    quasi: ['Stourbridge', 'minicab driver', 'Tollgate Lane Surgery', 'August 2026'],
  },
  {
    id: 'final-discharge-summary',
    title: 'Hospital discharge summary',
    text: `ST COLUMBA'S GENERAL HOSPITAL — DISCHARGE SUMMARY
(not for onward disclosure without consent)

PATIENT: KOWALCZYK, AGNIESZKA MARIA          WARD: Elm 4 (Respiratory)
DOB: 09-Feb-1947      AGE: 79                 HOSP NO: SC7720931
NHS NO: 999 631 0482                          CONSULTANT: Dr R. Ekwueme
ADDRESS: Flat 6, Mulberry Court, 41 Canal Street, Wakefield WF1 5DN
NEXT OF KIN: Piotr Kowalczyk (son) 07700 900857
GP: Dr Nasreen Chaudhry, Sandal Castle Medical Practice

Admitted: 27/10/2026 via ED        Discharged: 05/11/2026

PRESENTING COMPLAINT
Three days of worsening breathlessness, productive cough with green sputum, and confusion noted by her son.

DIAGNOSIS
Infective exacerbation of COPD with right lower lobe pneumonia. Acute kidney injury stage 1 (resolved).

BACKGROUND
COPD (FEV1 42% predicted, ex-smoker, 40 pack years). Osteoporosis. Previous hip fracture 2023. Lives alone, carers once daily. Penicillin allergy (rash).

HOSPITAL COURSE
Treated with controlled oxygen, nebulised salbutamol and ipratropium, prednisolone 30 mg for 5 days, and IV then oral doxycycline (penicillin allergic). Creatinine peaked at 138 and returned to her baseline of 84 with fluids. Delirium settled by day 4. Seen by physiotherapy and occupational therapy; mobile with a frame.

MEDICATION ON DISCHARGE
- Doxycycline 100 mg once daily, 2 more days then STOP
- Tiotropium 18 micrograms inhaled once daily (NEW)
- Salbutamol 100 micrograms inhaler, 2 puffs as needed
- Alendronic acid 70 mg once weekly
- Adcal-D3 one tablet twice daily
STOPPED: ibuprofen (kidney injury)

FOLLOW UP
Chest X-ray in 6 weeks (requested). Community respiratory team to visit within 72 hours. GP please recheck U&Es in 1 week. Carers increased to twice daily for 2 weeks, arranged by ward social worker Bernadette Quayle.

Mrs Kowalczyk and her son have been given a rescue pack plan. Daughter-in-law Magdalena will collect her; transport not required.

Completed by: Dr Segun Fashola (FY2), bleep 4471
`,
    gold: [
      g('PERSON', 'KOWALCZYK'),
      g('PERSON', 'AGNIESZKA'),
      g('PERSON', 'MARIA'),
      g('PERSON', 'Kowalczyk'),
      g('PERSON', 'Piotr'),
      g('PERSON', 'Magdalena'),
      g('DOB', '09-Feb-1947'),
      g('ID_NUMBER', 'SC7720931'),
      g('ID_NUMBER', '999 631 0482'),
      g('ADDRESS', 'Mulberry Court'),
      g('ADDRESS', '41 Canal Street'),
      g('POSTCODE', 'WF1 5DN'),
      g('PHONE', '07700 900857'),
      g('PERSON', 'Ekwueme', 'other'),
      g('PERSON', 'Nasreen', 'other'),
      g('PERSON', 'Chaudhry', 'other'),
      g('PERSON', 'Bernadette', 'other'),
      g('PERSON', 'Quayle', 'other'),
      g('PERSON', 'Segun', 'other'),
      g('PERSON', 'Fashola', 'other'),
    ],
    keep: [
      'Infective exacerbation of COPD',
      'right lower lobe pneumonia',
      'Penicillin allergy',
      'prednisolone 30 mg for 5 days',
      'Tiotropium 18 micrograms',
      'Doxycycline 100 mg once daily',
      'STOPPED: ibuprofen',
      'Chest X-ray in 6 weeks',
      'within 72 hours',
    ],
    medical: [
      'Infective exacerbation of COPD',
      'right lower lobe pneumonia',
      'Penicillin allergy',
      'prednisolone 30 mg for 5 days',
      'Tiotropium 18 micrograms',
      'Doxycycline 100 mg once daily',
      'STOPPED: ibuprofen',
      'Chest X-ray in 6 weeks',
    ],
    medicalHigh: ['Infective exacerbation of COPD', 'Penicillin allergy', 'Tiotropium 18 micrograms', 'STOPPED: ibuprofen'],
    quasi: ['Wakefield', 'Sandal Castle Medical Practice', 'Lives alone', '27/10/2026', 'Elm 4'],
  },
  {
    id: 'final-gp-record-extract',
    title: 'GP record summary print-out',
    text: `Hollin Brow Medical Centre — Summary printed from patient record
Printed 10 Nov 2026 14:12 by reception (KD)          Page 1 of 1

Dhillon, Harpreet Kaur (Mrs)      Born 17 Aug 1984     NHS 999 518 2260
Usual GP Dr Lindqvist             Registered 02 Mar 2011
8 Thornfield Avenue, Huddersfield, HD2 1PW
Mob 07700 900633      Email hkdhillon84@mailbox.example
Carer status: cares for mother-in-law (Gurbax Kaur, same address)

ACTIVE PROBLEMS
14 Sep 2026   Gestational diabetes mellitus (current pregnancy, EDD 21 Jan 2027)
03 Jun 2019   Asthma
11 Jan 2017   Iron deficiency anaemia

SIGNIFICANT PAST
2016  Emergency caesarean section (son Arjan)
2014  Depression, resolved

ALLERGIES
Erythromycin: vomiting.   Latex: contact rash.

REPEAT MEDICATION
Metformin 500 mg tablets, one twice daily with food (started 28 Sep 2026)
Ferrous fumarate 210 mg tablets, one daily
Clenil Modulite 100 micrograms, two puffs twice daily
Salbutamol 100 micrograms, two puffs when required
Folic acid 5 mg tablets, one daily

RECENT CONSULTATIONS
05 Nov 2026  Telephone, Dr Lindqvist.  Fasting glucose readings 5.6 to 6.1 on metformin. Diabetes midwife (Shanice Okoro) to review for insulin if above 5.3 next week. Pt worried about driving to work, she is a pharmacy dispenser at a supermarket.
22 Oct 2026  Nurse (A. Bhamra).  Flu and whooping cough vaccines given. BP 112/70.
28 Sep 2026  Dr Lindqvist.  OGTT 2 hour glucose 9.4. GDM diagnosed. Referred to joint antenatal clinic. Husband Manvir present, interpreter not needed.

LAST RESULTS
HbA1c 41 mmol/mol (30 Sep 2026)    Hb 104 g/L (30 Sep 2026)    Ferritin 9 (30 Sep 2026)
`,
    gold: [
      g('PERSON', 'Dhillon'),
      g('PERSON', 'Harpreet'),
      g('PERSON', 'Kaur'),
      g('PERSON', 'Gurbax'),
      g('PERSON', 'Arjan'),
      g('PERSON', 'Manvir'),
      g('DOB', '17 Aug 1984'),
      g('ID_NUMBER', '999 518 2260'),
      g('ADDRESS', '8 Thornfield Avenue'),
      g('POSTCODE', 'HD2 1PW'),
      g('PHONE', '07700 900633'),
      g('EMAIL', 'hkdhillon84@mailbox.example'),
      g('PERSON', 'Lindqvist', 'other'),
      g('PERSON', 'Shanice', 'other'),
      g('PERSON', 'Okoro', 'other'),
      g('PERSON', 'Bhamra', 'other'),
    ],
    keep: [
      'Gestational diabetes mellitus',
      'Metformin 500 mg',
      'Erythromycin',
      'Latex',
      'OGTT 2 hour glucose 9.4',
      'insulin if above 5.3',
      'Ferrous fumarate 210 mg',
      'HbA1c 41 mmol/mol',
      'EDD 21 Jan 2027',
    ],
    medical: [
      'Gestational diabetes mellitus',
      'Metformin 500 mg',
      'Erythromycin',
      'Latex',
      'OGTT 2 hour glucose 9.4',
      'insulin if above 5.3',
      'Ferrous fumarate 210 mg',
      'HbA1c 41 mmol/mol',
    ],
    medicalHigh: ['Gestational diabetes mellitus', 'Erythromycin', 'Metformin 500 mg', 'insulin if above 5.3'],
    quasi: ['Huddersfield', 'pharmacy dispenser', 'Hollin Brow Medical Centre', 'Registered 02 Mar 2011'],
  },
  {
    id: 'final-pharmacy-note',
    title: 'Pharmacy note about a weekly medicines tray',
    text: `Glanrafon Pharmacy
12 Heol y Farchnad, Llangefni
Tel 01632 960127

MEDICINES USE NOTE: for patient and carer
Date: 6 November 2026
Pharmacist: Iwan Bebb (GPhC 2099417)

Patient: Mrs Myfanwy Llewellyn      d.o.b. 30.11.1939
Address: Bryn Eithin, Lôn Capel, Llangefni LL77 7RD
Collected by: daughter, Eleri Vaughan (07700 900402)

Dear Mrs Llewellyn,

Thank you for coming in with Eleri today. This note sets out what we agreed, so that the district nurses and your carers at Gofal Môn Homecare have the same information.

1. Your weekly tray (blister pack) will start on Monday 16 November. We will deliver it every Friday afternoon. Please keep using your boxes until then.

2. In the tray: amlodipine 5 mg in the morning; furosemide 40 mg in the morning; atorvastatin 20 mg at night; donepezil 10 mg at night.

3. NOT in the tray, because they cannot be packed: your warfarin, which changes with your blood test (currently 3 mg on weekdays and 4 mg at weekends, yellow book), and your Fostair inhaler.

4. You told me you have been taking two paracetamol with co-codamol 30/500 for your knee. Please do not take both together. Both contain paracetamol and the total must stay under 4 g in 24 hours. I have asked Dr Gwilym at the surgery to review your pain relief.

5. Your next INR test is on Thursday 19 November at 10.15am with the nurse at home.

If Mrs Llewellyn seems more muddled or has any bleeding, nosebleeds or black stools, ring the surgery the same day.

Iwan
`,
    gold: [
      g('PERSON', 'Myfanwy'),
      g('PERSON', 'Llewellyn'),
      g('DOB', '30.11.1939'),
      g('ADDRESS', 'Bryn Eithin'),
      g('ADDRESS', 'Lôn Capel'),
      g('POSTCODE', 'LL77 7RD'),
      g('PERSON', 'Eleri'),
      g('PERSON', 'Vaughan'),
      g('PHONE', '07700 900402'),
      g('PERSON', 'Iwan', 'other'),
      g('PERSON', 'Bebb', 'other'),
      g('ID_NUMBER', '2099417', 'other'),
      g('PERSON', 'Gwilym', 'other'),
    ],
    keep: [
      'amlodipine 5 mg',
      'furosemide 40 mg',
      'donepezil 10 mg',
      'warfarin',
      '3 mg on weekdays and 4 mg at weekends',
      'co-codamol 30/500',
      'under 4 g in 24 hours',
      'Monday 16 November',
      'Thursday 19 November at 10.15am',
    ],
    medical: [
      'amlodipine 5 mg',
      'furosemide 40 mg',
      'donepezil 10 mg',
      'warfarin',
      '3 mg on weekdays and 4 mg at weekends',
      'co-codamol 30/500',
      'under 4 g in 24 hours',
    ],
    medicalHigh: ['warfarin', '3 mg on weekdays and 4 mg at weekends', 'co-codamol 30/500', 'donepezil 10 mg'],
    quasi: ['Llangefni', 'Gofal Môn Homecare', 'Glanrafon Pharmacy'],
  },
  {
    id: 'final-pip-decision',
    title: 'Personal Independence Payment decision',
    text: `Department for Work and Pensions
Personal Independence Payment
                                              Our ref: PIP/7Q/2260418
                                              Date: 29 October 2026
Ms Hodan Abdullahi Warsame
Flat 14, Ashdown House
Coldharbour Lane
Bristol
BS16 1FJ

National Insurance number: SK 40 17 62 B

Dear Ms Warsame,

YOUR PERSONAL INDEPENDENCE PAYMENT DECISION

We have looked at your claim, the form you sent us on 2 August 2026, the report from your assessment on 6 October 2026 and the letter from your rheumatology nurse.

Our decision
You are entitled to the standard rate of the daily living part from 2 August 2026 to 1 August 2029. This is £73.90 a week.
You are not entitled to the mobility part.

How we decided
Daily living: you scored 9 points. You need 8 points for the standard rate and 12 for the enhanced rate.
- Preparing food: needs an aid or appliance (2 points)
- Washing and bathing: needs assistance to get in or out of a bath or shower (3 points)
- Dressing and undressing: needs an aid or appliance (2 points)
- Managing therapy: needs supervision to manage medication (1 point)
- Budgeting: 1 point
Mobility: you scored 4 points. You told us that because of your rheumatoid arthritis and fibromyalgia you cannot walk further than the corner shop. The assessor observed you walk 60 metres to the assessment room without stopping. We decided you can stand and then move more than 50 metres but no more than 200 metres.

Your first payment of £961.70 for the period from 2 August 2026 will be paid into the account ending 3391 within 10 working days. After that we will pay £295.60 every 4 weeks.

If you think this decision is wrong
You must ask us for a mandatory reconsideration within one month of the date of this letter, that is by 29 November 2026. Call 0800 496 0118 or write to the address at the top of this letter. Your appointee, Mr Liban Warsame, can do this for you.

Yours sincerely,
A Decision Maker
`,
    gold: [
      g('PERSON', 'Hodan'),
      g('PERSON', 'Abdullahi'),
      g('PERSON', 'Warsame'),
      g('PERSON', 'Liban'),
      g('ADDRESS', 'Ashdown House'),
      g('ADDRESS', 'Coldharbour Lane'),
      g('POSTCODE', 'BS16 1FJ'),
      g('ID_NUMBER', 'SK 40 17 62 B'),
      g('ID_NUMBER', 'PIP/7Q/2260418'),
    ],
    keep: [
      'standard rate of the daily living part',
      '£73.90 a week',
      'not entitled to the mobility part',
      '9 points',
      'mandatory reconsideration',
      'within one month',
      '29 November 2026',
      '£961.70',
      'more than 50 metres but no more than 200 metres',
      'rheumatoid arthritis',
    ],
    medical: ['rheumatoid arthritis'],
    medicalHigh: ['rheumatoid arthritis'],
    quasi: ['Bristol', '6 October 2026', 'rheumatology nurse', 'fibromyalgia'],
  },
  {
    id: 'final-council-tax-final-notice',
    title: 'Council tax final notice (Scotland)',
    text: `Strathlomond Council
Revenues and Benefits, PO Box 114, Dunallan

Mr Ruaridh I. MacAskill & Ms Catriona Farquharson
3/2, 88 Burnside Gardens
Dunallan
G83 9QT                                        12 November 2026

Council Tax account: 70041882317
Property reference: 100/0288/0032

FINAL NOTICE — COUNCIL TAX 2026/27

Dear Mr MacAskill and Ms Farquharson,

You have not paid your Council Tax instalments as they fell due. We sent a reminder on 14 October 2026.

Band C charge for 2026/27                      £1,684.32
Water and waste water charges                    £498.60
Less single person discount ended 31/05/2026     −£87.10
Paid to date                                    −£524.00
Amount now due                                 £1,571.82

You have lost the right to pay by instalments. The full amount of £1,571.82 must be paid within 14 days of the date of this notice.

If you do not pay, we will ask the Sheriff Court for a summary warrant. A 10% surcharge (£157.18) will be added and the debt will be passed to sheriff officers, who can arrest your wages or bank account.

If you cannot pay in full, contact us now. We may be able to agree a payment arrangement, and you may be entitled to Council Tax Reduction. Our records show Ms Farquharson moved in on 1 June 2026, which is why the discount ended. If that is wrong, tell us.

Pay online with your account number, or by phone on 0141 496 0173.

Morag Sneddon
Recovery Officer
recovery@strathlomond.example
`,
    gold: [
      g('PERSON', 'Ruaridh'),
      g('PERSON', 'MacAskill'),
      g('PERSON', 'Catriona'),
      g('PERSON', 'Farquharson'),
      g('ADDRESS', '88 Burnside Gardens'),
      g('POSTCODE', 'G83 9QT'),
      g('ID_NUMBER', '70041882317'),
      g('ID_NUMBER', '100/0288/0032'),
      g('PERSON', 'Morag', 'other'),
      g('PERSON', 'Sneddon', 'other'),
    ],
    keep: [
      '£1,571.82',
      'within 14 days',
      'summary warrant',
      '10% surcharge',
      'single person discount',
      'Council Tax Reduction',
      'Band C',
      'sheriff officers',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Dunallan', '1 June 2026', 'Strathlomond Council'],
  },
  {
    id: 'final-rent-arrears-section8',
    title: 'Letting agent letter with section 8 notice',
    text: `Harcastle & Finch Lettings
2 Corn Exchange Walk, Leominster HR6 8LR

BY HAND AND FIRST CLASS POST
5 November 2026

To: Ms Siobhán O'Rourke and Mr Declan Ó Murchú
The Tenants, 27 Ryelands Road, Leominster HR6 8NZ

Dear Ms O'Rourke and Mr Ó Murchú,

Tenancy of 27 Ryelands Road — rent arrears and notice

We act for your landlord, Mrs Philippa Arkwright. Your assured shorthold tenancy began on 18 March 2024 at a rent of £875 per calendar month, payable on the 18th.

Our records show the following payments were missed or short:
18 August 2026      due £875     received £875
18 September 2026   due £875     received £400
18 October 2026     due £875     received £0
Arrears at today's date: £1,350.00

We enclose a notice under section 8 of the Housing Act 1988 (Form 3) relying on grounds 10 and 11. The notice expires on 20 November 2026. If the arrears are not cleared by then the landlord may start possession proceedings in the County Court without further warning. If arrears reach two months' rent, ground 8 (a mandatory ground) may be added.

Your deposit of £1,009.61 is protected with the Tenancy Deposit Custodial Scheme, certificate DPC-44810267.

We understand from Declan's email of 30 October that his hours at the cider works were cut and that you have applied for Universal Credit. If you send us evidence of the claim, Mrs Arkwright is willing to consider a repayment plan of the rent plus £100 a month.

Please reply to me by 13 November. You can get free advice from Citizens Advice or Shelter.

Yours sincerely,

Rhys Tomlinson
Property Manager
rhys.tomlinson@harcastlefinch.example | 01632 960275

Rent account for payments: sort code 40-51-62, account 31926640, reference RYE27OROURKE
`,
    gold: [
      g('PERSON', 'Siobhán'),
      g('PERSON', "O'Rourke"),
      g('PERSON', 'Declan'),
      g('PERSON', 'Murchú'),
      g('ADDRESS', '27 Ryelands Road'),
      g('POSTCODE', 'HR6 8NZ'),
      g('ID_NUMBER', 'DPC-44810267'),
      g('ID_NUMBER', 'RYE27OROURKE'),
      g('PERSON', 'Philippa', 'other'),
      g('PERSON', 'Arkwright', 'other'),
      g('PERSON', 'Rhys', 'other'),
      g('PERSON', 'Tomlinson', 'other'),
      g('EMAIL', 'rhys.tomlinson@harcastlefinch.example', 'other'),
      g('PHONE', '01632 960275', 'other'),
      g('ACCOUNT', '31926640', 'other'),
    ],
    keep: [
      '£875 per calendar month',
      '£1,350.00',
      'section 8',
      'grounds 10 and 11',
      '20 November 2026',
      'ground 8',
      'Universal Credit',
      'rent plus £100 a month',
      'Housing Act 1988',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Leominster', 'cider works', '18 March 2024'],
  },
  {
    id: 'final-bank-app-scam',
    title: 'Bank decision on a scam payment claim',
    text: `Pennine & Lakeland Bank plc
Customer Protection Team
                                                        9 November 2026
Miss Zhang Mei-Ling
Apartment 1203, Wharfside Tower
6 Tib Lock Street
Manchester
M4 7EW

Dear Miss Zhang,

Your claim for an unauthorised payment — reference FRD-2026-118804

Thank you for speaking to my colleague Kofi on 28 October. You told us that on 24 October 2026 you received a call from someone claiming to be from our fraud team, and that you moved £4,250.00 from your current account (sort code 16-58-21, account number 60317745) to an account in the name of "M L Zhang Safe Account" at another bank.

We have now finished our review.

What we found
The payment was made using your mobile app, with your passcode, from your registered phone ending 0391. Before the payment we showed you a warning that we will never ask you to move money to a safe account. Because you authorised the payment, it is an authorised push payment (APP) scam, not an unauthorised transaction.

What we will do
Under the reimbursement rules for APP scams we will refund £4,150.00, which is the amount lost less the £100 excess. This will be in your account within 5 business days. We contacted the receiving bank on 28 October and they recovered nothing.

We are not refunding the £35.00 unarranged overdraft interest charged on 2 November, because the overdraft was caused by your debit card ending 7702 being used for rent, which was a genuine payment.

If you are unhappy with this decision you can complain to us, and after that to the Financial Ombudsman Service within six months of our final response.

Please also note we have updated your contact email to meiling.zhang@inboxmail.example as you asked.

Yours sincerely,

Farah Qureshi
Senior Case Handler
`,
    gold: [
      g('PERSON', 'Zhang'),
      g('PERSON', 'Mei-Ling'),
      g('ADDRESS', 'Wharfside Tower'),
      g('ADDRESS', '6 Tib Lock Street'),
      g('POSTCODE', 'M4 7EW'),
      g('ID_NUMBER', 'FRD-2026-118804'),
      g('ACCOUNT', '60317745'),
      g('EMAIL', 'meiling.zhang@inboxmail.example'),
      g('PERSON', 'Kofi', 'other'),
      g('PERSON', 'Farah', 'other'),
      g('PERSON', 'Qureshi', 'other'),
    ],
    keep: [
      '£4,250.00',
      'authorised push payment (APP) scam',
      '£4,150.00',
      '£100 excess',
      'within 5 business days',
      '£35.00',
      'Financial Ombudsman Service',
      'within six months',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Manchester', '24 October 2026', 'Pennine & Lakeland Bank plc'],
  },
  {
    id: 'final-debt-default-notice',
    title: 'Debt collector notice of intention to default',
    text: `CORVEN RECOVERIES LIMITED
Authorised and regulated by the Financial Conduct Authority
PO Box 7730, Stockton-on-Tees

Mr Tran Minh Khoa                                   Date: 10/11/2026
Room 3, 152 Selly Park Road                         Our ref: CRV/00918826/TK
Birmingham B29 7HX                                  Client: Brightwave Mobile
                                                    Original account: BW-553017229

NOTICE OF SUMS IN ARREARS AND INTENTION TO DEFAULT

Dear Mr Tran,

We wrote to you on 3 September and 8 October about the balance on your Brightwave Mobile account, which has been passed to us for collection. We have also tried to reach you on 07700 900519 and at khoa.tm.2001@student-mail.example without success.

Balance outstanding: £612.47
made up of unpaid line rental (June to August 2026) £96.00, early termination charge £438.00, and device balance £78.47.

If we do not receive payment or hear from you by 1 December 2026, a default may be registered with the credit reference agencies. A default stays on your credit file for six years and can make it harder to get credit, a phone contract or a tenancy.

You have options:
• Pay in full online or on 0333 496 0150.
• Set up a payment plan. We will accept an affordable amount; many customers pay from £15 a month.
• If you dispute the debt, tell us in writing and we will put the account on hold for 30 days while the client investigates. We note your message of 12 October saying you cancelled within the 14-day cooling-off period after the contract was taken out in store on 2 May 2026.
• For free, independent debt advice contact StepChange or National Debtline.

We have recorded that you are a full-time student and that letters should also be copied to your sister, Ms Tran Thi Lan Anh, at 9 Orchard Way, Coventry CV5 6GR, at your request.

Yours sincerely,
Collections Team
`,
    gold: [
      g('PERSON', 'Tran'),
      g('PERSON', 'Minh'),
      g('PERSON', 'Khoa'),
      g('PERSON', 'Lan Anh'),
      g('ADDRESS', '152 Selly Park Road'),
      g('POSTCODE', 'B29 7HX'),
      g('ID_NUMBER', 'CRV/00918826/TK'),
      g('ID_NUMBER', 'BW-553017229'),
      g('PHONE', '07700 900519'),
      g('EMAIL', 'khoa.tm.2001@student-mail.example'),
      g('ADDRESS', '9 Orchard Way'),
      g('POSTCODE', 'CV5 6GR'),
    ],
    keep: [
      '£612.47',
      '1 December 2026',
      'early termination charge £438.00',
      'six years',
      '30 days',
      '14-day cooling-off period',
      '2 May 2026',
      '£15 a month',
      'default',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Birmingham', 'full-time student', 'Brightwave Mobile', 'Coventry'],
  },
  {
    id: 'final-county-court-claim',
    title: 'County court claim form and particulars',
    text: `IN THE COUNTY COURT AT LUTON                       Claim No. K47YX219
                                                   Issue date: 2 November 2026

Claimant
MR YUSUF IBRAHIM AL-MASRI
19 Dallow Rise
Luton LU1 1TB

Defendant
Tarrant Motor Company Ltd (trading as Tarrant Cars)
Unit 9, Kingsway Trade Park, Dunstable

Brief details of claim
Price of a used car that was not of satisfactory quality, and consequential losses, under the Consumer Rights Act 2015.

Value: £6,340.00   Court fee: £455.00   Total: £6,795.00

PARTICULARS OF CLAIM

1. On 6 June 2026 the Claimant bought a 2017 Skoda Octavia, registration KR17 VLD, from the Defendant for £5,995.00, paid by debit card.
2. On 19 June 2026, thirteen days after delivery, the gearbox failed on the M1. The vehicle was recovered at a cost of £180.00.
3. By email dated 22 June 2026 the Claimant rejected the vehicle under the short-term right to reject (section 22) and asked for a full refund. The Defendant's sales manager, Mr Gary Tarrant, refused on 25 June, saying the car was "sold as seen".
4. An independent engineer's report by D. Pemberton MIMI dated 14 July 2026 (cost £165.00) found the fault was present at the time of sale.
5. The Claimant claims: (a) £5,995.00; (b) recovery £180.00; (c) report £165.00; (d) interest under section 69 of the County Courts Act 1984 at 8% a year; (e) costs.

STATEMENT OF TRUTH
I believe that the facts stated in these particulars of claim are true. I understand that proceedings for contempt of court may be brought against anyone who makes a false statement.

Signed: Y. I. Al-Masri        Dated: 30 October 2026

Claimant's address for documents: as above. Email: yusuf.almasri@postbox.example  Tel: 07700 900946

Notes for defendant: you have 14 days from the date of service to respond. If you do nothing, judgment may be entered against you.
`,
    gold: [
      g('PERSON', 'YUSUF'),
      g('PERSON', 'IBRAHIM'),
      g('PERSON', 'AL-MASRI'),
      g('PERSON', 'Al-Masri'),
      g('ADDRESS', '19 Dallow Rise'),
      g('POSTCODE', 'LU1 1TB'),
      g('ID_NUMBER', 'K47YX219'),
      g('ID_NUMBER', 'KR17 VLD'),
      g('EMAIL', 'yusuf.almasri@postbox.example'),
      g('PHONE', '07700 900946'),
      g('PERSON', 'Gary', 'other'),
      g('PERSON', 'Tarrant', 'other'),
      g('PERSON', 'Pemberton', 'other'),
    ],
    keep: [
      'Consumer Rights Act 2015',
      '£6,340.00',
      '£455.00',
      'short-term right to reject',
      'section 22',
      '8% a year',
      '14 days',
      'not of satisfactory quality',
      '£5,995.00',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Luton', '6 June 2026', '2017 Skoda Octavia'],
  },
  {
    id: 'final-divorce-finances',
    title: 'Family solicitor advice on financial remedy',
    text: `Ashby Lorimer Family Law LLP
Private and confidential — legally privileged

Our ref: TCS/0044817/NB
11 November 2026

By email only: thais.souza.arq@webpost.example

Dear Thaís,

Carvalho de Souza v Whitcombe — financial remedy

Thank you for coming in on Friday with your mother, Dona Rosângela. I am writing to confirm my advice and what happens next.

1. Where we are. Your conditional order (the old decree nisi) was pronounced on 21 September 2026. I advise you not to apply for the final order until the finances are settled, because doing so could affect your rights under Edward's pension if he were to die first.

2. Form E. Your financial statement must be exchanged by 4 December 2026. I still need: twelve months of statements for your Crestline joint account (ending 2208) and your sole savings account; your P60 and last three payslips from Marlowe Hirst Architects; a mortgage redemption figure; and the cash equivalent value of your pension.

3. The house. 31 Cotham Vale, Bristol BS6 6HP was valued at £585,000 with a mortgage of about £212,000. Edward's solicitors propose a sale and a 50/50 split. As Beatriz (9) and Tomás (6) live with you for most of the week, I think an order letting you stay in the home until Tomás is 18 (a Mesher order), or a 60/40 split in your favour, are both realistic. A court will look first at the children's housing needs.

4. Child maintenance. On Edward's gross income of £71,500 the statutory formula gives about £178 a week for two children with shared care of one night. That is separate from any spousal maintenance.

5. First appointment. The court has listed the first directions appointment for 14 January 2027 at 10.00am at Bristol Civil and Family Justice Centre. You must attend.

6. Costs. Costs to date are £3,860 plus VAT. My estimate to the end of the first appointment is a further £2,500 to £3,500 plus VAT.

Please do not discuss the proposals directly with Edward, and do not move money out of the joint account.

Kind regards,

Niamh Brannigan
Senior Associate
Direct line 0117 496 0164
`,
    gold: [
      g('PERSON', 'Thaís'),
      g('PERSON', 'Carvalho'),
      g('PERSON', 'Souza'),
      g('PERSON', 'Rosângela'),
      g('PERSON', 'Whitcombe'),
      g('PERSON', 'Edward'),
      g('PERSON', 'Beatriz'),
      g('PERSON', 'Tomás'),
      g('EMAIL', 'thais.souza.arq@webpost.example'),
      g('ID_NUMBER', 'TCS/0044817/NB'),
      g('ADDRESS', '31 Cotham Vale'),
      g('POSTCODE', 'BS6 6HP'),
      g('PERSON', 'Niamh', 'other'),
      g('PERSON', 'Brannigan', 'other'),
      g('PHONE', '0117 496 0164', 'other'),
    ],
    keep: [
      'conditional order',
      '4 December 2026',
      'Form E',
      '£585,000',
      'Mesher order',
      '£178 a week',
      '14 January 2027 at 10.00am',
      '£3,860 plus VAT',
      'first directions appointment',
      '60/40 split',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Bristol', 'Marlowe Hirst Architects', '21 September 2026', 'Crestline'],
  },
  {
    id: 'final-disciplinary-outcome',
    title: 'Disciplinary hearing outcome letter',
    text: `NORTHGATE PARCEL NETWORK LTD
Human Resources — Tamworth Hub

STRICTLY PRIVATE: ADDRESSEE ONLY

Delroy Campbell-Whyte                                   Employee no. 0047731
52 Glascote Heath Road
Tamworth
B77 2EL

6 November 2026

Dear Delroy,

Outcome of disciplinary hearing: final written warning

I am writing to confirm the outcome of the disciplinary hearing held on Tuesday 3 November 2026, which I chaired. You were accompanied by your union representative, Marcia Gayle of the GMB. Sunil Rathore (Shift Manager) presented the management case and Ewa Nowicka took notes.

The allegations were:
1. That on 17 October 2026 you left the site at 02:40, three hours and twenty minutes before the end of your night shift, without permission.
2. That on 9 and 17 October you failed to complete the vehicle defect check on forklift FLT-12.

You accepted allegation 1. You explained that your partner, Shanelle, had called to say your daughter Amoy was having an asthma attack and was being taken to hospital by ambulance, and that you could not find a manager. You denied allegation 2 and said the handheld scanner was not working.

My findings
I accept that you left because of a family emergency, and I have seen the hospital discharge letter. However you did not tell anyone, and the control room was staffed. The scanner logs show the device was working on both dates. I find both allegations proven. I do not find gross misconduct.

Decision
You are given a final written warning, which will stay on your file for 12 months from today. Any further misconduct in that time may lead to dismissal. You will not be paid for the 3 hours 20 minutes not worked (£41.27 gross). You must retake forklift refresher training by 30 November 2026.

Right of appeal
You may appeal in writing within 5 working days of receiving this letter, to Helen Vanterpool, Regional Operations Director, at helen.vanterpool@northgateparcel.example, stating your grounds.

I recognise you have nine years' service with a clean record, and I have taken that into account.

Yours sincerely,

Graham Ilesanmi
Hub General Manager
`,
    gold: [
      g('PERSON', 'Delroy'),
      g('PERSON', 'Campbell-Whyte'),
      g('ID_NUMBER', '0047731'),
      g('ADDRESS', '52 Glascote Heath Road'),
      g('POSTCODE', 'B77 2EL'),
      g('PERSON', 'Shanelle'),
      g('PERSON', 'Amoy'),
      g('PERSON', 'Marcia', 'other'),
      g('PERSON', 'Gayle', 'other'),
      g('PERSON', 'Sunil', 'other'),
      g('PERSON', 'Rathore', 'other'),
      g('PERSON', 'Ewa', 'other'),
      g('PERSON', 'Nowicka', 'other'),
      g('PERSON', 'Helen', 'other'),
      g('PERSON', 'Vanterpool', 'other'),
      g('EMAIL', 'helen.vanterpool@northgateparcel.example', 'other'),
      g('PERSON', 'Graham', 'other'),
      g('PERSON', 'Ilesanmi', 'other'),
    ],
    keep: [
      'final written warning',
      '12 months',
      'within 5 working days',
      '30 November 2026',
      '£41.27 gross',
      'gross misconduct',
      'forklift refresher training',
      'Tuesday 3 November 2026',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Tamworth', 'night shift', "nine years' service", 'GMB', '17 October 2026'],
  },
  {
    id: 'final-payslip',
    title: 'Care home payslip',
    text: `SELWOOD CARE HOMES GROUP                                 PAYSLIP
----------------------------------------------------------------------
Employee      E YILDIRIM (Ms Elif Yıldırım)     Pay date    30/10/2026
Payroll no    SC-208814                         Period      Month 7
NI number     NW 62 80 15 D                     Tax code    1257L M1
NI category   A                                 Dept        Night care, Rowan Lodge
----------------------------------------------------------------------
PAYMENTS                      Units    Rate      Amount
Basic pay                     151.67   12.60    1,911.04
Night enhancement              96.00    1.90      182.40
Sleep-in shifts                 2.00   45.00       90.00
Statutory sick pay (3 days)                        70.05
                                       GROSS    2,253.49
DEDUCTIONS
PAYE income tax                                   240.60
National Insurance                                 96.44
Pension (NEST) 5%                                  86.67
Student loan Plan 2                                 0.00
Attachment of earnings (council tax)               75.00
Uniform                                            12.00
                                       TOTAL      510.71
----------------------------------------------------------------------
NET PAY                                         1,742.78
Paid by BACS to: E YILDIRIM  sort 20-41-77  a/c 43310926
----------------------------------------------------------------------
Year to date:  Gross 15,104.22   Tax 1,566.80   NI 655.12   Pension 588.40
Home address held: 4a Vicarage Terrace, Frome BA11 1QB
Message: Your tax code is on a month 1 basis. If you think it is wrong contact HMRC, not payroll.
Queries: payroll@selwoodcare.example quoting your payroll number.
`,
    gold: [
      g('PERSON', 'YILDIRIM'),
      g('PERSON', 'Elif'),
      g('PERSON', 'Yıldırım'),
      g('ID_NUMBER', 'SC-208814'),
      g('ID_NUMBER', 'NW 62 80 15 D'),
      g('ACCOUNT', '43310926'),
      g('ADDRESS', '4a Vicarage Terrace'),
      g('POSTCODE', 'BA11 1QB'),
    ],
    keep: [
      '1257L M1',
      '2,253.49',
      '1,742.78',
      'Attachment of earnings (council tax)',
      '75.00',
      'Statutory sick pay (3 days)',
      'month 1 basis',
      'Pension (NEST) 5%',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Rowan Lodge', 'Frome', 'Night care', 'SELWOOD CARE HOMES GROUP'],
  },
  {
    id: 'final-job-offer',
    title: 'Conditional offer of employment',
    text: `Tidewater Analytics Ltd
The Old Sail Loft, Harbour Road, Falmouth

Ref: HR/OFF/2026/0391
13 November 2026

Dr Imogen Fairweather-Okonjo
Top Floor Flat
17 Marlborough Crescent
Exeter
EX4 4DQ

Dear Imogen,

Offer of employment: Senior Data Scientist

Following your interviews with Ravi and the platform team, I am delighted to offer you the role of Senior Data Scientist, reporting to Ravi Subramaniam, Head of Modelling.

Main terms
Start date: Monday 4 January 2027
Salary: £68,500 a year, paid monthly in arrears on the 26th
Hours: 37.5 a week; hybrid, with at least two days a week in the Falmouth office
Holiday: 27 days plus bank holidays
Pension: we pay 6% if you pay at least 4%
Probation: six months, with one month's notice on either side during probation and three months after
Relocation: up to £4,000 against receipts, repayable in full if you leave within 12 months

This offer is conditional on:
(a) proof of your right to work in the UK. Please bring your passport (you mentioned it is a British passport, number 548209613) on your first day;
(b) two satisfactory references. We will contact Professor Annelise Haugen at the University of Exeter and your current manager at Greyfriars Mutual only after you accept;
(c) a basic DBS check.

You told us you are currently on maternity leave until December and may want to start on four days a week. We are open to that; salary and holiday would be pro rata, and we can confirm it in the contract.

To accept, please sign and return the enclosed copy by Friday 27 November 2026. If we have not heard by then the offer will lapse. If you have questions, call me on 01632 960334 or my mobile 07700 900071.

Yours sincerely,

Kerensa Trevithick
People Lead
kerensa@tidewater-analytics.example

I accept the offer on the terms above.
Signed ........................................   Date ..............
Imogen Fairweather-Okonjo     Personal email: imogen.fo@quickpost.example     Mobile: 07700 900688
`,
    gold: [
      g('PERSON', 'Imogen'),
      g('PERSON', 'Fairweather-Okonjo'),
      g('ADDRESS', '17 Marlborough Crescent'),
      g('POSTCODE', 'EX4 4DQ'),
      g('ID_NUMBER', '548209613'),
      g('ID_NUMBER', 'HR/OFF/2026/0391'),
      g('EMAIL', 'imogen.fo@quickpost.example'),
      g('PHONE', '07700 900688'),
      g('PERSON', 'Ravi', 'other'),
      g('PERSON', 'Subramaniam', 'other'),
      g('PERSON', 'Annelise', 'other'),
      g('PERSON', 'Haugen', 'other'),
      g('PERSON', 'Kerensa', 'other'),
      g('PERSON', 'Trevithick', 'other'),
      g('EMAIL', 'kerensa@tidewater-analytics.example', 'other'),
      g('PHONE', '07700 900071', 'other'),
      g('PHONE', '01632 960334', 'other'),
    ],
    keep: [
      '£68,500 a year',
      'Monday 4 January 2027',
      'six months',
      'up to £4,000',
      'Friday 27 November 2026',
      'basic DBS check',
      'right to work in the UK',
      '27 days plus bank holidays',
      'repayable in full if you leave within 12 months',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Exeter', 'Greyfriars Mutual', 'maternity leave', 'University of Exeter'],
  },
  {
    id: 'final-sen-support-review',
    title: 'Primary school SEN support plan review',
    text: `Whinmoor Primary School — Inclusion Team
SEN SUPPORT PLAN REVIEW (Term 1)

Pupil: Fionn O'Driscoll-Baptiste          Year: 4 (class 4M, Miss Marwood)
Date of birth: 05/07/2017                 UPN: H820417216033
Review held: Thursday 5 November 2026, 3.30pm
Present: Caoimhe O'Driscoll (mum), Jerome Baptiste (dad, by phone), Mrs Y. Adjei (SENCo), Miss Marwood

1. What is going well
Fionn is settled in 4M and has two close friends. He loves the lunchtime Lego club. Reading has moved from Turquoise to Gold band since July. He uses his ear defenders in assembly without being reminded.

2. What is still hard
Writing: produces two or three sentences in a lesson where peers write a page; grip is tight and he tires quickly. Transitions after lunch: three incidents this half term of hiding under the table, one of leaving the classroom. Mum reports meltdowns most evenings after school and that he is sleeping badly.

3. Assessments and outside agencies
- Autism assessment: on the neurodevelopmental pathway waiting list since February 2025 (ref ND/25/01188). Mum was told the wait is about 26 months.
- Speech and language therapy report (Tegan Rhydderch, 12 October 2026): language scores in the low average range; difficulties with inference and non-literal language.
- Occupational therapy: referral sent 9 November.

4. Agreed actions
a) 15 minutes daily handwriting programme with Mr Okafor (TA).
b) Laptop for longer writing from after half term.
c) Visual timetable and a "now and next" card for the afternoon; quiet start after lunch in the library.
d) School to apply for an Education, Health and Care needs assessment by 4 December 2026. Parents to send their views by 27 November.
e) Mrs Adjei to chase the pathway team.

5. Parents' contact details checked
Caoimhe: 07700 900265, caoimhe.od@familymail.example
Jerome: 07700 900913
Address: 23 Coldcotes Garth, Leeds LS9 6PL

Next review: week of 8 February 2027.
`,
    gold: [
      g('PERSON', 'Fionn'),
      g('PERSON', "O'Driscoll"),
      g('PERSON', 'Baptiste'),
      g('PERSON', 'Caoimhe'),
      g('PERSON', 'Jerome'),
      g('DOB', '05/07/2017'),
      g('ID_NUMBER', 'H820417216033'),
      g('ID_NUMBER', 'ND/25/01188'),
      g('PHONE', '07700 900265'),
      g('EMAIL', 'caoimhe.od@familymail.example'),
      g('PHONE', '07700 900913'),
      g('ADDRESS', '23 Coldcotes Garth'),
      g('POSTCODE', 'LS9 6PL'),
      g('PERSON', 'Marwood', 'other'),
      g('PERSON', 'Adjei', 'other'),
      g('PERSON', 'Tegan', 'other'),
      g('PERSON', 'Rhydderch', 'other'),
      g('PERSON', 'Okafor', 'other'),
    ],
    keep: [
      'Education, Health and Care needs assessment',
      '4 December 2026',
      'Autism assessment',
      'about 26 months',
      'Speech and language therapy',
      'Occupational therapy',
      '15 minutes daily handwriting programme',
      '27 November',
    ],
    medical: ['Autism assessment'],
    medicalHigh: ['Autism assessment'],
    quasi: ['Whinmoor Primary School', 'Leeds', 'Lego club', 'class 4M'],
  },
  {
    id: 'final-school-suspension',
    title: 'Secondary school suspension letter',
    text: `THE BISHOP ALDERTON ACADEMY
Office of the Principal

Mrs Tahmina Begum
61 Cannon Street Road
Oldham
OL9 6EP

By email (tahmina.begum77@netpost.example) and post
Monday 9 November 2026

Dear Mrs Begum,

Suspension of Rayhan Uddin, 9T, date of birth 14 January 2012

I am writing to tell you that I have decided to suspend Rayhan from the academy for a fixed period of 4 school days. The suspension begins on Tuesday 10 November 2026 and ends on Friday 13 November 2026. Rayhan should return on Monday 16 November.

Reason
On Friday 6 November, during period 5, Rayhan was involved in a fight in the science corridor in which another pupil was punched and needed first aid. This is a serious breach of the behaviour policy (physical assault against a pupil). Rayhan has given a written account in which he says the other pupil had been sending him abusive messages about his brother Imran, who uses a wheelchair. We are investigating this separately as a bullying matter, and it has been taken into account in deciding on a suspension and not a permanent exclusion.

Your duties
For the first five school days of any suspension you must make sure Rayhan is not in a public place during school hours without good reason. You could be given a fixed penalty notice if he is. Work will be set on the online platform and marked.

Your rights
You have the right to make representations to the governing board. Because this suspension brings Rayhan's total this term to 7 days, the governors must consider it if you ask them to, but they cannot direct reinstatement. Write to the Clerk to the Governors, Mr Desmond Achebe, at clerk@bishopalderton.example. You may also contact the local authority's exclusions officer on 0161 496 0109.

Reintegration meeting
Please attend a meeting with Rayhan and his Head of Year, Ms Katarzyna Zielińska, on Monday 16 November at 8.20am. If you need a Sylheti interpreter, tell the office.

As Rayhan receives free school meals, a voucher for the four days will be emailed to you.

Yours sincerely,

Dr Marcus Oyelowo-Hart
Principal
`,
    gold: [
      g('PERSON', 'Tahmina'),
      g('PERSON', 'Begum'),
      g('ADDRESS', '61 Cannon Street Road'),
      g('POSTCODE', 'OL9 6EP'),
      g('EMAIL', 'tahmina.begum77@netpost.example'),
      g('PERSON', 'Rayhan'),
      g('PERSON', 'Uddin'),
      g('DOB', '14 January 2012'),
      g('PERSON', 'Imran'),
      g('PERSON', 'Desmond', 'other'),
      g('PERSON', 'Achebe', 'other'),
      g('PERSON', 'Katarzyna', 'other'),
      g('PERSON', 'Zielińska', 'other'),
      g('PERSON', 'Marcus', 'other'),
      g('PERSON', 'Oyelowo-Hart', 'other'),
    ],
    keep: [
      'fixed period of 4 school days',
      'Tuesday 10 November 2026',
      'Monday 16 November at 8.20am',
      'physical assault against a pupil',
      'representations to the governing board',
      'fixed penalty notice',
      'total this term to 7 days',
      'permanent exclusion',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Oldham', 'THE BISHOP ALDERTON ACADEMY', '9T', 'free school meals', 'Sylheti'],
  },
  {
    id: 'final-motor-claim-total-loss',
    title: 'Motor insurance total loss decision',
    text: `Kestrel Mutual Insurance
Motor Claims, PO Box 2200, Chelmsford

Claim number: KM/MTR/26/0717345
Policy number: KMP 8840 2217 61
Date: 4 November 2026

Mr Sutrisno
(Our records hold a single name. If this is wrong, please tell us.)
Flat C, 208 Narborough Road
Leicester
LE3 2AN

Dear Mr Sutrisno,

Your claim for the accident on 21 October 2026

We are sorry to hear about your accident. This letter explains our decision on liability and what happens to your car.

What happened
You told us that at about 5.45pm you were stationary at the lights on Upperton Road when a white Ford Transit, registration DN68 HWC, hit the rear of your Toyota Yaris, FE15 OKZ. Your passenger was your wife, Wulandari, who has reported a neck injury. The other driver, a Mr P. Hallam, has admitted fault to his insurer, Bellweather Direct.

Our decision
We are treating this as a non-fault claim. Your no claims discount of 6 years will not be affected once we recover our costs.

Your car
Our engineer inspected the Yaris on 28 October and has decided it is beyond economical repair (Category S). The pre-accident market value is £5,150. After your £350 compulsory excess we will pay £4,800. We will reclaim your excess from Bellweather Direct and return it to you. If you want to keep the salvage, the payment would be £3,960.

Hire car
The courtesy car (Kia Picanto) must be returned within 7 days of the settlement payment.

Injury
We do not handle injury claims. Your policy includes legal expenses cover, and Tolland Reece Solicitors will contact Mrs Wulandari and you separately. You do not have to use them.

What we need from you
- The V5C logbook, both keys and the MOT certificate
- Your bank details for the payment: call 0345 496 0122, do not email them
- Finance: you told us there is outstanding finance with Castlebrook Motor Finance (agreement 4471-880-2196). We must pay them first and send you any balance.

If you disagree with the valuation, send us adverts for similar cars within 14 days.

Yours sincerely,

Lerato Dlamini
Claims Handler, extension 5518
`,
    gold: [
      g('PERSON', 'Sutrisno'),
      g('PERSON', 'Wulandari'),
      g('ADDRESS', '208 Narborough Road'),
      g('POSTCODE', 'LE3 2AN'),
      g('ID_NUMBER', 'KM/MTR/26/0717345'),
      g('ID_NUMBER', 'KMP 8840 2217 61'),
      g('ID_NUMBER', 'FE15 OKZ'),
      g('ID_NUMBER', '4471-880-2196'),
      g('PERSON', 'Hallam', 'other'),
      g('ID_NUMBER', 'DN68 HWC', 'other'),
      g('PERSON', 'Lerato', 'other'),
      g('PERSON', 'Dlamini', 'other'),
    ],
    keep: [
      'non-fault claim',
      'Category S',
      '£5,150',
      '£350 compulsory excess',
      '£4,800',
      '£3,960',
      'within 14 days',
      'legal expenses cover',
      'no claims discount of 6 years',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Leicester', '21 October 2026', 'Toyota Yaris', 'Upperton Road'],
  },
  {
    id: 'final-energy-complaint-email',
    title: 'Customer complaint email to an energy supplier',
    text: `From: Hamish Drummond <hamish.drummond51@clanmail.example>
To: complaints@lochviewenergy.example
Cc: Isla Drummond
Sent: Sunday 8 November 2026 21:47
Subject: FORMAL COMPLAINT - account 8104 2296 5530 - estimated bills and direct debit

To whom it may concern,

I am writing for the third time about the electricity account at Craigend Cottage, by Aberfeldy, PH15 2LS. I want this treated as a formal complaint under your complaints procedure.

The facts:
- We have a smart meter (serial 21E4407719) which stopped sending readings in March 2026. Your own engineer, a young man called Callum, confirmed this when he visited on 9 July and said it would be replaced. It has not been.
- Since March every bill has been estimated. I have sent photographs of the actual reading four times. On 1 November the meter read 48,213. Your bill dated 2 November says 53,960.
- On the strength of that estimate you raised our direct debit from £142 to £318 a month with no notice that I received, and took £318 on 5 November. That has left my wife and me overdrawn. I am 75, she has Parkinson's, and the house is all electric, so we cannot simply turn things off.
- I rang on 6 November (ref CAS-7719032) and waited 55 minutes. The adviser told me nothing could be changed until a "validated read" was received. I gave one. Nothing has happened.

What I want:
1. The bill reissued on the actual reading of 48,213.
2. The direct debit put back to £142 and the £176 difference refunded within 5 working days.
3. The meter replaced, with a date.
4. Confirmation that we are on your Priority Services Register. We were told we were in 2024.
5. Compensation for the time and the overdraft charge of £28.

I understand you have eight weeks to resolve a complaint before I can go to the Energy Ombudsman, and that you cannot back-bill for energy used more than 12 months ago. I will be counting from my first email on 14 August.

Please reply in writing, not by phone, as I am hard of hearing. If you must ring, speak to my daughter Isla on 07700 900347.

Yours faithfully,
H. A. Drummond (Mr)
`,
    gold: [
      g('PERSON', 'Hamish'),
      g('PERSON', 'Drummond'),
      g('EMAIL', 'hamish.drummond51@clanmail.example'),
      g('PERSON', 'Isla'),
      g('ID_NUMBER', '8104 2296 5530'),
      g('ADDRESS', 'Craigend Cottage'),
      g('POSTCODE', 'PH15 2LS'),
      g('ID_NUMBER', '21E4407719'),
      g('ID_NUMBER', 'CAS-7719032'),
      g('PHONE', '07700 900347'),
      g('PERSON', 'Callum', 'other'),
    ],
    keep: [
      'from £142 to £318 a month',
      '48,213',
      '53,960',
      'eight weeks',
      'Energy Ombudsman',
      'Priority Services Register',
      'more than 12 months ago',
      '£176 difference',
      'within 5 working days',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Aberfeldy', "Parkinson's", 'I am 75', 'hard of hearing'],
  },
  {
    id: 'final-visit-visa-refusal',
    title: 'Visit visa refusal notice',
    text: `Home Office
UK Visas and Immigration

GV51 REFUSAL OF ENTRY CLEARANCE

Applicant: OKWUOSA, Chidinma Adaeze                GWF reference: GWF071148826
Date of birth: 11 April 1994                       Nationality: Nigerian
Passport number: B04417362                         Post: Lagos
Application: Visitor (Standard) — family visit     Date of decision: 2 November 2026

Dear Ms Okwuosa,

You applied for a visit visa to the United Kingdom for 3 weeks to attend the wedding of your sister, Mrs Ngozi Okwuosa-Fielding, in Reading on 12 December 2026.

The decision
I have refused your application because I am not satisfied that you meet the requirements of paragraph V 4.2 (a) and (c) of Appendix V: Visitor of the Immigration Rules.

Reasons
• You state that you are employed as a procurement officer at Zenora Agro-Allied Ltd earning 310,000 naira a month. Your bank statement shows a closing balance of 4,150,000 naira, but 3,600,000 naira of this was credited in two deposits on 14 and 16 October 2026, shortly before you applied. You have not shown where these funds came from. I am not satisfied the funds are genuinely available to you.
• Your employer's letter does not confirm that leave has been approved and has no contact telephone number.
• You have not travelled outside Nigeria before. You are single with no dependants. On the evidence I am not satisfied that you have ties that would lead you to leave the UK at the end of your visit.
• Your sponsor's letter says she and her fiancé, Mr Oliver Fielding, will pay for your stay, but no evidence of their finances or of their address at 12 Alpine Street, Reading RG1 2PY was provided.

I have not doubted your relationship to your sponsor.

Your right to challenge this decision
There is no right of appeal or administrative review against this decision. You can apply again at any time, and any new application will be considered on its merits. If you believe the decision is unlawful you may seek judicial review; you should take legal advice first, and there are strict time limits (normally 3 months).

Future applications
This refusal will be recorded. You must declare it in any future application to the UK.

Entry Clearance Officer: ECO 7 (LOS)
`,
    gold: [
      g('PERSON', 'OKWUOSA'),
      g('PERSON', 'Okwuosa'),
      g('PERSON', 'Chidinma'),
      g('PERSON', 'Adaeze'),
      g('ID_NUMBER', 'GWF071148826'),
      g('DOB', '11 April 1994'),
      g('ID_NUMBER', 'B04417362'),
      g('PERSON', 'Ngozi'),
      g('PERSON', 'Fielding'),
      g('PERSON', 'Oliver'),
      g('ADDRESS', '12 Alpine Street'),
      g('POSTCODE', 'RG1 2PY'),
    ],
    keep: [
      'paragraph V 4.2 (a) and (c)',
      'Appendix V: Visitor',
      '3,600,000 naira',
      'no right of appeal or administrative review',
      'judicial review',
      'normally 3 months',
      '12 December 2026',
      'apply again at any time',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['procurement officer', 'Zenora Agro-Allied Ltd', 'Lagos', 'Reading', 'Nigerian'],
  },
  {
    id: 'final-self-assessment-penalties',
    title: 'Self Assessment late filing penalties',
    text: `HM Revenue and Customs
Self Assessment
                                             UTR  41507 28893
                                             NINO  JT 30 55 19 A
                                             Date of issue  6 November 2026
MR J R P THACKERAY
ROSE BANK
MILL LANE
NETHER POPPLETON
YORK  YO26 6JX

Self Assessment: late filing and late payment penalties for the tax year 6 April 2024 to 5 April 2025

Dear Mr Thackeray

We have not received your tax return for 2024 to 2025. It was due by 31 January 2026.

What you owe
Fixed late filing penalty                                        £100.00
Daily penalties, £10 a day for 90 days (1 May to 29 July 2026)   £900.00
6 month late filing penalty                                      £300.00
Tax due on our estimate (determination)                        £2,418.60
5% late payment penalty at 30 days                               £120.93
5% late payment penalty at 6 months                              £120.93
Interest to date                                                 £141.12
Total                                                          £4,101.58

What you need to do now
Send your tax return now. When we get it, it will replace our estimate, and the penalties that are based on the tax due will be worked out again. If you file after 31 January 2027 a further penalty of £300 or 5% of the tax due will be charged.

If you had a reasonable excuse
You can appeal against a penalty if you had a reasonable excuse for filing late, for example a serious illness or bereavement. You must appeal within 30 days of the date of this notice. We note the letter from your agent, Castellan & Pike Accountants, saying that you were in hospital from November 2025 to February 2026 and that your wife, Mrs D M Thackeray, who dealt with your affairs, died in March 2026. Please send us evidence with your appeal.

If you cannot pay
Call the Self Assessment Payment Helpline on 0300 496 0167. You may be able to set up a Time to Pay arrangement.

Your income from J. Thackeray Joinery ceased on 30 September 2024 according to our records. If you no longer need to complete a return, tell us.
`,
    gold: [
      g('PERSON', 'THACKERAY'),
      g('PERSON', 'Thackeray'),
      g('ID_NUMBER', '41507 28893'),
      g('ID_NUMBER', 'JT 30 55 19 A'),
      g('ADDRESS', 'ROSE BANK'),
      g('ADDRESS', 'MILL LANE'),
      g('POSTCODE', 'YO26 6JX'),
    ],
    keep: [
      '£4,101.58',
      '31 January 2026',
      '£10 a day for 90 days',
      'reasonable excuse',
      'within 30 days',
      'Time to Pay arrangement',
      '31 January 2027',
      '£2,418.60',
      'determination',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['NETHER POPPLETON', 'YORK', 'Castellan & Pike Accountants', 'March 2026', 'Joinery'],
  },
  {
    id: 'final-ireland-statement-of-liability',
    title: 'Irish Revenue Statement of Liability',
    text: `Revenue — Cáin agus Custaim na hÉireann
PAYE Services, Limerick Region

Statement of Liability for 2025
Notice number: 26004418827N                       Date: 20 October 2026

Ms Aoife Ní Bhraonáin
Apartment 12, The Maltings
Bonham Quay Road
Galway
H91 X4K7

PPSN: 7482915TA

Dear Ms Ní Bhraonáin,

This is your Statement of Liability (formerly a P21) for the year ended 31 December 2025, based on the Income Tax Return you submitted in myAccount on 3 October 2026.

Income
Employment: Tuam Road Veterinary Hospital            €46,320.00
Employment: Corrib Language School (evening tutor)    €5,280.00
Illness Benefit (Department of Social Protection)     €2,196.00
Total income                                         €53,796.00

Tax calculated
€44,000.00 at 20%                                     €8,800.00
€9,796.00 at 40%                                      €3,918.40
Less tax credits (Personal €1,875, Employee €1,875, Rent €1,000)   −€4,750.00
Income tax due                                        €7,968.40
USC due                                               €1,284.11
Total due                                             €9,252.51
Tax and USC paid through payroll                      €8,366.27

Result: UNDERPAYMENT of €886.24

Why there is an underpayment
Your second employment was taxed using credits and rate band that had already been given to your main employment, and Illness Benefit is taxable but had not been included in your credits.

How this will be collected
Unless you pay in full through myAccount by 30 November 2026, we will collect the underpayment by reducing your tax credits over four years starting 1 January 2027, that is by €221.56 a year.

We have also noted the health expenses claim of €1,460 (receipts in the name of your partner, Tadhg Mac Suibhne) cannot be allowed as you are not jointly assessed.

If you disagree, reply through MyEnquiries in myAccount within 30 days of the date of this notice.
`,
    gold: [
      g('PERSON', 'Aoife'),
      g('PERSON', 'Bhraonáin'),
      g('ID_NUMBER', '26004418827N'),
      g('ADDRESS', 'The Maltings'),
      g('ADDRESS', 'Bonham Quay Road'),
      g('POSTCODE', 'H91 X4K7'),
      g('ID_NUMBER', '7482915TA'),
      g('PERSON', 'Tadhg'),
      g('PERSON', 'Suibhne'),
    ],
    keep: [
      'Statement of Liability',
      'UNDERPAYMENT of €886.24',
      '30 November 2026',
      'over four years',
      '€221.56 a year',
      'Illness Benefit is taxable',
      'not jointly assessed',
      '€1,460',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Galway', 'Tuam Road Veterinary Hospital', 'Corrib Language School', 'evening tutor'],
  },
  {
    id: 'final-us-irs-cp2000',
    title: 'US IRS underreported income notice',
    text: `Department of the Treasury
Internal Revenue Service
Ogden, UT 84201-0030
                                             Notice            CP2000
                                             Tax year          2024
                                             Notice date       October 26, 2026
                                             Social Security number   987-65-4329
                                             AUR control number       55021-8814
MARISOL G ORTEGA-REYES
4417 W CORTLAND ST APT 2R
CHICAGO IL 60639-2204

We are proposing changes to your 2024 Form 1040

Dear Ms. Ortega-Reyes:

The income and payment information we have on file from sources such as employers or financial institutions does not match the information you reported on your tax return. If our information is correct, you will owe $1,873.

Summary of proposed changes
Tax you owe                              $1,502
Accuracy-related penalty                   $300
Interest (through November 25, 2026)        $71
Amount due by November 25, 2026          $1,873

What did not match
Form 1099-NEC, nonemployee compensation, from Lakefront Rideshare Partners LLC: reported to us $9,640; shown on your return $0.
Form 1099-INT, interest, from Prairie State Credit Union, account ending 6021: reported to us $212; shown on your return $0.

What you need to do
Respond by November 25, 2026, even if you agree.
• If you agree, sign the enclosed response form and mail or fax it to us. You do not need to file an amended return.
• If you do not agree, check the box "I do not agree", explain why in a signed statement, and include documents that support your claim. For example, if you had business expenses against the rideshare income (mileage, phone, commissions), send a completed Schedule C.
• If we do not hear from you by the due date, we will send a Statutory Notice of Deficiency and you will have 90 days to petition the Tax Court.

We remove the accuracy-related penalty where the taxpayer shows reasonable cause. You claimed the Earned Income Credit with two qualifying children, Mateo and Ximena Reyes; a change in your income may change that credit, and we have included this in the figures above.

If you cannot pay the full amount, you can ask for a payment plan (Form 9465).

Questions? Call 1-800-555-0137 between 7 a.m. and 8 p.m. You may authorize someone, such as your preparer Dolores Wachowski EA (PTIN P01558294), to contact us on your behalf.

Your contact information on file: (773) 555-0162 — marisol.ortega.reyes@correo.example
`,
    gold: [
      g('PERSON', 'MARISOL'),
      g('PERSON', 'ORTEGA-REYES'),
      g('PERSON', 'Ortega'),
      g('PERSON', 'Reyes'),
      g('PERSON', 'Mateo'),
      g('PERSON', 'Ximena'),
      g('ID_NUMBER', '987-65-4329'),
      g('ID_NUMBER', '55021-8814'),
      g('ADDRESS', '4417 W CORTLAND ST'),
      g('POSTCODE', '60639-2204'),
      g('PHONE', '(773) 555-0162'),
      g('EMAIL', 'marisol.ortega.reyes@correo.example'),
      g('PERSON', 'Dolores', 'other'),
      g('PERSON', 'Wachowski', 'other'),
      g('ID_NUMBER', 'P01558294', 'other'),
    ],
    keep: [
      'CP2000',
      '$1,873',
      'November 25, 2026',
      'Accuracy-related penalty',
      'Form 1099-NEC',
      '$9,640',
      'Schedule C',
      '90 days',
      'Form 9465',
      'Earned Income Credit',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['CHICAGO', 'Lakefront Rideshare Partners LLC', 'Prairie State Credit Union', 'two qualifying children'],
  },
  {
    id: 'final-canada-reassessment',
    title: 'Canada Revenue Agency notice of reassessment',
    text: `Canada Revenue Agency / Agence du revenu du Canada
Sudbury Tax Centre

Notice of Reassessment                                   Tax year: 2025
Date issued: Oct 29, 2026
Social insurance number: 912 048 337
Reference number: R7-4401-9KW2

TREMBLAY-NAKASHIMA, JEAN-BAPTISTE
1408-77 RUE DES ÉRABLES
GATINEAU QC  J8X 3R4

Mr. Tremblay-Nakashima,

We reviewed your 2025 income tax and benefit return and made the changes explained below.

Account summary
Result of this reassessment:            $1,126.40 DR
Previous balance:                           $0.00
Arrears interest:                          $31.85
Balance due:                            $1,158.25
Pay by November 30, 2026 to avoid further interest.

Explanation of changes
Line 21400 – Child care expenses. You claimed $9,800 for Margaux (born 2019) and Kenji (born 2022). We asked for receipts on July 14, 2026. The receipts from Garderie Les Petits Draveurs support $6,200. The remaining $3,600 was paid to Mme Solange Tremblay, who we understand is the children's grandmother and lives at your address. Payments to a related person under 18, or to the child's parent, cannot be claimed; payments to another relative can be claimed only with a receipt showing her social insurance number. No such receipt was provided. We reduced your claim to $6,200.

Line 31900 – Interest paid on student loans. Allowed as filed: $412.

Because your net income has changed, your Canada child benefit and GST/HST credit for July 2026 to June 2027 will be recalculated. You will get a separate notice.

If you disagree
You can send the missing receipt and ask for an adjustment, or file a formal objection within 90 days of the date of this notice, that is by January 27, 2027.

If you can't pay in full, call 1-888-555-0114 to set up a payment arrangement. Your spouse, Ms. Hikari Nakashima, is not responsible for this balance.

My Account user ID on file: jbtremblay_gat
`,
    gold: [
      g('PERSON', 'TREMBLAY-NAKASHIMA'),
      g('PERSON', 'JEAN-BAPTISTE'),
      g('PERSON', 'Tremblay'),
      g('PERSON', 'Nakashima'),
      g('PERSON', 'Margaux'),
      g('PERSON', 'Kenji'),
      g('PERSON', 'Solange'),
      g('PERSON', 'Hikari'),
      g('ID_NUMBER', '912 048 337'),
      g('ID_NUMBER', 'R7-4401-9KW2'),
      g('ADDRESS', '1408-77 RUE DES ÉRABLES'),
      g('POSTCODE', 'J8X 3R4'),
      g('OTHER', 'jbtremblay_gat'),
    ],
    keep: [
      'Notice of Reassessment',
      '$1,158.25',
      'November 30, 2026',
      'Line 21400',
      'Child care expenses',
      'reduced your claim to $6,200',
      'within 90 days',
      'January 27, 2027',
      'Canada child benefit',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['GATINEAU', 'Garderie Les Petits Draveurs', 'born 2019', 'born 2022'],
  },
  {
    id: 'final-australia-carer-debt',
    title: 'Australian Centrelink overpayment letter',
    text: `Services Australia
Centrelink
                                                 Customer Reference Number: 204 771 893K
                                                 Letter ID: A3Q-88104-27
                                                 6 November 2026
Mrs Stavroula Papadakis-Nguyen
Unit 5, 31 Wattlebird Parade
Reservoir VIC 3073

Dear Mrs Papadakis-Nguyen

You have been overpaid Carer Payment

We have reviewed the Carer Payment you get for caring for your father, Mr Kyriakos Papadakis. This letter tells you about a debt and how to pay it back.

What happened
Between 3 March 2026 and 13 September 2026 we paid you Carer Payment at the full rate. During this time your husband, Duc, reported income from Yarra Plenty Couriers Pty Ltd to the Australian Taxation Office that was higher than the income you reported to us. Your payment is affected by your partner's income.

Amount you were paid                 $13,406.40
Amount you were entitled to           $9,718.20
Amount you owe                        $3,688.20

We have not applied a penalty because the difference was caused by irregular overtime and not by a false statement.

What you need to do
You need to pay $3,688.20 or contact us to make an arrangement by 4 December 2026. If you do nothing, from 9 December 2026 we will take $46.20 from each fortnightly payment until the debt is repaid.

If you are in hardship
If repaying at this rate would leave you unable to pay for food, rent or medicine, call the debt line on 1800 555 0143. We can lower the amount, pause repayments, or in special circumstances waive the debt.

If you disagree
You can ask for a formal review by an Authorised Review Officer. There is no time limit to ask, but if you ask within 13 weeks and the decision is changed, you may get back pay. After that you can apply to the Administrative Review Tribunal.

Please keep reporting your husband's income every fortnight. Your next reporting date is 19 November 2026.

Your details: mobile 0491 570 156, email s.papadakis.nguyen@ozpost.example. Your father's CRN is 310 662 047B.
`,
    gold: [
      g('PERSON', 'Stavroula'),
      g('PERSON', 'Papadakis'),
      g('PERSON', 'Nguyen'),
      g('PERSON', 'Kyriakos'),
      g('PERSON', 'Duc'),
      g('ID_NUMBER', '204 771 893K'),
      g('ID_NUMBER', 'A3Q-88104-27'),
      g('ADDRESS', '31 Wattlebird Parade'),
      g('POSTCODE', '3073'),
      g('PHONE', '0491 570 156'),
      g('EMAIL', 's.papadakis.nguyen@ozpost.example'),
      g('ID_NUMBER', '310 662 047B'),
    ],
    keep: [
      'Carer Payment',
      '$3,688.20',
      '4 December 2026',
      '$46.20 from each fortnightly payment',
      'Authorised Review Officer',
      'within 13 weeks',
      'Administrative Review Tribunal',
      'waive the debt',
      '19 November 2026',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Reservoir', 'Yarra Plenty Couriers Pty Ltd', 'caring for your father'],
  },
  {
    id: 'final-germany-tax-assessment',
    title: 'German income tax assessment (English translation)',
    text: `[Courtesy English translation — the German original is legally binding]

Finanzamt Leipzig-Nord (Tax Office)
Tax number: 232/277/04418
Tax identification number (IdNr): 47 205 913 688
Date: 22.10.2026

Mr Karim Haddad-Brückner and Mrs Annegret Brückner
Eisenbahnstraße 114
04315 Leipzig

Income tax assessment notice for 2025 (Einkommensteuerbescheid)
Joint assessment

Assessed income tax                          7,914.00 EUR
Solidarity surcharge                             0.00 EUR
Church tax (Protestant, wife only)             212.40 EUR
Total                                        8,126.40 EUR
Less wage tax already withheld               6,890.25 EUR
Less advance payments                            0.00 EUR
Remaining amount to pay                      1,236.15 EUR

Please pay 1,236.15 EUR by 25.11.2026 to the account of the tax office quoting your tax number. After that date late payment surcharges of 1% per month begun will be charged.

Basis of assessment
Income from employment (husband, Sachsenwerk Antriebstechnik GmbH)      41,208 EUR
Income from employment (wife, part time, Kita Sonnenkäfer)              17,930 EUR
Income from self-employment (husband, translation work Arabic–German)    6,400 EUR
Wage replacement benefits (parental allowance, wife) subject to progression   5,580 EUR

Explanations
1. The home office flat rate was allowed for 148 days (888 EUR) and not the 210 days claimed, because your employer's certificate confirms 148 days.
2. Childcare costs for your son Jonas (born 03.05.2022) were allowed at 80% of 3,960 EUR.
3. The costs of the German language examination (telc C1) for the husband, 195 EUR, were not allowed as income-related expenses because no connection with the current employment was shown.
4. For 2026 quarterly advance payments of 310 EUR are set, first due 10.12.2026.

Legal remedy
You may lodge an objection (Einspruch) against this notice within one month of its notification, in writing or electronically via ELSTER, with the tax office named above. An objection does not suspend the obligation to pay.

Refunds would be paid to: IBAN DE07 8605 5592 1090 4471 26, account holder A. Brückner.
`,
    gold: [
      g('PERSON', 'Karim'),
      g('PERSON', 'Haddad'),
      g('PERSON', 'Brückner'),
      g('PERSON', 'Annegret'),
      g('PERSON', 'Jonas'),
      g('DOB', '03.05.2022'),
      g('ID_NUMBER', '232/277/04418'),
      g('ID_NUMBER', '47 205 913 688'),
      g('ADDRESS', 'Eisenbahnstraße 114'),
      g('POSTCODE', '04315'),
      g('ACCOUNT', 'DE07 8605 5592 1090 4471 26'),
    ],
    keep: [
      '1,236.15 EUR',
      '25.11.2026',
      '1% per month',
      'within one month',
      'objection (Einspruch)',
      '148 days',
      'quarterly advance payments of 310 EUR',
      '10.12.2026',
      'Joint assessment',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Leipzig', 'Sachsenwerk Antriebstechnik GmbH', 'Kita Sonnenkäfer', 'translation work'],
  },
  {
    id: 'final-india-143-1-intimation',
    title: 'Indian income tax intimation under section 143(1)',
    text: `INCOME TAX DEPARTMENT
Centralised Processing Centre, Bengaluru

INTIMATION UNDER SECTION 143(1) OF THE INCOME TAX ACT, 1961

Name: LAKSHMI VENKATARAMAN                         PAN: AFZPV7190K
Assessment Year: 2026-27                           Acknowledgement No.: 418830590270726
Date of filing: 27-Jul-2026                        Document Identification No.: CPC/2627/A1/880417532
Aadhaar (masked): XXXX XXXX 6614
Address: Flat 3B, Sri Sai Nilayam, 14th Cross, Malleswaram, Bengaluru 560003
Mobile: +91 99999 01274        Email: lakshmi.venkat.blr@patramail.example

Dear Taxpayer,

Your return of income for Assessment Year 2026-27 has been processed. The computation under section 143(1) is compared below with the income as provided by you.

                                   As provided by taxpayer      As computed u/s 143(1)
Income from salary                        18,42,600                   18,42,600
Income from house property                (-) 2,00,000                (-) 2,00,000
Income from other sources                    64,210                    1,38,460
Deductions under Chapter VI-A              1,50,000                    1,50,000
Total income                              15,56,810                   16,31,060
Tax and cess payable                       2,82,065                    3,05,231
Interest u/s 234B and 234C                        0                       1,842
TDS and advance tax paid                   2,82,070                    2,82,070
NET AMOUNT PAYABLE                                0                      25,000

Reason for variance: interest income of Rs. 74,250 on fixed deposits with Kaveri Grameena Sahakara Bank, reported in your Annual Information Statement (AIS), was not included in the return. The deposits are held jointly with your husband, Shri R. Venkataraman.

A demand of Rs. 25,000 has been raised. Please pay within 30 days of receipt of this intimation. If you disagree, you may file a rectification request under section 154 online, or submit your response under "Response to Outstanding Demand". If the interest belongs to your husband, upload a declaration and his PAN (ABCPV4471R).

No refund is due. Your salary details were taken from Form 16 issued by Indraprastha Institute of Molecular Sciences (TAN BLRI04471E).

This is a computer generated intimation and does not need a signature.
`,
    gold: [
      g('PERSON', 'LAKSHMI'),
      g('PERSON', 'VENKATARAMAN'),
      g('PERSON', 'Venkataraman'),
      g('ID_NUMBER', 'AFZPV7190K'),
      g('ID_NUMBER', '418830590270726'),
      g('ID_NUMBER', 'CPC/2627/A1/880417532'),
      g('ADDRESS', 'Sri Sai Nilayam'),
      g('POSTCODE', '560003'),
      g('PHONE', '+91 99999 01274'),
      g('EMAIL', 'lakshmi.venkat.blr@patramail.example'),
      g('ID_NUMBER', 'ABCPV4471R'),
    ],
    keep: [
      'SECTION 143(1)',
      'interest income of Rs. 74,250',
      'demand of Rs. 25,000',
      'within 30 days',
      'section 154',
      'Annual Information Statement (AIS)',
      'Assessment Year 2026-27',
      'rectification request',
      'Form 16',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Bengaluru', 'Malleswaram', 'Indraprastha Institute of Molecular Sciences', 'Kaveri Grameena Sahakara Bank'],
  },
  {
    id: 'final-family-chat-stroke',
    title: 'Family group chat about a parent in hospital (lower case)',
    text: `[family group: "mam's care" — exported chat]

07/11/2026, 18:02 - bronagh: right just out of the hospital. mam is on ward 7b now, moved from the stroke unit this afternoon
07/11/2026, 18:03 - bronagh: consultant is a dr achebe-lindgren, lovely woman. she says it was a small stroke on the left side, they called it a lacunar infarct
07/11/2026, 18:05 - cormac: how is her speech
07/11/2026, 18:06 - bronagh: bit slurred still but she knew me and asked for you and fintan. right hand is weak, she cant hold a cup yet
07/11/2026, 18:09 - fintan mob: did they say about the blood thinners?? she was on that apixaban for the af and i dont think she was taking it. found 3 full boxes in the press at hers last week
07/11/2026, 18:11 - bronagh: yes i told them that. theyve restarted it, 5mg twice a day, and added atorvastatin 80mg at night. blood pressure was 190 over 100 when she came in
07/11/2026, 18:12 - cormac: jesus
07/11/2026, 18:15 - bronagh: they want one of us at a meeting tues 10th at 2pm with the ot and the social worker about her going home. they dont think she can manage the stairs at mount pleasant
07/11/2026, 18:16 - fintan mob: i cant tuesday im in belfast with work. cormac?
07/11/2026, 18:19 - cormac: ill go. what do they need from us
07/11/2026, 18:22 - bronagh: her details for the forms. full name is philomena mary mcgettigan, dob 2/6/1941, address 9 mount pleasant, strabane bt82 8hq. gp is dr devenney at the health centre. her h&c number is 328 114 7069
07/11/2026, 18:23 - bronagh: and they asked who has power of attorney. none of us do. she never signed it
07/11/2026, 18:25 - cormac: we need to sort that. ill ring mcsorley the solicitor monday
07/11/2026, 18:27 - fintan mob: also her pension goes into the credit union and i have the card. pin is 4471 if anyone needs to get her messages
07/11/2026, 18:28 - bronagh: fintan dont put that in the chat!!
07/11/2026, 18:31 - cormac: ward number if i need to ring?
07/11/2026, 18:33 - bronagh: 01632 960551 ask for staff nurse oluwadamilare. my mobile is dying so ring cormacs if stuck 07700 900158
07/11/2026, 18:40 - fintan mob: tell mam we love her x
`,
    gold: [
      g('PERSON', 'bronagh'),
      g('PERSON', 'cormac'),
      g('PERSON', 'fintan'),
      g('PERSON', 'philomena'),
      g('PERSON', 'mary'),
      g('PERSON', 'mcgettigan'),
      g('DOB', '2/6/1941'),
      g('ADDRESS', 'mount pleasant'),
      g('POSTCODE', 'bt82 8hq'),
      g('ID_NUMBER', '328 114 7069'),
      g('OTHER', '4471'),
      g('PHONE', '07700 900158'),
      g('PERSON', 'achebe-lindgren', 'other'),
      g('PERSON', 'devenney', 'other'),
      g('PERSON', 'mcsorley', 'other'),
      g('PERSON', 'oluwadamilare', 'other'),
    ],
    keep: [
      'lacunar infarct',
      'apixaban',
      '5mg twice a day',
      'atorvastatin 80mg',
      '190 over 100',
      'tues 10th at 2pm',
      'power of attorney',
      'stroke unit',
    ],
    medical: ['lacunar infarct', 'apixaban', '5mg twice a day', 'atorvastatin 80mg', '190 over 100'],
    medicalHigh: ['lacunar infarct', 'apixaban'],
    quasi: ['strabane', 'belfast', 'ward 7b', 'credit union'],
  },
  {
    id: 'final-landlord-deposit-texts',
    title: 'Text messages with a landlord about a deposit',
    text: `Texts with landlord (Mr Popescu) — screenshots typed up for Citizens Advice

Sat 24 Oct 2026
Me: Hi Mr Popescu, it's Ifeoma from the upstairs flat at 73B Dickenson Road. We moved out on the 16th and handed the keys to your son. When will we get the deposit back?
Popescu: Hello. I am checking flat. There is damages
Me: What damage? We cleaned everything and I have photos from the day we left.
Popescu: Carpet in bedroom is burn. Oven dirty. Also you paint the small room pink without ask
Me: The iron mark was there when we moved in, it's on the inventory you gave us in 2023. Chukwuemeka painted the box room back to white before we left.
Popescu: I get quote. £400 carpet £120 clean £250 paint. I keep £770

Mon 26 Oct 2026
Me: That's most of the £900 deposit. Which deposit scheme is it in? I never got a certificate.
Popescu: Is in my account safe. No need scheme, is private agreement
Me: The law says a deposit on an assured shorthold tenancy has to be protected within 30 days and you have to give us the prescribed information. If it wasn't, a court can order you to pay up to three times the deposit.
Popescu: You threaten me? You were late with rent in March
Me: I'm not threatening. We paid March in full on the 9th, I have the bank transfer. Please return the £900 within 14 days or I will make a claim.
Popescu: Come Saturday we talk. Bring husband
Me: I'd rather keep it in writing. You can post a cheque to our new address: 5 Fallowfield Court, Wilmslow Road, M14 6XS. Or transfer to the same account the rent came from, name I N Eze-Okoro, 20-33-18, 71140583.

Wed 4 Nov 2026
Me: Mr Popescu, 14 days is up on Monday. I've spoken to Citizens Advice and they've given me a letter before claim to send.
Popescu: My son Vasile say you can have 400. Final
Me: No. Full amount or I go to court. My number for your son if he wants to ring is 07700 900420 but I won't agree anything by phone.
`,
    gold: [
      g('PERSON', 'Ifeoma'),
      g('PERSON', 'Chukwuemeka'),
      g('PERSON', 'Eze-Okoro'),
      g('ADDRESS', '73B Dickenson Road'),
      g('ADDRESS', '5 Fallowfield Court'),
      g('POSTCODE', 'M14 6XS'),
      g('ACCOUNT', '71140583'),
      g('PHONE', '07700 900420'),
      g('PERSON', 'Popescu', 'other'),
      g('PERSON', 'Vasile', 'other'),
    ],
    keep: [
      '£900 deposit',
      'within 30 days',
      'prescribed information',
      'up to three times the deposit',
      'within 14 days',
      'letter before claim',
      'assured shorthold tenancy',
      'I keep £770',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Wilmslow Road', 'moved out on the 16th', 'the inventory you gave us in 2023'],
  },
  {
    id: 'final-note-to-carer',
    title: 'Handwritten note from a daughter to a home carer',
    text: `(note left on kitchen table — transcribed from a photo, spelling as written)

Weds night

Dear Precious,

Sorry to miss you again, I am on earlies all this week. Few things about Dad before the weekend —

1) The district nurse (Bev) came Tues and changed the dressing on his L heel. She says its a grade 2 pressure sore and he MUST have the heel boot on in bed. He takes it off. Please check at the bedtime call.

2) New tablets from Dr Ostrowski, in the blue dosset box from Friday:
   - memantine 10mg, ONE in the morning (this is instead of the donepezil which made him sick, do not give the old ones, I have put them on top of the fridge)
   - laxido 1 sachet a day in water
   - still the same: tamsulosin at night, the 2 paracetamol 4x a day
   He is NOT to have the co-codamol anymore, it made him very confused.

3) He had a fall Monday in the bathroom, no injury but he was on the floor about an hour before Wiktor next door heard him. The pendant alarm was on the bedside. Please please make sure its round his neck when you leave.

4) Eating — only wants porridge and custard. Weight was 58.4 kg at the clinic, down from 63 in the summer. Dietitian is sending the fortified drinks, 2 a day.

5) If he asks for Mum, she died in 2019 but we dont correct him now, just say Winnie is at her sisters. He settles.

6) Hospital transport is booked for the memory clinic Thurs 19 Nov, 11.40, pick up 10.30. His appointment letter and the yellow DNACPR form are in the red folder by the phone. Name on everything is Stanley Ebenezer Braithwaite-Mensah but he only answers to Stan. Date of birth 23rd Jan 1936 if they ask, hosp number is RX4-118-2096.

Key safe code has changed — now 2580. Back door sticks, lift and push.

Any worries ring me 07700 900773 or my brother Kwesi 07700 900094. Dont ring the landline he gets upset.

Thank you for everything you do for him, truly.

Abena x
`,
    gold: [
      g('PERSON', 'Stanley'),
      g('PERSON', 'Ebenezer'),
      g('PERSON', 'Braithwaite-Mensah'),
      g('PERSON', 'Stan'),
      g('PERSON', 'Winnie'),
      g('PERSON', 'Kwesi'),
      g('PERSON', 'Abena'),
      g('DOB', '23rd Jan 1936'),
      g('ID_NUMBER', 'RX4-118-2096'),
      g('OTHER', '2580'),
      g('PHONE', '07700 900773'),
      g('PHONE', '07700 900094'),
      g('PERSON', 'Precious', 'other'),
      g('PERSON', 'Bev', 'other'),
      g('PERSON', 'Ostrowski', 'other'),
      g('PERSON', 'Wiktor', 'other'),
    ],
    keep: [
      'grade 2 pressure sore',
      'memantine 10mg',
      'donepezil',
      'co-codamol',
      'tamsulosin',
      '58.4 kg',
      'laxido 1 sachet a day',
      'DNACPR',
      'Thurs 19 Nov, 11.40',
    ],
    medical: [
      'grade 2 pressure sore',
      'memantine 10mg',
      'donepezil',
      'co-codamol',
      'tamsulosin',
      '58.4 kg',
      'laxido 1 sachet a day',
      'DNACPR',
    ],
    medicalHigh: ['grade 2 pressure sore', 'memantine 10mg', 'donepezil', 'co-codamol'],
    quasi: ['memory clinic', 'she died in 2019', 'on earlies'],
  },
  {
    id: 'final-grievance-email',
    title: 'Employee grievance email to HR',
    text: `From: Gwenllian Probert
Sent: 12 November 2026 07:58
To: HR Advice <hradvice@calderbrookhousing.example>
Subject: Grievance - flexible working refusal and comments by my manager

Dear HR,

I want to raise a formal grievance under the grievance policy. I've tried to sort this out informally and got nowhere.

Background: I'm a Tenancy Sustainment Officer in the Rhondda patch team (staff number CB10447) and have worked here since April 2018. My line manager is Darren Whitlock.

1. On 14 September I made a statutory flexible working request to compress my hours into four days (Mon-Thu) because my son Macsen, who is 7 and has type 1 diabetes, has clinic and pump appointments on Fridays at the children's hospital in Cardiff. I attached the appointment schedule.

2. I heard nothing for seven weeks. On 3 November Darren refused it in a two-line Teams message saying "the business can't support it, no detail needed". There was no meeting and nothing in writing saying which of the statutory reasons applied. As I understand it the employer has to consult me before refusing and decide within two months.

3. In the team meeting on 5 November, in front of six colleagues, Darren said "some of us don't get to use our kids as an excuse for a long weekend". Ffion Maddocks and Tariq Anwar were both there and are willing to confirm what was said.

4. Since then I've been taken off the duty rota for the Treorchy office and given the furthest patch, which adds 50 minutes each way.

I believe this is a breach of the flexible working procedure and may be indirect sex discrimination and discrimination by association with a disabled person under the Equality Act 2010. I'd like:
- the request reconsidered by someone other than Darren, with a proper meeting
- an apology
- the patch change reversed

I'm a Unison member and my rep, Bethan Llywelyn-Jones, will come to any meeting with me. I'm on leave 20-24 November.

Please acknowledge this within 5 working days as the policy says. Use my personal email for anything sensitive as Darren has delegate access to my work inbox: gwen.probert@cymrupost.example, or ring 07700 900536.

Diolch,
Gwen
Gwenllian Probert
14 Ystrad Terrace, Pentre, CF41 7BN
`,
    gold: [
      g('PERSON', 'Gwenllian'),
      g('PERSON', 'Probert'),
      g('ID_NUMBER', 'CB10447'),
      g('PERSON', 'Macsen'),
      g('EMAIL', 'gwen.probert@cymrupost.example'),
      g('PHONE', '07700 900536'),
      g('ADDRESS', '14 Ystrad Terrace'),
      g('POSTCODE', 'CF41 7BN'),
      g('PERSON', 'Darren', 'other'),
      g('PERSON', 'Whitlock', 'other'),
      g('PERSON', 'Ffion', 'other'),
      g('PERSON', 'Maddocks', 'other'),
      g('PERSON', 'Tariq', 'other'),
      g('PERSON', 'Anwar', 'other'),
      g('PERSON', 'Bethan', 'other'),
      g('PERSON', 'Llywelyn-Jones', 'other'),
    ],
    keep: [
      'statutory flexible working request',
      'type 1 diabetes',
      'within two months',
      'Equality Act 2010',
      'discrimination by association',
      'indirect sex discrimination',
      'within 5 working days',
      'formal grievance',
    ],
    medical: ['type 1 diabetes'],
    medicalHigh: ['type 1 diabetes'],
    quasi: ['Tenancy Sustainment Officer', 'Rhondda', 'April 2018', 'Unison', 'Treorchy', 'Pentre'],
  },
  {
    id: 'final-camhs-referral-form',
    title: 'CAMHS referral form',
    text: `NORTH DALES CHILD AND ADOLESCENT MENTAL HEALTH SERVICE
SINGLE POINT OF ACCESS — REFERRAL FORM (v7)

SECTION A: YOUNG PERSON
Surname:            Al-Tikriti
Forename(s):        Noor
                    Fatima
Known as:           Noor
Date of birth:      19/09/2010          Age: 16
Gender:             Female
NHS number:         999 472 6038
Address:            The Old Forge, 2 Beck Side, Grassington
Postcode:           BD23 5AT
Young person's mobile:   07700 900804   (OK to text: yes / leave voicemail: NO)
School / college:   Upper Wharfedale Sixth Form
First language:     English (Arabic at home)

SECTION B: PARENT / CARER
Name:               Dr Hassan Al-Tikriti (father)      Parental responsibility: Yes
Phone:              07700 900229
Email:              h.altikriti@dalesmail.example
Second carer:       Sawsan Al-Tikriti (step-mother)
Is the family aware of the referral?   Father yes. Step-mother no, at young person's request.

SECTION C: REFERRER
Name / role:        Dr Eleanor Sowerby, GP
Practice:           Linton Bridge Surgery, Skipton
Date of referral:   10/11/2026
Urgency:            [ ] Emergency (same day)   [X] Urgent (within 7 days)   [ ] Routine

SECTION D: REASON FOR REFERRAL
16 year old seen alone and then with father. Three month history of low mood, early waking, loss of interest in netball and friends, and falling attendance (62% this term). Weight loss of about 6 kg since June; BMI now 17.4. Restricting food, says she "doesn't deserve to eat". Periods stopped two months ago.
Disclosed superficial cutting to left forearm, most recently 6 November, no sutures needed. Fleeting thoughts that she would be better off dead, no plan or intent; says her little brother Zayd is the reason she would not act.
Mother died of breast cancer in March 2025. No bereavement support taken up.
PHQ-A score 19. RCADS completed and attached.
Started fluoxetine 10 mg once daily on 10/11/2026 after telephone advice from Dr Kavanagh (CAMHS duty). Bloods and ECG requested.

SECTION E: RISK
Self-harm: yes, current.  Suicidal ideation: passive.  Safeguarding concerns: none identified.  Substance use: denies.
Safety plan agreed with young person and father; medicines locked away.

SECTION F: CONSENT
Young person consents to referral and to information sharing with school nurse (Mrs Pauline Garside) only.
`,
    gold: [
      g('PERSON', 'Al-Tikriti'),
      g('PERSON', 'Noor'),
      g('PERSON', 'Fatima'),
      g('PERSON', 'Hassan'),
      g('PERSON', 'Sawsan'),
      g('PERSON', 'Zayd'),
      g('DOB', '19/09/2010'),
      g('ID_NUMBER', '999 472 6038'),
      g('ADDRESS', 'The Old Forge'),
      g('ADDRESS', '2 Beck Side'),
      g('POSTCODE', 'BD23 5AT'),
      g('PHONE', '07700 900804'),
      g('PHONE', '07700 900229'),
      g('EMAIL', 'h.altikriti@dalesmail.example'),
      g('PERSON', 'Eleanor', 'other'),
      g('PERSON', 'Sowerby', 'other'),
      g('PERSON', 'Kavanagh', 'other'),
      g('PERSON', 'Pauline', 'other'),
      g('PERSON', 'Garside', 'other'),
    ],
    keep: [
      'fluoxetine 10 mg once daily',
      'low mood',
      'BMI now 17.4',
      'superficial cutting',
      'PHQ-A score 19',
      'Weight loss of about 6 kg',
      'no plan or intent',
      'Urgent (within 7 days)',
      'Safety plan',
    ],
    medical: [
      'fluoxetine 10 mg once daily',
      'low mood',
      'BMI now 17.4',
      'superficial cutting',
      'PHQ-A score 19',
      'Weight loss of about 6 kg',
      'no plan or intent',
    ],
    medicalHigh: ['fluoxetine 10 mg once daily', 'superficial cutting', 'BMI now 17.4'],
    quasi: ['Grassington', 'Upper Wharfedale Sixth Form', 'Linton Bridge Surgery', 'netball', 'March 2025'],
  },
  {
    id: 'final-nursing-home-mar-chart',
    title: 'Nursing home medication administration record',
    text: `MEADOWSWEET COURT NURSING HOME          MEDICATION ADMINISTRATION RECORD
Resident: Gladys Onwuachi-Pemberton     Room: 14 (Bluebell wing)     Known as: "Mrs P"
DOB: 08/12/1932      NHS: 999 380 5127      GP: Dr Farrukh Siddiqui
Allergies: TRIMETHOPRIM (rash), ELASTOPLAST       Swallow: soft diet, thickened fluids level 2
Cycle start: Mon 02/11/2026             Pharmacy: Dunmore Chemist      Sheet 1 of 2

MEDICINE / DOSE / ROUTE                  TIME    M   T   W   T   F   S   S
-------------------------------------------------------------------------------
Levothyroxine 75 micrograms tablets      07:00   RA  RA  RA  JK  JK  JK  RA
ONE in the morning, before food
-------------------------------------------------------------------------------
Bumetanide 1 mg tablets                  08:00   RA  RA  RA  JK  JK  JK  RA
ONE in the morning
-------------------------------------------------------------------------------
Edoxaban 30 mg tablets                   08:00   RA  RA  RA  JK  JK  R   RA
ONE daily
-------------------------------------------------------------------------------
Mirtazapine 15 mg tablets                21:00   TO  TO  TO  TO  SB  SB  SB
ONE at night
-------------------------------------------------------------------------------
Morphine sulfate oral solution 10mg/5ml  PRN     see CD register
2.5 ml (5 mg) up to four-hourly for pain or breathlessness
-------------------------------------------------------------------------------
Midazolam 2.5 mg subcut (anticipatory)   PRN     not yet used
-------------------------------------------------------------------------------
Codes: R = refused, A = asleep, N = nausea, H = hospital, O = other (see notes)

NOTES
Sat 07/11 08:00  Edoxaban refused, spat out. Offered again 09:30, refused. Daughter (Ngozi Pemberton, 07700 900661) informed at visit. J. Kaminski RN
Sun 08/11 14:20  Dr Siddiqui visited. Chest worse, not for hospital admission as per ReSPECT form dated 19/10/2026. Start amoxicillin 500 mg three times daily for 5 days. Family aware. Son Chidi phoning from Toronto tonight. R. Adeleke RN
Sun 08/11 22:10  Morphine 2.5 ml given for breathlessness, settled within 30 min. S. Brathwaite RN
Mon 09/11 06:45  Fluid balance: intake 480 ml in 24 hrs. Palliative care nurse Maureen Haigh to review Tues.
Funding: CHC fast track approved, ref FT/26/3318. Lasting power of attorney (health): Ngozi.
`,
    gold: [
      g('PERSON', 'Gladys'),
      g('PERSON', 'Onwuachi'),
      g('PERSON', 'Pemberton'),
      g('PERSON', 'Ngozi'),
      g('PERSON', 'Chidi'),
      g('DOB', '08/12/1932'),
      g('ID_NUMBER', '999 380 5127'),
      g('PHONE', '07700 900661'),
      g('ID_NUMBER', 'FT/26/3318'),
      g('PERSON', 'Farrukh', 'other'),
      g('PERSON', 'Siddiqui', 'other'),
      g('PERSON', 'Kaminski', 'other'),
      g('PERSON', 'Adeleke', 'other'),
      g('PERSON', 'Brathwaite', 'other'),
      g('PERSON', 'Maureen', 'other'),
      g('PERSON', 'Haigh', 'other'),
    ],
    keep: [
      'TRIMETHOPRIM',
      'Edoxaban 30 mg',
      'Levothyroxine 75 micrograms',
      'Morphine sulfate oral solution 10mg/5ml',
      'amoxicillin 500 mg three times daily for 5 days',
      'thickened fluids level 2',
      'Mirtazapine 15 mg',
      'not for hospital admission',
      'ReSPECT form',
      'CHC fast track',
    ],
    medical: [
      'TRIMETHOPRIM',
      'Edoxaban 30 mg',
      'Levothyroxine 75 micrograms',
      'Morphine sulfate oral solution 10mg/5ml',
      'amoxicillin 500 mg three times daily for 5 days',
      'thickened fluids level 2',
      'Mirtazapine 15 mg',
    ],
    medicalHigh: [
      'TRIMETHOPRIM',
      'Edoxaban 30 mg',
      'Morphine sulfate oral solution 10mg/5ml',
      'amoxicillin 500 mg three times daily for 5 days',
    ],
    quasi: ['MEADOWSWEET COURT NURSING HOME', 'Bluebell wing', 'Toronto', 'Dunmore Chemist'],
  },
  {
    id: 'final-oncology-two-page',
    title: 'Breast oncology clinic letter (two pages)',
    text: `ROYAL TAMAR HOSPITALS
Breast Oncology Service — Level 3, Mount Wise Building
Appointments 01632 960702 | Clinical nurse specialists 01632 960703

Page 1 of 2

Clinic: Thursday 5 November 2026 (joint oncology clinic)
Typed: 9 November 2026

Dr Jowita Sadowska
Stoke Damerel Health Centre
Plymouth

Dear Dr Sadowska,

Mrs Androulla CHRISTODOULOU     DOB 16.05.1969     Hospital no. T2088417     NHS no. 999 705 1183
Flat 2, 58 Seymour Avenue, Plymouth PL4 8RB

Diagnosis
Right breast invasive ductal carcinoma, grade 3, 27 mm, 2 of 14 axillary nodes positive (pT2 pN1a M0). ER positive (8/8), PR positive (6/8), HER2 negative. Oncotype DX recurrence score 31.

Treatment to date
14 August 2026: right wide local excision and axillary node clearance (Mr Okechukwu Ilori).
29 September 2026: cycle 1 of adjuvant EC chemotherapy (epirubicin and cyclophosphamide).
20 October 2026: cycle 2, complicated by neutropenic sepsis, admitted 28 October to 1 November.

Other history
Hypothyroidism. Migraine. BRCA testing: result awaited (sample sent 2 September). Her sister Eleni was treated for breast cancer at 44 in Nicosia, and her mother died of ovarian cancer.

Current medication
Levothyroxine 100 micrograms daily, ondansetron 8 mg twice daily for three days after chemotherapy, dexamethasone as per chemotherapy protocol, filgrastim 300 micrograms subcutaneously daily for 7 days from day 3 of each cycle (new), lansoprazole 30 mg daily.
Allergy: metoclopramide (oculogyric crisis, 2011).

I saw Mrs Christodoulou today with her husband, Stelios, and their daughter Despina, who interpreted some of the discussion. She has recovered well from her admission. Her temperature at home peaked at 38.9 on day 8 of cycle 2 and she rang the helpline promptly, for which I congratulated her. Blood cultures grew E. coli sensitive to the piperacillin-tazobactam she received. She completed oral co-amoxiclav on 4 November.

She is understandably frightened of a repeat. Her main symptoms now are fatigue, a sore mouth, and tingling in her fingertips which is mild and does not affect function. She has lost her hair and has a wig voucher. She is not sleeping and became tearful when describing the admission; she scored 15 on the PHQ-9 completed with our specialist nurse.

On examination she looked well. Weight 61.2 kg (64.0 kg at cycle 1). The wound is healed with a small seroma that does not need draining. Chest clear. No lymphoedema.

Bloods today: haemoglobin 104, white cells 5.1, neutrophils 2.9, platelets 312. Liver and kidney function normal.

Page 2 of 2          Mrs A. Christodoulou     T2088417

Plan
1. Proceed to cycle 3 of EC on Tuesday 10 November 2026 with a 20% dose reduction and primary G-CSF prophylaxis (filgrastim as above). The chemotherapy day unit will teach Stelios to give the injections.
2. After 4 cycles of EC she will switch to weekly paclitaxel for 12 weeks, starting on or around 8 December.
3. Radiotherapy to the right breast and supraclavicular fossa will follow chemotherapy: 40 Gy in 15 fractions over three weeks. Dr Bhattacharjee will see her for planning in February.
4. Endocrine treatment: as she is premenopausal (last period July 2026) we discussed ovarian suppression with goserelin plus an aromatase inhibitor for at least 5 years, starting after radiotherapy. Written information given.
5. Bisphosphonate: zoledronic acid every 6 months for 3 years once ovarian suppression is established. She will need a dental check first. I would be grateful if you could remind her to see her dentist.
6. Genetics: if the BRCA result is positive we will discuss risk-reducing surgery, and her daughters Despina (24) and Xenia (19) would be offered testing.
7. Mood and sleep: referred to our psycho-oncology service. Please would you consider a short course of zopiclone 3.75 mg at night; I have not prescribed it. I would avoid St John's wort.
8. Work: she is a self-employed dressmaker with a shop on Ebrington Street and has not worked since August. I have given her a fit note until 28 February 2027, and our Macmillan benefits adviser, Sharon Polkinghorne, will help with an Employment and Support Allowance claim.

Advice given to the patient
Ring the 24-hour chemotherapy helpline on 01632 960799 immediately if her temperature is 37.5 or above, or below 36, or if she feels unwell, and do not wait for the morning. Do not take paracetamol before checking her temperature.

I will see her before cycle 4 on 1 December 2026.

Yours sincerely,

Dr Rhiannon Maddern-Yeo
Consultant Medical Oncologist
Secretary: Lowenna Chegwidden, lowenna.chegwidden@royaltamar.example

Copy to: Mrs A. Christodoulou; Mr O. Ilori, Consultant Surgeon
Patient's preferred contact: 07700 900318 (mobile), stelios.and.roulla@homebox.example
`,
    gold: [
      g('PERSON', 'Androulla'),
      g('PERSON', 'CHRISTODOULOU'),
      g('PERSON', 'Christodoulou'),
      g('PERSON', 'Eleni'),
      g('PERSON', 'Stelios'),
      g('PERSON', 'Despina'),
      g('PERSON', 'Xenia'),
      g('DOB', '16.05.1969'),
      g('ID_NUMBER', 'T2088417'),
      g('ID_NUMBER', '999 705 1183'),
      g('ADDRESS', '58 Seymour Avenue'),
      g('POSTCODE', 'PL4 8RB'),
      g('PHONE', '07700 900318'),
      g('EMAIL', 'stelios.and.roulla@homebox.example'),
      g('PERSON', 'Jowita', 'other'),
      g('PERSON', 'Sadowska', 'other'),
      g('PERSON', 'Okechukwu', 'other'),
      g('PERSON', 'Ilori', 'other'),
      g('PERSON', 'Bhattacharjee', 'other'),
      g('PERSON', 'Sharon', 'other'),
      g('PERSON', 'Polkinghorne', 'other'),
      g('PERSON', 'Rhiannon', 'other'),
      g('PERSON', 'Maddern-Yeo', 'other'),
      g('PERSON', 'Lowenna', 'other'),
      g('PERSON', 'Chegwidden', 'other'),
      g('EMAIL', 'lowenna.chegwidden@royaltamar.example', 'other'),
    ],
    keep: [
      'invasive ductal carcinoma',
      'neutropenic sepsis',
      'metoclopramide',
      'filgrastim 300 micrograms',
      '20% dose reduction',
      '40 Gy in 15 fractions',
      'weekly paclitaxel for 12 weeks',
      'temperature is 37.5 or above',
      'zopiclone 3.75 mg',
      'Tuesday 10 November 2026',
    ],
    medical: [
      'invasive ductal carcinoma',
      'neutropenic sepsis',
      'metoclopramide',
      'filgrastim 300 micrograms',
      '20% dose reduction',
      '40 Gy in 15 fractions',
      'weekly paclitaxel for 12 weeks',
      'temperature is 37.5 or above',
      'zopiclone 3.75 mg',
    ],
    medicalHigh: ['invasive ductal carcinoma', 'neutropenic sepsis', 'metoclopramide', '20% dose reduction'],
    quasi: ['Plymouth', 'self-employed dressmaker', 'Ebrington Street', 'Nicosia', 'Stoke Damerel Health Centre'],
  },
  {
    id: 'final-tribunal-two-page',
    title: 'Solicitor letter after an employment tribunal preliminary hearing (two pages)',
    text: `Fennimore Aldous Solicitors LLP
Employment Team
4th Floor, Granary Wharf House, Leeds

Page 1 of 2

Our ref: EMP/DIM/118204-3            Your ref: none
Date: 10 November 2026

PRIVATE AND CONFIDENTIAL
Ms Maria Corazon Dimaculangan
38 Beechwood Mount
Leeds
LS4 2NB

By post and by email to cora.dimaculangan@pinoymail.example

Dear Cora,

Dimaculangan v Harrowgate Lodge Care Ltd — Employment Tribunal case number 1804417/2026

I am writing following the preliminary hearing by telephone on 6 November 2026 before Employment Judge Whitaker. I enclose the case management order. Please read it with this letter and keep both safe.

1. Your claims
The Judge recorded that your claims are:
(a) unfair dismissal (you were employed as a senior care assistant from 11 February 2019 until you were dismissed on 22 May 2026);
(b) direct race discrimination and harassment related to race, about the comments made by the deputy manager, Mrs Lorraine Tuffnell, between January and May 2026, including the remark on 3 April that "you people always stick together";
(c) unlawful deduction from wages of £1,184.60 (unpaid sleep-in shifts and accrued holiday); and
(d) breach of contract (notice pay).
The respondent says you were dismissed fairly for gross misconduct, namely a medication error on 9 May 2026 involving resident "Mr K". It denies the discrimination.

2. Time limits
The respondent argued that the complaints about events before 8 March 2026 are out of time. The Judge did not decide this. It will be decided at the final hearing, where we will say the comments were conduct extending over a period, or alternatively that it is just and equitable to extend time. Your ACAS early conciliation certificate (R204417/26/88) covers 7 June to 5 July 2026 and the claim was presented on 28 July 2026, which is in time for the dismissal.

3. What you must do, and by when
- By 24 November 2026: send me your schedule of loss. I have started this from your payslips. I need to know your earnings from the agency (Calder Nursing Bank) since August and details of the jobs you have applied for. Please also send your Universal Credit statements.
- By 15 December 2026: disclosure. Both sides must send each other all relevant documents, whether they help or harm their case. This includes your WhatsApp messages with your colleague Jocelyn Abad and your handwritten diary. Do not delete anything.
- By 26 January 2027: the respondent prepares the hearing bundle.
- By 16 February 2027: exchange of witness statements. Yours will be the main one and I will draft it with you. Your husband Reynaldo can give a short statement about the effect on your health. Jocelyn has agreed to be a witness; Dr Anand's letter about your anxiety and the sertraline prescription will go in the bundle.

Page 2 of 2          Ms M C Dimaculangan     EMP/DIM/118204-3

4. The final hearing
The final hearing is listed for 4 days, 15 to 18 March 2027, in person at the Leeds Employment Tribunal, starting at 10.00am. You must attend every day. The Tribunal will arrange a Tagalog interpreter for your evidence, as we asked.

5. Judicial mediation
The Judge asked both sides whether they would consider judicial mediation. The respondent's representative, Mr Piers Hathersage of Lockton Vane, said he would take instructions. I recommend that we agree. It is free, confidential, and does not stop the case if it fails.

6. Value of the claim and settlement
On present information I estimate:
Basic award                                   £3,675
Compensatory award (loss of earnings)         £9,000 to £14,000
Injury to feelings (lower to middle Vento band)   £6,000 to £15,000
Wages and notice pay                          £3,290
These are estimates, not promises, and the Tribunal can reduce awards. Through ACAS the respondent has offered £4,000 with an agreed reference. My advice is that this is too low and you should not accept it, but it is your decision. Please tell me by 20 November whether you want me to make a counter-offer, and at what figure.

7. Costs
You are funded by the legal expenses cover on your home insurance (Wrenfield Insurance, policy HH-2209-771845). The insurer has authorised costs up to the end of disclosure. I will need their authority again before witness statements. You will not be asked to pay anything yourself unless you reject an offer the insurer considers reasonable.

8. Two warnings
Please do not contact Mrs Tuffnell or any current staff about the case, and please do not post about it on Facebook. The respondent's solicitors are watching.

I know this has been a hard year, especially with your mother's illness in Batangas. If anything in this letter is unclear, ring me on my direct line, 0113 496 0172, or ask Reynaldo to call if that is easier during your shifts. The number I have for you is 07700 900455.

Yours sincerely,

Oluwakemi Brightman
Senior Solicitor
oluwakemi.brightman@fennimorealdous.example
`,
    gold: [
      g('PERSON', 'Maria'),
      g('PERSON', 'Corazon'),
      g('PERSON', 'Dimaculangan'),
      g('PERSON', 'Reynaldo'),
      g('ADDRESS', '38 Beechwood Mount'),
      g('POSTCODE', 'LS4 2NB'),
      g('EMAIL', 'cora.dimaculangan@pinoymail.example'),
      g('ID_NUMBER', 'EMP/DIM/118204-3'),
      g('ID_NUMBER', '1804417/2026'),
      g('ID_NUMBER', 'R204417/26/88'),
      g('ID_NUMBER', 'HH-2209-771845'),
      g('PHONE', '07700 900455'),
      g('PERSON', 'Whitaker', 'other'),
      g('PERSON', 'Lorraine', 'other'),
      g('PERSON', 'Tuffnell', 'other'),
      g('PERSON', 'Jocelyn', 'other'),
      g('PERSON', 'Abad', 'other'),
      g('PERSON', 'Anand', 'other'),
      g('PERSON', 'Piers', 'other'),
      g('PERSON', 'Hathersage', 'other'),
      g('PERSON', 'Oluwakemi', 'other'),
      g('PERSON', 'Brightman', 'other'),
      g('EMAIL', 'oluwakemi.brightman@fennimorealdous.example', 'other'),
      g('PHONE', '0113 496 0172', 'other'),
    ],
    keep: [
      'unfair dismissal',
      'direct race discrimination',
      '£1,184.60',
      '24 November 2026',
      '15 December 2026',
      '16 February 2027',
      '15 to 18 March 2027',
      'judicial mediation',
      'offered £4,000',
      'schedule of loss',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['senior care assistant', 'Leeds', 'Harrowgate Lodge Care Ltd', 'Batangas', 'Calder Nursing Bank', '22 May 2026'],
  },
  {
    id: 'final-antenatal-booking',
    title: 'Antenatal booking summary',
    text: `Fenland Maternity Hub — Community Midwifery
ANTENATAL BOOKING SUMMARY (copy for hand-held notes)

Booking date: 4 Nov 2026          Midwife: Chanelle Osei-Bonsu (Poppy Team)
Gestation at booking: 9+4         EDD by dates: 4 June 2027

Name:   Rūta
        Kazlauskaitė-Hobbs                    Preferred name: Ruta
Born:   28/02/1991   (35)                    NHS: 999 846 2291
Lives:  Plot 17, Willow Fen Park, Station Drove, Wisbech PE13 2QY
Tel:    07700 900592                         Interpreter: no (Lithuanian / English)
Partner: Daniel Hobbs, lorry driver, 07700 900117
Next of kin if partner away: mother, Vilma Kazlauskienė (lives with them, limited English)

OBSTETRIC HISTORY   G3 P1+1
2021  Girl, Emilija, 38 weeks, emergency caesarean for fetal distress, 2,940 g. Postpartum haemorrhage 1.2 L.
2024  Miscarriage at 10 weeks, managed medically.

MEDICAL
Epilepsy since age 14, last seizure March 2023. Takes lamotrigine 150 mg twice daily. Under Dr Papageorgiou (neurology), not seen since 2024.
BMI 33.1. Non-smoker. No alcohol. Rhesus negative (from 2021 notes).
Mental health: postnatal depression 2021, treated with sertraline, stopped 2022. Whooley questions today: positive x1.

PLAN AGREED TODAY
- Consultant-led care. Referred to obstetric medicine clinic (epilepsy), appointment requested within 2 weeks.
- Folic acid 5 mg daily (high dose because of lamotrigine): prescription requested from GP today. She has been taking 400 micrograms.
- Do NOT stop lamotrigine. Levels may fall in pregnancy; neurology to advise on dose.
- Aspirin 150 mg at night from 12 weeks (risk factors: BMI, previous PPH noted).
- Glucose tolerance test at 26 weeks.
- Anti-D at 28 weeks.
- Dating scan: Tues 24 Nov 2026, 09:40, Rosewell Unit.
- Birth options (VBAC or planned caesarean) clinic at 20 weeks.
- Safety advice given: showers not baths, not to bathe Emilija alone, partner away Mon-Thu.
- Perinatal mental health team referral offered: wants to think about it.

Safeguarding: no concerns. Routine enquiry completed (seen alone).
Maternity Exemption certificate applied for. Healthy Start: eligible, form given.
Bloods taken: FBC, group and antibodies, HIV, hepatitis B, syphilis, HbA1c, lamotrigine level.

Chanelle's work mobile (Mon-Fri 9-5): 07700 900640. Triage 24 hrs: 01632 960385.
`,
    gold: [
      g('PERSON', 'Rūta'),
      g('PERSON', 'Ruta'),
      g('PERSON', 'Kazlauskaitė'),
      g('PERSON', 'Hobbs'),
      g('PERSON', 'Daniel'),
      g('PERSON', 'Vilma'),
      g('PERSON', 'Kazlauskienė'),
      g('PERSON', 'Emilija'),
      g('DOB', '28/02/1991'),
      g('ID_NUMBER', '999 846 2291'),
      g('ADDRESS', 'Willow Fen Park'),
      g('ADDRESS', 'Station Drove'),
      g('POSTCODE', 'PE13 2QY'),
      g('PHONE', '07700 900592'),
      g('PHONE', '07700 900117'),
      g('PERSON', 'Chanelle', 'other'),
      g('PERSON', 'Osei-Bonsu', 'other'),
      g('PERSON', 'Papageorgiou', 'other'),
      g('PHONE', '07700 900640', 'other'),
    ],
    keep: [
      'Epilepsy',
      'lamotrigine 150 mg twice daily',
      'Folic acid 5 mg daily',
      'Aspirin 150 mg',
      'Do NOT stop lamotrigine',
      'Rhesus negative',
      'Glucose tolerance test at 26 weeks',
      'Anti-D at 28 weeks',
      'Tues 24 Nov 2026, 09:40',
      'Consultant-led care',
    ],
    medical: [
      'Epilepsy',
      'lamotrigine 150 mg twice daily',
      'Folic acid 5 mg daily',
      'Aspirin 150 mg',
      'Do NOT stop lamotrigine',
      'Rhesus negative',
      'Glucose tolerance test at 26 weeks',
      'Anti-D at 28 weeks',
    ],
    medicalHigh: ['Epilepsy', 'lamotrigine 150 mg twice daily', 'Folic acid 5 mg daily', 'Do NOT stop lamotrigine'],
    quasi: ['Wisbech', 'lorry driver', 'EDD by dates: 4 June 2027', 'Lithuanian'],
  },
  {
    id: 'final-emergency-department-note',
    title: 'Emergency department discharge note',
    text: `EMERGENCY DEPARTMENT — PATIENT COPY / GP LETTER
Kingsmere District Hospital

Pt: MOHAMUD, Abdirahman Y.        M   41y        ED no: ED26-118804
DoB 01/01/1985                    NHS 999 153 6674
Addr: 22 Stapleton Rd, Flat 1, Easton BS5 0QX        Tel: 07700 900480
GP: Dr S. Honeyball, Lawrence Hill HC
Arr: 08/11/26 23:14 (walk-in, with cousin)     Triage cat: 3     D/C: 09/11/26 03:50

PC: R hand injury. Punched wall ~21:00 after argument. Dominant hand. Works as a chef.

O/E: swelling + tenderness over 5th metacarpal neck, R. No rotational deformity. Skin intact, no fight bite. NV intact. Smells of alcohol, co-operative, GCS 15.
Also c/o low mood x 2/12 since asylum appeal refused; poor sleep; not eating. Denies thoughts of self harm tonight. Lives in shared house, cousin (Mr Sharmarke Mohamud) supportive.

Ix: XR R hand: minimally displaced # neck of 5th metacarpal (boxer's fracture), angulation approx 25 degrees.

Rx in dept: neighbour strapping 4th/5th fingers, high arm sling. Paracetamol 1 g + ibuprofen 400 mg PO. Tetanus up to date.

DISCHARGE PLAN
1. Virtual fracture clinic will phone within 72 hrs on the number above. If no call by Thurs 12/11 ring 0117 496 0138.
2. Keep strapping on 3 weeks. Elevate. No lifting / knife work. Fit note given: not fit for work 2 weeks.
3. Analgesia: paracetamol 1 g four times a day; ibuprofen 400 mg three times a day with food, max 5 days.
4. Return if: fingers numb/blue, increasing pain, finger crossing over the others when making a fist.
5. Mental health: seen by psychiatric liaison nurse (N. Castellanos) 02:30. No acute risk. Self-referral details for Talking Therapies given + number for Somali-speaking wellbeing worker at the Kaaha Project. GP pls review mood in 1-2 weeks.
6. Pt is not registered for free prescriptions; HC2 form given. Home Office ref on his ARC card for the HC2: K1408827.

Seen by: Dr Priyamvada Rao (ST3 EM)        Interpreter: not required
`,
    gold: [
      g('PERSON', 'MOHAMUD'),
      g('PERSON', 'Mohamud'),
      g('PERSON', 'Abdirahman'),
      g('PERSON', 'Sharmarke'),
      g('ID_NUMBER', 'ED26-118804'),
      g('DOB', '01/01/1985'),
      g('ID_NUMBER', '999 153 6674'),
      g('ADDRESS', '22 Stapleton Rd'),
      g('POSTCODE', 'BS5 0QX'),
      g('PHONE', '07700 900480'),
      g('ID_NUMBER', 'K1408827'),
      g('PERSON', 'Honeyball', 'other'),
      g('PERSON', 'Castellanos', 'other'),
      g('PERSON', 'Priyamvada', 'other'),
      g('PERSON', 'Rao', 'other'),
    ],
    keep: [
      "boxer's fracture",
      '5th metacarpal',
      'paracetamol 1 g four times a day',
      'ibuprofen 400 mg three times a day',
      'Keep strapping on 3 weeks',
      'low mood',
      'within 72 hrs',
      'not fit for work 2 weeks',
      'Talking Therapies',
    ],
    medical: [
      "boxer's fracture",
      '5th metacarpal',
      'paracetamol 1 g four times a day',
      'ibuprofen 400 mg three times a day',
      'Keep strapping on 3 weeks',
      'low mood',
    ],
    medicalHigh: ["boxer's fracture", 'ibuprofen 400 mg three times a day', 'low mood'],
    quasi: ['chef', 'Easton', 'asylum appeal refused', 'Lawrence Hill HC', 'shared house'],
  },
  {
    id: 'final-mental-health-care-plan',
    title: 'Community mental health care plan and crisis plan',
    text: `SEVERNSIDE PARTNERSHIP NHS TRUST
Community Mental Health Team (East) — CARE PLAN AND CRISIS PLAN

Service user: Jaswinder Singh BHOGAL ("Jas")         Trust ID: SP-4471-0926
D.O.B: 4th October 1979                              NHS: 999 067 3348
Address: 120 Soho Hill Gardens, Handsworth, Birmingham B19 1HT
Phone: 07700 900862 (prefers text)
Care co-ordinator: Abigail Nkemelu, CPN              Consultant: Dr T. Wojcik
Plan written: 2 November 2026                        Review due: 2 February 2027
MHA status: informal. Previously detained under section 2 (June 2025).

MY DIAGNOSIS
Bipolar affective disorder, type 1. Most recent episode: manic, with psychotic symptoms (admitted Oakfield Ward 9 June to 21 July 2025).

MY MEDICINES
Lithium carbonate (Priadel) 800 mg at night. Last level 0.71 mmol/L on 20 October 2026. Levels every 3 months; kidney and thyroid bloods every 6 months.
Olanzapine 10 mg at night.
Zopiclone 7.5 mg, up to 3 nights only, if I sleep under 4 hours two nights running (held by my wife).
I must not take ibuprofen or other anti-inflammatories with lithium. I should drink plenty in hot weather and when fasting.

MY EARLY WARNING SIGNS (agreed with Jas and Parminder)
- Sleeping less than 5 hours and not feeling tired
- Spending: last time I put a £9,000 deposit on a van
- Talking fast, starting many projects, texting people at night
- Stopping lithium because "I feel fine"

WHAT HELPS
Routine at the gurdwara (langar volunteering Tues and Sat). Walking with my brother-in-law Balbir. Parminder holding the credit card. Not working nights: my employer, Tyseley Castings, has agreed day shifts only until the review.

CRISIS PLAN
Step 1: Tell Parminder or ring Abigail on 0121 496 0159 (Mon-Fri 9-5).
Step 2: Out of hours ring the crisis line 0800 496 0911 (24 hrs).
Step 3: If I am at risk or will not engage, Parminder can ask for a Mental Health Act assessment through the crisis line. I agree to this while I am well.
I do NOT want to be admitted to Oakfield Ward again if there is any alternative; I would accept the home treatment team.
I want my children (Simran, 15 and Harjot, 11) to stay with my sister Kuldip in Smethwick if I am admitted, not to visit the ward.

ADVANCE STATEMENT
If I am unwell I may refuse medication. Haloperidol gave me severe stiffness in 2025; please use olanzapine or aripiprazole.

DRIVING
DVLA notified July 2025. Licence returned on 14 August 2026 after 3 months stable. Group 1 only.

Signed: J S Bhogal        Carer: P K Bhogal        Co-ordinator: A Nkemelu
`,
    gold: [
      g('PERSON', 'Jaswinder'),
      g('PERSON', 'Singh'),
      g('PERSON', 'BHOGAL'),
      g('PERSON', 'Bhogal'),
      g('PERSON', 'Parminder'),
      g('PERSON', 'Balbir'),
      g('PERSON', 'Simran'),
      g('PERSON', 'Harjot'),
      g('PERSON', 'Kuldip'),
      g('ID_NUMBER', 'SP-4471-0926'),
      g('DOB', '4th October 1979'),
      g('ID_NUMBER', '999 067 3348'),
      g('ADDRESS', '120 Soho Hill Gardens'),
      g('POSTCODE', 'B19 1HT'),
      g('PHONE', '07700 900862'),
      g('PERSON', 'Abigail', 'other'),
      g('PERSON', 'Nkemelu', 'other'),
      g('PERSON', 'Wojcik', 'other'),
      g('PHONE', '0121 496 0159', 'other'),
    ],
    keep: [
      'Bipolar affective disorder',
      'Lithium carbonate (Priadel) 800 mg',
      '0.71 mmol/L',
      'Olanzapine 10 mg',
      'Zopiclone 7.5 mg',
      'must not take ibuprofen',
      'Haloperidol',
      'Mental Health Act assessment',
      'home treatment team',
      'Review due: 2 February 2027',
    ],
    medical: [
      'Bipolar affective disorder',
      'Lithium carbonate (Priadel) 800 mg',
      '0.71 mmol/L',
      'Olanzapine 10 mg',
      'Zopiclone 7.5 mg',
      'must not take ibuprofen',
      'Haloperidol',
    ],
    medicalHigh: ['Bipolar affective disorder', 'Lithium carbonate (Priadel) 800 mg', 'must not take ibuprofen', 'Haloperidol'],
    quasi: ['Handsworth', 'Birmingham', 'Tyseley Castings', 'gurdwara', 'Oakfield Ward', 'Smethwick'],
  },
  {
    id: 'final-dental-treatment-plan',
    title: 'Dental treatment plan and estimate',
    text: `Castle Quarter Dental Practice
3 Postern Gate, Shrewsbury
reception@castlequarterdental.example

TREATMENT PLAN AND ESTIMATE (FP17DC)                    Date: 11/11/2026

Patient: Mr Lorenzo D'Amico-Fletcher        Patient ID: 30771
Date of birth: 26 July 1962
Address: Wren Cottage, 6 Coton Hill, Shrewsbury SY1 2DP
Dentist: Dr Dorota Malinowska BDS

Dear Mr D'Amico-Fletcher,

Thank you for attending on 9 November. This is what I found and what I recommend.

Findings
- Upper right first molar (UR6): large failed amalgam filling with decay underneath and a crack. Tender to bite.
- Lower left 6 and 7: generalised gum disease (periodontitis, stage III grade B), pockets up to 7 mm, bleeding.
- X-ray shows an area of infection at the root of UR6.
- Dry mouth, probably from your amitriptyline.
You told me you take alendronic acid weekly for osteoporosis (since 2020) and rivaroxaban 20 mg daily. Both matter for extractions: rivaroxaban affects bleeding, and alendronic acid carries a small risk of poor bone healing (MRONJ).

Options for UR6
A. Root canal treatment then a crown. Best chance of keeping the tooth; avoids an extraction.
B. Extraction. We would ask you to delay your morning rivaroxaban until 4 hours after the extraction, and not stop it.
C. No treatment: likely abscess.
You chose option A.

NHS treatment (Band 3): £326.70
Includes examination, X-rays, root canal treatment, crown (metal), and gum treatment by the hygienist over two visits.

Private options discussed (not included above)
Tooth-coloured ceramic crown: £640
Root canal by specialist endodontist (Dr Fintan Quirke, by referral): £795

Appointments
Mon 23 Nov 2026 2.10pm — root canal stage 1 (60 min)
Mon 7 Dec 2026 2.10pm — root canal stage 2
Thu 17 Dec 2026 9.00am — hygienist (Bronwen)

Antibiotics are not needed at present. If your face swells or you have a temperature, ring us the same day or NHS 111 out of hours.

Payment: £100 was taken today on the card ending 9034; balance £226.70 due at stage 2. As you receive Pension Credit Guarantee Credit you may be entitled to free treatment; please bring your award letter and we will refund you.

Signed (patient): L D'Amico-Fletcher       Mobile on file: 07700 900275
`,
    gold: [
      g('PERSON', 'Lorenzo'),
      g('PERSON', "D'Amico"),
      g('PERSON', 'Fletcher'),
      g('ID_NUMBER', '30771'),
      g('DOB', '26 July 1962'),
      g('ADDRESS', 'Wren Cottage'),
      g('ADDRESS', '6 Coton Hill'),
      g('POSTCODE', 'SY1 2DP'),
      g('PHONE', '07700 900275'),
      g('PERSON', 'Dorota', 'other'),
      g('PERSON', 'Malinowska', 'other'),
      g('PERSON', 'Fintan', 'other'),
      g('PERSON', 'Quirke', 'other'),
      g('PERSON', 'Bronwen', 'other'),
    ],
    keep: [
      'periodontitis',
      'Root canal treatment then a crown',
      'rivaroxaban 20 mg daily',
      'alendronic acid',
      'MRONJ',
      'amitriptyline',
      'Band 3',
      '£326.70',
      'Mon 23 Nov 2026 2.10pm',
      'Pension Credit Guarantee Credit',
    ],
    medical: [
      'periodontitis',
      'Root canal treatment then a crown',
      'rivaroxaban 20 mg daily',
      'alendronic acid',
      'MRONJ',
      'amitriptyline',
    ],
    medicalHigh: ['periodontitis', 'rivaroxaban 20 mg daily', 'alendronic acid'],
    quasi: ['Shrewsbury', 'Castle Quarter Dental Practice', 'osteoporosis'],
  },
  {
    id: 'final-universal-credit-journal',
    title: 'Universal Credit journal messages',
    text: `Universal Credit — Journal (printed from online account)
Claimant: Kwabena Ofori-Atta          Claim started: 19 August 2026

--- 2 Nov 2026 09:14  Message from you ---
Hello. My payment on 26 October was £391.20 not £1,021.55 like September. Nobody told me why. I cannot pay my rent this month. Please can someone explain. Kwabena

--- 3 Nov 2026 15:40  Message from your work coach (Deepika) ---
Hi Kwabena, thanks for your message. I can see three changes on your October statement:
1) Earnings: your employer Halvorsen Facilities reported take-home pay of £1,108.40 on 9 October and another £1,094.00 on 23 October. Because two paydays fell in one assessment period (19 Sept to 18 Oct), we counted both. You have no work allowance, so 55p of every £1 was taken off.
2) Advance repayment: £38.25 for your new claim advance.
3) A deduction of £30.90 for rent arrears requested by your landlord, Thamesreach Homes.
Your housing element (£612.00) has not changed.

--- 3 Nov 2026 16:02  Message from you ---
I am paid 4 weekly not twice a month. That was not extra money. And I did not agree to the landlord taking money. I have my daughter Akosua 3 nights a week and now I have £40 to last to the 26th.

--- 4 Nov 2026 10:21  Message from your work coach (Deepika) ---
I understand. With 4-weekly pay, one assessment period a year will have two paydays. Your next payment should go back up. Things you can do now:
- Ask for the advance repayments to be paused for up to 3 months: I have sent that request to the case manager.
- Ask for the third-party deduction to be reviewed. You can also speak to your landlord.
- Ask the council for a Discretionary Housing Payment. Southwark's form is online.
- If you think the decision is wrong, you can ask for a mandatory reconsideration within one month of the statement date.
I have booked you a phone appointment with me for Friday 6 November at 11.30am on 07700 900731. Is that still your number?

--- 4 Nov 2026 10:40  Message from you ---
Yes same number. Also you still have my old address. I moved in September, it is now Flat 9, Hartington House, 44 Lorrimore Road SE17 3LZ. Tenancy ref THR/0090417. My NI is NB 74 20 61 C if you need it for the council.

--- 4 Nov 2026 13:05  Message from your case manager (Yetunde A.) ---
Advance repayments paused until the payment due 26 January 2027. Address change noted: we need a copy of your tenancy agreement uploaded by 18 November or your housing element may stop.
`,
    gold: [
      g('PERSON', 'Kwabena'),
      g('PERSON', 'Ofori-Atta'),
      g('PERSON', 'Akosua'),
      g('PHONE', '07700 900731'),
      g('ADDRESS', 'Hartington House'),
      g('ADDRESS', '44 Lorrimore Road'),
      g('POSTCODE', 'SE17 3LZ'),
      g('ID_NUMBER', 'THR/0090417'),
      g('ID_NUMBER', 'NB 74 20 61 C'),
      g('PERSON', 'Deepika', 'other'),
      g('PERSON', 'Yetunde', 'other'),
    ],
    keep: [
      '£391.20',
      '55p of every £1',
      'two paydays fell in one assessment period',
      'Discretionary Housing Payment',
      'mandatory reconsideration',
      'within one month',
      'Friday 6 November at 11.30am',
      'paused until the payment due 26 January 2027',
      '18 November',
      'housing element',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Halvorsen Facilities', 'Thamesreach Homes', 'Southwark', '19 August 2026'],
  },
  {
    id: 'final-notice-of-enforcement',
    title: 'Enforcement agent notice for council tax debt',
    text: `NOTICE OF ENFORCEMENT
Taking Control of Goods Regulations 2013

Marchbank Enforcement Services
Enforcement agent ref: MES/4/7710926                     Date of notice: 3 November 2026

Debtor: Mr Tadeusz Wojciechowski (also known as Ted Wojo)
Address: 15 Flaxmill Lane, Boston, Lincolnshire PE21 8SG
Creditor: East Fenland Borough Council
Debt: Council Tax liability orders 2024/25 and 2025/26
Liability order numbers: LO/24/118733 and LO/25/009218

Sum outstanding
Debt                           £1,912.44
Compliance stage fee              £75.00
Total                          £1,987.44

You must pay or agree a payment arrangement by 12 noon on Wednesday 18 November 2026.

If you do not, an enforcement agent will visit your home. An enforcement stage fee of £235 (plus 7.5% of the debt above £1,500) will be added, and the agent may take control of your goods, including any vehicle, and sell them. Our records show a vehicle at the address: Vauxhall Vivaro, YD64 KPN.

Goods that cannot be taken include tools of your trade up to £1,350 in value and basic household items.

If you are vulnerable
Tell us straight away if you or anyone in your household is seriously ill, disabled, pregnant, recently bereaved, or if English is not your first language. We note from the council that Mrs Halina Wojciechowska at the address receives Attendance Allowance.

How to pay or contact us
Phone 0330 496 0181, 8am to 8pm. Quote the reference above.
We tried to reach you on 07700 900029 on 27 and 29 October.

Free debt advice: Citizens Advice, StepChange, National Debtline.

Signed: C. Appleyard, certificated enforcement agent (certificate issued by the County Court at Lincoln)
`,
    gold: [
      g('PERSON', 'Tadeusz'),
      g('PERSON', 'Wojciechowski'),
      g('PERSON', 'Ted'),
      g('PERSON', 'Wojo'),
      g('PERSON', 'Halina'),
      g('PERSON', 'Wojciechowska'),
      g('ID_NUMBER', 'MES/4/7710926'),
      g('ADDRESS', '15 Flaxmill Lane'),
      g('POSTCODE', 'PE21 8SG'),
      g('ID_NUMBER', 'LO/24/118733'),
      g('ID_NUMBER', 'LO/25/009218'),
      g('ID_NUMBER', 'YD64 KPN'),
      g('PHONE', '07700 900029'),
      g('PERSON', 'Appleyard', 'other'),
    ],
    keep: [
      '£1,987.44',
      '12 noon on Wednesday 18 November 2026',
      'enforcement stage fee of £235',
      'take control of your goods',
      'tools of your trade up to £1,350',
      'Compliance stage fee',
      'liability orders',
      'Attendance Allowance',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Boston', 'Lincolnshire', 'East Fenland Borough Council', 'Vauxhall Vivaro'],
  },
  {
    id: 'final-student-finance-overpayment',
    title: 'Student finance overpayment letter',
    text: `Student Finance Wales / Cyllid Myfyrwyr Cymru

Customer Reference Number: 4417 2093 618
Date: 30 October 2026

Miss Lok Yiu Cheung
Room B214, Senghennydd Court
Salisbury Road
Cardiff
CF24 4DS

Dear Miss Cheung,

Overpayment of Maintenance Loan and Welsh Government Learning Grant, academic year 2025/26

Our records show that you withdrew from your course, BSc Optometry (year 2) at Cardiff Metropolitan College of Vision Science, on 16 February 2026. Your university told us on 2 October 2026.

Because you left during term 2, you were only entitled to support up to that date. You were paid more than you were entitled to.

What you were paid in 2025/26               £9,850.00
What you were entitled to                   £5,718.00
Overpayment                                 £4,132.00
of which grant                              £1,240.00
of which loan                               £2,892.00

What happens now
The grant overpayment of £1,240.00 must be repaid now. It is not part of your normal student loan repayments. Please pay within 30 days or contact us to agree a repayment plan based on your income.
The loan overpayment of £2,892.00 will be added to your loan balance and repaid through your salary once you earn over the repayment threshold, unless you return to study, in which case we will take it from your next entitlement.

If you left because of illness or other compelling personal reasons
You may be able to keep some of the support and get an extra year of funding in future. Your message of 9 October says you left after a diagnosis of Crohn's disease and a hospital admission in January. Please send medical evidence, such as a letter from your consultant, within 28 days, and we will review the overpayment.

If you return to study
You told us you hope to restart year 2 in September 2027. You will normally have funding for the length of the course plus one extra year, less years already used. Compelling personal reasons can restore a year.

Your sponsor details (parents: Mr Kwok Wai Cheung and Mrs Suk Han Lam, 3 Kimberley Terrace, Llanishen, Cardiff CF14 5EA) were used for the household income assessment. We will not contact them about this debt.

Online account username: lokyiu.cheung04
Phone on file: 07700 900966
`,
    gold: [
      g('PERSON', 'Lok Yiu'),
      g('PERSON', 'Cheung'),
      g('PERSON', 'Kwok Wai'),
      g('PERSON', 'Suk Han'),
      g('PERSON', 'Lam'),
      g('ID_NUMBER', '4417 2093 618'),
      g('ADDRESS', 'Senghennydd Court'),
      g('POSTCODE', 'CF24 4DS'),
      g('ADDRESS', '3 Kimberley Terrace'),
      g('POSTCODE', 'CF14 5EA'),
      g('OTHER', 'lokyiu.cheung04'),
      g('PHONE', '07700 900966'),
    ],
    keep: [
      '£4,132.00',
      '£1,240.00',
      'within 30 days',
      'compelling personal reasons',
      "Crohn's disease",
      'within 28 days',
      'repayment threshold',
      '16 February 2026',
      'plus one extra year',
    ],
    medical: ["Crohn's disease"],
    medicalHigh: ["Crohn's disease"],
    quasi: ['Cardiff', 'BSc Optometry', 'Cardiff Metropolitan College of Vision Science', 'Llanishen', 'September 2027'],
  },
  {
    id: 'final-diabetes-sms-thread',
    title: 'Text thread between a patient and a GP surgery',
    text: `SMS thread — "Elmhurst Surgery" and patient, exported from phone

Elmhurst Surgery, 2 Nov 10:02
Dear Mr Balogun-Reid, your recent blood test shows your HbA1c is 71 mmol/mol (was 58 in April). Please book a diabetes review with Nurse Whittle. Reply BOOK or call 01632 960846.

Me, 2 Nov 10:30
book. but i work days can it be after 5

Elmhurst Surgery, 2 Nov 11:15
Hi Femi, it's Carol Whittle the diabetes nurse. I can do Weds 11 Nov at 5.40pm. Please bring your meter and all your tablets. Are you still taking the metformin 1g twice a day and the gliclazide?

Me, 2 Nov 12:01
metformin yes. stopped the gliclazide in august it was giving me hypos at work, i drive a forklift cant be having that. nobody told me what to do instead

Elmhurst Surgery, 2 Nov 12:20
Thanks for being honest, that explains the result. Please don't restart it for now. We'll talk about empagliflozin 10 mg or a weekly injection. Any thirst, passing more urine, blurred vision or weight loss?

Me, 2 Nov 12:24
yes all of them really. lost about a stone since summer. feet tingling at night

Elmhurst Surgery, 2 Nov 12:31
OK. I'd like you seen sooner. Dr Mehrotra can see you tomorrow 3 Nov at 8.10am before work. Please do a finger prick now. If it's over 20, or you feel sick or drowsy, ring 111.

Me, 2 Nov 12:40
it says 17.8. ok tomorrow. can my wife come she does the cooking. her name is Yewande she is also your patient

Elmhurst Surgery, 2 Nov 12:42
Of course. Also your eye screening is overdue (last 2024). They will write to you at 77 Pagnell Avenue, is that still right?

Me, 2 Nov 12:45
no we moved in may. 4 kiln close, selby yo8 4fj. and my dob is wrong on your app it says 12/03/1975 should be 13/03/1975

Elmhurst Surgery, 2 Nov 12:50
Thanks, I've passed both to reception to correct. See you tomorrow. Carol

Me, 6 Nov 19:12
hi carol started the new tablet weds. is it normal to wee this much. also pharmacy want my nhs number for the app is it 999 591 4402
`,
    gold: [
      g('PERSON', 'Balogun-Reid'),
      g('PERSON', 'Femi'),
      g('PERSON', 'Yewande'),
      g('ADDRESS', '77 Pagnell Avenue'),
      g('ADDRESS', '4 kiln close'),
      g('POSTCODE', 'yo8 4fj'),
      g('DOB', '13/03/1975'),
      g('ID_NUMBER', '999 591 4402'),
      g('PERSON', 'Whittle', 'other'),
      g('PERSON', 'Carol', 'other'),
      g('PERSON', 'carol', 'other'),
      g('PERSON', 'Mehrotra', 'other'),
    ],
    keep: [
      'HbA1c is 71 mmol/mol',
      'metformin 1g twice a day',
      'gliclazide',
      'hypos',
      'empagliflozin 10 mg',
      '17.8',
      'eye screening',
      'Weds 11 Nov at 5.40pm',
      '3 Nov at 8.10am',
    ],
    medical: [
      'HbA1c is 71 mmol/mol',
      'metformin 1g twice a day',
      'gliclazide',
      'hypos',
      'empagliflozin 10 mg',
      '17.8',
      'eye screening',
    ],
    medicalHigh: ['HbA1c is 71 mmol/mol', 'gliclazide', 'empagliflozin 10 mg'],
    quasi: ['selby', 'forklift', 'Elmhurst Surgery', 'moved in may'],
  },
  {
    id: 'final-parents-group-chat',
    title: 'School parents group chat (lower case)',
    text: `year 2 badgers parents 🦡 (whatsapp export)

[14/11/2026, 08:12] ~ shazia (zayn's mum): morning all, does anyone know if its pe kit today or tomorrow
[14/11/2026, 08:13] ~ leanne t: tomorrow. today is the trip letters
[14/11/2026, 08:15] ~ shazia (zayn's mum): thanks hun. also HUGE favour. i have to take my mum to the eye hospital at 2 and wont be back for pick up. could anyone grab zayn and take him to yours till 5?
[14/11/2026, 08:17] ~ ioana: i can, he can come back with matei. does he eat everything
[14/11/2026, 08:19] ~ shazia (zayn's mum): ur a star ioana. NO NUTS at all pls he has the peanut allergy, epipen is in his book bag blue case. miss okonkwo-bell knows how to use it. no eggs either they make him sick but not dangerous
[14/11/2026, 08:20] ~ ioana: ok no problem. we do pasta
[14/11/2026, 08:22] ~ shazia (zayn's mum): the office need it in writing so ive emailed. told them ioana dumitrescu is collecting zayn mahmood-patel 2B. they might ask u for the password its "bluebell7"
[14/11/2026, 08:23] ~ leanne t: shaz you just put the password in a group of 31 people 😂
[14/11/2026, 08:23] ~ shazia (zayn's mum): omg. everyone forget that
[14/11/2026, 08:26] ~ ioana: whats ur address for dropping him back
[14/11/2026, 08:28] ~ shazia (zayn's mum): 46 tennyson street, top bell, la1 4pz. if im not back my husband imtiaz will be, his no is 07700 900593. mine is 07700 900140
[14/11/2026, 08:30] ~ +44 7700 900377: Hi all, Graham here (Ottilie's dad). Reminder that the PTA quiz is Friday 20th, £6 a ticket, pay me by bank transfer please: G R Stannard 30-92-14 20417765
[14/11/2026, 08:31] ~ leanne t: 👍
[14/11/2026, 08:44] ~ shazia (zayn's mum): also if anyone found a grey coat with "z mahmood-patel" in the label its ours, lost at forest school weds
[14/11/2026, 15:31] ~ ioana: got him. he is happy. they are building a den
[14/11/2026, 15:33] ~ shazia (zayn's mum): thank u so much. eye hospital running an hour late. they think mum has wet macular degeneration and want to start injections today 😢
`,
    gold: [
      g('PERSON', 'shazia'),
      g('PERSON', 'zayn'),
      g('PERSON', 'mahmood-patel'),
      g('PERSON', 'imtiaz'),
      g('OTHER', 'bluebell7'),
      g('ADDRESS', '46 tennyson street'),
      g('POSTCODE', 'la1 4pz'),
      g('PHONE', '07700 900593'),
      g('PHONE', '07700 900140'),
      g('PERSON', 'leanne', 'other'),
      g('PERSON', 'ioana', 'other'),
      g('PERSON', 'matei', 'other'),
      g('PERSON', 'dumitrescu', 'other'),
      g('PERSON', 'okonkwo-bell', 'other'),
      g('PERSON', 'Graham', 'other'),
      g('PERSON', 'Ottilie', 'other'),
      g('PERSON', 'Stannard', 'other'),
      g('PHONE', '+44 7700 900377', 'other'),
      g('ACCOUNT', '20417765', 'other'),
    ],
    keep: ['peanut allergy', 'epipen', 'no eggs', 'NO NUTS', 'wet macular degeneration', 'injections', 'till 5'],
    medical: ['peanut allergy', 'epipen', 'wet macular degeneration'],
    medicalHigh: ['peanut allergy', 'epipen'],
    quasi: ['year 2 badgers', 'eye hospital', '2B', 'forest school'],
  },
  {
    id: 'final-paediatric-epilepsy-letter',
    title: 'Paediatric neurology letter to parents',
    text: `Children's Outpatients, Ravensbourne Children's Hospital
Paediatric Neurology

Clinic date 30/10/2026

Parent/guardian of Selam Tesfaye
c/o Ms Almaz Hailu
Flat 31, Pepys Point, 9 Grove Street
London SE8 3QF

Dear Ms Hailu and Mr Gebremariam,

Selam Tesfaye, born 7.11.2019, hospital number RCH 60 44 172, NHS number 999 268 0915

It was good to meet Selam and both of you in clinic, and thank you to Almaz for the videos, which were very helpful.

What we think is happening
Selam has had four episodes since July in which she stops, stares, and her eyelids flutter for 10 to 15 seconds, and one longer event at school on 12 October when she fell and her arms and legs jerked for about two minutes. Her EEG on 21 October showed 3 per second spike and wave discharges. This means Selam has epilepsy. The pattern is called childhood absence epilepsy, and she has also had one generalised tonic-clonic seizure.

Treatment
We agreed to start sodium valproate liquid (200 mg in 5 ml). Give 2.5 ml (100 mg) twice a day for one week, then 5 ml (200 mg) twice a day. Common side effects are tummy upset and increased appetite. I explained that valproate must not be used in pregnancy, which will matter when she is older, and we will review her treatment before then.
I have also prescribed buccal midazolam 5 mg to be given if a convulsive seizure lasts longer than 5 minutes, and an ambulance should be called. Our epilepsy nurse, Sister Marguerite Okonjo, will train you both and the staff at Deptford Creek Primary on 13 November.

Tests
MRI brain has been requested and will be done awake, with a play specialist. Blood tests before starting treatment were normal.

Safety
Showers not baths, or a bath with an adult in the room. Swimming only with one-to-one supervision and the lifeguard told. No climbing above her own height for now.

Follow up
I will see Selam in 3 months. The epilepsy nurses can be reached on 0203 496 0155 or epilepsy.nurses@ravensbournech.example.

Mr Gebremariam asked whether this is connected to the epilepsy of his late brother in Mekelle. A family history slightly raises the chance, but it is nobody's fault.

Yours sincerely,
Dr Ingrid Solheim-Akhtar, Consultant Paediatric Neurologist

cc GP: Dr B. Olawale, Evelyn Street Practice
Parents' mobiles: 07700 900612 (Almaz), 07700 900447 (Tesfaye)
`,
    gold: [
      g('PERSON', 'Selam'),
      g('PERSON', 'Tesfaye'),
      g('PERSON', 'Almaz'),
      g('PERSON', 'Hailu'),
      g('PERSON', 'Gebremariam'),
      g('ADDRESS', 'Pepys Point'),
      g('ADDRESS', '9 Grove Street'),
      g('POSTCODE', 'SE8 3QF'),
      g('DOB', '7.11.2019'),
      g('ID_NUMBER', 'RCH 60 44 172'),
      g('ID_NUMBER', '999 268 0915'),
      g('PHONE', '07700 900612'),
      g('PHONE', '07700 900447'),
      g('PERSON', 'Marguerite', 'other'),
      g('PERSON', 'Okonjo', 'other'),
      g('PERSON', 'Ingrid', 'other'),
      g('PERSON', 'Solheim-Akhtar', 'other'),
      g('PERSON', 'Olawale', 'other'),
    ],
    keep: [
      'childhood absence epilepsy',
      'generalised tonic-clonic seizure',
      'sodium valproate liquid (200 mg in 5 ml)',
      '5 ml (200 mg) twice a day',
      'buccal midazolam 5 mg',
      'longer than 5 minutes',
      'must not be used in pregnancy',
      'MRI brain',
      'in 3 months',
    ],
    medical: [
      'childhood absence epilepsy',
      'generalised tonic-clonic seizure',
      'sodium valproate liquid (200 mg in 5 ml)',
      '5 ml (200 mg) twice a day',
      'buccal midazolam 5 mg',
      'longer than 5 minutes',
      'must not be used in pregnancy',
      'MRI brain',
    ],
    medicalHigh: ['childhood absence epilepsy', 'sodium valproate liquid (200 mg in 5 ml)', 'buccal midazolam 5 mg'],
    quasi: ['Deptford Creek Primary', 'London', 'Mekelle', '12 October'],
  },
  {
    id: 'final-occupational-health-report',
    title: 'Occupational health report to an employer',
    text: `MEDWORKS OCCUPATIONAL HEALTH
Management referral report — CONFIDENTIAL
Released to the employer with the employee's written consent (given 10 November 2026)

To: Rosalind Achterberg-Nwosu, HR Business Partner, Vale of Aire Water
Employee: Thivya Sivakumaran          Employee ID: VAW-33180
Job title: Process Scientist, Esholt laboratory          DOB: 2 Sept 1988
Assessment: telephone, 9 November 2026          Clinician: Dr Hugo Castellane MFOM

Background
Ms Sivakumaran has been absent since 21 September 2026 (7 weeks). Fit notes give the reason as "post-viral fatigue / long COVID".

Current situation
She describes disabling fatigue, poor concentration ("brain fog"), and a fast heart rate on standing. Her GP has referred her to the long COVID clinic and to cardiology, where a diagnosis of postural tachycardia syndrome (PoTS) is being considered. She started ivabradine 2.5 mg twice daily on 26 October with some benefit. She can manage about 2 hours of activity before needing to rest and is not yet driving more than short distances.

Opinion
1. Fitness for work: she is not fit for her full role now. She is likely to be fit for a phased return from the week of 30 November 2026.
2. Suggested phased return over 8 weeks: weeks 1-2, 3 hours on 3 non-consecutive days, from home; weeks 3-4, 4 hours on 4 days, one day on site; then build by an hour a day each fortnight.
3. Adjustments: no lone working in the laboratory and no work at height or on the filter beds until cardiology have reported; a stool at the bench; no on-call rota for 3 months; flexibility for appointments.
4. Disability: in my opinion the Equality Act 2010 is likely to apply, as the condition has lasted since March 2026 and is likely to last 12 months. That is a legal decision, not a medical one.
5. Outlook: gradual improvement is expected over 6 to 12 months. Relapses are common if activity is increased too fast.
6. Review: I will speak to her again on 11 January 2027.

Ms Sivakumaran asked me to record that the email from her line manager, Mr Kelvin Draycott, on 2 November asking for "a firm return date or we start capability" made her symptoms worse. I advise that formal absence triggers are adjusted during the phased return.

She has seen this report and asked for one correction (dose of ivabradine), which has been made.

Copy to employee at: thivya.siva@lankapost.example / 18 Hawksworth Grove, Kirkstall, Leeds LS5 3PN
`,
    gold: [
      g('PERSON', 'Thivya'),
      g('PERSON', 'Sivakumaran'),
      g('ID_NUMBER', 'VAW-33180'),
      g('DOB', '2 Sept 1988'),
      g('EMAIL', 'thivya.siva@lankapost.example'),
      g('ADDRESS', '18 Hawksworth Grove'),
      g('POSTCODE', 'LS5 3PN'),
      g('PERSON', 'Rosalind', 'other'),
      g('PERSON', 'Achterberg-Nwosu', 'other'),
      g('PERSON', 'Hugo', 'other'),
      g('PERSON', 'Castellane', 'other'),
      g('PERSON', 'Kelvin', 'other'),
      g('PERSON', 'Draycott', 'other'),
    ],
    keep: [
      'long COVID',
      'postural tachycardia syndrome (PoTS)',
      'ivabradine 2.5 mg twice daily',
      'phased return',
      'week of 30 November 2026',
      'over 8 weeks',
      'no lone working',
      'Equality Act 2010',
      '11 January 2027',
    ],
    medical: ['long COVID', 'postural tachycardia syndrome (PoTS)', 'ivabradine 2.5 mg twice daily'],
    medicalHigh: ['postural tachycardia syndrome (PoTS)', 'ivabradine 2.5 mg twice daily'],
    quasi: ['Process Scientist', 'Vale of Aire Water', 'Esholt laboratory', 'Kirkstall', 'Leeds', '21 September 2026'],
  },
  {
    id: 'final-mortgage-arrears',
    title: 'Building society mortgage arrears letter',
    text: `Northmoor Building Society
Mortgage Support Team
                                                    Mortgage account: 9-20417-66318
                                                    5 November 2026
Mrs Z Szabó-Kerr and Mr A D Kerr
The Steading
Auchterless Road
Turriff
AB53 4EP

Dear Mrs Szabó-Kerr and Mr Kerr,

Your mortgage is in arrears — please contact us

Your monthly payment went up from £1,014.20 to £1,387.55 on 1 July 2026 when your fixed rate ended and you moved to our standard variable rate of 7.74%. Since then:

Payment due 1 August        paid in full
Payment due 1 September     £700.00 received
Payment due 1 October       not received (direct debit returned unpaid)
Payment due 1 November      not received
Arrears today               £3,462.65
Balance outstanding         £164,880.19      Term remaining: 17 years 4 months

We want to help you keep your home. Repossession is a last resort and we will not start court action while you are talking to us and keeping to an agreed plan.

What we can offer, depending on your circumstances
1. A new fixed rate. You are eligible to switch today without a credit check. Our 5 year fixed rate of 4.89% would bring your payment to about £1,098 a month.
2. Extending the term to reduce the payment.
3. Interest-only payments for up to 6 months.
4. Adding the arrears to the balance (capitalisation), once six full payments have been made.

What we need
Please complete the enclosed income and expenditure form and return it within 15 working days, or call Mairi Drysdale on 01632 960928. Zsófia told us on 22 October that Alistair was made redundant from the offshore supply base in August and that her income as a self-employed potter is seasonal. If you are claiming Universal Credit, you may be able to get Support for Mortgage Interest after three months.

Please note: a charge of £40 has been added for each returned direct debit. Arrears are reported to credit reference agencies.

You may want to get free advice from Citizens Advice Scotland or StepChange. If you want us to deal with someone else on your behalf, such as your daughter Miss Flóra Kerr, we need written authority from both of you.

Yours sincerely,

Mairi Drysdale
Mortgage Support Adviser
`,
    gold: [
      g('PERSON', 'Szabó'),
      g('PERSON', 'Kerr'),
      g('PERSON', 'Zsófia'),
      g('PERSON', 'Alistair'),
      g('PERSON', 'Flóra'),
      g('ADDRESS', 'The Steading'),
      g('ADDRESS', 'Auchterless Road'),
      g('POSTCODE', 'AB53 4EP'),
      g('ACCOUNT', '9-20417-66318'),
      g('PERSON', 'Mairi', 'other'),
      g('PERSON', 'Drysdale', 'other'),
      g('PHONE', '01632 960928', 'other'),
    ],
    keep: [
      '£3,462.65',
      'standard variable rate of 7.74%',
      '5 year fixed rate of 4.89%',
      'about £1,098 a month',
      'Interest-only payments for up to 6 months',
      'within 15 working days',
      'Support for Mortgage Interest',
      'capitalisation',
      'Repossession is a last resort',
    ],
    medical: [],
    medicalHigh: [],
    quasi: ['Turriff', 'made redundant', 'self-employed potter', 'offshore supply base'],
  },
];
