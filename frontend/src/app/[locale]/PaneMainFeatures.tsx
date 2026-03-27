import { Card, CardHeader, CardBody, Avatar } from '@heroui/react';
import { Scale, Folder, Check, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MainTitle() {
  const t = useTranslations('Index');

  const features = [
    {
      title: t('oss_title'),
      detail: t('oss_detail'),
      icon: <Scale size={24} color="#4953ac" />,
    },
    {
      title: t('organize_title'),
      detail: t('organize_detail'),
      icon: <Folder size={24} color="#4953ac" />,
    },
    {
      title: t('usability_title'),
      detail: t('usability_detail'),
      icon: <Check size={24} color="#4953ac" />,
    },
    {
      title: t('universal_title'),
      detail: t('universal_detail'),
      icon: <Globe size={24} color="#4953ac" />,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="max-w-[300px] min-h-[180px] bg-white rounded-2xl shadow-sm border-none">
            <CardHeader className="flex gap-3">
              <div>
                <Avatar className="bg-indigo-50" showFallback src="" fallback={feature.icon} />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-large text-[#2b2f37]">{feature.title}</h4>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <p className="text-slate-500">{feature.detail}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
