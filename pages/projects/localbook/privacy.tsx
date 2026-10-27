import ProjectPage, { Card } from '@/components/projects/ProjectPage';

const crumbs = [{ label: 'LocalBook', href: '/projects/localbook' }];

export default function LocalBookPrivacyPage() {
  return (
    <ProjectPage
      title="LocalBook Privacy Policy"
      description="LocalBook collects no data. Your notebooks stay on your own devices."
      crumbs={crumbs}
    >
      <Card>
        <p className="text-sm">Last updated: October 27, 2026</p>
        <p>
          <strong>LocalBook collects no data.</strong> There are no accounts, analytics, advertising or tracking.
        </p>
      </Card>
      <Card title="What stays where">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Your notebooks, questions, notes, recordings and generated items stay on your Mac and your phone.
            They sync only between your own devices, directly and encrypted, over your local network.
          </li>
          <li>
            Questions are answered by AI models that run on your device. Nothing you write or say is sent to me
            or to any AI provider.
          </li>
          <li>Speech is turned into text on the phone using Apple&apos;s on-device speech recognition.</li>
          <li>
            On first use the app downloads AI model files from public model hosts. Nothing about you is sent
            with that download.
          </li>
        </ul>
      </Card>
      <Card title="Permissions">
        <p>
          The iPhone app asks for the microphone (recording), speech recognition (transcripts), the local network
          (finding your Mac) and the camera (scanning the pairing code). You can turn each off in iOS Settings.
        </p>
      </Card>
      <Card title="Feedback">
        <p>
          If you send feedback through TestFlight or email, I receive what you choose to send. Questions about
          this policy: <a className="underline hover:text-accent" href="mailto:stephensuc@gmail.com">stephensuc@gmail.com</a>.
        </p>
      </Card>
    </ProjectPage>
  );
}
