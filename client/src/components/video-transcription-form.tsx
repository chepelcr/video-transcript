import { useState } from "react";
import { Play, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { transcribeVideo } from "@/lib/transcription-api";
import { useToast } from "@/hooks/use-toast";

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
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(videoUrl)) {
      toast({
        title: "Error", 
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    if (remainingTranscriptions <= 0) {
      toast({
        title: "Limit Reached",
        description: "You have reached your free tier limit. Please upgrade to continue.",
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
        title: "Success",
        description: "Video transcribed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to transcribe video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <Input
          type="url"
          placeholder="Paste your video URL here (YouTube, Vimeo, etc.)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
              Processing...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Transcribe
            </>
          )}
        </Button>
      </form>
      
      <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
        <Gift className="mr-2 h-4 w-4 text-accent" />
        <span>{remainingTranscriptions} free transcriptions remaining</span>
      </div>
    </div>
  );
}
