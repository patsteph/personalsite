// Mounted once in _app.tsx. Re-runs page translation (lib/pageTranslator)
// whenever the selected language changes, or after a client-side page
// navigation while a non-English language is still selected -- Next.js's
// Pages Router doesn't reload the page on navigation, so new page content
// would otherwise stay untranslated until the next full reload.
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@/lib/translations';
import { translatePageTo } from '@/lib/pageTranslator';

export default function PageTranslationSync() {
  const router = useRouter();
  const { language } = useTranslation();

  useEffect(() => {
    if (language === 'en') return;
    // Wait a frame so the new page's content has rendered before we walk it.
    const frame = requestAnimationFrame(() => {
      translatePageTo(language);
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath, language]);

  return null;
}
