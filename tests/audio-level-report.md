# Dance voice output check

Measured with the browser's OfflineAudioContext, 44.1 kHz stereo, master volume
100%, velocity 0.88. Single-note reference: F3. Rapid sequence: F3, F3, C4,
C4, D4, D4 at 240 ms intervals. RMS uses samples above 0.001 amplitude;
these values compare digital output, not speaker loudness.

| Voice | Reference active RMS (dBFS) | Rapid peak (dBFS) |
| --- | ---: | ---: |
| Recorded cello, 18% reverb | -24.14 | -6.64 |
| Airy Pad | -24.21 | -8.35 |
| Melodic percussion | -24.56 | -4.44 |
| Dog bark sampler | -23.79 | -8.54 |
| Physical cello fallback | -24.43 | -6.69 |

The four selectable voices differ by 0.77 dB in the reference test. All tested
rapid peaks retain at least 4.44 dB of digital headroom. Volume 0 rendered
exactly zero output for the sampler and native oscillator routes.

Reproduce at `/tests/audio-check.html`. The test does not play audible output.
The original hand sensitivity remains in the advanced settings; the visible
slider controls the shared output gain only.
