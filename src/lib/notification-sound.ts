// Âm báo thông báo mới bằng Web Audio (không cần file mp3). Trình duyệt chặn âm thanh trước khi user
// tương tác, nên context được mở khoá ở click/phím đầu; trước đó chỉ hiện toast.
const MUTE_KEY = "ikiot:notification-sound-muted";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

if (typeof window !== "undefined") {
  const unlock = () => {
    void getContext()?.resume();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

export function isNotificationSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setNotificationSoundMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // storage bị chặn: bỏ qua, mặc định là bật tiếng
  }
}

/** Hai nốt "ding-dong" ngắn. Không bao giờ throw. */
export function playNotificationSound() {
  if (isNotificationSoundMuted()) return;
  try {
    const audio = getContext();
    if (!audio || audio.state !== "running") return;

    const now = audio.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const start = now + i * 0.16;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  } catch {
    // âm thanh chỉ là phụ trợ, không được làm hỏng luồng thông báo
  }
}
