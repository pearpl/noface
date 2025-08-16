import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertTriangle, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnonSnapStore } from '@/store/anonSnap';
import { isHEICFile, isSupportedImageType, removeExifData } from '@/utils/imageProcessing';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n';

export const FileDropzone: React.FC = () => {
  const { 
    setOriginalImage, 
    setIsDragOver, 
    isDragOver,
    sessionImageCount 
  } = useAnonSnapStore();
  const { t } = useI18n();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsDragOver(false);
    
    if (sessionImageCount >= 1) {
      toast({
        title: t('drop.freeLimit'),
        description: t('drop.freeLimit.desc'),
        variant: "destructive",
      });
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Check for HEIC files
    if (isHEICFile(file)) {
      toast({
        title: 'HEIC',
        description: t('drop.heic.warn'),
        variant: "destructive",
      });
      return;
    }

    // Check supported formats
    if (!isSupportedImageType(file)) {
      toast({
        title: 'Unsupported',
        description: t('drop.supported'),
        variant: "destructive",
      });
      return;
    }

    try {
      // Remove EXIF data
      toast({
        title: t('drop.uploadCta'),
        description: '...'
      });
      
      const cleanBlob = await removeExifData(file);
      const cleanFile = new File([cleanBlob], file.name, { type: 'image/jpeg' });
      
      setOriginalImage(cleanFile);
      // Increment global image counter immediately on each upload attempt (even same file)
      try {
        const res = await fetch('/api/counter.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: 1, faces: 0 })
        });
        if (res.ok) {
          window.dispatchEvent(new Event('noface:counters:sync'));
        }
      } catch {}
      
      toast({
        title: t('drop.uploadCta'),
        description: 'OK'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed',
        variant: 'destructive'
      });
    }
  }, [sessionImageCount, setOriginalImage, setIsDragOver]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const isDisabled = sessionImageCount >= 1;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300
          ${isDragActive || isDragOver 
            ? 'border-brand-purple bg-brand-purple/10 scale-105' 
            : 'border-border hover:border-brand-cyan'
          }
          ${isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-card/50'
          }
          glass-card
        `}
      >
        <input {...getInputProps()} disabled={isDisabled} />
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        
        <div className="relative z-10">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-float">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-white" />
            ) : (
              <Image className="w-8 h-8 text-white" />
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            {isDisabled ? t('drop.freeLimit') : isDragActive ? t('drop.dropHere') : t('drop.uploadCta')}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            {isDisabled ? t('drop.refreshToContinue') : t('drop.supported')}
          </p>
          
          {!isDisabled && (
            <Button variant="gradient" size="lg" className="mb-4">
              <Upload className="w-5 h-5 mr-2" />
              {t('drop.chooseImage')}
            </Button>
          )}
          
          {/* Format support notice */}
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-400">✓ JPG</span>
              <span className="text-green-400">✓ PNG</span>
              <span className="text-green-400">✓ WebP</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{t('drop.heic.warn')}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Privacy notice */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
  <p>🔒 {t('privacy.notice.1')}</p>
  <p>{t('privacy.notice.2')}</p>
      </div>
    </div>
  );
};