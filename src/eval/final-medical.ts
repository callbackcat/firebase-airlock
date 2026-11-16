import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Final medical set. Twenty fictional medical documents written without
 * sight of the detection code, the word lists or any other test set, to be
 * measured once. Every person, organisation, address and number here is made
 * up. Medicine names, conditions, tests and procedures are real vocabulary,
 * and many are named after people (Parkinson's disease, Holter monitor,
 * Hartmann's procedure), because the point of the set is to see whether the
 * scrub hides people while leaving that vocabulary readable.
 *
 * `medical` is the subset of `keep` that is medical vocabulary; `medicalHigh`
 * is the subset of `medical` whose loss would change what the document means.
 */
const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const FINAL_MEDICAL: Fixture[] = [
  {
    id: 'fmed-cardiology-af',
    title: 'Cardiology clinic letter, atrial fibrillation',
    text: `Ribble Heart Centre
Cardiology Outpatients, Level 2

Dr Shabnam Qureshi
Whalley Bank Surgery
Blackburn

Clinic date: 14 October 2026
Dictated: 15 October 2026

Re: Mr Oluwaseun Adeyemi-Clarke, date of birth 3 February 1954
NHS number: 485 221 9037   Hospital number: RX4207731
22 Pendle Croft, Blackburn BB2 6QT   Tel: 07700 900412

Diagnosis: paroxysmal atrial fibrillation
Other problems: hypertension, type 2 diabetes, laparoscopic cholecystectomy (2015), Colles' fracture (2019)

Dear Dr Qureshi,

Thank you for referring Mr Adeyemi-Clarke, a retired bus driver, who came to clinic with his wife Folasade. He described four episodes of fast, irregular palpitations since July, each lasting between twenty minutes and three hours, with mild breathlessness but no chest pain or blackouts.

His resting ECG today showed sinus rhythm at 64 beats per minute. The 7-day Holter monitor fitted by our cardiac physiologist, Eilidh Farquharson, recorded three runs of atrial fibrillation, the longest lasting 2 hours 40 minutes. The echocardiogram showed a mildly dilated left atrium and good left ventricular function, with an ejection fraction of 58%. BNP was 96 ng/L. Bloods from your surgery showed eGFR 58 and HbA1c 54 mmol/mol.

His CHA2DS2-VASc score is 3, so I have recommended anticoagulation and we discussed the bleeding risks. He was happy to start a DOAC.

Changes to medicines:
- Apixaban 5 mg twice daily, started today
- Bisoprolol increased from 1.25 mg to 2.5 mg once daily
- Ramipril 5 mg once daily to continue. He tolerates his ACE inhibitor without a cough.
- Aspirin 75 mg stopped

I would be grateful if you could repeat his U&E and FBC in four weeks. If the episodes continue despite Bisoprolol we will discuss flecainide or catheter ablation. I will see him again in clinic in three months.

Mrs Adeyemi-Clarke asked that appointment letters also go by email to folasade.ac@pendlemail.example.

Yours sincerely,

Dr Marek Wisniewski
Consultant Cardiologist

cc: patient
`,
    gold: [
      g('PERSON', 'Oluwaseun'),
      g('PERSON', 'Adeyemi-Clarke'),
      g('DOB', '3 February 1954'),
      g('ID_NUMBER', '485 221 9037'),
      g('ID_NUMBER', 'RX4207731'),
      g('ADDRESS', '22 Pendle Croft'),
      g('POSTCODE', 'BB2 6QT'),
      g('PHONE', '07700 900412'),
      g('PERSON', 'Folasade'),
      g('EMAIL', 'folasade.ac@pendlemail.example'),
      g('PERSON', 'Shabnam', 'other'),
      g('PERSON', 'Qureshi', 'other'),
      g('PERSON', 'Eilidh', 'other'),
      g('PERSON', 'Farquharson', 'other'),
      g('PERSON', 'Marek', 'other'),
      g('PERSON', 'Wisniewski', 'other'),
    ],
    keep: [
      'paroxysmal atrial fibrillation',
      'Holter monitor',
      'Apixaban 5 mg twice daily',
      'DOAC',
      'echocardiogram',
      'eGFR 58',
      'laparoscopic cholecystectomy',
      'ACE inhibitor',
      'Bisoprolol',
      'BNP',
      'three months',
      'four weeks',
    ],
    medical: [
      'paroxysmal atrial fibrillation',
      'Holter monitor',
      'Apixaban 5 mg twice daily',
      'DOAC',
      'echocardiogram',
      'eGFR 58',
      'laparoscopic cholecystectomy',
      'ACE inhibitor',
      'Bisoprolol',
      'BNP',
    ],
    medicalHigh: ['paroxysmal atrial fibrillation', 'Holter monitor', 'Apixaban 5 mg twice daily'],
    quasi: ['Blackburn', 'retired bus driver', 'Ribble Heart Centre', 'Whalley Bank Surgery'],
  },
  {
    id: 'fmed-hospital-at-home-copd',
    title: 'Hospital at home daily note, COPD',
    text: `Severn Vale Hospital at Home (Respiratory Virtual Ward)
Daily review note

Patient: Hyacinth Beckford-Lewis        DOB: 21/09/1949
NHS no: 602 118 4473                    Virtual ward ID: HAH-26-01187
Address: Flat 6, Marlowe Court, 31 Stapleton Rise, Bristol BS5 7RD
Next of kin: Leroy Beckford (son), 07700 900268
Day 3 of 7. Visit date: Wednesday 4 November 2026, 10:40

Reason for admission to the virtual ward
Infective exacerbation of COPD on a background of bronchiectasis. Stepped down from the acute medical unit under Dr Nkechi Obiora on 2 November.

Today
Mrs Beckford-Lewis feels less breathless and slept in bed rather than the chair. Sputum is still green but about half the volume. No chest pain, no ankle swelling.

Observations
Temp 37.1    Pulse 88    BP 132/74    Resp rate 20
Oxygen saturation 91% on room air (her target is 88 to 92%)
NEWS2 score 3 (was 5 on admission)

Results
CRP 38, down from 112. White cell count 11.2. Sputum culture has grown Pseudomonas aeruginosa, sensitive to ciprofloxacin.

Medicines
Doxycycline stopped. Ciprofloxacin 750 mg twice daily started for 14 days after discussion with Dr Obiora.
Prednisolone 30 mg once daily, day 4 of 5.
Salbutamol 2.5 mg nebules up to four times a day.
Trimbow two puffs twice daily to continue. Inhaler technique checked with a spacer.
Carbocisteine 750 mg three times a day.

Plan
1. Continue home monitoring: pulse oximeter readings morning and evening by phone app.
2. Chest physiotherapy: Aoife Brennan, respiratory physiotherapist, to visit tomorrow to teach the active cycle of breathing.
3. Spirometry and referral to pulmonary rehabilitation once she has recovered. Her last FEV1 was 48% predicted.
4. Her son asked about a Mantoux test because a neighbour has tuberculosis. Not needed at present; chest X-ray on 1 November showed no cavitation.
5. Expected discharge from the virtual ward: Sunday 8 November. Discharge letter to Dr Rhodri Pugh at Eastville Park Practice.

If she becomes more breathless or confused, she or Leroy should ring the virtual ward hub on 0117 496 0152 (8am to 8pm) or 999.

Seen by: Mihai Popescu, Advanced Clinical Practitioner
`,
    gold: [
      g('PERSON', 'Hyacinth'),
      g('PERSON', 'Beckford-Lewis'),
      g('DOB', '21/09/1949'),
      g('ID_NUMBER', '602 118 4473'),
      g('ID_NUMBER', 'HAH-26-01187'),
      g('ADDRESS', 'Marlowe Court'),
      g('ADDRESS', '31 Stapleton Rise'),
      g('POSTCODE', 'BS5 7RD'),
      g('PERSON', 'Leroy'),
      g('PERSON', 'Beckford'),
      g('PHONE', '07700 900268'),
      g('PERSON', 'Nkechi', 'other'),
      g('PERSON', 'Obiora', 'other'),
      g('PERSON', 'Aoife', 'other'),
      g('PERSON', 'Brennan', 'other'),
      g('PERSON', 'Rhodri', 'other'),
      g('PERSON', 'Pugh', 'other'),
      g('PERSON', 'Mihai', 'other'),
      g('PERSON', 'Popescu', 'other'),
    ],
    keep: [
      'COPD',
      'bronchiectasis',
      'Pseudomonas aeruginosa',
      'Ciprofloxacin 750 mg twice daily',
      'Prednisolone 30 mg',
      'Trimbow',
      'Carbocisteine 750 mg',
      'Mantoux test',
      'FEV1',
      'CRP 38',
      'NEWS2 score 3',
      'Sunday 8 November',
    ],
    medical: [
      'COPD',
      'bronchiectasis',
      'Pseudomonas aeruginosa',
      'Ciprofloxacin 750 mg twice daily',
      'Prednisolone 30 mg',
      'Trimbow',
      'Carbocisteine 750 mg',
      'Mantoux test',
      'FEV1',
      'CRP 38',
      'NEWS2 score 3',
    ],
    medicalHigh: ['COPD', 'Pseudomonas aeruginosa', 'Ciprofloxacin 750 mg twice daily'],
    quasi: ['Bristol', 'Eastville Park Practice', 'Severn Vale Hospital at Home'],
  },
  {
    id: 'fmed-gp-letter-gastro-results',
    title: 'GP letter to a patient about endoscopy results',
    text: `Harbourside Medical Practice
14 Quay Street, Whitehaven
Tel 01946 496 0131

6 November 2026

Private and confidential
Mr Zbigniew Kowalczyk
9 Lowther Gardens
Whitehaven
CA28 6HN

Dear Mr Kowalczyk,

Your results from West Lakes Hospital

I am writing because the hospital has sent me the results of the camera tests you had on 22 October, and you told our receptionist, Maxine, that you would rather have them in writing before we speak.

The gastroscopy showed a short segment of Barrett's oesophagus, which is a change in the lining of the gullet caused by years of acid reflux. The samples (biopsies) showed no dysplasia, meaning no pre-cancerous cells. This is a reassuring result. The specialist, Dr Harpreet Sandhu, recommends a repeat gastroscopy in three years.

The colonoscopy showed that your Crohn's disease is active again at the join between the small and large bowel. This fits with your recent tummy pain and with your blood and stool tests: your CRP was 42 and your faecal calprotectin was 610. The stool sample was negative for Clostridioides difficile.

What happens next:

1. Please increase your Omeprazole to 40 mg once a day. A new prescription is at Lowther Pharmacy.
2. Dr Sandhu would like to start you on Adalimumab, an injection you give yourself every two weeks. Before that you need a chest X-ray and blood tests for hepatitis B and tuberculosis. The IBD nurse, Ciaran McAllister, will telephone you on 07700 900547 to arrange this.
3. Carry on with azathioprine 150 mg daily for now. We will check your FBC and liver function every three months while you take it.
4. Please avoid ibuprofen and similar painkillers, as they can make Crohn's disease flare. Paracetamol is safe.

I know your partner, Agnieszka, was worried that the operation you had in 2015 (the Nissen fundoplication) had failed. It has not; the wrap looked intact.

I have booked you a telephone appointment with me on Thursday 19 November at 11.10am. If the pain gets worse, you pass blood, or you cannot keep fluids down, please call us the same day.

Yours sincerely,

Dr Yewande Bankole
GP Partner

Your details as we hold them: NHS number 731 406 2258, date of birth 17.05.1981
`,
    gold: [
      g('PERSON', 'Zbigniew'),
      g('PERSON', 'Kowalczyk'),
      g('ADDRESS', '9 Lowther Gardens'),
      g('POSTCODE', 'CA28 6HN'),
      g('PHONE', '07700 900547'),
      g('PERSON', 'Agnieszka'),
      g('ID_NUMBER', '731 406 2258'),
      g('DOB', '17.05.1981'),
      g('PERSON', 'Maxine', 'other'),
      g('PERSON', 'Harpreet', 'other'),
      g('PERSON', 'Sandhu', 'other'),
      g('PERSON', 'Ciaran', 'other'),
      g('PERSON', 'McAllister', 'other'),
      g('PERSON', 'Yewande', 'other'),
      g('PERSON', 'Bankole', 'other'),
    ],
    keep: [
      "Barrett's oesophagus",
      "Crohn's disease",
      'no dysplasia',
      'faecal calprotectin',
      'Clostridioides difficile',
      'Omeprazole',
      'Adalimumab',
      'azathioprine 150 mg',
      'Nissen fundoplication',
      'colonoscopy',
      'three years',
      'Thursday 19 November',
    ],
    medical: [
      "Barrett's oesophagus",
      "Crohn's disease",
      'no dysplasia',
      'faecal calprotectin',
      'Clostridioides difficile',
      'Omeprazole',
      'Adalimumab',
      'azathioprine 150 mg',
      'Nissen fundoplication',
      'colonoscopy',
    ],
    medicalHigh: ["Barrett's oesophagus", "Crohn's disease", 'no dysplasia', 'Adalimumab'],
    quasi: ['Whitehaven', 'West Lakes Hospital', 'Harbourside Medical Practice'],
  },
  {
    id: 'fmed-neurology-parkinsons',
    title: 'Neurology clinic letter, new diagnosis',
    text: `Department of Neurology
St Columba's Infirmary, Dundee

Our ref: CMG/ht/N-558204
Clinic: Movement Disorders, 28 October 2026

Dr Piotr Nowak
Tayview Medical Group
Broughty Ferry

Dear Dr Nowak,

Mrs Mei-Ling Cheung, born 9 June 1957
41 Claypotts Avenue, Broughty Ferry, DD5 3LW
CHI number: 0906574482

Diagnoses
1. Parkinson's disease, diagnosed today
2. Left carpal tunnel syndrome
3. Bell's palsy in 2011, fully recovered

Mrs Cheung attended with her daughter, Vivian, who translated some of the consultation from Cantonese. Over eighteen months she has developed a tremor of the right hand at rest, smaller handwriting and a tendency to shuffle. Vivian has noticed that her mother no longer swings her right arm and that she shouts and kicks in her sleep. She still works part time as a seamstress and is finding fine needlework slow.

On examination there was a pill-rolling rest tremor on the right, cogwheel rigidity at the right wrist and marked slowing of finger tapping. Her gait was narrow based and she took five steps to turn. Reflexes were symmetrical and the plantar responses were flexor (Babinski sign negative). The Romberg test was negative. Tinel's sign was positive at the left wrist, in keeping with the carpal tunnel syndrome you have already identified.

The MRI brain you arranged in August was normal for her age. I do not think a DaTscan is needed because the clinical picture is clear. I explained the diagnosis with the help of our Parkinson's nurse specialist, Zainab Al-Rashid.

Treatment
I have started Co-careldopa 12.5/50 mg, one tablet three times a day for two weeks, then two tablets three times a day. If she feels sick she may take domperidone 10 mg for a few days. Please avoid metoclopramide and prochlorperazine, which would make her symptoms worse.

I will review her in four months. Vivian can be reached on 07700 900733 or at vivian.cheung@taymail.example to arrange an interpreter for the next visit.

Yours sincerely,

Dr Callum MacGregor
Consultant Neurologist
`,
    gold: [
      g('PERSON', 'Mei-Ling'),
      g('PERSON', 'Cheung'),
      g('DOB', '9 June 1957'),
      g('ADDRESS', '41 Claypotts Avenue'),
      g('POSTCODE', 'DD5 3LW'),
      g('ID_NUMBER', '0906574482'),
      g('ID_NUMBER', 'N-558204'),
      g('PERSON', 'Vivian'),
      g('PHONE', '07700 900733'),
      g('EMAIL', 'vivian.cheung@taymail.example'),
      g('PERSON', 'Piotr', 'other'),
      g('PERSON', 'Nowak', 'other'),
      g('PERSON', 'Zainab', 'other'),
      g('PERSON', 'Al-Rashid', 'other'),
      g('PERSON', 'Callum', 'other'),
      g('PERSON', 'MacGregor', 'other'),
    ],
    keep: [
      "Parkinson's disease",
      "Bell's palsy",
      'Babinski sign',
      'Romberg test',
      "Tinel's sign",
      'carpal tunnel syndrome',
      'MRI brain',
      'DaTscan',
      'Co-careldopa 12.5/50 mg',
      'domperidone 10 mg',
      'metoclopramide',
      'four months',
    ],
    medical: [
      "Parkinson's disease",
      "Bell's palsy",
      'Babinski sign',
      'Romberg test',
      "Tinel's sign",
      'carpal tunnel syndrome',
      'MRI brain',
      'DaTscan',
      'Co-careldopa 12.5/50 mg',
      'domperidone 10 mg',
      'metoclopramide',
    ],
    medicalHigh: ["Parkinson's disease", 'Co-careldopa 12.5/50 mg', 'metoclopramide'],
    quasi: ['Dundee', 'Broughty Ferry', 'seamstress', 'Tayview Medical Group'],
  },
  {
    id: 'fmed-haematology-discharge',
    title: 'Haematology discharge summary, neutropenic sepsis',
    text: `NORTHGATE CANCER CENTRE
Haematology and Oncology, Ward 14
DISCHARGE SUMMARY

Name:            Declan O'Shaughnessy
Date of birth:   30-Nov-1994
NHS number:      419 870 3356
Hospital no:     NG0773125
Address:         Top Flat, 88 Jesmond Vale Road, Newcastle upon Tyne NE2 1PX
Next of kin:     Siobhan O'Shaughnessy (wife)  07700 900190
GP:              Dr Ffion Morgan, Heaton Road Surgery

Admitted:   29 October 2026 (via the 24-hour chemotherapy helpline)
Discharged: 3 November 2026
Consultant: Dr Ayesha Rahman

Diagnosis
Neutropenic sepsis following cycle 2 of ABVD chemotherapy for classical Hodgkin lymphoma, stage IIB.

Presenting problem
Temperature of 38.6 at home nine days after treatment, with rigors and a sore mouth. He works as a secondary school music teacher and several pupils had been unwell.

Investigations
Neutrophils 0.2 on admission, 1.9 on discharge
Haemoglobin 98    Platelets 141    CRP 164, falling to 22
Blood cultures from the Hickman line grew Staphylococcus aureus (MSSA) in one of two bottles. Peripheral cultures negative.
Chest X-ray clear. Echocardiogram showed no vegetations.
Interim PET-CT on 20 October: Deauville score 2, a complete metabolic response.

Treatment in hospital
Intravenous Tazocin within 40 minutes of arrival, changed to flucloxacillin 2 g four times a day once cultures were known. The Hickman line was removed on 31 October by Kwabena Asante, clinical nurse specialist. Filgrastim was given for three days. Oral mucositis was treated with Difflam mouthwash and nystatin.

Medicines on discharge
Flucloxacillin 1 g four times a day by mouth, to complete 14 days in total
Ondansetron 8 mg twice daily when needed for sickness
Allopurinol 300 mg once daily - STOPPED
Aciclovir 400 mg twice daily (continue)
Co-trimoxazole 480 mg on Mondays, Wednesdays and Fridays (continue)

Allergies: none known.

Follow-up
Cycle 3 is deferred by one week to 12 November. A new line will be placed beforehand; he would prefer a PICC line. Lung function tests are booked for 10 November.
Mr O'Shaughnessy has the helpline card and knows to ring if his temperature is 37.5 or above.

Completed by: Dr Ifeoma Chukwuma, Specialty Registrar in Haematology
`,
    gold: [
      g('PERSON', 'Declan'),
      g('PERSON', "O'Shaughnessy"),
      g('DOB', '30-Nov-1994'),
      g('ID_NUMBER', '419 870 3356'),
      g('ID_NUMBER', 'NG0773125'),
      g('ADDRESS', '88 Jesmond Vale Road'),
      g('POSTCODE', 'NE2 1PX'),
      g('PERSON', 'Siobhan'),
      g('PHONE', '07700 900190'),
      g('PERSON', 'Ffion', 'other'),
      g('PERSON', 'Morgan', 'other'),
      g('PERSON', 'Ayesha', 'other'),
      g('PERSON', 'Rahman', 'other'),
      g('PERSON', 'Kwabena', 'other'),
      g('PERSON', 'Asante', 'other'),
      g('PERSON', 'Ifeoma', 'other'),
      g('PERSON', 'Chukwuma', 'other'),
    ],
    keep: [
      'Neutropenic sepsis',
      'Hodgkin lymphoma',
      'ABVD chemotherapy',
      'Hickman line',
      'Staphylococcus aureus',
      'PET-CT',
      'Deauville score 2',
      'Filgrastim',
      'Flucloxacillin 1 g four times a day',
      'Ondansetron 8 mg',
      'Allopurinol 300 mg',
      '12 November',
    ],
    medical: [
      'Neutropenic sepsis',
      'Hodgkin lymphoma',
      'ABVD chemotherapy',
      'Hickman line',
      'Staphylococcus aureus',
      'PET-CT',
      'Deauville score 2',
      'Filgrastim',
      'Flucloxacillin 1 g four times a day',
      'Ondansetron 8 mg',
      'Allopurinol 300 mg',
    ],
    medicalHigh: [
      'Neutropenic sepsis',
      'Hodgkin lymphoma',
      'Staphylococcus aureus',
      'Flucloxacillin 1 g four times a day',
    ],
    quasi: [
      'Newcastle upon Tyne',
      'secondary school music teacher',
      'Heaton Road Surgery',
      'NORTHGATE CANCER CENTRE',
    ],
  },
  {
    id: 'fmed-rheumatology-ra',
    title: 'Rheumatology clinic letter, dose change',
    text: `Rheumatology Department, Calder Royal Hospital, Halifax
Telephone 01422 496 0177

Date of clinic: 3 November 2026
Typed: 5 November 2026
Hospital number: CR-6620419

Dr Anil Deshmukh
Savile Park Surgery
Halifax

Dear Dr Deshmukh,

Re: Mrs Layla Al-Masri, d.o.b. 12/04/1972, NHS 556 093 7714
The Old Dairy, Skircoat Green Lane, Halifax HX3 0RZ

Diagnoses:
Seropositive rheumatoid arthritis (2021)
Secondary Sjögren's syndrome
Raynaud's phenomenon
Right Baker's cyst, ultrasound confirmed

Current medicines:
Methotrexate 20 mg once weekly on Sundays
Folic acid 5 mg once weekly on Wednesdays
Hydroxychloroquine 200 mg twice daily
Hypromellose eye drops
Nifedipine MR 10 mg twice daily in winter

I reviewed Mrs Al-Masri with Svetlana Petrova, rheumatology specialist nurse. She has had six weeks of morning stiffness lasting two hours and swelling of both wrists. Her husband, Tariq, now helps her with buttons and jars and she has cut back her hours as a pharmacy dispenser. She also reports a very dry mouth and gritty eyes, and a painful swelling behind the right knee.

There were seven tender and five swollen joints. With a CRP of 31 her DAS28 score is 5.4, which is high disease activity. Schirmer's test was 3 mm in each eye at five minutes. There is no rash or fever to suggest adult-onset Still's disease, which her sister was treated for, and no mouth or genital ulcers to suggest Behçet's disease. The calf was soft and a Doppler scan last week excluded a deep vein thrombosis.

Plan:
1. Methotrexate increased today from 15 mg to 20 mg once weekly.
2. Intramuscular Depo-Medrone 120 mg given in clinic.
3. If the score remains above 5.1 at the next visit she meets the criteria for a biologic, and I would suggest etanercept.
4. FBC, U&E and liver function every two weeks for six weeks after the dose change, then monthly. Please stop the Methotrexate and ring us if the white cell count falls below 3.5.
5. Referral to ophthalmology for the dry eyes.

She will be seen again in eight weeks. Results can be sent to her at l.almasri72@calderpost.example.

Yours sincerely,

Dr Ruairi Gallagher
Consultant Rheumatologist
`,
    gold: [
      g('PERSON', 'Layla'),
      g('PERSON', 'Al-Masri'),
      g('DOB', '12/04/1972'),
      g('ID_NUMBER', '556 093 7714'),
      g('ID_NUMBER', 'CR-6620419'),
      g('ADDRESS', 'The Old Dairy'),
      g('ADDRESS', 'Skircoat Green Lane'),
      g('POSTCODE', 'HX3 0RZ'),
      g('PERSON', 'Tariq'),
      g('EMAIL', 'l.almasri72@calderpost.example'),
      g('PERSON', 'Anil', 'other'),
      g('PERSON', 'Deshmukh', 'other'),
      g('PERSON', 'Svetlana', 'other'),
      g('PERSON', 'Petrova', 'other'),
      g('PERSON', 'Ruairi', 'other'),
      g('PERSON', 'Gallagher', 'other'),
    ],
    keep: [
      'rheumatoid arthritis',
      "Sjögren's syndrome",
      "Raynaud's phenomenon",
      "Baker's cyst",
      'Methotrexate 20 mg once weekly',
      'Hydroxychloroquine 200 mg',
      'DAS28 score is 5.4',
      "Schirmer's test",
      "Still's disease",
      "Behçet's disease",
      'etanercept',
      'eight weeks',
    ],
    medical: [
      'rheumatoid arthritis',
      "Sjögren's syndrome",
      "Raynaud's phenomenon",
      "Baker's cyst",
      'Methotrexate 20 mg once weekly',
      'Hydroxychloroquine 200 mg',
      'DAS28 score is 5.4',
      "Schirmer's test",
      "Still's disease",
      "Behçet's disease",
      'etanercept',
    ],
    medicalHigh: [
      'rheumatoid arthritis',
      "Sjögren's syndrome",
      'Methotrexate 20 mg once weekly',
      'DAS28 score is 5.4',
    ],
    quasi: ['Halifax', 'pharmacy dispenser', 'Calder Royal Hospital', 'Savile Park Surgery'],
  },
  {
    id: 'fmed-portal-thread-thyroid',
    title: 'Patient portal messages, thyroid medicine',
    text: `Patient portal: messages
Fernhill Family Practice, Leicester

Thread: Carbimazole and sore throat
Patient: Ananya Krishnamurthy (DOB 08/01/1998, NHS 668 254 1190)
Registered address: 27 Holmfield Avenue, Leicester LE2 2BG

Mon 9 Nov 2026, 07:52 - Ananya Krishnamurthy
Hello. I was started on carbimazole 40 mg by the hospital three weeks ago for Graves' disease. Since Saturday I have had a really sore throat and two mouth ulcers and I feel shivery. My mum Lakshmi has Hashimoto's thyroiditis and says it never happened with her tablets.

Mon 9 Nov 2026, 08:31 - Reception (Kirsty)
Thanks Ananya, I have passed this to the duty doctor as urgent.

Mon 9 Nov 2026, 08:58 - Dr Fiona Sinclair
Good morning. You were right to message. Carbimazole can, rarely, lower the white blood cells that fight infection (this is called agranulocytosis). Please do not take today's dose. You need an urgent FBC this morning. Come to the treatment room at 10:20 and our nurse Temitope Balogun will take the blood. Keep taking your Propranolol 40 mg three times a day.

Mon 9 Nov 2026, 09:04 - Ananya Krishnamurthy
OK, I'll be there. I'm on placement at the vet school today, can you ring my mobile rather than the house? It's 07700 900826. The house number on file (0116 496 0109) is my parents'.

Mon 9 Nov 2026, 15:47 - Dr Fiona Sinclair
Good news. Your neutrophils are normal at 3.4, so this is not agranulocytosis and you can restart the carbimazole tonight. I have sent Phenoxymethylpenicillin 500 mg four times a day for 10 days to Evington Road Pharmacy. Your thyroid results have also improved: free T4 is 31 (it was 58) and TSH is still below 0.01. The hospital also checked you for coeliac disease and Addison's disease; both tests were negative.

Mon 9 Nov 2026, 15:55 - Ananya Krishnamurthy
Thanks. My eyes feel gritty and look a bit starey. Dr Griffiths at the hospital mentioned radioiodine later on. Is that still possible?

Mon 9 Nov 2026, 16:20 - Dr Fiona Sinclair
Gritty, prominent eyes can be thyroid eye disease, which goes with Graves' disease. I will write to Dr Iwan Griffiths today so the endocrinology clinic can see you sooner than 14 December. He may prefer to avoid radioiodine if your eyes are affected. Message us again if the sore throat is no better in 48 hours.
`,
    gold: [
      g('PERSON', 'Ananya'),
      g('PERSON', 'Krishnamurthy'),
      g('DOB', '08/01/1998'),
      g('ID_NUMBER', '668 254 1190'),
      g('ADDRESS', '27 Holmfield Avenue'),
      g('POSTCODE', 'LE2 2BG'),
      g('PERSON', 'Lakshmi'),
      g('PHONE', '07700 900826'),
      g('PHONE', '0116 496 0109'),
      g('PERSON', 'Kirsty', 'other'),
      g('PERSON', 'Fiona', 'other'),
      g('PERSON', 'Sinclair', 'other'),
      g('PERSON', 'Temitope', 'other'),
      g('PERSON', 'Balogun', 'other'),
      g('PERSON', 'Iwan', 'other'),
      g('PERSON', 'Griffiths', 'other'),
    ],
    keep: [
      "Graves' disease",
      'carbimazole 40 mg',
      "Hashimoto's thyroiditis",
      'agranulocytosis',
      'FBC',
      "Addison's disease",
      'Propranolol 40 mg',
      'Phenoxymethylpenicillin 500 mg',
      'TSH',
      'radioiodine',
      'thyroid eye disease',
      '48 hours',
    ],
    medical: [
      "Graves' disease",
      'carbimazole 40 mg',
      "Hashimoto's thyroiditis",
      'agranulocytosis',
      'FBC',
      "Addison's disease",
      'Propranolol 40 mg',
      'Phenoxymethylpenicillin 500 mg',
      'TSH',
      'radioiodine',
      'thyroid eye disease',
    ],
    medicalHigh: ["Graves' disease", 'carbimazole 40 mg', 'agranulocytosis'],
    quasi: ['Leicester', 'vet school', 'Fernhill Family Practice'],
  },
  {
    id: 'fmed-psychiatry-bipolar',
    title: 'Community mental health team letter',
    text: `Gwent Community Mental Health Team (East)
Ty Derwen, Lower Dock Street, Newport
Tel: 01633 496 0118

10 November 2026

Dr Hamish Drummond
Beechwood Surgery
Newport

Dear Dr Drummond,

Rhys Cadwallader, 26.07.1988
Bryn Awel, 5 Christchurch Hill, Newport NP18 1JJ
NHS no. 704 339 8162    Our ref MH/E/203377

Diagnosis: Bipolar affective disorder, current episode moderate depression (ICD-10 F31.3)

Medication:
Priadel (lithium carbonate) 800 mg at night
Quetiapine 300 mg at night, increased today from 200 mg
Sertraline stopped on 20 October
Zopiclone 3.75 mg at night for up to seven nights only

I saw Rhys for outpatient review with his community psychiatric nurse, Babajide Oyelaran. His sister, Carys Cadwallader, joined us by video for the second half.

Since his discharge from Section 2 of the Mental Health Act in June he has kept taking his lithium and returned to work as a scaffolder three days a week. Over the past month his mood has dropped. He wakes at four in the morning, has lost interest in rugby coaching and has lost 4 kg. His PHQ-9 score was 17. He has fleeting thoughts that his family would be better off without him but no plan or intent, and he says his young niece, Seren, is a strong reason to stay well. There were no psychotic symptoms.

The SSRI was stopped by my colleague because of the risk of switching him into mania, and I agree with that decision.

Results from 2 November: lithium level 0.72 mmol/L (12 hours after the dose), eGFR 94, TSH 2.1, calcium normal. ECG showed a QTc of 418 ms.

Plan:
- Quetiapine 300 mg as above. If no better in four weeks I will consider adding lamotrigine.
- Lithium level, U&E and TSH every three months, please. Avoid ibuprofen and other anti-inflammatories.
- Babajide will visit weekly and has updated the crisis plan. Carys holds a copy and can be contacted on 07700 900355.
- Review with me on 8 December 2026.

Yours sincerely,

Dr Katarzyna Zielinska
Consultant Psychiatrist
`,
    gold: [
      g('PERSON', 'Rhys'),
      g('PERSON', 'Cadwallader'),
      g('DOB', '26.07.1988'),
      g('ADDRESS', 'Bryn Awel'),
      g('ADDRESS', '5 Christchurch Hill'),
      g('POSTCODE', 'NP18 1JJ'),
      g('ID_NUMBER', '704 339 8162'),
      g('ID_NUMBER', 'MH/E/203377'),
      g('PERSON', 'Carys'),
      g('PERSON', 'Seren'),
      g('PHONE', '07700 900355'),
      g('PERSON', 'Hamish', 'other'),
      g('PERSON', 'Drummond', 'other'),
      g('PERSON', 'Babajide', 'other'),
      g('PERSON', 'Oyelaran', 'other'),
      g('PERSON', 'Katarzyna', 'other'),
      g('PERSON', 'Zielinska', 'other'),
    ],
    keep: [
      'Bipolar affective disorder',
      'Priadel',
      'lithium carbonate',
      'Quetiapine 300 mg',
      'Sertraline',
      'Zopiclone 3.75 mg',
      'PHQ-9 score was 17',
      'SSRI',
      'lithium level 0.72 mmol/L',
      'lamotrigine',
      'Section 2 of the Mental Health Act',
      '8 December 2026',
    ],
    medical: [
      'Bipolar affective disorder',
      'Priadel',
      'lithium carbonate',
      'Quetiapine 300 mg',
      'Sertraline',
      'Zopiclone 3.75 mg',
      'PHQ-9 score was 17',
      'SSRI',
      'lithium level 0.72 mmol/L',
      'lamotrigine',
    ],
    medicalHigh: [
      'Bipolar affective disorder',
      'Priadel',
      'Quetiapine 300 mg',
      'lithium level 0.72 mmol/L',
    ],
    quasi: ['Newport', 'scaffolder', 'Beechwood Surgery'],
  },
  {
    id: 'fmed-paediatric-kawasaki',
    title: 'Paediatric discharge letter',
    text: `Children's Ward (Kingfisher), Wyre Forest General Hospital
PAEDIATRIC DISCHARGE LETTER

Child: Haruto Yamamoto (known as Haru)
Born: 2 May 2023 (age 3 years 6 months)       Sex: M
NHS number: 327 615 0948        Unit number: K1184620
Home: 16 Sabrina Drive, Bewdley, DY12 2RA
Parents: Emiko Yamamoto (mother, 07700 900604) and Kenji Yamamoto (father)
Nursery: Little Herons, Bewdley
GP: Dr Elin Vaughan, Riverbank Health Centre

Admitted 1 November 2026, discharged 7 November 2026
Consultant paediatrician: Dr Oluwadamilare Akintola

DIAGNOSIS: Kawasaki disease (complete)

HISTORY
Six days of fever up to 39.8 that did not settle with paracetamol or with the amoxicillin started by the out-of-hours service. Red eyes without discharge, cracked red lips, a strawberry tongue, a blotchy rash over the trunk, swollen hands and feet, and a 2 cm gland in the left side of the neck. Very irritable.

Background: born at 39 weeks by forceps, Apgar score 9 at one minute and 10 at five minutes. Immunisations up to date including the first MMR. His older sister, Miyu, has Down's syndrome and had heart surgery as a baby, so the family were understandably anxious about his heart.

RESULTS
CRP 148    ESR 92    White cells 19.4    Platelets 512, rising to 780 on day 6
Urine: sterile pyuria. Blood culture: no growth. Throat swab negative.
Echocardiogram (3 November): coronary arteries normal in size, no aneurysm, good function.

TREATMENT
Intravenous immunoglobulin 2 g/kg as a single infusion over 12 hours on 2 November. Fever settled within 36 hours and did not return.

MEDICINE TO TAKE HOME
Aspirin 45 mg (dispersible) once a day for at least six weeks. Do not give ibuprofen while he is taking it.
Lansoprazole 15 mg once a day while on aspirin.

ADVICE AND FOLLOW-UP
- Repeat heart scan at two weeks and at six weeks; appointment for 20 November with Dr Akintola.
- Peeling of the fingertips in the next fortnight is expected.
- Live vaccines, including his second MMR, must be delayed for 11 months after immunoglobulin.
- Return to the ward (open access for 72 hours, telephone 01562 496 0125) if the fever comes back.

Discharging nurse: Sister Morag Buchanan
Letter written by Dr Seo-yeon Kwon, paediatric registrar
`,
    gold: [
      g('PERSON', 'Haruto'),
      g('PERSON', 'Yamamoto'),
      g('PERSON', 'Haru'),
      g('DOB', '2 May 2023'),
      g('ID_NUMBER', '327 615 0948'),
      g('ID_NUMBER', 'K1184620'),
      g('ADDRESS', '16 Sabrina Drive'),
      g('POSTCODE', 'DY12 2RA'),
      g('PERSON', 'Emiko'),
      g('PHONE', '07700 900604'),
      g('PERSON', 'Kenji'),
      g('PERSON', 'Miyu'),
      g('PERSON', 'Elin', 'other'),
      g('PERSON', 'Vaughan', 'other'),
      g('PERSON', 'Oluwadamilare', 'other'),
      g('PERSON', 'Akintola', 'other'),
      g('PERSON', 'Morag', 'other'),
      g('PERSON', 'Buchanan', 'other'),
      g('PERSON', 'Seo-yeon', 'other'),
      g('PERSON', 'Kwon', 'other'),
    ],
    keep: [
      'Kawasaki disease',
      'Apgar score',
      'MMR',
      "Down's syndrome",
      'CRP 148',
      'Echocardiogram',
      'Intravenous immunoglobulin 2 g/kg',
      'Aspirin 45 mg',
      'Lansoprazole 15 mg',
      'no aneurysm',
      '20 November',
      '11 months',
    ],
    medical: [
      'Kawasaki disease',
      'Apgar score',
      'MMR',
      "Down's syndrome",
      'CRP 148',
      'Echocardiogram',
      'Intravenous immunoglobulin 2 g/kg',
      'Aspirin 45 mg',
      'Lansoprazole 15 mg',
      'no aneurysm',
    ],
    medicalHigh: [
      'Kawasaki disease',
      'Intravenous immunoglobulin 2 g/kg',
      'Aspirin 45 mg',
      'no aneurysm',
    ],
    quasi: ['Bewdley', 'Little Herons', 'Wyre Forest General Hospital', 'Riverbank Health Centre'],
  },
  {
    id: 'fmed-maternity-discharge',
    title: 'Maternity discharge summary',
    text: `MATERNITY DISCHARGE SUMMARY (mother)
Princess Adelaide Maternity Unit, Luton

Mother
Name: Nusrat Chowdhury            Date of birth: 19 Aug 1991
NHS: 590 742 6631                 Maternity record: M26/04418
Address: 73 Farley Hill Crescent, Luton LU1 5HQ
Tel: 07700 900917                 Birth partner: Imran Chowdhury (husband)
Community midwife: Sinead Kavanagh, Dallow Road team
GP: Dr Jia Hui Teoh, Castle Street Medical Centre

Pregnancy
Second pregnancy, one previous normal birth (daughter Anika, 2022).
Gestational diabetes diagnosed at 27 weeks, treated with Metformin 500 mg twice daily and diet.
Pre-eclampsia diagnosed at 37 weeks + 2 days: blood pressure 158/102, urine protein:creatinine ratio 86, platelets 164. Started Labetalol 200 mg three times a day.
Vaginal swab at 36 weeks: group B streptococcus.
Blood group O RhD negative. Anti-D given at 28 weeks.

Labour and birth
Induction of labour at 37 weeks + 5 days on the advice of Mr Emeka Nwosu, consultant obstetrician. Bishop score 4 at the start. Propess for 24 hours, then artificial rupture of membranes and a Syntocinon infusion. Benzylpenicillin given in labour. Epidural sited by Dr Hana Kobayashi.
Normal vaginal birth on 5 November 2026 at 03:14. Second degree tear, sutured. Estimated blood loss 450 ml. Urinary Foley catheter removed after six hours.

Baby
Girl, 2,940 g. Apgar score 9 at 1 minute, 10 at 5 minutes. Baby's blood group is O RhD positive, so a further dose was given to the mother on 5 November. Breastfeeding well.

After the birth
Blood pressure 138/88 on the day of discharge. Haemoglobin 109.
Medicines to take home:
  Labetalol stopped. Nifedipine MR 20 mg twice daily started.
  Enoxaparin 40 mg injection once daily for 10 days
  Metformin - STOPPED at birth
  Paracetamol and Ibuprofen as needed

Plan
- Community midwife to check blood pressure on days 1, 3 and 5 at home. Call triage on 01582 496 0163 for a severe headache, flashing lights or pain under the ribs.
- GP to review blood pressure medicine at two weeks.
- Fasting glucose or HbA1c at 13 weeks after birth, then every year.

Discharged home 6 November 2026 by midwife Patience Owusu.
`,
    gold: [
      g('PERSON', 'Nusrat'),
      g('PERSON', 'Chowdhury'),
      g('DOB', '19 Aug 1991'),
      g('ID_NUMBER', '590 742 6631'),
      g('ID_NUMBER', 'M26/04418'),
      g('ADDRESS', '73 Farley Hill Crescent'),
      g('POSTCODE', 'LU1 5HQ'),
      g('PHONE', '07700 900917'),
      g('PERSON', 'Imran'),
      g('PERSON', 'Anika'),
      g('PERSON', 'Sinead', 'other'),
      g('PERSON', 'Kavanagh', 'other'),
      g('PERSON', 'Jia Hui', 'other'),
      g('PERSON', 'Teoh', 'other'),
      g('PERSON', 'Emeka', 'other'),
      g('PERSON', 'Nwosu', 'other'),
      g('PERSON', 'Hana', 'other'),
      g('PERSON', 'Kobayashi', 'other'),
      g('PERSON', 'Patience', 'other'),
      g('PERSON', 'Owusu', 'other'),
    ],
    keep: [
      'Gestational diabetes',
      'Metformin 500 mg twice daily',
      'Pre-eclampsia',
      'Labetalol 200 mg',
      'group B streptococcus',
      'Anti-D',
      'Bishop score 4',
      'Propess',
      'Foley catheter',
      'Nifedipine MR 20 mg twice daily',
      'Enoxaparin 40 mg',
      '13 weeks after birth',
    ],
    medical: [
      'Gestational diabetes',
      'Metformin 500 mg twice daily',
      'Pre-eclampsia',
      'Labetalol 200 mg',
      'group B streptococcus',
      'Anti-D',
      'Bishop score 4',
      'Propess',
      'Foley catheter',
      'Nifedipine MR 20 mg twice daily',
      'Enoxaparin 40 mg',
    ],
    medicalHigh: ['Gestational diabetes', 'Pre-eclampsia', 'Nifedipine MR 20 mg twice daily'],
    quasi: ['Luton', 'Princess Adelaide Maternity Unit', 'Castle Street Medical Centre'],
  },
  {
    id: 'fmed-orthopaedic-discharge',
    title: 'Orthopaedic discharge with medicines table',
    text: `Strathallan Orthopaedic Unit, Perth
Discharge summary and medicines list

Patient     Mr Alasdair MacLeod            CHI   1403480917
Born        14/03/1948                     Ward  Tay 3, bed 11
Address     Craigend Cottage, by Bridge of Earn, Perth PH2 9HB
Contact     01738 496 0144 (home)          Wife  Morven MacLeod, mobile 07700 900472
GP          Dr Shona Abernethy, Earnside Practice

Admission 2 November 2026        Discharge 6 November 2026
Surgeon   Mr Vikram Chatterjee   Anaesthetist  Dr Leila Haddad

Operation (2 November): Right total hip replacement, uncemented, under spinal anaesthetic with sedation.

Reason: End-stage osteoarthritis of the right hip. The pelvis X-ray also showed Paget's disease of the left hemipelvis, which was not known before; alkaline phosphatase was 312.

Other conditions: Dupuytren's contracture of both hands, high blood pressure, prostate cancer on active surveillance (Gleason score 3+3, PSA 6.1 in September). Retired gamekeeper.

Progress: Tranexamic acid 1 g was given at the start of surgery. Haemoglobin 104 on day 2, no transfusion needed. He was confused on the first night, which settled once the Oxycodone was stopped. Walking with two sticks and managing stairs on day 3 with physiotherapist Kelechi Ezeoke.

MEDICINES ON DISCHARGE
Medicine            Dose                Frequency              Duration     Status
Dalteparin          5,000 units s/c     once daily, evening    28 days      NEW (district nurse to give)
Paracetamol         1 g                 four times a day       2 weeks      NEW
Co-codamol 30/500   1 to 2 tablets      up to four times a day 5 days       NEW (not with Paracetamol)
Lactulose           10 ml               twice daily            when needed  NEW
Amlodipine          5 mg                each morning           long term    unchanged
Tamsulosin          400 micrograms      each morning           long term    unchanged
Oxycodone           -                   -                      -            STOPPED (confusion)

Allergy: Elastoplast (skin blistering). No drug allergies.

Follow-up
1. Clips out on 16 November at the practice.
2. Hip precautions for six weeks: no bending past 90 degrees, no crossing legs, no driving.
3. Outpatient review with Mr Chatterjee at six weeks with an X-ray on arrival.
4. GP please: check vitamin D and calcium and consider zoledronic acid for the bone disease; referral to the metabolic bone clinic has been made.

Staff nurse completing discharge: Dorota Mazur
`,
    gold: [
      g('PERSON', 'Alasdair'),
      g('PERSON', 'MacLeod'),
      g('ID_NUMBER', '1403480917'),
      g('DOB', '14/03/1948'),
      g('ADDRESS', 'Craigend Cottage'),
      g('POSTCODE', 'PH2 9HB'),
      g('PHONE', '01738 496 0144'),
      g('PERSON', 'Morven'),
      g('PHONE', '07700 900472'),
      g('PERSON', 'Shona', 'other'),
      g('PERSON', 'Abernethy', 'other'),
      g('PERSON', 'Vikram', 'other'),
      g('PERSON', 'Chatterjee', 'other'),
      g('PERSON', 'Leila', 'other'),
      g('PERSON', 'Haddad', 'other'),
      g('PERSON', 'Kelechi', 'other'),
      g('PERSON', 'Ezeoke', 'other'),
      g('PERSON', 'Dorota', 'other'),
      g('PERSON', 'Mazur', 'other'),
    ],
    keep: [
      'total hip replacement',
      'osteoarthritis',
      "Paget's disease",
      "Dupuytren's contracture",
      'Gleason score 3+3',
      'Tranexamic acid 1 g',
      'Haemoglobin 104',
      'Dalteparin',
      'Co-codamol 30/500',
      'Oxycodone',
      'zoledronic acid',
      'six weeks',
    ],
    medical: [
      'total hip replacement',
      'osteoarthritis',
      "Paget's disease",
      "Dupuytren's contracture",
      'Gleason score 3+3',
      'Tranexamic acid 1 g',
      'Haemoglobin 104',
      'Dalteparin',
      'Co-codamol 30/500',
      'Oxycodone',
      'zoledronic acid',
    ],
    medicalHigh: ['total hip replacement', "Paget's disease", 'Dalteparin', 'Oxycodone'],
    quasi: ['Perth', 'Retired gamekeeper', 'Earnside Practice', 'Bridge of Earn'],
  },
  {
    id: 'fmed-vaccination-record',
    title: 'Vaccination record before immunosuppression',
    text: `IMMUNISATION RECORD AND PRE-TREATMENT CHECKLIST
Lark Hill Surgery, Salford        Printed 12 November 2026

Surname:      Mahlangu-Fraser
Forename:     Nomvula
Born:         05.10.1968
NHS number:   812 447 0396
Address:      2 Weaste Lane Mews, Salford, M5 5JF
Mobile:       07700 900139
Email:        nomvula.mf@larkmail.example

Reason for review: due to start rituximab for granulomatosis with polyangiitis (Wegener's) under the vasculitis clinic. Live vaccines must be given at least four weeks before treatment or not at all.

Vaccine                       Brand / batch            Date given    Site       Given by
Tetanus/diphtheria/polio      Revaxis  U3K21           11/06/2019    L arm      S. Whitcombe
Hepatitis B (dose 3)          Engerix B  AHB7714       02/02/2015    R arm      S. Whitcombe
MMR (dose 1)                  no record                -             -          -
MMR (dose 2)                  no record                -             -          -
Pneumococcal (PCV20)          Prevenar 20  HN6630      20/10/2026    L arm      Olamide Ajayi
Influenza (inactivated)       batch FL2291             20/10/2026    R arm      Olamide Ajayi
COVID-19 autumn booster       Comirnaty  GK0048        27/10/2026    L arm      Pharmacy
Shingrix (dose 1)             batch 4ZT9P              27/10/2026    R arm      Pharmacy
Shingrix (dose 2)             DUE                      from 22/12/2026

Checks
- Measles IgG: positive (immune). Rubella IgG: positive. No catch-up dose needed.
- Varicella zoster IgG: positive.
- Hepatitis B surface antibody 4 mIU/ml: not protected. Booster given today, L arm, by Olamide Ajayi (practice nurse).
- Mantoux test not done; interferon gamma (TB) blood test negative on 15 October.
- BCG scar present, left upper arm.
- Yellow fever and other live travel vaccines: must NOT be given once treatment starts. She visits family in Durban most years, so this was discussed.

Current medicines: Prednisolone 40 mg daily (reducing), Co-trimoxazole 960 mg three times a week, Alendronic acid 70 mg weekly, Adcal-D3.
Allergy: Penicillin (anaphylaxis, 1996).

Notes: Her husband, Euan Fraser, and son Sipho (17) live with her; both advised to have the flu vaccine.

Checked by Dr Wojciech Kaczmarek. Copy sent to Dr Roisin Kennedy, Consultant Rheumatologist, Irwell Vasculitis Service.
`,
    gold: [
      g('PERSON', 'Mahlangu-Fraser'),
      g('PERSON', 'Nomvula'),
      g('DOB', '05.10.1968'),
      g('ID_NUMBER', '812 447 0396'),
      g('ADDRESS', '2 Weaste Lane Mews'),
      g('POSTCODE', 'M5 5JF'),
      g('PHONE', '07700 900139'),
      g('EMAIL', 'nomvula.mf@larkmail.example'),
      g('PERSON', 'Euan'),
      g('PERSON', 'Fraser'),
      g('PERSON', 'Sipho'),
      g('PERSON', 'Whitcombe', 'other'),
      g('PERSON', 'Olamide', 'other'),
      g('PERSON', 'Ajayi', 'other'),
      g('PERSON', 'Wojciech', 'other'),
      g('PERSON', 'Kaczmarek', 'other'),
      g('PERSON', 'Roisin', 'other'),
      g('PERSON', 'Kennedy', 'other'),
    ],
    keep: [
      'rituximab',
      'granulomatosis with polyangiitis',
      "Wegener's",
      'Revaxis',
      'Engerix B',
      'MMR',
      'Prevenar 20',
      'Shingrix',
      'Mantoux test',
      'Hepatitis B surface antibody',
      'Penicillin',
      'four weeks',
    ],
    medical: [
      'rituximab',
      'granulomatosis with polyangiitis',
      "Wegener's",
      'Revaxis',
      'Engerix B',
      'MMR',
      'Prevenar 20',
      'Shingrix',
      'Mantoux test',
      'Hepatitis B surface antibody',
      'Penicillin',
    ],
    medicalHigh: ['rituximab', 'granulomatosis with polyangiitis', 'Penicillin'],
    quasi: ['Salford', 'Durban', 'Lark Hill Surgery'],
  },
  {
    id: 'fmed-optometry-record',
    title: 'Optometry sight test record',
    text: `CLEARWATER OPTICIANS - Sight test record
Branch: 12 Market Hill, Huntingdon

Record no: CW-0098812
Title: Mr
First name: Hamza
Last name: Bouzid
Date of birth: 1961-12-03
Address line 1: 58 Hartford Road
Town: Huntingdon
Postcode: PE29 3RJ
Home phone: 01632 960442
Email: hbouzid61@fenpost.example
Occupation: HGV driver (Group 2 licence)
GP: Dr Chloe Ashdown, Priory Fields Surgery
Test date: 2026-11-11
Optometrist: Hye-jin Park
Dispensing optician: Rafael Monteiro

Reason for visit: Routine diabetic check, reports haloes round headlights at night.
General health: Type 2 diabetes (15 years), high blood pressure.
Medication: Metformin, Gliclazide, Ramipril, Atorvastatin. Latanoprost drops stopped by patient 'months ago'.
Family history: Father had glaucoma. Brother, Karim, has Marfan syndrome with lens dislocation.
Last diabetic eye screening: March 2025, background diabetic retinopathy both eyes.

Unaided vision (Snellen chart): R 6/18  L 6/12
Best corrected: R 6/9  L 6/6
Prescription: R -1.25/-0.50 x 90   L -0.75 DS   Add +2.00
Pupils: equal and reactive, no relative afferent defect
Intraocular pressure (Goldmann tonometry, 10:15): R 27 mmHg  L 24 mmHg
Visual fields (Humphrey 24-2): R superior arcuate defect, L full
Anterior eye: R early nuclear cataract. Van Herick grade 3 both eyes, angles open.
Fundus (dilated with Tropicamide 1%): R cup to disc ratio 0.75 with inferior notch, L 0.5. Scattered microaneurysms both eyes, no maculopathy.
OCT scan: R retinal nerve fibre layer thinning inferiorly. Maculae dry.
Amsler grid: normal each eye.

Impression: Primary open angle glaucoma R more than L, not currently treated. Background diabetic retinopathy, stable.

Action:
- Urgent referral (within 2 weeks) to the glaucoma clinic, Mr Tunde Adebanjo, Ouse Valley Eye Unit.
- Patient told to restart Latanoprost one drop each eye at night and collect a prescription from his GP.
- Meets the Group 2 driving standard for acuity today; field result must be reviewed by the hospital. Patient advised to tell the DVLA of the diagnosis.
- New distance spectacles ordered. Recall 12 months, or as the hospital advises.

Patient consent to share with GP and hospital: yes
`,
    gold: [
      g('ID_NUMBER', 'CW-0098812'),
      g('PERSON', 'Hamza'),
      g('PERSON', 'Bouzid'),
      g('DOB', '1961-12-03'),
      g('ADDRESS', '58 Hartford Road'),
      g('POSTCODE', 'PE29 3RJ'),
      g('PHONE', '01632 960442'),
      g('EMAIL', 'hbouzid61@fenpost.example'),
      g('PERSON', 'Karim'),
      g('PERSON', 'Chloe', 'other'),
      g('PERSON', 'Ashdown', 'other'),
      g('PERSON', 'Hye-jin', 'other'),
      g('PERSON', 'Park', 'other'),
      g('PERSON', 'Rafael', 'other'),
      g('PERSON', 'Monteiro', 'other'),
      g('PERSON', 'Tunde', 'other'),
      g('PERSON', 'Adebanjo', 'other'),
    ],
    keep: [
      'Latanoprost',
      'glaucoma',
      'Marfan syndrome',
      'diabetic retinopathy',
      'Snellen chart',
      'Goldmann tonometry',
      'R 27 mmHg',
      'cataract',
      'OCT scan',
      'Amsler grid',
      'Tropicamide 1%',
      '12 months',
    ],
    medical: [
      'Latanoprost',
      'glaucoma',
      'Marfan syndrome',
      'diabetic retinopathy',
      'Snellen chart',
      'Goldmann tonometry',
      'R 27 mmHg',
      'cataract',
      'OCT scan',
      'Amsler grid',
      'Tropicamide 1%',
    ],
    medicalHigh: ['Latanoprost', 'glaucoma', 'R 27 mmHg'],
    quasi: ['Huntingdon', 'HGV driver', 'Priory Fields Surgery', 'Ouse Valley Eye Unit'],
  },
  {
    id: 'fmed-renal-clinic',
    title: 'Kidney clinic letter, planning for dialysis',
    text: `Kidney Unit, Queen Matilda Hospital, Colchester
Advanced Kidney Care Clinic - 5 November 2026

To: Dr Benedict Marlow, The Hythe Surgery
Copy to: the patient

Mr Kwame Mensah-Boateng   Born 23 January 1963
Flat 2, 109 Greenstead Road, Colchester CO1 2SP
NHS number 447 905 2281   Renal unit number QM-RU-30554

Problems
1. Chronic kidney disease stage 4 due to IgA nephropathy (biopsy 2014)
2. Hypertension
3. Renal anaemia
4. Secondary hyperparathyroidism
5. Gout

Results today (previous in brackets)
Creatinine 268 (241)        eGFR 22 (25)
Potassium 5.6               Bicarbonate 18
Haemoglobin 96              Ferritin 88
Phosphate 1.62              Parathyroid hormone 31.4
Urine albumin:creatinine ratio 184
Blood pressure 146/86       Weight 91.2 kg

Dear Dr Marlow,

Mr Mensah-Boateng came with his wife, Abena. He remains well, still working full time as a train guard, with some itching and tiredness but a good appetite. His kidney function has fallen by about 4 points a year and I expect he will need dialysis or a transplant within 18 months to two years.

We talked through the options with Jelena Markovic, our kidney care nurse. He would like a transplant, and his brother, Kofi Boateng, who lives in Kumasi, has offered to be tested as a living donor. In case a transplant is not ready in time he has chosen haemodialysis rather than peritoneal dialysis. I have referred him to Miss Preeti Venkataraman, vascular surgeon, for fistula formation in the left arm; a Doppler scan for vein mapping is booked for 24 November.

Changes today
- Sodium bicarbonate 500 mg three times a day started for acidosis.
- Darbepoetin alfa 30 micrograms every two weeks to start after an iron infusion (Ferinject 1 g) next Tuesday.
- Losartan reduced from 100 mg to 50 mg because of the potassium.
- Alfacalcidol 0.25 micrograms once daily and Allopurinol 100 mg to continue.
- No anti-inflammatory painkillers; for gout flares please use a short course of prednisolone, not naproxen.

I will see him in eight weeks with bloods a week before. He would like letters sent by email to abena.mb@hythemail.example.

Kind regards,

Dr Lorcan Fitzgerald
Consultant Nephrologist
`,
    gold: [
      g('PERSON', 'Kwame'),
      g('PERSON', 'Mensah-Boateng'),
      g('DOB', '23 January 1963'),
      g('ADDRESS', '109 Greenstead Road'),
      g('POSTCODE', 'CO1 2SP'),
      g('ID_NUMBER', '447 905 2281'),
      g('ID_NUMBER', 'QM-RU-30554'),
      g('PERSON', 'Abena'),
      g('PERSON', 'Kofi'),
      g('PERSON', 'Boateng'),
      g('EMAIL', 'abena.mb@hythemail.example'),
      g('PERSON', 'Benedict', 'other'),
      g('PERSON', 'Marlow', 'other'),
      g('PERSON', 'Jelena', 'other'),
      g('PERSON', 'Markovic', 'other'),
      g('PERSON', 'Preeti', 'other'),
      g('PERSON', 'Venkataraman', 'other'),
      g('PERSON', 'Lorcan', 'other'),
      g('PERSON', 'Fitzgerald', 'other'),
    ],
    keep: [
      'Chronic kidney disease stage 4',
      'IgA nephropathy',
      'eGFR 22',
      'Potassium 5.6',
      'Parathyroid hormone',
      'haemodialysis',
      'fistula formation',
      'Doppler scan',
      'Sodium bicarbonate 500 mg',
      'Darbepoetin alfa 30 micrograms',
      'Losartan',
      'eight weeks',
    ],
    medical: [
      'Chronic kidney disease stage 4',
      'IgA nephropathy',
      'eGFR 22',
      'Potassium 5.6',
      'Parathyroid hormone',
      'haemodialysis',
      'fistula formation',
      'Doppler scan',
      'Sodium bicarbonate 500 mg',
      'Darbepoetin alfa 30 micrograms',
      'Losartan',
    ],
    medicalHigh: [
      'Chronic kidney disease stage 4',
      'eGFR 22',
      'haemodialysis',
      'Darbepoetin alfa 30 micrograms',
    ],
    quasi: ['Colchester', 'train guard', 'Kumasi', 'The Hythe Surgery'],
  },
  {
    id: 'fmed-surgical-discharge-long',
    title: 'Emergency surgery discharge summary (long)',
    text: `ST AELRED'S UNIVERSITY HOSPITAL, MIDDLESBROUGH
Department of Colorectal Surgery - Ward 9
DISCHARGE SUMMARY

PATIENT DETAILS
Mrs Parveen Akhtar-Hussain                      Female, 67
Date of birth: 11 July 1959                     NHS number: 239 580 6617
Hospital number: SA5540092                      Episode: E-2026-118834
34 Linthorpe Mews, Middlesbrough, TS5 6DN       Home: 01642 496 0112
Next of kin: Javed Hussain (husband), 07700 900058
Daughter (main carer after discharge): Sameena Hussain, sameena.h@teesnet.example
GP: Dr Gareth Prosser, Acklam Green Surgery

Date of admission: 18 October 2026 (emergency, via A&E)
Date of discharge: 30 October 2026
Consultant: Miss Oyinkansola Fashola

DIAGNOSES
1. Perforated sigmoid diverticulitis with faecal peritonitis (Hinchey IV)
2. Post-operative ileus, resolved
3. Hospital-acquired Clostridioides difficile infection, treated
4. Type 2 diabetes, atrial fibrillation (long-standing)

OPERATION
18 October 2026: Emergency laparotomy, Hartmann's procedure and washout, with formation of an end colostomy in the left iliac fossa. Surgeon Miss Fashola, assisted by Mr Rohan Weerasinghe. Anaesthetist Dr Lukas Novotny.

PRESENTATION
Two days of lower abdominal pain, at first on the left, becoming generalised, with vomiting and fever. Her husband called 999 when she became drowsy. In the emergency department: temperature 38.9, pulse 124 irregular, blood pressure 86/50, Glasgow Coma Scale 14 (confused), rising to 15 after fluids. The abdomen was rigid with guarding throughout; there was no particular tenderness at McBurney's point. Lactate 4.3, CRP 312, white cells 21.7, creatinine 148 (baseline 80).

A CT abdomen and pelvis showed free gas and fluid around a thickened sigmoid colon with multiple diverticula. The appendix was normal.

She was given 2 litres of Hartmann's solution, intravenous Tazocin and Gentamicin, and went to theatre within three hours of arrival. Her Apixaban had last been taken that morning; surgery went ahead after discussion with the on-call haematologist.

PROGRESS
Intensive care for two nights for noradrenaline and monitoring, then Ward 9. Kidney function recovered (creatinine 84 by day 5). A nasogastric tube was needed for four days for ileus, with feeding through a vein (parenteral nutrition) from day 4 to day 8. The Foley catheter was removed on day 6.

On day 8 she developed frequent watery output from the stoma. Stool tested positive for Clostridioides difficile toxin. The intravenous antibiotics were stopped and she was started on Vancomycin 125 mg by mouth four times a day; the last dose is due on 4 November. She was nursed in a side room.

The midline wound has a 2 cm superficial gap at its lower end, packed daily. Swab grew mixed skin organisms only.

Histology: diverticular disease with perforation and abscess. No malignancy.

STOMA
Mrs Akhtar-Hussain and her daughter have been taught to empty and change the bag by Bridget Halloran, stoma care nurse, and managed two changes on their own. The stoma is pink and working. She raised questions about ablution before prayer and about fasting; written advice has been given and Bridget will follow this up at home.

MEDICINES ON DISCHARGE
Vancomycin 125 mg capsules four times a day - until 4 November, then stop
Apixaban 5 mg twice daily - restarted 25 October
Enoxaparin - stopped when Apixaban restarted
Bisoprolol 5 mg once daily - unchanged
Metformin 1 g twice daily - restarted 27 October
Paracetamol 1 g four times a day
Dihydrocodeine 30 mg when needed, up to four times a day - short course, 28 tablets
Loperamide - do NOT use until the infection has cleared
Omeprazole - STOPPED (raises the risk of the bowel infection coming back)
Stoma supplies: listed on the attached sheet, first delivery arranged

ALLERGIES
Trimethoprim (widespread rash, 2020). Latex.

FOLLOW-UP AND REQUESTS
- District nurses: daily wound packing; referral sent to the Linthorpe team.
- Stoma nurse home visit on 3 November.
- Surgical clinic with Miss Fashola in six weeks. Reversal may be considered after six months, following a colonoscopy or CT colonography to check the rest of the bowel.
- GP: please repeat FBC and U&E in one week (haemoglobin 94 on discharge) and avoid broad-spectrum antibiotics where possible. Please do not restart Omeprazole.
- She must not drive or lift anything heavier than a kettle for six weeks.

Mrs Akhtar-Hussain was a school lunchtime supervisor until last year and lives with her husband in a house with a downstairs toilet.

Summary written by Dr Thandiwe Mokoena, Foundation Doctor. Checked by Mr Weerasinghe.
`,
    gold: [
      g('PERSON', 'Parveen'),
      g('PERSON', 'Akhtar-Hussain'),
      g('DOB', '11 July 1959'),
      g('ID_NUMBER', '239 580 6617'),
      g('ID_NUMBER', 'SA5540092'),
      g('ID_NUMBER', 'E-2026-118834'),
      g('ADDRESS', '34 Linthorpe Mews'),
      g('POSTCODE', 'TS5 6DN'),
      g('PHONE', '01642 496 0112'),
      g('PERSON', 'Javed'),
      g('PERSON', 'Hussain'),
      g('PHONE', '07700 900058'),
      g('PERSON', 'Sameena'),
      g('EMAIL', 'sameena.h@teesnet.example'),
      g('PERSON', 'Gareth', 'other'),
      g('PERSON', 'Prosser', 'other'),
      g('PERSON', 'Oyinkansola', 'other'),
      g('PERSON', 'Fashola', 'other'),
      g('PERSON', 'Rohan', 'other'),
      g('PERSON', 'Weerasinghe', 'other'),
      g('PERSON', 'Lukas', 'other'),
      g('PERSON', 'Novotny', 'other'),
      g('PERSON', 'Bridget', 'other'),
      g('PERSON', 'Halloran', 'other'),
      g('PERSON', 'Thandiwe', 'other'),
      g('PERSON', 'Mokoena', 'other'),
    ],
    keep: [
      'diverticulitis',
      "Hartmann's procedure",
      'colostomy',
      'Clostridioides difficile',
      'Glasgow Coma Scale 14',
      "McBurney's point",
      "Hartmann's solution",
      'CT abdomen and pelvis',
      'Vancomycin 125 mg',
      'Tazocin',
      'Trimethoprim',
      'six weeks',
    ],
    medical: [
      'diverticulitis',
      "Hartmann's procedure",
      'colostomy',
      'Clostridioides difficile',
      'Glasgow Coma Scale 14',
      "McBurney's point",
      "Hartmann's solution",
      'CT abdomen and pelvis',
      'Vancomycin 125 mg',
      'Tazocin',
      'Trimethoprim',
    ],
    medicalHigh: [
      'diverticulitis',
      "Hartmann's procedure",
      'Clostridioides difficile',
      'Vancomycin 125 mg',
      'Trimethoprim',
    ],
    quasi: ['Middlesbrough', 'school lunchtime supervisor', 'Acklam Green Surgery'],
  },
  {
    id: 'fmed-medication-review-long',
    title: 'Structured medication review (long)',
    text: `STRUCTURED MEDICATION REVIEW
Meadowbank Primary Care Network - Clinical Pharmacy Team
Held at: Ashgrove Surgery, Wolverhampton, on Tuesday 10 November 2026 (40-minute appointment, face to face)

Patient: Mrs Aminata N'Diaye          Age 74      DOB 28-02-1952
NHS No: 365 118 7740                  EMIS No: 0044817
Address: 15 Penn Fields Close, Wolverhampton WV3 7EX
Phone: 07700 900671 (text reminders on)
Present: patient; her son Moussa N'Diaye, who collects her medicines and fills her weekly pill organiser
Reviewer: Bartosz Lewandowski, Senior Clinical Pharmacist (independent prescriber)
Usual GP: Dr Meera Pillai
Reason: 11 regular medicines; two falls since August; invited after hospital letter of 21 October

PROBLEM LIST
Type 2 diabetes (2009) with peripheral neuropathy; right Charcot foot (2022), under podiatry
Hypertension
Chronic kidney disease stage 3a
Hypothyroidism
Asthma
Osteoporosis; Colles' fracture of the left wrist, August 2026, after a fall in the garden
Depression (2019), in remission

RECENT RESULTS (3 November 2026)
HbA1c 61 mmol/mol (was 58)       eGFR 49          Potassium 4.4
TSH 5.9 (range 0.4 to 4.5)       Sodium 131 (low) Total cholesterol 3.8
Lying and standing blood pressure: 128/70 lying, 104/62 after one minute standing, with dizziness
Urine albumin:creatinine ratio 6.2

MEDICINES REVIEWED
Medicine                          Dose and how taken              Decision
Metformin MR                      1 g twice daily                 Continue. Dose is suitable for kidney function.
Gliclazide                        80 mg twice daily               REDUCE to 40 mg twice daily. Two readings under 4.0 before lunch; hypo risk and falls.
Jardiance (empagliflozin)         10 mg each morning              Continue. Sick day rules explained again.
Amlodipine                        10 mg each morning              REDUCE to 5 mg. Postural drop and ankle swelling.
Ramipril                          5 mg at night                   Continue.
Bendroflumethiazide               2.5 mg each morning             STOP. Low sodium, postural drop, and no longer needed with the above.
Atorvastatin                      40 mg at night                  Continue.
Levothyroxine                     75 micrograms each morning      Continue, but TAKE SEPARATELY: has been taken with Adcal-D3, which blocks absorption. Repeat TSH in 8 weeks before any dose change.
Sertraline                        100 mg each morning             Continue for now. SSRI can lower sodium; recheck after stopping the water tablet. Discuss slow reduction at next review.
Amitriptyline                     25 mg at night (for foot pain)  STOP over 4 weeks (10 mg for 2 weeks, then stop). Drowsiness, falls, high anticholinergic burden.
Duloxetine                        -                               NOT started: would interact with Sertraline. Refer to GP to consider alternatives for neuropathic pain.
Alendronic acid                   70 mg once weekly (Mondays)     Continue. Correct technique confirmed (upright, full glass of water, 30 minutes before food).
Adcal-D3 chewable                 one tablet twice daily          Continue, at lunchtime and bedtime, 4 hours apart from Levothyroxine.
Symbicort Turbohaler 200/6        two puffs twice daily           Continue. Technique good. Peak flow 310.
Salbutamol inhaler                when needed                     Continue. Uses about once a week.
Naproxen (bought over the counter) 250 mg when needed             STOP. Kidney risk with Ramipril and Jardiance. Use Paracetamol.

WHAT MATTERS TO THE PATIENT
Mrs N'Diaye's main worry is falling again; she has stopped going to the Senegalese women's lunch club at the community centre. She would like fewer tablets in the morning. She fasts during Ramadan and wants advice before next year.

AGREED ACTIONS
1. Changes above made on the repeat template today; new pill organiser chart given to Moussa. Number of regular medicines reduced from 11 to 9.
2. Home blood glucose diary for two weeks after the Gliclazide change. Telephone review with me on 24 November.
3. Bloods (U&E, TSH) in 8 weeks: form given.
4. Referral to the falls service and to community physiotherapy for strength and balance classes.
5. Podiatry informed that Amitriptyline is being stopped; total contact cast review continues with Folake Adeniran, diabetes specialist podiatrist.
6. Shingrix and pneumococcal vaccines are outstanding; booked with healthcare assistant Shanice Okoro for 17 November.
7. Dr Pillai asked to review neuropathic pain options and to code moderate frailty (Rockwood score 5).

Next structured medication review: 6 months, or sooner after any hospital admission.

Consent: Mrs N'Diaye agreed that this summary can be shared with her son and with Penn Fields Pharmacy.
`,
    gold: [
      g('PERSON', 'Aminata'),
      g('PERSON', "N'Diaye"),
      g('DOB', '28-02-1952'),
      g('ID_NUMBER', '365 118 7740'),
      g('ID_NUMBER', '0044817'),
      g('ADDRESS', '15 Penn Fields Close'),
      g('POSTCODE', 'WV3 7EX'),
      g('PHONE', '07700 900671'),
      g('PERSON', 'Moussa'),
      g('PERSON', 'Bartosz', 'other'),
      g('PERSON', 'Lewandowski', 'other'),
      g('PERSON', 'Meera', 'other'),
      g('PERSON', 'Pillai', 'other'),
      g('PERSON', 'Folake', 'other'),
      g('PERSON', 'Adeniran', 'other'),
      g('PERSON', 'Shanice', 'other'),
      g('PERSON', 'Okoro', 'other'),
    ],
    keep: [
      'Charcot foot',
      "Colles' fracture",
      'HbA1c 61 mmol/mol',
      'eGFR 49',
      'Gliclazide',
      'Jardiance',
      'Bendroflumethiazide',
      'Levothyroxine',
      'Amitriptyline',
      'anticholinergic burden',
      'Symbicort Turbohaler',
      '24 November',
    ],
    medical: [
      'Charcot foot',
      "Colles' fracture",
      'HbA1c 61 mmol/mol',
      'eGFR 49',
      'Gliclazide',
      'Jardiance',
      'Bendroflumethiazide',
      'Levothyroxine',
      'Amitriptyline',
      'anticholinergic burden',
      'Symbicort Turbohaler',
    ],
    medicalHigh: ['HbA1c 61 mmol/mol', 'Gliclazide', 'Bendroflumethiazide', 'Amitriptyline'],
    quasi: ['Wolverhampton', 'Ashgrove Surgery', "Senegalese women's lunch club"],
  },
  {
    id: 'fmed-pathology-melanoma',
    title: 'Histopathology report, skin excision',
    text: `CELLULAR PATHOLOGY REPORT
Pennine Pathology Partnership, Laboratory 2, Oldham

Lab number: H26-048817                   Report status: AUTHORISED
Patient: HORVATHOVA, Ludmila             Sex: F
DOB: 16/06/1979                          NHS: 508 331 2674
Hospital no: OL2291045                   Address: 7 Coppice Bank, Oldham OL8 4QF
Requesting clinician: Dr Chinedu Ugwu, Consultant Dermatologist
Location: Skin cancer clinic (two-week wait)
Specimen taken: 29/10/2026     Received: 30/10/2026     Reported: 09/11/2026

CLINICAL DETAILS
Changing pigmented lesion left calf, 9 mm, irregular border, blue-white veil on dermoscopy. Excision biopsy with 2 mm margin. ?melanoma. History of heavy sunbed use. Mother (Mrs Jarmila Horvathova) had basal cell carcinoma. Patient is 14 weeks pregnant.

MACROSCOPIC DESCRIPTION
Skin ellipse 24 x 11 x 6 mm bearing a variegated brown-black lesion 9 x 8 mm, 3 mm from the nearest margin. Serially sliced and all embedded in 6 blocks.

MICROSCOPIC DESCRIPTION
Invasive malignant melanoma, superficial spreading type, arising in association with a pre-existing dysplastic naevus.
  Breslow thickness:            1.4 mm
  Clark level:                  IV
  Ulceration:                   not present
  Mitotic rate:                 2 per square mm
  Microsatellites:              not seen
  Lymphovascular invasion:      not seen
  Perineural invasion:          not seen
  Peripheral margin:            clear by 2.1 mm
  Deep margin:                  clear by 3.8 mm
Immunohistochemistry: tumour cells positive for S100, Melan-A and SOX10.

DIAGNOSIS
Skin, left calf, excision: MALIGNANT MELANOMA, without ulceration. Completely excised.
Pathological stage (AJCC 8th edition): pT2a

COMMENT
This case meets the criteria for discussion at the skin cancer multidisciplinary meeting on 17/11/2026. A wide local excision with a 1 cm margin and consideration of sentinel lymph node biopsy would be usual at this thickness; the pregnancy will need to be taken into account in the timing and in the choice of tracer. BRAF mutation testing has not been requested.

A separate specimen from the same clinic visit (H26-048818, right forearm shave) shows Bowen's disease, completely excised.

Reported by: Dr Soo-Min Hwang, Consultant Histopathologist
Second opinion: Dr Fergus Dalgleish
Biomedical scientist: Agata Wojcik
Results telephoned to the skin cancer nurse specialist, Tamika Rowe, at 14:05 on 09/11/2026.
`,
    gold: [
      g('ID_NUMBER', 'H26-048817'),
      g('PERSON', 'HORVATHOVA'),
      g('PERSON', 'Ludmila'),
      g('DOB', '16/06/1979'),
      g('ID_NUMBER', '508 331 2674'),
      g('ID_NUMBER', 'OL2291045'),
      g('ADDRESS', '7 Coppice Bank'),
      g('POSTCODE', 'OL8 4QF'),
      g('PERSON', 'Jarmila'),
      g('PERSON', 'Horvathova'),
      g('ID_NUMBER', 'H26-048818'),
      g('PERSON', 'Chinedu', 'other'),
      g('PERSON', 'Ugwu', 'other'),
      g('PERSON', 'Soo-Min', 'other'),
      g('PERSON', 'Hwang', 'other'),
      g('PERSON', 'Fergus', 'other'),
      g('PERSON', 'Dalgleish', 'other'),
      g('PERSON', 'Agata', 'other'),
      g('PERSON', 'Wojcik', 'other'),
      g('PERSON', 'Tamika', 'other'),
      g('PERSON', 'Rowe', 'other'),
    ],
    keep: [
      'malignant melanoma',
      'Breslow thickness',
      '1.4 mm',
      'Clark level',
      'basal cell carcinoma',
      'dysplastic naevus',
      'wide local excision',
      'sentinel lymph node biopsy',
      "Bowen's disease",
      'pT2a',
      '14 weeks pregnant',
      '17/11/2026',
    ],
    medical: [
      'malignant melanoma',
      'Breslow thickness',
      '1.4 mm',
      'Clark level',
      'basal cell carcinoma',
      'dysplastic naevus',
      'wide local excision',
      'sentinel lymph node biopsy',
      "Bowen's disease",
      'pT2a',
      '14 weeks pregnant',
    ],
    medicalHigh: ['malignant melanoma', '1.4 mm', 'pT2a', '14 weeks pregnant'],
    quasi: ['Oldham', 'Pennine Pathology Partnership'],
  },
  {
    id: 'fmed-referral-form-ent',
    title: 'GP referral form to the balance clinic',
    text: `REFERRAL FORM: ENT / BALANCE CLINIC
Priority: [ ] Urgent suspected cancer   [x] Urgent   [ ] Routine
Date of referral: 12/11/2026

REFERRER
Referring GP: Dr Olumide Fagbemi
Practice: Cwm Taf Health Centre, Pontypridd      Practice code: W95-0412
Typed by: Nerys (medical secretary)

REFERRED TO
Service: Audiovestibular Medicine, Glan Rhondda Hospital
Named clinician (if any): Mr Dariusz Kaminski

PATIENT
Title: Mrs       Forename(s): Eleri Wyn       Surname: Bowen
Previous surname: Protheroe
Date of birth: 04/04/1970       Gender: Female
NHS number: 627 840 1195
Address: Gelli Deg, 12 Graigwen Road, Pontypridd
Postcode: CF37 2EG
Mobile: 07700 900284          Home: 01443 496 0157
Email: eleri.bowen70@cwmpost.example
Preferred language: Welsh       Interpreter: not needed
Carer / next of kin: Dafydd Bowen (husband), same address
Occupation: primary school teaching assistant

REASON FOR REFERRAL
Suspected Ménière's disease, left ear. Third attack in ten weeks.

HISTORY
Episodes of spinning vertigo lasting 2 to 5 hours with vomiting, each preceded by a feeling of fullness and roaring tinnitus in the left ear. Hearing on the left is muffled for a day or two afterwards and has not fully returned after the latest attack on 6 November. No headache, no weakness, no double vision. She has had to stop driving and has been off work since 9 November.

EXAMINATION (10/11/2026, between attacks)
Ear drums normal. Weber test lateralises to the right; Rinne test positive both sides. No nystagmus at rest. Dix-Hallpike test negative both sides, so an Epley manoeuvre was not attempted. Unterberger's test rotates to the left. Cranial nerves otherwise normal. Blood pressure 124/78.

INVESTIGATIONS
Practice audiogram 10/11/2026: left low-frequency sensorineural loss, 40 dB at 250 and 500 Hz. Right normal.
FBC, TSH and HbA1c normal. MRI of the internal auditory meatus requested 12/11/2026 to exclude an acoustic neuroma.

PAST MEDICAL HISTORY
Migraine with aura (no attacks since 2019). Bell's palsy, left, 2008. Hypothyroidism.

CURRENT MEDICATION
Betahistine 16 mg three times a day (started 10/11/2026)
Prochlorperazine 3 mg buccal tablets, for attacks only, maximum three days
Levothyroxine 100 micrograms daily

ALLERGIES
Cinnarizine: swollen lips.

WHAT THE PATIENT HAS BEEN TOLD
That this may be an inner ear condition; low salt diet advice given; DVLA advice given.

ATTACHMENTS: audiogram, medication summary
Signed electronically: Dr O. Fagbemi, GMC 7098123
`,
    gold: [
      g('PERSON', 'Eleri'),
      g('PERSON', 'Wyn'),
      g('PERSON', 'Bowen'),
      g('PERSON', 'Protheroe'),
      g('DOB', '04/04/1970'),
      g('ID_NUMBER', '627 840 1195'),
      g('ADDRESS', 'Gelli Deg'),
      g('ADDRESS', '12 Graigwen Road'),
      g('POSTCODE', 'CF37 2EG'),
      g('PHONE', '07700 900284'),
      g('PHONE', '01443 496 0157'),
      g('EMAIL', 'eleri.bowen70@cwmpost.example'),
      g('PERSON', 'Dafydd'),
      g('PERSON', 'Olumide', 'other'),
      g('PERSON', 'Fagbemi', 'other'),
      g('PERSON', 'Nerys', 'other'),
      g('PERSON', 'Dariusz', 'other'),
      g('PERSON', 'Kaminski', 'other'),
      g('ID_NUMBER', '7098123', 'other'),
    ],
    keep: [
      "Ménière's disease",
      'tinnitus',
      'Dix-Hallpike test',
      'Epley manoeuvre',
      'Weber test',
      'Rinne test',
      'sensorineural loss',
      'acoustic neuroma',
      'Betahistine 16 mg',
      'Prochlorperazine 3 mg',
      'Cinnarizine',
      '6 November',
    ],
    medical: [
      "Ménière's disease",
      'tinnitus',
      'Dix-Hallpike test',
      'Epley manoeuvre',
      'Weber test',
      'Rinne test',
      'sensorineural loss',
      'acoustic neuroma',
      'Betahistine 16 mg',
      'Prochlorperazine 3 mg',
      'Cinnarizine',
    ],
    medicalHigh: ["Ménière's disease", 'Betahistine 16 mg', 'Cinnarizine'],
    quasi: [
      'Pontypridd',
      'primary school teaching assistant',
      'Cwm Taf Health Centre',
      'Glan Rhondda Hospital',
    ],
  },
  {
    id: 'fmed-occupational-health',
    title: 'Occupational health report to a manager',
    text: `OCCUPATIONAL HEALTH REPORT - MANAGEMENT REFERRAL
Brightwell Occupational Health Ltd

Private and confidential
To: Mr Craig Hollis, Shift Operations Manager, Tyne Vale Distribution, Gateshead
Copy: Priya Nambiar, HR Adviser; the employee
Date of assessment: 9 November 2026 (in person)

Employee: Bogdan Ionescu          Payroll no: TV-118264
Date of birth: 22 March 1985      Job: warehouse operative (nights), employed since 2019
Home address: 46 Saltwell View, Gateshead NE8 4TQ
Contact: 07700 900795 / b.ionescu85@tynemail.example

Dear Mr Hollis,

Thank you for your referral asking whether Mr Ionescu is fit to return to work after fourteen weeks' absence and what adjustments he may need.

Background
In late July Mr Ionescu developed tingling and then weakness of both legs a fortnight after a bout of food poisoning (Campylobacter). He was admitted to hospital, where Guillain-Barré syndrome was diagnosed following a lumbar puncture and nerve conduction studies. He was treated with intravenous immunoglobulin for five days and spent 23 days in hospital. He has since had rehabilitation as an outpatient under Dr Sunita Rajagopalan, consultant neurologist.

Current position
He walks unaided indoors and uses one stick outside. He has a mild left foot drop and wears an ankle-foot orthosis. He tires after about four hours of activity and has burning pain in both feet at night, for which he takes Gabapentin 300 mg three times a day; he reports no drowsiness on this dose. His wife, Daniela, drives him at present.

Opinion
1. Mr Ionescu is fit to return to work from 23 November 2026 with temporary adjustments. He is not yet fit for his full role.
2. For the first eight weeks I advise: day shifts only; four-hour shifts in weeks 1 and 2, six hours in weeks 3 to 6, then full shifts; seated or bench-based picking work; no work at height and no driving of fork-lift trucks; lifting limited to 10 kg from waist height.
3. A return to full duties is likely within about four months.
4. In my opinion the disability provisions of the Equality Act 2010 are likely to apply, although that is ultimately a legal decision.

I will review him by telephone on 18 January 2027. No report from his GP, Dr Henrietta Akande, is needed at this stage.

Yours sincerely,

Dr Morwenna Tregear
Consultant Occupational Physician
`,
    gold: [
      g('PERSON', 'Bogdan'),
      g('PERSON', 'Ionescu'),
      g('ID_NUMBER', 'TV-118264'),
      g('DOB', '22 March 1985'),
      g('ADDRESS', '46 Saltwell View'),
      g('POSTCODE', 'NE8 4TQ'),
      g('PHONE', '07700 900795'),
      g('EMAIL', 'b.ionescu85@tynemail.example'),
      g('PERSON', 'Daniela'),
      g('PERSON', 'Craig', 'other'),
      g('PERSON', 'Hollis', 'other'),
      g('PERSON', 'Priya', 'other'),
      g('PERSON', 'Nambiar', 'other'),
      g('PERSON', 'Sunita', 'other'),
      g('PERSON', 'Rajagopalan', 'other'),
      g('PERSON', 'Henrietta', 'other'),
      g('PERSON', 'Akande', 'other'),
      g('PERSON', 'Morwenna', 'other'),
      g('PERSON', 'Tregear', 'other'),
    ],
    keep: [
      'Guillain-Barré syndrome',
      'Campylobacter',
      'lumbar puncture',
      'nerve conduction studies',
      'intravenous immunoglobulin',
      'foot drop',
      'ankle-foot orthosis',
      'Gabapentin 300 mg three times a day',
      '23 November 2026',
      'day shifts only',
      'lifting limited to 10 kg',
      'Equality Act 2010',
    ],
    medical: [
      'Guillain-Barré syndrome',
      'Campylobacter',
      'lumbar puncture',
      'nerve conduction studies',
      'intravenous immunoglobulin',
      'foot drop',
      'ankle-foot orthosis',
      'Gabapentin 300 mg three times a day',
    ],
    medicalHigh: ['Guillain-Barré syndrome', 'Gabapentin 300 mg three times a day'],
    quasi: ['Gateshead', 'Tyne Vale Distribution', 'warehouse operative'],
  },
  {
    id: 'fmed-community-care-plan',
    title: 'District nursing care plan',
    text: `COMMUNITY NURSING CARE PLAN
Erne Valley District Nursing Service

Name: Bridie McGonagle
Date of birth: 1 September 1938          Age: 88
Health and care number: 356 204 7719
Address: 3 Darling Street, Enniskillen BT74 6HR     Key safe: yes (code held by the team, not written here)
Lives: alone, daughter next door at number 5
First contact: Orla Gormley (daughter), 07700 900323, orla.gormley@ernepost.example
Also: Fr Eamon Tierney, parish priest, visits on Fridays at her request
GP: Dr Sebastian Kruger, Castle Island Practice
Plan written: 2 November 2026 by Chiamaka Onuoha, district nursing sister       Review due: 30 November 2026

Diagnoses
* Alzheimer's disease (moderate), diagnosed 2022
* Type 2 diabetes on insulin
* Heart failure
* Long-term urinary catheter since a stroke in 2024
* Category 2 pressure ulcer, sacrum (found 30 October)

What matters to Bridie
* She becomes frightened by people standing over her. Sit down, say your name, and mention Orla.

Risks and scores
* Waterlow score 21 (very high risk)
* Abbey Pain Scale 4 (mild) during dressing changes

Care needs and actions
1. Skin: wound 2 x 3 cm, shallow, no slough. Clean with saline, apply a foam dressing, change every three days or if soiled. Airflow mattress delivered 31 October.
2. Catheter: size 14 Foley catheter, changed every 12 weeks, next due 14 December. Report cloudy urine, new confusion or a temperature. Last infection was in September (E. coli, treated with Nitrofurantoin).
3. Diabetes: Lantus (insulin glargine) 18 units each morning, given by the district nurse. If below 5, give the usual breakfast and ring the GP before giving insulin.
4. Medicines: the morning carer prompts from the pharmacy blister pack. Memantine 20 mg, Furosemide 40 mg, Bisoprolol 2.5 mg, Apixaban 2.5 mg twice daily, Senna at night. Paracetamol 1 g half an hour before dressing changes.

Decisions already made
* A ReSPECT form is in the green folder by the front door: not for resuscitation (DNACPR), would accept hospital admission for a broken bone.
* Orla holds lasting power of attorney for health and welfare.

Visits
District nurse every morning between 8 and 9.30. Larkspur Home Care four times a day. Social worker: Yasmin Darwish.
`,
    gold: [
      g('PERSON', 'Bridie'),
      g('PERSON', 'McGonagle'),
      g('DOB', '1 September 1938'),
      g('ID_NUMBER', '356 204 7719'),
      g('ADDRESS', '3 Darling Street'),
      g('POSTCODE', 'BT74 6HR'),
      g('PERSON', 'Orla'),
      g('PERSON', 'Gormley'),
      g('PHONE', '07700 900323'),
      g('EMAIL', 'orla.gormley@ernepost.example'),
      g('PERSON', 'Eamon', 'other'),
      g('PERSON', 'Tierney', 'other'),
      g('PERSON', 'Sebastian', 'other'),
      g('PERSON', 'Kruger', 'other'),
      g('PERSON', 'Chiamaka', 'other'),
      g('PERSON', 'Onuoha', 'other'),
      g('PERSON', 'Yasmin', 'other'),
      g('PERSON', 'Darwish', 'other'),
    ],
    keep: [
      "Alzheimer's disease",
      'pressure ulcer',
      'Waterlow score 21',
      'Abbey Pain Scale',
      'Foley catheter',
      'Nitrofurantoin',
      'Lantus',
      'insulin glargine',
      '18 units',
      'Memantine 20 mg',
      'DNACPR',
      'every three days',
    ],
    medical: [
      "Alzheimer's disease",
      'pressure ulcer',
      'Waterlow score 21',
      'Abbey Pain Scale',
      'Foley catheter',
      'Nitrofurantoin',
      'Lantus',
      'insulin glargine',
      '18 units',
      'Memantine 20 mg',
    ],
    medicalHigh: ["Alzheimer's disease", 'Waterlow score 21', 'insulin glargine', '18 units'],
    quasi: ['Enniskillen', 'Castle Island Practice', 'Larkspur Home Care', 'parish priest'],
  },
];
