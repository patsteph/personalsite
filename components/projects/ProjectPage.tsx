import { ReactNode } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';

type ProjectPageProps = {
  title: string;
  description: string;
  crumbs?: { label: string; href: string }[];
  children: ReactNode;
};

/** Shared frame for the Projects section: Layout, a title, a breadcrumb trail and card styling that matches Contact. */
export default function ProjectPage({ title, description, crumbs = [], children }: ProjectPageProps) {
  return (
    <Layout
      section="projects"
      title={title}
      description={description}
      headerImage="/images/headers/welcome.jpg"
    >
      <nav aria-label="Breadcrumb" className="text-sm text-steel-blue mb-4">
        <Link href="/projects" className="hover:text-accent">Projects</Link>
        {crumbs.map(c => (
          <span key={c.href}> / <Link href={c.href} className="hover:text-accent">{c.label}</Link></span>
        ))}
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">{title}</h1>
      {children}
    </Layout>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-3 mb-6 text-steel-blue leading-relaxed space-y-3">
      {title && <h2 className="text-xl font-bold text-accent">{title}</h2>}
      {children}
    </div>
  );
}
