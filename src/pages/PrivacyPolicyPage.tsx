import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";

const LAST_UPDATED = "11 August 2026";
const CONTACT_EMAIL = "narrowlist.contact@gmail.com";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">1. Who we are</h2>
            <p>
              Narrowlist ("we", "us", "the site") is a community-run ranking list for Narrow Arrow
              custom levels. This policy explains what personal data we collect, why we collect it,
              how long we keep it, and the rights you have over it. For any privacy question or
              request you can contact us at{" "}
              <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">2. Data we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Account data:</strong> your email address, a
                hashed password (or a Google account identifier if you sign in with Google), account
                creation date and last sign-in time. Email addresses are handled by our
                authentication provider and are never shown publicly on the site.
              </li>
              <li>
                <strong className="text-foreground">Profile data:</strong> username, display name,
                optional avatar image, optional country flag, and any links you choose to add.
              </li>
              <li>
                <strong className="text-foreground">Submissions:</strong> level submissions and run
                submissions, including level IDs, completion times, video/proof links, and any notes
                you write.
              </li>
              <li>
                <strong className="text-foreground">Gameplay data from the Narrow Arrow API:</strong>{" "}
                publicly available run records (username, completion time, run ID, timestamps) fetched
                from <code>api.narrowarrow.xyz</code> so the list and leaderboards stay up to date.
              </li>
              <li>
                <strong className="text-foreground">Local device data:</strong> theme choice,
                watchlist, Level Roulette settings and saved runs, and historical-view settings stored
                in your browser's local storage. These stay on your device.
              </li>
              <li>
                <strong className="text-foreground">Technical data:</strong> basic server and security
                logs (IP address, browser user agent, timestamps) generated automatically when you use
                the site, used to keep the service working and to prevent abuse.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">3. Why we use it and our legal basis</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To create and secure your account and let you sign in — performance of a contract.</li>
              <li>To display profiles, records, points and leaderboards — performance of a contract and our legitimate interest in running a public ranking list.</li>
              <li>To review submissions, moderate content and enforce our rules — legitimate interest.</li>
              <li>To send account-related emails such as verification and password resets — performance of a contract.</li>
              <li>To detect abuse, spam and cheating, and to keep the service stable — legitimate interest.</li>
            </ul>
            <p className="mt-2">
              We do not use your data for advertising, we do not sell it, and we do not build
              advertising profiles.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">4. What is public</h2>
            <p>
              Your username, profile details, completions, points, ranks and approved submissions are
              publicly visible — that is the purpose of the site. Your email address, password and
              private moderation notes are not public. Staff members with an admin role can see
              submission and account records where necessary for moderation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">5. Sharing and processors</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Our hosting, database, authentication and storage provider.</li>
              <li>Discord, when a notification about a new record or list change is posted to a public community channel. These notifications contain level, rank and username information — never email addresses.</li>
              <li>The Narrow Arrow API, which we read public gameplay data from.</li>
              <li>Authorities, if we are legally required to disclose information.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">6. Retention</h2>
            <p>
              Account and profile data is kept while your account exists. Deleted profiles are held in
              a restore archive for up to 30 days before permanent deletion, so accidental deletions
              can be reversed. List and rank history is kept indefinitely as a historical record of
              the list.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">7. Your rights</h2>
            <p>
              Depending on where you live (for example under the GDPR or UK GDPR) you have the right
              to access, correct, delete, export or restrict processing of your personal data, and to
              object to processing based on legitimate interest. You may also withdraw consent where
              processing is based on consent, and lodge a complaint with your local data protection
              authority. To exercise any of these rights, email{" "}
              <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We aim
              to respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">8. Cookies and local storage</h2>
            <p>
              We use strictly necessary storage only: a session token so you stay signed in, and local
              storage for your preferences (theme, watchlist, roulette settings). We do not use
              advertising or third-party analytics cookies. Clearing your browser storage will sign
              you out and reset your preferences.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">9. Children</h2>
            <p>
              The site is not directed at children under 13 (or the minimum age required in your
              country). If you believe a child has provided us with personal data, contact us and we
              will delete it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">10. International transfers</h2>
            <p>
              Our providers may process data on servers outside your country. Where that happens, the
              transfer is covered by the provider's standard contractual clauses or an equivalent
              safeguard.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">11. Changes</h2>
            <p>
              We may update this policy. Material changes will be reflected in the "last updated" date
              above, and continued use of the site after a change means you accept the updated policy.
            </p>
          </section>

          <p className="pt-4 border-t border-border">
            See also our <Link className="text-primary" to="/terms">Terms of Use</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
