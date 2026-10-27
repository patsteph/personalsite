import Link from 'next/link';
import ProjectPage, { Card } from '@/components/projects/ProjectPage';


export default function LocalBookPage() {
  return (
    <ProjectPage
      title="LocalBook"
      description="A private research notebook for your Mac and iPhone. The AI runs on your own devices."
    >
      <Card title="What it is">
        <p>
          LocalBook is a private research notebook that runs on your Mac. Add documents, web pages, notes
          and meeting recordings, then search them and ask questions. The AI runs on your own computer, so
          your material never goes to a cloud service.
        </p>
        <p>
          The iPhone app pairs with your Mac over your own network. Notebooks you choose sync to the phone,
          and searching and answering happen on the phone. It can record and transcribe meetings with named
          speakers, and make briefings, quizzes, flashcards, audio overviews and visuals.
        </p>
      </Card>

      <Card title="Get it">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Mac app and source:{' '}
            <a className="underline hover:text-accent" href="https://github.com/patsteph/LocalBook" target="_blank" rel="noopener noreferrer">
              github.com/patsteph/LocalBook
            </a>{' '}
            (version 2.5.5)
          </li>
          <li>iPhone app: TestFlight beta by invitation. It needs a Mac running LocalBook 2.5.5 or later on the same network.</li>
        </ul>
      </Card>

      <Card title="More">
        <ul className="list-disc pl-6 space-y-1">
          <li><Link className="underline hover:text-accent" href="/projects/localbook/privacy">Privacy policy</Link></li>
          <li><Link className="underline hover:text-accent" href="/projects/localbook/support">Support</Link></li>
        </ul>
      </Card>
    </ProjectPage>
  );
}
