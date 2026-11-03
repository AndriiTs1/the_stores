import { isLocale, type Locale } from "./i18n";

/** Texts of the platform's own pages (legal notice, privacy policy). Storefront texts stay in i18n.ts. */
const de = {
  language: "Sprache",
  draft: "Entwurf",
  impressum: "Impressum",
  impressumDraft: "Die Angaben zum Betreiber dieser Website werden hier ergänzt, sobald sie feststehen.",
  privacy: "Datenschutzerklärung",
  privacyDraft: "Die Datenschutzerklärung dieser Website wird hier ergänzt, sobald sie feststeht.",
};

/** Every locale must define exactly the keys of the German dictionary. */
export type PlatformDict = Record<keyof typeof de, string>;

const dict: Record<Locale, PlatformDict> = {
  de,
  fr: {
    language: "Langue",
    draft: "Projet",
    impressum: "Mentions légales",
    impressumDraft: "Les informations sur l'exploitant de ce site seront ajoutées ici dès qu'elles seront définies.",
    privacy: "Déclaration de protection des données",
    privacyDraft: "La déclaration de protection des données de ce site sera ajoutée ici dès qu'elle sera définie.",
  },
  it: {
    language: "Lingua",
    draft: "Bozza",
    impressum: "Note legali",
    impressumDraft: "Le informazioni sul gestore di questo sito saranno aggiunte qui non appena definite.",
    privacy: "Informativa sulla protezione dei dati",
    privacyDraft: "L'informativa sulla protezione dei dati di questo sito sarà aggiunta qui non appena definita.",
  },
  en: {
    language: "Language",
    draft: "Draft",
    impressum: "Legal notice",
    impressumDraft: "Details of the operator of this website will be added here once they are final.",
    privacy: "Privacy policy",
    privacyDraft: "The privacy policy of this website will be added here once it is final.",
  },
};

export function getPlatformDict(locale: string): PlatformDict {
  return isLocale(locale) ? dict[locale] : dict.de;
}
