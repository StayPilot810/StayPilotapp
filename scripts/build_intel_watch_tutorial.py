#!/usr/bin/env python3
"""
Build MP4 tutorial: market watch / local intelligence feature around a property address.
Voice-over available in fr/en/es/de/it (same workflow as other tutorials).
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

ASSETS = Path(
    os.environ.get(
        "INTEL_TUTORIAL_ASSETS",
        str(
            Path.home()
            / ".cursor"
            / "projects"
            / "Users-thibaulttommasini-SAAS-AIRBNB-BOOKING"
            / "assets"
        ),
    )
)

FRAMES = [
    "Capture_d_e_cran_2026-04-15_a__08.21.52-e8d3545e-055a-4d63-80e0-8be12d73dcb0.png",
    "Capture_d_e_cran_2026-04-15_a__08.22.08-06d9f281-87a0-4c95-a87d-5d2627156caf.png",
    "Capture_d_e_cran_2026-04-15_a__08.22.36-6cfe09c6-b2d1-403f-8aba-3ec43226c74f.png",
    "Capture_d_e_cran_2026-04-15_a__08.22.57-17c4b084-e8a7-4c9f-9c2c-aa4f7ef1b1da.png",
]

PUBLIC = Path(__file__).resolve().parents[1] / "public"

LANG_PACK: dict[str, dict] = {
    "fr": {
        "voice": "Thomas",
        "rate": 190,
        "placeholder": "(Adresse analysee automatiquement autour de votre logement)",
        "lines": [
            "Vos logements connectes remontent automatiquement dans cette page de veille informationnelle.",
            "StayPilot analyse ensuite les informations utiles autour de l adresse: evenements, affluence et signaux de demande locale.",
            "Sur la carte en haut, vous pouvez entrer une adresse exacte pour lancer une recherche immediate.",
            "Important: une adresse precise est bien meilleure qu une simple ville, trop vague pour une analyse fiable.",
        ],
    },
    "en": {
        "voice": "Samantha",
        "rate": 175,
        "placeholder": "(Property area analyzed automatically from your address)",
        "lines": [
            "Your connected listings are pulled into this market-watch page automatically.",
            "StayPilot then gathers useful nearby intelligence: events, traffic, and local demand signals around the property.",
            "Use the top map search to enter an address and run the analysis immediately.",
            "A precise address is strongly recommended: using only a city is too broad and less accurate.",
        ],
    },
    "es": {
        "voice": "Paulina",
        "rate": 175,
        "placeholder": "(Zona del alojamiento analizada automaticamente desde su direccion)",
        "lines": [
            "Tus alojamientos conectados aparecen automaticamente en esta pagina de vigilancia informativa.",
            "StayPilot analiza despues la informacion util alrededor de la direccion: eventos, afluencia y senales de demanda local.",
            "En el mapa superior, puedes introducir una direccion para iniciar la busqueda de inmediato.",
            "Una direccion precisa es mucho mejor que una ciudad general, que resulta demasiado vaga para un analisis fiable.",
        ],
    },
    "de": {
        "voice": "Anna",
        "rate": 172,
        "placeholder": "(Umgebung der Unterkunft wird automatisch uber die Adresse analysiert)",
        "lines": [
            "Ihre verbundenen Unterkunfte werden automatisch in diese Informationsseite ubernommen.",
            "StayPilot analysiert dann relevante Daten rund um die Adresse: Ereignisse, Auslastung und lokale Nachfragesignale.",
            "Oben auf der Karte konnen Sie direkt eine Adresse eingeben und die Analyse sofort starten.",
            "Eine genaue Adresse ist deutlich besser als nur eine Stadt, weil diese fur belastbare Ergebnisse zu ungenau ist.",
        ],
    },
    "it": {
        "voice": "Alice",
        "rate": 175,
        "placeholder": "(Area dell alloggio analizzata automaticamente dall indirizzo)",
        "lines": [
            "I tuoi alloggi connessi vengono caricati automaticamente in questa pagina di monitoraggio informativo.",
            "StayPilot analizza poi le informazioni utili intorno all indirizzo: eventi, affluenza e segnali di domanda locale.",
            "Nella mappa in alto puoi inserire direttamente un indirizzo e avviare subito la ricerca.",
            "Un indirizzo preciso e molto meglio di una sola citta, troppo generica per una analisi affidabile.",
        ],
    },
}


def letterbox_rgb(im: Image.Image, tw: int = 1920, th: int = 1080) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    scale = min(tw / w, th / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (tw, th), (18, 24, 38))
    ox, oy = (tw - nw) // 2, (th - nh) // 2
    canvas.paste(resized, (ox, oy))
    return canvas


def redact_intel_search_field(im: Image.Image, placeholder: str) -> Image.Image:
    """Redact search/input area when needed."""
    im = im.convert("RGB")
    w, h = im.size
    x0, y0 = int(w * 0.17), int(h * 0.40)
    x1, y1 = int(w * 0.78), int(h * 0.46)
    overlay = Image.new("RGB", (x1 - x0, y1 - y0), (240, 242, 246))
    im.paste(overlay, (x0, y0))
    draw = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    draw.text((x0 + 10, y0 + (y1 - y0) // 2 - 10), placeholder, fill=(80, 90, 110), font=font)
    return im


def apply_redactions(name: str, im: Image.Image, placeholder: str) -> Image.Image:
    # On the final frame, a previous API key may be visible in a field; blur it.
    if "08.22.57" in name:
        im = im.convert("RGB")
        w, h = im.size
        x0, y0 = int(w * 0.20), int(h * 0.42)
        x1, y1 = int(w * 0.79), int(h * 0.49)
        crop = im.crop((x0, y0, x1, y1))
        blurred = crop.filter(ImageFilter.GaussianBlur(radius=12))
        im.paste(blurred, (x0, y0))
        return im
    # Optional soft anonymization on typed query capture
    if "08.22.36" in name:
        return redact_intel_search_field(im, placeholder)
    return im.convert("RGB")


def load_prepared(idx: int, placeholder: str) -> Image.Image:
    path = ASSETS / FRAMES[idx]
    if not path.exists():
        raise FileNotFoundError(path)
    im = Image.open(path)
    im = apply_redactions(path.name, im, placeholder)
    return letterbox_rgb(im)


def say_to_aiff(text: str, out_path: Path, voice: str, rate: int) -> Path:
    aiff_path = out_path.with_suffix(".aiff")
    cmd = ["say", "-v", voice, "-r", str(rate), "-o", str(aiff_path), text]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return aiff_path


def clip_static(idx: int, audio_path: Path, placeholder: str) -> ImageClip:
    img = load_prepared(idx, placeholder)
    arr = np.array(img)
    au = AudioFileClip(str(audio_path.with_suffix(".aiff")))
    dur = float(au.duration) + 0.35
    return ImageClip(arr).set_duration(dur).set_audio(au)


def output_video_path(lang: str) -> Path:
    if lang == "fr":
        return PUBLIC / "intel-watch-tutorial.mp4"
    return PUBLIC / f"intel-watch-tutorial.{lang}.mp4"


def build_one(lang: str) -> Path:
    pack = LANG_PACK[lang]
    narr = pack["lines"]
    if len(narr) != len(FRAMES):
        raise ValueError(f"lines length for {lang} must match FRAMES")
    voice = os.environ.get("SAY_VOICE") or pack["voice"]
    rate = int(os.environ.get("SAY_RATE", pack.get("rate", 190)))
    placeholder = pack["placeholder"]
    out_path = output_video_path(lang)

    for f in FRAMES:
        if not (ASSETS / f).exists():
            raise FileNotFoundError(str(ASSETS / f))

    tmp = Path(tempfile.mkdtemp(prefix=f"intel_watch_{lang}_"))
    clips = []
    try:
        for i in range(len(FRAMES)):
            ap = tmp / f"seg{i}"
            say_to_aiff(narr[i], ap, voice, rate)
            clips.append(clip_static(i, ap, placeholder))
        final = concatenate_videoclips(clips, method="compose")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        final.write_videofile(
            str(out_path),
            fps=24,
            codec="libx264",
            audio_codec="aac",
            preset="medium",
            threads=4,
            bitrate="3200k",
        )
        final.close()
    finally:
        for c in clips:
            try:
                c.close()
            except Exception:
                pass
        for p in tmp.glob("*"):
            try:
                p.unlink()
            except OSError:
                pass
        try:
            tmp.rmdir()
        except OSError:
            pass
    return out_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Build local intelligence tutorial MP4 with voice-over.")
    parser.add_argument("--lang", default="fr", choices=["fr", "en", "es", "de", "it", "all"])
    args = parser.parse_args()
    langs = list(LANG_PACK) if args.lang == "all" else [args.lang]
    for lang in langs:
        try:
            out = build_one(lang)
            print("Wrote:", out)
        except subprocess.CalledProcessError:
            print(f"macOS 'say' failed for {lang}. Set SAY_VOICE=... and retry.", file=sys.stderr)
            return 1
        except Exception as exc:
            print(f"Error building {lang}: {exc}", file=sys.stderr)
            return 1

    if args.lang == "all":
        fr_main = PUBLIC / "intel-watch-tutorial.mp4"
        fr_copy = PUBLIC / "intel-watch-tutorial.fr.mp4"
        if fr_main.is_file():
            shutil.copy2(fr_main, fr_copy)
            print("Also:", fr_copy, "(copy of French default)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
