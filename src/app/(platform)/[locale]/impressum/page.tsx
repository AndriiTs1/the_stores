import type { Metadata } from "next";
import { getPlatformDict } from "@/lib/i18n-platform";
import { platformAlternates } from "@/lib/platform";
import { LegalDraft } from "../legal-draft";

export async function generateMetadata({ params }: PageProps<"/[locale]/impressum">): Promise<Metadata> {
  const { locale } = await params;
  const t = getPlatformDict(locale);
  return {
    title: t.impressum,
    description: t.impressumDraft,
    robots: { index: false }, // draft: kept out of search engines until the real text is in
    alternates: platformAlternates("/impressum"),
  };
}

export default async function Impressum({ params }: PageProps<"/[locale]/impressum">) {
  const { locale } = await params;
  const t = getPlatformDict(locale);
  return <LegalDraft title={t.impressum} text={t.impressumDraft} draft={t.draft} />;
}
