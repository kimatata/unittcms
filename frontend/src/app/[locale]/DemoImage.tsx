'use client';
import { Image } from '@heroui/react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

type Props = {
  imageName: string;
  altText: string;
};

export default function DemoImage({ imageName, altText }: Props) {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  return (
    <>
      <Image src={`/top/${currentTheme}/${imageName}.png`} alt={altText} shadow="md" className="max-w-full" />
    </>
  );
}
