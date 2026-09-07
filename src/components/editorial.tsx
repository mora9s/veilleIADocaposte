import Link from "next/link";
import { buildArchiveCalendar } from "@/lib/archive-calendar";
import type { Edition, Story } from "@/lib/editions";
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
function formatPeriodDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${value}T00:00:00Z`))
    : "";
}
const kindLabel = (kind: Edition["kind"]) =>
  kind === "weekly"
    ? "Hebdo"
    : kind === "retrospective"
      ? "Rétrospective"
      : "Quotidienne";
const calendarKindLabel = (kind: Edition["kind"]) =>
  kind === "weekly" ? "Hebdo" : kind === "retrospective" ? "Rétro" : "Quot.";
export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <div className="topbar">
        Une sélection éditoriale · quotidienne et hebdomadaire · alimentée par
        n8n
      </div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Veille IA — accueil">
          <span className="brand-mark" aria-hidden="true" />
          <span>VEILLE / IA</span>
        </Link>
        <nav aria-label="Navigation principale">
          <Link href="/">Aujourd’hui</Link>
          <Link href="/editions#hebdo">Hebdo</Link>
          <Link href="/editions">Éditions</Link>
        </nav>
        <Link className="header-cta" href="/editions">
          Toutes les éditions
        </Link>
      </header>
    </>
  );
}
function StoryLink({
  story,
  children,
}: {
  story: Story;
  children: React.ReactNode;
}) {
  return (
    <a href={story.url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
export function EditionHero({ edition }: { edition: Edition }) {
  const [lead, ...secondary] = edition.stories;
  const weekly = edition.kind === "weekly";
  const retrospective = edition.kind === "retrospective";
  return (
    <>
      <div className="edition-heading">
        <div>
          <p>
            {weekly
              ? `La semaine IA · ${formatPeriodDate(edition.periodStart)} au ${formatPeriodDate(edition.periodEnd)}`
              : retrospective
                ? `Rétrospective · ${formatPeriodDate(edition.periodStart)} au ${formatPeriodDate(edition.periodEnd)}`
                : `${edition.weekday} · La sélection du jour`}
          </p>
          <h1>{edition.dateLabel}</h1>
        </div>
        <div className="edition-number">
          {weekly
            ? `Hebdo n°${edition.editionNumber}`
            : retrospective
              ? "Archive reconstruite"
              : `Édition n°${edition.editionNumber}`}{" "}
          · lecture {edition.readingMinutes} min
        </div>
      </div>
      <section
        className={`lead-grid ${weekly ? "weekly-grid" : ""}`}
        aria-label={`Les ${edition.stories.length} informations de l’édition`}
      >
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
            <StoryLink story={lead}>
              Lire l’article original <span aria-hidden="true">↗</span>
            </StoryLink>
          </div>
        </article>
        {weekly ? (
          <div className="essentials-heading">
            <p className="page-kicker">La sélection resserrée</p>
            <h2>Les 4 essentiels</h2>
          </div>
        ) : null}
        <div
          className={`secondary-stories ${secondary.length === 1 ? "single" : ""}`}
        >
          {secondary.map((story) => (
            <article className={`story-card ${story.accent}`} key={story.url}>
              <div className="story-meta">
                <span>
                  0{story.rank} · {story.category}
                </span>
                <span>{story.source}</span>
              </div>
              <div>
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
              </div>
              <StoryLink story={story}>
                Lire l’article <span aria-hidden="true">↗</span>
              </StoryLink>
            </article>
          ))}
        </div>
      </section>
      {weekly ? (
        <section className="weekly-premium" aria-labelledby="weekly-insights">
          <div>
            <p className="page-kicker">Le recul de la semaine</p>
            <h2 id="weekly-insights">3 enseignements</h2>
          </div>
          <div className="insight-grid">
            {edition.insights?.map((insight) => (
              <article key={insight.title}>
                <h3>{insight.title}</h3>
                <p>{insight.body}</p>
              </article>
            ))}
          </div>
          <div className="watchlist" aria-labelledby="watchlist-title">
            <p className="page-kicker" id="watchlist-title">
              À surveiller
            </p>
            <p>
              Ces points restent des éléments à suivre, pas des faits établis.
            </p>
            <ul>
              {edition.watchlist?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      {edition.audioUrl ? (
        <a
          className="listen"
          href={edition.audioUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="play" aria-hidden="true" />
          <span>
            <small>
              Le briefing audio ·{" "}
              {weekly ? edition.audioMinutes : edition.readingMinutes - 1}{" "}
              minutes
            </small>
            <strong>
              {weekly
                ? "La semaine IA à écouter"
                : "Les infos expliquées pendant votre café"}
            </strong>
          </span>
          <Wave />
        </a>
      ) : null}
    </>
  );
}
function Wave() {
  return (
    <span className="wave" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <i key={index} />
      ))}
    </span>
  );
}
export function WeeklyFeature({ edition }: { edition?: Edition }) {
  return edition ? (
    <section className="weekly-feature" aria-labelledby="weekly-feature-title">
      <p className="page-kicker">Chaque dimanche</p>
      <h2 id="weekly-feature-title">La semaine IA</h2>
      <p>{edition.dek}</p>
      <Link href={`/editions/${edition.slug}`}>
        Lire l’hebdo n°{edition.editionNumber} →
      </Link>
    </section>
  ) : null;
}
export function ArchiveCards({
  editions,
  title = "Les éditions précédentes",
}: {
  editions: Edition[];
  title?: string;
}) {
  return (
    <section className="archive-section">
      <div className="section-title">
        <h2>{title}</h2>
        <span>Une archive claire, jour après jour</span>
      </div>
      <div className="archive-grid">
        {editions.map((edition, index) => (
          <Link
            className="edition-card"
            href={`/editions/${edition.slug}`}
            key={edition.slug}
          >
            <span className="edition-date">
              {kindLabel(edition.kind)} · {edition.dateLabel}
            </span>
            <h3>{edition.dek}</h3>
            <span className="edition-card-bottom">
              <span>{edition.stories.length} actualités</span>
              <span className={`dot dot-${index % 4}`} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
      {editions.length ? (
        <div className="archive-cta">
          <Link href="/editions">Voir toutes les éditions →</Link>
        </div>
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
          <span>
            <i className="legend-dot daily" /> Quotidienne
          </span>
          <span>
            <i className="legend-dot weekly" /> Hebdo
          </span>
          <span>
            <i className="legend-dot retrospective" /> Rétrospective
          </span>
        </div>
      </div>
      <nav className="month-jump" aria-label="Accéder à un mois">
        {months.map((month) => (
          <a href={`#month-${month.key}`} key={month.key}>
            {month.label}
          </a>
        ))}
      </nav>
      <div className="calendar-months">
        {months.map((month, index) => (
          <article
            className="calendar-month"
            id={`month-${month.key}`}
            key={month.key}
          >
            <header>
              <a
                href={
                  months[index + 1]
                    ? `#month-${months[index + 1].key}`
                    : `#month-${month.key}`
                }
                aria-label="Mois précédent"
              >
                ←
              </a>
              <h3>{month.label}</h3>
              <a
                href={
                  months[index - 1]
                    ? `#month-${months[index - 1].key}`
                    : `#month-${month.key}`
                }
                aria-label="Mois suivant"
              >
                →
              </a>
            </header>
            <div className="calendar-grid calendar-weekdays" aria-hidden="true">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {month.cells.map((cell, cellIndex) =>
                !cell.day ? (
                  <span
                    className="calendar-day empty"
                    key={`empty-${cellIndex}`}
                  />
                ) : !cell.editions.length ? (
                  <span className="calendar-day unavailable" key={cell.isoDate}>
                    {cell.day}
                  </span>
                ) : (
                  <div
                    className="calendar-day available multi-edition"
                    key={cell.isoDate}
                  >
                    <div>
                      {cell.editions.map((edition) => (
                        <Link
                          className={edition.kind}
                          href={`/editions/${edition.slug}`}
                          aria-label={`${edition.dateLabel} — ${kindLabel(edition.kind)}`}
                          key={edition.slug}
                        >
                          <strong>{cell.day}</strong>
                          <small>{calendarKindLabel(edition.kind)}</small>
                        </Link>
                      ))}
                    </div>
                  </div>
                ),
              )}
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
        <Link
          className="edition-row"
          href={`/editions/${edition.slug}`}
          key={edition.slug}
        >
          <time dateTime={edition.publicationDate ?? edition.slug}>
            {edition.dateLabel}
          </time>
          <span>
            <strong>
              <em className={`edition-kind ${edition.kind}`}>
                {kindLabel(edition.kind)}
              </em>
              {edition.dek}
            </strong>
            <small>
              {edition.stories.map((story) => story.source).join(" · ")}
            </small>
          </span>
          <span className="row-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
export function SiteFooter() {
  return (
    <footer>
      <span>
        VEILLE / IA — sélections quotidiennes et hebdomadaires générées par n8n,
        relues avec Kimi.
      </span>
      <span>Sources originales toujours citées · Aucun contenu sponsorisé</span>
    </footer>
  );
}
