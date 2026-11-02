import { getPlatformDict } from "@/lib/i18n-platform";
import { LegalDraft } from "../legal-draft";

// Draft: kept out of search engines until the real text is in.
export const metadata = { robots: { index: false } };

export default async function Impressum({ params }: PageProps<"/[locale]/impressum">) {
  const { locale } = await params;
  const t = getPlatformDict(locale);
  return <LegalDraft title={t.impressum} text={t.impressumDraft} draft={t.draft} />;
}
