# Word lists

Two bundled lists, built by `scripts/build-wordlists.py` from open sources only.

| File | What it is | Entries | Size | gzip -9 |
| --- | --- | --- | --- | --- |
| `src/data/names.txt` | Given names and surnames, lower case | @@NAMES_COUNT@@ | @@NAMES_BYTES@@ bytes | @@NAMES_GZ@@ bytes |
| `src/data/common-words.txt` | Ordinary English word forms, lower case | 30,000 | @@WORDS_BYTES@@ bytes | @@WORDS_GZ@@ bytes |

Both files are UTF-8, one entry per line, sorted by code point, with a final
newline. Built on 15 November 2026.

- `names.txt`: letters only, three letters or more. A name with a hyphen, an
  apostrophe or a space is split into its parts (`o'brien` gives `brien`,
  `abdul-rahman` gives `abdul` and `rahman`). A part with an accent is listed
  twice, as written and without the accent (`zoë` and `zoe`); @@NAMES_NONASCII@@
  entries have a non-ASCII letter.
- `common-words.txt`: letters and apostrophes only (`don't`, `o'clock`).

A token can be in both files; @@BOTH@@ are, for example `abbey`, `amber`,
`almond` and `cherry`. Read that as "a name or a word, depending on context".
Only names that are among the 5,000 most frequent common words were taken out
of `names.txt` (see below).

## Rebuild

```bash
python scripts/build-wordlists.py              # download what is missing, then build
python scripts/build-wordlists.py --offline    # build from the files already downloaded
python scripts/build-wordlists.py --no-wikidata # download files, but do not query Wikidata
```

Python 3.10 or later, standard library only. Raw downloads go to
`outside-data/wordlists-raw/` (git-ignored; another folder can be given in the
`WORDLISTS_RAW` environment variable). About 135 MB. The script prints the
counts, sizes and examples quoted in this document. All quotas are constants at
the top of the script.

The Wikidata step is slow: the public query service allowed anonymous clients
about one request a minute when this was built and counted refused requests
too, so the script waits 130 seconds between requests. Lists that fail are
skipped and named in the output; the build still works without them.

## Sources

Every licence below was read at its source on 15 November 2026. Quotes are
copied from the page or file named.

### 1. US Census Bureau, Frequently Occurring Surnames from the 2010 Census

- URL: <https://www2.census.gov/topics/genealogy/2010surnames/names.zip>
  (file `Names_2010Census.csv`; listed at
  <https://www.census.gov/topics/population/genealogy/data/2010_surnames.html>)
- Licence: public domain, as a work of the United States Government.
- Evidence: 17 U.S.C. § 105(a), <https://www.law.cornell.edu/uscode/text/17/105>:
  "Copyright protection under this title is not available for any work of the
  United States Government". The Census Bureau's citation page
  (<https://www.census.gov/about/policies/citation.html>) asks only for a
  citation: "Data users who create their own estimates using data from
  disseminated tables and other data should cite the Census Bureau as the
  source of the original data only."
  Note: no sentence saying "public domain" was found on the download page
  itself; the status rests on the statute.
- Taken: the @@CENSUS_TOP@@ most frequent surnames of 162,253 (each borne by
  at least @@CENSUS_MIN@@ people in the 2010 Census). The first 2,000 also serve as
  "top surnames" in the common-word filter.
- Attribution (not required, given as asked): U.S. Census Bureau, "Frequently
  Occurring Surnames from the 2010 Census", 2016.

### 2. Office for National Statistics, baby names in England and Wales

- URLs:
  - <https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/livebirths/datasets/babynamesinenglandandwalesfrom1996>
    (file `babynames1996to2025.xlsx`: every name given to three or more babies in a year)
  - <https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/livebirths/datasets/babynamesenglandandwalestop100babynameshistoricaldata>
    (file `historicalnames2024.xlsx`: top 100 names for every tenth year, 1904 to 2024)
- Licence: Open Government Licence v3.0.
- Evidence: footer of both dataset pages: "All content is available under the
  Open Government Licence v3.0, except where otherwise stated". Cover sheet
  inside the workbook: "You may re-use this publication (not including logos)
  free of charge in any format or medium, under the terms of the Open
  Government Licence. Users should include a source accreditation to ONS -
  Source: Office for National Statistics licensed under the Open Government
  Licence." The licence itself
  (<https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/>):
  "You are free to: copy, publish, distribute and transmit the Information;
  adapt the Information; exploit the Information commercially and
  non-commercially".
- Taken: from the first file, each name with @@ONS_MIN@@ or more births in total
  over all the years in the file, boys and girls together; from the second
  file, every name. The 2,000 names with the most births, plus all the historic
  top-100 names, serve as "top given names" in the common-word filter.
- Attribution (required): Source: Office for National Statistics licensed under
  the Open Government Licence v.3.0. Contains public sector information
  licensed under the Open Government Licence v3.0.

### 3. Central Statistics Office, Ireland, baby names (tables VSA50 and VSA60)

- URLs:
  <https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/VSA50/CSV/1.0/en>
  (boys) and `.../VSA60/CSV/1.0/en` (girls); tables listed at <https://data.cso.ie/>.
- Licence: Creative Commons Attribution 4.0.
- Evidence: <https://www.cso.ie/en/aboutus/whoweare/copyrightpolicy/>:
  "Statistical information on this website is accessible free of charge and
  licensed under Creative Commons Attribution (CC BY 4.0)."
- Taken: each name with @@CSO_MIN@@ or more registrations in total, 1964 onwards,
  boys and girls together.
- Attribution (required): Source: Central Statistics Office, Ireland, tables
  VSA50 and VSA60, licensed under CC BY 4.0
  (<https://creativecommons.org/licenses/by/4.0/>). Changes: names were
  lower-cased, split, filtered by frequency and merged with other sources.

### 4. Wikidata, names of people by country of citizenship

- URL: <https://query.wikidata.org/sparql> (the query text is in the script,
  function `wikidata_query`).
- Licence: CC0 1.0.
- Evidence: <https://www.wikidata.org/wiki/Wikidata:Licensing> footer: "All
  structured data from the main, Property, Lexeme, and EntitySchema namespaces
  is available under the Creative Commons CC0 License".
- Taken: for each country, the English labels of the given-name items (P735)
  and family-name items (P734) of people whose country of citizenship (P27) is
  that country, with the number of people. Kept: names borne by @@WD_MIN@@ or more
  people of that country in Wikidata. Lists in this build (@@WD_N@@):
  @@WD_LISTS@@.
- Attribution: none required.
- Caveat: these are counts of people who have a Wikidata entry (mostly public
  figures, more men than women), not of the population.

### 5. SCOWL (Spell Checker Oriented Word Lists) 2020.12.07

- URL: <https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz>
  (project page <http://wordlist.aspell.net/>; the same text is at
  <https://github.com/en-wl/wordlist/blob/master/scowl/Copyright>).
- Licence: permissive (MIT-like) notice by Kevin Atkinson; component lists are
  public domain or under similar permissive notices. Only sizes 10 to 70 are
  used; the "UK Advanced Cryptics Dictionary", which has its own notice
  requirement, enters SCOWL only at size 80 and is not used.
- Evidence: file `Copyright` in the archive: "Permission to use, copy, modify,
  distribute and sell these word lists, the associated scripts, the output
  created from the scripts, and its documentation for any purpose is hereby
  granted without fee, provided that the above copyright notice appears in all
  copies and that both that copyright notice and this permission notice appear
  in supporting documentation." and "The 12Dicts package and Supplement is in
  the Public Domain."
- Taken: the lower-case `*-words` lists of sizes 10 to 70 (English, American,
  British with -ise and -ize spellings, Canadian, Australian, first-level
  variants) as the dictionary that says "this is an ordinary word" and as the
  source of inflected forms; the `*-contractions` lists up to size 40; the
  `*-upper` lists up to size 35 for days, months, nationalities and religions.
  The proper-name lists are not used.
- Attribution (required): the copyright and permission notices must appear in
  supporting documentation. The whole `Copyright` file is reproduced at the end
  of this document for that reason. Keep it with the word list.

### 6. Google Books Ngram data, through two derived lists

- Underlying data: Google Books Ngram Corpus, version 20200217,
  <https://storage.googleapis.com/books/ngrams/books/datasetsv3.html>.
  Evidence on that page: "This compilation is licensed under a Creative Commons
  Attribution 3.0 Unported License."
- 6a. `orgtre/google-books-ngram-frequency`,
  <https://github.com/orgtre/google-books-ngram-frequency>, files
  `ngrams/1grams_english.csv` (the 10,000 most frequent English words, cleaned
  by hand, names and other capitalised words removed) and
  `ngrams/more/english/1grams_english_1a_no_pos.csv` (the 10,000 most frequent
  raw words with letter case kept). Evidence, README: "The content of this
  repository is licensed under the Creative Commons Attribution 3.0 Unported
  License."
- 6b. `hackerb9/gwordlist`, <https://github.com/hackerb9/gwordlist>, file
  `frequency-alpha-alldicts.txt` (246,590 words that are in a dictionary, with
  counts, each under its most frequent capitalisation). Evidence, README:
  "While my programs are licensed under the GNU GPL ≥3, I'm explicitly
  releasing the data produced under the same license as Google granted me:
  Creative Commons Attribution 3.0." Only the data file is used, not the
  programs.
- Taken: the order of words by frequency, and which words are written mostly
  with a capital letter.
- Attribution (required): Word frequencies from the Google Books Ngram Corpus
  (version 20200217), © Google, licensed under CC BY 3.0
  (<https://creativecommons.org/licenses/by/3.0/>), through the lists compiled
  by orgtre (google-books-ngram-frequency) and hackerb9 (gwordlist), both CC BY
  3.0. Changes: filtered against a dictionary, names removed, inflected forms
  and a hand-written supplement added, cut to 30,000 entries, counts dropped.

### 7. Hand-written parts (this project's own work)

In the script: the list of about 230 UK letter words, 19 contractions with
`'s`, four always-ordinary titles (`lord`, `duke`, `pope`, `roman`), six
capitalised SCOWL entries that are not treated as everyday words, and the list
of name particles that are dropped (`del`, `der`, `van`, `von`, `bin`, ...).

## How `common-words.txt` is built

1. **Dictionary.** A word counts as an ordinary word only if it is a lower-case
   entry in SCOWL sizes 10 to 70 (141,303 forms, British and American
   spellings, inflected forms included), or a day, month, nationality or
   religion from the small SCOWL capitalised lists (`monday`, `april`,
   `english`, `muslim`), or a contraction.
2. **Order.** First the hand-cleaned top 10,000 of Google Books in its own
   order (9,828 pass the dictionary test; the 147 that fail are mostly places
   and proper nouns such as `america`, `india`, `jesus`). Then the remaining
   words of the larger Google Books list by count. That larger list holds
   dictionary headwords only, so regular inflected forms (plural, -ed, -ing)
   that are in SCOWL sizes 10 to 60 are added with an assumed 30% of the count
   of their base word; @@INFLECTED@@ such forms are in the final file.
3. **Names are taken out.** A word that is among the top 2,000 given names or
   the top 2,000 surnames stays only if it is a lower-case dictionary entry
   **and** books write it in lower case often enough: the lower-case form must
   have at least 40% of the count of the capitalised form in the
   case-sensitive top 10,000. If neither form is in that top 10,000, the word
   stays if it is in SCOWL sizes 10 to 35 or the larger list shows it mostly in
   lower case. So `will`, `may`, `mark`, `bill`, `rose`, `grace`, `hope`,
   `river`, `king`, `hill`, `cook` stay; `john`, `mary`, `jack`, `frank`,
   `smith`, `baker`, `walker`, `fox`, `eve`, `hunter` go (@@DROPPED@@ words in
   all). This is stricter than "keep it if a dictionary has it", because
   dictionaries list `john`, `jack`, `frank` and `smith` as words. Days,
   months, nationalities, religions and the four titles always stay.
4. **Cut.** The first 30,000 by this order, after making room for the
   contractions and the UK letter words.
5. **UK letter words.** @@SUPP_N@@ health, legal, housing, benefits and office words
   were checked against the first 30,000. @@SUPP_MISSING@@ were missing and were added:
   @@SUPP_LIST@@.

## How `names.txt` is built

1. Each source name is lower-cased and split into letter-only parts; parts
   shorter than three letters, parts not in Latin script and name particles are
   dropped.
2. Quotas (see the constants in the script): Census surnames by rank; ONS and
   CSO names by total births; Wikidata names by number of people.
3. **Overlap with common words.** Every token that is among the first 5,000
   common words (by the order described above) is removed: **@@OVERLAP@@ tokens**.
   Thirty examples, most frequent names first: @@OVERLAP_EX@@.
   `will`, `may`, `mark`, `bill`, `rose`, `grace`, `hope`, `art` and `page` are
   all among the removed.

Tokens before the overlap step, by source (a token can come from several):

| Source | Tokens | Only in this source |
| --- | --- | --- |
@@SOURCE_TABLE@@

## Sources looked at and not used

- **US Social Security Administration baby names** (`names.zip`). The data.gov
  entry gives the licence as CC0
  (<https://catalog.data.gov/dataset/baby-names-from-social-security-card-applications-national-data>),
  so the licence is fine, but `ssa.gov` answered 403 to scripted downloads. The
  block was not worked around. Someone can download the file by hand in a
  browser and add a reader for it.
- **sigpwned/popular-names-by-country-dataset** (GitHub). The repository says
  CC0, but its README says the data "is pulled from" two Wikipedia lists, and
  Wikipedia text is CC BY-SA. Unclear, so not used.
- **philipperemy/name-dataset** and similar lists built from leaked social
  network data: excluded by rule, never downloaded.
- **Peter Norvig's word count files**: no licence statement found. Not used.
- **wordfreq, hermitdave/FrequencyWords (OpenSubtitles)**: CC BY-SA, a
  share-alike licence that is not on this project's accepted list. Not used.
- **12dicts as a separate download**: its README says the inflected list
  (`2of12inf`) depends on AGID and so is not public domain. Not needed, because
  SCOWL already carries the 12dicts words with inflections under its own notice.
- **National Records of Scotland, Statistics Canada, Australian state
  registries**: not examined in this round.

## Known gaps

- **Names of two letters** (`li`, `wu`, `ng`, `xu`, `le`, `ho`, `yu`, `vo`) are
  left out by the three-letter rule. This mostly affects Chinese, Vietnamese
  and Korean surnames.
- **East Asian given names** are thin. Chinese, Japanese and Korean given names
  come only from ONS births, CSO and whatever Wikidata lists are in the build;
  East Asian surnames of three letters or more are well covered by the US
  Census file (`wang`, `zhang`, `kim`, `nguyen`, `tanaka`).
- **Given names of adults born outside the UK, Ireland and the US** come from
  Wikidata, which counts people with an encyclopedia entry. Women's names and
  everyday names that famous people rarely have are under-represented. This
  affects South Asian, West African, Eastern European and Arabic given names
  most; names that parents in England and Wales have used since 1996 are
  covered by ONS whatever their origin.
- **US given names**: the SSA file could not be downloaded, so older
  American-only given names are covered only where they also occur in the
  other sources.
- **Surnames are US-weighted.** The only surname file with population counts is
  the US Census. Surnames common in the UK or Ireland but rare in the US, and
  surnames of groups that are small in the US (for example Somali, Lithuanian,
  Bangladeshi, Ghanaian), depend on the Wikidata lists.
- **Slavic and Baltic feminine surnames** (`kowalska`, `nováková`,
  `kazlauskienė`) are covered only partly.
- **Spelling variants** of transliterated names (`mohammed`, `muhammad`,
  `mohamed`, ...) are listed only when a source has them.
- **Accents**: an accented form is listed only where a source wrote it with the
  accent; most sources write names without accents.
- **Name or word?** Names that are also everyday words beyond the 5,000 most
  frequent stay in `names.txt` and are in both files (`abbey`, `amber`,
  `cherry`). Names inside the first 5,000 are only in `common-words.txt`
  (`summer`, `faith`, `river`, `king`), so a person called Summer or King is
  not caught by the name list in lower-case text. Months and nationalities that
  are also names (`april`, `june`, `christian`) count as ordinary words and are
  not in `names.txt` either. Going the other way, `frank`, `max`, `dan`, `eve`,
  `fox`, `walker` and `baker` are only in `names.txt`, so "to be frank" or "the
  baker" will look like a name.
- The frequency order comes from books (Google Books), not from letters or
  chat, and the frequency of added inflected forms is an estimate.

## What was not tested

- The lists are not wired into the app; nothing in `src/` reads them yet.
- `npm test`, `npm run eval` and the other project scripts were not run for
  this change (a benchmark was running).
- The script was run on Windows 11 with Python 3.12 only.
- A rebuild from an empty raw folder in a single run was not done: the large
  files were downloaded once and reused, the script's own download step was
  exercised for four of the nine files (ONS historic, SCOWL, both orgtre
  files) and gave byte-identical copies, and the Wikidata lists were fetched
  over several runs.

## Appendix: SCOWL copyright file

Reproduced as required by the SCOWL notice, from `scowl-2020.12.07/Copyright`.

