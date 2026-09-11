# Áudio original — Mesmo Mapa

`shared-path-ambient.wav` e `player-two-chime.wav` foram sintetizados para este projeto com ondas senoidais. Não utilizam gravações, samples ou músicas comerciais.

Ambiente: acorde C3/E3/G3, 12 segundos com entrada e saída suaves.
Sinal Player 2: C5/E5/G5, 1,4 segundo, ataques espaçados e decaimento exponencial.
Formato: WAV mono PCM de 16 bits, 22.050 Hz.

`concert-groove.wav`: base instrumental original de 16 pulsos a 96 BPM (10 segundos),
com percussão sintetizada, baixo senoidal e acordes curtos. Não reproduz músicas de
Grupo Revelação ou Sorriso Maroto. O minigame usa o mesmo pulso de 625 ms.
Gerador reproduzível: `python3 scripts/generate-concert-audio.py`.
