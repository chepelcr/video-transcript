import { useState } from "react";
import { Play, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { transcribeVideo } from "@/lib/transcription-api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface VideoTranscriptionFormProps {
  onTranscriptionComplete: (transcription: any) => void;
  remainingTranscriptions: number;
  onUpgradeRequired: () => void;
}

export default function VideoTranscriptionForm({
  onTranscriptionComplete,
  remainingTranscriptions,
  onUpgradeRequired
}: VideoTranscriptionFormProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      toast({
        title: t('messages.error'),
        description: t('messages.enterUrl'),
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(videoUrl)) {
      toast({
        title: t('messages.error'), 
        description: t('messages.invalidUrl'),
        variant: "destructive",
      });
      return;
    }

    if (remainingTranscriptions <= 0) {
      toast({
        title: t('messages.error'),
        description: t('messages.limitReached'),
        variant: "destructive",
      });
      onUpgradeRequired();
      return;
    }

    setIsProcessing(true);
    try {
      const transcription = await transcribeVideo(videoUrl);
      onTranscriptionComplete(transcription);
      setVideoUrl("");
      
      toast({
        title: t('messages.success'),
        description: t('messages.transcribed'),
      });
    } catch (error: any) {
      toast({
        title: t('messages.error'),
        description: error.message || t('messages.failed'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <Input
          type="url"
          placeholder={t('hero.placeholder')}
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          disabled={isProcessing}
        />
        <Button
          type="submit"
          disabled={isProcessing || remainingTranscriptions <= 0}
          className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('hero.processing')}
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t('hero.transcribe')}
            </>
          )}
        </Button>
      </form>
      
      <div className="mt-4 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <Gift className="mr-2 h-4 w-4 text-accent" />
        <span>{remainingTranscriptions} {t('hero.remaining')}</span>
      </div>
    </div>
  );
}
