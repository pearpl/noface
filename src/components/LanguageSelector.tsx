import React from 'react';
import { useI18n, locales } from '@/i18n';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { locale, setLocale } = useI18n();
  return (
    <div className={cn('flex items-center gap-2 text-xs mt-3 mr-3 md:mt-4 md:mr-4', className)}>
      <Globe className="w-5 h-5 opacity-80" />
      <div className="relative">
        <select
          className="appearance-none bg-background/70 backdrop-blur-sm border border-border rounded-md pr-9 pl-3 py-2 md:pr-10 md:pl-4 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple text-xs md:text-sm shadow-sm"
          value={locale}
          onChange={(e)=> setLocale(e.target.value as any)}
          aria-label="Language selector"
        >
          {locales.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70 md:right-3" />
      </div>
    </div>
  );
};
