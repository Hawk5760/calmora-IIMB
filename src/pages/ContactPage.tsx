import { useState } from 'react';
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Bug, HelpCircle, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  category: z.enum(['general', 'bug', 'feature', 'billing', 'crisis']),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

const ContactPage = () => {
  useSEO("Contact Calmora", "Get in touch with the Calmora team for support, feedback, partnerships, or press inquiries.", "/contact");
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    category: 'general',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    // Simulate sending (in production, this would call an edge function)
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSending(false);
    setSubmitted(true);
    toast.success('Message sent successfully!');
  };

  if (submitted) {
    return (
      <PageLayout>
        <PageHeader icon={<Send className="h-4 w-4 text-primary" />} badge="Support" title="Contact Us" subtitle="We'd love to hear from you" />
        <Card className="max-w-lg mx-auto bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Thank you!</h2>
            <p className="text-muted-foreground">
              Your message has been received. We'll get back to you within 24-48 hours.
            </p>
            <Button onClick={() => { setSubmitted(false); setForm({ ...form, subject: '', message: '' }); }} variant="outline">
              Send Another Message
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader icon={<Send className="h-4 w-4 text-primary" />} badge="Support" title="Contact & Support" subtitle="Get help, report bugs, or share feedback" />
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="space-y-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">support@calmora.app</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Response Time</p>
                  <p className="text-xs text-muted-foreground">Within 24-48 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Help</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <a href="/crisis-support" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <HelpCircle className="h-3.5 w-3.5" /> Crisis Support
              </a>
              <a href="/privacy" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <HelpCircle className="h-3.5 w-3.5" /> Privacy Policy
              </a>
              <a href="/terms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <HelpCircle className="h-3.5 w-3.5" /> Terms of Service
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="md:col-span-2 bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send us a message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    maxLength={100}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    maxLength={255}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <span className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> General Inquiry</span>
                    </SelectItem>
                    <SelectItem value="bug">
                      <span className="flex items-center gap-2"><Bug className="h-3.5 w-3.5" /> Bug Report</span>
                    </SelectItem>
                    <SelectItem value="feature">
                      <span className="flex items-center gap-2"><HelpCircle className="h-3.5 w-3.5" /> Feature Request</span>
                    </SelectItem>
                    <SelectItem value="billing">
                      <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Billing Issue</span>
                    </SelectItem>
                    <SelectItem value="crisis">
                      <span className="flex items-center gap-2"><HelpCircle className="h-3.5 w-3.5" /> Crisis / Urgent</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your issue, suggestion, or question in detail..."
                  rows={5}
                  maxLength={2000}
                />
                <div className="flex justify-between">
                  {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                  <p className="text-xs text-muted-foreground ml-auto">{form.message.length}/2000</p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ContactPage;
