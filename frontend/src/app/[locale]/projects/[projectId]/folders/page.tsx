import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('Folders');

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{t('no_folders_found')}</h3>
      </div>
    </div>
  );
}
