import { Link, NextUiLinkClasses } from '@/src/i18n/routing';
import { LocaleCodeType } from '@/types/locale';

type Props = {
  locale: LocaleCodeType;
};

export default function Footer({ locale }: Props) {
  return (
    <div className="w-full text-center py-2 px-6 flex flex-wrap justify-center items-center gap-4">
      <div>Copyright © 2024-present UnitTCMS</div>

      <Link href={'/health'} locale={locale} className={`${NextUiLinkClasses} text-gray-500 hover:text-gray-700`}>
        Status
      </Link>
    </div>
  );
}
