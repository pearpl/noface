import React from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { LiveCounters } from '@/components/LiveCounters';
import { ImageProcessor } from '@/components/ImageProcessor';
import { useAnonSnapStore } from '@/store/anonSnap';
import { Shield, Eye, Zap, ImageOff } from 'lucide-react';
import { useI18n } from '@/i18n';
import { APP_VERSION } from '@/version';

export const Home: React.FC = () => {
  const { processing } = useAnonSnapStore();
  const { t } = useI18n();

  return (
  <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="relative container mx-auto px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent animate-float inline-flex items-end gap-3 justify-center">
              <span>{t('app.name')}</span>
              <span className="text-[8px] md:text-[9px] font-semibold tracking-wide px-1 py-0.5 rounded border border-border/60 bg-background/70 backdrop-blur-sm shadow-sm uppercase text-white leading-none">
                {APP_VERSION}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('hero.tagline')} {" "}{t('hero.sub')}
            </p>
            <div className="mb-12">
              <div className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-3xl bg-gradient-to-r from-brand-purple/10 via-brand-cyan/10 to-pink-500/10 border border-border/60 backdrop-blur-md shadow-lg ring-1 ring-border/40">
                <span className="text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-brand-purple via-brand-cyan to-pink-500 bg-clip-text text-transparent drop-shadow-sm leading-none">100%</span>
                <span className="uppercase tracking-widest font-black text-brand-cyan/95 bg-gradient-to-r from-brand-cyan via-brand-purple to-pink-500 bg-clip-text text-transparent text-base md:text-2xl leading-none drop-shadow-sm">{t('hero.freeLabel')}</span>
                <span className="text-center text-sm md:text-base font-medium text-muted-foreground max-w-md">
                  {t('hero.freeNotice')}
                </span>
              </div>
            </div>
            
            {/* Feature highlights */}
            <div className="grid md:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto">
              <div className="glass-card rounded-xl p-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-brand-purple/20 via-brand-purple/10 to-transparent flex items-center justify-center ring-1 ring-brand-purple/40">
                  <Shield className="w-7 h-7 text-brand-purple" />
                </div>
                <h3 className="font-semibold mb-2">{t('feature.privacy.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature.privacy.desc')}</p>
              </div>
              
              <div className="glass-card rounded-xl p-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-brand-cyan/20 via-brand-cyan/10 to-transparent flex items-center justify-center ring-1 ring-brand-cyan/40">
                  <Eye className="w-7 h-7 text-brand-cyan" />
                </div>
                <h3 className="font-semibold mb-2">{t('feature.smart.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature.smart.desc')}</p>
              </div>
              
              <div className="glass-card rounded-xl p-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-brand-violet/25 via-brand-violet/10 to-transparent flex items-center justify-center ring-1 ring-brand-violet/40">
                  <Zap className="w-7 h-7 text-brand-violet" />
                </div>
                <h3 className="font-semibold mb-2">{t('feature.instant.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature.instant.desc')}</p>
              </div>
              <div className="glass-card rounded-xl p-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-pink-500/25 via-pink-500/10 to-transparent flex items-center justify-center ring-1 ring-pink-500/40">
                  <ImageOff className="w-7 h-7 text-pink-500" />
                </div>
                <h3 className="font-semibold mb-2">{t('feature.clean.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('feature.clean.desc')}</p>
              </div>
            </div>
            <LiveCounters />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 flex-1">
        {!processing.originalImage ? (
          <FileDropzone />
        ) : (
          <ImageProcessor />
        )}
      </div>

      {/* How It Works Section (2x2) */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-purple/5 to-brand-cyan/5 pointer-events-none" aria-hidden="true" />
        <div className="container mx-auto px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-12 text-center bg-gradient-to-r from-brand-purple via-brand-cyan to-pink-500 bg-clip-text text-transparent">
              {t('how.title')}
            </h2>
            {/* Prepare Row */}
            <div className="mb-6 text-center">
              <span className="inline-block text-xs uppercase tracking-wider font-semibold text-[#0c2d55] px-4 py-1.5 rounded-xl bg-white shadow-sm ring-1 ring-border/50">
                {t('how.group.prepare')}
              </span>
            </div>
            <div className="grid gap-8 md:grid-cols-2 mb-14">
              {/* Step 1 */}
              <div className="group rounded-2xl border border-border/60 bg-background/60 backdrop-blur-sm p-6 flex flex-col shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video mb-5 rounded-xl overflow-hidden ring-1 ring-border/50 bg-background">
                  <img src="/images/01.jpg" alt={t('how.step1.alt')} className="w-full h-full object-cover select-none pointer-events-none" loading="lazy" decoding="async" />
                </div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-brand-purple/15 ring-1 ring-brand-purple/40 text-sm font-bold text-brand-purple">1</span>
                  {t('how.step1.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('how.step1.desc')}</p>
              </div>
              {/* Step 2 */}
              <div className="group rounded-2xl border border-border/60 bg-background/60 backdrop-blur-sm p-6 flex flex-col shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video mb-5 rounded-xl overflow-hidden ring-1 ring-border/50 bg-background">
                  <img src="/images/02.jpg" alt={t('how.step2.alt')} className="w-full h-full object-cover select-none pointer-events-none" loading="lazy" decoding="async" />
                </div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-brand-cyan/15 ring-1 ring-brand-cyan/40 text-sm font-bold text-brand-cyan">2</span>
                  {t('how.step2.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('how.step2.desc')}</p>
              </div>
            </div>
            {/* Apply Row */}
            <div className="mb-6 mt-2 text-center">
              <span className="inline-block text-xs uppercase tracking-wider font-semibold text-[#0c2d55] px-4 py-1.5 rounded-xl bg-white shadow-sm ring-1 ring-border/50">
                {t('how.group.apply')}
              </span>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {/* Step 3 Pixelate */}
              <div className="group rounded-2xl border border-border/60 bg-background/60 backdrop-blur-sm p-6 flex flex-col shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video mb-5 rounded-xl overflow-hidden ring-1 ring-border/50 bg-background">
                  <img src="/images/03.jpg" alt={t('how.step3.alt')} className="w-full h-full object-cover select-none pointer-events-none" loading="lazy" decoding="async" />
                </div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-brand-violet/20 ring-1 ring-brand-violet/40 text-sm font-bold text-brand-violet">3</span>
                  {t('how.step3.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('how.step3.desc')}</p>
              </div>
              {/* Step 4 Color Block & Download */}
              <div className="group rounded-2xl border border-border/60 bg-background/60 backdrop-blur-sm p-6 flex flex-col shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video mb-5 rounded-xl overflow-hidden ring-1 ring-border/50 bg-background">
                  <img src="/images/04.jpg" alt={t('how.step4.alt')} className="w-full h-full object-cover select-none pointer-events-none" loading="lazy" decoding="async" />
                </div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-pink-500/25 ring-1 ring-pink-500/40 text-sm font-bold text-pink-500">4</span>
                  {t('how.step4.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('how.step4.desc')}</p>
              </div>
            </div>
            {/* Attribution / Footer inside section */}
            {/* Removed Freepik attribution per request */}
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="">
        <div className="container mx-auto px-6 py-14 text-center max-w-3xl">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 bg-gradient-to-r from-brand-purple via-brand-cyan to-pink-500 bg-clip-text text-transparent">{t('support.title')}</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
            {t('support.body')}
          </p>
          <a
            href="https://buymeacoffee.com/alienatedalien"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-cyan/60 rounded-xl"
            aria-label={t('support.cta')}
          >
            <img
              src="/images/buymecoffee.png"
              alt={t('support.cta')}
              className="h-12 w-auto mx-auto drop-shadow-md hover:drop-shadow-lg transition"
              loading="lazy"
              decoding="async"
            />
          </a>
          <p className="mt-5 text-xs text-muted-foreground/70">{t('support.thanks')}</p>
        </div>
        {/* Legal / Responsibility Section */}
        <div className="container mx-auto px-6 pb-16 -mt-6 max-w-3xl">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background/60 via-background/40 to-background/60 backdrop-blur-sm p-6 shadow-inner">
            <h3 className="text-sm font-semibold mb-3 tracking-wide text-brand-cyan/90">{t('legal.responsibility.title')}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {t('legal.responsibility.body')}
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <span className="block mb-1">&copy; {new Date().getFullYear()} <a href="https://www.pear.pl" target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline">Pear Interactive</a>. All rights reserved.</span>
        <span className="text-[10px] tracking-wider uppercase text-white/90">{APP_VERSION}</span>
      </footer>
    </div>
  );
};