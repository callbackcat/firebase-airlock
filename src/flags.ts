/**
 * Switches for changes that are being measured one at a time. A change that
 * is kept moves into DEFAULT_FLAGS; one that is rejected stays off and is
 * written up in docs/. Set VITE_FLAGS (comma separated) to override, or
 * VITE_FLAGS=none for none.
 *
 *   m1  a label for medicines, conditions, tests and procedures; never hidden
 *   m2  a word also written in lower case, or followed by a dose, is not a name
 *   o1  a role word or "seen by" followed by capitalised words is a name
 *   o2  the halves of a hyphenated surname are hidden on their own too
 *   o3  two or more capitalised words labelled "other" are hidden
 *   o4  a second vote on name-like items that were labelled not personal
 *   w1  in chat-like text, speaker labels and names after a greeting are marked
 *   w2  postcodes beyond the UK: Canada, Ireland, US ZIP
 *   adj a capitalised word directly before a hidden person is marked, even at the start of a sentence
 *   yesno  the model answers PERSONAL or NOT instead of six labels
 */
export const DEFAULT_FLAGS = '';

const raw = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_FLAGS;
export const FLAGS = new Set(
  (raw === undefined || raw === '' ? DEFAULT_FLAGS : raw)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'none'),
);
export const on = (flag: string): boolean => FLAGS.has(flag);
