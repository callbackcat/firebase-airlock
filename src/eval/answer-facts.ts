/**
 * Answer-quality rubric for the 20 test letters (FIXTURES then HOLDOUT).
 *
 * `required` lists facts a good "explain" or "what to do" answer contains.
 * `mustNot` lists claims a good answer does not make. Each has `any`: sources
 * for `new RegExp(source, 'i')`; the item counts as present if any of them
 * matches the answer. A `mustNot` with `any: []` cannot be caught by a pattern
 * and goes to a judge. `judge` is the one thing the answer must get right.
 *
 * Nothing here depends on personal details (names, addresses, reference
 * numbers, people's phone numbers), because those are replaced by placeholders
 * and put back. Every letter is made up.
 */
export interface AnswerFacts {
  id: string;
  required: Array<{ fact: string; any: string[] }>;
  mustNot: Array<{ claim: string; any: string[] }>;
  judge: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Patterns for one date however it is written: "8 December", "8th of Dec",
 * "December 8", "08/12/2026", "2026-12-08". Pass `us` to also accept
 * month-first numbers ("12/1/2026").
 */
function date(day: number, month: number, year: number, us = false): string[] {
  const name = MONTHS[month - 1];
  const mon = `${name.slice(0, 3)}(?:${name.slice(3)})?\\.?`;
  const ord = '(?:st|nd|rd|th)?';
  const yy = String(year).slice(2);
  const out = [
    `\\b0?${day}${ord}\\s+(?:of\\s+)?${mon}(?![a-z])`,
    `\\b${mon}\\s+(?:the\\s+)?0?${day}${ord}(?!\\d)`,
    `\\b0?${day}[/.-]0?${month}[/.-](?:20)?${yy}\\b`,
    `\\b${year}-0?${month}-0?${day}\\b`,
  ];
  if (us) out.push(`\\b0?${month}[/.-]0?${day}[/.-](?:20)?${yy}\\b`);
  return out;
}

/**
 * Patterns for an amount of money. With pence ("42.50") the digits are
 * distinctive, so the currency sign is optional. A whole amount ("164.00")
 * may be written "£164", so the sign or the word is required.
 */
function money(amount: string, currency: '£' | '$' = '£'): string[] {
  const [whole, pence] = amount.split('.');
  const digits = whole.replace(/,/g, ',?');
  if (pence && pence !== '00') return [`(?<![\\d.,])${digits}\\.${pence}(?!\\d)`];
  const sign = currency === '$' ? '\\$' : '£';
  const word = currency === '$' ? '(?:dollars|USD)' : '(?:pounds|GBP)';
  return [
    `${sign}\\s?${digits}(?:\\.00)?(?![\\d,]|\\.\\d)`,
    `(?<![\\d.,])${digits}(?:\\.00)?\\s*${word}\\b`,
  ];
}

export const ANSWER_FACTS: AnswerFacts[] = [
  // ---- FIXTURES ----
  {
    id: 'clinic',
    required: [
      { fact: 'A new appointment is booked for Tuesday 8 December 2026', any: date(8, 12, 2026) },
      {
        fact: 'Must give at least 48 hours notice to change or cancel it',
        any: ['48\\s*-?\\s*hours?', '(?:two|2)\\s+days'],
      },
      {
        fact: 'Missing it without notice means discharge back to the GP and a new referral',
        any: ['discharg', 'new\\s+referral', 're-?referr', 'referred\\s+again'],
      },
      { fact: 'A missed-appointment charge of £42.50 has been added', any: money('42.50') },
      {
        fact: 'The charge will be collected on 16 November 2026 unless the recipient contacts the clinic first',
        any: date(16, 11, 2026),
      },
      {
        fact: 'The recipient can ask for the charge to be waived if there was a good reason',
        any: ['waiv', 'good\\s+reason', '(?:cancel|remove|drop)\\w*\\s+the\\s+charge'],
      },
    ],
    mustNot: [
      {
        claim: 'Says the £42.50 has already been taken from the bank account',
        any: [
          'already\\s+(?:been\\s+)?(?:taken|collected|debited|deducted)',
          '(?:has|have|was)\\s+been\\s+(?:taken|collected|debited|deducted)\\s+from',
        ],
      },
      {
        claim: 'Gives 29 October (the missed appointment) as the date of the new appointment',
        any: ['(?:new|next|rebooked|rescheduled)\\s+appointment[^.\\n]{0,40}\\b29(?:th)?\\s+Oct'],
      },
    ],
    judge:
      'The answer must make clear that the recipient has to attend on 8 December 2026 or give 48 hours notice, and must contact the clinic before 16 November 2026 if they want the £42.50 charge waived.',
  },
  {
    id: 'council-tax',
    required: [
      { fact: 'An instalment of £164.00 is unpaid', any: money('164.00') },
      {
        fact: 'It must be paid within 7 days of the notice',
        any: ['(?:7|seven)\\s*-?\\s*days?', '(?:one|a|1)\\s+week'],
      },
      {
        fact: 'Otherwise the right to pay by instalments is lost',
        any: [
          '(?:lose|losing|lost|forfeit|withdraw|remove|no\\s+longer)[^.\\n]{0,60}instal+ments?',
          'right\\s+to\\s+pay\\s+(?:by|in)\\s+instal+ments?',
        ],
      },
      { fact: 'and the full remaining balance of £820.00 becomes due', any: money('820.00') },
      {
        fact: 'If struggling to pay, call the council before 22 November 2026',
        any: date(22, 11, 2026),
      },
      {
        fact: 'A payment plan can be discussed',
        any: ['payment\\s+(?:plan|arrangement)', 'repayment\\s+(?:plan|arrangement)', 'pay\\s+in\\s+smaller'],
      },
    ],
    mustNot: [
      {
        claim: 'Gives 22 November as the deadline for paying the £164 (it is the date to call by)',
        any: ['(?:must|need\\s+to|have\\s+to|should)\\s+pay[^.\\n]{0,40}(?:by|before)\\s+(?:the\\s+)?22(?:nd)?\\s+Nov'],
      },
      { claim: 'Says the full £820 is already due now, rather than only if the £164 is not paid in time', any: [] },
    ],
    judge:
      'The answer must say that £164 has to be paid within 7 days or the whole £820 balance becomes due, and that the recipient can call before 22 November 2026 to arrange a payment plan.',
  },
  {
    id: 'landlord',
    required: [
      { fact: 'The rent goes up from 1 January 2027', any: date(1, 1, 2027) },
      { fact: 'The new rent is £1,240 a month', any: money('1,240') },
      {
        fact: 'The current rent is £1,150 (an increase of £90)',
        any: [...money('1,150'), ...money('90')],
      },
      {
        fact: "The landlord says this letter gives the required one month's notice",
        any: ['(?:one|1|a)\\s+month.{0,3}s?\\s+(?:of\\s+)?notice', 'month.{0,2}s\\s+notice', 'notice\\s+of\\s+(?:one|1|a)\\s+month'],
      },
      {
        fact: 'The standing order must be updated before the January payment',
        any: ['standing\\s+order'],
      },
    ],
    mustNot: [
      {
        claim: 'Gives £1,150 as the new rent',
        any: [
          '(?:up|rise|rises|rising|increase|increases|increasing)\\s+to\\s+£\\s?1,?150',
          'new\\s+rent\\s+(?:of|is|will\\s+be)\\s+£\\s?1,?150',
        ],
      },
      { claim: 'States as fact that the increase is unlawful or that the notice is invalid', any: [] },
    ],
    judge:
      'The answer must say the rent rises from £1,150 to £1,240 a month from 1 January 2027 and that the standing order needs changing before the January payment.',
  },
  {
    id: 'bank-caps',
    required: [
      { fact: 'The account is overdrawn by £212.37', any: money('212.37') },
      {
        fact: 'Interest is charged at 39.9% EAR because there is no arranged overdraft',
        any: ['39\\.9\\s*%', '39\\.9\\s+per\\s?cent'],
      },
      { fact: 'The account must be back in credit by 19 November 2026', any: date(19, 11, 2026) },
      {
        fact: 'Otherwise the debit card may be restricted',
        any: [
          '(?:restrict|block|limit|suspend|freez|stop)\\w*[^.\\n]{0,40}card',
          'card[^.\\n]{0,40}(?:restrict|block|limit|suspend|froz|freez|stop)',
        ],
      },
      {
        fact: 'and missed payments may be reported to credit reference agencies',
        any: ['credit\\s+(?:reference|report|record|file|score|rating|history|agenc)'],
      },
      {
        fact: 'The bank offers help with financial difficulty through its support team',
        any: ['financial\\s+difficult', 'support\\s+team', 'struggling'],
      },
    ],
    mustNot: [
      {
        claim: 'Says the debit card has already been restricted or blocked',
        any: ['card\\s+(?:has|is)\\s+(?:now\\s+|already\\s+)?(?:been\\s+)?(?:restricted|blocked|suspended|frozen|cancelled|stopped)'],
      },
      {
        claim: 'Gives 3 or 5 November as the deadline for paying in',
        any: ['(?:by|before)\\s+(?:the\\s+)?(?:3|5)(?:rd|th)?\\s+Nov'],
      },
    ],
    judge:
      'The answer must say the recipient needs to pay in at least £212.37 (plus interest) by 19 November 2026 to avoid card restrictions and a mark on their credit record.',
  },
  {
    id: 'parking',
    required: [
      { fact: 'The charge is £100.00', any: money('100.00') },
      { fact: 'It is reduced to £60.00 if paid early', any: money('60.00') },
      {
        fact: 'The reduced rate applies if paid within 14 days',
        any: ['(?:14|fourteen)\\s*-?\\s*days?', '(?:two|2)\\s+weeks', 'fortnight'],
      },
      {
        fact: 'An appeal can be made within 28 days',
        any: ['(?:28|twenty[-\\s]eight)\\s*-?\\s*days?', '(?:four|4)\\s+weeks'],
      },
      {
        fact: 'Appeals must be in writing',
        any: ['in\\s+writing', 'written', 'appeal\\s+by\\s+(?:letter|post)'],
      },
      {
        fact: "If the keeper was not the driver they must give the driver's name and address",
        any: [
          'not\\s+the\\s+driver',
          'were\\s?n.?t\\s+(?:the\\s+)?(?:driver|driving)',
          '(?:who|someone\\s+else)\\s+was\\s+driving',
          'driver.{0,2}s\\s+(?:full\\s+)?name',
          'name\\s+and\\s+address\\s+of\\s+the\\s+driver',
        ],
      },
    ],
    mustNot: [
      {
        claim: 'Says the £60 reduced rate is available for 28 days',
        any: ['£\\s?60(?:\\.00)?\\s+(?:if\\s+(?:you\\s+)?(?:pay|paid)\\s+)?within\\s+28\\s*days'],
      },
      { claim: 'Says there is no right to appeal, or that the charge is a criminal fine', any: [] },
    ],
    judge:
      'The answer must set out the choice: pay £60 within 14 days (or £100 after), or appeal in writing within 28 days.',
  },
  {
    id: 'tax-penalty',
    required: [
      { fact: 'A fixed penalty of £100 has been charged', any: money('100') },
      { fact: 'The tax return was due by 31 October 2026 and was not received', any: date(31, 10, 2026) },
      {
        fact: 'The return should be sent now',
        any: ['(?:send|submit|file|complete)\\w*[^.\\n]{0,40}return', 'return[^.\\n]{0,40}(?:sent|submitted|filed)'],
      },
      {
        fact: 'After three months late, £10 is charged for each further day, up to 90 days',
        any: [
          '£\\s?10(?:\\.00)?\\s*(?:for\\s+each|per|a|each|every|/)\\s*(?:further\\s+|additional\\s+|extra\\s+)?day',
          '£\\s?10\\s+daily',
          'daily\\s+penalt',
        ],
      },
      {
        fact: 'The penalty can be appealed within 30 days',
        any: ['(?:30|thirty)\\s*-?\\s*days?'],
      },
      {
        fact: 'An appeal needs a reasonable excuse such as serious illness or bereavement',
        any: ['reasonable\\s+excuse', 'serious\\s+illness', 'bereavement', 'good\\s+reason'],
      },
    ],
    mustNot: [
      {
        claim: 'Gives a filing deadline other than 31 October 2026 (for example 31 January)',
        any: ['31(?:st)?\\s+Jan', 'Jan(?:uary)?\\s+31'],
      },
      {
        claim: 'Says the daily penalties have already been charged or that £900 or more is owed now',
        any: ['(?:you\\s+owe|must\\s+pay|have\\s+been\\s+charged|now\\s+owe)\\s+£\\s?(?:900|1,?000)'],
      },
    ],
    judge:
      'The answer must say a £100 penalty has been charged for missing the 31 October 2026 deadline, that the return should be sent now to avoid £10-a-day penalties, and that an appeal is possible within 30 days.',
  },
  {
    id: 'school',
    required: [
      { fact: 'A meeting is set for Thursday 19 November 2026', any: date(19, 11, 2026) },
      {
        fact: 'The meeting is at 3:30pm',
        any: ['\\b3[:.]30', '\\b15[:.]30', 'half\\s+past\\s+(?:three|3)'],
      },
      { fact: 'Attendance has fallen to 83%', any: ['83\\s*%', '83\\s+per\\s?cent'] },
      {
        fact: 'If attendance does not improve the school must refer to the local authority',
        any: ['local\\s+authority', 'council'],
      },
      { fact: 'which can issue a penalty notice of £80 per parent', any: money('80') },
      {
        fact: 'The parents should confirm they can attend, by phone or email to the school office',
        any: ['confirm', 'school\\s+office', 'let\\s+the\\s+school\\s+know'],
      },
    ],
    mustNot: [
      {
        claim: 'Says a penalty notice has already been issued or that a fine must be paid now',
        any: [
          '(?:have|has)\\s+been\\s+(?:fined|issued\\s+(?:with\\s+)?a\\s+penalty)',
          'you\\s+(?:must|have\\s+to|need\\s+to)\\s+(?:now\\s+)?pay\\s+(?:a\\s+|the\\s+)?(?:fine|penalty|£\\s?80)',
        ],
      },
      { claim: 'Says the child has been excluded or that the matter is already with the local authority', any: [] },
    ],
    judge:
      'The answer must say the parents are asked to confirm and attend a meeting on Thursday 19 November 2026 at 3:30pm, and that an £80-per-parent penalty is only a possible later step if attendance does not improve.',
  },
  {
    id: 'energy',
    required: [
      { fact: 'The corrected bill is £402.17', any: money('402.17') },
      {
        fact: 'The complaint can now go to the Energy Ombudsman, free of charge',
        any: ['ombudsman'],
      },
      {
        fact: 'There are 12 months from the date of the letter to do so',
        any: ['(?:12|twelve)\\s*-?\\s*months?', '(?:one|1|a)\\s+year'],
      },
      { fact: 'A goodwill credit of £40.00 has been applied', any: money('40.00') },
      { fact: 'The Direct Debit changes to £96.00 a month', any: money('96.00') },
      { fact: 'The new Direct Debit starts on 1 December 2026', any: date(1, 12, 2026) },
    ],
    mustNot: [
      {
        claim: 'Says the recipient owes or must pay the original estimate of £1,318.44',
        any: [
          '(?:you\\s+(?:still\\s+)?owe|must\\s+pay|need\\s+to\\s+pay|amount\\s+due\\s+is|balance\\s+(?:due\\s+)?(?:is|of))\\s+£\\s?1,?318\\.44',
        ],
      },
      {
        claim: 'Says the recipient has only eight weeks to go to the Ombudsman',
        any: [
          'ombudsman\\s+within\\s+(?:8|eight)\\s+weeks',
          '(?:8|eight)\\s+weeks\\s+to\\s+(?:go|take|refer|contact|complain|escalate)',
        ],
      },
    ],
    judge:
      'The answer must say the bill was corrected from £1,318.44 to £402.17 and that the recipient may take the complaint to the Energy Ombudsman within 12 months if still unhappy.',
  },
  {
    id: 'disciplinary',
    required: [
      { fact: 'A disciplinary hearing is on Friday 20 November 2026', any: date(20, 11, 2026) },
      {
        fact: 'It starts at 10:00',
        any: ['\\b10[:.]00', '\\b10\\s*a\\.?m', '\\b10\\s+o.?clock', 'ten\\s+o.?clock'],
      },
      {
        fact: 'The allegation is leaving the depot during a shift without permission, with a loaded vehicle unattended',
        any: ['unattended', 'without\\s+permission', 'left\\s+the\\s+depot', 'leaving\\s+the\\s+depot'],
      },
      {
        fact: 'The employee may be accompanied by a work colleague or trade union representative',
        any: ['accompan', 'union\\s+rep', 'bring\\s+(?:a|someone)'],
      },
      {
        fact: 'If upheld, the outcome could be a final written warning',
        any: ['final\\s+written\\s+warning', 'final\\s+warning'],
      },
      {
        fact: 'If unable to attend, contact HR as soon as possible',
        any: ['(?:can\\s?not|can.?t|unable\\s+to|not\\s+able\\s+to)\\s+(?:attend|make)', 'reschedul', 'postpone'],
      },
    ],
    mustNot: [
      {
        claim: 'Says the hearing could or will end in dismissal (the letter names a final written warning)',
        any: [
          '(?:could|may|might|will)\\s+(?:be\\s+(?:dismissed|sacked|fired)|lose\\s+your\\s+job|(?:result\\s+in|lead\\s+to)\\s+(?:your\\s+)?dismissal)',
        ],
      },
      { claim: 'Treats the allegation as already proven or decided', any: [] },
    ],
    judge:
      'The answer must say the recipient has to attend a hearing on Friday 20 November 2026 at 10:00, may bring a colleague or union representative, and faces at most a final written warning if the allegation is upheld.',
  },
  {
    id: 'insurance',
    required: [
      {
        fact: 'The insurer has refused to pay the water damage claim',
        any: [
          '(?:can\\s?not|can.?t|will\\s+not|won.?t|not\\s+going\\s+to|not)\\s+(?:be\\s+)?pay',
          'declin',
          'refus',
          'reject',
          'turned\\s+down',
          'den(?:y|ied)',
        ],
      },
      {
        fact: 'The reason is gradual seepage from a bath seal, which the policy excludes (section 4, exclusion 7)',
        any: ['gradual', 'seep', 'exclusion\\s+7'],
      },
      {
        fact: 'A review of the decision can be requested within 8 weeks',
        any: ['(?:8|eight)\\s*-?\\s*weeks?'],
      },
      {
        fact: "New evidence such as a plumber's report can be sent",
        any: ['plumber', '(?:new|further|additional|fresh)\\s+evidence'],
      },
      {
        fact: 'After a final response the complaint can go to the Financial Ombudsman Service',
        any: ['ombudsman'],
      },
      {
        fact: 'The Ombudsman referral must be made within 6 months',
        any: ['(?:6|six)\\s*-?\\s*months?'],
      },
    ],
    mustNot: [
      {
        claim: 'Says the claim has been or will be paid',
        any: [
          '(?:will|agreed\\s+to|going\\s+to)\\s+pay\\s+(?:your|the)\\s+claim',
          'claim\\s+(?:has\\s+been|was|is)\\s+(?:approved|accepted|upheld)',
        ],
      },
      {
        claim: 'Says the Ombudsman must be contacted within 8 weeks (8 weeks is for the insurer review)',
        any: ['ombudsman\\s+within\\s+(?:8|eight)\\s+weeks'],
      },
    ],
    judge:
      'The answer must say the claim was refused because the damage was gradual, and give the two steps in order: ask the insurer for a review within 8 weeks, then the Financial Ombudsman within 6 months of the final response.',
  },
  {
    id: 'debt',
    required: [
      { fact: 'The amount claimed is £1,902.66', any: money('1,902.66') },
      {
        fact: 'There are 30 days from the date of the letter to reply',
        any: ['(?:30|thirty)\\s*-?\\s*days?'],
      },
      {
        fact: 'Without a reply the client may start court proceedings',
        any: ['court', 'legal\\s+(?:action|proceedings)', '\\bsued?\\b'],
      },
      {
        fact: 'The enclosed reply form should be completed',
        any: ['reply\\s+form', 'response\\s+form', '(?:enclosed|attached)\\s+form'],
      },
      {
        fact: 'Saying debt advice is needed gives at least a further 30 days',
        any: ['debt\\s+advice', '(?:further|extra|additional|another)\\s+(?:30|thirty)\\s+days'],
      },
      {
        fact: 'Part of the debt may be more than six years old and advice should be taken about that',
        any: ['(?:six|6)\\s+years', 'statute[-\\s]barred', 'limitation'],
      },
    ],
    mustNot: [
      {
        claim: 'Says court proceedings have already started or a judgment has been made',
        any: [
          'court\\s+(?:proceedings|action|claim)\\s+(?:have|has)\\s+(?:already\\s+)?(?:been\\s+)?(?:started|begun|issued)',
          '(?:county\\s+court\\s+judge?ment|\\bCCJ\\b)\\s+(?:has|have)\\s+been',
          'you\\s+(?:are\\s+being|have\\s+been)\\s+(?:sued|taken\\s+to\\s+court)',
        ],
      },
      {
        claim: 'States as fact that the debt is statute-barred or cannot be enforced',
        any: ['(?:debt|it)\\s+is\\s+(?:statute[-\\s]barred|unenforceable|too\\s+old\\s+to)'],
      },
    ],
    judge:
      'The answer must say the recipient has 30 days to reply using the reply form or risk court proceedings, and should get advice because part of the debt may be over six years old.',
  },
  {
    id: 'blood-test',
    required: [
      {
        fact: 'Ferritin is low (9 µg/L), which suggests iron deficiency',
        any: ['iron[-\\s]deficien', 'low\\s+(?:in\\s+)?iron', 'iron\\s+(?:levels?|stores?)\\s+(?:is|are)\\s+low', 'ferritin'],
      },
      {
        fact: 'Haemoglobin is slightly low (118 g/L)',
        any: ['ha?emoglobin', '\\b118\\b'],
      },
      {
        fact: 'Start ferrous fumarate 210 mg tablets',
        any: ['ferrous\\s+fumarate', '210\\s*mg', 'iron\\s+(?:tablets?|supplements?)'],
      },
      {
        fact: 'One tablet twice a day',
        any: ['twice\\s+(?:a|per|each)\\s+day', 'twice\\s+daily', '(?:two|2)\\s*(?:x|times)\\s+(?:a|per)\\s+day', '\\bb\\.?d\\.?\\b'],
      },
      {
        fact: 'Repeat the blood test in 8 weeks',
        any: ['(?:8|eight)\\s*-?\\s*weeks?', '(?:two|2)\\s+months'],
      },
      {
        fact: 'Contact the practice for severe stomach pain or black stools',
        any: ['(?:stomach|abdominal|tummy)\\s+pain', 'black\\s+stools?'],
      },
    ],
    mustNot: [
      {
        claim: 'Gives a different dose frequency (once or three times a day)',
        any: ['(?:once|three\\s+times|3\\s+times)\\s+(?:a|per|each)\\s+day', '(?:once|three\\s+times)\\s+daily'],
      },
      {
        claim: 'Says the results are normal',
        any: ['results?\\s+(?:are|were|is|came\\s+back)\\s+(?:all\\s+)?normal'],
      },
    ],
    judge:
      'The answer must say the tests suggest iron deficiency, that the recipient should take ferrous fumarate 210 mg twice a day, and should repeat the blood test in 8 weeks.',
  },

  // ---- HOLDOUT ----
  {
    id: 'email-thread',
    required: [
      {
        fact: 'The heating engineer did not turn up for the booked visit on Thursday 12 November',
        any: [
          '(?:did\\s+not|didn.?t|failed\\s+to|never)\\s+(?:turn\\s+up|arrive|attend|show|come)',
          'no[-\\s]show',
          'missed\\s+(?:the\\s+)?(?:visit|appointment)',
        ],
      },
      {
        fact: 'The household has had no heating for nine days',
        any: ['(?:nine|9)\\s+days'],
      },
      { fact: 'A child in the home has asthma, which makes it urgent', any: ['asthma'] },
      {
        fact: 'The tenant asks the agent to confirm a new visit this week',
        any: ['this\\s+week', 'new\\s+(?:visit|appointment|date)', 're-?book', 'reschedul'],
      },
      {
        fact: 'The tenant is at home after 4pm',
        any: ['(?:after|from)\\s+4\\s*(?:[:.]00)?\\s*p\\.?m', 'after\\s+16[:.]00', 'after\\s+four'],
      },
      {
        fact: 'The problem is a broken boiler; the contractor was Calder Heating',
        any: ['boiler', 'Calder\\s+Heating'],
      },
    ],
    mustNot: [
      {
        claim: 'Says a new engineer visit has already been booked or confirmed',
        any: ['(?:new|another|second)\\s+(?:visit|appointment)\\s+(?:has\\s+been|is|was)\\s+(?:booked|confirmed|arranged|scheduled)'],
      },
      { claim: 'Invents a legal deadline or a compensation amount that the messages do not mention', any: [] },
    ],
    judge:
      'The answer must say the engineer missed the visit on Thursday 12 November, the home has had no heating for nine days, and the tenant is asking for a new visit this week.',
  },
  {
    id: 'payslip',
    required: [
      { fact: 'Net pay is £1,904.20', any: money('1,904.20') },
      { fact: 'Gross pay is £2,359.50', any: money('2,359.50') },
      { fact: 'The pay date is 27 November 2026', any: date(27, 11, 2026) },
      { fact: 'PAYE tax of £232.40 was deducted', any: money('232.40') },
      { fact: 'National Insurance of £104.92 was deducted', any: money('104.92') },
      { fact: 'A pension contribution of £117.98 (5%) was deducted', any: money('117.98') },
    ],
    mustNot: [
      {
        claim: 'Gives gross pay or basic pay as the take-home amount',
        any: ['(?:net\\s+pay|take[-\\s]home(?:\\s+pay)?)\\s*(?:is|was|of|:)?\\s*£\\s?(?:2,?359\\.50|2,?112(?:\\.00)?)'],
      },
      { claim: 'Says the employee owes money or has to make a payment', any: [] },
    ],
    judge:
      'The answer must say the employee takes home £1,904.20 on 27 November 2026 out of £2,359.50 gross, after tax, National Insurance and pension.',
  },
  {
    id: 'tenancy',
    required: [
      {
        fact: 'The tenancy is a fixed term of 12 months',
        any: ['(?:12|twelve)\\s*-?\\s*months?', '(?:one|1|a)[-\\s]year'],
      },
      { fact: 'It begins on 1 December 2026', any: date(1, 12, 2026) },
      { fact: 'The rent is £975.00 a month, paid in advance on the first of the month', any: money('975.00') },
      { fact: 'A deposit of £1,125.00 is payable on signing', any: money('1,125.00') },
      {
        fact: "No subletting or lodgers without the landlord's written consent",
        any: ['sub-?let', 'lodgers?'],
      },
      {
        fact: "The landlord must give at least 24 hours' written notice for access, except in an emergency",
        any: ['(?:24|twenty[-\\s]four)\\s*-?\\s*hours?'],
      },
    ],
    mustNot: [
      {
        claim: 'Swaps the rent and the deposit',
        any: ['rent\\s+(?:is|of|will\\s+be)\\s+£\\s?1,?125', 'deposit\\s+(?:is|of|will\\s+be)\\s+£\\s?975'],
      },
      { claim: 'Says the landlord may enter without notice when there is no emergency', any: [] },
    ],
    judge:
      'The answer must give the core terms correctly: 12 months from 1 December 2026, £975 a month in advance, and a £1,125 deposit to be protected within 30 days.',
  },
  {
    id: 'us-hospital-bill',
    required: [
      { fact: 'The balance owed is $1,284.60', any: money('1,284.60', '$') },
      { fact: 'It should be paid by December 1, 2026', any: date(1, 12, 2026, true) },
      {
        fact: 'Or the recipient can call to set up a payment plan',
        any: ['payment\\s+(?:plan|arrangement)', 'pay\\s+in\\s+instal+ments'],
      },
      {
        fact: 'Without contact the account may be referred to a collection agency',
        any: ['collections?\\b', 'debt\\s+collector'],
      },
      {
        fact: 'This is the second notice',
        any: ['second\\s+(?:notice|reminder|letter|time)', '2nd\\s+notice'],
      },
      {
        fact: 'To dispute the bill, send a copy of the Explanation of Benefits',
        any: ['Explanation\\s+of\\s+Benefits', '\\bEOB\\b'],
      },
    ],
    mustNot: [
      {
        claim: 'Gives $3,415.40 (what the insurer paid) as the amount the recipient owes',
        any: [
          '(?:you\\s+owe|balance\\s+(?:of|is)|amount\\s+due\\s+(?:of|is)|must\\s+pay|need\\s+to\\s+pay)\\s+\\$\\s?3,?415\\.40',
        ],
      },
      {
        claim: 'Tells the recipient to send their full Social Security number (only the last four digits are asked for)',
        any: [
          '(?:full|complete|entire)\\s+Social\\s+Security',
          '(?:send|include|provide|give)\\s+your\\s+Social\\s+Security\\s+number',
        ],
      },
    ],
    judge:
      'The answer must say the recipient owes $1,284.60 and has to pay or arrange a payment plan by December 1, 2026 to avoid the account going to a collection agency.',
  },
  {
    id: 'short-note',
    required: [
      {
        fact: 'A parcel for the recipient was left with a neighbour',
        any: ['parcel', 'package', 'delivery'],
      },
      {
        fact: 'The neighbour is in until 6 tonight',
        any: [
          '\\b6\\s*(?:p\\.?m\\.?|o.?clock|tonight|this\\s+evening)',
          '(?:until|till|by|before)\\s+(?:6|six)\\b',
          '\\b18[:.]00',
        ],
      },
      {
        fact: 'The recipient can collect it or ring the neighbour',
        any: ['collect', 'pick\\s+(?:it\\s+|the\\s+parcel\\s+)?up', '\\bring\\b', '\\bcall\\b', 'phone'],
      },
    ],
    mustNot: [
      {
        claim: 'Says the parcel went back to a depot or needs redelivery',
        any: ['(?:returned|taken\\s+back|sent\\s+back)\\s+to\\s+(?:the\\s+)?(?:depot|sender|sorting\\s+office)', 're-?deliver'],
      },
      { claim: 'Invents a date, a fee or a collection deadline beyond "6 tonight"', any: [] },
    ],
    judge:
      'The answer must say a neighbour is holding a parcel and the recipient can collect it before 6 tonight or phone them.',
  },
  {
    id: 'two-page-decision',
    required: [
      {
        fact: 'The decision was changed: standard rate of the daily living component is awarded',
        any: ['standard\\s+rate[^.\\n]{0,40}daily\\s+living', 'daily\\s+living[^.\\n]{0,60}standard\\s+rate'],
      },
      {
        fact: 'There is no entitlement to the mobility component',
        any: [
          'not\\s+entitled[^.\\n]{0,40}mobility',
          'mobility[^.\\n]{0,60}(?:\\bnot\\b|\\bno\\b|refus|declin|n.t\\b|turned\\s+down)',
          '\\bno\\s+(?:award\\s+for\\s+(?:the\\s+)?)?mobility',
          '(?:not|n.t)\\s+(?:been\\s+)?(?:awarded|get|receive|qualify\\s+for)[^.\\n]{0,30}mobility',
        ],
      },
      { fact: 'The payment is £73.90 a week', any: money('73.90') },
      { fact: 'Arrears of £960.70 will be paid within 10 working days', any: money('960.70') },
      {
        fact: 'The decision can be appealed to an independent tribunal',
        any: ['tribunal'],
      },
      {
        fact: 'An appeal must be made within one month of the date of the notice',
        any: ['(?:one|1|a)\\s+month', 'month\\s+of\\s+the\\s+date', date(13, 12, 2026)[0]],
      },
    ],
    mustNot: [
      {
        claim: 'Says the enhanced rate was awarded',
        any: ['(?:been\\s+awarded|are\\s+entitled\\s+to|will\\s+(?:receive|get)|qualify\\s+for)\\s+(?:the\\s+)?enhanced\\s+rate'],
      },
      {
        claim: 'Says the claim was refused or the decision was left unchanged',
        any: [
          'decision\\s+(?:has\\s+not|hasn.?t|was\\s+not|wasn.?t|remains?)\\s+(?:been\\s+)?(?:changed|unchanged|the\\s+same)',
          '(?:claim|application)\\s+(?:has\\s+been|was|is)\\s+(?:refused|rejected|turned\\s+down|denied)',
        ],
      },
    ],
    judge:
      'The answer must say the decision was changed to award the standard rate of daily living (£73.90 a week, no mobility component) and that any appeal to a tribunal must be made within one month.',
  },
  {
    id: 'chat-export',
    required: [
      { fact: 'The rent is £850 a month', any: money('850') },
      { fact: 'The flat is available from 5 December', any: date(5, 12, 2026) },
      {
        fact: 'A viewing is booked for 10:30',
        any: ['\\b10[:.]30', 'half\\s+past\\s+ten'],
      },
      {
        fact: 'The viewing is on Saturday 21st',
        any: ['Saturday', ...date(21, 11, 2026), '\\b21st\\b'],
      },
      {
        fact: 'Photo ID and three months of bank statements are needed for referencing',
        any: ['bank\\s+statements?', 'photo\\s+ID', 'photo(?:graphic)?\\s+identification'],
      },
      { fact: "The holding deposit is one week's rent, £196", any: money('196') },
    ],
    mustNot: [
      {
        claim: 'Gives £850 as the holding deposit',
        any: ['holding\\s+deposit\\s+(?:is|of|will\\s+be)\\s+£\\s?850'],
      },
      {
        claim: 'Says the flat has been secured, reserved or let to the enquirer',
        any: ['(?:flat|tenancy|property)\\s+(?:is|has\\s+been)\\s+(?:now\\s+)?(?:secured|reserved|yours)'],
      },
    ],
    judge:
      'The answer must say a viewing is booked for Saturday 21st at 10:30 for a flat at £850 a month, and that photo ID, three months of bank statements and a £196 holding deposit will be needed.',
  },
  {
    id: 'referral-form',
    required: [
      { fact: 'This is a referral to community physiotherapy', any: ['physio'] },
      {
        fact: 'The reason is left knee pain for 5 months after a fall at work',
        any: ['left\\s+knee', 'knee\\s+pain'],
      },
      {
        fact: 'An X-ray shows moderate osteoarthritis',
        any: ['osteoarthritis', '\\bOA\\b'],
      },
      {
        fact: 'Naproxen 500 mg twice daily has not helped',
        any: ['naproxen'],
      },
      {
        fact: 'A Somali interpreter is needed',
        any: ['Somali', 'interpreter'],
      },
      {
        fact: 'The urgency is routine',
        any: ['routine', 'non-?urgent', 'not\\s+urgent'],
      },
    ],
    mustNot: [
      {
        claim: 'Says the referral is urgent',
        any: ['(?<!non-)(?<!non\\s)(?<!not\\s)urgent\\s+referral', '(?<!not\\s)urgently\\s+referred', 'urgency:\\s*urgent'],
      },
      {
        claim: 'Gets the side or the severity wrong (right knee, severe osteoarthritis)',
        any: ['right\\s+knee', 'severe\\s+osteoarthritis'],
      },
    ],
    judge:
      'The answer must say this is a routine physiotherapy referral for left knee pain with moderate osteoarthritis on X-ray, and that a Somali interpreter is needed.',
  },
];
