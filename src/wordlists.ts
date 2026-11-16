/**
 * Two word lists, loaded only when asked for (about 325 KB compressed):
 * people's names, and ordinary English words. They let the marker see a name
 * that carries no capital letter, as in a chat typed in lower case.
 *
 * Sources and licences are in docs/wordlists.md. Until the lists are loaded
 * every lookup answers "no", so nothing breaks without them.
 */
let names: Set<string> | null = null;
let common: Set<string> | null = null;
let loading: Promise<void> | null = null;

export function loadWordLists(): Promise<void> {
  loading ??= (async () => {
    const [n, c] = await Promise.all([import('./data/names.txt?raw'), import('./data/common-words.txt?raw')]);
    names = new Set(n.default.split(/\r?\n/).filter(Boolean));
    common = new Set(c.default.split(/\r?\n/).filter(Boolean));
  })();
  return loading;
}

export const wordListsLoaded = (): boolean => names !== null && common !== null;
/** A given name or surname from the list. The list leaves out names that are also very common words. */
export const isListedName = (word: string): boolean => names?.has(word.toLowerCase()) ?? false;
/** One of about 30,000 ordinary English word forms. */
export const isCommonWord = (word: string): boolean => common?.has(word.toLowerCase()) ?? false;
