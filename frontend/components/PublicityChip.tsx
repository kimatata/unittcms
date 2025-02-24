import { Chip } from '@heroui/react';

type Props = {
  isPublic: boolean;
  publicText: string;
  privateText: string;
};

export default function PublicityChip({ isPublic, publicText, privateText }: Props) {
  return isPublic ? (
    <Chip size="sm" variant="bordered">
      {publicText}
    </Chip>
  ) : (
    <Chip size="sm" variant="bordered">
      {privateText}
    </Chip>
  );
}
