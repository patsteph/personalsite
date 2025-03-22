import { useRouter } from 'next/router';

export default function AdminButton() {
  const router = useRouter();

  const handleAdminClick = () => {
    // Use Next.js router to navigate to the React-based admin page
    router.push('/admin');
  };
  
  return (
    <button 
      onClick={handleAdminClick}
      className="bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue inline-block"
    >
      Admin
    </button>
  );
}