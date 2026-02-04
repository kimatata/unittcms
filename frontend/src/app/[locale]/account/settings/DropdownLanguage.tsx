'use client';
import { Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem } from '@heroui/react';
import { Globe, ChevronDown } from 'lucide-react';
import { locales } from '@/config/selection';
import { LocaleCodeType } from '@/types/locale';

type Props = {
  locale: string;
  onChangeLocale: (code: LocaleCodeType) => void;
};

export default function DropdownLanguage({ locale, onChangeLocale }: Props) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          fullWidth
          size="md"
          variant="flat"
          startContent={<Globe size={16} />}
          endContent={<ChevronDown size={16} />}
        >
          {locales.find((entry) => entry.code === locale)?.name || locale}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="lacales">
        {locales.map((entry) => (
          <DropdownItem key={entry.code} onPress={() => onChangeLocale(entry.code)}>
            {entry.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
