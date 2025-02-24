import { Card, CardHeader, CardBody, Avatar } from '@heroui/react';
import { Scale, Folder, Check, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MainTitle() {
  const t = useTranslations('Index');

  const features = [
    {
      title: t('oss_title'),
      detail: t('oss_detail'),
      icon: <Scale size={24} color="#52e280" />,
    },
    {
      title: t('organize_title'),
      detail: t('organize_detail'),
      icon: <Folder size={24} color="#52e280" />,
    },
    {
      title: t('usability_title'),
      detail: t('usability_detail'),
      icon: <Check size={24} color="#52e280" />,
    },
    {
      title: t('universal_title'),
      detail: t('universal_detail'),
      icon: <Globe size={24} color="#52e280" />,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} className="max-w-[300px] min-h-[180px]">
            <CardHeader className="flex gap-3">
              <div>
                <Avatar className="bg-green-100" showFallback src="" fallback={feature.icon} />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-large">{feature.title}</h4>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <p className="text-default-500">{feature.detail}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
