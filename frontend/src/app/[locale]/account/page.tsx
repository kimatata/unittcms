import { useTranslations } from "next-intl";
import { Input, Button, Card, CardHeader, CardBody } from "@nextui-org/react";
import { Link } from "@/src/navigation";

export default function Page(params: { locale: string }) {
  const t = useTranslations("Auth");

  return (
    <Card className="border-none bg-background/60 dark:bg-default-100/50 w-[480px]">
      <CardHeader className="px-4 pt-4 pb-0 flex justify-between">
        <h4 className="font-bold text-large">{t('account')}</h4>
        {/* <Link href={isSignup ? "/auth/signin" : "/auth/signup"} locale={locale}>
          <Button
            color="primary"
            variant="light"
            endContent={<ChevronRight size={16} />}
          >
            {messages.linkTitle}
          </Button>
        </Link> */}
      </CardHeader>
      <CardBody className="overflow-visible px-4 pt-0 pb-4">
        afgdsfg
      </CardBody>
    </Card>
  );
}
