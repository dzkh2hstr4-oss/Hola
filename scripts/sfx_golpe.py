#!/usr/bin/env python3
"""Efectos de sonido sintetizados (sin derechos) para ElGolpeDelBalonDeOro."""
import numpy as np, wave
SR = 44100
def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.8
    with wave.open(f"public/golpe/{name}.wav", "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
def t(s): return np.arange(int(SR * s)) / SR
def lp(x, k):  # media móvil = filtro paso bajo barato
    return np.convolve(x, np.ones(k) / k, mode="same")
rng = np.random.default_rng(1)
# pop de bocadillo
a = t(0.09); save("pop", np.sin(2*np.pi*(700+9000*a)*a) * np.exp(-a*40))
# whoosh
a = t(0.7); n = rng.standard_normal(len(a)); env = np.sin(np.pi*a/0.7)**2
save("whoosh", lp(n, 6) * env)
# motor de coche
a = t(4); f = 55 + 8*np.sin(2*np.pi*0.5*a)
save("motor", (np.sign(np.sin(2*np.pi*np.cumsum(f)/SR)) * 0.6 + lp(rng.standard_normal(len(a)), 30)) * (0.7+0.3*np.sin(2*np.pi*25*a)) * np.minimum(1, a*3))
# helicóptero
a = t(6); n = lp(rng.standard_normal(len(a)), 40)
save("helicoptero", n * (0.5 + 0.5*np.sign(np.sin(2*np.pi*11*a))) * np.minimum(1, a/1.5))
# alarma
a = t(3); f = 750 + 350*np.sign(np.sin(2*np.pi*2*a))
save("alarma", np.sin(2*np.pi*np.cumsum(f)/SR) * 0.6)
# pasos corriendo
a = t(3); x = np.zeros(len(a))
for k in np.arange(0, 3, 0.18):
    i = int(k*SR); b = t(0.07); x[i:i+len(b)] += np.sin(2*np.pi*90*b) * np.exp(-b*60) + lp(rng.standard_normal(len(b)), 4) * np.exp(-b*80) * 0.4
save("pasos", x)
# jaula metálica
a = t(1.8); save("jaula", sum(np.sin(2*np.pi*f*a) * np.exp(-a*d) for f, d in [(220, 3), (563, 4), (931, 5), (1407, 7)]) + rng.standard_normal(len(a)) * np.exp(-a*40) * 0.5)
# aleteo de paloma
a = t(1.2); save("aleteo", lp(rng.standard_normal(len(a)), 10) * (0.5+0.5*np.sin(2*np.pi*14*a))**3 * np.sin(np.pi*a/1.2))
# redoble de tensión
a = t(2.5); x = np.zeros(len(a))
for k in np.arange(0, 2.5, 0.05):
    i = int(k*SR); b = t(0.04); x[i:i+len(b)] += lp(rng.standard_normal(len(b)), 3) * np.exp(-b*90) * (0.3 + k/2.5)
save("redoble", x)
# golpe de puerta / explosión grave
a = t(1.2); save("puerta", (np.sin(2*np.pi*60*a*np.exp(-a*2)) + lp(rng.standard_normal(len(a)), 8)*0.8) * np.exp(-a*4))
# "ding" de idea
a = t(1.5); save("ding", (np.sin(2*np.pi*1318*a) + 0.5*np.sin(2*np.pi*1975*a)) * np.exp(-a*3))
# risas de purpurina / brillo mágico ascendente
a = t(1); save("magia", sum(np.sin(2*np.pi*(1000+800*k)*a) * np.exp(-((a - k*0.12)%1)*12) for k in range(6)))
# mordisco
a = t(0.25); save("mordisco", lp(rng.standard_normal(len(a)), 2) * np.exp(-a*25) + np.sin(2*np.pi*150*a)*np.exp(-a*30))
print("ok")
