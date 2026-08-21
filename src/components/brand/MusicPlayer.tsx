import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { ImageUrl, cn } from "../../utils/Functions";

const PREF_KEY = "humandmx:music";

const readPreference = (): boolean => {
  try {
    return window.localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
};

const writePreference = (on: boolean) => {
  try {
    window.localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* private mode — the choice just won't survive a reload */
  }
};

const MusicPlayer = () => {
  const { pathname } = useLocation();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [enabled, setEnabled] = useState(readPreference);
  /** Playing *and* unmuted — i.e. actually making sound. */
  const [audible, setAudible] = useState(false);

  // The portal is a work tool; music belongs on the storefront only.
  const hidden = pathname.startsWith("/admin");

useEffect(() => {
  const audio = audioRef.current;

  if (!audio || !enabled || hidden) {
    audio?.pause();
    setAudible(false);
    return;
  }

  let cancelled = false;

  const cleanup = () => {
    window.removeEventListener("pointerdown", startOnInteraction);
    window.removeEventListener("click", startOnInteraction);
    window.removeEventListener("touchstart", startOnInteraction);
    window.removeEventListener("keydown", startOnInteraction);
  };

  const startOnInteraction = async () => {
    if (cancelled || !audioRef.current) return;

    const el = audioRef.current;

    try {
      el.muted = false;
      await el.play();

      if (!cancelled) {
        setAudible(true);
        cleanup();
      }
    } catch (error) {
      console.log("Audio could not start:", error);
    }
  };

  const tryAutoplay = async () => {
    try {
      // First attempt: autoplay with sound
      audio.muted = false;

      await audio.play();

      if (!cancelled) {
        setAudible(true);
        cleanup();
      }
    } catch {
      // Browser blocked autoplay with sound.
      // Wait for the user's FIRST interaction anywhere.
      console.log("Autoplay blocked. Waiting for user interaction.");

      window.addEventListener("pointerdown", startOnInteraction, {
        once: true,
        passive: true,
      });

      window.addEventListener("click", startOnInteraction, {
        once: true,
        passive: true,
      });

      window.addEventListener("touchstart", startOnInteraction, {
        once: true,
        passive: true,
      });

      window.addEventListener("keydown", startOnInteraction, {
        once: true,
        passive: true,
      });
    }
  };

  void tryAutoplay();

  return () => {
    cancelled = true;
    cleanup();
  };
}, [enabled, hidden]);

  // Pause in a background tab rather than playing to nobody.
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio || !enabled || hidden) return;

      if (document.hidden) audio.pause();
      else void audio.play().catch(() => { });
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, hidden]);

  const toggle = () => {
    const audio = audioRef.current;
    const next = !enabled;

    setEnabled(next);
    writePreference(next);

    if (!audio) return;

    if (next) {
      // A click is a gesture, so this is always allowed to make sound.
      audio.muted = false;
      void audio
        .play()
        .then(() => setAudible(true))
        .catch(() => setAudible(false));
    } else {
      audio.pause();
      setAudible(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload={enabled ? "auto" : "none"}
        src={ImageUrl("/audio/human-dmx-theme.m4a")}
        onPause={() => setAudible(false)}
      />

      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? "Turn the music off" : "Turn the music on"}
        title={
          !enabled
            ? "Turn the music on"
            : audible
              ? "Turn the music off"
              : "Music is queued — click for sound"
        }
        className={cn(
          "fixed bottom-5 left-5 z-[70] flex h-11 items-center gap-2.5 rounded-full border pl-3.5 pr-4 shadow-lg backdrop-blur transition",
          enabled
            ? "border-gold/40 bg-ink/90 text-gold hover:bg-ink"
            : "border-line bg-card/90 text-soft hover:text-body",
        )}
      >
        {/* Equaliser animates only while sound is actually coming out. */}
        <span aria-hidden className="flex h-4 items-end gap-[3px]">
          {[0, 1, 2].map((bar) => (
            <span
              key={bar}
              className={cn(
                "w-[3px] rounded-full",
                enabled ? "bg-gold" : "bg-soft",
              )}
              style={
                audible
                  ? {
                    // dmx-eq scales on Y, so anchor the bars to the baseline.
                    animation: `dmx-eq 900ms ease-in-out ${bar * 140}ms infinite alternate`,
                    transformOrigin: "bottom",
                    height: "100%",
                  }
                  : { height: bar === 1 ? "10px" : "6px" }
              }
            />
          ))}
        </span>

        <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
          {!enabled ? "Music Off" : audible ? "Music On" : "Click For Sound"}
        </span>
      </button>
    </>
  );
};

export default MusicPlayer;
