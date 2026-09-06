#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Shared glyph set for the image-to-font template + builder.

Each entry: (unicode, glyph_name, label_char).  The order is the grid order
(row-major, left-to-right, top-to-bottom) in the template sheet.
"""

# 22 base Hebrew letters + 5 final forms (finals grouped after the alphabet)
HEBREW = [
    (0x05D0, "uni05D0", "א"), (0x05D1, "uni05D1", "ב"), (0x05D2, "uni05D2", "ג"),
    (0x05D3, "uni05D3", "ד"), (0x05D4, "uni05D4", "ה"), (0x05D5, "uni05D5", "ו"),
    (0x05D6, "uni05D6", "ז"), (0x05D7, "uni05D7", "ח"), (0x05D8, "uni05D8", "ט"),
    (0x05D9, "uni05D9", "י"), (0x05DB, "uni05DB", "כ"), (0x05DC, "uni05DC", "ל"),
    (0x05DE, "uni05DE", "מ"), (0x05E0, "uni05E0", "נ"), (0x05E1, "uni05E1", "ס"),
    (0x05E2, "uni05E2", "ע"), (0x05E4, "uni05E4", "פ"), (0x05E6, "uni05E6", "צ"),
    (0x05E7, "uni05E7", "ק"), (0x05E8, "uni05E8", "ר"), (0x05E9, "uni05E9", "ש"),
    (0x05EA, "uni05EA", "ת"),
    # final forms
    (0x05DA, "uni05DA", "ך"), (0x05DD, "uni05DD", "ם"), (0x05DF, "uni05DF", "ן"),
    (0x05E3, "uni05E3", "ף"), (0x05E5, "uni05E5", "ץ"),
]

DIGITS = [(0x30 + i, f"{c}", str(i)) for i, c in enumerate("zero one two three "
          "four five six seven eight nine".split())]
# map digit glyph names properly
DIGIT_NAMES = ["zero", "one", "two", "three", "four", "five", "six", "seven",
               "eight", "nine"]
DIGITS = [(0x30 + i, DIGIT_NAMES[i], str(i)) for i in range(10)]

PUNCT = [
    (0x002E, "period",      "."),
    (0x002C, "comma",       ","),
    (0x003A, "colon",       ":"),
    (0x003B, "semicolon",   ";"),
    (0x0021, "exclam",      "!"),
    (0x003F, "question",    "?"),
    (0x002D, "hyphen",      "-"),
    (0x0028, "parenleft",   "("),
    (0x0029, "parenright",  ")"),
    (0x0022, "quotedbl",    '"'),
    (0x0027, "quotesingle", "'"),
    (0x05F4, "uni05F4",     "״"),   # gershayim
]

# Full ordered set used by the template grid
GLYPHS = HEBREW + DIGITS + PUNCT

# space is not drawn; it gets a fixed advance
SPACE = (0x0020, "space", "␣")
