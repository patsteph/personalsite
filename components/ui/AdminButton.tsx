import Link from 'next/link';
import { useTranslation } from '@/lib/translations';

export default function AdminButton() {
  const { t } = useTranslation();
  
  return (
    <Link
      href="/admin"
      className="bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue"
    >
      {t('books.manage', 'Manage Books')}
    </Link>
  );
}