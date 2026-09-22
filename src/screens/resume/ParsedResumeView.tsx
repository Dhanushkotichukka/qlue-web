import type { ParsedData } from '@/types/resume';
import { EmptyState } from '@/components/ui/EmptyState';
import './resume.css';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="resume-detail__section-title">{title}</div>
      {children}
    </section>
  );
}

/** Renders parsed resume fields — shared by the upload preview sheet and the
 *  resume detail screen. */
export function ParsedResumeView({ data }: { data?: ParsedData | null }) {
  if (!data) {
    return (
      <EmptyState
        icon="file-text"
        title="No parsed data yet"
        body="Once processing finishes, the extracted profile appears here."
      />
    );
  }
  return (
    <div className="stack gap-6">
      {data.name && (
        <Section title="Candidate name">
          <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{data.name}</div>
        </Section>
      )}

      {data.contact && (data.contact.email || data.contact.phone || data.contact.location) && (
        <Section title="Contact">
          <div className="stack gap-1" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {data.contact.email && <span>{data.contact.email}</span>}
            {data.contact.phone && <span>{data.contact.phone}</span>}
            {data.contact.location && <span>{data.contact.location}</span>}
          </div>
        </Section>
      )}

      {data.skills && data.skills.length > 0 && (
        <Section title="Skills & technologies">
          <div className="row wrap gap-2">
            {data.skills.map((s, i) => (
              <span key={i} className="pill">
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {data.workExperience && data.workExperience.length > 0 && (
        <Section title="Work experience">
          {data.workExperience.map((exp, i) => (
            <div className="resume-detail__exp" key={i}>
              <div className="resume-detail__role">{exp.role ?? 'Role'}</div>
              <div className="resume-detail__company">{exp.company ?? 'Company'}</div>
              {exp.duration && <div className="resume-detail__dur">{exp.duration}</div>}
              {exp.highlights?.map((h, j) => (
                <div key={j} className="resume-detail__hl">
                  {h}
                </div>
              ))}
            </div>
          ))}
        </Section>
      )}

      {data.projects && data.projects.length > 0 && (
        <Section title="Key projects">
          {data.projects.map((p, i) => (
            <div className="resume-detail__exp" key={i}>
              <div className="resume-detail__role">{p.name ?? 'Project'}</div>
              {p.technologies && p.technologies.length > 0 && (
                <div className="resume-detail__company">{p.technologies.join(' · ')}</div>
              )}
              {p.description && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {p.description}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {data.education && data.education.length > 0 && (
        <Section title="Education">
          {data.education.map((e, i) => (
            <div className="resume-detail__exp" key={i}>
              <div className="resume-detail__role">{e.degree ?? 'Degree'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {e.institution ?? 'Institution'}
                {e.year ? ` · ${e.year}` : ''}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
