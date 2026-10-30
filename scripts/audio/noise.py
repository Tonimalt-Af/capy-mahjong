# Noise-floor check: RMS of the quietest 100 ms windows, and how much >4 kHz energy is always present.
# usage: python3 scripts/audio/noise.py file.wav [...]   (skips the first 2 s fade-in)
import sys, wave, numpy as np
db = lambda x: 20 * np.log10(max(x, 1e-10))
for f in sys.argv[1:]:
    w = wave.open(f); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).mean(1) / 32768
    x = x[2 * 44100:]; X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / 44100); X[fr < 4000] = 0; hf = np.fft.irfft(X, len(x))
    n = 4410; k = len(x) // n
    r = np.sqrt((x[:k * n].reshape(k, n) ** 2).mean(1)); h = np.sqrt((hf[:k * n].reshape(k, n) ** 2).mean(1))
    print(f"{f.split('/')[-1]}: quietest100ms {db(r.min()):.1f} | p10 {db(np.percentile(r, 10)):.1f} dBFS || >4k: total {db(np.sqrt((hf ** 2).mean())):.1f} | p10 {db(np.percentile(h, 10)):.1f} | median {db(np.median(h)):.1f} dBFS")
