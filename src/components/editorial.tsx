import Link from "next/link";
import type { Edition, Story } from "@/lib/editions";

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <div className="topbar">Une sélection éditoriale · alimentée chaque matin par n8n</div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Veille IA — accueil">
          <span className="brand-mark" aria-hidden="true" />
          <span>VEILLE / IA</span>
        </Link>
        <nav aria-label="Navigation principale">
          <Link href="/">Aujourd’hui</Link>
          <Link href="/editions">Éditions</Link>
        </nav>
        <Link className="header-cta" href="/editions">Toutes les éditions</Link>
      </header>
    </>
  );
}

function StoryLink({ story, children }: { story: Story; children: React.ReactNode }) {
  return (
    <a href={story.url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function EditionHero({ edition }: { edition: Edition }) {
  const [lead, ...secondary] = edition.stories;
  return (
    <>
      <div className="edition-heading">
        <div>
          <p>{edition.weekday} · La sélection du jour</p>
          <h1>{edition.dateLabel}</h1>
        </div>
        <div className="edition-number">
          Édition n°{edition.editionNumber} · lecture {edition.readingMinutes} min
        </div>
      </div>

      <section className="lead-grid" aria-label={`Les ${edition.stories.length} informations de l’édition`}>
        <article className="hero-story">
          <div className="hero-art" aria-hidden="true">
            <span className="orb orb-one" />
            <span className="orb orb-two" />
            <span className="gridlines" />
          </div>
          <span className="tag">{lead.category}</span>
          <div className="hero-copy">
            <div className="eyebrow">Le signal fort · {lead.source}</div>
            <h2>{lead.title}</h2>
            <p>{lead.summary}</p>
            <StoryLink story={lead}>Lire l’article original <span aria-hidden="true">↗</span></StoryLink>
          </div>
        </article>

        <div className="secondary-stories">
          {secondary.map((story) => (
            <article className={`story-card ${story.accent}`} key={story.url}>
              <div className="story-meta">
                <span>0{story.rank} · {story.category}</span>
                <span>{story.source}</span>
              </div>
              <div>
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
              </div>
              <StoryLink story={story}>Lire l’article <span aria-hidden="true">↗</span></StoryLink>
            </article>
          ))}
        </div>
      </section>

      {edition.audioUrl ? (
        <a className="listen" href={edition.audioUrl} target="_blank" rel="noopener noreferrer">
          <span className="play" aria-hidden="true" />
          <span>
            <small>Le briefing audio · {edition.readingMinutes - 1} minutes</small>
            <strong>Les infos expliquées pendant votre café</strong>
          </span>
          <Wave />
        </a>
      ) : null}
    </>
  );
}

function Wave() {
  return <span className="wave" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</span>;
}

export function ArchiveCards({ editions, title = "Les éditions précédentes" }: { editions: Edition[]; title?: string }) {
  return (
    <section className="archive-section">
      <div className="section-title">
        <h2>{title}</h2>
        <span>Une archive claire, jour après jour</span>
      </div>
      <div className="archive-grid">
        {editions.map((edition, index) => (
          <Link className="edition-card" href={`/editions/${edition.slug}`} key={edition.slug}>
            <span className="edition-date">{edition.weekday} · {edition.dateLabel}</span>
            <h3>{edition.dek}</h3>
            <span className="edition-card-bottom">
              <span>{edition.stories.length} actualités</span>
              <span className={`dot dot-${index % 4}`} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
      {editions.length > 0 ? (
        <div className="archive-cta"><Link href="/editions">Voir toutes les éditions →</Link></div>
      ) : null}
    </section>
  );
}

export function EditionList({ editions }: { editions: Edition[] }) {
  return (
    <div className="edition-list">
      {editions.map((edition) => (
        <Link className="edition-row" href={`/editions/${edition.slug}`} key={edition.slug}>
          <time dateTime={edition.slug}>{edition.dateLabel}</time>
          <span>
            <strong>{edition.dek}</strong>
            <small>{edition.stories.map((story) => story.source).join(" · ")}</small>
          </span>
          <span className="row-arrow" aria-hidden="true">→</span>
        </Link>
      ))}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <span>VEILLE / IA — une sélection quotidienne générée par n8n, relue avec Kimi.</span>
      <span>Sources originales toujours citées · Aucun contenu sponsorisé</span>
    </footer>
  );
}
