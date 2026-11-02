import type { Metadata } from "next";
import { getPlatformDict } from "@/lib/i18n-platform";
import { platformAlternates } from "@/lib/platform";
import { LegalDraft } from "../legal-draft";

export async function generateMetadata({ params }: PageProps<"/[locale]/datenschutz">): Promise<Metadata> {
  const { locale } = await params;
  const t = getPlatformDict(locale);
  return {
    title: t.privacy,
    description: t.privacyDraft,
    robots: { index: false }, // draft: kept out of search engines until the real text is in
    alternates: platformAlternates("/datenschutz"),
  };
}

export default async function Datenschutz({ params }: PageProps<"/[locale]/datenschutz">) {
  const { locale } = await params;
  const t = getPlatformDict(locale);
  return <LegalDraft title={t.privacy} text={t.privacyDraft} draft={t.draft} />;
}
