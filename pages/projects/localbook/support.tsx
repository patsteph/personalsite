import ProjectPage, { Card } from '@/components/projects/ProjectPage';

const crumbs = [{ label: 'LocalBook', href: '/projects/localbook' }];

export default function LocalBookSupportPage() {
  return (
    <ProjectPage
      title="LocalBook Support"
      description="Help and contact for LocalBook on Mac and iPhone."
      crumbs={crumbs}
    >
      <Card title="Contact">
        <p>
          Email <a className="underline hover:text-accent" href="mailto:stephensuc@gmail.com">stephensuc@gmail.com</a>,
          or open an issue at{' '}
          <a className="underline hover:text-accent" href="https://github.com/patsteph/LocalBook/issues" target="_blank" rel="noopener noreferrer">
            github.com/patsteph/LocalBook/issues
          </a>.
        </p>
      </Card>
      <Card title="The phone cannot find my Mac">
        <ul className="list-disc pl-6 space-y-1">
          <li>Both must be on the same network.</li>
          <li>LocalBook must be running on the Mac.</li>
          <li>Local Network access must be allowed for the app in iOS Settings.</li>
        </ul>
      </Card>
      <Card title="After updating">
        <p>
          Version 2.5.5 changed the pairing key. Remove the phone on the Mac&apos;s Sync screen and pair it again
          once. Rebuild the Mac app so it has the new phone features.
        </p>
      </Card>
    </ProjectPage>
  );
}
