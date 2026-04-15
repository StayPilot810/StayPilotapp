#!/usr/bin/env python3
"""
Build MP4 tutorial: Lodgify -> Parametres -> API publique -> copie cle API -> collage StayPilot.
Uses macOS `say` + moviepy. One render per language (fr/en/es/de/it) like Beds24 workflow.
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
        "LODGIFY_TUTORIAL_ASSETS",
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
    "Capture_d_e_cran_2026-04-15_a__07.37.46-048e0409-83a3-45a6-8964-1d0f442c7b54.png",
    "Capture_d_e_cran_2026-04-15_a__07.38.26-894fbb24-0fc3-40da-a914-d3144110bbaf.png",
    "Capture_d_e_cran_2026-04-15_a__07.38.59-a4016231-2d64-4932-8624-9d9e264baed3.png",
    "Capture_d_e_cran_2026-04-15_a__07.50.15-69913f99-f4dd-41f9-be86-ffdc6e79e68f.png",
]

PUBLIC = Path(__file__).resolve().parents[1] / "public"

LANG_PACK: dict[str, dict] = {
    "fr": {
        "voice": "Thomas",
        "rate": 190,
        "placeholder": "(Cle API Lodgify collee ici - valeur masquee dans la demo)",
        "lines": [
            "Connectez-vous a Lodgify. Depuis le menu lateral, ouvrez Parametres en bas a gauche.",
            "Dans Parametres, cliquez sur API publique pour ouvrir la page de generation de cle API.",
            "Copiez la cle API avec le bouton copier. Conservez-la en securite.",
            "Dans StayPilot, collez la cle API Lodgify puis cliquez sur Connecter. Le numero de compte est optionnel.",
        ],
    },
    "en": {
        "voice": "Samantha",
        "rate": 175,
        "placeholder": "(Lodgify API key pasted here - value hidden in demo)",
        "lines": [
            "Sign in to Lodgify. In the left sidebar, open Settings at the bottom left.",
            "Inside Settings, click Public API to open the API key page.",
            "Copy the API key with the copy button and keep it secure.",
            "In StayPilot, paste the Lodgify API key and click Connect. Account number is optional.",
        ],
    },
    "es": {
        "voice": "Paulina",
        "rate": 175,
        "placeholder": "(Clave API de Lodgify pegada aqui - valor oculto en la demo)",
        "lines": [
            "Inicie sesion en Lodgify. En el menu lateral, abra Configuracion abajo a la izquierda.",
            "En Configuracion, haga clic en API publica para abrir la pagina de clave API.",
            "Copie la clave API con el boton copiar y guardela de forma segura.",
            "En StayPilot, pegue la clave API de Lodgify y pulse Conectar. El numero de cuenta es opcional.",
        ],
    },
    "de": {
        "voice": "Anna",
        "rate": 172,
        "placeholder": "(Lodgify API-Schlussel hier eingefugt - in der Demo ausgeblendet)",
        "lines": [
            "Melden Sie sich bei Lodgify an. Offnen Sie links unten im Menu die Einstellungen.",
            "Klicken Sie in den Einstellungen auf Public API, um die API-Schlussel-Seite zu offnen.",
            "Kopieren Sie den API-Schlussel mit dem Kopieren-Button und bewahren Sie ihn sicher auf.",
            "Fugen Sie in StayPilot den Lodgify API-Schlussel ein und klicken Sie auf Verbinden. Die Kontonummer ist optional.",
        ],
    },
    "it": {
        "voice": "Alice",
        "rate": 175,
        "placeholder": "(Chiave API Lodgify incollata qui - valore nascosto nella demo)",
        "lines": [
            "Accedete a Lodgify. Nel menu laterale, aprite Impostazioni in basso a sinistra.",
            "In Impostazioni, cliccate su API pubblica per aprire la pagina della chiave API.",
            "Copiate la chiave API con il pulsante copia e conservatela in modo sicuro.",
            "In StayPilot, incollate la chiave API Lodgify e cliccate Connetti. Il numero account e facoltativo.",
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


def redact_lodgify_api_key_screen(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    x0, y0 = int(w * 0.36), int(h * 0.33)
    x1, y1 = int(w * 0.80), int(h * 0.40)
    crop = im.crop((x0, y0, x1, y1))
    blurred = crop.filter(ImageFilter.GaussianBlur(radius=14))
    im.paste(blurred, (x0, y0))
    return im


def redact_staypilot_key_field(im: Image.Image, placeholder: str) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    x0, y0 = int(w * 0.20), int(h * 0.39)
    x1, y1 = int(w * 0.79), int(h * 0.47)
    overlay = Image.new("RGB", (x1 - x0, y1 - y0), (240, 242, 246))
    im.paste(overlay, (x0, y0))
    draw = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 19)
    except OSError:
        font = ImageFont.load_default()
    draw.text((x0 + 12, y0 + (y1 - y0) // 2 - 11), placeholder, fill=(80, 90, 110), font=font)
    return im


def apply_redactions(name: str, im: Image.Image, placeholder: str) -> Image.Image:
    if "07.38.59" in name:
        return redact_lodgify_api_key_screen(im)
    if "07.50.15" in name:
        return redact_staypilot_key_field(im, placeholder)
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
        return PUBLIC / "lodgify-staypilot-connection-tutorial.mp4"
    return PUBLIC / f"lodgify-staypilot-connection-tutorial.{lang}.mp4"


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

    tmp = Path(tempfile.mkdtemp(prefix=f"lodgify_tut_{lang}_"))
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
    parser = argparse.ArgumentParser(description="Build Lodgify tutorial MP4 with voice-over.")
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
        fr_main = PUBLIC / "lodgify-staypilot-connection-tutorial.mp4"
        fr_copy = PUBLIC / "lodgify-staypilot-connection-tutorial.fr.mp4"
        if fr_main.is_file():
            shutil.copy2(fr_main, fr_copy)
            print("Also:", fr_copy, "(copy of French default)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
