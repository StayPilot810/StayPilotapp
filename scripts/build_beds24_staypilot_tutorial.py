#!/usr/bin/env python3
"""
Build MP4 tutorial: Beds24 → API token → StayPilot + Account (Owner id) → listings count.
Uses macOS `say` + moviepy + embedded imageio-ffmpeg. Video is the same; only voice-over changes per --lang.

Usage:
  python3 scripts/build_beds24_staypilot_tutorial.py              # French (default)
  python3 scripts/build_beds24_staypilot_tutorial.py --lang en
  python3 scripts/build_beds24_staypilot_tutorial.py --lang all   # fr, en, es, de, it

Override voice: SAY_VOICE=Victoria python3 ... --lang en
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

from moviepy.editor import AudioFileClip, ImageClip, VideoClip, concatenate_videoclips

ASSETS = Path(
    os.environ.get(
        "BEDS24_TUTORIAL_ASSETS",
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
    "Capture_d_e_cran_2026-04-15_a__06.07.31-d1200cab-9001-4d5f-b17c-749de72d2d0a.png",
    "Capture_d_e_cran_2026-04-15_a__06.11.58-1e5872a6-f1d6-47c4-ac64-2a6609f12be8.png",
    "Capture_d_e_cran_2026-04-15_a__06.12.36-bbc8b558-68d3-4c48-8230-be8cb8f8e6b3.png",
    "Capture_d_e_cran_2026-04-15_a__06.13.11-46f83f1b-3516-44fb-a3ab-e565a338695b.png",
    "Capture_d_e_cran_2026-04-15_a__06.13.54-4b9a0611-a7c4-48d5-b978-bb0c854b5d75.png",
    "Capture_d_e_cran_2026-04-15_a__06.15.41-71b700f7-b1f3-414a-b699-59f40f8b5926.png",
    "Capture_d_e_cran_2026-04-15_a__06.26.35-7c950054-2e21-4dbb-ba7e-870bdb24f35c.png",
    "Capture_d_e_cran_2026-04-15_a__06.27.26-8527d69e-64cc-4a4a-a13d-18a12a58d83a.png",
    "Capture_d_e_cran_2026-04-15_a__06.29.05-976252b0-01b4-4895-bda2-20b86b384ee1.png",
    "Capture_d_e_cran_2026-04-15_a__06.29.20-c6764757-5b33-4736-b208-2074fa181e8d.png",
    "Capture_d_e_cran_2026-04-15_a__06.40.07-2aa2b924-28b7-43dd-9e7e-7de36b305034.png",
]

PUBLIC = Path(__file__).resolve().parents[1] / "public"

# Default macOS voices; override per machine with SAY_VOICE / SAY_RATE.
LANG_PACK: dict[str, dict] = {
    "fr": {
        "voice": "Thomas",
        "rate": 190,
        "staypilot_placeholder": "(Collez votre jeton ici — zone masquee dans la demo)",
        "lines": [
            "Bienvenue sur Beds24. Pour brancher StayPilot, regardez a gauche le menu reglages : nous allons ouvrir Marketplace, juste au-dessus de Compte.",
            "Dans Marketplace, ouvrez tout en haut de la liste : A P I.",
            "Sur la page A P I, cliquez sur le bouton bleu : generer un code d'invitation.",
            "Donnez un nom au jeton, par exemple StayPilot. Cochez lecture pour reservations, finances des reservations, et proprietes. Puis cliquez sur : generer un jeton longue duree.",
            "Copiez tout de suite ce jeton avec l'icone presse-papiers : il ne sera plus affiche ensuite.",
            "Dans StayPilot, collez d'abord la cle dans le champ A P I ou code d'invitation Beds24.",
            "Dans Beds24, sous A P I, la section jetons longue duree affiche aussi votre jeton si vous devez le retrouver.",
            "Ensuite, ouvrez Compte dans le menu de gauche. Reperez le numero de compte, proprietaire identifiant : c'est l'identifiant compte a copier dans StayPilot.",
            "Dans StayPilot, completez l'identifiant compte Beds24 avec ce numero, puis cliquez sur Connecter.",
            "StayPilot affiche le nombre de logements connectes dans le recapitulatif : ici, la connexion est reussie.",
            "StayPilot confirme la connexion : les donnees officielles se synchronisent automatiquement.",
        ],
    },
    "en": {
        "voice": "Samantha",
        "rate": 175,
        "staypilot_placeholder": "(Paste your token here — hidden in this demo)",
        "lines": [
            "Welcome to Beds24. To connect StayPilot, look at the settings menu on the left: we will open Marketplace, just above Account.",
            "In Marketplace, open the first item in the list: A P I.",
            "On the A P I page, click the blue button: Generate invite code.",
            "Name the token, for example StayPilot. Enable read access for bookings, booking finances, and properties. Then click: Generate long life token.",
            "Copy the token immediately with the clipboard icon: it will not be shown again.",
            "In StayPilot, first paste the key into the A P I or Beds24 invite-code field.",
            "In Beds24, under A P I, the long life tokens section also lists your token if you need to find it again.",
            "Next, open Account in the left menu. Find the account number, Owner id: that is the account identifier to paste into StayPilot.",
            "In StayPilot, enter the Beds24 account identifier, then click Connect.",
            "StayPilot shows how many listings are connected in the summary: here, the connection succeeded.",
            "StayPilot confirms the connection: your official data syncs automatically.",
        ],
    },
    "es": {
        "voice": "Paulina",
        "rate": 175,
        "staypilot_placeholder": "(Pegue su token aqui — oculto en la demo)",
        "lines": [
            "Bienvenido a Beds24. Para conectar StayPilot, mire el menu de ajustes a la izquierda: abriremos Marketplace, justo encima de Cuenta.",
            "En Marketplace, abra la primera entrada de la lista: A P I.",
            "En la pagina A P I, pulse el boton azul: generar codigo de invitacion.",
            "Ponga un nombre al token, por ejemplo StayPilot. Marque lectura para reservas, finanzas de reservas y propiedades. Luego pulse: generar token de larga duracion.",
            "Copie el token de inmediato con el icono del portapapeles: ya no se mostrara despues.",
            "En StayPilot, pegue primero la clave en el campo A P I o codigo de invitacion Beds24.",
            "En Beds24, bajo A P I, la seccion tokens de larga duracion tambien muestra su token si necesita recuperarlo.",
            "A continuacion, abra Cuenta en el menu izquierdo. Localice el numero de cuenta, identificador del propietario: es el identificador de cuenta que debe pegar en StayPilot.",
            "En StayPilot, complete el identificador de cuenta Beds24 con este numero, luego pulse Conectar.",
            "StayPilot muestra el numero de alojamientos conectados en el resumen: aqui, la conexion se ha realizado con exito.",
            "StayPilot confirma la conexion: sus datos oficiales se sincronizan automaticamente.",
        ],
    },
    "de": {
        "voice": "Anna",
        "rate": 172,
        "staypilot_placeholder": "(Token hier einfugen — in der Demo ausgeblendet)",
        "lines": [
            "Willkommen bei Beds24. Um StayPilot anzubinden, schauen Sie links im Einstellungsmenu: Wir offnen Marketplace, direkt uber Konto.",
            "Unter Marketplace offnen Sie den ersten Eintrag: A P I.",
            "Auf der A P I Seite klicken Sie auf den blauen Button: Einladungscode erzeugen.",
            "Geben Sie dem Token einen Namen, zum Beispiel StayPilot. Aktivieren Sie Lesen fur Buchungen, Buchungsfinanzen und Unterkunfte. Dann klicken Sie auf: Langzeit Token erzeugen.",
            "Kopieren Sie den Token sofort mit dem Zwischenablage Symbol: er wird danach nicht mehr angezeigt.",
            "In StayPilot fugen Sie zuerst den Schlussel in das Feld A P I oder Beds24 Einladungscode ein.",
            "Unter A P I zeigt Beds24 im Bereich Langzeit Tokens Ihren Token an, falls Sie ihn wiederfinden mussen.",
            "Offnen Sie dann Konto im linken Menu. Notieren Sie die Kontonummer, Eigentumer I D: das ist die Kennung fur StayPilot.",
            "In StayPilot tragen Sie die Beds24 Kontokennung ein und klicken auf Verbinden.",
            "StayPilot zeigt im Uberblick die Anzahl verbundener Unterkunfte: hier war die Verbindung erfolgreich.",
            "StayPilot bestatigt die Verbindung: Ihre offiziellen Daten synchronisieren sich automatisch.",
        ],
    },
    "it": {
        "voice": "Alice",
        "rate": 175,
        "staypilot_placeholder": "(Incolla il token qui — nascosto nella demo)",
        "lines": [
            "Benvenuto su Beds24. Per collegare StayPilot, guardate il menu impostazioni a sinistra: apriremo Marketplace, subito sopra Conto.",
            "In Marketplace, aprite la prima voce in lista: A P I.",
            "Nella pagina A P I, cliccate il pulsante blu: genera codice invito.",
            "Assegnate un nome al token, ad esempio StayPilot. Spuntate lettura per prenotazioni, finanze prenotazioni e proprieta. Poi cliccate: genera token lunga durata.",
            "Copiate subito il token con l icona appunti: non verra piu mostrato.",
            "In StayPilot, incollate prima la chiave nel campo A P I o codice invito Beds24.",
            "In Beds24, sotto A P I, la sezione token lunga durata mostra anche il token se dovete ritrovarlo.",
            "Poi aprite Conto nel menu a sinistra. Individuate il numero conto, identificatore proprietario: e l identificatore da copiare in StayPilot.",
            "In StayPilot, completate l identificatore conto Beds24 con quel numero, poi cliccate Connetti.",
            "StayPilot mostra il numero di alloggi collegati nel riepilogo: qui la connessione e riuscita.",
            "StayPilot conferma la connessione: i dati ufficiali si sincronizzano automaticamente.",
        ],
    },
}

def letterbox_rgb(im: Image.Image, tw: int = 1920, th: int = 1080) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    scale = min(tw / w, th / h)
    nw, nh = int(w * scale), int(h * scale)
    im2 = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (tw, th), (18, 24, 38))
    ox, oy = (tw - nw) // 2, (th - nh) // 2
    canvas.paste(im2, (ox, oy))
    return canvas


def letterbox_meta(im: Image.Image, tw: int = 1920, th: int = 1080) -> tuple[int, int, int, int, int, int]:
    w, h = im.size
    scale = min(tw / w, th / h)
    nw, nh = int(w * scale), int(h * scale)
    ox, oy = (tw - nw) // 2, (th - nh) // 2
    return tw, th, ox, oy, nw, nh


def redact_token_modal(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    x0, y0 = int(w * 0.12), int(h * 0.38)
    x1, y1 = int(w * 0.88), int(h * 0.52)
    crop = im.crop((x0, y0, x1, y1))
    blurred = crop.filter(ImageFilter.GaussianBlur(radius=14))
    im.paste(blurred, (x0, y0))
    return im


def redact_beds24_lifetime_token_cell(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    x0, y0 = int(w * 0.04), int(h * 0.58)
    x1, y1 = int(w * 0.42), int(h * 0.72)
    crop = im.crop((x0, y0, x1, y1))
    blurred = crop.filter(ImageFilter.GaussianBlur(radius=12))
    im.paste(blurred, (x0, y0))
    return im


def crop_success_modal_footer(im: Image.Image) -> Image.Image:
    """Remove bottom strip (e.g. 'StayPilot - Guide rapide', step counter) from success card capture."""
    im = im.convert("RGB")
    w, h = im.size
    # Footer band ~14–18% of height; use 16% to clear label + pagination
    cut = int(h * 0.16)
    return im.crop((0, 0, w, h - cut))


def redact_account_email_value(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    x0, y0 = int(w * 0.22), int(h * 0.22)
    x1, y1 = int(w * 0.92), int(h * 0.31)
    crop = im.crop((x0, y0, x1, y1))
    blurred = crop.filter(ImageFilter.GaussianBlur(radius=14))
    im.paste(blurred, (x0, y0))
    return im


def redact_staypilot_key_field(im: Image.Image, placeholder: str) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    x0, y0 = int(w * 0.06), int(h * 0.36)
    x1, y1 = int(w * 0.94), int(h * 0.48)
    overlay = Image.new("RGB", (x1 - x0, y1 - y0), (240, 242, 246))
    im.paste(overlay, (x0, y0))
    draw = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 20)
    except OSError:
        font = ImageFont.load_default()
    draw.text((x0 + 14, y0 + (y1 - y0) // 2 - 11), placeholder, fill=(80, 90, 110), font=font)
    return im


def apply_redactions(name: str, im: Image.Image, staypilot_placeholder: str) -> Image.Image:
    if "06.13.54" in name:
        return redact_token_modal(im)
    if any(x in name for x in ("06.15.41", "06.29.05", "06.29.20")):
        return redact_staypilot_key_field(im, staypilot_placeholder)
    if "06.26.35" in name:
        return redact_beds24_lifetime_token_cell(im)
    if "06.27.26" in name:
        return redact_account_email_value(im)
    if "06.40.07" in name:
        return crop_success_modal_footer(im)
    return im


def load_prepared(idx: int, staypilot_placeholder: str) -> Image.Image:
    path = ASSETS / FRAMES[idx]
    if not path.exists():
        raise FileNotFoundError(path)
    im = Image.open(path)
    im = apply_redactions(path.name, im, staypilot_placeholder)
    return letterbox_rgb(im)


def say_to_aiff(text: str, out_path: Path, voice: str, rate: int) -> None:
    out_path = out_path.with_suffix(".aiff")
    cmd = ["say", "-v", voice, "-r", str(rate), "-o", str(out_path), text]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def clip_static(idx: int, audio_path: Path, placeholder: str) -> ImageClip:
    img = load_prepared(idx, placeholder)
    arr = np.array(img)
    au = AudioFileClip(str(audio_path.with_suffix(".aiff")))
    dur = float(au.duration) + 0.25
    return ImageClip(arr).set_duration(dur).set_audio(au)


def clip_dashboard_motion(narr0: str, voice: str, rate: int, placeholder: str, tmp: Path) -> VideoClip:
    raw = Image.open(ASSETS / FRAMES[0]).convert("RGBA")
    tw, th, ox, oy, nw, nh = letterbox_meta(raw.convert("RGB"))
    base = letterbox_rgb(raw)
    w, h = base.size
    base = Image.fromarray(np.array(base)).convert("RGBA")

    mx, my = 0.125, 0.62
    ex = ox + int(mx * nw)
    ey = oy + int(my * nh)
    sx, sy = ox + int(nw * 0.52), oy + int(nh * 0.28)

    def make_frame(t: float):
        dur = 4.2
        u = min(1.0, max(0.0, t / (dur * 0.72)))
        p = 1 - (1 - u) ** 3
        cx = sx + (ex - sx) * p
        cy = sy + (ey - sy) * p
        im = base.copy()
        draw = ImageDraw.Draw(im, "RGBA")
        r = 14
        draw.polygon(
            [(cx, cy), (cx + r * 1.1, cy + r * 0.45), (cx + r * 0.35, cy + r * 0.55)],
            fill=(35, 35, 40, 235),
            outline=(255, 255, 255, 240),
        )
        return np.array(im.convert("RGB"))

    au_path = tmp / "seg0.aiff"
    say_to_aiff(narr0, au_path, voice, rate)
    au = AudioFileClip(str(au_path))
    dur = float(au.duration) + 0.35
    return VideoClip(make_frame, duration=dur).set_fps(24).set_audio(au)


def output_video_path(lang: str) -> Path:
    if lang == "fr":
        return PUBLIC / "beds24-staypilot-connection-tutorial.mp4"
    return PUBLIC / f"beds24-staypilot-connection-tutorial.{lang}.mp4"


def build_one(lang: str) -> Path:
    if lang not in LANG_PACK:
        raise ValueError(f"Unknown lang {lang!r}; choose from {', '.join(LANG_PACK)}")

    pack = LANG_PACK[lang]
    narr = pack["lines"]
    if len(narr) != len(FRAMES):
        raise ValueError(f"lines length for {lang} must match FRAMES")

    voice = os.environ.get("SAY_VOICE") or pack["voice"]
    rate = int(os.environ.get("SAY_RATE", pack.get("rate", 190)))
    placeholder = pack["staypilot_placeholder"]
    out_path = output_video_path(lang)

    if not ASSETS.exists():
        raise FileNotFoundError(str(ASSETS))
    for f in FRAMES:
        if not (ASSETS / f).exists():
            raise FileNotFoundError(str(ASSETS / f))

    tmp = Path(tempfile.mkdtemp(prefix=f"beds24_tut_{lang}_"))
    try:
        clips = [clip_dashboard_motion(narr[0], voice, rate, placeholder, tmp)]
        for i in range(1, len(FRAMES)):
            ap = tmp / f"seg{i}.aiff"
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
            bitrate="3500k",
        )
        final.close()
        for c in clips:
            try:
                c.close()
            except Exception:
                pass
    finally:
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
    p = argparse.ArgumentParser(description="Build Beds24 tutorial MP4 (voice-over language).")
    p.add_argument(
        "--lang",
        default="fr",
        choices=["fr", "en", "es", "de", "it", "all"],
        help="Voice-over language, or 'all' to render every language in LANG_PACK.",
    )
    args = p.parse_args()
    langs = list(LANG_PACK) if args.lang == "all" else [args.lang]

    for lang in langs:
        try:
            out = build_one(lang)
            print("Wrote:", out)
        except subprocess.CalledProcessError:
            print(
                f"macOS 'say' failed for lang={lang}. Try another voice, e.g. SAY_VOICE=...",
                file=sys.stderr,
            )
            return 1
        except Exception as e:
            print(f"Error building {lang}: {e}", file=sys.stderr)
            return 1

    # Optional: keep .fr.mp4 as copy for symmetry (deploy/CDN); skip if same as main
    if args.lang == "all":
        fr_main = PUBLIC / "beds24-staypilot-connection-tutorial.mp4"
        fr_copy = PUBLIC / "beds24-staypilot-connection-tutorial.fr.mp4"
        if fr_main.is_file():
            shutil.copy2(fr_main, fr_copy)
            print("Also:", fr_copy, "(copy of French default)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
