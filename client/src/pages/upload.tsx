import Shell from "@/components/edor/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useUpload } from "@/hooks/use-upload";
import { useCreateContent, useContents } from "@/lib/api";
import { Music, Image, Film, Upload, CheckCircle2, X, Loader2, FileAudio, FileImage, FileVideo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FileSlot = {
  file: File | null;
  objectPath: string | null;
  uploading: boolean;
  progress: number;
  preview: string | null;
};

function FileDropZone({
  label,
  accept,
  icon: Icon,
  hint,
  slot,
  onSelect,
  onClear,
  testId,
}: {
  label: string;
  accept: string;
  icon: React.ElementType;
  hint: string;
  slot: FileSlot;
  onSelect: (file: File) => void;
  onClear: () => void;
  testId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onSelect(file);
  }, [onSelect]);

  if (slot.objectPath && slot.file) {
    return (
      <div className="relative rounded-2xl border border-green-500/30 bg-green-500/5 p-4" data-testid={`${testId}-done`}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{slot.file.name}</p>
            <p className="text-xs text-white/50">{(slot.file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/40 hover:text-white"
            onClick={onClear}
            data-testid={`${testId}-clear`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (slot.uploading) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 text-center" data-testid={`${testId}-uploading`}>
        <Loader2 className="h-6 w-6 text-amber-400 mx-auto animate-spin" />
        <p className="text-sm text-white/70 mt-2">Uploading…</p>
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-amber-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${slot.progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label className="text-xs text-white/60 mb-1.5 block">{label}</Label>
      <div
        className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          dragOver ? "border-amber-400/50 bg-amber-400/5" : "border-white/10 hover:border-white/20 bg-white/[0.02]"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        data-testid={testId}
      >
        <Icon className="h-8 w-8 text-white/25 mx-auto" />
        <p className="text-sm text-white/60 mt-2">
          Tap to browse or drag & drop
        </p>
        <p className="text-xs text-white/35 mt-1">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
        data-testid={`${testId}-input`}
      />
    </div>
  );
}

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [description, setDescription] = useState("");

  const emptySlot = (): FileSlot => ({ file: null, objectPath: null, uploading: false, progress: 0, preview: null });
  const [audioSlot, setAudioSlot] = useState<FileSlot>(emptySlot());
  const [artworkSlot, setArtworkSlot] = useState<FileSlot>(emptySlot());
  const [videoSlot, setVideoSlot] = useState<FileSlot>(emptySlot());

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const createContent = useCreateContent();

  const uploadFileToStorage = useCallback(async (
    file: File,
    setSlot: React.Dispatch<React.SetStateAction<FileSlot>>,
  ) => {
    setSlot({ file, objectPath: null, uploading: true, progress: 10, preview: null });

    try {
      const res = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await res.json();

      setSlot(s => ({ ...s, progress: 30 }));

      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      setSlot({ file, objectPath, uploading: false, progress: 100, preview });
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      setSlot(emptySlot());
      toast.error("Upload failed", { description: "Please try again" });
    }
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !creator.trim()) {
      toast.error("Title and artist are required");
      return;
    }
    if (!audioSlot.objectPath) {
      toast.error("Please upload an audio file");
      return;
    }

    setSubmitting(true);
    try {
      await createContent.mutateAsync({
        title: title.trim(),
        creator: creator.trim(),
        description: description.trim(),
        audioUrl: audioSlot.objectPath,
        artworkSeed: null,
        artworkUrl: artworkSlot.objectPath || null,
        videoUrl: videoSlot.objectPath || null,
      });
      setShowSuccess(true);
      setTimeout(() => {
        setTitle("");
        setCreator("");
        setDescription("");
        setAudioSlot(emptySlot());
        setArtworkSlot(emptySlot());
        setVideoSlot(emptySlot());
        setShowSuccess(false);
      }, 3000);
    } catch {
      toast.error("Failed to save content");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell
      title="Upload Content"
      right={
        <Link
          href="/"
          className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition"
          data-testid="link-back-home"
        >
          Home
        </Link>
      }
    >
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="overlay-upload-success"
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
              <h3 className="text-xl font-bold text-white mt-4">Content Added</h3>
              <p className="text-sm text-white/60 mt-2">Your content is now ready to be assigned to a location.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <Card className="glass rounded-3xl p-5" data-testid="card-upload-details">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Content Details</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="upload-title" className="text-xs text-white/60 mb-1.5 block">Title</Label>
              <Input
                id="upload-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Track or content title"
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                data-testid="input-upload-title"
              />
            </div>

            <div>
              <Label htmlFor="upload-creator" className="text-xs text-white/60 mb-1.5 block">Artist / Creator</Label>
              <Input
                id="upload-creator"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="Artist or creator name"
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                data-testid="input-upload-creator"
              />
            </div>

            <div>
              <Label htmlFor="upload-desc" className="text-xs text-white/60 mb-1.5 block">Description</Label>
              <Textarea
                id="upload-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell listeners about this content…"
                className="min-h-20 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                data-testid="input-upload-description"
              />
            </div>
          </div>
        </Card>

        <Card className="glass rounded-3xl p-5" data-testid="card-upload-files">
          <div className="flex items-center gap-2 mb-4">
            <Music className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Files</h3>
          </div>

          <div className="space-y-4">
            <FileDropZone
              label="Audio Track (required)"
              accept="audio/*,.mp3,.wav,.aac,.m4a,.ogg,.flac"
              icon={FileAudio}
              hint="MP3, WAV, AAC, FLAC — up to 50MB"
              slot={audioSlot}
              onSelect={(f) => uploadFileToStorage(f, setAudioSlot)}
              onClear={() => setAudioSlot(emptySlot())}
              testId="drop-audio"
            />

            <FileDropZone
              label="Cover Artwork (optional)"
              accept="image/*,.jpg,.jpeg,.png,.webp"
              icon={FileImage}
              hint="JPG, PNG, WebP — square recommended"
              slot={artworkSlot}
              onSelect={(f) => uploadFileToStorage(f, setArtworkSlot)}
              onClear={() => setArtworkSlot(emptySlot())}
              testId="drop-artwork"
            />

            {artworkSlot.preview && (
              <div className="flex justify-center">
                <img
                  src={artworkSlot.preview}
                  alt="Artwork preview"
                  className="h-32 w-32 rounded-2xl object-cover border border-white/10"
                  data-testid="img-artwork-preview"
                />
              </div>
            )}

            <FileDropZone
              label="Video (optional)"
              accept="video/*,.mp4,.mov,.webm"
              icon={FileVideo}
              hint="MP4, MOV, WebM — up to 100MB"
              slot={videoSlot}
              onSelect={(f) => uploadFileToStorage(f, setVideoSlot)}
              onClear={() => setVideoSlot(emptySlot())}
              testId="drop-video"
            />
          </div>
        </Card>

        <Button
          className="w-full h-14 rounded-2xl text-base font-bold animate-sparkle"
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !creator.trim() || !audioSlot.objectPath}
          data-testid="button-submit-content"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Publish Content
            </span>
          )}
        </Button>

        <p className="text-xs text-white/35 text-center pb-4" data-testid="text-upload-note">
          After publishing, assign your content to a location in the Admin panel.
        </p>
      </div>
    </Shell>
  );
}
