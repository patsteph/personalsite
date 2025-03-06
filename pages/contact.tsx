import Layout from '@/components/layout/Layout';
import ContactInfo from '@/components/contact/ContactInfo';
import { useTranslation } from '@/lib/translations';

export default function ContactPage() {
  const { t } = useTranslation();
  
  // Contact information
  const contactInfo = {
    businessEmail: 'business@example.com',
    personalEmail: 'personal@example.com',
    location: 'San Francisco, CA',
    socials: {
      github: 'https://github.com/yourusername',
      linkedin: 'https://linkedin.com/in/yourusername',
      twitter: 'https://twitter.com/yourusername',
      bluesky: 'https://bsky.app/profile/yourusername'
    }
  };
  
  return (
    <Layout section="contact">
      <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">
        {t('contact.title', 'Contact')}
      </h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <p className="text-steel-blue leading-relaxed">
          I'm always interested in connecting with fellow technology leaders, engineers, and anyone passionate 
          about building great teams and products. Whether you'd like to discuss a collaboration, 
          speaking opportunity, or just share ideas, feel free to reach out through any of these channels.
        </p>
      </div>
      
      <ContactInfo {...contactInfo} />
    </Layout>
  );
}