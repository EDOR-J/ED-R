import { useEffect, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { usePulseData, useUnlock, pickContentForLocationMode, type ApiContent, type PulseMode } from "@/lib/api";
import { loadSession } from "@/lib/edorSession";
import { navigateWithTransition } from "@/hooks/use-view-transition";
import { Nfc, Music, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

type Phase = "scanning" | "found" | "no-drop" | "error";

interface NfcLocation {
  id: string;
  name: string;
  description: string;
  nfcEnabled: boolean;
}

export default function NfcPage() {
  const params = useParams<{ nfcId: string }>();
  const nfcId = params.nfcId;
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>("scanning");
  const [loc, setLoc] = useState<NfcLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [content, setContent] = useState<ApiContent | null>(null);

  const { data: pulseData } = usePulseData();
  const unlockMutation = useUnlock();
  const session = loadSession();

  const doUnlock = useCallback(async (location: NfcLocation, pickedContent: ApiContent, assignmentMode: string) => {
    try {
      await unlockMutation.mutateAsync({
        nodeId: location.id,
        contentId: pickedContent.id,
        mode: assignmentMode,
      });
    } catch {
      // still continue even if unlock fails
    }
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setTimeout(() => {
      navigateWithTransition(
        setLocation,
        `/content/${pickedContent.id}?loc=${location.id}&mode=${assignmentMode}&nfc=1`,
      );
    }, 2200);
  }, [setLocation]);

  useEffect(() => {
    if (!nfcId || !pulseData) return;

    async function resolve() {
      try {
        const res = await apiRequest("GET", `/api/nfc/${nfcId}`);
        if (!res.ok) {
          setErrorMsg("This NFC tag isn't linked to a Pulse node.");
          setPhase("error");
          return;
        }
        const location: NfcLocation = await res.json();
        setLoc(location);

        // NFC bypasses mode — try discover first, then park
        const picked =
          pickContentForLocationMode(pulseData!, { locationId: location.id, mode: "discover" }) ??
          pickContentForLocationMode(pulseData!, { locationId: location.id, mode: "park" });

        if (!picked) {
          setPhase("no-drop");
          return;
        }

        setContent(picked.content);
        setPhase("found");
        doUnlock(location, picked.content, picked.assignment.mode);
      } catch {
        setErrorMsg("Couldn't reach the server. Check your connection.");
        setPhase("error");
      }
    }

    resolve();
  }, [nfcId, pulseData, session.mode, doUnlock]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-400 blur-[120px]"
        />
      </div>

      <div className="relative z-10 text-center px-8 max-w-sm w-full">
        <AnimatePresence mode="wait">

          {/* Scanning */}
          {phase === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-amber-400/30"
                    animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                  />
                ))}
                <div className="w-20 h-20 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                  <Nfc className="h-9 w-9 text-amber-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-white">NFC Tag Detected</p>
                <p className="text-sm text-white/50 mt-1">Verifying your Pulse…</p>
              </div>
            </motion.div>
          )}

          {/* Found — unlocking */}
          {phase === "found" && loc && content && (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-amber-400 flex items-center justify-center shadow-2xl shadow-amber-400/40"
              >
                <Music className="h-10 w-10 text-black" />
              </motion.div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">NFC Node Unlocked</p>
                <p className="text-2xl font-bold text-white">{loc.name}</p>
                <p className="text-base text-white/60 mt-1">{content.title}</p>
                <p className="text-sm text-white/40">{content.creator}</p>
              </div>
              <p className="text-xs text-white/30">Taking you to your track…</p>
            </motion.div>
          )}

          {/* No active drop */}
          {phase === "no-drop" && loc && (
            <motion.div
              key="no-drop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Nfc className="h-9 w-9 text-white/30" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{loc.name}</p>
                <p className="text-sm text-white/50 mt-2">
                  No active drop at this node right now.<br />Check back soon.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white rounded-2xl"
                onClick={() => navigateWithTransition(setLocation, "/")}
              >
                Back to Home
              </Button>
            </motion.div>
          )}

          {/* Error */}
          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-9 w-9 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Tag Not Found</p>
                <p className="text-sm text-white/50 mt-2">{errorMsg}</p>
              </div>
              <Button
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white rounded-2xl"
                onClick={() => navigateWithTransition(setLocation, "/")}
              >
                Back to Home
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
