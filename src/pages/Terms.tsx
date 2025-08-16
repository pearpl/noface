import React from 'react';
import { Scale, FileText, AlertTriangle, Globe } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Terms of Use
            </h1>
            <p className="text-xl text-muted-foreground">
              Please read these terms carefully before using NoFace.
            </p>
          </div>

          {/* Key terms highlights */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="glass-card rounded-2xl p-6">
              <Scale className="w-8 h-8 text-brand-purple mb-4" />
              <h3 className="text-xl font-semibold mb-3">Legal Compliance</h3>
              <p className="text-muted-foreground">
                You must have legal rights to process any images you use with our service.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <FileText className="w-8 h-8 text-brand-cyan mb-4" />
              <h3 className="text-xl font-semibold mb-3">Service "As Is"</h3>
              <p className="text-muted-foreground">
                NoFace is provided without warranties. Use at your own risk and discretion.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <AlertTriangle className="w-8 h-8 text-brand-violet mb-4" />
              <h3 className="text-xl font-semibold mb-3">Free Tier Limits</h3>
              <p className="text-muted-foreground">
                Free users can process one image per session with JPG-only output.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <Globe className="w-8 h-8 text-brand-purple mb-4" />
              <h3 className="text-xl font-semibold mb-3">EU/Poland Law</h3>
              <p className="text-muted-foreground">
                These terms are governed by European Union and Polish law.
              </p>
            </div>
          </div>

          {/* Detailed terms */}
          <div className="glass-card rounded-2xl p-8">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-6">Terms and Conditions</h2>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground">
                    By accessing and using NoFace, you accept and agree to be bound by the terms 
                    and provision of this agreement. If you do not agree to abide by the above, 
                    please do not use this service.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">2. Image Rights and Consent</h3>
                  <p className="text-muted-foreground">
                    You represent and warrant that you have all necessary rights to process any images 
                    you upload to NoFace. This includes obtaining appropriate consent from any 
                    individuals whose faces appear in the images, where required by applicable law. 
                    You are solely responsible for ensuring compliance with all relevant privacy laws.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">3. Service Availability</h3>
                  <p className="text-muted-foreground">
                    NoFace is provided "as is" without any representations or warranties, express or implied. 
                    We make no representations or warranties in relation to this service or the information 
                    and materials provided on this website.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">4. Free Tier Limitations</h3>
                  <p className="text-muted-foreground">
                    Free tier users are limited to processing one image per browser session. 
                    Output is limited to JPG format only. To process additional images, 
                    refresh your browser to start a new session.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">5. Prohibited Uses</h3>
                  <p className="text-muted-foreground">
                    You may not use NoFace for any unlawful purpose or to solicit the performance 
                    of unlawful acts. This includes processing images without proper authorization 
                    or attempting to circumvent technical limitations through automated means.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">6. Limitation of Liability</h3>
                  <p className="text-muted-foreground">
                    In no event shall NoFace, nor its directors, employees, partners, agents, 
                    suppliers, or affiliates, be liable for any indirect, incidental, punitive, 
                    consequential, or special damages arising out of your use of the service.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">7. Anti-Abuse Measures</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to implement technical measures to prevent abuse of our service, 
                    including but not limited to rate limiting and blocking of automated traffic.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">8. Governing Law</h3>
                  <p className="text-muted-foreground">
                    These terms and conditions are governed by and construed in accordance with the laws 
                    of the European Union and Poland. Any disputes relating to these terms shall be 
                    subject to the exclusive jurisdiction of Polish courts.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">9. Changes to Terms</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to revise these terms at any time. Changes will be effective 
                    immediately upon posting to this page. Your continued use of NoFace following 
                    the posting of revised terms means you accept and agree to the changes.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">10. Contact Information</h3>
                  <p className="text-muted-foreground">
                    If you have any questions about these Terms of Use, please contact us at: 
                    <span className="text-brand-cyan"> legal@noface.example</span>
                  </p>
                </section>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};