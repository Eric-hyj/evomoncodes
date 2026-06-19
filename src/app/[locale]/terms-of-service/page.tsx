import { LegalPage } from "@/components/legal-page";
import { getTranslations } from "next-intl/server";

export default async function TermsOfServicePage() {
  const t = await getTranslations("legal.terms");
  const paragraphs = t.raw("paragraphs") as string[];
  return (
    <LegalPage title={t("title")}>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </LegalPage>
  );
}
