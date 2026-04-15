#!/usr/bin/env python3
"""
Build tutorial video: "Statistiques encaissement + taux d'occupation".
Adds realistic demo values over provided screenshots + voice-over.
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
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips


ASSETS = Path(
    os.environ.get(
        "STATS_TUTORIAL_ASSETS",
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
    "Capture_d_e_cran_2026-04-15_a__09.36.03-824edd3f-c629-4176-9df2-c055156f695f.png",
    "Capture_d_e_cran_2026-04-15_a__09.36.28-0f24e31a-fa19-4e96-9ed2-29db20934b56.png",
    "Capture_d_e_cran_2026-04-15_a__09.36.40-22b4d268-0b21-497c-a4e1-5f655a8db50f.png",
    "Capture_d_e_cran_2026-04-15_a__09.36.49-a4259e80-afdd-40f1-967f-5bcf7ddd02f0.png",
]

PUBLIC = Path(__file__).resolve().parents[1] / "public"

LANG_PACK = {
    "fr": {
        "voice": "Thomas",
        "rate": 188,
        "lines": [
            "Dans cet onglet, vous suivez instantanement vos encaissements et votre taux d occupation.",
            "Vous voyez les logements connectes, les reservations detectees et les tendances de revenu sur la periode choisie.",
            "Le graphique d occupation permet d identifier rapidement les semaines faibles a optimiser et les pics a valoriser.",
            "Enfin, la repartition reservations annulations vous aide a piloter le risque et a prendre de meilleures decisions tarifaires.",
        ],
    },
    "en": {
        "voice": "Samantha",
        "rate": 175,
        "lines": [
            "In this tab, you instantly track net revenue and occupancy rate.",
            "You can review connected listings, detected bookings, and revenue trends for your selected period.",
            "The occupancy chart helps you spot weak weeks to optimize and strong periods to monetize better.",
            "Finally, booking versus cancellation split helps you control risk and make better pricing decisions.",
        ],
    },
    "es": {
        "voice": "Paulina",
        "rate": 175,
        "lines": [
            "En esta pestana, sigues al instante tus cobros netos y la tasa de ocupacion.",
            "Puedes ver alojamientos conectados, reservas detectadas y tendencias de ingresos en el periodo elegido.",
            "El grafico de ocupacion te ayuda a identificar semanas debiles para optimizar y picos para rentabilizar.",
            "Por ultimo, la distribucion reservas cancelaciones te ayuda a controlar riesgo y decidir mejor tus precios.",
        ],
    },
    "de": {
        "voice": "Anna",
        "rate": 172,
        "lines": [
            "In diesem Bereich verfolgen Sie sofort Nettoeinnahmen und Auslastungsquote.",
            "Sie sehen verbundene Unterkunfte, erkannte Buchungen und Umsatztrends fur den gewahlten Zeitraum.",
            "Das Auslastungsdiagramm zeigt schnell schwache Wochen zur Optimierung und starke Zeitraume mit Potenzial.",
            "Die Verteilung Buchungen gegen Stornierungen hilft beim Risikomanagement und bei besseren Preisentscheidungen.",
        ],
    },
    "it": {
        "voice": "Alice",
        "rate": 175,
        "lines": [
            "In questa sezione monitori subito incassi netti e tasso di occupazione.",
            "Puoi vedere alloggi connessi, prenotazioni rilevate e trend dei ricavi nel periodo selezionato.",
            "Il grafico di occupazione ti aiuta a individuare settimane deboli da ottimizzare e picchi da valorizzare.",
            "Infine, la ripartizione prenotazioni annullamenti aiuta a controllare il rischio e migliorare le decisioni sui prezzi.",
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


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for p in [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()


def draw_badge(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, fill=(46, 108, 255)) -> None:
    f = _font(26)
    w = int(draw.textlength(text, font=f)) + 30
    h = 46
    draw.rounded_rectangle((x, y, x + w, y + h), radius=18, fill=fill)
    draw.text((x + 15, y + 10), text, fill=(255, 255, 255), font=f)


def overlay_fake_data(im: Image.Image, idx: int, plain_mode: bool = False) -> Image.Image:
    if plain_mode:
        return im.convert("RGB")
    out = im.convert("RGB")
    d = ImageDraw.Draw(out)
    title = _font(34)
    txt = _font(28)
    subtle = _font(24)

    if idx == 0:
        d.rounded_rectangle((260, 235, 740, 325), radius=18, fill=(255, 255, 255))
        d.text((290, 258), "Encaissement net: 18 460 EUR", fill=(27, 34, 49), font=txt)
        d.rounded_rectangle((770, 235, 1215, 325), radius=18, fill=(255, 255, 255))
        d.text((800, 258), "Taux d occupation: 82.4%", fill=(27, 34, 49), font=txt)
        draw_badge(d, 260, 340, "7 logements connectes")
        draw_badge(d, 560, 340, "56 reservations")
        draw_badge(d, 820, 340, "5 annulations", fill=(245, 114, 114))
    elif idx == 1:
        d.rounded_rectangle((250, 612, 1630, 700), radius=16, fill=(255, 255, 255))
        d.text((278, 635), "Revenue mensuel (Airbnb + Booking): Jan 9.2k  Fev 11.1k  Mar 12.8k  Avr 14.4k", fill=(18, 32, 56), font=txt)
        d.rounded_rectangle((250, 706, 1630, 782), radius=16, fill=(232, 242, 255))
        d.text((278, 728), "Progression moyenne: +12.6% sur 4 mois", fill=(33, 86, 214), font=subtle)
    elif idx == 2:
        d.rounded_rectangle((250, 640, 1630, 716), radius=16, fill=(240, 255, 247))
        d.text((278, 662), "Occupation par mois: Jan 69%  Fev 74%  Mar 79%  Avr 84%", fill=(18, 95, 67), font=subtle)
        d.rounded_rectangle((250, 720, 1630, 796), radius=16, fill=(255, 248, 232))
        d.text((278, 742), "Alertes disponibilite: 2 semaines sous 60% a optimiser", fill=(145, 84, 0), font=subtle)
    else:
        d.rounded_rectangle((250, 640, 1630, 716), radius=16, fill=(255, 255, 255))
        d.text((278, 662), "Taux de reservation 91%  |  Taux d annulation 9%  |  56 reservations", fill=(27, 34, 49), font=subtle)
        d.rounded_rectangle((250, 724, 1630, 796), radius=16, fill=(232, 242, 255))
        d.text((278, 746), "Lecture business: demande solide, annulations sous controle", fill=(33, 86, 214), font=subtle)

    d.text((260, 170), "Demo realiste - donnees fictives", fill=(255, 255, 255), font=title)
    return out


def load_prepared(idx: int, plain_mode: bool = False) -> Image.Image:
    path = ASSETS / FRAMES[idx]
    if not path.exists():
        raise FileNotFoundError(path)
    im = Image.open(path)
    im = letterbox_rgb(im)
    return overlay_fake_data(im, idx, plain_mode=plain_mode)


def say_to_aiff(text: str, out_path: Path, voice: str, rate: int) -> Path:
    aiff_path = out_path.with_suffix(".aiff")
    cmd = ["say", "-v", voice, "-r", str(rate), "-o", str(aiff_path), text]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return aiff_path


def clip_static(idx: int, audio_path: Path, plain_mode: bool = False) -> ImageClip:
    img = load_prepared(idx, plain_mode=plain_mode)
    arr = np.array(img)
    au = AudioFileClip(str(audio_path.with_suffix(".aiff")))
    dur = float(au.duration) + 0.35
    return ImageClip(arr).set_duration(dur).set_audio(au)


def output_video_path(lang: str) -> Path:
    if lang == "fr":
        return PUBLIC / "stats-occupancy-tutorial.mp4"
    return PUBLIC / f"stats-occupancy-tutorial.{lang}.mp4"


def build_one(lang: str, plain_mode: bool = False) -> Path:
    pack = LANG_PACK[lang]
    narr = pack["lines"]
    voice = os.environ.get("SAY_VOICE") or pack["voice"]
    rate = int(os.environ.get("SAY_RATE", pack.get("rate", 188)))
    out_path = output_video_path(lang)

    tmp = Path(tempfile.mkdtemp(prefix=f"stats_occ_{lang}_"))
    clips: list[ImageClip] = []
    try:
        for i in range(len(FRAMES)):
            ap = tmp / f"seg{i}"
            say_to_aiff(narr[i], ap, voice, rate)
            clips.append(clip_static(i, ap, plain_mode=plain_mode))
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
    parser = argparse.ArgumentParser(description="Build stats occupancy tutorial video with realistic fake data.")
    parser.add_argument("--lang", default="fr", choices=["fr", "en", "es", "de", "it", "all"])
    parser.add_argument("--plain", action="store_true", help="Generate initial clean version without fake overlays.")
    args = parser.parse_args()
    langs = list(LANG_PACK) if args.lang == "all" else [args.lang]
    for lang in langs:
        try:
            out = build_one(lang, plain_mode=args.plain)
            print("Wrote:", out)
        except subprocess.CalledProcessError:
            print(f"macOS 'say' failed for {lang}.", file=sys.stderr)
            return 1
        except Exception as exc:
            print(f"Error building {lang}: {exc}", file=sys.stderr)
            return 1

    if args.lang == "all":
        fr_main = PUBLIC / "stats-occupancy-tutorial.mp4"
        fr_copy = PUBLIC / "stats-occupancy-tutorial.fr.mp4"
        if fr_main.is_file():
            shutil.copy2(fr_main, fr_copy)
            print("Also:", fr_copy, "(copy of French default)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
