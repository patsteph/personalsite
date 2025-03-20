import Layout from '@/components/layout/Layout';
import ContactInfo from '@/components/contact/ContactInfo';
import { useTranslation } from '@/lib/translations';

export default function ContactPage() {
  const { t } = useTranslation();
  
  // Contact information
  const contactInfo = {
    businessEmail: 'patsteph@cisco.com',
    personalEmail: 'stephensuc@gmail.com',
    location: 'Gretna, NE',
    socials: {
      github: 'https://github.com/patsteph',
      linkedin: 'https://linkedin.com/in/patrickjstephens/',
      twitter: 'https://twitter.com/StephensCisco',
      bluesky: 'https://bsky.app/stephenspatrickj/'
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
          about building great teams or products. Whether you'd like to discuss a collaboration, 
          speaking opportunity, or just share ideas, feel free to reach out through any of these channels.
        </p>
      </div>
      
      <ContactInfo {...contactInfo} />
    </Layout>
  );
}