import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Long fictional documents, 5, 10 and 20 pages, in two sets. They are built
 * from an entity sheet, so the labels are exact by construction: every
 * personal detail in the text comes from the sheet, and the sheet is the
 * gold list. Each detail appears in several forms: full name, surname alone,
 * initial and surname, lower case, and split across a line break.
 *
 * LONG_DEV is for development. LONG_CLEAN is measured once, at the end, and
 * its misses are not looked at before then. The two sets share no content.
 *
 * The text is assembled from sentence templates with a fixed seed, so it is
 * more repetitive than a real file. A page is counted as 3,500 characters.
 */

interface Person {
  title: string;
  first: string;
  last: string;
  who: 'subject' | 'other';
}

interface Spec {
  id: string;
  title: string;
  people: Record<string, Person>;
  /** Other personal values: [kind, text]. Used in templates as {key}. */
  values: Record<string, [EntityKind, string]>;
  /** Fixed opening block. */
  header: string;
  /** Heading of each dated entry. */
  headings: string[];
  /** Sentences that carry personal details. */
  lines: string[];
  /** Sentences that carry none. */
  filler: string[];
  /** Useful facts. Each has a sentence that states it. */
  keep: Array<[fact: string, sentence: string, medical?: boolean]>;
}

const PAGE = 3500;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function build(spec: Spec, pages: number, seed: number): Fixture {
  const rand = rng(seed);
  const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
  const used = new Set<string>();
  let day = 0;

  const person = (key: string, form: string): string => {
    const p = spec.people[key];
    if (!p) throw new Error(`${spec.id}: no person ${key}`);
    used.add(key);
    switch (form) {
      case 'first':
        return p.first;
      case 'last':
        return p.last;
      case 'title':
        return `${p.title} ${p.last}`;
      case 'lower':
        return `${p.first} ${p.last}`.toLowerCase();
      case 'split':
        return `${p.first}\n${p.last}`;
      case 'init':
        return `${p.first[0]}. ${p.last}`;
      case 'caps':
        return `${p.last.toUpperCase()}, ${p.first}`;
      default:
        return `${p.first} ${p.last}`;
    }
  };
  const date = (): string => {
    day += 3 + Math.floor(rand() * 16);
    const d = new Date(Date.UTC(2025, 0, 6 + day));
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };
  const fill = (template: string): string =>
    template.replace(/\{([A-Za-z0-9]+)(?::([a-z]+))?\}/g, (_, key: string, form?: string) => {
      if (key === 'd') return date();
      if (spec.people[key]) return person(key, form ?? 'full');
      const v = spec.values[key];
      if (!v) throw new Error(`${spec.id}: no value ${key}`);
      return v[1];
    });

  let text = `${fill(spec.header)}\n\nKEY POINTS\n${spec.keep.map(([, s]) => fill(s)).join('\n')}\n`;
  while (text.length < pages * PAGE) {
    const parts = [fill(pick(spec.lines))];
    const n = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) parts.push(rand() < 0.45 ? fill(pick(spec.lines)) : pick(spec.filler));
    if (rand() < 0.3) parts.push(fill(pick(spec.keep)[1]));
    text += `\n${fill(pick(spec.headings))}\n${parts.join(' ')}\n`;
  }

  const gold: Gold[] = [];
  for (const key of used) {
    const p = spec.people[key];
    gold.push({ kind: 'PERSON', value: p.first, who: p.who }, { kind: 'PERSON', value: p.last, who: p.who });
  }
  for (const [kind, value] of Object.values(spec.values)) {
    if (text.includes(value)) gold.push({ kind, value, who: 'subject' });
  }
  return {
    id: `${spec.id}-${pages}p`,
    title: `${spec.title} (${pages} pages)`,
    text,
    gold,
    keep: spec.keep.map(([fact]) => fact),
    medical: spec.keep.filter(([, , m]) => m).map(([fact]) => fact),
  };
}

// ---------------------------------------------------------------------------
// Development set
// ---------------------------------------------------------------------------

const MEDICAL_RECORD: Spec = {
  id: 'dev-medical-record',
  title: 'Hospital outpatient record',
  people: {
    S: { title: 'Mr', first: 'Leopold', last: 'Varga-Whitcombe', who: 'subject' },
    W: { title: 'Mrs', first: 'Marguerite', last: 'Varga', who: 'subject' },
    D: { title: 'Ms', first: 'Clementine', last: 'Whitcombe', who: 'subject' },
    C: { title: 'Dr', first: 'Anselm', last: 'Okonjo', who: 'other' },
    R: { title: 'Dr', first: 'Brigid', last: 'Halloran', who: 'other' },
    N: { title: 'Sister', first: 'Yasmin', last: 'Khoury', who: 'other' },
    P: { title: 'Mr', first: 'Tobiah', last: 'Stenhouse', who: 'other' },
    G: { title: 'Dr', first: 'Ffion', last: 'Pritchard-Lowe', who: 'other' },
  },
  values: {
    addr: ['ADDRESS', '42 Saltmarsh Lane'],
    pc: ['POSTCODE', 'CO5 8QT'],
    phone: ['PHONE', '07700 900614'],
    phone2: ['PHONE', '01206 496 0158'],
    nhs: ['ID_NUMBER', '401 023 2137'],
    mrn: ['ID_NUMBER', 'H7730418'],
    dob: ['DOB', '23 August 1949'],
    email: ['EMAIL', 'leo.varga@inboxmail.example'],
  },
  header: `Colne Estuary University Hospital
Renal and Diabetes Outpatients
CLINICAL RECORD

Patient: {S:caps}
Date of birth: {dob}
NHS number: {nhs}     Hospital number: {mrn}
Address: {addr}, West Mersea {pc}
Telephone: {phone}     Email: {email}
Next of kin: {W} (wife), {phone2}
Consultant: {C}
GP: {G}, Strood Road Surgery`,
  headings: ['{d}. Clinic review, {C:title}', '{d}. Telephone contact, {N}', '{d}. Ward attender, {R:title}', '{d}. Pharmacy note, {P:init}', '{d}. Letter to GP, {G:title}'],
  lines: [
    '{S:title} attended with his wife, {W:first}.',
    'Seen by {R}, specialty registrar, and discussed with {C:title}.',
    '{N:title} rang {S:first} at home on {phone} to go through the results.',
    'His daughter, {D}, asked for a copy of the plan to be sent to {email}.',
    'Reviewed by {P}, renal pharmacist, who spoke to {W:title} about the dosette box.',
    'mr {S:lower} says he is managing the fluid restriction.',
    'Letter dictated by {C:init} and copied to {G}.',
    '{S:last} was weighed and his blood pressure taken by {N:first}.',
    'Transport booked from {addr} for the next visit.',
    '{D:first} will bring him; she can be reached through {W} on {phone2}.',
    'Identity confirmed against hospital number {mrn} and date of birth {dob}.',
    'Plan agreed with the patient,\n{S:split}, and written in his hand-held record.',
    '{R:title} has asked {N:last} to arrange the blood tests.',
    'Message left for {G:title} at the surgery about the change in dose.',
  ],
  filler: [
    'No chest pain or breathlessness.',
    'Ankle swelling is a little better than last time.',
    'Appetite is fair and weight is stable.',
    'Bloods taken today and sent to the laboratory.',
    'Urine dipstick shows protein two plus, no blood.',
    'He is passing urine normally and has no pain.',
    'Home blood pressure readings were reviewed and are acceptable.',
    'Diet sheet given again, with advice on potassium.',
    'No hypoglycaemic episodes reported since the last visit.',
    'Foot check normal, pulses present.',
    'Advised to avoid anti-inflammatory tablets.',
    'Vaccinations are up to date.',
    'To be seen again in clinic in eight weeks.',
    'He remains independent at home and still drives short distances.',
  ],
  keep: [
    ['chronic kidney disease stage 4', 'Diagnosis: chronic kidney disease stage 4.', true],
    ['eGFR 24', 'Latest result: eGFR 24, down from 27.', true],
    ['Furosemide 40 mg', 'Furosemide 40 mg each morning.', true],
    ['Insulin glargine 18 units', 'Insulin glargine 18 units at night.', true],
    ['Amlodipine 10 mg', 'Amlodipine 10 mg once a day.', true],
    ['HbA1c 62 mmol/mol', 'HbA1c 62 mmol/mol at the last check.', true],
    ['fistula formation', 'Referred to the surgeons for fistula formation.', true],
    ['haemodialysis', 'Options discussed, including haemodialysis at the satellite unit.', true],
    ['Sodium bicarbonate 500 mg', 'Sodium bicarbonate 500 mg three times a day.', true],
    ['eight weeks', 'Routine follow-up every eight weeks.'],
  ],
};

const TENANCY_FILE: Spec = {
  id: 'dev-tenancy-file',
  title: 'Housing association tenancy file',
  people: {
    S: { title: 'Ms', first: 'Ngozi', last: 'Eberechukwu', who: 'subject' },
    K: { title: 'Mr', first: 'Emeka', last: 'Eberechukwu', who: 'subject' },
    H: { title: 'Mr', first: 'Callum', last: 'Featherstone', who: 'other' },
    M: { title: 'Mrs', first: 'Rosalind', last: 'Achebe-Turner', who: 'other' },
    E: { title: 'Mr', first: 'Piotr', last: 'Zielonka', who: 'other' },
    X: { title: 'Mrs', first: 'Gwendoline', last: 'Sparrowhawk', who: 'other' },
    A: { title: 'Ms', first: 'Iolanthe', last: 'Mbatha', who: 'other' },
  },
  values: {
    addr: ['ADDRESS', '14 Weavers Yard'],
    pc: ['POSTCODE', 'HX1 3RD'],
    phone: ['PHONE', '07700 900255'],
    ref: ['ID_NUMBER', 'TN-0048817'],
    job: ['ID_NUMBER', 'REP/2026/19334'],
    ni: ['ID_NUMBER', 'SG 62 81 04 B'],
    email: ['EMAIL', 'ngozi.e@webpost.example'],
  },
  header: `Calderbank Homes
TENANCY FILE (printed for a subject access request)

Tenant: {S}
Joint tenant: {K} (brother)
Property: {addr}, Halifax {pc}
Tenancy reference: {ref}
Contact: {phone}, {email}
National Insurance number on file: {ni}
Housing officer: {H}
Team manager: {M}`,
  headings: ['{d}. File note, {H:init}', '{d}. Email from tenant', '{d}. Repairs log, job {job}', '{d}. Call logged by {A:first}', '{d}. Letter sent, signed {M}'],
  lines: [
    '{S:title} reported damp in the back bedroom again.',
    '{H} visited {addr} and took photographs.',
    'hi, this is {S:lower}, nobody has come about the boiler',
    '{E}, the contractor, could not get in and left a card.',
    'The neighbour at number 16, {X:title}, has complained about noise from building work.',
    '{K:first} was at home and let the surveyor in.',
    '{A}, customer services, rang {S:first} on {phone} and left a voicemail.',
    'Complaint acknowledged by {M:title} under reference {ref}.',
    'Rent statement emailed to {email} at the request of {K:title}.',
    '{E:last} says the extractor fan needs replacing and has ordered the part.',
    '{X} asked not to be named to the tenant.',
    'Housing benefit query: identity checked with National Insurance number {ni}.',
    'Stage two review requested by the tenant,\n{S:split}, in writing.',
    '{H:title} agreed to call {S:last} back by Friday.',
  ],
  filler: [
    'Mould wash applied to the window reveal.',
    'The surveyor found a moisture reading of 28% on the outside wall.',
    'A dehumidifier was offered and declined.',
    'The rent account is up to date.',
    'Gas safety check completed and the certificate filed.',
    'No access on the first visit; a second appointment was made.',
    'The gutter at the rear is blocked and overflowing.',
    'Tenant advised how to report an emergency repair out of hours.',
    'Photographs added to the file.',
    'Target date for the repair was missed.',
    'Compensation for missed appointments was considered.',
    'The loft insulation is thin and will be topped up.',
    'A works order was raised with a 20 working day target.',
  ],
  keep: [
    ['£480.00 a month', 'Rent is £480.00 a month.'],
    ['20 working days', 'Routine repairs have a target of 20 working days.'],
    ['£150 compensation', 'Offer made: £150 compensation for the delay.'],
    ['Housing Ombudsman', 'The tenant may go to the Housing Ombudsman after stage two.'],
    ['rising damp', 'Surveyor’s finding: rising damp on the party wall.'],
    ['extractor fan', 'Works ordered: a new extractor fan in the bathroom.'],
    ['stage two', 'The complaint is at stage two.'],
    ['28%', 'Moisture reading of 28% recorded.'],
  ],
};

const CLAIM_BUNDLE: Spec = {
  id: 'dev-claim-bundle',
  title: 'Motor insurance claim bundle',
  people: {
    S: { title: 'Dr', first: 'Henrietta', last: 'Oyelaran-Beck', who: 'subject' },
    J: { title: 'Mr', first: 'Jasper', last: 'Beck', who: 'subject' },
    T: { title: 'Mr', first: 'Dragan', last: 'Milosavljevic', who: 'other' },
    L: { title: 'Ms', first: 'Saoirse', last: 'Ferriter', who: 'other' },
    Q: { title: 'Mr', first: 'Obadiah', last: 'Greenhalgh', who: 'other' },
    V: { title: 'Mrs', first: 'Lucinda', last: 'Tremayne', who: 'other' },
    B: { title: 'Mr', first: 'Kwabena', last: 'Asante-Reid', who: 'other' },
    Z: { title: 'Miss', first: 'Philippa', last: 'Underhill', who: 'other' },
  },
  values: {
    addr: ['ADDRESS', '9 Lime Kiln Rise'],
    pc: ['POSTCODE', 'BA2 6JF'],
    phone: ['PHONE', '07700 900847'],
    claim: ['ID_NUMBER', 'CLM-88204417'],
    policy: ['ID_NUMBER', 'MV/5519027/A'],
    reg: ['ID_NUMBER', 'WK21 HBO'],
    lic: ['ID_NUMBER', 'OYELA657124H99XT'],
    email: ['EMAIL', 'h.oyelaran@mailhouse.example'],
    dob: ['DOB', '12 July 1975'],
  },
  header: `Severnside Mutual Insurance
CLAIM FILE

Policyholder: {S}
Named driver: {J} (husband)
Address: {addr}, Bath {pc}
Date of birth: {dob}
Policy number: {policy}     Claim number: {claim}
Vehicle: Volvo V60, registration {reg}
Driving licence: {lic}
Contact: {phone}, {email}
Claims handler: {L}
Third party: {T}`,
  headings: ['{d}. Handler note, {L:init}', '{d}. Email from policyholder', '{d}. Engineer’s report, {Q}', '{d}. Witness statement, {V:title}', '{d}. Letter from third party’s solicitor, {B}'],
  lines: [
    '{S:title} called to report the collision and gave claim number {claim}.',
    'The other driver, {T}, admitted pulling out without looking.',
    '{Q}, engineer, inspected the Volvo ({reg}) at the repairer.',
    'this is {S:lower}. i still have no courtesy car',
    '{V} saw the collision from the bus stop and gave a statement.',
    '{B}, solicitor for {T:title}, disputes liability.',
    '{J:first} was driving at the time; {S:first} was a passenger.',
    '{L} emailed {email} with the repair estimate.',
    '{Z}, physiotherapist, has seen {J:title} twice for whiplash.',
    'Identity check passed: date of birth {dob}, licence {lic}.',
    '{T:last} was insured with another company; details requested.',
    'Hire car delivered to {addr} and signed for by {J}.',
    'The policyholder,\n{S:split}, wants the excess recovered.',
    '{L:first} rang {phone} and spoke to {J:last}.',
    '{V:last} is willing to attend court if needed.',
    '{Z:init} sent her report under policy {policy}.',
  ],
  filler: [
    'Damage is to the nearside front wing, door and wheel.',
    'The repairer estimates twelve working days.',
    'Dashcam footage has been requested.',
    'The road was wet and it was getting dark.',
    'Liability remains in dispute.',
    'A without-prejudice offer of a 75/25 split was made.',
    'The vehicle is repairable and not a total loss.',
    'Photographs from the scene were uploaded.',
    'The police did not attend.',
    'The courtesy car is a small hatchback.',
    'The other insurer has not replied to two letters.',
    'A reserve has been set for vehicle damage and injury.',
    'No previous claims in the last five years.',
  ],
  keep: [
    ['£350 excess', 'The policy carries a £350 excess.'],
    ['£4,870.40', 'Repair estimate: £4,870.40 including VAT.'],
    ['75/25', 'Offer on liability: 75/25 in the policyholder’s favour.'],
    ['whiplash', 'Injury claimed: whiplash to the neck and shoulder.', true],
    ['six sessions of physiotherapy', 'Treatment approved: six sessions of physiotherapy.', true],
    ['no-claims discount', 'The no-claims discount is protected.'],
    ['twelve working days', 'Repair time: twelve working days.'],
    ['14 days', 'The third party has 14 days to respond.'],
  ],
};

export const LONG_DEV: Fixture[] = [build(MEDICAL_RECORD, 5, 11), build(TENANCY_FILE, 10, 22), build(CLAIM_BUNDLE, 20, 33)];

// ---------------------------------------------------------------------------
// Clean set. Measured once.
// ---------------------------------------------------------------------------

const EMAIL_THREAD: Spec = {
  id: 'clean-email-thread',
  title: 'Workplace grievance email thread',
  people: {
    S: { title: 'Mr', first: 'Ignatius', last: 'Bellweather', who: 'subject' },
    P: { title: 'Ms', first: 'Oluchi', last: 'Bellweather', who: 'subject' },
    M: { title: 'Mrs', first: 'Cordelia', last: 'Vanterpool', who: 'other' },
    H: { title: 'Mr', first: 'Stellan', last: 'Brathwaite', who: 'other' },
    U: { title: 'Ms', first: 'Mehrnaz', last: 'Golshiri', who: 'other' },
    C: { title: 'Mr', first: 'Dafydd', last: 'Llewellyn-Hart', who: 'other' },
    O: { title: 'Dr', first: 'Rosamund', last: 'Achterkamp', who: 'other' },
  },
  values: {
    addr: ['ADDRESS', '27 Cinder Path'],
    pc: ['POSTCODE', 'DL3 7NW'],
    phone: ['PHONE', '07700 900432'],
    emp: ['ID_NUMBER', 'E-204471'],
    case: ['ID_NUMBER', 'GRV/26/0093'],
    email: ['EMAIL', 'iggy.bellweather@letterbox.example'],
    email2: ['EMAIL', 'cordelia.vanterpool@tarnforth-logistics.example'],
  },
  header: `From: {email}
To: {email2}
Subject: Formal grievance, case {case}

Dear {M:title},

I am writing as {S}, employee number {emp}, of {addr}, Darlington {pc}. You can reach me on {phone}. The thread below is everything I have sent and received about this.`,
  headings: ['{d}. From {S:first} to {M:first}', '{d}. From {M} (HR) to {S:title}', '{d}. From {H:init} to all shift leads', '{d}. From {U}, union representative', '{d}. Note of meeting, taken by {C}'],
  lines: [
    '{H}, my line manager, changed my shifts with one day’s notice.',
    'I raised it with {H:first} twice and was told to stop complaining.',
    '{U} has agreed to come with me to the meeting.',
    'thanks {M:lower}, friday at 10 is fine',
    '{C}, the depot manager, will chair the hearing.',
    'My partner, {P}, can confirm the dates because she covered the school run.',
    '{O}, occupational health, saw me and wrote to {M:title}.',
    'Please send the notes to {email} and not to my work address.',
    '{H:last} said in front of the team that I was unreliable.',
    'As the employee,\n{S:split}, I am asking for the rota change to be reversed.',
    '{M:first} confirmed case number {case} and employee number {emp}.',
    '{U:title} asked for the witness statements by Monday.',
    '{C:last} adjourned the meeting so that {O:title} could be consulted.',
    'If you need me urgently, ring {P:first} on {phone}.',
  ],
  filler: [
    'The rota was changed three times in four weeks.',
    'I have worked nights at the depot for seven years.',
    'I was not consulted before the change.',
    'The policy says shift changes need two weeks’ notice.',
    'I have attached the old and new rotas.',
    'I am not asking for money, only for the pattern to be put back.',
    'The meeting lasted forty minutes.',
    'An outcome letter will follow within ten working days.',
    'I have kept a diary since March.',
    'Two colleagues were moved at the same time.',
    'I was told the change was a business need.',
    'I would like this dealt with informally if possible.',
  ],
  keep: [
    ['two weeks’ notice', 'The handbook requires two weeks’ notice of a shift change.'],
    ['ten working days', 'HR must reply within ten working days.'],
    ['stress-related insomnia', 'Occupational health recorded stress-related insomnia.', true],
    ['phased return', 'Recommendation: a phased return over four weeks.', true],
    ['right to be accompanied', 'I have a right to be accompanied at the hearing.'],
    ['seven years', 'Length of service: seven years.'],
    ['appeal within five days', 'The outcome can be taken to appeal within five days.'],
  ],
};

const APPEAL_BUNDLE: Spec = {
  id: 'clean-appeal-bundle',
  title: 'Benefit appeal bundle',
  people: {
    S: { title: 'Miss', first: 'Perpetua', last: 'Lindqvist-Amadi', who: 'subject' },
    M: { title: 'Mrs', first: 'Ebele', last: 'Amadi', who: 'subject' },
    A: { title: 'Mr', first: 'Rupert', last: 'Kettlewell', who: 'other' },
    D: { title: 'Dr', first: 'Sunniva', last: 'Marchetti', who: 'other' },
    W: { title: 'Ms', first: 'Tamsin', last: 'Ogunleye', who: 'other' },
    J: { title: 'Judge', first: 'Evander', last: 'Coombes', who: 'other' },
    N: { title: 'Mr', first: 'Lorcan', last: 'Brightwater', who: 'other' },
  },
  values: {
    addr: ['ADDRESS', '3 Bellfounders Court'],
    pc: ['POSTCODE', 'LE2 0PX'],
    phone: ['PHONE', '07700 900176'],
    ni: ['ID_NUMBER', 'PX 40 19 77 D'],
    appeal: ['ID_NUMBER', 'SC271/26/00418'],
    dob: ['DOB', '30 November 1994'],
    email: ['EMAIL', 'perpetua.la@postroom.example'],
  },
  header: `First-tier Tribunal (Social Entitlement Chamber)
APPEAL BUNDLE

Appellant: {S}
Date of birth: {dob}
National Insurance number: {ni}
Address: {addr}, Leicester {pc}
Telephone: {phone}     Email: {email}
Appeal reference: {appeal}
Appointee: {M} (mother)
Representative: {W}, Soar Valley Advice Centre`,
  headings: ['{d}. Submission by {W:init}', '{d}. Assessment report, {A}', '{d}. Letter from GP, {D:title}', '{d}. Statement of the appellant', '{d}. Directions of {J:title}', '{d}. Statement of {M:title}'],
  lines: [
    '{A}, the assessor, saw {S:title} for twenty-five minutes.',
    '{D} has treated {S:first} since 2019.',
    'i am {S:lower} and i wrote this with my mum',
    '{M} helps her daughter wash and dress every morning.',
    '{W} submits that the report of {A:title} is unreliable.',
    '{J} directed the respondent to file the recordings.',
    'Her support worker, {N}, takes her to appointments by bus.',
    '{N:first} confirms that {S:last} has not travelled alone since last year.',
    'Appeal {appeal}: National Insurance number {ni} checked.',
    'The appellant,\n{S:split}, asks for the decision to be set aside.',
    '{M:first} can be contacted on {phone} or at {email}.',
    '{D:last} notes that the medication makes her drowsy until midday.',
    '{W:title} will attend with {M:title}.',
    '{A:last} recorded that she made good eye contact.',
  ],
  filler: [
    'She cannot plan or follow a journey without another person.',
    'She needs prompting to eat and to take her tablets.',
    'The assessment was carried out by telephone.',
    'The report does not mention the hospital admission.',
    'She scored zero for engaging with other people.',
    'The decision was upheld at mandatory reconsideration.',
    'The hearing will be in person.',
    'A bundle of 143 pages has been filed.',
    'She left her job in a shop in 2022.',
    'She sleeps for most of the afternoon.',
    'The respondent has not attended a hearing in this case.',
    'She would like her mother to speak for her.',
  ],
  keep: [
    ['8 points for daily living', 'The tribunal is asked to award 8 points for daily living.'],
    ['12 points for mobility', 'And 12 points for mobility.'],
    ['generalised anxiety disorder', 'Diagnosis: generalised anxiety disorder.', true],
    ['Sertraline 100 mg', 'Sertraline 100 mg each morning.', true],
    ['Propranolol 40 mg', 'Propranolol 40 mg when needed.', true],
    ['mandatory reconsideration', 'The decision was upheld at mandatory reconsideration.'],
    ['one month', 'An appeal to the Upper Tribunal must be made within one month.'],
    ['cognitive behavioural therapy', 'She is on the waiting list for cognitive behavioural therapy.', true],
  ],
};

const HOSPITAL_RECORD: Spec = {
  id: 'clean-hospital-record',
  title: 'Inpatient and community care record',
  people: {
    S: { title: 'Mrs', first: 'Wilhelmina', last: 'Draycott-Nwosu', who: 'subject' },
    H: { title: 'Mr', first: 'Chidubem', last: 'Nwosu', who: 'subject' },
    G: { title: 'Ms', first: 'Araminta', last: 'Draycott', who: 'subject' },
    C: { title: 'Mr', first: 'Lysander', last: 'Okafor-Pym', who: 'other' },
    R: { title: 'Dr', first: 'Nadezhda', last: 'Kowalczyk', who: 'other' },
    N: { title: 'Staff Nurse', first: 'Bronagh', last: 'Tierney', who: 'other' },
    T: { title: 'Mr', first: 'Emrys', last: 'Vaughan-Sato', who: 'other' },
    K: { title: 'Mrs', first: 'Zainab', last: 'Al-Rashidi', who: 'other' },
    F: { title: 'Dr', first: 'Cosimo', last: 'Hartigan', who: 'other' },
  },
  values: {
    addr: ['ADDRESS', '61 Tollbar Crescent'],
    pc: ['POSTCODE', 'WF4 2HG'],
    phone: ['PHONE', '07700 900923'],
    phone2: ['PHONE', '01924 496 0131'],
    nhs: ['ID_NUMBER', '628 114 0937'],
    mrn: ['ID_NUMBER', 'RX4-2207615'],
    dob: ['DOB', '5 March 1941'],
    email: ['EMAIL', 'araminta.draycott@homemail.example'],
  },
  header: `Calder Ridge Hospitals
Trauma and Orthopaedics, Ward 22, and Community Therapy Service
PATIENT RECORD

Patient: {S:caps}
Date of birth: {dob}
NHS number: {nhs}     Hospital number: {mrn}
Address: {addr}, Wakefield {pc}
Telephone: {phone2}
Next of kin: {H} (husband), {phone}
Also contact: {G} (daughter), {email}
Consultant: {C}
GP: {F}, Sandal Bridge Practice`,
  headings: ['{d}. Ward round, {C:title}', '{d}. Nursing note, {N}', '{d}. Physiotherapy, {T:init}', '{d}. Social work, {K}', '{d}. Medical review, {R:title}', '{d}. Discharge letter to {F:title}'],
  lines: [
    '{S:title} was admitted after a fall at home.',
    'Operation performed by {C}, assisted by {R}.',
    '{N} helped {S:first} to sit out in the chair.',
    '{T}, physiotherapist, walked her to the door and back with a frame.',
    '{K}, social worker, met {H:title} and {G:first} on the ward.',
    'mrs {S:lower} was confused overnight and pulled at her dressing',
    '{H:first} visits every afternoon and brings her glasses.',
    '{G} asked for updates by email at {email}.',
    'Wristband checked: hospital number {mrn}, date of birth {dob}.',
    '{R:title} reviewed the bloods and stopped the fluids.',
    'Home visit to {addr} arranged by {T:last}.',
    'The patient,\n{S:split}, consented to the operation with her husband present.',
    '{N:last} rang {H:last} on {phone} to say she had been moved to a side room.',
    '{K:title} will ask {F} to arrange the district nurses.',
    '{C:init} is content for her to go home when therapy is complete.',
    'Package of care agreed with {G:title}; key safe number to be given by phone only.',
  ],
  filler: [
    'Wound is clean and dry.',
    'Pain is controlled when she is resting and worse on movement.',
    'She is eating about half of each meal.',
    'Observations are stable and she has no temperature.',
    'Bowels opened today.',
    'She is at high risk of falls and has a sensor mat.',
    'Pressure areas are intact.',
    'She managed four steps with supervision.',
    'Bloods repeated: haemoglobin is lower than on admission.',
    'She is drinking well and the drip has been taken down.',
    'A raised toilet seat and a perching stool were ordered.',
    'Memory test score was 21 out of 30.',
    'Clips are due out fourteen days after surgery.',
    'She was pleasant and settled this morning.',
  ],
  keep: [
    ['fractured neck of femur', 'Diagnosis: fractured neck of femur, left.', true],
    ['hemiarthroplasty', 'Procedure: cemented hemiarthroplasty.', true],
    ['Enoxaparin 40 mg', 'Enoxaparin 40 mg once a day for 28 days.', true],
    ['Alendronic acid 70 mg', 'Alendronic acid 70 mg once a week.', true],
    ['delirium', 'Complication: post-operative delirium, now settling.', true],
    ['haemoglobin 88', 'Lowest haemoglobin 88; no transfusion needed.', true],
    ['Paracetamol 1 g', 'Paracetamol 1 g four times a day.', true],
    ['four calls a day', 'Care package: four calls a day for six weeks.'],
    ['fourteen days', 'Clips out at fourteen days.'],
    ['Codeine 30 mg', 'Codeine 30 mg when needed, up to four times a day.', true],
  ],
};

export const LONG_CLEAN: Fixture[] = [build(EMAIL_THREAD, 5, 44), build(APPEAL_BUNDLE, 10, 55), build(HOSPITAL_RECORD, 20, 66)];
