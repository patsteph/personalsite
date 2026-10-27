import Link from 'next/link';
import ProjectPage, { Card } from '@/components/projects/ProjectPage';

export default function ProjectsPage() {
  return (
    <ProjectPage title="Projects" description="Things I am building outside of work.">
      <Card>
        <p>Things I build on my own time. More to come.</p>
      </Card>
      <Link href="/projects/localbook" className="block">
        <Card title="LocalBook">
          <p>
            A private research notebook for your Mac, with an iPhone app. Add documents, web pages and
            meeting recordings, then search and ask questions. The AI runs on your own devices, so your
            material never goes to a cloud service.
          </p>
          <p className="text-accent">Read more →</p>
        </Card>
      </Link>
    </ProjectPage>
  );
}
