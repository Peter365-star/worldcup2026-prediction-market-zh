import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'live' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
