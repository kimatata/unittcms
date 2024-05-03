"use client";
import {
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { Globe } from "lucide-react";
import { useRouter } from "@/src/navigation";

const locales = [
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
];

export default function LangSwitch(params: { locale: string }) {
  const router = useRouter();

  async function changeLocale(locale: string) {
    router.push("/", { locale: locale });
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button size="sm" color="primary" startContent={<Globe size={16} />}>
          {locales.find((locale) => locale.code === params.locale)?.name ||
            params.locale}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="lacales">
        {locales.map((entry) => (
          <DropdownItem
            key={entry.code}
            onClick={() => changeLocale(entry.code)}
          >
            {entry.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
