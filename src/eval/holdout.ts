import type { EntityKind } from '../airlock';
import type { Fixture, Gold } from './fixtures';

/**
 * Hold-out letters. Written after the scrub prompt and patterns were tuned on
 * FIXTURES, in formats that set lacks, and never used for tuning. Recall on
 * this set is the honest number. Every person, organisation, address and
 * number here is made up.
 *
 * Run with `EVAL_SET=holdout npm run eval`.
 */
const g = (kind: EntityKind, value: string, who: 'subject' | 'other' = 'subject'): Gold => ({
  kind,
  value,
  who,
});

export const HOLDOUT: Fixture[] = [
  {
    id: 'email-thread',
    title: 'Email thread with a letting agent',
    text: `From: Marguerite Okonkwo-Hale <m.okonkwohale@fastmail.example>
To: lettings@brackenridge.example
Subject: Re: Boiler still broken at 41 Sedge Row

Hi Gareth,

Thanks for getting back to me. The engineer did not turn up on Thursday 12 November, and we have now had no heating for nine days. My daughter Ottilie has asthma, so this is urgent.

Can you confirm a new visit this week? I am home after 4pm. My mobile is 07700 900344.

Marguerite

> On 10 Nov 2026, Gareth Pym wrote:
> Hi Marguerite, I have booked Calder Heating for Thursday between 8 and 12. The job number is CH-20931.
> Gareth Pym
> Brackenridge Lettings
`,
    gold: [
      g('PERSON', 'Marguerite'),
      g('PERSON', 'Okonkwo-Hale'),
      g('PERSON', 'Ottilie'),
      g('PERSON', 'Gareth', 'other'),
      g('PERSON', 'Pym', 'other'),
      g('EMAIL', 'm.okonkwohale@fastmail.example'),
      g('ADDRESS', '41 Sedge Row'),
      g('PHONE', '07700 900344'),
      g('ID_NUMBER', 'CH-20931'),
    ],
    keep: ['Calder Heating', 'Thursday 12 November', 'nine days', 'asthma', 'Brackenridge Lettings'],
  },
  {
    id: 'payslip',
    title: 'Payslip',
    text: `HOLLOWAY & STRAND LOGISTICS LTD
PAYSLIP

Employee: Bartholomew Achebe
Employee no: 118204
NI number: PX 41 77 29 C
Tax code: 1257L
Pay date: 27 November 2026
Department: Warehouse (Nights)

Basic pay      160.00 hrs @ £13.20    £2,112.00
Overtime        12.50 hrs @ £19.80      £247.50
Gross pay                              £2,359.50

PAYE tax                                 £232.40
National Insurance                       £104.92
Pension (5%)                             £117.98
Net pay                                £1,904.20

Paid by BACS to account ending 4471, sort code 40-11-62.

Queries: payroll@hollowaystrand.example or speak to Renata Vasquez in Payroll.
`,
    gold: [
      g('PERSON', 'Bartholomew'),
      g('PERSON', 'Achebe'),
      g('ID_NUMBER', '118204'),
      g('ID_NUMBER', 'PX 41 77 29 C'),
      g('ACCOUNT', '40-11-62'),
      g('PERSON', 'Renata', 'other'),
      g('PERSON', 'Vasquez', 'other'),
    ],
    keep: ['Net pay', '£1,904.20', '1257L', '27 November 2026', '£2,359.50'],
  },
  {
    id: 'tenancy',
    title: 'Tenancy agreement extract',
    text: `ASSURED SHORTHOLD TENANCY AGREEMENT (EXTRACT)

1. PARTIES
1.1 The Landlord: Cornelius Fairweather of Rookery Cottage, Mill Lane, Ashby St Ledgers.
1.2 The Tenant: Anneliese Brandt and Kwabena Mensah-Bonsu, jointly and severally.

2. THE PROPERTY
2.1 The dwelling known as Flat 6, Tannery Wharf, 19 Canal Street, Nottingham NG1 7EH, together with the fixtures and furniture listed in the inventory.

3. TERM AND RENT
3.1 The tenancy is for a fixed term of 12 months beginning on 1 December 2026.
3.2 The rent is £975.00 per calendar month, payable in advance on the first day of each month.
3.3 A deposit of £1,125.00 is payable on signing and will be protected with the Deposit Protection Service within 30 days.

4. TENANT'S OBLIGATIONS
4.1 The Tenant must not sublet the Property or take in lodgers without the Landlord's written consent.
4.2 The Tenant must allow the Landlord access on at least 24 hours' written notice, except in an emergency.

Signed by the Landlord: C. Fairweather
Signed by the Tenant: A. Brandt, K. Mensah-Bonsu
`,
    gold: [
      g('PERSON', 'Anneliese'),
      g('PERSON', 'Brandt'),
      g('PERSON', 'Kwabena'),
      g('PERSON', 'Mensah-Bonsu'),
      g('ADDRESS', 'Tannery Wharf'),
      g('ADDRESS', '19 Canal Street'),
      g('POSTCODE', 'NG1 7EH'),
      g('PERSON', 'Cornelius', 'other'),
      g('PERSON', 'Fairweather', 'other'),
      g('ADDRESS', 'Rookery Cottage', 'other'),
      g('ADDRESS', 'Mill Lane', 'other'),
    ],
    keep: ['12 months', '1 December 2026', '£975.00', '£1,125.00', 'Deposit Protection Service', '24 hours'],
  },
  {
    id: 'us-hospital-bill',
    title: 'Hospital bill from the United States',
    text: `Lakeshore Regional Medical Center
Patient Financial Services
2200 Harbor View Drive, Duluth, MN 55802

November 9, 2026

Mr. Desmond Okafor Jr.
1847 W. Juniper Street, Apt 3B
Duluth, MN 55811

Account #: 7733-204419
Date of service: October 2, 2026

Dear Mr. Okafor,

This is your second notice. Our records show a balance of $1,284.60 for the emergency room visit listed above. Your insurer, Northstar Health Plan, paid $3,415.40 and applied the remainder to your deductible.

Please pay the balance by December 1, 2026, or call us at (218) 555-0142 to set up a payment plan. If we do not hear from you, the account may be referred to a collection agency.

If you believe this is an error, send a copy of your Explanation of Benefits to billing@lakeshoremed.example. Please include your date of birth (03/22/1979) and the last four digits of your Social Security number.

Sincerely,
Carmen Delgado-Ruiz
Patient Account Representative
`,
    gold: [
      g('PERSON', 'Desmond'),
      g('PERSON', 'Okafor'),
      g('ADDRESS', '1847 W. Juniper Street'),
      g('POSTCODE', '55811'),
      g('ACCOUNT', '7733-204419'),
      g('DOB', '03/22/1979'),
      g('PERSON', 'Carmen', 'other'),
      g('PERSON', 'Delgado-Ruiz', 'other'),
    ],
    keep: ['$1,284.60', 'December 1, 2026', 'Northstar Health Plan', 'Lakeshore Regional Medical Center', 'second notice'],
  },
  {
    id: 'short-note',
    title: 'Very short note from a neighbour',
    text: `Hi Zofia - it's Leopold from number 12. A parcel for you was left with me while you were out, tracking JD0002 4471 9938. I'm in until 6 tonight, or ring me on 07700 900517. Leo
`,
    gold: [
      g('PERSON', 'Zofia'),
      g('ID_NUMBER', 'JD0002 4471 9938'),
      g('PERSON', 'Leopold', 'other'),
      g('PERSON', 'Leo', 'other'),
      g('PHONE', '07700 900517', 'other'),
    ],
    keep: ['parcel', '6 tonight'],
  },
  {
    id: 'two-page-decision',
    title: 'Two-page benefit decision letter',
    text: `Department for Work and Pensions
Disability Benefits Centre 4
Post Handling Site B, Wolverhampton WV99 1AH

Miss Saoirse Ní Bhraonáin
Top Floor Flat, 62 Chandlers Row
Bristol
BS5 9JQ

Our reference: KT 30 55 81 B
Date: 13 November 2026

Dear Miss Ní Bhraonáin,

MANDATORY RECONSIDERATION NOTICE - PERSONAL INDEPENDENCE PAYMENT

You asked us to look again at the decision dated 2 October 2026 about your claim for Personal Independence Payment. A different decision maker has looked at everything again, including the letter from your GP, Dr Florian Abernethy, and the statement from your support worker, Kezia Dlamini.

Page 1 of 2

WHAT WE HAVE DECIDED

We have changed the decision. You are entitled to the standard rate of the daily living component from 18 August 2026 to 17 August 2029. You are not entitled to the mobility component.

You scored 9 points for daily living. You need 8 points for the standard rate and 12 points for the enhanced rate. You scored 4 points for mobility. You need 8 points for the standard rate.

HOW WE REACHED THE DECISION

Preparing food: you told us you cannot stand at a cooker for more than a few minutes. Dr Abernethy's letter supports this. We awarded 2 points.

Managing therapy: Ms Dlamini told us she prompts you to take your medication each morning. We awarded 1 point.

Washing and bathing: you need a grab rail to get in and out of the bath. We awarded 2 points.

Engaging with other people: the assessor, Mr Tavish McAllister, recorded that you needed prompting during the consultation. We awarded 2 points.

Planning and following journeys: you told us that you travel alone by bus to your sister Aoife's house in Fishponds once a week. We awarded 4 points.

WHAT HAPPENS NEXT

We will pay £73.90 a week into the account ending 2206. Arrears of £960.70 will be paid within 10 working days.

If you disagree with this decision you can appeal to an independent tribunal. You must appeal within one month of the date of this notice. You will need to send a copy of this notice with your appeal.

If you want to talk about this decision, call 0800 121 4433 and quote your National Insurance number.

Yours sincerely,
D. Whitcombe
Decision Maker

Page 2 of 2
`,
    gold: [
      g('PERSON', 'Saoirse'),
      g('PERSON', 'Ní Bhraonáin'),
      g('PERSON', 'Aoife'),
      g('ADDRESS', '62 Chandlers Row'),
      g('POSTCODE', 'BS5 9JQ'),
      g('ID_NUMBER', 'KT 30 55 81 B'),
      g('PERSON', 'Florian', 'other'),
      g('PERSON', 'Abernethy', 'other'),
      g('PERSON', 'Kezia', 'other'),
      g('PERSON', 'Dlamini', 'other'),
      g('PERSON', 'Tavish', 'other'),
      g('PERSON', 'McAllister', 'other'),
      g('PERSON', 'Whitcombe', 'other'),
    ],
    keep: ['Personal Independence Payment', '£73.90', '£960.70', 'one month', '9 points', '18 August 2026', 'standard rate'],
  },
  {
    id: 'chat-export',
    title: 'Chat export with a letting agent',
    text: `[14/11/2026, 09:12] Ibrahim Qureshi: Morning, is the flat at 7b Garnet Terrace still available?
[14/11/2026, 09:15] Lettings - Petra: Hi Ibrahim, yes it is. £850 pcm, available from 5 December. Would you like a viewing?
[14/11/2026, 09:16] Ibrahim Qureshi: Yes please. Saturday morning if possible. My partner Noor will come too.
[14/11/2026, 09:20] Lettings - Petra: Saturday 21st at 10:30 works. Can I take an email for the confirmation?
[14/11/2026, 09:21] Ibrahim Qureshi: ibby.q84@inbox.example and my number is 07700 900268
[14/11/2026, 09:24] Lettings - Petra: Thanks. You will need photo ID and three months of bank statements for referencing. The holding deposit is one week's rent, £196.
`,
    gold: [
      g('PERSON', 'Ibrahim'),
      g('PERSON', 'Qureshi'),
      g('PERSON', 'Noor'),
      g('ADDRESS', '7b Garnet Terrace'),
      g('EMAIL', 'ibby.q84@inbox.example'),
      g('PHONE', '07700 900268'),
      g('PERSON', 'Petra', 'other'),
    ],
    keep: ['£850', '5 December', '10:30', '£196', 'three months'],
  },
  {
    id: 'referral-form',
    title: 'Physiotherapy referral form',
    text: `REFERRAL FORM - COMMUNITY PHYSIOTHERAPY

Surname: Abdulkadir        Forename(s): Hamza Yusuf
Preferred name: Hamza      Title: Mr
D.O.B: 29/01/1968           NHS No: 701 228 4410
Address: 3 Coopers Fold, Oldham        Postcode: OL4 2RW
Tel (home): 0161 496 0823   Tel (mobile): 07700 900931
Next of kin: Maryam Abdulkadir (wife)

Referred by: Dr P. Underhill, Saddleworth Road Surgery
Date of referral: 11/11/2026

Reason for referral: Left knee pain for 5 months following a fall at work. X-ray on 30/10/2026 shows moderate osteoarthritis. Not improving with naproxen 500 mg twice daily.

Interpreter needed: Yes - Somali
Urgency: Routine
`,
    gold: [
      g('PERSON', 'Abdulkadir'),
      g('PERSON', 'Hamza'),
      g('PERSON', 'Yusuf'),
      g('PERSON', 'Maryam'),
      g('DOB', '29/01/1968'),
      g('ID_NUMBER', '701 228 4410'),
      g('ADDRESS', '3 Coopers Fold'),
      g('POSTCODE', 'OL4 2RW'),
      g('PHONE', '0161 496 0823'),
      g('PHONE', '07700 900931'),
      g('PERSON', 'Underhill', 'other'),
    ],
    keep: ['Left knee pain', 'osteoarthritis', 'naproxen 500 mg', 'Somali', 'Routine', '5 months'],
  },
];
