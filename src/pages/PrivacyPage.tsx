import { PageLayout } from '@/components/layout/PageLayout';
import { useSEO } from "@/hooks/useSEO";
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield } from 'lucide-react';

const PrivacyPage = () => {
  useSEO("Privacy Policy — Calmora", "Read the official Calmora Privacy Policy to understand how we collect, use, and protect your personal and wellness data.", "/privacy");
  return (
    <PageLayout>
      <PageHeader
        icon={<Shield className="h-4 w-4 text-primary" />}
        badge="Legal"
        title="Privacy Policy"
        subtitle="Last updated: June 16, 2026"
      />
      <Card className="max-w-4xl mx-auto bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-6 md:p-10">
          <ScrollArea className="h-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
                <p className="text-muted-foreground">
                  Calmora Wellness Technologies (“Calmora,” “we,” “us,” or “our") is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                  our website, mobile applications, and wellness services (collectively, the “Service”). By using the Service, 
                  you consent to the practices described in this policy.
                </p>
                <p className="text-muted-foreground">
                  If you have any questions or concerns about this policy, please contact us at 
                  <a href="mailto:support@calmora.app" className="text-primary hover:underline"> support@calmora.app</a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
                <p className="text-muted-foreground">
                  We collect information to provide, maintain, and improve the Service. The types of information we collect include:
                </p>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li>
                    <strong>Account Information:</strong> When you register, we collect your email address and authentication 
                    credentials. You may also provide a display name and profile photo. We support anonymous sign-in for users 
                    who prefer not to share personal identifiers.
                  </li>
                  <li>
                    <strong>Wellness & Activity Data:</strong> Mood entries, journal content, guided breathing session logs, 
                    garden progress, sleep session history, CBT exercises, and assessment responses. This data is core to 
                    delivering personalized wellness support.
                  </li>
                  <li>
                    <strong>AI Conversations:</strong> Messages exchanged with our AI support companion are processed to generate 
                    responses. We retain conversation history to maintain continuity and improve response quality.
                  </li>
                  <li>
                    <strong>Community Content:</strong> Posts, comments, and interactions within peer-support forums. Community 
                    content is subject to automated moderation to detect harmful language.
                  </li>
                  <li>
                    <strong>Usage & Device Information:</strong> IP address, browser type, operating system, device identifiers, 
                    app version, and interaction logs. This helps us diagnose issues and optimize performance.
                  </li>
                  <li>
                    <strong>Crisis Detection Events:</strong> If our systems detect language indicating self-harm or crisis risk, 
                    we log the event so that safety resources can be presented. These logs are treated with the highest confidentiality.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
                <p className="text-muted-foreground">We use the information we collect to:</p>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Provide and personalize the Service, including mood insights, journaling prompts, and AI responses.</li>
                  <li>Ensure account security, including two-factor authentication and suspicious activity detection.</li>
                  <li>Send transactional communications (e.g., password resets, security alerts) and optional reminders.</li>
                  <li>Improve our features through aggregated, de-identified analytics.</li>
                  <li>Detect, prevent, and respond to crises, abuse, or technical issues.</li>
                  <li>Comply with legal obligations and enforce our Terms of Service.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">4. Data Storage & Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard technical and organizational measures to protect your data:
                </p>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li>
                    <strong>Encryption:</strong> Data is encrypted in transit using TLS/HTTPS and at rest within our databases.
                  </li>
                  <li>
                    <strong>Supabase Infrastructure:</strong> We use Supabase for authentication and database services, which 
                    includes Row-Level Security (RLS) to ensure users can only access their own records.
                  </li>
                  <li>
                    <strong>Local Storage:</strong> Some data (e.g., recent mood entries, preferences) may be cached in your 
                    device’s local storage to enable offline functionality. We prefix local storage keys with your user ID 
                    to maintain isolation on shared devices.
                  </li>
                  <li>
                    <strong>Two-Factor Authentication (2FA):</strong> Users may enable TOTP-based 2FA for additional account protection.
                  </li>
                </ul>
                <p className="text-muted-foreground">
                  No method of transmission or storage is 100% secure. While we strive to protect your information, we cannot 
                  guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">5. Data Sharing & Disclosure</h2>
                <p className="text-muted-foreground">
                  We do not sell, rent, or trade your personal information. We may share data only in the following limited circumstances:
                </p>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li>
                    <strong>Service Providers:</strong> We use trusted third-party providers (e.g., Supabase, analytics services) 
                    to host, analyze, and secure our infrastructure. These providers are contractually bound to use your data 
                    solely for the services they perform on our behalf.
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government 
                    request, or to protect our rights, property, or safety, or that of our users or the public.
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, user information 
                    may be transferred subject to the same privacy commitments.
                  </li>
                  <li>
                    <strong>Anonymized Data:</strong> We may share aggregated, de-identified data that cannot reasonably be used 
                    to identify you.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">6. Your Rights & Choices</h2>
                <p className="text-muted-foreground">
                  Depending on your jurisdiction, you may have the following rights regarding your personal data:
                </p>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li><strong>Access & Portability:</strong> You can request a copy of your data in machine-readable format using the Data Export feature.</li>
                  <li><strong>Correction:</strong> Update your profile and preferences at any time through the Settings page.</li>
                  <li><strong>Deletion:</strong> You may delete your account and associated data. Deletion requests are processed within 30 days, subject to legal retention requirements.</li>
                  <li><strong>Consent Withdrawal:</strong> You can disable data collection, analytics, and marketing emails via the Privacy Controls in Account Security.</li>
                  <li><strong>Objection & Restriction:</strong> You may object to certain processing activities by contacting us.</li>
                </ul>
                <p className="text-muted-foreground">
                  To exercise these rights, visit your Account Security settings or email us at 
                  <a href="mailto:support@calmora.app" className="text-primary hover:underline"> support@calmora.app</a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">7. Cookies & Tracking Technologies</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to authenticate users, remember preferences, and analyze usage trends. 
                  You can manage cookie preferences through your browser settings. Essential cookies required for security and 
                  core functionality cannot be disabled.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  The Service is not intended for children under 13 years of age. We do not knowingly collect personal information 
                  from children under 13. If you believe we have inadvertently collected such information, please contact us immediately 
                  so we can delete it.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">9. International Data Transfers</h2>
                <p className="text-muted-foreground">
                  Calmora is operated from India. Your data is stored on infrastructure located in regions selected by our cloud 
                  providers. By using the Service, you consent to the transfer of your information to these locations. We take 
                  appropriate safeguards to ensure your data receives adequate protection regardless of where it is processed.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">10. Third-Party Links & Integrations</h2>
                <p className="text-muted-foreground">
                  The Service may contain links to third-party websites or integrations (e.g., Spotify, YouTube for mood music 
                  and sleep audio). We are not responsible for the privacy practices of these third parties. We encourage you 
                  to review their privacy policies before interacting with them.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">11. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. Material changes will be notified via email or through 
                  the Service at least 15 days before they take effect. The “Last updated" date at the top of this page indicates 
                  when the policy was most recently revised. Continued use of the Service after changes constitutes acceptance 
                  of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions, concerns, or complaints about this Privacy Policy or our data practices, please reach 
                  out to us:
                </p>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Email: <a href="mailto:support@calmora.app" className="text-primary hover:underline">support@calmora.app</a></li>
                  <li>Contact form: <a href="/contact" className="text-primary hover:underline">calmora.app/contact</a></li>
                </ul>
                <p className="text-muted-foreground">
                  We aim to respond to all privacy-related inquiries within 48 hours.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default PrivacyPage;
