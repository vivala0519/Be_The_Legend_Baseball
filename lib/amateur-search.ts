import type { AmateurAffiliation } from "./amateur";

const schoolSuffix = /(?:고등학교|고교|高等学校|高校|high\s*school)\s*$/iu;

function foldSearch(value: string) {
  return value.normalize("NFKD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function createAffiliationSearch(choices: readonly AmateurAffiliation[]) {
  const index = choices.map(entry => ({
    entry,
    text: [entry.name, entry.nativeName ?? "", entry.region, ...(entry.searchAliases ?? [])].map(foldSearch).join("\0"),
  }));
  return (query: string): readonly AmateurAffiliation[] => {
    const terms = query.trim().replace(schoolSuffix, "").split(/\s+/u).map(foldSearch).filter(Boolean);
    if (!terms.length) return choices;
    return index.filter(({ text }) => terms.every(term => text.includes(term))).map(({ entry }) => entry);
  };
}
