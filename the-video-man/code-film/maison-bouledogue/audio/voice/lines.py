# Casting + per-line spoken scripts for MAISON BOULEDOGUE.
# Each token = (display_word, spoken_token, pause_after_ms).
#   display_word  -> used for phonemes / visemes (the intended English/French word)
#   spoken_token  -> what `say` is fed (French-orthography respelling for the fr_FR voices = French accent)
#   pause_after_ms -> inserted as [[slnc N]] for comic timing

CAST = {
    'bulldog':   {'voice': 'Grandpa (French (France))', 'rate': 165, 'soft_cap': 205},
    'mouse':     {'voice': 'Kathy',                     'rate': 150, 'soft_cap': 200},
    'announcer': {'voice': 'Thomas',                    'rate': 148, 'soft_cap': 185},
}

LINES = {
    'L01': [('Mesdames', 'Mesdames,', 0), ('messieurs', 'messieurs...', 380),
            ('and', 'ènde', 0), ('assorted', 'assortède', 0), ('mammals', 'mammeulz.', 300),
            ('Maison', 'Maison', 0), ('Bouledogue', 'Bouledogue!', 0)],
    'L02': [('Pipette', 'Pipette!', 160), ('The', 'Ze', 0), ('heels', 'ilze!', 140),
            ('Higher', 'Aïeur!', 170), ('Couture', 'Couture', 0), ('is', 'iz', 0), ('pain', 'pèïne!', 0)],
    'L03': [('Any', 'Any', 0), ('higher', 'higher,', 60), ('Monsieur', 'Monsieur,', 90),
            ('and', 'and', 0), ('she', 'she', 0), ('will', 'will', 0), ('need', 'need', 0), ('oxygen', 'oxygen.', 0)],
    'L04': [('Then', 'Zenne', 0), ('give', 'guive', 0), ('her', 'eur', 0), ('oxygen', 'oxygène...', 460),
            ('in', 'inne', 0), ('pearls', 'peurles!', 0)],
    'L05': [('Look', 'Louk', 0), ('one', 'ouane.', 280), ('Flamingo', 'Flamingo,', 60),
            ('in', 'inne...', 520), ('Vertigo', 'Vertigo.', 0)],
    'L06': [('Look', 'Louk', 0), ('two', 'tou.', 220), ('Giraffe', 'Girafe,', 60), ('in', 'inne', 0),
            ('forty', 'forti', 0), ('feet', 'fite', 0), ('of', 'ove', 0), ('pearls', 'peurlz.', 0)],
    'L07': [('Non', 'Non.', 260), ('Non', 'non', 0), ('non', 'non', 0), ('non', 'non', 0), ('non', 'non.', 0)],
    'L08': [('Oh', 'Oh...', 420), ('oh', 'oh', 0), ('my', 'my.', 0)],
    'L09': [('Of', 'Off', 0), ('course', 'courss.', 280), ('It', 'Itte', 0), ('was', 'ouaze...', 560),
            ('intentional', 'intentionnelle.', 0)],
    'L10': [('Of', 'Of', 0), ('course', 'course,', 80), ('Monsieur', 'Monsieur.', 0)],
    'L11': [('Maison', 'Maison', 60), ('Bouledogue', 'Bouledogue.', 0)],
}

# ARPAbet for French / proper words missing from (or badly handled by) CMUdict
EXTRA = {
    'mesdames': 'M EY1 D AA1 M', 'messieurs': 'M EY0 S Y ER1', 'maison': 'M EY0 Z AO1 N',
    'bouledogue': 'B UW1 L D AO1 G', 'pipette': 'P IY0 P EH1 T', 'monsieur': 'M AH0 S Y ER1',
    'non': 'N AO1 N', 'couture': 'K UW0 T UH1 R', 'vertigo': 'V ER1 T IH0 G OW2',
    'flamingo': 'F L AH0 M IH1 NG G OW0',
}
