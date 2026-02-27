export const Privacy = () => {
  return (
    <article className={s_container}>
      <h1 className={s_h1}>Privacy Policy</h1>
      <p className={s_meta}>Last updated: February 2026</p>

      <p className={s_body}>
        MapMemo is a free geography game. We do not sell or share your
        information with third parties.
      </p>

      <section className={s_section}>
        <h2 className={s_h2}>Data we store on your device</h2>
        <ul className={s_list}>
          <li>
            <strong>Game settings</strong> (localStorage key{' '}
            <code className={s_code}>mapmemo.gameSettings</code>) — your chosen
            game mode, difficulty, and selected areas. No personal information.
          </li>
          <li>
            <strong>Session cookie</strong> (
            <code className={s_code}>mapmemo_session_id</code>) — a temporary
            anonymous token that lets our server know your requests belong to
            the same browser session. It expires after 8 hours, contains no
            personal data, and is required for the app to function.
          </li>
        </ul>
      </section>

      <section className={s_section}>
        <h2 className={s_h2}>Analytics</h2>
        <p className={s_body}>
          We use{' '}
          <a
            href='https://vercel.com/analytics'
            target='_blank'
            rel='noreferrer'
            className={s_link}
          >
            Vercel Web Analytics
          </a>{' '}
          to understand how many people visit the site and which pages are
          popular. Vercel Analytics does not use cookies, does not track
          individual users across sessions, and does not collect personally
          identifiable information. Aggregate usage data is stored by Vercel.
          See{' '}
          <a
            href='https://vercel.com/legal/privacy-policy'
            target='_blank'
            rel='noreferrer'
            className={s_link}
          >
            Vercel's privacy policy
          </a>
          .
        </p>
      </section>

      <section className={s_section}>
        <h2 className={s_h2}>Third-party services</h2>
        <ul className={s_list}>
          <li>
            <strong>Google Maps</strong> — The map is rendered using the Google
            Maps API. When you load a game, your browser connects to Google's
            servers to fetch map tiles. This is subject to{' '}
            <a
              href='https://policies.google.com/privacy'
              target='_blank'
              rel='noreferrer'
              className={s_link}
            >
              Google's privacy policy
            </a>
            .
          </li>
          <li>
            <strong>OpenStreetMap</strong> — Road and street data is sourced
            from{' '}
            <a
              href='https://www.openstreetmap.org/copyright'
              target='_blank'
              rel='noreferrer'
              className={s_link}
            >
              OpenStreetMap
            </a>{' '}
            (© OpenStreetMap contributors), licensed under the{' '}
            <a
              href='https://opendatacommons.org/licenses/odbl/'
              target='_blank'
              rel='noreferrer'
              className={s_link}
            >
              Open Database License (ODbL)
            </a>
            . OSM data is pre-processed and stored on our server — your browser
            does not contact OSM directly.
          </li>
          <li>
            <strong>Oslo kommune</strong> — Neighborhood boundary data is
            sourced from{' '}
            <a
              href='https://www.oslo.kommune.no/statistikk-og-data/apne-data/'
              target='_blank'
              rel='noreferrer'
              className={s_link}
            >
              Oslo kommune's open data portal
            </a>
            , licensed under the{' '}
            <a
              href='https://data.norge.no/nlod/en/'
              target='_blank'
              rel='noreferrer'
              className={s_link}
            >
              Norwegian Licence for Open Government Data (NLOD)
            </a>
            . This data is pre-processed and stored on our server — your browser
            does not contact Oslo kommune directly.
          </li>
        </ul>
      </section>

      <section className={s_section}>
        <h2 className={s_h2}>Contact</h2>
        <p className={s_body}>
          Questions or concerns? Open an issue on{' '}
          <a
            href='https://github.com/haraldgb/mapmemo'
            target='_blank'
            rel='noreferrer'
            className={s_link}
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </article>
  )
}

const s_container =
  'flex flex-1 flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-sm'
const s_h1 = 'text-3xl font-semibold text-slate-900'
const s_h2 = 'text-lg font-semibold text-slate-800'
const s_meta = 'text-sm text-slate-400'
const s_body = 'max-w-2xl text-base text-slate-600'
const s_section = 'flex flex-col gap-3'
const s_list =
  'flex max-w-2xl list-disc flex-col gap-2 pl-5 text-base text-slate-600'
const s_code =
  'rounded bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-700'
const s_link = 'text-blue-600 underline hover:text-blue-800'
