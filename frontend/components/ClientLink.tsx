'use client';
import { forwardRef } from 'react';
import { Link } from '@/src/i18n/routing';
type Props = React.ComponentPropsWithoutRef<typeof Link>;
const ClientLink = forwardRef<HTMLAnchorElement, Props>(({ href, ...props }, ref) => (
  <Link ref={ref} href={href} {...props} />
));
ClientLink.displayName = 'ClientLink';

export default ClientLink;
