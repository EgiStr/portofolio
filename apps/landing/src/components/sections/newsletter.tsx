import { NewsletterSignup } from "@ecosystem/ui";

/**
 * Newsletter section — server component wrapper around the client form.
 * Embedded between Certifications and Contact on the landing page.
 */
export function Newsletter() {
  return (
    <section id="newsletter" className="py-20 px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <NewsletterSignup
          source="landing-section"
          title="Subscribe to the newsletter"
          description="Get an email when I publish a new post or ship a new project. No spam, unsubscribe anytime."
        />
      </div>
    </section>
  );
}
