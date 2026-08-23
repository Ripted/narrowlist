import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";

const LAST_UPDATED = "11 August 2026";
const CONTACT_EMAIL = "narrowlist.contact@gmail.com";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Terms of Use</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">1. Acceptance</h2>
            <p>
              By using Narrowlist you agree to these Terms of Use and to our{" "}
              <Link className="text-primary" to="/privacy">Privacy Policy</Link>. If you do not agree,
              please do not use the site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">2. What Narrowlist is</h2>
            <p>
              Narrowlist is a free, community-run ranking list for Narrow Arrow custom levels. It is
              not affiliated with, endorsed by, or operated by the developers or publishers of Narrow
              Arrow. All game names, level names and trademarks belong to their respective owners.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">3. Accounts</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You must provide a valid email address and keep your login details secure.</li>
              <li>You are responsible for everything done through your account.</li>
              <li>One person may not run multiple accounts to gain an advantage on the lists.</li>
              <li>You must be at least 13 years old, or the minimum age required in your country.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">4. Submissions and content</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Submissions must be genuine. Hacked, spliced, edited, macroed or otherwise falsified runs are prohibited.</li>
              <li>You must have the right to submit any video, image or text you upload or link.</li>
              <li>By submitting content you grant us a non-exclusive, worldwide, royalty-free licence to display, store and share it on the site and in our community notification channels.</li>
              <li>Staff may approve, reject, edit or remove any submission, and may correct ranks, points and records at their discretion.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">5. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-1.5">
              <li>Harass, threaten, impersonate or abuse other users or staff.</li>
              <li>Post illegal, hateful, sexual or otherwise inappropriate content.</li>
              <li>Attempt to gain unauthorised access to accounts, admin tools, our API or database.</li>
              <li>Scrape, spam, overload or otherwise disrupt the service or its automated syncs.</li>
              <li>Manipulate rankings, points or leaderboards through fake accounts or false reports.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">6. Moderation and termination</h2>
            <p>
              We may warn, restrict, ban or delete any account or content that breaks these terms, with
              or without notice. Deleted profiles may be kept in a restore archive for up to 30 days.
              You can request deletion of your account at any time by contacting{" "}
              <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">7. Accuracy and availability</h2>
            <p>
              Rankings, points and records are community judgements and data pulled from a third-party
              game API. They may be incomplete, delayed or incorrect. The site is provided "as is" and
              "as available", without warranties of any kind, and we do not guarantee uninterrupted
              access or that any data will be preserved.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">8. Liability</h2>
            <p>
              To the maximum extent permitted by law, we are not liable for any indirect, incidental or
              consequential damages, loss of data, or loss of rank, points or records arising from your
              use of the site. Nothing in these terms limits liability that cannot be limited by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">9. Copyright complaints</h2>
            <p>
              If you believe content on the site infringes your rights, contact{" "}
              <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with a
              description of the content and its location, and we will review and remove it where
              appropriate.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">10. Changes to these terms</h2>
            <p>
              We may update these terms at any time. The "last updated" date shows the current version,
              and continued use of the site after a change means you accept it.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
