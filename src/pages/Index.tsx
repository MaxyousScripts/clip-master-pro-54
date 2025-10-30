import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { VideoUpload } from "@/components/upload/VideoUpload";
import { ClipsList } from "@/components/clips/ClipsList";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Sparkles, Video } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const handleUploadComplete = async (videoUrl: string, videoFile?: File, isUrl?: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extract title from URL or file name
      let title = "Untitled Video";
      if (videoFile) {
        title = videoFile.name.replace(/\.[^/.]+$/, "");
      } else if (isUrl) {
        // Try to extract a readable title from URL
        try {
          const url = new URL(videoUrl);
          const pathname = url.pathname;
          const lastSegment = pathname.split('/').filter(Boolean).pop() || "";
          title = lastSegment || url.hostname;
        } catch {
          title = "Video from URL";
        }
      }

      // Create a placeholder clip entry
      const { error } = await supabase.from('clips').insert({
        user_id: user.id,
        original_video_url: videoUrl,
        clip_url: videoUrl, // For now, using the same URL
        title: title,
        status: 'processing',
        caption: isUrl ? `Imported from ${new URL(videoUrl).hostname}` : undefined,
      });

      if (error) throw error;

      toast.success(isUrl ? "Video URL added! Processing will begin shortly." : "Video uploaded! Processing will begin shortly.");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/50 bg-background/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <Video className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">ClipMaster</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Video Highlights</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-border/50 hover:bg-muted/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        <section className="space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">No Watermarks • AI-Powered</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Transform Your Videos Into
              <span className="block text-transparent bg-clip-text bg-gradient-primary">
                Viral Highlights
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your video and let AI automatically detect the best moments, add captions, 
              and generate stunning clips ready to download
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto">
          <VideoUpload onUploadComplete={handleUploadComplete} />
        </section>

        <Separator className="my-12" />

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Your Clips</h3>
              <p className="text-muted-foreground">All your generated highlights in one place</p>
            </div>
          </div>
          <ClipsList />
        </section>
      </main>

      <footer className="border-t border-border/50 bg-background/30 backdrop-blur-xl mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 ClipMaster. Generate watermark-free video highlights with AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
