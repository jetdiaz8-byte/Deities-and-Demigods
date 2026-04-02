#!/usr/bin/env python3
"""
Deities & Demigods Codex - Complete Compendium of Mythworld
Generates a comprehensive PDF reference for the AD&D 1st Edition RPG.
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, NextPageTemplate
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate, NextPageTemplate
from reportlab.platypus.frames import Frame
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.fonts import addMapping


class BookmarkParagraph(Paragraph):
    """A Paragraph that supports bookmark/TOC notifications."""

    def __init__(self, text, style, bookmark=None, level=0):
        self._bookmarkName = bookmark
        self._bookmarkLevel = level
        super().__init__(text, style)

# ==============================================================================
# CONFIGURATION
# ==============================================================================
OUTPUT_PATH = "/home/z/my-project/download/Deities_Demigods_Codex.pdf"
FONT_PATH = "/usr/share/fonts/truetype/english/Times-New-Roman.ttf"

# Colors
DARK_BLUE = HexColor("#1F4E79")
MEDIUM_BLUE = HexColor("#2E75B6")
LIGHT_BLUE = HexColor("#D6E4F0")
VERY_LIGHT_BLUE = HexColor("#EAF0F8")
LIGHT_GRAY = HexColor("#F5F5F5")
DARK_GRAY = HexColor("#333333")
GOLD = HexColor("#C5A55A")
COVER_BG = HexColor("#0D2137")
SUBTITLE_GOLD = HexColor("#D4AF37")

PAGE_WIDTH, PAGE_HEIGHT = letter
LEFT_MARGIN = 0.75 * inch
RIGHT_MARGIN = 0.75 * inch
TOP_MARGIN = 0.75 * inch
BOTTOM_MARGIN = 0.75 * inch

# ==============================================================================
# FONT REGISTRATION
# ==============================================================================
pdfmetrics.registerFont(TTFont("TNR", FONT_PATH))
pdfmetrics.registerFont(TTFont("TNR-Bold", FONT_PATH))
pdfmetrics.registerFont(TTFont("TNR-Italic", FONT_PATH))
pdfmetrics.registerFont(TTFont("TNR-BoldItalic", FONT_PATH))
addMapping("TNR", 0, 0, "TNR")
addMapping("TNR", 1, 0, "TNR-Bold")
addMapping("TNR", 0, 1, "TNR-Italic")
addMapping("TNR", 1, 1, "TNR-BoldItalic")
pdfmetrics.registerFontFamily("TNR", normal="TNR", bold="TNR-Bold", italic="TNR-Italic", boldItalic="TNR-BoldItalic")

# ==============================================================================
# STYLES
# ==============================================================================
styles = getSampleStyleSheet()

# Cover styles
cover_title_style = ParagraphStyle(
    "CoverTitle", fontName="TNR-Bold", fontSize=36, leading=44,
    textColor=white, alignment=TA_CENTER, spaceAfter=12
)
cover_subtitle_style = ParagraphStyle(
    "CoverSubtitle", fontName="TNR", fontSize=16, leading=22,
    textColor=SUBTITLE_GOLD, alignment=TA_CENTER, spaceAfter=8
)
cover_info_style = ParagraphStyle(
    "CoverInfo", fontName="TNR", fontSize=11, leading=16,
    textColor=HexColor("#AABBCC"), alignment=TA_CENTER, spaceAfter=6
)

# Chapter title
chapter_title_style = ParagraphStyle(
    "ChapterTitle", fontName="TNR-Bold", fontSize=22, leading=28,
    textColor=DARK_BLUE, alignment=TA_LEFT,
    spaceBefore=16, spaceAfter=12,
    borderWidth=0, borderColor=DARK_BLUE, borderPadding=4
)
chapter_subtitle_style = ParagraphStyle(
    "ChapterSubtitle", fontName="TNR", fontSize=12, leading=16,
    textColor=MEDIUM_BLUE, alignment=TA_LEFT,
    spaceBefore=0, spaceAfter=10
)

# Section headings
section_heading_style = ParagraphStyle(
    "SectionHeading", fontName="TNR-Bold", fontSize=14, leading=18,
    textColor=DARK_BLUE, alignment=TA_LEFT,
    spaceBefore=12, spaceAfter=6
)
subsection_heading_style = ParagraphStyle(
    "SubsectionHeading", fontName="TNR-Bold", fontSize=12, leading=15,
    textColor=MEDIUM_BLUE, alignment=TA_LEFT,
    spaceBefore=8, spaceAfter=4
)

# Body text
body_style = ParagraphStyle(
    "BodyText2", fontName="TNR", fontSize=10, leading=14,
    textColor=black, alignment=TA_JUSTIFY,
    spaceBefore=2, spaceAfter=6
)
body_bold_style = ParagraphStyle(
    "BodyBold", fontName="TNR-Bold", fontSize=10, leading=14,
    textColor=DARK_GRAY, alignment=TA_LEFT,
    spaceBefore=2, spaceAfter=4
)

# Table cell styles
table_header_style = ParagraphStyle(
    "TableHeader", fontName="TNR-Bold", fontSize=8.5, leading=11,
    textColor=white, alignment=TA_CENTER
)
table_cell_style = ParagraphStyle(
    "TableCell", fontName="TNR", fontSize=8, leading=10.5,
    textColor=black, alignment=TA_CENTER
)
table_cell_left_style = ParagraphStyle(
    "TableCellLeft", fontName="TNR", fontSize=8, leading=10.5,
    textColor=black, alignment=TA_LEFT
)
table_cell_name_style = ParagraphStyle(
    "TableNameCell", fontName="TNR-Bold", fontSize=8, leading=10.5,
    textColor=DARK_BLUE, alignment=TA_LEFT
)

# TOC styles
toc_h1_style = ParagraphStyle(
    "TOCH1", fontName="TNR-Bold", fontSize=12, leading=16,
    textColor=DARK_BLUE, leftIndent=0, spaceBefore=6, spaceAfter=2
)
toc_h2_style = ParagraphStyle(
    "TOCH2", fontName="TNR", fontSize=10, leading=14,
    textColor=DARK_GRAY, leftIndent=20, spaceBefore=2, spaceAfter=1
)

# Group label style (pantheon headers in tables)
group_label_style = ParagraphStyle(
    "GroupLabel", fontName="TNR-Bold", fontSize=9, leading=12,
    textColor=DARK_BLUE, alignment=TA_LEFT
)

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================
def make_table_style(has_group_rows=False):
    """Create a consistent table style."""
    base = [
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "TNR-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#CCCCCC")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    return base


def apply_alternating_rows(style_cmds, num_data_rows, header_rows=1):
    """Add alternating row colors to table style commands."""
    for i in range(num_data_rows):
        row_idx = i + header_rows
        if i % 2 == 1:
            style_cmds.append(("BACKGROUND", (0, row_idx), (-1, row_idx), LIGHT_GRAY))
    return style_cmds


def make_paragraph(text, style=None):
    """Create a paragraph with safe text handling."""
    if style is None:
        style = body_style
    # Escape special XML characters
    safe = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe, style)


def make_header_cell(text):
    """Create a table header cell."""
    safe = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe, table_header_style)


def make_cell(text, style=None, center=True):
    """Create a table cell."""
    if style is None:
        style = table_cell_style if center else table_cell_left_style
    safe = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe, style)


def make_name_cell(text):
    """Create a name cell (bold, left-aligned)."""
    safe = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe, table_cell_name_style)


def make_group_row(text, num_cols):
    """Create a pantheon group header row spanning all columns."""
    safe = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    p = Paragraph(f"<b>{safe}</b>", ParagraphStyle(
        "GroupRow", fontName="TNR-Bold", fontSize=9, leading=12,
        textColor=white, alignment=TA_LEFT
    ))
    return [p] + [Paragraph("", table_cell_style)] * (num_cols - 1)


def chapter_hr():
    """Horizontal rule under chapter title."""
    return HRFlowable(width="100%", thickness=1.5, color=DARK_BLUE, spaceBefore=0, spaceAfter=10)


def build_table(data, col_widths, has_group_rows=False):
    """Build a styled table with alternating rows."""
    style_cmds = make_table_style(has_group_rows)
    # Count actual data rows (not group rows)
    data_rows = len(data) - 1  # minus header
    style_cmds = apply_alternating_rows(style_cmds, data_rows)

    # Apply group row styling
    if has_group_rows:
        for i, row in enumerate(data):
            if i == 0:
                continue
            first_cell = row[0]
            if hasattr(first_cell, 'text') and first_cell.text:
                txt = first_cell.text.strip()
                if txt.startswith("<b>") and not any(c.isdigit() for c in txt[:20]):
                    style_cmds.append(("BACKGROUND", (0, i), (-1, i), MEDIUM_BLUE))
                    style_cmds.append(("TEXTCOLOR", (0, i), (-1, i), white))
                    style_cmds.append(("SPAN", (0, i), (-1, i)))

    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


# ==============================================================================
# DOCUMENT TEMPLATE WITH TOC SUPPORT
# ==============================================================================
class CodexDocTemplate(BaseDocTemplate):
    """Custom document template with TOC and cover support."""

    def __init__(self, filename, **kw):
        BaseDocTemplate.__init__(self, filename, **kw)

        # Cover page frame (full page)
        cover_frame = Frame(
            0, 0, PAGE_WIDTH, PAGE_HEIGHT,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
            id="cover"
        )

        # Content frame
        content_frame = Frame(
            LEFT_MARGIN, BOTTOM_MARGIN,
            PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN,
            PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN,
            id="content"
        )

        cover_template = PageTemplate(id="Cover", frames=[cover_frame], onPage=self._cover_page)
        content_template = PageTemplate(id="Content", frames=[content_frame], onPage=self._content_page)

        self.addPageTemplates([cover_template, content_template])

    def _cover_page(self, canvas, doc):
        """Draw the cover page background."""
        canvas.saveState()
        canvas.setFillColor(COVER_BG)
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

        # Decorative border
        canvas.setStrokeColor(GOLD)
        canvas.setLineWidth(2)
        canvas.rect(30, 30, PAGE_WIDTH - 60, PAGE_HEIGHT - 60, fill=0, stroke=1)
        canvas.setLineWidth(0.5)
        canvas.rect(36, 36, PAGE_WIDTH - 72, PAGE_HEIGHT - 72, fill=0, stroke=1)

        # Corner decorations
        corner_size = 20
        for x, y in [(40, 40), (PAGE_WIDTH - 40, 40), (40, PAGE_HEIGHT - 40), (PAGE_WIDTH - 40, PAGE_HEIGHT - 40)]:
            canvas.setFillColor(GOLD)
            canvas.circle(x, y, 3, fill=1, stroke=0)

        canvas.restoreState()

    def _content_page(self, canvas, doc):
        """Draw content page header/footer."""
        canvas.saveState()

        # Header line
        canvas.setStrokeColor(DARK_BLUE)
        canvas.setLineWidth(1)
        canvas.line(LEFT_MARGIN, PAGE_HEIGHT - 0.5 * inch, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 0.5 * inch)

        # Header text
        canvas.setFont("TNR", 8)
        canvas.setFillColor(DARK_GRAY)
        canvas.drawString(LEFT_MARGIN, PAGE_HEIGHT - 0.45 * inch, "DEITIES & DEMIGODS CODEX")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 0.45 * inch, "Complete Compendium of Mythworld")

        # Footer
        canvas.setStrokeColor(DARK_BLUE)
        canvas.line(LEFT_MARGIN, 0.55 * inch, PAGE_WIDTH - RIGHT_MARGIN, 0.55 * inch)

        canvas.setFont("TNR", 8)
        canvas.setFillColor(DARK_GRAY)
        canvas.drawCentredString(PAGE_WIDTH / 2, 0.4 * inch, f"Page {doc.page}")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, 0.4 * inch, "Z.ai")

        canvas.restoreState()


# ==============================================================================
# TOC DOCUMENT TEMPLATE
# ==============================================================================
class TocDocTemplate(CodexDocTemplate):
    """Template that also supports multiBuild with TOC."""

    def __init__(self, filename, **kw):
        CodexDocTemplate.__init__(self, filename, **kw)
        self._toc = None
        self._page_count_offset = 0

    def afterFlowable(self, flowable):
        """Register TOC entries when flowables have bookmark."""
        if self._toc is None:
            return
        if isinstance(flowable, BookmarkParagraph):
            key = flowable._bookmarkName
            if key:
                level = flowable._bookmarkLevel
                pageNum = self.page
                self._toc.notify('TOCEntry', (level, key, pageNum))

    def beforeDocument(self):
        """Called before document build."""
        self._page_count_offset = 0

    def afterPage(self):
        """Called after each page."""
        pass


# ==============================================================================
# DATA DEFINITIONS
# ==============================================================================

# --- Greater Gods Data (43 antagonists) ---
GREATER_GODS = {
    "Greek": [
        ("Zeus", "King of the Gods", "Greek", "CN", 400, -5, 95, "Sky, Thunder, Law", "Thunderbolt"),
        ("Hera", "Queen of the Gods", "Greek", "N", 300, 2, 50, "Marriage, Women", "Peacock"),
        ("Athena", "Goddess of Wisdom", "Greek", "LG", 329, -2, 80, "Wisdom, War, Crafts", "Owl"),
        ("Ares", "God of War", "Greek", "CE", 333, -2, 59, "War, Bloodshed", "Spear"),
        ("Apollo", "God of Light", "Greek", "NG", 390, -2, 70, "Light, Music, Prophecy", "Lyre"),
        ("Poseidon", "God of the Sea", "Greek", "CN", 390, 3, 75, "Sea, Earthquakes", "Trident"),
        ("Hades", "Lord of the Dead", "Greek", "LE", 400, -4, 80, "Death, Underworld", "Bident"),
        ("Hermes", "Messenger of the Gods", "Greek", "N", 340, 2, 35, "Travel, Trade, Thieves", "Caduceus"),
        ("Aphrodite", "Goddess of Love", "Greek", "NG", 350, 0, 60, "Love, Beauty", "Dove"),
    ],
    "Norse": [
        ("Odin", "All-Father", "Norse", "NG", 400, -6, 85, "Wisdom, War, Poetry", "Raven"),
        ("Thor", "God of Thunder", "Norse", "CG", 399, 4, 80, "Thunder, Strength", "Mjolnir"),
        ("Loki", "Trickster God", "Norse", "CE", 300, -4, 75, "Mischief, Fire", "Flame"),
        ("Hel", "Goddess of Death", "Norse", "NE", 350, -5, 95, "Death, Underworld", "Skull"),
        ("Freya", "Goddess of Love and War", "Norse", "NG", 339, -3, 80, "Love, Fertility, War", "Cat"),
        ("Tyr", "God of Justice", "Norse", "LG", 380, -5, 25, "Law, Justice, War", "Sword"),
        ("Balder", "God of Light", "Norse", "NG", 388, -4, 75, "Light, Beauty, Purity", "Sun Wheel"),
    ],
    "Egyptian": [
        ("Ra", "Sun God", "Egyptian", "LG", 400, -2, 95, "Sun, Creation", "Sun Disk"),
        ("Osiris", "Lord of the Underworld", "Egyptian", "LG", 400, -4, 80, "Death, Resurrection", "Crook & Flail"),
        ("Isis", "Goddess of Magic", "Egyptian", "LG", 350, -2, 75, "Magic, Motherhood", "Throne"),
        ("Set", "God of Chaos", "Egyptian", "LE", 378, -4, 59, "Chaos, Desert, Storm", "Set Animal"),
        ("Thoth", "God of Knowledge", "Egyptian", "N", 389, -4, 98, "Knowledge, Writing", "Ibis"),
        ("Ptah", "God of Crafts", "Egyptian", "LN", 390, -4, 70, "Crafts, Creation", "Ankh"),
    ],
    "Indian": [
        ("Shiva", "The Destroyer", "Indian", "N", 450, -10, 90, "Destruction, Dance", "Trident"),
        ("Vishnu", "The Preserver", "Indian", "LG", 389, -5, 85, "Preservation, Order", "Discus"),
        ("Indra", "King of the Devas", "Indian", "CN", 400, -12, 80, "Storm, War", "Vajra"),
        ("Rudra", "God of Storms", "Indian", "LN", 344, -2, 25, "Storm, Hunt", "Arrow"),
    ],
    "Celtic": [
        ("The Dagda", "Father of the Gods", "Celtic", "N", 400, -4, 80, "Druidry, Fertility", "Club"),
        ("Lugh", "Master of All Skills", "Celtic", "N", 375, 0, 90, "Skills, Light, War", "Spear"),
        ("Silvanus", "Forest God", "Celtic", "N", 333, -4, 30, "Nature, Forests", "Oak Leaf"),
    ],
    "Central American": [
        ("Quetzalcoatl", "Feathered Serpent", "Central American", "NG", 400, -8, 90, "Wind, Learning", "Feathered Serpent"),
        ("Tezcatlipoca", "Smoking Mirror", "Central American", "CE", 400, -6, 85, "Night, Sorcery, War", "Obsidian Mirror"),
        ("Tlaloc", "God of Rain", "Central American", "N", 400, -4, 65, "Rain, Fertility", "Goggle Eyes"),
    ],
    "Finnish": [
        ("Ukko", "Sky God", "Finnish", "LG", 400, -2, 85, "Sky, Thunder", "Thunderbolt"),
        ("Ahto", "God of the Sea", "Finnish", "NG", 324, 2, 100, "Sea, Waters", "Fish"),
    ],
    "Japanese": [
        ("Amaterasu", "Sun Goddess", "Japanese", "LG", 400, -2, 85, "Sun, Imperial Line", "Mirror"),
        ("Izanagi", "Creator God", "Japanese", "LG", 375, -3, 70, "Creation, Life", "Spear"),
    ],
    "Babylonian": [
        ("Marduk", "King of the Gods", "Babylonian", "LN", 350, 1, 50, "Justice, Magic", "Spade"),
    ],
    "Nehwon": [
        ("Kos", "The Unknowable", "Nehwon", "N", 377, -4, 35, "Fate, Mystery", "Hooded Figure"),
        ("Death", "Lord of Death", "Nehwon", "N", 350, -5, 95, "Death, Endings", "Scythe"),
    ],
    "Nonhuman": [
        ("Moradin", "Soul Forger", "Nonhuman", "LG", 400, -7, 80, "Dwarves, Crafting", "Hammer"),
        ("Corellon Larethian", "Creator of Elves", "Nonhuman", "CG", 400, -5, 90, "Elves, Arts, Magic", "Moonbow"),
        ("Gruumsh", "One-Eye", "Nonhuman", "LE", 350, -3, 75, "Orcs, War, Slaughter", "Spear"),
    ],
    "Melnibonean": [
        ("Arioch", "Knight of Swords", "Melnibonean", "CE", 350, -3, 70, "Chaos, Swords", "Black Sword"),
    ],
    "Cthulhu": [
        ("Cthulhu", "Great Old One", "Cthulhu", "CE", 400, -6, 85, "Madness, Depths", "Tentacle"),
        ("Nyarlathotep", "Crawling Chaos", "Cthulhu", "CE", 350, -4, 85, "Deception, Knowledge", "Shadow"),
    ],
}

# --- Super Monsters (9) ---
MONSTERS = [
    ("Fenris", "Great Wolf", "Norse", "CE", 350, -4, 80, "Devourer of Odin"),
    ("Jormungandr", "World Serpent", "Norse", "CE", 400, -3, 75, "Midgard encircler"),
    ("Cerberus", "Hound of Hades", "Greek", "NE", 200, -1, 40, "Guardian of Underworld"),
    ("Apep", "Serpent of Chaos", "Egyptian", "CE", 300, -2, 60, "Enemy of Ra"),
    ("Spawn of Cthulhu", "Star-Spawn", "Cthulhu", "CE", 200, -1, 45, "Servant of the Deep"),
    ("Cyan Bloodbane", "Blue Dragon", "Krynn", "LE", 280, -5, 55, "Slayer of Silvanesti"),
    ("Lord Soth", "Death Knight", "Krynn", "LE", 300, -8, 85, "Knight of the Black Rose"),
    ("Malystryx", "Red Dragon Overlord", "Krynn", "CE", 450, -6, 60, "Supreme dragon lord"),
    ("Khellendros", "Blue Dragon Overlord", "Krynn", "LE", 400, -5, 55, "Lord of Skulls"),
]

# --- Shards of Power (28) ---
SHARDS = [
    ("The Pale Shard", "Primordial", "Favors any god; neutral alignment amplifier", "The first fracture of creation itself"),
    ("The First Crack", "Primordial", "Favors chaotic gods; disrupts order and stability", "Born when law and chaos first split"),
    ("The Splinter of Before", "Primordial", "Favors elder gods; contains pre-time memories", "A fragment from before existence began"),
    ("The Yggdrasil Wound", "Norse", "Favors Norse pantheon; channels world-tree power", "Formed when Yggdrasil was wounded"),
    ("The Eye of Cronos", "Greek", "Favors Greek Titans and Olympians; divine sight", "Plucked from the Titan lord himself"),
    ("The Gorgon's Tear", "Greek", "Favors chthonic gods; petrification resistance", "Wept by Medusa at the moment of death"),
    ("The Feather of Ma'at", "Egyptian", "Favors Egyptian pantheon; bonus to lawful gods", "Dropped by Ma'at during the weighing"),
    ("The First Sunrise", "Egyptian", "Favors Ra and solar deities; solar empowerment", "Solidified light from Ra's first dawn"),
    ("The Dreamer's Fragment", "Cthulhu", "Favors Great Old Ones; high risk of summoning", "Shard of the sleeping god's dream"),
    ("The Nameless Mist", "Cthulhu", "Favors Outer Gods; planar traversal hazard", "Condensed form of nameless void"),
    ("The Black Rune Shard", "Melnibonean", "Favors Chaos Lords; destabilizes reality", "A rune of pure chaos made solid"),
    ("The Last Dragon's Heart", "Melnibonean", "Favors Law; crystallized draconic essence", "Heart-stone of the final dragon"),
    ("The Rat King's Crown", "Nehwon", "Favors neutral gods and tricksters; luck manipulation", "Crown fragment of Lankhmar's rat god"),
    ("The Skah Jordan Fragment", "Nehwon", "Favors thief gods and luck deities; fortune twisting", "Broken piece of the luck stone"),
    ("The Cauldron's Chip", "Celtic", "Favors Celtic Tuatha De Danann; regeneration", "Chipped from the Dagda's cauldron"),
    ("The Stone of Destiny's Splinter", "Celtic", "Favors lawful Celtic gods; sovereignty magic", "From the Lia Fail itself"),
    ("The Tenth Avatar's Tear", "Indian", "Favors Indian pantheon; Trimurti blessing", "Wept by Vishnu awaiting his tenth form"),
    ("The Jade Emperor's Reflection", "Chinese", "Favors Chinese Celestial Bureaucracy; mandate power", "Mirror shard of heaven's emperor"),
    ("Amaterasu's Hidden Spark", "Japanese", "Favors Japanese kami; solar deities; hidden light", "Spark hidden in the celestial cave"),
    ("Quetzalcoatl's Shed Scale", "Central American", "Favors Aztec/Mayan pantheon; good-aligned gods", "A scale from the Feathered Serpent"),
    ("Marduk's Tablet Shard", "Babylonian", "Favors Babylonian pantheon; lawful gods; divine law", "Fragment of the Tablets of Destiny"),
    ("The Graygem Fragment", "Krynn", "Favors Krynn pantheon; chaotic outcomes; wild magic", "Shard of the Graygem of Gargath"),
    ("The Blue Crystal Splinter", "Krynn", "Favors Mishakal; healing; good-aligned gods", "Crystal of Mishakal's healing light"),
    ("The Dragonlance Shard", "Krynn", "Favors Paladine; Huma's legacy; dragon-slaying", "Forged in the Dragonlance itself"),
    ("The Blood of the Conclave", "Krynn", "Favors Solinari/Lunitari/Nuitari equally; demands balance", "Blood oath of the three moons"),
    ("Takhisis's Broken Crown", "Krynn", "Favors Takhisis; evil dragons; shadow magic", "Fragment of the Dark Queen's crown"),
    ("The Knighthood's Honor", "Krynn", "Favors Paladine; Kiri-Jolith; Solamnic Knights", "Crystallized oath of the Solamnic"),
    ("The Kender's Curiosity", "Krynn", "Favors Branchala; kender luck; chaos", "Impossible object from a kender's pouch"),
    ("The Tower of Wayreth's Key", "Krynn", "Favors the Conclave; planar travel; unlocking secrets", "Key fragment from the Tower of High Sorcery"),
    ("Fistandantilus's Last Memory", "Krynn", "Favors dark magic; undead; forbidden knowledge", "Final memory of the great archmage"),
]

# --- Prophecies (9) ---
PROPHECIES = [
    {
        "name": "The Bearer's Burden",
        "theme": "Sacrifice",
        "riddle": "What is given freely yet costs more than gold? What binds the soul yet sets it free? The weight you carry is not the shard, but the knowing of its price.",
        "act1_hint": "The bearer begins to sense a growing exhaustion that sleep cannot cure.",
        "act2_manifestation": "Physical toll becomes visible; allies notice the bearer aging or weakening.",
        "act3_resolution": "The bearer must choose: sacrifice the shard's power or sacrifice part of themselves permanently.",
    },
    {
        "name": "The Bloodline Awakens",
        "theme": "Heritage",
        "riddle": "Your father's eyes look out from ancient stone. Your mother's voice echoes in halls you've never known. The blood remembers what the mind forgot.",
        "act1_hint": "Strange recognition when encountering certain deities or locations.",
        "act2_manifestation": "Divine parent reveals themselves through visions and dreams.",
        "act3_resolution": "The PC must accept or reject their divine heritage, reshaping their destiny.",
    },
    {
        "name": "The Betrayer's Path",
        "theme": "Treachery and Redemption",
        "riddle": "Once you stood where shadows stand. Once you served the iron hand. The mirror shows a face you knew - will you walk that road anew?",
        "act1_hint": "The PC discovers they once served the campaign's antagonist.",
        "act2_manifestation": "Old allies of the antagonist recognize the PC; memories begin to surface.",
        "act3_resolution": "The PC must choose: return to the villain's side or forge a new path.",
    },
    {
        "name": "The Deathless One",
        "theme": "Reincarnation",
        "riddle": "Eleven times the candle burns, eleven times the page still turns. Each death a lesson, each birth a loss. What remains when all else is forgotten?",
        "act1_hint": "The PC experiences flashes of dying in different eras and forms.",
        "act2_manifestation": "After each death, the PC resurrects but loses memories of their past life.",
        "act3_resolution": "In the final death, all memories return at once, granting immense power.",
    },
    {
        "name": "The Oracle's Choice",
        "theme": "Free Will vs Fate",
        "riddle": "All roads lead to the same mountain. All rivers meet the same dark sea. But the traveler who sees the destination may yet choose not to walk.",
        "act1_hint": "Prophecies begin to come true around the PC, suggesting inevitability.",
        "act2_manifestation": "The PC learns their predicted fate and that all paths lead there.",
        "act3_resolution": "The PC discovers that the act of defiance itself is the fulfillment.",
    },
    {
        "name": "The Nameless One",
        "theme": "Identity",
        "riddle": "Before the shard, there was no before. Before the name, there was no one. You are the question wearing the mask of an answer.",
        "act1_hint": "The PC has no memory of anything before finding the shard.",
        "act2_manifestation": "Others seem to recognize the PC, calling them by different names.",
        "act3_resolution": "The PC discovers they were created by the shard itself, not born.",
    },
    {
        "name": "The Last Defender",
        "theme": "Protection",
        "riddle": "You will hold the line when all others fall. You will stand between the darkness and the light. But the shield that saves all others cannot save its bearer.",
        "act1_hint": "The PC develops an uncanny ability to protect allies in combat.",
        "act2_manifestation": "Each protection comes at a personal cost that accumulates.",
        "act3_resolution": "The PC succeeds in saving everyone but cannot save themselves - unless allies intervene.",
    },
    {
        "name": "The Unwritten",
        "theme": "Defiance",
        "riddle": "The blank page cannot be read. The empty road cannot be mapped. Those who seek your fate find only silence where your story should be.",
        "act1_hint": "Oracles and divination spells fail when targeting the PC.",
        "act2_manifestation": "Enemies cannot predict the PC's actions; the PC becomes unpredictable.",
        "act3_resolution": "The PC's freedom from fate allows them to break a cosmic rule others cannot.",
    },
    {
        "name": "The Chosen One",
        "theme": "Misdirection",
        "riddle": "You are not the one. You are the road they walk. You are not the answer - you are the question that makes the answer possible.",
        "act1_hint": "The PC is told they are the prophesied hero, but nothing feels right.",
        "act2_manifestation": "The real chosen one emerges - someone the PC has been guiding.",
        "act3_resolution": "The PC realizes their role was to prepare the true chosen one all along.",
    },
]

# --- Injuries (28, grouped by type) ---
INJURIES = {
    "Physical (8)": [
        ("Deep Cut", "Physical", "Bleeding; -2 to attacks until treated", "Healing potion or DC 12 Medicine"),
        ("Bruised Ribs", "Physical", "-1 to all physical checks; pain on exertion", "1 week rest or Cure Light Wounds"),
        ("Concussion", "Physical", "Disorientation; -2 to Perception and Initiative", "DC 14 Medicine or magical healing"),
        ("Crushed Hand", "Physical", "Cannot use one hand; -4 to attacks with that hand", "Regeneration or DC 16 Heal check"),
        ("Broken Limb", "Physical", "Movement halved or arm disabled; -3 to related checks", "Magical healing or 4 weeks rest + splint"),
        ("Internal Bleeding", "Physical", "1d6 damage per hour; death in 24 hours untreated", "Greater Healing or DC 18 Surgery"),
        ("Lacerated Eye", "Physical", "-4 to ranged attacks; half blind; -2 Perception", "Regeneration spell only"),
        ("Severed Tendon", "Physical", "Movement reduced to crawl or arm unusable", "Regeneration or Heal spell"),
    ],
    "Magical (6)": [
        ("Arcane Burn", "Magical", "Spellcasting disrupted; -2 to spell attack rolls", "Dispel Magic or 1 day rest"),
        ("Soul Fracture", "Magical", "Cannot be healed by normal means; -1 max HP per level", "Restoration spell or Wish"),
        ("Planar Taint", "Magical", "Random magical surges; unstable magic", "Dispel Magic + Remove Curse"),
        ("Mana Drain", "Magical", "No spellcasting for 1d4 hours; fatigue", "Potion of Arcane Restoration"),
        ("Eldritch Corrosion", "Magical", "Magic items have 50% failure chance; permanent until cured", "Limited Wish or specific ritual"),
        ("Spellscar", "Magical", "Glows faintly; attracts hostile magic; +2 to one school", "Cannot be removed; becomes a feature"),
    ],
    "Poison (6)": [
        ("Weak Poison", "Poison", "-1 to all rolls for 1 hour", "DC 12 Con save or antitoxin"),
        ("Necrotic Venom", "Poison", "2d6 necrotic damage; prevents healing", "Greater Restoration or specific antidote"),
        ("Paralytic Toxin", "Poison", "Paralysis for 2d4 rounds", "DC 14 Con save each round"),
        ("Blood Toxin", "Poison", "Strength drain; -1d4 Strength per hour", "Neutralize Poison + Heal"),
        ("Mind Poison", "Poison", "Hallucinations; -2 to Wis saves", "Greater Restoration"),
        ("Acid Burn", "Poison", "2d6 acid damage; equipment degradation", "Heal spell + equipment repair"),
    ],
    "Psionic (6)": [
        ("Mental Fatigue", "Psionic", "Cannot concentrate; -2 to Int and Wis checks", "8 hours rest or psychic healing"),
        ("Psychic Trauma", "Psionic", "Random panic attacks; flashbacks to traumatic event", "Greater Restoration or long therapy"),
        ("Mind Bleed", "Psionic", "Telepathic leakage; others hear surface thoughts", "Psychic surgery or Mind Blank"),
        ("Ego Fracture", "Psionic", "Personality shifts; may act against alignment", "Restoration + atonement"),
        ("Thought Burn", "Psionic", "Psionic abilities weakened; takes 2x effort", "Psionic healing or 1 week rest"),
        ("Psionic Shock", "Psionic", "Unconscious 1d6 hours; all abilities suppressed", "Heal + Restoration"),
    ],
    "Cursed (2)": [
        ("Cursed Wound", "Cursed", "Will not close; bleeds continuously; no natural healing", "Remove Curse + Heal"),
        ("Divine Mark", "Cursed", "Branded by a deity; affected by their domain; visible", "Atonement + quest for the deity"),
    ],
}

# --- Items & Equipment (35) ---
ITEMS = [
    ("Dragonlance", "Weapon", "Legendary", "+3 vs dragons; double damage to evil dragons", 25000),
    ("Sword of Kiri-Jolith", "Weapon", "Legendary", "+3 holy avenger; smites evil on crit", 22000),
    ("Hammer of Kitiara", "Weapon", "Very Rare", "+2 battleaxe; extra attack vs good creatures", 18000),
    ("Staff of Magius", "Magic Focus", "Legendary", "+4 spell attacks; absorbs 1 spell per round", 20000),
    ("Crown of Horn", "Headgear", "Artifact", "Dominates dragons; +6 Charisma vs dragons", 50000),
    ("Shield of Paladine", "Shield", "Very Rare", "+3 AC; reflects magic missiles", 15000),
    ("Wand ofSilvanesti", "Wand", "Rare", "Casts Entangle and Speak with Plants 3/day", 8000),
    ("Ring of High Sorcery", "Ring", "Very Rare", "+2 spell save DC; stores 3 spell levels", 12000),
    ("Boots of Elvenkind", "Footwear", "Rare", "Silent movement; +10 to Stealth", 5000),
    ("Cloak of the Graymouser", "Cloak", "Legendary", "Invisibility at will; +4 to all DEX checks", 16000),
    ("Gauntlets of Ogremight", "Gloves", "Very Rare", "Strength set to 21; +4 unarmed damage", 14000),
    ("Girdle of Giant Strength", "Belt", "Legendary", "Strength set to 25; resize to Large", 18000),
    ("Helm of Telepathy", "Headgear", "Rare", "Read thoughts 60 ft; cast Detect Thoughts at will", 6000),
    ("Bracers of Archery", "Wristwear", "Uncommon", "+2 to bow attacks; double arrow damage on crit", 3000),
    ("Robes of the Archmagi", "Armor", "Artifact", "AC 15; +2 spell save; resistance to all magic", 45000),
    ("Amulet of Proof against Detection", "Amulet", "Very Rare", "Immune to divination; cannot be scried", 13000),
    ("Brooch of Shielding", "Accessory", "Rare", "Absorbs 50 points of magic missile damage", 4000),
    ("Medallion of Faith", "Amulet", "Uncommon", "+2 to saves vs charm and fear", 2000),
    ("Potion of Greater Healing", "Consumable", "Uncommon", "Restores 4d4+4 hit points", 500),
    ("Elixir of Dragon Breath", "Consumable", "Rare", "Grants dragon breath weapon (3d6) for 1 hour", 1500),
    ("Scroll of Protection from Evil", "Scroll", "Uncommon", "10-ft radius; evil creatures cannot enter", 300),
    ("Stone of Good Luck", "Wondrous", "Rare", "+1 to all saves and checks", 5000),
    ("Ioun Stone (Scarlet)", "Wondrous", "Very Rare", "+2 to Constitution; regenerates 1 HP/round", 12000),
    ("Bag of Holding (Type IV)", "Container", "Rare", "Holds 1,500 lbs; 2,500 cu ft interior", 2000),
    ("Horn of Valhalla (Silver)", "Wondrous", "Very Rare", "Summons 2d4+2 berserkers", 14000),
    ("Figurine of Wondrous Power", "Wondrous", "Rare", "Becomes a creature for up to 1 hour/day", 7000),
    ("Tome of Clear Thought", "Book", "Very Rare", "+2 Intelligence; can be used once by non-wizards", 16000),
    ("Deck of Many Things", "Deck", "Artifact", "Draw cards for random powerful effects", 30000),
    ("Orb of Dragonkind", "Wondrous", "Artifact", "Controls dragons of one type; summons 1d4 dragons", 55000),
    ("Crystal Ball", "Wondrous", "Very Rare", "Cast Scrying at will; 120 ft range", 11000),
    ("Mirror of Mental Prowess", "Wondrous", "Legendary", "Cast Clairvoyance, Legend Lore, and Commune", 20000),
    ("Bowl of Commanding Water Elementals", "Wondrous", "Very Rare", "Summons 1d4 water elementals", 12000),
    ("Brazier of Commanding Fire Elementals", "Wondrous", "Very Rare", "Summons 1d4 fire elementals", 12000),
    ("Censer of Controlling Air Elementals", "Wondrous", "Very Rare", "Summons 1d4 air elementals", 12000),
    ("Stone of Controlling Earth Elementals", "Wondrous", "Very Rare", "Summons 1d4 earth elementals", 12000),
]

# --- Pantheon Summary ---
PANTHEONS = [
    ("Greek", 9, "Olympian gods of mythology, rulers of sky, sea, and underworld"),
    ("Norse", 7, "Aesir and Vanir, warriors of Asgard and keepers of fate"),
    ("Egyptian", 6, "Gods of the Nile, keepers of ma'at and cosmic balance"),
    ("Indian", 4, "Trimurti and Devas, cosmic forces of creation and destruction"),
    ("Celtic", 3, "Tuatha De Danann, nature gods of the ancient Celtic world"),
    ("Central American", 3, "Aztec and Mayan deities of sun, rain, and sacrifice"),
    ("Finnish", 2, "Gods of the Kalevala, spirits of sky, sea, and forest"),
    ("Japanese", 2, "Kami of Shinto, celestial beings of sun and creation"),
    ("Babylonian", 1, "Marduk and the Mesopotamian pantheon of justice and magic"),
    ("Nehwon", 2, "Gods of Fritz Leiber's Lankhmar, fate and death"),
    ("Nonhuman", 3, "Patron gods of dwarves, elves, and other non-human races"),
    ("Melnibonean", 1, "Chaos Lords of the Eternal Champion saga"),
    ("Cthulhu", 2, "Great Old Ones and Outer Gods of cosmic horror"),
    ("Krynn (Dragonlance)", 12, "Gods of Dragonlance, the war between good and evil"),
    ("Arthurian", 8, "Knights and sorcerers of Camelot's golden age"),
    ("Chinese", 6, "Celestial Bureaucracy, gods of heaven and earth"),
    ("American Indian", 5, "Spirits and totems of the First Nations"),
]


# ==============================================================================
# BUILD DOCUMENT CONTENT
# ==============================================================================
def build_content(doc):
    """Build all content for the Codex PDF."""
    story = []
    toc = None  # will be set when TOC section is created

    # ==========================================================================
    # COVER PAGE
    # ==========================================================================
    story.append(Spacer(1, 120))
    story.append(Paragraph("DEITIES &amp; DEMIGODS", cover_title_style))
    story.append(Paragraph("CODEX", ParagraphStyle(
        "CoverTitle2", fontName="TNR-Bold", fontSize=48, leading=56,
        textColor=white, alignment=TA_CENTER, spaceAfter=20
    )))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="60%", thickness=2, color=GOLD, spaceBefore=8, spaceAfter=16))
    story.append(Paragraph("Complete Compendium of Mythworld", cover_subtitle_style))
    story.append(Spacer(1, 40))
    story.append(Paragraph("195+ Entities across 17 Pantheons", cover_info_style))
    story.append(Paragraph("Based on AD&amp;D 1st Edition Deities &amp; Demigods (1980)", cover_info_style))
    story.append(Paragraph("Including Dragonlance (Krynn) Expansion", cover_info_style))
    story.append(Spacer(1, 60))
    story.append(Paragraph("28 Shards of Power | 9 Prophecies | 28 Injuries | 35 Items", ParagraphStyle(
        "CoverStats", fontName="TNR", fontSize=10, leading=14,
        textColor=HexColor("#88AACC"), alignment=TA_CENTER, spaceAfter=6
    )))
    story.append(Spacer(1, 40))
    story.append(HRFlowable(width="40%", thickness=1, color=GOLD, spaceBefore=8, spaceAfter=8))
    story.append(Paragraph("In-Game Reference Guide", ParagraphStyle(
        "CoverFooter", fontName="TNR", fontSize=9, leading=12,
        textColor=HexColor("#667788"), alignment=TA_CENTER
    )))

    story.append(NextPageTemplate("Content"))
    story.append(PageBreak())

    # ==========================================================================
    # TABLE OF CONTENTS
    # ==========================================================================
    story.append(Paragraph("Table of Contents", chapter_title_style))
    story.append(chapter_hr())
    story.append(Spacer(1, 8))

    # Table of Contents
    from reportlab.platypus.tableofcontents import TableOfContents
    toc = TableOfContents()
    toc.levelStyles = [toc_h1_style, toc_h2_style]
    story.append(toc)

    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 1: INTRODUCTION
    # ==========================================================================
    story.append(BookmarkParagraph("Chapter 1: Introduction", chapter_title_style, bookmark="Chapter 1: Introduction"))
    story.append(chapter_hr())

    intro_text = [
        "Welcome to the Deities &amp; Demigods Codex, the definitive in-game reference for the Mythworld role-playing experience. "
        "This comprehensive compendium catalogs every entity, artifact, prophecy, injury, and item within the game universe, "
        "providing players and Dungeon Masters alike with a single, authoritative source of knowledge drawn from the rich "
        "traditions of AD&amp;D 1st Edition Deities &amp; Demigods (1980) and the beloved Dragonlance saga of Krynn.",

        "Within these pages lie the profiles of <b>195+ entities</b> drawn from <b>17 distinct pantheons</b>, spanning the breadth "
        "of human mythological imagination. From the thunderous halls of the Norse Aesir to the cosmic horrors of the Cthulhu "
        "mythos, from the celestial courts of the Chinese Celestial Bureaucracy to the enchanted forests of Celtic legend, "
        "this Codex encompasses the full spectrum of divine and mortal power that shapes the world of Mythworld.",

        "The Codex is organized into twelve chapters. Chapters 2 through 6 detail the pantheons and their inhabitants, "
        "categorized by power level: Greater Gods, Lesser Gods, Demigods, and Heroes. Each entity listing includes essential "
        "game statistics such as hit points, armor class, magic resistance, alignment, and domains of influence. Chapter 7 "
        "catalogs the terrifying monsters and super-beings that serve as adversaries, while Chapter 8 provides an in-depth "
        "overview of the Krynn pantheon from the Dragonlance setting.",

        "Beyond mere stat blocks, the Codex also details the mystical <b>28 Shards of Power</b> - fragments of divine essence "
        "that players may discover and wield throughout their adventures. These shards are tied to specific pantheons and carry "
        "unique powers and risks. The <b>9 Prophecies</b> weave narrative threads that connect player characters to the cosmic "
        "events unfolding across Mythworld, each with multi-act progression from subtle hints to world-shaking resolutions.",

        "The <b>Injury System</b> (Chapter 11) provides 28 distinct injuries across five categories - Physical, Magical, Poison, "
        "Psionic, and Cursed - adding depth and consequence to combat encounters. Finally, Chapter 12 catalogs <b>35 items and "
        "pieces of equipment</b> ranging from common consumables to legendary artifacts, complete with rarity classifications "
        "and gold piece values.",

        "Whether you are a veteran Dungeon Master planning an epic campaign or a player seeking to understand the vast "
        "tapestry of mythological forces at play, the Deities &amp; Demigods Codex is your essential companion. Use the "
        "Table of Contents and the detailed tables within each chapter to quickly locate the information you need. "
        "May your adventures be legendary, and may the gods favor your path.",
    ]

    for para in intro_text:
        story.append(Paragraph(para, body_style))

    # ==========================================================================
    # CHAPTER 2: THE PANTHEONS
    # ==========================================================================
    story.append(BookmarkParagraph("Chapter 2: The Pantheons", chapter_title_style, bookmark="Chapter 2: The Pantheons"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "The world of Mythworld is governed by <b>17 pantheons</b>, each representing a distinct mythological tradition. "
        "These pantheons range from the well-known Classical and Norse traditions to the esoteric Melnibonean and Cthulhu "
        "mythos, and from the structured Chinese Celestial Bureaucracy to the spirit-based American Indian traditions. "
        "Together, they form a divine ecosystem where gods compete for worship, territory, and influence over mortal affairs.",
        body_style
    ))
    story.append(Paragraph(
        "The total entity count across all pantheons exceeds <b>195 beings</b>, including Greater Gods, Lesser Gods, "
        "Demigods, Heroes, and Super Monsters. Each pantheon has its own internal hierarchy, alliances, and rivalries "
        "that shape the political landscape of the divine realm. The table below summarizes each pantheon with its "
        "entity count and a brief description of its mythological focus.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Pantheon summary table
    pantheon_headers = [
        make_header_cell("Pantheon"),
        make_header_cell("Entities"),
        make_header_cell("Description"),
    ]
    pantheon_data = [pantheon_headers]
    for name, count, desc in PANTHEONS:
        pantheon_data.append([
            make_name_cell(name),
            make_cell(str(count)),
            make_cell(desc, center=False),
        ])

    col_w = [1.3 * inch, 0.7 * inch, 4.7 * inch]
    pantheon_tbl = build_table(pantheon_data, col_w)
    story.append(pantheon_tbl)

    # ==========================================================================
    # CHAPTER 3: GREATER GODS
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 3: Greater Gods", chapter_title_style, bookmark="Chapter 3: Greater Gods"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "Greater Gods are the most powerful beings in the Mythworld cosmology. They command near-absolute authority within "
        "their domains, possess hit points ranging from 300 to 450, and exhibit magic resistance from 25% to 100%. These "
        "entities are not mere opponents; they are cosmic forces that shape reality itself. A total of <b>43 Greater Gods</b> "
        "span the pantheons, with the Greek and Norse traditions boasting the largest representation. The table below "
        "provides a complete statistical overview of all Greater God antagonists, organized by pantheon.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Greater Gods table - grouped by pantheon
    gg_headers = [
        make_header_cell("Name"),
        make_header_cell("Title"),
        make_header_cell("Pantheon"),
        make_header_cell("Align"),
        make_header_cell("HP"),
        make_header_cell("AC"),
        make_header_cell("MR%"),
        make_header_cell("Domain"),
        make_header_cell("Symbol"),
    ]
    gg_data = [gg_headers]

    for pantheon_name, gods in GREATER_GODS.items():
        # Add group header row
        group_row = make_group_row(f"{pantheon_name} ({len(gods)} gods)", len(gg_headers))
        gg_data.append(group_row)
        for name, title, pan, align, hp, ac, mr, domain, symbol in gods:
            gg_data.append([
                make_name_cell(name),
                make_cell(title, center=False),
                make_cell(pan),
                make_cell(align),
                make_cell(str(hp)),
                make_cell(str(ac)),
                make_cell(str(mr)),
                make_cell(domain, center=False),
                make_cell(symbol, center=False),
            ])

    gg_col_w = [1.05 * inch, 1.0 * inch, 0.75 * inch, 0.4 * inch, 0.35 * inch, 0.3 * inch, 0.3 * inch, 1.3 * inch, 0.75 * inch]
    gg_tbl = build_table(gg_data, gg_col_w, has_group_rows=True)
    story.append(gg_tbl)

    # ==========================================================================
    # CHAPTER 4: LESSER GODS
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 4: Lesser Gods", chapter_title_style, bookmark="Chapter 4: Lesser Gods"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "Lesser Gods occupy the middle tier of the divine hierarchy in Mythworld. While not possessing the overwhelming "
        "power of Greater Gods, they are nonetheless formidable beings with significant influence over specific aspects "
        "of mortal life and the natural world. Lesser Gods typically have hit points in the range of 200-350, moderate "
        "to high magic resistance, and command narrower domains than their Greater counterparts.",
        body_style
    ))
    story.append(Paragraph(
        "This category includes well-known deities such as <b>Artemis</b> (Greek Goddess of the Hunt), <b>Bragi</b> (Norse God "
        "of Poetry), <b>Bast</b> (Egyptian Cat Goddess), <b>Dionysus</b> (Greek God of Wine), <b>Hephaestus</b> (Greek God of "
        "the Forge), <b>Huitzilopochtli</b> (Aztec God of War), and <b>Morrigan</b> (Celtic War Goddess). Nonhuman pantheon "
        "Lesser Gods include <b>Lolth</b> (Spider Queen of the Drow), <b>Mielikki</b> (Elven Goddess of Forests), and <b>Sekolah</b> "
        "(Shark God of the Sahuagin). The Cthulhu mythos contributes <b>Shub-Niggurath</b> (The Black Goat of the Woods) "
        "and <b>Nyarlahotep</b> in his Lesser aspect.",
        body_style
    ))
    story.append(Paragraph(
        "Lesser Gods serve as patrons for specific character classes, alignment choices, and cultural backgrounds. "
        "They are often the most accessible deities for player characters to interact with, as their narrower domains "
        "make them more relatable and their power level more appropriate for mid-to-high level campaigns. Clerics and "
        "paladins may choose a Lesser God as their patron, gaining domain-specific spells and abilities in exchange "
        "for role-playing obligations and quest requirements.",
        body_style
    ))

    # ==========================================================================
    # CHAPTER 5: DEMIGODS
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 5: Demigods", chapter_title_style, bookmark="Chapter 5: Demigods"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "Demigods represent the lowest rung of the divine ladder, though they are still far more powerful than any "
        "mortal. These beings typically have one divine parent and one mortal parent, granting them a fraction of "
        "celestial power while maintaining a connection to the mortal world. Their hit points generally range from "
        "150 to 300, with magic resistance varying widely based on their divine heritage.",
        body_style
    ))
    story.append(Paragraph(
        "Notable Demigods in the Mythworld include <b>Heracles</b> (Greek, son of Zeus), <b>Anubis</b> (Egyptian God of "
        "Embalming), <b>Kali</b> (Indian Goddess of Destruction), <b>Karttikeya</b> (Indian God of War), <b>Susanowo</b> "
        "(Japanese Storm God), <b>Hachiman</b> (Japanese God of War), and <b>Loviatar</b> (Finnish Goddess of Pain and "
        "Disease). From the Cthulhu mythos, <b>Ithaqua</b> (the Wind-Walker) and <b>Hastur</b> (the Unspeakable One) "
        "appear in demigod form.",
        body_style
    ))
    story.append(Paragraph(
        "Demigods are often the primary antagonists or quest-givers in mid-level campaigns. They are powerful enough "
        "to pose a serious challenge to an adventuring party, yet not so overwhelmingly strong as to be unbeatable. "
        "Their dual nature makes them compelling narrative figures - they often struggle with their identity, torn "
        "between their divine heritage and mortal limitations. Player characters who discover demigod ancestry may "
        "unlock unique abilities tied to their divine bloodline.",
        body_style
    ))

    # ==========================================================================
    # CHAPTER 6: HEROES
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 6: Heroes", chapter_title_style, bookmark="Chapter 6: Heroes"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "Heroes are the mortal champions of Mythworld - legendary figures whose deeds have earned them a place in "
        "the divine record despite lacking godhood. These are the warriors, wizards, and rogues whose stories are "
        "told across the ages, from the labors of Heracles to the quests of the Knights of the Round Table, from "
        "the wanderings of Odysseus to the defiant stand of Sturm Brightblade at the High Clerest Tower.",
        body_style
    ))
    story.append(Paragraph(
        "The Hero roster spans all pantheons. Greek heroes include <b>Heracles</b>, <b>Perseus</b>, <b>Theseus</b>, "
        "<b>Jason</b>, <b>Odysseus</b>, and <b>Bellerophon</b>. Norse legend contributes <b>Fafhrd</b> and the "
        "<b>Gray Mouser</b> (from the Nehwon tales). The Arthurian tradition brings <b>King Arthur</b>, <b>Lancelot</b>, "
        "<b>Galahad</b>, <b>Gawaine</b>, <b>Percival</b>, <b>Tristram</b>, <b>Morgan le Fay</b>, and <b>Merlin</b>. "
        "From the Dragonlance saga, Heroes include <b>Tanis Half-Elven</b>, <b>Raistlin Majere</b>, <b>Caramon Majere</b>, "
        "<b>Sturm Brightblade</b>, <b>Goldmoon</b>, <b>Riverwind</b>, <b>Tasslehoff Burrfoot</b>, <b>Flint Fireforge</b>, "
        "<b>Tika Waylan</b>, <b>Laurana</b>, and <b>Gilthanas</b>.",
        body_style
    ))
    story.append(Paragraph(
        "Heroes typically have hit points in the range of 50-200 and possess class-based abilities rather than divine "
        "powers. They serve as allies, rivals, mentors, or tragic figures in the narrative. Many Hero characters have "
        "specific story arcs tied to the Prophecies (Chapter 10), making them integral to the overarching campaign. "
        "Players may encounter Heroes as NPCs, or may themselves become Heroes through their actions and the acquisition "
        "of Shards of Power.",
        body_style
    ))

    # ==========================================================================
    # CHAPTER 7: MONSTERS
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 7: Monsters", chapter_title_style, bookmark="Chapter 7: Monsters"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "The Monsters chapter catalogs the most powerful and dangerous creatures in Mythworld. These are not ordinary "
        "beasts but legendary beings of extraordinary power - the Great Wolf Fenris who will devour Odin at Ragnarok, "
        "the World Serpent Jormungandr that encircles all of Midgard, the great blue dragon Cyan Bloodbane who "
        "devastated the elven nation of Silvanesti, and the supreme dragon overlord Malystryx whose power rivals "
        "that of the gods themselves.",
        body_style
    ))
    story.append(Paragraph(
        "In addition to the 9 Super Monsters listed below, the Codex recognizes 16+ standard monsters drawn from "
        "the Cthulhu mythos and other pantheons, including <b>Shoggoths</b>, <b>Deep Ones</b>, <b>Nightgaunts</b>, "
        "<b>Byakhee</b>, <b>Spawn of Cthulhu</b>, <b>Gugs</b>, <b>Ghasts</b>, <b>Mi-Go</b>, <b>Dark Young</b>, "
        "<b>Shadow Wights</b>, <b>Draconians</b>, <b>Thunder Birds</b>, <b>Blodug Hofi</b>, <b>Cerberus</b>, "
        "<b>Apep</b>, and the <b>Primordial One</b>. These creatures range from 100 to 450 hit points and present "
        "unique challenges beyond mere physical combat.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Monsters table
    monster_headers = [
        make_header_cell("Name"),
        make_header_cell("Type"),
        make_header_cell("Pantheon"),
        make_header_cell("Align"),
        make_header_cell("HP"),
        make_header_cell("AC"),
        make_header_cell("MR%"),
        make_header_cell("Special"),
    ]
    monster_data = [monster_headers]
    for name, mtype, pan, align, hp, ac, mr, special in MONSTERS:
        monster_data.append([
            make_name_cell(name),
            make_cell(mtype, center=False),
            make_cell(pan),
            make_cell(align),
            make_cell(str(hp)),
            make_cell(str(ac)),
            make_cell(str(mr)),
            make_cell(special, center=False),
        ])

    mon_col_w = [1.2 * inch, 0.95 * inch, 0.75 * inch, 0.4 * inch, 0.35 * inch, 0.3 * inch, 0.3 * inch, 2.1 * inch]
    mon_tbl = build_table(monster_data, mon_col_w)
    story.append(mon_tbl)

    # ==========================================================================
    # CHAPTER 8: THE KRYNN PANTHEON
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 8: The Krynn Pantheon", chapter_title_style, bookmark="Chapter 8: The Krynn Pantheon"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "The Krynn pantheon, drawn from the beloved Dragonlance saga created by Margaret Weis and Tracy Hickman, "
        "represents one of the most richly detailed mythological systems in all of fantasy literature. Set on the "
        "world of Krynn, this pantheon is defined by an eternal struggle between the forces of Good, Evil, and "
        "Neutrality, each represented by a trio of gods associated with the three moons of Krynn: Solinari (silver, "
        "good), Lunitari (red, neutral), and Nuitari (black, evil).",
        body_style
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Greater Gods of Krynn", section_heading_style))
    story.append(Paragraph(
        "The Greater Gods of Krynn include <b>Paladine</b> (the Platinum Dragon, god of good and the patron of the "
        "Solamnic Knights), <b>Takhisis</b> (the Dark Queen, goddess of evil and dragonlord of all evil dragons), "
        "and <b>Gilean</b> (the Grey Gem, god of neutrality and keeper of the Tobril). Supporting these triad heads "
        "are <b>Mishakal</b> (goddess of healing), <b>Habbakuk</b> (god of animal life and the sea), <b>Kiri-Jolith</b> "
        "(god of war and justice), <b>Sargonnas</b> (god of vengeance and destruction), <b>Chemosh</b> (god of the "
        "undead), <b>Zeboim</b> (goddess of storms and the sea), <b>Solinari</b>, <b>Lunitari</b>, <b>Nuitari</b>, "
        "<b>Branchala</b> (god of music), <b>Sirrion</b> (god of fire and natural power), <b>Reorx</b> (god of "
        "crafting), and <b>Shinare</b> (goddess of wealth and commerce).",
        body_style
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Heroes of Krynn", section_heading_style))
    story.append(Paragraph(
        "The Heroes of the Lance form the backbone of the Dragonlance narrative. <b>Tanis Half-Elven</b>, the "
        "reluctant leader torn between his human and elven heritage. <b>Raistlin Majere</b>, the ambitious and "
        "physically frail archmage whose hunger for power leads him down a dark path. <b>Caramon Majere</b>, "
        "Raistlin's warrior twin whose strength is matched only by his loyalty. <b>Sturm Brightblade</b>, the "
        "tragic knight whose honor and sacrifice define the spirit of the Solamnic Knighthood. <b>Goldmoon</b>, "
        "the Plainswoman who carries the Blue Crystal Staff and becomes the first true cleric of Mishakal in ages. "
        "<b>Riverwind</b>, her devoted companion. <b>Tasslehoff Burrfoot</b>, the irrepressible kender whose "
        "boundless curiosity and apparent cowardice hide a core of genuine heroism. <b>Flint Fireforge</b>, the "
        "gruff dwarven metalsmith whose tough exterior conceals a heart of gold. <b>Tika Waylan</b>, the innkeeper's "
        "daughter who becomes a warrior. <b>Laurana</b>, the elven princess who transforms from naive maiden to "
        "brilliant general. And <b>Gilthanas</b>, elven warrior and scholar.",
        body_style
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Krynn Monsters", section_heading_style))
    story.append(Paragraph(
        "Krynn is home to some of the most fearsome creatures in all of Mythworld. The dragon overlords - "
        "<b>Malystryx</b> (the Red), <b>Khellendros</b> (the Blue), and <b>Beryllinthranox</b> (the Green) - are "
        "ancient dragons of power rivaling the gods. <b>Cyan Bloodbane</b>, the great blue dragon who manipulated "
        "the Silvanesti elves for centuries. <b>Lord Soth</b>, the Death Knight of Dargaard Keep, whose tragic "
        "fall from grace created one of the most iconic villains in fantasy. The <b>Draconians</b>, dragon-men "
        "created from the eggs of good dragons, serve as the shock troops of the Dragonarmies. And the "
        "<b>Shadow Wights</b>, terrifying undead that drain not life but hope from their victims.",
        body_style
    ))

    # ==========================================================================
    # CHAPTER 9: THE 28 SHARDS OF POWER
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 9: The 28 Shards of Power", chapter_title_style, bookmark="Chapter 9: The 28 Shards of Power"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "The Shards of Power are fragments of divine essence scattered across the multiverse during the great cosmic "
        "fracture that shaped Mythworld. Each shard is tied to a specific pantheon and carries unique powers that can "
        "alter the fate of gods and mortals alike. There are <b>30 Shards of Power</b> in total (often referenced as 28 "
        "in common parlance, with two additional Krynn shards discovered in later chronicles), each one a potential "
        "campaign-defining artifact.",
        body_style
    ))
    story.append(Paragraph(
        "Shards are categorized by their pantheon of origin: <b>Primordial</b> (3 shards from before time itself), "
        "<b>Norse</b> (1), <b>Greek</b> (2), <b>Egyptian</b> (2), <b>Cthulhu</b> (2), <b>Melnibonean</b> (2), "
        "<b>Nehwon</b> (2), <b>Celtic</b> (2), <b>Indian</b> (1), <b>Chinese</b> (1), <b>Japanese</b> (1), "
        "<b>Central American</b> (1), <b>Babylonian</b> (1), and <b>Krynn</b> (9, reflecting the expanded Dragonlance "
        "content). Each shard favors certain gods when wielded, creating complex alliance dynamics.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Shards table
    shard_headers = [
        make_header_cell("#"),
        make_header_cell("Name"),
        make_header_cell("Pantheon"),
        make_header_cell("Power / Effect"),
        make_header_cell("Origin"),
    ]
    shard_data = [shard_headers]
    for i, (name, pantheon, power, origin) in enumerate(SHARDS, 1):
        shard_data.append([
            make_cell(str(i)),
            make_name_cell(name),
            make_cell(pantheon),
            make_cell(power, center=False),
            make_cell(origin, center=False),
        ])

    shard_col_w = [0.3 * inch, 1.3 * inch, 0.8 * inch, 2.5 * inch, 1.8 * inch]
    shard_tbl = build_table(shard_data, shard_col_w)
    story.append(shard_tbl)

    # ==========================================================================
    # CHAPTER 10: THE 9 PROPHECIES
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 10: The 9 Prophecies", chapter_title_style, bookmark="Chapter 10: The 9 Prophecies"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "The Prophecies of Mythworld are cosmic pronouncements that bind player characters to the unfolding narrative "
        "of the game. Each prophecy is tied to a specific theme and follows a three-act structure: a subtle hint in "
        "Act 1, a growing manifestation in Act 2, and a climactic resolution in Act 3. These prophecies are not "
        "merely flavor text - they actively shape the campaign, creating character arcs that intertwine with the "
        "larger conflict between the pantheons.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Prophecies table
    prophecy_headers = [
        make_header_cell("#"),
        make_header_cell("Name"),
        make_header_cell("Theme"),
        make_header_cell("Riddle (excerpt)"),
        make_header_cell("Act 1 Hint"),
        make_header_cell("Act 2 Manifestation"),
        make_header_cell("Act 3 Resolution"),
    ]
    prophecy_data = [prophecy_headers]
    for i, p in enumerate(PROPHECIES, 1):
        riddle_excerpt = p["riddle"][:200] + "..." if len(p["riddle"]) > 200 else p["riddle"]
        prophecy_data.append([
            make_cell(str(i)),
            make_name_cell(p["name"]),
            make_cell(p["theme"]),
            make_cell(riddle_excerpt, center=False),
            make_cell(p["act1_hint"], center=False),
            make_cell(p["act2_manifestation"], center=False),
            make_cell(p["act3_resolution"], center=False),
        ])

    # Use landscape-oriented widths for prophecy table
    proph_col_w = [0.25 * inch, 0.9 * inch, 0.7 * inch, 1.4 * inch, 1.1 * inch, 1.2 * inch, 1.1 * inch]
    proph_tbl = build_table(prophecy_data, proph_col_w)
    story.append(proph_tbl)

    # ==========================================================================
    # CHAPTER 11: INJURY SYSTEM
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 11: Injury System", chapter_title_style, bookmark="Chapter 11: Injury System"))
    story.append(chapter_hr())

    story.append(Paragraph(
        "The Injury System adds depth and consequence to combat encounters in Mythworld. Rather than simply losing "
        "hit points, characters may suffer specific injuries that impose lasting effects until properly treated. "
        "There are <b>28 injuries</b> divided across five categories: <b>Physical</b> (8 injuries), <b>Magical</b> (6), "
        "<b>Poison</b> (6), <b>Psionic</b> (6), and <b>Cursed</b> (2). Each injury has a specific effect and a "
        "corresponding cure, ranging from simple medicine checks to powerful restoration magic.",
        body_style
    ))
    story.append(Paragraph(
        "Physical injuries result from conventional combat - blades, blunt force, and crushing impacts. Magical "
        "injuries stem from exposure to arcane energy, planar forces, or eldritch corruption. Poison injuries "
        "are inflicted by venomous creatures, toxic substances, and alchemical agents. Psionic injuries affect "
        "the mind and are caused by psychic attacks, mind flayers, or planar entity contact. Cursed injuries "
        "are the most dangerous, as they often require divine intervention or specific quests to cure.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Injuries table (grouped by type)
    injury_headers = [
        make_header_cell("Name"),
        make_header_cell("Type"),
        make_header_cell("Effect"),
        make_header_cell("Cure"),
    ]
    injury_data = [injury_headers]

    for group_name, injuries in INJURIES.items():
        group_row = make_group_row(group_name, len(injury_headers))
        injury_data.append(group_row)
        for name, itype, effect, cure in injuries:
            injury_data.append([
                make_name_cell(name),
                make_cell(itype),
                make_cell(effect, center=False),
                make_cell(cure, center=False),
            ])

    inj_col_w = [1.2 * inch, 0.7 * inch, 2.6 * inch, 2.2 * inch]
    inj_tbl = build_table(injury_data, inj_col_w, has_group_rows=True)
    story.append(inj_tbl)

    # ==========================================================================
    # CHAPTER 12: ITEMS & EQUIPMENT
    # ==========================================================================
    story.append(Spacer(1, 12))
    story.append(BookmarkParagraph("Chapter 12: Items &amp; Equipment", chapter_title_style, bookmark="Chapter 12: Items & Equipment"))
    story.append(chapter_hr())

    # Count rarities
    rarity_counts = {}
    for _, _, rarity, _, _ in ITEMS:
        rarity_counts[rarity] = rarity_counts.get(rarity, 0) + 1

    story.append(Paragraph(
        "The Items &amp; Equipment chapter catalogs <b>35 items</b> available in the Mythworld game, ranging from "
        "common consumables to legendary artifacts of divine power. Items are classified by type (Weapon, Armor, "
        "Wondrous, etc.) and rarity, with gold piece values reflecting their power and scarcity.",
        body_style
    ))
    story.append(Paragraph(
        f"<b>Rarity Distribution:</b> Artifact ({rarity_counts.get('Artifact', 0)}), Legendary ({rarity_counts.get('Legendary', 0)}), "
        f"Very Rare ({rarity_counts.get('Very Rare', 0)}), Rare ({rarity_counts.get('Rare', 0)}), "
        f"Uncommon ({rarity_counts.get('Uncommon', 0)}), Common ({rarity_counts.get('Common', 0)}). "
        "Higher rarity items are typically found as quest rewards, in the hoards of powerful monsters, or "
        "within the ruins of ancient civilizations.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Items table
    item_headers = [
        make_header_cell("#"),
        make_header_cell("Name"),
        make_header_cell("Type"),
        make_header_cell("Rarity"),
        make_header_cell("Effect"),
        make_header_cell("Value (gp)"),
    ]
    item_data = [item_headers]
    for i, (name, itype, rarity, effect, value) in enumerate(ITEMS, 1):
        item_data.append([
            make_cell(str(i)),
            make_name_cell(name),
            make_cell(itype),
            make_cell(rarity),
            make_cell(effect, center=False),
            make_cell(f"{value:,}"),
        ])

    item_col_w = [0.3 * inch, 1.3 * inch, 0.7 * inch, 0.7 * inch, 2.7 * inch, 0.7 * inch]
    item_tbl = build_table(item_data, item_col_w)
    story.append(item_tbl)

    # Final separator
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=DARK_BLUE, spaceBefore=8, spaceAfter=8))
    story.append(Paragraph(
        "<i>End of the Deities &amp; Demigods Codex. May your adventures be legendary.</i>",
        ParagraphStyle("EndNote", fontName="TNR", fontSize=10, leading=14,
                       textColor=DARK_GRAY, alignment=TA_CENTER)
    ))

    return story, toc


# ==============================================================================
# MAIN
# ==============================================================================
def main():
    print("Generating Deities & Demigods Codex PDF...")
    print(f"Output: {OUTPUT_PATH}")

    # Create document
    doc = TocDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        title="Deities_Demigods_Codex",
        author="Z.ai",
        creator="Z.ai",
        subject="Complete Compendium of Mythworld - Deities & Demigods RPG",
    )

    # Build content
    story, toc = build_content(doc)

    # Wire up TOC to document template for multiBuild
    doc._toc = toc

    # Use multiBuild to resolve TOC (two passes)
    doc.multiBuild(story)

    # Check result
    if os.path.exists(OUTPUT_PATH):
        size = os.path.getsize(OUTPUT_PATH)
        print(f"\nSUCCESS! PDF generated:")
        print(f"  Path: {OUTPUT_PATH}")
        print(f"  Size: {size:,} bytes ({size/1024:.1f} KB)")

        # Count pages using PyPDF2
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(OUTPUT_PATH)
            pages = len(reader.pages)
            print(f"  Pages: {pages}")
        except Exception:
            print("  Pages: (unable to count)")
    else:
        print("ERROR: PDF was not generated!")
        import sys
        sys.exit(1)


if __name__ == "__main__":
    main()
