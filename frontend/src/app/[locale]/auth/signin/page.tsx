import AuthPage from "../authPage";
import { useTranslations } from "next-intl";

export default function Page(params: { locale: string }) {
  const t = useTranslations("Auth");
  const messages = {
    signup: t("projectList"),
    signin: t("project"),
  };
  return (
    <>
      <AuthPage messages={messages} locale={params.locale} />
    </>
  );
}
