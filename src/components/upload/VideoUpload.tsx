import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Video, X, Link as LinkIcon, Youtube, Twitch } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface VideoUploadProps {
  onUploadComplete: (videoUrl: string, videoFile?: File, isUrl?: boolean) => void;
}

export const VideoUpload = ({ onUploadComplete }: VideoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error("File size must be less than 500MB");
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile);

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      toast.success("Video uploaded successfully!");
      onUploadComplete(publicUrl, selectedFile, false);
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleUrlSubmit = async () => {
    if (!videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    // Check if it's from a supported platform
    const supportedPlatforms = [
      'youtube.com', 'youtu.be', 
      'twitch.tv', 
      'kick.com',
      'vimeo.com',
      'dailymotion.com',
      'facebook.com',
      'instagram.com',
      'tiktok.com'
    ];
    
    const urlLower = videoUrl.toLowerCase();
    const isSupported = supportedPlatforms.some(platform => urlLower.includes(platform));
    
    if (!isSupported) {
      toast.error("Unsupported platform. Please use YouTube, Twitch, Kick, Vimeo, or other major platforms.");
      return;
    }

    setUploading(true);
    toast.success("Video URL added! Processing will begin shortly.");
    onUploadComplete(videoUrl, undefined, true);
    setVideoUrl("");
    setUploading(false);
  };

  return (
    <Card className="p-8 bg-gradient-card border-border/50 shadow-card">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "file" | "url")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Paste URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-0">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-primary bg-primary/5 shadow-glow"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
              <Upload className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {isDragActive ? "Drop your video here" : "Drag & drop your video"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse • MP4, MOV, AVI, MKV • Max 500MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {uploading ? "Uploading..." : "Upload & Process Video"}
          </Button>
        </div>
      )}
        </TabsContent>

        <TabsContent value="url" className="mt-0">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Twitch className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Video className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground mb-2">
                    Paste a video link
                  </p>
                  <p className="text-sm text-muted-foreground">
                    YouTube, Twitch, Kick, Vimeo, and more
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <Input
                  id="video-url"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://twitch.tv/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-background/50"
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Processing... {Math.round(progress)}%
                  </p>
                </div>
              )}

              <Button
                onClick={handleUrlSubmit}
                disabled={uploading || !videoUrl.trim()}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {uploading ? "Processing..." : "Process Video URL"}
              </Button>

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Supported platforms:</p>
                <p>YouTube • Twitch • Kick • Vimeo • Facebook • Instagram • TikTok</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
