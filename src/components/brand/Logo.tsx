import Image from 'next/image';
import { BRAND } from '@/components/landing/constants';

type LogoProps = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
};

export function Logo({ size = 36, className = '', withWordmark = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt={`${BRAND.name} logo`}
        width={size}
        height={size}
        className="rounded-xl"
        priority
      />
      {withWordmark && (
        <span className="font-semibold tracking-tight text-zinc-900">{BRAND.name}</span>
      )}
    </span>
  );
}
