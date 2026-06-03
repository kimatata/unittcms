import { Scale, Folder, Check, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MainFeatures() {
  const t = useTranslations('Index');

  const features = [
    { title: t('oss_title'), detail: t('oss_detail'), icon: <Scale size={24} color="#52e280" /> },
    { title: t('organize_title'), detail: t('organize_detail'), icon: <Folder size={24} color="#52e280" /> },
    { title: t('usability_title'), detail: t('usability_detail'), icon: <Check size={24} color="#52e280" /> },
    { title: t('universal_title'), detail: t('universal_detail'), icon: <Globe size={24} color="#52e280" /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((feature) => (
        <div key={feature.title} className="rounded-xl border border-default-200 bg-content1 shadow-sm max-w-[300px] min-h-[180px] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 shrink-0">
              {feature.icon}
            </div>
            <h4 className="font-bold text-large">{feature.title}</h4>
          </div>
          <p className="text-default-500 text-sm">{feature.detail}</p>
        </div>
      ))}
    </div>
  );
}
