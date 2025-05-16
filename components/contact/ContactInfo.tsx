import { useTranslation } from '@/lib/translations';

type ContactInfoProps = {
  businessEmail: string;
  personalEmail: string;
  location: string;
  socials: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    bluesky?: string;
  };
};

export default function ContactInfo(props: ContactInfoProps) {
  const { businessEmail, personalEmail, socials } = props;
  // We're not using location directly, but keeping it in the props type for future use
  const { t } = useTranslation();
  
  // This function is no longer needed with OpenStreetMap implementation
  // as we're providing a direct link below the map
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Email section */}
      <div className="bg-white rounded-lg shadow p-3">
        <h2 className="text-xl font-bold text-accent mb-2">
          {t('contact.email', 'Email')}
        </h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-600">
              {t('contact.business', 'Business:')}
            </div>
            <a 
              href={`mailto:${businessEmail}`}
              className="text-steel-blue hover:text-accent transition-colors"
            >
              {businessEmail}
            </a>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">
              {t('contact.personal', 'Personal:')}
            </div>
            <a 
              href={`mailto:${personalEmail}`}
              className="text-steel-blue hover:text-accent transition-colors"
            >
              {personalEmail}
            </a>
          </div>
        </div>
      </div>
      
      {/* Location section */}
      <div className="bg-white rounded-lg shadow p-3">
        <h2 className="text-xl font-bold text-accent mb-2">
          {t('contact.location', 'Location')}
        </h2>
        <div className="h-64 rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            title="Location Map"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=-96.2144422531128%2C41.14762182740735%2C-96.19888544082643%2C41.16061156160396&amp;layer=mapnik`}
            allowFullScreen
          ></iframe>
          <small>
            <a 
              href={`https://www.openstreetmap.org/?#map=16/41.15412/-96.20666`} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-steel-blue hover:text-accent block mt-2 text-center"
            >
              View Larger Map
            </a>
          </small>
        </div>
      </div>
      
      {/* Social media section */}
      <div className="bg-white rounded-lg shadow p-3">
        <h2 className="text-xl font-bold text-accent mb-2">
          {t('contact.connect', 'Connect')}
        </h2>
        <div className="space-y-4">
          {socials.github && (
            <a 
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-steel-blue hover:text-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="mr-3">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              <span>{socials.github.replace('https://github.com/', '')}</span>
            </a>
          )}
          
          {socials.linkedin && (
            <a 
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-steel-blue hover:text-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="mr-3">
                <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
              </svg>
              <span>{socials.linkedin.replace('https://linkedin.com/in/', '')}</span>
            </a>
          )}
          
          {socials.twitter && (
            <a 
              href={socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-steel-blue hover:text-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="mr-3">
                <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
              </svg>
              <span>{socials.twitter.replace('https://twitter.com/', '')}</span>
            </a>
          )}
          
          {socials.bluesky && (
            <a 
              href={socials.bluesky}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-steel-blue hover:text-accent transition-colors"
            >
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 10.8C9 10.8 6.2 12.1 4.2 14.3C4.1 14.4 4 14.6 4 14.8C4 15 4.1 15.1 4.2 15.2L4.5 15.6C4.6 15.8 4.8 15.9 5 15.9C5.2 15.9 5.3 15.8 5.4 15.7C7 14.2 9 13.2 11.2 12.9C10.7 13.4 10.3 14 10.1 14.7C9.9 15.3 9.9 15.9 10 16.5C10.1 17.1 10.4 17.7 10.8 18.1C11.2 18.5 11.7 18.8 12.3 18.9C12.9 19 13.5 19 14.1 18.8C14.7 18.6 15.3 18.2 15.7 17.8C16 17.4 16.3 16.9 16.4 16.3C16.5 15.7 16.5 15.1 16.3 14.5C16.1 13.9 15.8 13.3 15.3 12.9C14.9 12.5 14.3 12.2 13.7 12C13.1 11.9 12.5 11.9 11.9 12C11.9 11.9 12 11.9 12 11.9C14.2 11.9 16.2 10.9 17.8 9.4C17.9 9.3 18 9.1 18 8.9C18 8.7 17.9 8.6 17.8 8.5L17.5 8.1C17.4 7.9 17.2 7.8 17 7.8C16.8 7.8 16.7 7.9 16.6 8C15.1 9.6 13.1 10.8 10.9 11.3C11.3 10.9 11.6 10.5 11.8 10C12 9.5 12 9 11.9 8.5C11.8 8 11.6 7.6 11.3 7.2C11 6.8 10.6 6.5 10.1 6.4C9.6 6.3 9.1 6.3 8.6 6.4C8.1 6.5 7.7 6.8 7.3 7.2C7 7.6 6.7 8 6.6 8.5C6.5 9 6.5 9.5 6.7 10C6.9 10.5 7.2 10.9 7.6 11.3C5.4 10.8 3.4 9.6 1.9 8C1.8 7.9 1.7 7.7 1.7 7.5C1.7 7.3 1.8 7.2 1.9 7.1L2.2 6.7C2.3 6.5 2.5 6.4 2.7 6.4C2.9 6.4 3 6.5 3.1 6.6C5.1 8.8 7.9 10.1 10.9 10.1C11.2 10.1 11.6 10.1 11.9 10.1C11.9 10.1 11.9 10.1 12 10.1V10.8Z" fill="currentColor" />
                </svg>
              </div>
              <span>{socials.bluesky.replace('https://bsky.app/profile/', '')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}