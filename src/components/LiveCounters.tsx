import React, { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';

// Polling interval (ms) for refreshing counters from server.
// Increase/decrease this for less/more frequent updates.
const COUNTER_POLL_INTERVAL = 5000; // 5s

interface CounterData {
  images: number;
  faces: number;
}

export const LiveCounters: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<CounterData>({ images: 0, faces: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let localImages = 0;
    let localFaces = 0;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/counter.php?_=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Network error');
        try {
          const json = await res.json();
          if (mounted) {
            setData({ images: json.images, faces: json.faces });
            setError(null);
            localImages = json.images;
            localFaces = json.faces;
          }
        } catch (parseErr:any) {
          // Refetch as text to inspect
          try {
            const txtRes = await fetch(`/api/counter.php?debug=1&_=${Date.now()}`, { cache: 'no-store' });
            const rawText = await txtRes.text();
            console.error('Counter parse failed. Raw response:', rawText.substring(0, 200));
          } catch {}
          throw parseErr;
        }
      } catch (e:any) {
        console.error('Counter fetch failed', e);
        try {
          const snap = await fetch(`/storage/counter.json?_=${Date.now()}`, { cache: 'no-store' });
            if (snap.ok) {
              const js = await snap.json();
              if (mounted && typeof js.images === 'number' && typeof js.faces === 'number') {
                setData({ images: js.images, faces: js.faces });
              }
            }
        } catch {}
        if (mounted) setError('ERR');
      }
    };

    // quick static bootstrap
    (async () => {
      try {
        const snap = await fetch(`/storage/counter.json?_=${Date.now()}`, { cache: 'no-store' });
        if (snap.ok) {
          const js = await snap.json();
          if (mounted && typeof js.images === 'number' && typeof js.faces === 'number') {
            localImages = js.images;
            localFaces = js.faces;
            setData({ images: js.images, faces: js.faces });
          }
        }
      } catch {}
    })();

    fetchData();
    const intervalId = setInterval(fetchData, COUNTER_POLL_INTERVAL);

    const onLocal = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail;
      if (!detail) return;
      localImages += detail.images || 0;
      localFaces += detail.faces || 0;
      if (mounted) setData({ images: localImages, faces: localFaces });
    };

    window.addEventListener('noface:anonymized', onLocal);
    window.addEventListener('noface:image', onLocal);
    window.addEventListener('noface:counters:sync', fetchData);
    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener('noface:anonymized', onLocal);
      window.removeEventListener('noface:image', onLocal);
      window.removeEventListener('noface:counters:sync', fetchData);
    };
  }, []);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-10 text-sm">
      <div className="flex flex-col items-center">
  <span className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent tabular-nums drop-shadow-sm tracking-tight">
          {data ? data.images : '…'}
        </span>
	<span className="mt-1 text-muted-foreground uppercase tracking-wider text-[11px] md:text-xs">{t('counters.images')}</span>
      </div>
      <div className="flex flex-col items-center">
  <span className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-pink-500 to-brand-violet bg-clip-text text-transparent tabular-nums drop-shadow-sm tracking-tight">
          {data ? data.faces : '…'}
        </span>
	<span className="mt-1 text-muted-foreground uppercase tracking-wider text-[11px] md:text-xs">{t('counters.faces')}</span>
      </div>
    </div>
  );
};
