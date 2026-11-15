/**
 * Useful facts in the older letter sets that are medicines, conditions,
 * tests, procedures or doses. Newer sets tag these on the letter itself
 * (`medical`). They are counted on their own because hiding one of these
 * ruins a medical answer.
 */
export const MEDICAL_KEEP = new Set([
  'ferritin', '9 µg/L', '210 mg', 'asthma', 'Left knee pain', 'osteoarthritis', 'naproxen 500 mg',
  'Blood panel', 'Fluid therapy', 'ear infection', 'Medication review', 'Occupational therapy',
  'bisoprolol 2.5 mg', 'ejection fraction of 40%', 'CT coronary angiogram', 'chest tightness',
  'pneumonia', 'amoxicillin 500 mg', '96% on air', 'co-amoxiclav', 'Root canal treatment', 'Porcelain crown',
  'lower back pain', 'early arthritis', 'meloxicam once a day', 'Type 2 diabetes mellitus',
  'Metformin 1 g twice a day', 'Ramipril 5 mg', 'Penicillin', 'HbA1c 55 mmol/mol', 'eGFR 49',
  'dapagliflozin', 'doxycycline', 'Chronic kidney disease stage 3a',
]);
