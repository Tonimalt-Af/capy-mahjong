# Energy share per frequency band of WAV files (to check sub-bass / harshness balance).
import sys, wave, numpy as np
B = {'<100': (0, 100), '100-300': (100, 300), '300-1k': (300, 1000), '1-3k': (1000, 3000), '3-8k': (3000, 8000), '>8k': (8000, 30000)}
for f in sys.argv[1:]:
    w = wave.open(f); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).mean(1) / 32768
    X = np.abs(np.fft.rfft(x)) ** 2; fr = np.fft.rfftfreq(len(x), 1 / 44100); T = X.sum()
    print(f.split('/')[-1], ' '.join(f"{k}:{100 * X[(fr >= lo) & (fr < hi)].sum() / T:.1f}%" for k, (lo, hi) in B.items()))
