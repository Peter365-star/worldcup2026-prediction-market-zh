'use client';

import { useTranslations } from 'next-intl';

export default function LivePage() {
  const t = useTranslations('live');

  return (
    <iframe
      src="/dashboard/worldcup2026.html"
      className="fixed left-0 right-0 top-14 z-10 h-[calc(100vh-3.5rem)] w-full border-none sm:top-16 sm:h-[calc(100vh-4rem)]"
      title={t('title')}
    />
  );
}
