import React from 'react';
import { Shield, Lock, Eye, Database } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground">
              Your privacy is our priority. Here's how we protect it.
            </p>
          </div>

          {/* Privacy highlights */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="glass-card rounded-2xl p-6">
              <Lock className="w-8 h-8 text-brand-purple mb-4" />
              <h3 className="text-xl font-semibold mb-3">No Image Uploads</h3>
              <p className="text-muted-foreground">
                All image processing happens directly in your browser. Your photos never leave your device.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <Eye className="w-8 h-8 text-brand-cyan mb-4" />
              <h3 className="text-xl font-semibold mb-3">No Tracking</h3>
              <p className="text-muted-foreground">
                We don't use analytics, cookies, or any tracking technologies. Your browsing is private.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <Database className="w-8 h-8 text-brand-violet mb-4" />
              <h3 className="text-xl font-semibold mb-3">Minimal Data</h3>
              <p className="text-muted-foreground">
                We only collect anonymous usage statistics (total images processed, faces anonymized).
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <Shield className="w-8 h-8 text-brand-purple mb-4" />
              <h3 className="text-xl font-semibold mb-3">Your Responsibility</h3>
              <p className="text-muted-foreground">
                You're responsible for ensuring you have rights to process any images you upload.
              </p>
            </div>
          </div>

          {/* Detailed policy */}
          <div className="glass-card rounded-2xl p-8">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-6">Detailed Privacy Policy</h2>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">1. Information We Don't Collect</h3>
                  <p className="text-muted-foreground">
                    NoFace does not collect, store, or process any personal information or image data. 
                    All image processing occurs entirely within your web browser using client-side JavaScript.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">2. Local Processing Only</h3>
                  <p className="text-muted-foreground">
                    When you upload an image to NoFace, it remains on your device at all times. 
                    We use browser APIs and machine learning models that run locally to detect faces 
                    and apply anonymization effects.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">3. Anonymous Usage Statistics</h3>
                  <p className="text-muted-foreground">
                    We collect only aggregate, anonymous statistics about service usage, including 
                    total number of images processed and faces anonymized. This data helps us understand 
                    usage patterns but cannot be linked to individual users.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">4. No Third-Party Services</h3>
                  <p className="text-muted-foreground">
                    NoFace does not use third-party analytics, advertising networks, or tracking services. 
                    The machine learning models run entirely in your browser.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">5. Your Responsibilities</h3>
                  <p className="text-muted-foreground">
                    You are responsible for ensuring you have the legal right to process any images 
                    you use with NoFace. This includes obtaining consent from individuals whose 
                    faces appear in the images, if required by applicable law.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">6. Contact Information</h3>
                  <p className="text-muted-foreground">
                    If you have questions about this privacy policy, please contact us at: 
                    <span className="text-brand-cyan"> privacy@noface.example</span>
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">7. Changes to This Policy</h3>
                  <p className="text-muted-foreground">
                    We may update this privacy policy from time to time. Changes will be posted on this page 
                    with an updated "Last Modified" date.
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