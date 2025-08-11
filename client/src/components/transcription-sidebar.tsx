import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  FileText,
  Download,
  Copy,
  Clock,
  BarChart3,
  RefreshCw,
  Video,
} from "lucide-react";
import { SiYoutube, SiVimeo } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";

interface Transcription {
  id: string;
  videoUrl: string;
  videoTitle?: string;
  transcript: string;
  status: string;
  duration: number;
  wordCount: number;
  processingTime: number;
  accuracy: number;
  createdAt: string;
}

interface TranscriptionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TranscriptionSidebar({
  isOpen,
  onClose,
}: TranscriptionSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Check if we're on a large screen (desktop) - must be declared before early return
  const [isDesktop, setIsDesktop] = useState(false);

  // Use effect to determine screen size - must be declared before early return
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const {
    data: transcriptionData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["/api/users", user?.id, "transcriptions"],
    enabled: isAuthenticated && !!user?.id,
    retry: false,
    refetchInterval: (data: any) => {
      // Auto-refresh every 5 seconds if there are processing transcriptions
      const hasProcessing = data?.transcriptions?.some(
        (t: Transcription) => t.status === "processing",
      );
      return hasProcessing ? 5000 : false;
    },
    queryFn: async () => {
      const tokens = JSON.parse(localStorage.getItem("auth_tokens") || "{}");
      if (!tokens.accessToken) {
        throw new Error("No access token available");
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${baseUrl}/api/users/${user?.id}/transcriptions`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transcriptions: ${response.status}`);
      }

      return response.json();
    },
  });

  // Refresh transcriptions when sidebar opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refetch();
    }
  }, [isOpen, isAuthenticated, refetch]);

  const transcriptions = transcriptionData?.transcriptions || [];

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: t("transcriptions.refreshed"),
      description: t("transcriptions.refreshedDesc"),
    });
  };

  const getStatusBadge = (status: string, transcript: string) => {
    status = transcript ? "completed" : status;
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white text-xs"
          >
            {t("status.completed")}
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="default"
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
          >
            {t("status.processing")}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            {t("status.failed")}
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-500 hover:bg-gray-600 text-white text-xs"
          >
            {t("status.pending")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  const handleCopyTranscript = async (transcript: string) => {
    try {
      await navigator.clipboard.writeText(transcript);
      toast({
        title: t("messages.copied"),
        description: "Transcription copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: t("messages.copyFailed"),
        variant: "destructive",
      });
    }
  };

  const handleDownloadTranscript = (transcription: Transcription) => {
    const blob = new Blob([transcription.transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription-${transcription.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: t("messages.downloadStarted"),
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getVideoTitle = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (
        urlObj.hostname.includes("youtube.com") ||
        urlObj.hostname.includes("youtu.be")
      ) {
        return "YouTube Video";
      }
      if (urlObj.hostname.includes("vimeo.com")) {
        return "Vimeo Video";
      }
      return urlObj.hostname;
    } catch {
      return "Video";
    }
  };

  const getVideoProviderIcon = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (
        urlObj.hostname.includes("youtube.com") ||
        urlObj.hostname.includes("youtu.be")
      ) {
        return <SiYoutube className="h-4 w-4 text-red-600 flex-shrink-0" />;
      }
      if (urlObj.hostname.includes("vimeo.com")) {
        return <SiVimeo className="h-4 w-4 text-blue-500 flex-shrink-0" />;
      }
      return <Video className="h-4 w-4 text-gray-500 flex-shrink-0" />;
    } catch {
      return <Video className="h-4 w-4 text-gray-500 flex-shrink-0" />;
    }
  };

  const transcriptionContent = (
    <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
      {!isAuthenticated ? (
        <div className="flex h-full items-center justify-center p-6 bg-white dark:bg-gray-900">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("auth.loginRequired")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t("auth.loginMessage")}
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-6 bg-white dark:bg-gray-900">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t("history.loading")}
          </span>
        </div>
      ) : transcriptions.length === 0 ? (
        <div className="flex h-full items-center justify-center p-6 bg-white dark:bg-gray-900">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("history.empty")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("history.empty.description")}
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="h-full bg-white dark:bg-gray-900">
          <div className="space-y-3 p-3 bg-white dark:bg-gray-900">
            {transcriptions.map((transcription: Transcription) => (
              <Card
                key={transcription.id}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardHeader className="pb-2 px-3 pt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {getVideoProviderIcon(transcription.videoUrl)}
                    <CardTitle className="text-sm font-medium truncate flex-1 min-w-0">
                      {transcription.videoTitle ||
                        getVideoTitle(transcription.videoUrl)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-3 pb-3">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {transcription.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(transcription.duration)}
                      </div>
                    )}
                    {transcription.status === "completed" &&
                      transcription.wordCount && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {transcription.wordCount} {t("history.words")}
                        </div>
                      )}
                  </div>
                  {transcription.transcript && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {transcription.transcript}
                    </p>
                  )}
                  {!transcription.transcript &&
                    transcription.status === "processing" && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                        Your transcription is being processed. This may take a
                        few minutes...
                      </p>
                    )}
                  {transcription.status === "failed" && (
                    <p className="text-sm text-red-600 dark:text-red-400 italic">
                      Transcription failed. Please try again with a different
                      video.
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 flex-wrap">
                      {getStatusBadge(
                        transcription.status,
                        transcription.transcript,
                      )}
                      {transcription.status === "completed" &&
                        transcription.accuracy && (
                          <Badge
                            variant="secondary"
                            className="text-xs whitespace-nowrap"
                          >
                            {Math.round(transcription.accuracy)}%
                          </Badge>
                        )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyTranscript(transcription.transcript)
                        }
                        disabled={!transcription.transcript}
                        className="h-8 w-8 p-0"
                        title={
                          transcription.status === "completed"
                            ? "Copy transcript"
                            : "Transcript not ready"
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadTranscript(transcription)}
                        disabled={!transcription.transcript}
                        className="h-8 w-8 p-0"
                        title={
                          transcription.status === "completed"
                            ? "Download transcript"
                            : "Transcript not ready"
                        }
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  // Always render the container to ensure smooth animations
  // if (!isOpen) return null;

  return (
    <>
      {/* Mobile/Tablet Modal - Only render on smaller screens */}
      {!isDesktop && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-xs sm:max-w-md md:max-w-lg mx-auto h-[85vh] sm:h-[80vh] flex flex-col p-0 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-8 duration-500 ease-out">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-lg font-semibold">
                {t("history.title")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("history.empty.description")}
              </DialogDescription>
            </DialogHeader>
            {transcriptionContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Desktop Sidebar - Always render container for smooth animations */}
      {isDesktop && (
        <div
          className={`fixed inset-0 z-50 flex transition-all duration-500 ease-out ${
            isOpen
              ? "opacity-100 pointer-events-auto visible"
              : "opacity-0 pointer-events-none invisible"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-500 ease-out ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={onClose}
          />

          {/* Sidebar */}
          <div
            className={`relative ml-auto w-full max-w-lg xl:max-w-xl bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 transform transition-all duration-500 ease-out ${
              isOpen
                ? "translate-x-0 scale-100 opacity-100"
                : "translate-x-full scale-95 opacity-50"
            }`}
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("history.title")}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isFetching}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              {transcriptionContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
