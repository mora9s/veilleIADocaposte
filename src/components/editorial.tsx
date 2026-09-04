import Link from "next/link";
import { buildArchiveCalendar } from "@/lib/archive-calendar";
import type { Edition, Story } from "@/lib/editions";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatPeriodDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

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
  const isRetrospective = edition.kind === "retrospective";
  return (
    <>
      <div className="edition-heading">
        <div>
          <p>
            {isRetrospective
              ? `Rétrospective · ${formatPeriodDate(edition.periodStart)} au ${formatPeriodDate(edition.periodEnd)}`
              : `${edition.weekday} · La sélection du jour`}
          </p>
          <h1>{edition.dateLabel}</h1>
        </div>
        <div className="edition-number">
          {isRetrospective ? "Archive reconstruite" : `Édition n°${edition.editionNumber}`} · lecture {edition.readingMinutes} min
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

        <div className={`secondary-stories ${secondary.length === 1 ? "single" : ""}`}>
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

export function ArchiveCalendar({ editions }: { editions: Edition[] }) {
  const months = buildArchiveCalendar(editions);
  return (
    <section className="calendar-section" aria-labelledby="calendar-title">
      <div className="section-title calendar-title-row">
        <div>
          <p className="page-kicker">Accès par date</p>
          <h2 id="calendar-title">Calendrier des éditions</h2>
        </div>
        <div className="calendar-legend" aria-label="Légende">
          <span><i className="legend-dot daily" /> Quotidienne</span>
          <span><i className="legend-dot retrospective" /> Rétrospective</span>
        </div>
      </div>
      <nav className="month-jump" aria-label="Accéder à un mois">
        {months.map((month) => <a href={`#month-${month.key}`} key={month.key}>{month.label}</a>)}
      </nav>
      <div className="calendar-months">
        {months.map((month, index) => (
          <article className="calendar-month" id={`month-${month.key}`} key={month.key}>
            <header>
              <a href={months[index + 1] ? `#month-${months[index + 1].key}` : `#month-${month.key}`} aria-label="Mois précédent">←</a>
              <h3>{month.label}</h3>
              <a href={months[index - 1] ? `#month-${months[index - 1].key}` : `#month-${month.key}`} aria-label="Mois suivant">→</a>
            </header>
            <div className="calendar-grid calendar-weekdays" aria-hidden="true">
              {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-grid">
              {month.cells.map((cell, cellIndex) => {
                if (cell.day === null) return <span className="calendar-day empty" key={`empty-${cellIndex}`} />;
                if (!cell.edition) return <span className="calendar-day unavailable" key={cell.isoDate}>{cell.day}</span>;
                const retrospective = cell.edition.kind === "retrospective";
                return (
                  <Link
                    className={`calendar-day available ${retrospective ? "retrospective" : "daily"}`}
                    href={`/editions/${cell.edition.slug}`}
                    aria-label={`${cell.edition.dateLabel} — ${retrospective ? "rétrospective" : "édition quotidienne"}`}
                    key={cell.isoDate}
                  >
                    <span>{cell.day}</span>
                    <i aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </article>
        ))}
      </div>
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
            <strong>
              {edition.kind === "retrospective" ? <em className="edition-kind">Rétrospective</em> : null}
              {edition.dek}
            </strong>
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
