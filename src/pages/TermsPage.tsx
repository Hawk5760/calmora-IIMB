import { PageLayout } from '@/components/layout/PageLayout';
import { useSEO } from "@/hooks/useSEO";
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

const TermsPage = () => {
  useSEO("Terms of Service — Calmora", "Read the Terms of Service for using the Calmora wellness app and AI companion.", "/terms");
  return (
    <PageLayout>
      <PageHeader icon={<FileText className="h-4 w-4 text-primary" />} badge="Legal" title="Terms of Service" subtitle="Last updated: April 13, 2026" />
      <Card className="max-w-4xl mx-auto bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-6 md:p-10">
          <ScrollArea className="h-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using Calmora ("the Service"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  Calmora is a mental wellness companion application that provides mood tracking, guided journaling, 
                  mindfulness exercises, AI-powered support, and other wellness tools. Calmora is <strong>not</strong> a 
                  substitute for professional medical advice, diagnosis, or treatment.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li>You must provide accurate and complete registration information.</li>
                  <li>You are responsible for maintaining the security of your account credentials.</li>
                  <li>You must be at least 13 years of age to use the Service.</li>
                  <li>You are responsible for all activities that occur under your account.</li>
                  <li>You must notify us immediately of any unauthorized use of your account.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
                <p className="text-muted-foreground">You agree not to:</p>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Use the Service for any unlawful purpose or to violate any laws.</li>
                  <li>Harass, abuse, or harm other users through the community features.</li>
                  <li>Post content that is defamatory, obscene, or promotes violence.</li>
                  <li>Attempt to gain unauthorized access to the Service or its systems.</li>
                  <li>Use bots, scrapers, or automated tools to access the Service.</li>
                  <li>Reverse engineer, decompile, or disassemble the Service.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">5. Subscriptions & Payments</h2>
                <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Free features are available without payment. Premium features require a paid subscription.</li>
                  <li>Subscription fees are billed in advance on a monthly or yearly basis.</li>
                  <li>You may cancel your subscription at any time. Access continues until the end of the billing period.</li>
                  <li>Refunds are handled in accordance with applicable laws and our refund policy.</li>
                  <li>We reserve the right to change pricing with 30 days' notice.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">6. Content & Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content, features, and functionality of the Service are owned by Calmora and are protected by 
                  copyright, trademark, and other intellectual property laws. You retain ownership of content you create 
                  (journal entries, mood logs, etc.), but grant us a limited license to process and store it for 
                  providing the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">7. Community Guidelines</h2>
                <p className="text-muted-foreground">
                  When using community features (peer support forums), you agree to be respectful and supportive. 
                  Content that violates our community guidelines may be removed, and repeat offenders may be banned. 
                  We use automated moderation to flag potentially harmful content.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">8. Privacy & Data</h2>
                <p className="text-muted-foreground">
                  Your use of the Service is also governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. 
                  We take your privacy seriously and implement industry-standard security measures to protect your data. 
                  You can request deletion of your data at any time through your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">9. Medical Disclaimer</h2>
                <p className="text-muted-foreground">
                  Calmora is a wellness tool and does <strong>not</strong> provide medical advice. The AI features, 
                  assessments, and content are for informational and self-help purposes only. If you are experiencing 
                  a mental health crisis, please contact emergency services or a crisis helpline immediately. 
                  Always consult with a qualified healthcare provider for medical concerns.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">10. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, Calmora shall not be liable for any indirect, incidental, 
                  special, consequential, or punitive damages, including but not limited to loss of data, profits, 
                  or goodwill. Our total liability shall not exceed the amount paid by you in the 12 months preceding 
                  the claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">11. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account at any time for violation of these terms. You may 
                  delete your account at any time. Upon termination, your right to use the Service ceases immediately, 
                  but we will retain your data for a reasonable period to comply with legal obligations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">12. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. We will notify you of material changes 
                  via email or through the Service. Continued use after changes constitutes acceptance of the 
                  modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">13. Governing Law</h2>
                <p className="text-muted-foreground">
                  These terms shall be governed by and construed in accordance with the laws of India, 
                  without regard to conflict of law principles. Any disputes arising from these terms shall be 
                  resolved through binding arbitration.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">14. Contact</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact us at{' '}
                  <a href="/contact" className="text-primary hover:underline">our contact page</a> or 
                  email us at support@calmora.app.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default TermsPage;
