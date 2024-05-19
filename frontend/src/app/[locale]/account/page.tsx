import { useTranslations } from "next-intl";
import AccountPage from "./AccountPage";
export default function Page(params: { locale: string }) {
  const t = useTranslations("Auth");
  const messages = {
    yourProjects: t("your_projects"),
  };

  return <AccountPage messages={messages} locale={params.locale} />;
}
