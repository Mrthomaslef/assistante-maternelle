#!/usr/bin/env python3
"""Extrait (lecture seule) les messages d'un mois concernant Mabrouka :
- iMessage/SMS avec Mabrouka (tous les messages)
- iMessage/SMS avec Marie (seulement ceux qui parlent de Mabrouka / nounou / Émile gardé)
- WhatsApp (mêmes règles), si la base est lisible.
Usage : extraire_messages_mabrouka.py YYYY-MM   -> imprime JSON [{date, de, canal, texte}]
"""
import json, re, sqlite3, sys, shutil, tempfile, os
from datetime import datetime, timedelta

# Numéros (9 derniers chiffres) dans ~/.config/assmat/contacts.env — jamais dans le dépôt public
_cfg = dict(l.strip().split("=", 1) for l in open(os.path.expanduser("~/.config/assmat/contacts.env")) if "=" in l)
MABROUKA = _cfg["MABROUKA"]
MARIE = _cfg["MARIE"]
MOTS = re.compile(r"mabrouka|nounou|nourrice|ass ?mat|absente?|indispo|pas dispo|disponible|malade|cong[ée]s?|vacances|formation|pas d.?accueil|ne (pourra|peut) pas (garder|accueillir|prendre)|garder [ée]mile|boutch", re.I)
HOME = os.path.expanduser("~")

def copie(path):
    d = tempfile.mkdtemp(); dst = os.path.join(d, "db.sqlite")
    shutil.copy2(path, dst)
    for ext in ("-wal", "-shm"):
        if os.path.exists(path + ext): shutil.copy2(path + ext, dst + ext)
    return sqlite3.connect(dst)

def decode_attributed(blob):
    if not blob: return ""
    try:
        i = blob.index(b"NSString") + len(b"NSString")
        i = blob.index(b"+", i) + 1
        n = blob[i]; i += 1
        if n == 0x81: n = int.from_bytes(blob[i:i+2], "little"); i += 2
        elif n == 0x82: n = int.from_bytes(blob[i:i+4], "little"); i += 4
        return blob[i:i+n].decode("utf-8", "replace")
    except Exception:
        return ""

def imessage(debut, fin):
    out = []
    con = copie(f"{HOME}/Library/Messages/chat.db")
    q = """select m.date, m.is_from_me, m.text, m.attributedBody, h.id
           from message m join chat_message_join cm on cm.message_id=m.ROWID
           join chat_handle_join chj on chj.chat_id=cm.chat_id join handle h on h.ROWID=chj.handle_id
           where (h.id like ? or h.id like ?) and m.date between ? and ?"""
    ref = datetime(2001, 1, 1)
    t0 = int((debut - ref).total_seconds() * 1e9); t1 = int((fin - ref).total_seconds() * 1e9)
    vus = set()
    for d, me, txt, ab, hid in con.execute(q, (f"%{MABROUKA}%", f"%{MARIE}%", t0, t1)):
        texte = (txt or decode_attributed(ab) or "").strip()
        if not texte: continue
        quand = datetime.fromtimestamp(d / 1e9 + 978307200)
        avec_mab = MABROUKA in hid
        if not avec_mab and not MOTS.search(texte): continue
        cle = (d, texte)
        if cle in vus: continue
        vus.add(cle)
        de = "Thomas" if me else ("Mabrouka" if avec_mab else "Marie")
        out.append({"date": quand.strftime("%a %Y-%m-%d %H:%M"), "de": de,
                    "conversation": "Mabrouka" if avec_mab else "Marie", "canal": "iMessage/SMS", "texte": texte})
    return out

def whatsapp(debut, fin):
    path = f"{HOME}/Library/Group Containers/group.net.whatsapp.WhatsApp.shared/ChatStorage.sqlite"
    out = []
    try:
        con = copie(path)
        ref = datetime(2001, 1, 1)
        t0 = (debut - ref).total_seconds(); t1 = (fin - ref).total_seconds()
        q = """select m.ZMESSAGEDATE, m.ZISFROMME, m.ZTEXT, s.ZCONTACTJID, s.ZPARTNERNAME
               from ZWAMESSAGE m join ZWACHATSESSION s on s.Z_PK=m.ZCHATSESSION
               where m.ZMESSAGEDATE between ? and ? and m.ZTEXT is not null"""
        for d, me, txt, jid, nom in con.execute(q, (t0, t1)):
            jid = jid or ""; nom = nom or ""
            avec_mab = MABROUKA in jid or "mabrouka" in nom.lower()
            avec_marie = MARIE in jid or ("marie" in nom.lower() and "group" not in jid)
            if not (avec_mab or (avec_marie and MOTS.search(txt))): continue
            out.append({"date": datetime.fromtimestamp(d + 978307200).strftime("%a %Y-%m-%d %H:%M"),
                        "de": "Thomas" if me else ("Mabrouka" if avec_mab else "Marie"),
                        "conversation": "Mabrouka" if avec_mab else "Marie", "canal": "WhatsApp", "texte": txt.strip()})
    except Exception as e:
        print(f"WhatsApp illisible: {e}", file=sys.stderr)
    return out

if __name__ == "__main__":
    a, m = map(int, sys.argv[1].split("-"))
    debut = datetime(a, m, 1) - timedelta(days=7)   # absences annoncées en avance
    fin = datetime(a + (m == 12), m % 12 + 1, 1)
    msgs = sorted(imessage(debut, fin) + whatsapp(debut, fin), key=lambda x: x["date"][4:])
    print(json.dumps(msgs, ensure_ascii=False, indent=1))
