"""Izvorni katalog za lokalne snimke modula Čitanje.

Ovaj fajl je namerno napisan ćirilicom zato što je ćirilica prikazani i
izgovoreni sadržaj Slovolova. ``generate-reading-elevenlabs-audio.py`` ga
učitava kao jedini izvor teksta za produkcijske MP3 snimke.
"""

from __future__ import annotations

from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
AUDIO_ROOT = ROOT / "public" / "audio" / "reading"

RHYME_ROUNDS = [
    ("mak", "Која реч се римује са речју мак?", "Мак и рак се римују."),
    ("dan", "Која реч се римује са речју дан?", "Дан и сан се римују."),
    ("cvet", "Која реч се римује са речју цвет?", "Цвет и свет се римују."),
    ("kosa", "Која реч се римује са речју коса?", "Коса и роса се римују."),
    ("med", "Која реч се римује са речју мед?", "Мед и лед се римују."),
    ("mis", "Која реч се римује са речју миш?", "Миш и плиш се римују."),
    ("zec", "Која реч се римује са речју зец?", "Зец и месец се римују."),
    ("suma", "Која реч се римује са речју шума?", "Шума и гума се римују."),
    ("more", "Која реч се римује са речју море?", "Море и горе се римују."),
    ("ptica", "Која реч се римује са речју птица?", "Птица и жица се римују."),
]

SYLLABLES = [
    ("ma", "ма"), ("me", "ме"), ("mi", "ми"), ("mo", "мо"), ("mu", "му"),
    ("sa", "са"), ("se", "се"), ("si", "си"), ("so", "со"), ("su", "су"),
    ("la", "ла"), ("le", "ле"), ("li", "ли"), ("lo", "ло"), ("lu", "лу"),
    ("ra", "ра"), ("re", "ре"), ("ri", "ри"), ("ro", "ро"), ("ru", "ру"),
    ("na", "на"), ("ne", "не"), ("ni", "ни"), ("no", "но"), ("nu", "ну"),
]

WORDS = [
    ("mama", "мама"), ("sova", "сова"), ("suma", "шума"),
    ("tata", "тата"), ("beba", "беба"), ("kuca", "кућа"),
    ("meda", "меда"), ("riba", "риба"), ("patka", "патка"),
    ("sunce", "сунце"), ("reka", "река"), ("cvet", "цвет"),
    ("hleb", "хлеб"), ("sir", "сир"), ("jabuka", "јабука"),
    ("avion", "авион"), ("voz", "воз"), ("brod", "брод"),
    ("lopta", "лопта"), ("lutka", "лутка"), ("zmaj", "змај"),
    ("kisa", "киша"), ("sneg", "снег"), ("oblak", "облак"),
    ("pcela", "пчела"), ("leptir", "лептир"), ("puz", "пуж"),
    ("knjiga", "књига"), ("olovka", "оловка"), ("torba", "торба"),
]

ADVENTURES = [
    ("lana-cvet", "Лана", "врта", "црвени цвет"),
    ("vuk-zmaj", "Вук", "брда", "плавог змаја"),
    ("mila-sova", "Мила", "шуме", "мудру сову"),
    ("luka-kljuc", "Лука", "старог храста", "мали кључ"),
    ("ana-balon", "Ана", "парка", "жути балон"),
    ("bojan-brod", "Бојан", "реке", "дрвени брод"),
    ("iva-jez", "Ива", "ливаде", "малог јежа"),
    ("marko-kompas", "Марко", "планине", "стари компас"),
    ("nina-zvono", "Нина", "сеоског трга", "сребрно звоно"),
    ("ognjen-knjiga", "Огњен", "библиотеке", "књигу о звездама"),
    ("petra-leptir", "Петра", "цветне баште", "шареног лептира"),
    ("rada-skoljka", "Рада", "морске обале", "белу шкољку"),
    ("sava-voz", "Сава", "железничке станице", "црвени воз"),
    ("tara-zvezda", "Тара", "тихе пољане", "сјајну звезду"),
    ("uros-fenjer", "Урош", "старе куле", "зелени фењер"),
    ("filip-robot", "Филип", "радионице", "малог робота"),
    ("hana-mace", "Хана", "дворишта", "бело маче"),
    ("cana-kosara", "Цана", "воћњака", "корпу јабука"),
    ("ceda-camac", "Чеда", "мирног језера", "мали чамац"),
    ("sana-lopta", "Сана", "школског игралишта", "шарену лопту"),
]

LITERACY_PROMPTS = [
    "Напиши велико слово А.",
    "Напиши реч авион.",
    "Додирни речи правилним редом и сложи: Сова лети.",
    "Напиши реч љуљашка.",
    "Сложи речи правилним редом: Мала сова лети изнад шуме.",
    "Сложи три реченице правилним редом и направи малу причу.",
]


def story_segments() -> list[tuple[Path, str]]:
    segments: list[tuple[Path, str]] = []
    for story_id, name, destination, object_accusative in ADVENTURES:
        stories = {
            "4-6": [
                f"{name} иде до {destination}.",
                f"Тамо види {object_accusative}.",
            ],
            "6-8": [
                f"{name} креће до {destination} у нову авантуру.",
                f"На стази проналази {object_accusative}.",
                "Код куће свима прича шта се догодило.",
            ],
            "8-10": [
                f"Током пута до {destination}, {name} примећује необичан траг.",
                f"Пратећи траг, {name} проналази {object_accusative} поред стазе.",
                f"На крају {name} чува налаз и записује целу пустоловину.",
            ],
        }
        for age, sentences in stories.items():
            for index, sentence in enumerate(sentences, start=1):
                segments.append((AUDIO_ROOT / "stories" / f"{story_id}-{age}-{index}.mp3", sentence))
    return segments

def all_segments() -> list[tuple[Path, str]]:
    segments: list[tuple[Path, str]] = []
    for round_id, prompt, result in RHYME_ROUNDS:
        segments.extend([
            (AUDIO_ROOT / f"rhyme-{round_id}-prompt.mp3", prompt),
            (AUDIO_ROOT / f"rhyme-{round_id}-result.mp3", result),
        ])
    segments.extend((AUDIO_ROOT / f"syllable-{slug}.mp3", text) for slug, text in SYLLABLES)
    segments.extend((AUDIO_ROOT / f"word-{slug}.mp3", text) for slug, text in WORDS)
    segments.extend(story_segments())
    segments.extend(
        (AUDIO_ROOT / "adventure" / f"literacy-{index}.mp3", prompt)
        for index, prompt in enumerate(LITERACY_PROMPTS, start=1)
    )
    return segments
