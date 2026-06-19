import { LegalPage } from "@/components/legal-page";
import { getTranslations } from "next-intl/server";

export default async function CopyrightPage() {
  const t = await getTranslations("legal.copyright");
  const paragraphs = t.raw("paragraphs") as string[];
  return (
    <LegalPage title={t("title")}>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </LegalPage>
  );
}
