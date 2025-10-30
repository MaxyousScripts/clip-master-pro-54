import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Clock, Maximize2 } from "lucide-react";
import { toast } from "sonner";

interface ClipCardProps {
  clip: {
    id: string;
    title: string;
    clip_url: string;
    thumbnail_url?: string;
    duration?: number;
    aspect_ratio: string;
    caption?: string;
    status: string;
    created_at: string;
  };
}

export const ClipCard = ({ clip }: ClipCardProps) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(clip.clip_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clip.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Clip downloaded!");
    } catch (error) {
      toast.error("Failed to download clip");
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden bg-gradient-card border-border/50 hover:shadow-elevated transition-all group">
      <div className="relative aspect-video bg-muted overflow-hidden">
        {clip.thumbnail_url ? (
          <img
            src={clip.thumbnail_url}
            alt={clip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
            <span className="text-6xl">🎬</span>
          </div>
        )}
        
        {clip.status === "processing" && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2 mx-auto"></div>
              <p className="text-sm font-medium">Processing...</p>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            <Maximize2 className="w-3 h-3 mr-1" />
            {clip.aspect_ratio}
          </Badge>
          {clip.duration && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(clip.duration)}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground mb-1">{clip.title}</h3>
          {clip.caption && (
            <p className="text-sm text-muted-foreground line-clamp-2">{clip.caption}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {new Date(clip.created_at).toLocaleDateString()}
          </span>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={clip.status !== "completed"}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
