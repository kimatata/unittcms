"use client";
import {
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { Globe, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/src/navigation";

const locales = [
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
];

export default function DropdownLanguage(params: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function changeLocale(nextLocale: string) {
    let newPathname;
    if (pathname.length < 4) {
      // when root path
      router.push("/", { locale: nextLocale });
    } else {
      // when not root path, trim first "/en" from pathname = "/en/projects"
      newPathname = pathname.slice(params.locale.length + 1);
      router.push(newPathname, { locale: nextLocale });
    }
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="light"
          startContent={<Globe size={16} />}
          endContent={<ChevronDown size={16} />}
        >
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
