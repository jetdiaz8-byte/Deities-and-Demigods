#!/usr/bin/env python3
"""
Deities & Demigods Player's Handbook — PDF Generator
Uses reportlab to produce a professional multi-chapter handbook.
"""

import os, sys
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    Table, TableStyle, PageBreak, NextPageTemplate, KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ═══════════════════════════════════════════════════════════════════════════
# FONT REGISTRATION
# ═══════════════════════════════════════════════════════════════════════════
FONT_DIR = '/usr/share/fonts/truetype/english'
pdfmetrics.registerFont(TTFont('TNR', os.path.join(FONT_DIR, 'Times-New-Roman.ttf')))
pdfmetrics.registerFont(TTFont('TNRB', os.path.join('/usr/share/fonts/truetype/english', 'calibri-bold.ttf')))
pdfmetrics.registerFontFamily('TNR', normal='TNR', bold='TNRB', italic='TNR', boldItalic='TNRB')

FONT = 'TNR'
FONT_B = 'TNRB'

# ═══════════════════════════════════════════════════════════════════════════
# COLOURS
# ═══════════════════════════════════════════════════════════════════════════
DARK_GREEN   = HexColor('#1B4332')
MED_GREEN    = HexColor('#2D6A4F')
LIGHT_GREEN  = HexColor('#40916C')
TABLE_HEADER = HexColor('#1F4E79')
TABLE_ALT    = HexColor('#F5F5F5')
WHITE        = colors.white
BLACK        = colors.black
DARK_GRAY    = HexColor('#333333')

# ═══════════════════════════════════════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════════════════════════════════════
styles = getSampleStyleSheet()

sTitle = ParagraphStyle('CoverTitle', fontName=FONT_B, fontSize=28, leading=34,
                        textColor=WHITE, alignment=TA_CENTER, spaceAfter=12)
sSubTitle = ParagraphStyle('CoverSub', fontName=FONT, fontSize=14, leading=18,
                           textColor=HexColor('#B7E4C7'), alignment=TA_CENTER, spaceAfter=6)
sChapter = ParagraphStyle('Chapter', fontName=FONT_B, fontSize=22, leading=28,
                           textColor=DARK_GREEN, spaceBefore=24, spaceAfter=12)
sH2 = ParagraphStyle('H2', fontName=FONT_B, fontSize=15, leading=20,
                      textColor=MED_GREEN, spaceBefore=18, spaceAfter=8)
sH3 = ParagraphStyle('H3', fontName=FONT_B, fontSize=12, leading=16,
                      textColor=LIGHT_GREEN, spaceBefore=12, spaceAfter=6)
sBody = ParagraphStyle('Body', fontName=FONT, fontSize=10.5, leading=15,
                        textColor=DARK_GRAY, alignment=TA_JUSTIFY, spaceAfter=8,
                        firstLineIndent=18)
sBodyNoIndent = ParagraphStyle('BodyNoIndent', fontName=FONT, fontSize=10.5, leading=15,
                                textColor=DARK_GRAY, alignment=TA_JUSTIFY, spaceAfter=8)
sBullet = ParagraphStyle('Bullet', fontName=FONT, fontSize=10.5, leading=15,
                          textColor=DARK_GRAY, leftIndent=24, spaceAfter=4, bulletIndent=12)
sTableHead = ParagraphStyle('TH', fontName=FONT_B, fontSize=9.5, leading=12,
                             textColor=WHITE, alignment=TA_CENTER)
sTableCell = ParagraphStyle('TC', fontName=FONT, fontSize=9, leading=12,
                             textColor=DARK_GRAY)
sTableCellC = ParagraphStyle('TCC', fontName=FONT, fontSize=9, leading=12,
                              textColor=DARK_GRAY, alignment=TA_CENTER)
sCoverBg = ParagraphStyle('CoverBg', fontName=FONT, fontSize=1, leading=1)

# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def heading(text):
    return Paragraph(text, sChapter)

def h2(text):
    return Paragraph(text, sH2)

def h3(text):
    return Paragraph(text, sH3)

def body(text):
    return Paragraph(text, sBody)

def body_ni(text):
    return Paragraph(text, sBodyNoIndent)

def bullet(text):
    return Paragraph(f"\u2022 {text}", sBullet)

def numbered(num, text):
    return Paragraph(f"<b>{num}.</b> {text}", sBullet)

def make_table(headers, rows, col_widths=None):
    """Build a styled table with Paragraph cells, dark-blue header, alternating rows."""
    header_row = [Paragraph(h, sTableHead) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), sTableCellC) if len(str(c)) < 30 else Paragraph(str(c), sTableCell) for c in row])
    if col_widths is None:
        col_widths = [6.5 * inch / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), FONT_B),
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT))
    t.setStyle(TableStyle(style_cmds))
    return t

# ═══════════════════════════════════════════════════════════════════════════
# TOC DRAWING
# ═══════════════════════════════════════════════════════════════════════════

class TocDocTemplate(BaseDocTemplate):
    """Doc template that supports multiBuild for auto-generated TOC."""
    def __init__(self, *args, **kwargs):
        BaseDocTemplate.__init__(self, *args, **kwargs)
        self.page_count_offset = 0
        self._toc_entries = []
        self._toc_counter = 0

    def afterFlowable(self, flowable):
        """Register TOC entries."""
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            text = flowable.getPlainText()
            if style == 'Chapter':
                self.notify('TOCEntry', (0, text, self.page, None))
            elif style == 'H2':
                self.notify('TOCEntry', (1, text, self.page, None))

# ═══════════════════════════════════════════════════════════════════════════
# PAGE TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════

def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(DARK_GREEN)
    canvas.rect(0, 0, letter[0], letter[1], fill=1)
    # Decorative border
    canvas.setStrokeColor(HexColor('#40916C'))
    canvas.setLineWidth(2)
    canvas.rect(36, 36, letter[0]-72, letter[1]-72, fill=0)
    canvas.setStrokeColor(HexColor('#2D6A4F'))
    canvas.setLineWidth(0.5)
    canvas.rect(42, 42, letter[0]-84, letter[1]-84, fill=0)
    canvas.restoreState()

def normal_page(canvas, doc):
    canvas.saveState()
    # Header line
    canvas.setStrokeColor(DARK_GREEN)
    canvas.setLineWidth(1)
    canvas.line(54, letter[1]-50, letter[0]-54, letter[1]-50)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(DARK_GREEN)
    canvas.drawString(54, letter[1]-45, "DEITIES & DEMIGODS PLAYER'S HANDBOOK")
    canvas.drawRightString(letter[0]-54, letter[1]-45, "Z.ai")
    # Footer
    canvas.setStrokeColor(HexColor('#CCCCCC'))
    canvas.line(54, 44, letter[0]-54, 44)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(HexColor('#888888'))
    canvas.drawCentredString(letter[0]/2, 32, f"Page {doc.page}")
    canvas.restoreState()

# ═══════════════════════════════════════════════════════════════════════════
# BUILD CONTENT
# ═══════════════════════════════════════════════════════════════════════════

def build_content():
    story = []

    # ── COVER PAGE ──
    story.append(Spacer(1, 120))
    story.append(Paragraph("DEITIES &amp; DEMIGODS", sTitle))
    story.append(Spacer(1, 8))
    story.append(Paragraph("PLAYER'S HANDBOOK", sTitle))
    story.append(Spacer(1, 24))
    story.append(Paragraph("A Guide to Adventure in the Age of Myth", sSubTitle))
    story.append(Spacer(1, 30))
    story.append(Paragraph("Powered by Gemini 2.5 Flash AI", ParagraphStyle('ai', fontName=FONT, fontSize=11, textColor=HexColor('#95D5B2'), alignment=TA_CENTER)))
    story.append(Spacer(1, 200))
    story.append(Paragraph("2025 Edition", ParagraphStyle('ed', fontName=FONT, fontSize=10, textColor=HexColor('#B7E4C7'), alignment=TA_CENTER)))
    story.append(NextPageTemplate('normal'))

    # ── TABLE OF CONTENTS ──
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle('TOC1', fontName=FONT_B, fontSize=12, leading=18, leftIndent=20, textColor=DARK_GREEN, spaceBefore=8),
        ParagraphStyle('TOC2', fontName=FONT, fontSize=10.5, leading=16, leftIndent=40, textColor=DARK_GRAY, spaceBefore=4),
    ]
    story.append(Paragraph("TABLE OF CONTENTS", ParagraphStyle('TOCTitle', fontName=FONT_B, fontSize=20, textColor=DARK_GREEN, alignment=TA_CENTER, spaceBefore=12, spaceAfter=20)))
    story.append(toc)
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 1: GETTING STARTED
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 1: Getting Started"))
    story.append(body("Welcome to <b>Deities &amp; Demigods</b>, a mythological role-playing game where you and your friends control legendary heroes and demigods drawn from the pantheons of world mythology. From the halls of Asgard to the banks of the Nile, from the cherry blossoms of Mount Fuji to the pyramids of the Aztec sun\u2014every legend is real, every god walks the earth, and every story waits to be told."))
    story.append(body("This handbook is your guide to understanding the rules, mechanics, and systems that govern the game. Whether you are a seasoned AD&amp;D veteran or a newcomer to tabletop role-playing, everything you need is explained within these pages."))

    story.append(h2("What You Need"))
    story.append(body("To play Deities &amp; Demigods, you need very little in the way of physical materials. The game is designed to run entirely in your web browser, with an artificial intelligence Dungeon Master powered by Google's Gemini 2.5 Flash model handling all narration, combat resolution, and world-building. Here is the complete list of requirements:"))
    story.append(bullet("<b>A modern web browser</b> \u2014 Chrome, Firefox, Edge, or Safari. No installation required."))
    story.append(bullet("<b>A Google AI Studio API key</b> (free) \u2014 This powers the Gemini 2.5 Flash AI Dungeon Master. You can obtain one at <b>aistudio.google.com</b> by creating a free Google Cloud account and generating an API key in the API Keys section. The free tier provides generous usage limits sufficient for many campaigns."))
    story.append(bullet("<b>An optional Groq API key</b> \u2014 If you want faster action-option generation, you can add a Groq API key from <b>console.groq.com</b>. Groq provides lightning-fast inference for smaller models. This is entirely optional; the game works perfectly with Gemini alone."))

    story.append(h2("How to Get Your API Keys"))
    story.append(body("<b>Gemini API Key (Required):</b> Navigate to <b>aistudio.google.com</b>. Sign in with your Google account. Click on <b>Get API Key</b> in the left sidebar, then click <b>Create API Key</b>. Copy the key and paste it into the game's settings panel when prompted. This key is stored locally in your browser's localStorage and is never transmitted anywhere except directly to Google's Gemini API endpoints. It is never shared with any third-party server, including the game's hosting infrastructure."))
    story.append(body("<b>Groq API Key (Optional):</b> Visit <b>console.groq.com</b> and create a free account. Navigate to the <b>API Keys</b> section and generate a new key. Paste this into the game's optional Groq settings. Like the Gemini key, it is stored exclusively in your browser and sent only to Groq's servers."))

    story.append(h2("Creating a Campaign"))
    story.append(body("Starting a new adventure is straightforward. From the main menu, click <b>Start New Campaign</b>. You will be presented with a party selection screen where you can browse heroes, demigods, and lesser gods from across fourteen mythological pantheons. Each character displays their vital statistics\u2014hit points, armor class, magic resistance, ability scores, and special abilities\u2014alongside a portrait and brief description."))
    story.append(body("Select between <b>two and four player characters</b> for your party. The first character you select becomes your primary controlled character; the second becomes your designated Companion (see Chapter 11). Additional party members join as AI-controlled allies who follow your lead and provide combat support. Once you have assembled your party, click <b>Confirm Party</b> to begin."))
    story.append(body("At campaign start, the game randomly assigns a <b>Shard</b>\u2014an ancient artifact bound to one of the world's pantheons\u2014and a <b>Prophecy</b> to each character. An <b>antagonist</b> is secretly selected from a pool of fifty-three candidates spanning Greater Gods, Super Monsters, and legendary beings. The antagonist's identity remains hidden until Act III, revealed only through progressive clues scattered across your journey."))

    story.append(h2("Privacy and Security"))
    story.append(body("Your API keys are stored exclusively in your browser's <b>localStorage</b>. They are never uploaded to any server, never transmitted to any endpoint other than Google's Gemini API and (optionally) Groq's inference API, and never shared with Z.ai or any third party. Your campaign save data is likewise stored locally\u2014nothing leaves your browser except the API calls necessary for AI narration and option generation."))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 2: GAME STRUCTURE
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 2: Game Structure"))
    story.append(body("Every campaign of Deities &amp; Demigods unfolds across a <b>three-act narrative structure</b>, inspired by classical storytelling and the heroic monomyth. Each act has distinct mechanics, pacing, and narrative goals. The transition between acts is governed by randomised turn limits determined at campaign start, creating a unique rhythm for every playthrough. The AI Dungeon Master manages all transitions automatically, so you can focus on playing."))

    story.append(h2("The Three-Act Structure"))

    story.append(h3("Act I \u2014 The Gathering"))
    story.append(body("The campaign opens with your party members introduced <b>one at a time</b>, each arriving through their own narrative thread\u2014a lone warrior at a crossroads, a scholar in a burning library, a thief in a god's abandoned temple. The AI DM weaves these individual introductions into a shared moment of discovery: the finding of the <b>Shard</b>, an ancient artifact that pulses with power and whispers of a prophecy yet to unfold."))
    story.append(body("During Act I, the antagonist exists only as <b>shadows and clues</b>\u2014unnatural weather, whispered warnings from terrified villagers, strange symbols carved into ancient stones. You will not learn the antagonist's identity during this act. The focus is on establishing your characters, discovering the Shard, and receiving your prophecy."))
    story.append(body("<b>Turn Limit:</b> Act I lasts between <b>10 and 100 turns</b>, determined randomly at campaign start. The act ends when all player characters agree they are ready to proceed (via the agreement system), or when the turn limit is reached, whichever comes first."))

    story.append(h3("Act II \u2014 The Investigation"))
    story.append(body("The full party is now assembled and active. Your <b>Companion</b> system engages, NPCs become available for recruitment, and the world opens up. Act II is the longest and most complex act, where the majority of exploration, questing, and character development occurs."))
    story.append(body("The AI DM introduces a pool of <b>random heroes and demigods</b> (drawn from the game's database) who may appear as allies, quest-givers, or temporary companions. <b>Clues about the antagonist's identity</b> are revealed progressively\u2014first vague hints about their pantheon or alignment, then more specific details about their domain, symbol, and ultimately their name."))
    story.append(body("<b>Duration:</b> Act II lasts between <b>20 and 60 turns</b>. The act cannot end before a minimum of 20 turns have elapsed and at least <b>three antagonist clues</b> have been discovered. Once both conditions are met and the turn limit is reached, the campaign transitions to Act III."))

    story.append(h3("Act III \u2014 The Confrontation"))
    story.append(body("The antagonist's identity is <b>fully revealed</b>. The final confrontation begins. Act III features a <b>three-phase boss battle</b>, where the antagonist escalates through increasingly powerful forms as their hit points cross designated thresholds. Each phase brings new abilities, higher damage, and more dangerous mechanics."))
    story.append(body("If the antagonist was previously defeated and <b>banished</b> before Act III (a rare but possible outcome), they return at <b>full power</b>, and the party gains access to the <b>Archrival Summon</b>\u2014the antagonist's mythologically accurate rival, drawn from the lore of their pantheon. Victory in Act III means defeating the antagonist once and for all. Defeat means death\u2014there are no second chances in the final act."))

    story.append(h2("Act Transition Mechanics"))
    story.append(body("Act transitions are <b>fully automatic</b>. The game tracks turn counts and condition thresholds internally. When conditions are met, the AI DM narrates the transition, the success rate is recalculated, and the new act's mechanics engage. You do not need to manage transitions manually."))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 3: HOW TURNS WORK
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 3: How Turns Work"))
    story.append(body("Each turn in Deities &amp; Demigods follows a strict <b>four-step cycle</b> that ensures consistent pacing and predictable mechanics. Understanding this cycle is the key to mastering the game."))

    story.append(h2("The Turn Cycle"))
    story.append(numbered(1, "<b>Choose Your Action:</b> At the start of each turn, the game presents you with <b>three to five action options</b> generated by the AI Dungeon Master (using Gemini 2.5 Flash or, optionally, Groq for faster generation). These options are contextual\u2014they reflect your character's abilities, the current situation, available items, companion suggestions, and the narrative state. An option might read \"Draw your blade and charge the troll\" or \"Consult the Scroll of Wisdom about the strange markings\" or simply \"Wait and observe from the shadows.\" Select the option that best fits your strategy or your character's personality."))
    story.append(numbered(2, "<b>AI Narrates the Outcome:</b> The AI DM processes your choice, rolls dice (typically a d20 for action resolution), resolves any combat, and writes a <b>300+ word narrative passage</b> in the style of Neil Gaiman\u2014lyrical, atmospheric, and rich with mythological detail. The narration describes what happens as a consequence of your choice, including any combat results, discoveries, NPC interactions, or plot developments. Dice rolls are displayed alongside the narration so you can see exactly how fate intervened."))
    story.append(numbered(3, "<b>State Updates Applied:</b> The AI DM's response includes a structured <b>JSON state update</b> that the game parses automatically. This may include: HP changes (damage dealt or healing received), new conditions (poisoned, blessed, cursed), injury events, NPC encounters, item drops, quest progress updates, Shard events, and prophecy state changes. All of these are applied silently in the background\u2014you see the results reflected in your character sheets and UI, not in raw JSON."))
    story.append(numbered(4, "<b>Next Turn Begins:</b> After state updates are applied, the game recalculates your <b>success rate</b>, processes any damage-over-time (DOT) effects from active injuries, decrements injury timers, and generates a fresh set of action options for the next turn. The cycle repeats until the campaign reaches its conclusion."))

    story.append(h2("Understanding Dice Rolls"))
    story.append(body("The core resolution mechanic is the <b>d20 roll</b>. When you take an action that requires resolution\u2014attacking an enemy, leaping a chasm, persuading a guard\u2014the AI DM rolls a twenty-sided die. The result determines success or failure, modified by relevant ability scores, equipment bonuses, and situational factors. A natural 20 is always a critical success; a natural 1 is always a critical failure, regardless of modifiers."))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 4: CHARACTER STATISTICS
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 4: Character Statistics"))
    story.append(body("Characters in Deities &amp; Demigods use the <b>Advanced Dungeons &amp; Dragons 1st Edition</b> (AD&amp;D 1e) statistical framework, faithfully adapted for digital play. Every hero, demigod, lesser god, and greater god is defined by a set of core statistics that determine their combat effectiveness, survivability, and narrative capabilities."))

    story.append(h2("Core Statistics"))
    story.append(make_table(
        ['Stat', 'Description', 'Notes'],
        [
            ['HP (Hit Points)', 'Health. Reaching 0 means death.', 'Gods range from 300-450; heroes 50-200'],
            ['AC (Armor Class)', 'Defensive rating. Lower is better.', 'Gods range from -12 to +4; AD&D 1e scale'],
            ['MR (Magic Resistance)', '% chance to resist hostile magic.', 'Range: 0% to 100%. Gods typically 25-98%.'],
            ['Move', 'Movement rate in inches per round.', 'AD&D 1e standard. 12\" = human walking speed.'],
        ],
        [1.5*inch, 2.5*inch, 2.5*inch]
    ))

    story.append(h2("Ability Scores"))
    story.append(body("Six ability scores define each character's raw capabilities: <b>Strength (STR), Dexterity (DEX), Constitution (CON), Intelligence (INT), Wisdom (WIS), and Charisma (CHA)</b>. These scores range from 3 to 20 (or higher for gods) and provide bonuses or penalties to relevant actions. The following table shows the complete AD&amp;D 1e bonus structure:"))

    story.append(make_table(
        ['Score', 'Bonus/Penalty', 'Score', 'Bonus/Penalty'],
        [
            ['3',     '\u22123',   '16-17', '+2'],
            ['4-5',   '\u22122',   '18',    '+3'],
            ['6-8',   '\u22121',   '18/01-50',  '+3'],
            ['9-12',  '0',        '18/51-75',  '+4'],
            ['13-15', '+1',       '18/76-90',  '+4'],
            ['',      '',         '18/91-00',  '+5'],
            ['',      '',         '19',         '+4'],
            ['',      '',         '20+',        '+5'],
        ],
        [1.5*inch, 1.75*inch, 1.5*inch, 1.75*inch]
    ))

    story.append(h3("Exceptional Strength (18/xx)"))
    story.append(body("Fighter-class characters with an STR score of 18 may possess <b>Exceptional Strength</b>, denoted as 18/01 through 18/00 (18/00 being the equivalent of 18/100). This percentile system grants increasing to-hit and damage bonuses beyond the normal +3 awarded by a standard 18 STR. Only fighters, paladins, and rangers can roll for Exceptional Strength; other classes are capped at 18."))

    story.append(h2("Class Levels"))
    story.append(body("Characters may have levels in four AD&amp;D 1e classes: <b>fighterLevel</b>, <b>clericLevel</b>, <b>magicUserLevel</b>, and <b>thiefLevel</b>. Multi-class characters (common among demigods) have levels in multiple classes simultaneously. Your highest class level divided by three contributes to the <b>Renown</b> bonus in the success rate calculation (see Chapter 5)."))

    story.append(h2("Alignment and Party Harmony"))
    story.append(body("Each character has a <b>two-axis alignment</b>: Lawful/Neutral/Chaotic crossed with Good/Neutral/Evil. This produces nine possible alignments, from Lawful Good to Chaotic Evil. Alignment affects more than role-playing\u2014it has <b>mechanical consequences</b> for your party's success rate:"))
    story.append(bullet("Good and Evil characters in the same party: <b>\u22123</b> to alignment harmony"))
    story.append(bullet("Lawful and Chaotic characters in the same party: <b>\u22122</b> to alignment harmony"))
    story.append(bullet("Two or more Good characters: <b>+1</b> to alignment harmony"))
    story.append(bullet("Two or more Lawful characters: <b>+1</b> to alignment harmony"))
    story.append(body("The total alignment harmony modifier is <b>clamped between \u22125 and +5</b>. A perfectly harmonious party of Lawful Good characters gains +2, while a party mixing Good and Evil gains at least \u22123."))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 5: SUCCESS RATE & COMBAT
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 5: Success Rate &amp; Combat"))
    story.append(body("The <b>Success Rate</b> is the most important hidden mechanic in Deities &amp; Demigods. It represents the overall probability that your campaign will end in victory rather than defeat. Think of it as the narrative tension gauge\u2014the closer to 100%, the more the story bends in your favour; the closer to 0%, the more the world conspires against you. This rate is recalculated at the start of every turn and displayed in the game's header."))

    story.append(h2("The Formula"))
    story.append(body_ni("<b>successRate = 50 (base) + min(livingPCs \u00d7 2, 10) + prophecyBonus + min(alliedGods \u00d7 3, 15) + min(pcRenown, 8) + min(pcPower, 10) + alignmentHarmony + min(storyAchievements \u00d7 2, 12) + antagonistPenalty</b>"))
    story.append(body("The final value is <b>clamped between 5% and 95%</b>. No matter how dire your situation, there is always at least a 5% chance of victory. No matter how powerful you become, there is always at least a 5% chance of failure. Fate is never certain."))

    story.append(h2("All Nine Factors Explained"))
    story.append(numbered(1, "<b>Base: 50%</b> \u2014 Every campaign begins at a coin flip. This is the starting point\u2014neither favoured nor disadvantaged. The mythological world does not care whether you win or lose."))
    story.append(numbered(2, "<b>Party Size: +2 per living PC (max +10)</b> \u2014 Each living player character contributes +2 to the success rate. A full party of four grants +8. If characters die, this bonus decreases. Keeping your party alive is one of the most impactful things you can do."))
    story.append(numbered(3, "<b>Prophecy State: +0 to +8 (or \u22125 if broken)</b> \u2014 Each character carries a prophecy that progresses through states: <b>Dormant (+0), Awakening (+3), Manifesting (+5), Fulfilled (+8), Broken (\u22125)</b>. Prophecies advance through narrative actions and key story events."))
    story.append(numbered(4, "<b>Allied Gods: +3 per ally (max +15)</b> \u2014 Good-aligned NPCs you encounter and befriend count as allied gods. Each one contributes +3, up to a maximum of +15 for five allies."))
    story.append(numbered(5, "<b>Renown: +1 per 3 class levels (max +8)</b> \u2014 Your party's accumulated experience and reputation. The highest class level among all PCs, divided by three and rounded down."))
    story.append(numbered(6, "<b>Power: Total living PC HP / 100 (max +10)</b> \u2014 Raw survivability. Add up all living PCs' current hit points, divide by 100, and round down. This means keeping your party healed is mechanically beneficial beyond simple survival."))
    story.append(numbered(7, "<b>Alignment Harmony: \u22125 to +5</b> \u2014 How well your party's alignments work together. Detailed in Chapter 4. A harmonious party fights better; a divided party is its own worst enemy."))
    story.append(numbered(8, "<b>Mythical Impact: (quests + clues/2) \u00d7 2 (max +12)</b> \u2014 The narrative weight of your accomplishments. Each completed quest and each antagonist clue discovered contributes to this bonus."))
    story.append(numbered(9, "<b>Antagonist Type: \u22125 if Greater God, 0 if Monster</b> \u2014 Facing a Greater God as your antagonist imposes a flat \u22125 penalty. Facing a Super Monster imposes no penalty. The gods are simply harder to defeat than even the mightiest beasts."))

    story.append(h2("Individual Combat Rolls"))
    story.append(body("While the success rate governs the overall campaign trajectory, <b>individual actions</b> are resolved using d20 rolls modified by ability scores, equipment, and situational factors. A high success rate does not guarantee every action succeeds\u2014it means the overall narrative trend favours your party. Individual rolls can still fail, injuries can still occur, and characters can still die. The success rate is the wind at your back, not a shield in front of you."))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 6: THE SHARD SYSTEM
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 6: The Shard System"))
    story.append(body("At the heart of every campaign lies the <b>Shard</b>\u2014an ancient artifact of immense power, drawn from one of the twenty-eight shards bound to the world's pantheons. The Shard is both plot device and mechanical tool: it drives the narrative forward and provides the party with the ability to summon divine aid in moments of desperate need."))

    story.append(h2("Shard Basics"))
    story.append(body("Each campaign begins with one Shard randomly assigned from the pool of twenty-eight. Every Shard has a <b>name, origin story, colour, glow effect, pantheon association, and power description</b>. The origin stories are written in the mythic voice of Neil Gaiman\u2014evocative, melancholic, and faintly ominous. They are not mere descriptions; they are fragments of a larger story that the campaign gradually reveals."))

    story.append(h2("Charges and Invocation"))
    story.append(body("Every Shard starts with <b>2 charges</b>. These charges represent the Shard's remaining power and can be spent to <b>invoke divine beings</b>. To invoke a Shard:"))
    story.append(numbered(1, "<b>Declare</b> which god or being you wish to summon."))
    story.append(numbered(2, "<b>Roll</b> a d20 against a DC of 10."))
    story.append(numbered(3, "<b>On success</b> (roll 10 or higher): The named being appears and aids the party according to their abilities and nature."))
    story.append(numbered(4, "<b>On failure</b> (roll below 10): Something else may appear instead\u2014a different being, a hostile entity, or simply nothing at all. The Shard is capricious."))
    story.append(body("A <b>Lesser Summon</b> costs 1 charge. A <b>Greater Summon</b> costs <b>ALL remaining charges</b> and sets <b>shardDark = true</b>. A darkened Shard cannot be invoked again until it is restored through a <b>Miracle</b> (see Chapter 7: Test of Faith). All summoned names are tracked in the <b>shardSummoned</b> array\u2014you cannot summon the same being twice."))

    story.append(h2("The 28 Shards by Pantheon"))
    story.append(make_table(
        ['Shard Name', 'Pantheon', 'Power'],
        [
            ['The Pale Shard', 'Primordial', 'Favors any god'],
            ['The First Crack', 'Primordial', 'Favors chaotic gods'],
            ['The Splinter of Before', 'Primordial', 'Favors elder gods'],
            ['The Yggdrasil Wound', 'Norse', 'Favors Norse pantheon'],
            ["The Eye of Cronos", 'Greek', 'Favors Greek Titans and Olympians'],
            ["The Gorgon's Tear", 'Greek', 'Favors chthonic gods'],
            ["The Feather of Ma'at", 'Egyptian', 'Favors Egyptian pantheon, bonus to lawful gods'],
            ['The First Sunrise', 'Egyptian', 'Favors Ra and solar deities'],
            ["The Dreamer's Fragment", 'Cthulhu', 'Favors Great Old Ones, high risk'],
            ['The Nameless Mist', 'Cthulhu', 'Favors Outer Gods'],
            ['The Black Rune Shard', 'Melnibonean', 'Favors Chaos Lords'],
            ["The Last Dragon's Heart", 'Melnibonean', 'Favors Law'],
            ["The Rat King's Crown", 'Nehwon', 'Favors neutral gods and tricksters'],
            ['The Skah Jordan Fragment', 'Nehwon', 'Favors thief gods and luck deities'],
            ["The Cauldron's Chip", 'Celtic', 'Favors Celtic Tuatha De Danann'],
            ["The Stone of Destiny's Splinter", 'Celtic', 'Favors lawful Celtic gods'],
            ["The Tenth Avatar's Tear", 'Indian', 'Favors Indian pantheon, Trimurti'],
            ["The Jade Emperor's Reflection", 'Chinese', 'Favors Chinese Celestial Bureaucracy'],
            ["Amaterasu's Hidden Spark", 'Japanese', 'Favors Japanese kami, solar deities'],
            ["Quetzalcoatl's Shed Scale", 'Central American', 'Favors Aztec/Mayan pantheon'],
            ["Marduk's Tablet Shard", 'Babylonian', 'Favors Babylonian pantheon'],
            ['The Graygem Fragment', 'Krynn', 'Favors Krynn, chaotic outcomes'],
            ['The Blue Crystal Splinter', 'Krynn', 'Favors Mishakal, healing'],
            ['The Dragonlance Shard', 'Krynn', 'Favors Paladine, dragon-slaying'],
            ['The Blood of the Conclave', 'Krynn', 'Favors Solinari, Lunitari, Nuitari equally'],
            ["Takhisis's Broken Crown", 'Krynn', 'Favors Takhisis, shadow magic'],
            ["The Knighthood's Honor", 'Krynn', 'Favors Paladine, Solamnic Knights'],
            ["The Kender's Curiosity", 'Krynn', 'Favors Branchala, kender luck'],
        ],
        [2.2*inch, 1.2*inch, 3.1*inch]
    ))
    story.append(body("Additionally, <b>The Tower of Wayreth's Key</b> (Krynn \u2014 Favors the Conclave, planar travel) and <b>Fistandantilus's Last Memory</b> (Krynn \u2014 Favors dark magic, forbidden knowledge) complete the 28-shard roster."))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 7: TEST OF FAITH
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 7: Test of Faith"))
    story.append(body("The <b>Test of Faith</b> is Deities &amp; Demigods' signature survival mechanic\u2014a moment when the dice intervene on behalf of narrative destiny. When things look darkest, when death seems certain, the game offers you a choice: <b>trust in fate</b> or <b>decline the test</b>. The outcome can save your campaign or plunge it deeper into peril."))

    story.append(h2("Triggers"))
    story.append(body("A Test of Faith can be triggered by three distinct events, each representing a different kind of crisis:"))
    story.append(bullet("<b>Death Save (death_save)</b> \u2014 A player character has died. The test offers a chance at miraculous resurrection."))
    story.append(bullet("<b>Boss Phase (boss_phase)</b> \u2014 The antagonist has entered a new, more dangerous phase in Act III. The test offers a chance to weaken them."))
    story.append(bullet("<b>Desperate Odds (desperate_odds)</b> \u2014 The campaign's success rate has dropped below 40%. The test offers a chance to shift the odds back in your favour."))

    story.append(h2("Safeguards"))
    story.append(body("The Test of Faith is not unlimited. The following safeguards prevent abuse:"))
    story.append(bullet("<b>One miracle per PC</b> \u2014 Each player character can receive at most one miraculous outcome during the entire campaign."))
    story.append(bullet("<b>Two miracles maximum (total)</b> \u2014 Across the entire party, no more than two miracles can occur in a single campaign."))
    story.append(bullet("<b>10-turn cooldown</b> \u2014 After any Test of Faith (regardless of outcome), 10 turns must pass before another can be offered."))
    story.append(bullet("<b>Act II+ only</b> \u2014 Tests of Faith cannot occur during Act I. The narrative must have progressed sufficiently before fate intervenes."))

    story.append(h2("The Roll"))
    story.append(body("When a Test of Faith is offered, you choose whether to <b>Trust Fate</b> or <b>Decline</b>. If you trust fate, a d20 is rolled and the outcome is determined by the following ranges:"))

    story.append(make_table(
        ['Roll Range', 'Outcome', 'Effect'],
        [
            ['18-20', 'Miracle', '+8 success rate, restore 1 Shard charge, rekindle darkened Shard. Death: revive at 1 HP, restore prophecy. Boss: deal 15% max HP damage.'],
            ['4-17', 'Fate Holds', 'No mechanical changes. The universe holds its breath.'],
            ['1-3', "Murphy's Law", '\u22125 success rate, random item loses a charge, Shard darkens if possible.'],
        ],
        [1.2*inch, 1.2*inch, 4.1*inch]
    ))

    story.append(body("If you <b>decline</b> the test by choosing \"Trust Fate\" but then opting out, fate remains neutral\u2014no bonus, no penalty. The test simply passes. However, you lose the opportunity that was offered, and the cooldown period still applies."))
    story.append(body("When a <b>Miracle</b> occurs during a death save, the fallen character is revived at 1 HP and their original prophecy is restored\u2014if a successor PC had inherited the prophecy, it returns to its original bearer. This is the only mechanic that can reverse a prophecy transfer."))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 8: INJURIES
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 8: Injuries"))
    story.append(body("Combat and exploration in Deities &amp; Demigods are dangerous. Beyond simple HP loss, characters can suffer <b>Injuries</b>\u2014persistent conditions that impair abilities, drain health, or create dangerous vulnerabilities. Injuries are generated by the AI DM during narrative events and represent the physical and supernatural toll of mythological adventure."))

    story.append(h2("How Injuries Work"))
    story.append(body("Each injury has a <b>turnsLeft counter</b> that decrements at the start of every turn. When the counter reaches zero, the injury expires. Some injuries deal <b>damage over time (DOT)</b>\u2014they drain HP at the start of each turn until they expire or are cured."))
    story.append(body("Duration is determined by the <b>cure field</b>: if the cure text specifies \"Rest N turns\", the injury lasts N turns. DOT injuries default to 5 turns. All other injuries default to 4 turns. Injuries can also be cured prematurely through magical healing, potions, or specific curative items."))

    story.append(h2("Injury Categories"))
    story.append(body("The game features <b>28 unique injuries</b> across five categories, each representing a different type of threat:"))

    story.append(make_table(
        ['Category', 'Count', 'Examples'],
        [
            ['Physical', '8', 'Deep Cut, Bruised Ribs, Concussion, Broken Limb, Severed Tendon'],
            ['Magical', '6', 'Arcane Burn, Soul Fracture, Planar Taint, Mana Drain, Spellscar'],
            ['Poison', '6', 'Weak Poison, Necrotic Venom, Paralytic Toxin, Blood Toxin, Mind Poison'],
            ['Psionic', '6', 'Mental Fatigue, Psychic Trauma, Mind Bleed, Ego Fracture, Psionic Shock'],
            ['Cursed', '2', 'Cursed Wound, Divine Mark'],
        ],
        [1.2*inch, 0.8*inch, 4.5*inch]
    ))

    story.append(h2("Complete Injury Table"))
    story.append(make_table(
        ['Injury', 'Type', 'Effect', 'Cure'],
        [
            ['Deep Cut', 'Physical', '-1 to all attack rolls', 'Rest 2 turns or Cure Light Wounds'],
            ['Bruised Ribs', 'Physical', '-2 to DEX saves and movement', 'Rest 3 turns'],
            ['Concussion', 'Physical', '-4 to INT checks, -1 to all saves', 'Rest 5 turns or Cure Light Wounds'],
            ['Crushed Hand', 'Physical', '-2 to attack, no two-handed weapons', 'Cure Serious Wounds or Rest 10'],
            ['Broken Limb', 'Physical', 'Cannot use arm/leg, -4 AC', 'Cure Serious Wounds'],
            ['Internal Bleeding', 'Physical', '-3 HP/turn (DOT)', 'Cure Serious Wounds'],
            ['Lacerated Eye', 'Physical', '-4 ranged attacks, -2 perception', 'Cure Serious Wounds'],
            ['Severed Tendon', 'Physical', 'Movement halved, -3 DEX', 'Cure Critical Wounds'],
            ['Arcane Burn', 'Magical', '-2 magic saves, spells at -1 level', 'Dispel Magic + Cure Light'],
            ['Soul Fracture', 'Magical', '-3 death saves, cannot be raised', 'Restoration spell'],
            ['Planar Taint', 'Magical', '-2 WIS save/turn or lose 1 WIS', 'Remove Curse + Cure Disease'],
            ['Mana Drain', 'Magical', 'No spells above 3rd, -2 INT', 'Rest 8 hours or Restoration'],
            ['Eldritch Corrosion', 'Magical', 'Items lose 1 charge/turn', 'Mending + Dispel Evil'],
            ['Spellscar', 'Magical', 'Random spell fails, -1 caster level', 'Limited Wish or higher'],
            ['Weak Poison', 'Poison', '-1 all rolls, -2 HP/turn (DOT)', 'Antitoxin or Neutralize Poison'],
            ['Necrotic Venom', 'Poison', '-2 CON, -3 HP/turn (DOT)', 'Neutralize Poison + Restoration'],
            ['Paralytic Toxin', 'Poison', 'DEX halved, 20% paralysed/turn', 'Neutralize Poison or Antitoxin'],
            ['Blood Toxin', 'Poison', 'No magic healing, regen halved', 'Neutralize Poison'],
            ['Mind Poison', 'Poison', '-3 WIS, -3 INT, confusion risk', 'Neutralize Poison + Heal'],
            ['Acid Burn', 'Poison', '-2 AC, -1 saves, -1 HP/turn/acid', 'Neutralize Poison'],
            ['Mental Fatigue', 'Psionic', '-2 INT/WIS, psionic halved', 'Rest 8 hours'],
            ['Psychic Trauma', 'Psionic', 'Random phobia, -3 CHA', 'Heal or Cure Insanity'],
            ['Mind Bleed', 'Psionic', '-1 saves, 10% spell failure', 'Restoration or Psychic Surgery'],
            ['Ego Fracture', 'Psionic', 'CHA halved, no psionics', 'Heal + Restoration'],
            ['Thought Burn', 'Psionic', 'No new spells, -4 INT saves', 'Restoration or Psychic Surgery'],
            ['Psionic Shock', 'Psionic', 'Stunned 1d4 rounds, -3 WIS', 'Heal or 24 hours rest'],
            ['Cursed Wound', 'Cursed', 'No magic healing, -3 death saves', 'Remove Curse first, then healing'],
            ['Divine Mark', 'Cursed', 'Marked by a god, -2 domain saves', 'Atonement or divine intervention'],
        ],
        [1.1*inch, 0.7*inch, 2.1*inch, 2.6*inch]
    ))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 9: ITEMS & EQUIPMENT
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 9: Items &amp; Equipment"))
    story.append(body("The world of Deities &amp; Demigods is littered with relics, potions, scrolls, and artefacts from a thousand mythologies. Items are discovered through six acquisition methods\u2014NPC encounters, monster drops, exploration, pickpocketing, conversation, and quest rewards\u2014and they range from common healing potions to legendary weapons forged by the gods themselves."))

    story.append(h2("Item Acquisition"))
    story.append(body("Items are not purchased from shops. They are <b>earned</b> through play. The six acquisition methods are:"))
    story.append(make_table(
        ['Method', 'Description'],
        [
            ['npc_encounter', 'Given or traded by NPCs you befriend or assist'],
            ['monster_drop', 'Looted from defeated enemies and legendary beasts'],
            ['exploration', 'Found in dungeons, temples, forgotten ruins, and hidden chambers'],
            ['pickpocket', 'Stolen from NPCs using thief skills (DEX-based)'],
            ['conversation', 'Gifted through dialogue choices and persuasive role-play'],
            ['quest_reward', 'Granted upon completion of quests, main or side'],
        ],
        [1.5*inch, 5*inch]
    ))

    story.append(h2("Item Types and Rarity"))
    story.append(body("Items are classified into five types and four rarity tiers:"))

    story.append(make_table(
        ['Type', 'Count', 'Description'],
        [
            ['Potions', '8', 'Single-use consumables with immediate effects'],
            ['Artifacts', '10', 'Unique legendary items with passive and active powers'],
            ['Equipment', '8', 'Weapons and armour with persistent bonuses'],
            ['Scrolls', '6', 'Single-use magical writings for specific effects'],
            ['Special', '3', 'Unique items with unusual acquisition or mechanics'],
        ],
        [1.2*inch, 0.7*inch, 4.6*inch]
    ))

    story.append(make_table(
        ['Rarity', 'Items', 'Description'],
        [
            ['Common', '7', 'Readily available, modest effects. Healing Potions, Antitoxins.'],
            ['Uncommon', '8', 'Moderate power. Scrolls, basic equipment, utility items.'],
            ['Rare', '11', 'Significant power. Named weapons, magical equipment, key artifacts.'],
            ['Legendary', '9', 'God-forged relics. Campaign-changing power. Extremely rare.'],
        ],
        [1.0*inch, 0.6*inch, 4.9*inch]
    ))

    story.append(h2("Active and Passive Modifiers"))
    story.append(body("Items operate through two modifier systems:"))
    story.append(bullet("<b>Active modifiers</b> trigger an effect when the item is used. Examples include <b>healing</b> (restore HP), <b>full_heal</b> (restore to max HP), <b>cure_poison</b> (remove poison injuries), <b>cure_all_poison</b> (remove all poison and psionic injuries), <b>death_ward</b> (absorb a lethal blow), <b>invisible</b> (become invisible), and <b>str_set</b> (set STR to a specific value)."))
    story.append(bullet("<b>Passive modifiers</b> are always active while the item is held. Examples include <b>damage</b> (bonus to attack damage), <b>ac</b> (bonus to armor class), <b>regen</b> (heal HP per turn), <b>vampiric</b> (steal HP on hit), <b>fear_immune</b> (immunity to fear effects), <b>true_sight</b> (see invisible entities), and <b>spell_cast</b> (cast a spell per day)."))

    story.append(h2("Starting Inventory"))
    story.append(body("Every party begins the campaign with <b>2x Healing Potions</b> in their shared inventory. Beyond this, all items must be discovered through play. <b>Party Gold</b> accumulates through the campaign and is tracked in the party's shared treasury."))

    story.append(h2("Complete Item Catalogue"))
    story.append(make_table(
        ['Item', 'Type', 'Rarity', 'Effect'],
        [
            ['Healing Potion', 'Potion', 'Common', 'Restore 2d8+4 HP'],
            ['Greater Healing Potion', 'Potion', 'Uncommon', 'Restore 4d8+8 HP'],
            ['Elixir of Heroism', 'Potion', 'Rare', '+2 all saves for 10 turns'],
            ['Ambrosia', 'Potion', 'Legendary', 'Full HP, cure all injuries'],
            ['Antitoxin', 'Potion', 'Common', 'Cure poison injuries'],
            ['Universal Antidote', 'Potion', 'Uncommon', 'Cure all poison/psionic'],
            ['Potion of Giant Strength', 'Potion', 'Rare', 'STR 18/00 for 1 hour'],
            ['Potion of Invisibility', 'Potion', 'Rare', 'Invisible 1 hour or until attack'],
            ['Mysterious Key', 'Artifact', 'Rare', 'Opens unknown doors (3 charges)'],
            ['Aegis Fragment', 'Artifact', 'Legendary', 'Absorb next lethal blow (1 charge)'],
            ['Hammer of Storms', 'Equipment', 'Legendary', '+15 damage, stuns on crit'],
            ['Golden Fleece', 'Artifact', 'Legendary', '+8 HP/turn regen, fear immune'],
            ["Odin's Runestaff", 'Artifact', 'Legendary', 'Cast 1st-3rd level spell/day'],
            ['Eye of Horus', 'Artifact', 'Legendary', 'See invisible, illusion immune'],
            ['Stormbringer Shard', 'Artifact', 'Legendary', '+20 damage, vampiric 6'],
            ['Bracelets of Submission', 'Artifact', 'Rare', '+4 CHA, Dominate Person 1/day'],
            ['Mithral Chain', 'Equipment', 'Rare', 'AC -2, no DEX penalty'],
            ['Flame Blade', 'Equipment', 'Uncommon', '+5 fire damage'],
            ['Frost Brand', 'Equipment', 'Rare', '+8 cold damage'],
            ['Vorpal Blade', 'Equipment', 'Legendary', 'Nat 20 beheads, +10 damage'],
            ['Boots of Speed', 'Equipment', 'Rare', 'Double movement, +2 AC'],
            ['Cloak of Displacement', 'Equipment', 'Uncommon', 'First attack misses, +2 AC'],
            ['Scroll of Divine Wisdom', 'Scroll', 'Uncommon', 'Reveal entity truths'],
            ['Scroll of Protection from Evil', 'Scroll', 'Uncommon', '+2 saves vs evil'],
            ['Scroll of Protection from Undead', 'Scroll', 'Rare', 'Undead cannot approach 10ft'],
            ['Scroll of Summoning', 'Scroll', 'Rare', 'Summon ally from shard pantheon'],
            ['Scroll of Identification', 'Scroll', 'Common', 'Identify item properties'],
            ['Scroll of Teleportation', 'Scroll', 'Rare', 'Teleport party to known location'],
            ["Master Thieves' Tools", 'Equipment', 'Uncommon', '+2 pickpocket/lockpicking'],
            ["Diplomat's Ring", 'Artifact', 'Uncommon', '+3 persuasion, detect lies'],
            ['Monster Lore Compendium', 'Artifact', 'Rare', 'Reveal one monster weakness'],
            ['Bag of Holding', 'Artifact', 'Rare', 'Carry 500 lbs weightless'],
            ['Stone of Good Luck', 'Artifact', 'Uncommon', '+1 all saves'],
            ['Blessed Cloak', 'Equipment', 'Uncommon', '+1 AC, +2 saves vs evil'],
        ],
        [1.7*inch, 0.8*inch, 0.9*inch, 3.1*inch]
    ))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 10: PROPHECIES
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 10: Prophecies"))
    story.append(body("Every player character carries a <b>Prophecy</b>\u2014a cryptic, Gaiman-style riddle that hints at their destiny within the campaign. Prophecies are not optional; they are woven into the fabric of the narrative and directly affect the success rate. Each prophecy is hidden from the player in its full meaning\u2014you see only the riddle, not the mechanics behind it\u2014and discovering the true nature of your prophecy is itself part of the story."))

    story.append(h2("Prophecy Mechanics"))
    story.append(body("Each of the nine prophecies has four progressive states:"))
    story.append(bullet("<b>Dormant (+0):</b> The prophecy has been assigned but not yet activated. It whispers but does not act."))
    story.append(bullet("<b>Awakening (+3):</b> Events have begun to align with the prophecy. Hints appear in narration and dreams."))
    story.append(bullet("<b>Manifesting (+5):</b> The prophecy's influence is undeniable. It shapes events and demands response."))
    story.append(bullet("<b>Fulfilled (+8):</b> The prophecy has been realised. Maximum bonus. The narrative acknowledges its completion."))
    story.append(bullet("<b>Broken (\u22125):</b> The prophecy has been thwarted or contradicted. A penalty is applied. Rare and devastating."))

    story.append(h2("Prophecy Transfer"))
    story.append(body("When a player character dies, their prophecy <b>transfers</b> to the next available PC (the successor). The successor inherits the prophecy at its current state, plus accumulated grief from the previous holder. This makes successive transfers increasingly burdensome\u2014a character carrying a prophecy that has been through multiple deaths bears a heavier narrative weight than one who received it fresh."))
    story.append(body("The special case is <b>The Unwritten</b> (Prophecy #8). If the holder of The Unwritten dies, the prophecy does not transfer. Instead, the successor PC receives a <b>fresh random prophecy roll</b>. The Unwritten defies fate even in death\u2014it simply ends, and something new begins."))

    story.append(h2("The Nine Prophecies"))
    story.append(make_table(
        ['#', 'Name', 'Theme', 'Riddle Excerpt'],
        [
            ['1', "The Bearer's Burden", 'Sacrifice', '"The shard will demand what you cannot give. It whispers in the space between heartbeats..."'],
            ['2', 'The Bloodline Awakens', 'Heritage', '"Your blood remembers what your mind forgot. There is a reason the old stories speak of you..."'],
            ['3', "The Betrayer's Path", 'Treachery', '"You have stood on both sides of every war... When the shadow rises, you will remember..."'],
            ['4', 'The Deathless One', 'Reincarnation', '"Each morning, you wake and do not remember dying. This is a kindness the world has given you..."'],
            ['5', "The Oracle's Choice", 'Free Will vs Fate', '"All roads lead to the same mountain. You have seen it in dreams, in tea leaves..."'],
            ['6', 'The Nameless One', 'Identity', '"You have always been between things. Half-this, half-that, never quite belonging..."'],
            ['7', 'The Last Defender', 'Protection', '"You will save everyone except yourself. This is not a curse, though it will feel like one..."'],
            ['8', 'The Unwritten', 'Defiance', '"The prophecy is empty. You have looked for your destiny in the stars and found nothing..."'],
            ['9', 'The Chosen One', 'Misdirection', '"The old texts speak of one who will bring balance. The gods whisper your name... But prophecies are written by the victors, and the victors have been lying since before language."'],
        ],
        [0.3*inch, 1.3*inch, 1.0*inch, 3.9*inch]
    ))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 11: COMPANIONS
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 11: Companions"))
    story.append(body("The <b>Companion</b> system adds depth to party dynamics by creating a persistent relationship between your primary character and the second character in your party. This relationship is tracked through an <b>Affinity</b> score and a <b>Mood</b> state, both of which influence quest availability, narrative outcomes, and action options."))

    story.append(h2("Companion Designation"))
    story.append(body("The second PC selected during party creation is automatically designated as your <b>Companion</b>. This character travels with your primary PC throughout the campaign and has a unique relationship dynamic that other party members do not share. The Companion is identified by their ID in the <b>companionId</b> field of the game state."))

    story.append(h2("The Affinity System"))
    story.append(body("Affinity is a numerical score ranging from <b>\u2212100 to +100</b>, starting at <b>+50 (Loyal)</b>. Your choices during the campaign\u2014how you treat your companion, whether you protect them or sacrifice them, whether you share information or keep secrets\u2014cause this score to fluctuate. High affinity leads to better quest outcomes and more reliable companion action options. Low affinity can lead to the companion refusing to aid you, withholding information, or even becoming hostile."))

    story.append(h2("Mood States"))
    story.append(make_table(
        ['Mood', 'Affinity Range', 'Description'],
        [
            ['Devoted', '80+', 'Unwavering loyalty. Companion will sacrifice for you. Best quest outcomes.'],
            ['Loyal', '50-79', 'Reliable ally. Default starting state. Steady support.'],
            ['Concerned', '20-49', 'Worried about your choices. Still helps, but questions motives.'],
            ['Conflicted', '\u221220 to 19', 'Torn between loyalty and doubt. May withhold information.'],
            ['Distant', '\u221250 to \u221221', 'Emotionally withdrawn. Minimal cooperation. Quest options limited.'],
            ['Hostile', 'Below \u221250', 'Active antagonism. May sabotage or refuse aid entirely.'],
        ],
        [1.0*inch, 1.3*inch, 4.2*inch]
    ))

    story.append(h2("Companion Actions"))
    story.append(body("At higher affinity levels, your Companion may generate their own <b>action options</b> in the choice panel. These companion-sourced options allow you to leverage the Companion's unique abilities and perspective. A Devoted companion might suggest a daring rescue; a Hostile companion might suggest leaving you behind. The Companion is not merely a stat block\u2014they are a character with opinions, preferences, and limits."))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 12: ANTAGONISTS
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 12: Antagonists"))
    story.append(body("Every campaign of Deities &amp; Demigods is driven by a single, powerful <b>Antagonist</b>\u2014a Greater God, Super Monster, or legendary being whose schemes and power threaten the mythological world. The antagonist is selected <b>uniformly at random</b> from a pool of fifty-three candidates at campaign start, and their identity remains hidden until Act III, revealed progressively through a system of clues."))

    story.append(h2("The Antagonist Pool"))
    story.append(body("The pool contains <b>43 Greater Gods</b> from fourteen pantheons, <b>9 Super Monsters</b> (entities with 280+ HP), and <b>1 additional filtered monster</b>. Greater Gods represent the most powerful adversaries\u2014Zeus, Odin, Cthulhu, Shiva, and their peers. Super Monsters include legendary beasts like Fenris, Jormungandr, Malystryx, and Lord Soth."))

    story.append(h2("Progressive Revelation"))
    story.append(body("The antagonist's identity is concealed behind a <b>five-stage clue system</b>. Throughout Acts I and II, the AI DM reveals clues about the antagonist's pantheon, alignment, domain, symbol, and eventually name. Early clues are vague\u2014\"The shadows move with purpose, and something ancient stirs beneath the waves\" might hint at Poseidon. Later clues become specific\u2014\"A trident of coral and fury rises from the deep.\" By Act III, the identity is fully known, and the final confrontation begins."))

    story.append(h2("Three-Phase Boss Battle"))
    story.append(body("Act III features a <b>three-phase boss battle</b>. The antagonist has three distinct combat phases, each triggered when their HP crosses a threshold. Every Greater God has unique phase descriptions:"))
    story.append(bullet("<b>Phase 1:</b> The antagonist's standard combat abilities. Powerful but manageable."))
    story.append(bullet("<b>Phase 2:</b> Escalation. The antagonist summons allies, gains area-of-effect abilities, or increases damage output."))
    story.append(bullet("<b>Phase 3:</b> The antagonist's TRUE FORM. Maximum power, devastating abilities, all saves penalised. This is the climactic moment."))
    story.append(body("The phase transitions are triggered automatically when HP thresholds are crossed, accompanied by dramatic narration from the AI DM."))

    story.append(h2("Antagonist Banishment"))
    story.append(body("If the antagonist is defeated <b>before Act III</b> (a rare but possible outcome), they are not permanently destroyed. Instead, they are <b>banished</b> to a mythological plane determined by their pantheon\u2014Tartarus for Greek gods, Niflheim for Norse, Xibalba for Central American, and so on. There are <b>14 banishment planes</b>, one per pantheon."))
    story.append(body("A banished antagonist <b>returns at full power</b> when Act III begins. However, their banishment unlocks the <b>Archrival Summon</b>\u2014the ability to call upon the antagonist's mythologically accurate rival in the final battle. Each antagonist has a rival drawn directly from mythology: Zeus faces Typhon, Odin faces Fenris, Thor faces Jormungandr, Cthulhu faces the Elder Gods, and so on."))

    story.append(h2("Banishment Planes"))
    story.append(make_table(
        ['Pantheon', 'Banishment Plane'],
        [
            ['Greek', 'Tartarus, where even the Titans endure eternal imprisonment'],
            ['Norse', 'Niflheim, the mist-shrouded realm of perpetual winter'],
            ['Egyptian', "The Duat's darkest chamber, where the serpent's shadow coils"],
            ['Indian', 'Patala, where forgotten demons whisper older than creation'],
            ['Celtic', 'The Hollow Hills, where Fomorian kings nurse ancient grudges'],
            ['Central American', 'Xibalba, the Place of Fear, courts of bone and obsidian'],
            ['Finnish', 'Tuonela, where the river of Tuoni flows cold and silent'],
            ['Japanese', 'Yomi, the shadow land where gods cannot return unchanged'],
            ['Babylonian', 'Kur, the underworld where the gates of Ganzir open onto nothing'],
            ['Nehwon', 'The Misty Isles of the Dead'],
            ['Nonhuman', 'The Deep Realm below the roots of the world'],
            ['Melnibonean', 'The Planes of Chaos between the Young Kingdoms'],
            ['Cthulhu', 'The space between stars'],
            ['Krynn', 'The Abyss, where the Queen of Darkness rules eternal shadow'],
        ],
        [1.5*inch, 5*inch]
    ))

    # ═══════════════════════════════════════════════════════════════════════
    # CHAPTER 13: SAVING & LOADING
    # ═══════════════════════════════════════════════════════════════════════
    story.append(heading("Chapter 13: Saving &amp; Loading"))
    story.append(body("Deities &amp; Demigods automatically stores all campaign data in your browser's <b>localStorage</b>. You can save at any time and return to your campaign later. The save system is designed to be robust across game updates and version changes."))

    story.append(h2("Save Slots"))
    story.append(body("The game supports <b>multiple save slots</b>, each displaying:"))
    story.append(bullet("<b>Name:</b> The campaign name assigned at creation"))
    story.append(bullet("<b>Timestamp:</b> When the save was created"))
    story.append(bullet("<b>Turn:</b> The current turn number"))
    story.append(bullet("<b>Act:</b> Which act the campaign is in (Act I, II, or III)"))
    story.append(bullet("<b>Party Names:</b> The names of all player characters in the party"))
    story.append(body("Save slots are displayed in a management screen where you can create new saves, load existing ones, or delete saves you no longer need."))

    story.append(h2("Version Upgrades"))
    story.append(body("When you load a save from a previous version of the game, the system performs an <b>automatic merge</b> with the latest <b>createInitialState()</b> defaults. This means any new fields, mechanics, or systems added in updates are automatically incorporated into your saved campaign without losing your existing progress. You never need to start over because of an update."))

    story.append(h2("Token Tracking"))
    story.append(body("The game tracks API token usage in real time, displayed in the game header:"))
    story.append(bullet("<b>geminiTokensUsed:</b> Total tokens consumed by the Gemini 2.5 Flash AI Dungeon Master across all turns in the current session."))
    story.append(bullet("<b>groqTokensUsed:</b> Total tokens consumed by the Groq inference API (if configured) for action option generation."))
    story.append(body("These counters reset when you start a new session. They help you monitor your API usage against your free tier limits and plan accordingly."))

    story.append(h2("Data Privacy"))
    story.append(body("All save data, API keys, and game state are stored <b>exclusively in your browser's localStorage</b>. Nothing is transmitted to any server other than the Google Gemini API and (optionally) the Groq API for AI inference. Z.ai does not collect, store, or have access to your campaign data, API keys, or personal information. Your stories are yours alone."))

    # ═══════════════════════════════════════════════════════════════════════
    # COLOPHON
    # ═══════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 40))
    story.append(Paragraph("\u2014 End of Player's Handbook \u2014", ParagraphStyle('end', fontName=FONT, fontSize=11, textColor=DARK_GREEN, alignment=TA_CENTER, spaceBefore=20, spaceAfter=8)))
    story.append(Paragraph("Powered by Gemini 2.5 Flash | Built with love by Z.ai | 2025", ParagraphStyle('colophon', fontName=FONT, fontSize=9, textColor=HexColor('#888888'), alignment=TA_CENTER)))

    return story


# ═══════════════════════════════════════════════════════════════════════════
# MAIN BUILD
# ═══════════════════════════════════════════════════════════════════════════

def main():
    output_path = '/home/z/my-project/download/Deities_Demigods_Players_Handbook.pdf'
    
    doc = TocDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
        title='Deities_Demigods_Players_Handbook',
        author='Z.ai',
        creator='Z.ai',
        subject="Player's Handbook for Deities & Demigods RPG",
    )

    # Define frames
    cover_frame = Frame(0.75*inch, 0.75*inch, letter[0]-1.5*inch, letter[1]-1.5*inch, id='cover')
    normal_frame = Frame(0.75*inch, 0.75*inch, letter[0]-1.5*inch, letter[1]-1.5*inch, id='normal')

    cover_template = PageTemplate(id='cover', frames=[cover_frame], onPage=cover_page)
    normal_template = PageTemplate(id='normal', frames=[normal_frame], onPage=normal_page)

    doc.addPageTemplates([cover_template, normal_template])

    # Build content
    story = build_content()

    # Single-pass build with auto TOC via multiBuild
    doc.multiBuild(story)

    print(f"PDF generated successfully: {output_path}")
    print(f"File size: {os.path.getsize(output_path):,} bytes")


if __name__ == '__main__':
    main()
