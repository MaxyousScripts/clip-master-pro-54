-- Create storage buckets for videos and clips
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('videos', 'videos', false),
  ('clips', 'clips', true);

-- Create clips table to store generated clip metadata
CREATE TABLE public.clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_video_url TEXT NOT NULL,
  clip_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT NOT NULL,
  duration INTEGER,
  aspect_ratio TEXT DEFAULT '16:9',
  caption TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own clips" 
ON public.clips 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clips" 
ON public.clips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clips" 
ON public.clips 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clips" 
ON public.clips 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clips_updated_at
BEFORE UPDATE ON public.clips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for videos bucket
CREATE POLICY "Users can upload their own videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for clips bucket (public read)
CREATE POLICY "Anyone can view clips" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'clips');

CREATE POLICY "Users can upload their own clips" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clips" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);