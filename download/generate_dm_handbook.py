#!/usr/bin/env python3
"""
Deities & Demigods - Dungeon Master's Handbook PDF Generator
Comprehensive technical reference for the AI Dungeon Master engine internals.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ============================================================================
# COLOR PALETTE
# ============================================================================
DARK_RED = HexColor('#8B0000')
DARK_BLUE = HexColor('#1F4E79')
LIGHT_GRAY = HexColor('#F5F5F5')
ACCENT_GOLD = HexColor('#C19A6B')
BODY_COLOR = HexColor('#2D2D2D')
SUBTITLE_COLOR = HexColor('#4A4A4A')
DARK_BG = HexColor('#1A1A1A')

# ============================================================================
# DOCUMENT SETUP
# ============================================================================
OUTPUT_PATH = '/home/z/my-project/download/Deities_Demigods_DM_Handbook.pdf'

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,
    topMargin=1 * inch,
    bottomMargin=1 * inch,
    leftMargin=1 * inch,
    rightMargin=1 * inch,
    title='Deities_Demigods_DM_Handbook',
    author='Z.ai',
    creator='Z.ai',
    subject='Dungeon Master Handbook - AI Engine Technical Reference'
)

PAGE_WIDTH = letter[0] - 2 * inch

# ============================================================================
# STYLES
# ============================================================================
styles = getSampleStyleSheet()

# Cover styles
cover_title_style = ParagraphStyle(
    'CoverTitle', parent=styles['Title'],
    fontName='Times-Bold', fontSize=36, leading=42,
    textColor=DARK_RED, alignment=TA_CENTER, spaceAfter=12
)
cover_subtitle_style = ParagraphStyle(
    'CoverSubtitle', parent=styles['Normal'],
    fontName='Times-Italic', fontSize=16, leading=20,
    textColor=ACCENT_GOLD, alignment=TA_CENTER, spaceAfter=8
)
cover_tagline_style = ParagraphStyle(
    'CoverTagline', parent=styles['Normal'],
    fontName='Times-Roman', fontSize=11, leading=14,
    textColor=SUBTITLE_COLOR, alignment=TA_CENTER, spaceAfter=6
)

# Chapter heading
chapter_style = ParagraphStyle(
    'Chapter', parent=styles['Heading1'],
    fontName='Times-Bold', fontSize=22, leading=28,
    textColor=DARK_RED, spaceBefore=24, spaceAfter=14,
    borderWidth=0, borderPadding=0
)

# Section heading
section_style = ParagraphStyle(
    'Section', parent=styles['Heading2'],
    fontName='Times-Bold', fontSize=15, leading=20,
    textColor=DARK_BLUE, spaceBefore=16, spaceAfter=8
)

# Subsection heading
subsection_style = ParagraphStyle(
    'Subsection', parent=styles['Heading3'],
    fontName='Times-Bold', fontSize=12, leading=16,
    textColor=BODY_COLOR, spaceBefore=10, spaceAfter=6
)

# Body text
body_style = ParagraphStyle(
    'BodyText2', parent=styles['Normal'],
    fontName='Times-Roman', fontSize=10.5, leading=15,
    textColor=BODY_COLOR, alignment=TA_JUSTIFY, spaceAfter=8,
    firstLineIndent=0
)

# Indented body
body_indent_style = ParagraphStyle(
    'BodyIndent', parent=body_style,
    leftIndent=20, spaceAfter=4
)

# Code / monospace
code_style = ParagraphStyle(
    'Code', parent=styles['Normal'],
    fontName='Courier', fontSize=9, leading=12,
    textColor=HexColor('#333333'), leftIndent=20,
    spaceAfter=6, spaceBefore=4,
    backColor=HexColor('#F8F8F8'), borderWidth=0.5,
    borderColor=HexColor('#DDDDDD'), borderPadding=6
)

# Bullet style
bullet_style = ParagraphStyle(
    'BulletText', parent=body_style,
    leftIndent=24, bulletIndent=12, spaceAfter=4
)

# Numbered item style
numbered_style = ParagraphStyle(
    'NumberedText', parent=body_style,
    leftIndent=30, bulletIndent=12, spaceAfter=4
)

# Table caption
caption_style = ParagraphStyle(
    'Caption', parent=styles['Normal'],
    fontName='Times-Italic', fontSize=9, leading=12,
    textColor=SUBTITLE_COLOR, alignment=TA_CENTER,
    spaceBefore=4, spaceAfter=12
)

# Note / callout style
note_style = ParagraphStyle(
    'Note', parent=styles['Normal'],
    fontName='Times-Italic', fontSize=10, leading=14,
    textColor=HexColor('#555555'), leftIndent=20,
    borderWidth=1, borderColor=ACCENT_GOLD,
    borderPadding=8, spaceAfter=10, spaceBefore=6,
    backColor=HexColor('#FFFDF8')
)

# TOC heading
toc_title_style = ParagraphStyle(
    'TOCTitle', parent=styles['Title'],
    fontName='Times-Bold', fontSize=24, leading=30,
    textColor=DARK_RED, alignment=TA_CENTER, spaceAfter=20
)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def make_table(headers, rows, col_widths=None):
    """Create a styled table with dark blue headers and alternating rows."""
    if col_widths is None:
        num_cols = len(headers)
        col_widths = [PAGE_WIDTH / num_cols] * num_cols

    # Build table data using Paragraph objects for wrapping
    table_data = []
    header_row = [Paragraph(h, ParagraphStyle(
        'TH', fontName='Times-Bold', fontSize=9.5, leading=13,
        textColor=white, alignment=TA_CENTER
    )) for h in headers]
    table_data.append(header_row)

    for row in rows:
        styled_row = []
        for cell_text in row:
            styled_row.append(Paragraph(str(cell_text), ParagraphStyle(
                'TD', fontName='Times-Roman', fontSize=9, leading=12,
                textColor=BODY_COLOR, alignment=TA_LEFT
            )))
        table_data.append(styled_row)

    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Times-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    
    # Alternating row colors
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), LIGHT_GRAY))
        else:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), white))
    
    t.setStyle(TableStyle(style_cmds))
    return t


def bullet_list(items):
    """Create a formatted bullet list."""
    elements = []
    for item in items:
        elements.append(Paragraph(
            '<bullet>&bull;</bullet> ' + item, bullet_style
        ))
    return elements


def numbered_list(items):
    """Create a formatted numbered list."""
    elements = []
    for i, item in enumerate(items, 1):
        elements.append(Paragraph(
            f'<b>{i}.</b> {item}', numbered_style
        ))
    return elements


def chapter(title):
    """Create a chapter heading element."""
    return Paragraph(title, chapter_style)


def section(title):
    """Create a section heading element."""
    return Paragraph(title, section_style)


def subsection(title):
    """Create a subsection heading element."""
    return Paragraph(title, subsection_style)


def body(text):
    """Create a body paragraph element."""
    return Paragraph(text, body_style)


def note(text):
    """Create a note/callout element."""
    return Paragraph(text, note_style)


# ============================================================================
# TOC DOCUMENT TEMPLATE
# ============================================================================

class TocDocTemplate(SimpleDocTemplate):
    """Custom doc template with page numbers and TOC support."""
    pass


# ============================================================================
# BUILD CONTENT
# ============================================================================

story = []

# ---- COVER PAGE ----
story.append(Spacer(1, 120))
story.append(Paragraph('DEITIES &amp; DEMIGODS', cover_title_style))
story.append(Spacer(1, 8))
story.append(Paragraph("DUNGEON MASTER'S HANDBOOK", ParagraphStyle(
    'CoverTitle2', fontName='Times-Bold', fontSize=28, leading=34,
    textColor=DARK_RED, alignment=TA_CENTER, spaceAfter=20
)))
story.append(Spacer(1, 16))
story.append(Paragraph('The Arcane Machinery Behind the AI Dungeon Master', cover_subtitle_style))
story.append(Spacer(1, 40))
story.append(Paragraph('A Technical Reference for Game Masters, Developers,', cover_tagline_style))
story.append(Paragraph('and Anyone Curious About the Code Beneath the Myth', cover_tagline_style))
story.append(Spacer(1, 60))

# Decorative line
line_data = [['']]
line_table = Table(line_data, colWidths=[PAGE_WIDTH * 0.6])
line_table.setStyle(TableStyle([
    ('LINEBELOW', (0, 0), (-1, -1), 2, DARK_RED),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
]))
story.append(line_table)
story.append(Spacer(1, 60))

story.append(Paragraph('Powered by Gemini 2.5 Flash', cover_tagline_style))
story.append(Paragraph('with Optional Groq Ultra-Low Latency Fallback', cover_tagline_style))
story.append(Spacer(1, 120))
story.append(Paragraph('Version 1.0 | Confidential Technical Document', ParagraphStyle(
    'CoverFooter', fontName='Times-Italic', fontSize=9, leading=12,
    textColor=SUBTITLE_COLOR, alignment=TA_CENTER
)))
story.append(Paragraph('Generated by Z.ai', ParagraphStyle(
    'CoverFooter2', fontName='Times-Roman', fontSize=9, leading=12,
    textColor=SUBTITLE_COLOR, alignment=TA_CENTER
)))

story.append(PageBreak())

# ---- TABLE OF CONTENTS ----
story.append(Paragraph('Table of Contents', toc_title_style))
story.append(Spacer(1, 12))

toc_entries = [
    ('Chapter 1', 'AI DM Architecture', '3'),
    ('Chapter 2', 'System Prompt Construction', '6'),
    ('Chapter 3', 'DM Response Schema', '9'),
    ('Chapter 4', 'State Update Protocol', '12'),
    ('Chapter 5', 'Success Rate Engine', '14'),
    ('Chapter 6', 'Narrative Voice Guidelines', '17'),
    ('Chapter 7', 'Fallback System', '19'),
    ('Chapter 8', 'Test of Faith Engine', '22'),
    ('Chapter 9', 'Difficulty Scaling', '25'),
    ('Chapter 10', 'HP Validation &amp; Combat Safety', '27'),
    ('Chapter 11', 'Item System Internals', '29'),
    ('Chapter 12', 'Quest System', '31'),
    ('Chapter 13', 'Save/Load Architecture', '32'),
]

toc_data = []
for ch, title, pg in toc_entries:
    toc_data.append([
        Paragraph(f'<b>{ch}</b>', ParagraphStyle('TOCCh', fontName='Times-Bold', fontSize=10.5, textColor=DARK_RED)),
        Paragraph(title, ParagraphStyle('TOCTitle', fontName='Times-Roman', fontSize=10.5, textColor=BODY_COLOR)),
        Paragraph(pg, ParagraphStyle('TOCPg', fontName='Times-Roman', fontSize=10.5, textColor=SUBTITLE_COLOR, alignment=TA_CENTER)),
    ])

toc_table = Table(toc_data, colWidths=[1.2*inch, 4.0*inch, 0.8*inch])
toc_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LINEBELOW', (0, 0), (-1, -1), 0.5, HexColor('#E0E0E0')),
]))
story.append(toc_table)
story.append(PageBreak())


# ============================================================================
# CHAPTER 1: AI DM ARCHITECTURE
# ============================================================================
story.append(chapter('Chapter 1: AI DM Architecture'))

story.append(body(
    'The AI Dungeon Master at the heart of Deities &amp; Demigods is not a simple chatbot, nor is it a '
    'basic text-completion engine. It is a <b>narrative state machine</b> -- a carefully orchestrated system '
    'that combines large language model generation with deterministic game logic, state management, and '
    'structured data validation. Every turn the player takes triggers a multi-stage pipeline that transforms '
    'a game state snapshot into a rich narrative experience while simultaneously advancing the mechanical '
    'underpinnings of the campaign. Understanding this architecture is essential for anyone who wants to '
    'modify the game, debug unexpected behaviors, or extend the system with new mechanics.'
))

story.append(body(
    'The system is powered primarily by <b>Google Gemini 2.5 Flash</b>, chosen for its ability to generate '
    'long-form narrative prose while simultaneously producing structured JSON output. The Gemini model '
    'serves as the creative engine, responsible for all storytelling, character portrayal, and dramatic '
    'narration. An optional secondary engine, <b>Groq</b>, can be configured for ultra-low-latency '
    'inference on specific sub-tasks. Groq serves as a performance accelerator rather than a primary '
    'narrative generator, and the system gracefully falls back to Gemini if Groq is unavailable or rate-limited.'
))

story.append(section('1.1 Turn Processing Pipeline'))
story.append(body(
    'Every player action triggers a deterministic seven-step pipeline. This pipeline ensures that the AI '
    'receives complete, accurate context and that the resulting narrative is mechanically consistent with '
    'the current game state. No step is skipped, and every step produces verifiable output that feeds '
    'into the next stage.'
))

story.extend(numbered_list([
    '<b>Action Selection:</b> The player selects an action from the dynamically generated option list. '
    'This action string is captured and passed as the primary user input to the AI DM.',

    '<b>State Snapshot Assembly:</b> The engine calls buildDMSystem(gs), which serializes the entire '
    'GameState object into a comprehensive prompt. This includes party HP, active NPCs, quest status, '
    'prophecy state, conversation history, and all other mutable game data.',

    '<b>System Prompt Construction:</b> The serialized state is formatted into a structured system prompt '
    'containing nine distinct data blocks (detailed in Chapter 2). The prompt ends with a complete JSON '
    'schema that the AI must follow.',

    '<b>LLM Generation:</b> Gemini 2.5 Flash receives the system prompt and generates a response. The '
    'response contains both narrative prose and a structured JSON block with mechanical updates.',

    '<b>JSON Extraction:</b> A regex-based parser extracts the JSON block from the AI response. The parser '
    'handles various formatting edge cases including markdown code fences, trailing commas, and partial '
    'responses.',

    '<b>State Application (applyMechanics):</b> The extracted JSON is parsed and validated. HP deltas '
    'are applied, conditions added or removed, death flags processed, and items distributed. Every update '
    'is validated and clamped to prevent invalid states.',

    '<b>UI Update:</b> The narrative text is displayed to the player, the success rate is recalculated, '
    'new action options are generated via Groq (or fallback), and the updated game state is saved.'
]))

story.append(section('1.2 Gemini 2.5 Flash Configuration'))
story.append(body(
    'The Gemini integration is configured with carefully tuned parameters that balance narrative quality '
    'against response latency and token usage. The configuration differs between opening scene generation '
    'and regular turn processing to optimize the player experience at each stage.'
))

story.append(make_table(
    ['Parameter', 'Opening Scene', 'Regular Turn'],
    [
        ['Model', 'gemini-2.5-flash', 'gemini-2.5-flash'],
        ['Max Output Tokens', '8,000', '4,000'],
        ['Temperature', '0.9', '0.9'],
        ['Top-P', '0.95', '0.95'],
        ['Retry Count', '3', '3'],
        ['Backoff Strategy', 'Exponential (6s, 12s, 24s)', 'Exponential (6s, 12s, 24s)'],
    ],
    col_widths=[1.8*inch, 2.0*inch, 2.0*inch]
))
story.append(Paragraph('Table 1: Gemini API Configuration Parameters', caption_style))

story.append(body(
    'The opening scene receives a larger token budget (8,000) because it must establish the setting, '
    'introduce characters, present the Shard artifact, and create narrative momentum. Regular turns '
    'operate at 4,000 tokens, which is sufficient for 2-4 rich narrative paragraphs plus the structured '
    'JSON response block. The temperature of 0.9 provides creative variety while maintaining enough '
    'determinism for consistent character portrayal.'
))

story.append(section('1.3 Groq Fallback Configuration'))
story.append(body(
    'Groq provides an ultra-low-latency inference option that can dramatically reduce response times for '
    'action option generation and other sub-tasks. The Groq free tier offers generous limits that make it '
    'practical for extended play sessions without cost.'
))

story.append(make_table(
    ['Parameter', 'Value'],
    [
        ['Free Tier Rate Limit', '30 requests/minute'],
        ['Free Tier Daily Limit', '14,400 requests/day'],
        ['Typical Latency', '50-200ms (vs. 1-3s for Gemini)'],
        ['Fallback Behavior', 'Graceful degradation to Gemini on any error'],
        ['Primary Use Case', 'Action option generation, summarization'],
    ],
    col_widths=[2.4*inch, 3.4*inch]
))
story.append(Paragraph('Table 2: Groq API Free Tier Parameters', caption_style))

story.append(section('1.4 Throttling System'))
story.append(body(
    'To prevent API abuse and stay within free tier limits, the engine implements a multi-layer '
    'throttling system. This system operates transparently and does not require player intervention.'
))

story.extend(bullet_list([
    '<b>Rate Limit:</b> Maximum 15 requests per minute to the primary Gemini endpoint.',
    '<b>Minimum Interval:</b> 1.5 seconds enforced between consecutive API requests.',
    '<b>Cooldown:</b> On receiving a 429 (rate limit) response, the engine enters a 15-second cooldown '
    'period before retrying.',
    '<b>Exponential Backoff:</b> Failed requests are retried with delays of 6s, 12s, and 24s.',
    '<b>Circuit Breaker:</b> After 3 consecutive failures, the engine falls back to template-based '
    'responses until the next player action.',
]))


# ============================================================================
# CHAPTER 2: SYSTEM PROMPT CONSTRUCTION
# ============================================================================
story.append(chapter('Chapter 2: System Prompt Construction'))

story.append(body(
    'The buildDMSystem(gs) function is the architectural backbone of every AI DM interaction. Called at '
    'the start of every turn, it constructs a comprehensive system prompt by serializing the current '
    'GameState into nine distinct data blocks. Each block provides the AI with a specific category of '
    'information, ensuring the DM has complete awareness of the campaign state without overwhelming the '
    'context window. The resulting prompt is the single most important factor in narrative quality and '
    'mechanical consistency.'
))

story.append(section('2.1 The Nine Data Blocks'))

story.extend(numbered_list([
    '<b>Party State:</b> A complete roster of all living player characters, including current HP, maximum '
    'HP, Armor Class, alignment, active injuries, personality traits, ability scores, class levels, and '
    'any special conditions. Dead characters are excluded from this block to prevent the AI from '
    'referencing them as active participants.',

    '<b>Shard Info:</b> The name, pantheon association, origin lore text, remaining charges, list of '
    'previously summoned entities, and current darkened status. This block gives the AI the context '
    'needed to narrate Shard-related events and summoning outcomes.',

    '<b>Antagonist:</b> Current HP and maximum HP, combat phase, banishment status, rival information '
    '(relevant in Act III), and the count of clues revealed about the antagonist identity. This block '
    'expands significantly as the campaign progresses toward the final confrontation.',

    '<b>Prophecy:</b> The current prophecy riddle (truncated to first 150 characters to conserve tokens), '
    'its state (dormant, awakening, manifesting, fulfilled, or broken), and the ID of the PC currently '
    'carrying the prophecy. The prophecy system is central to the narrative arc and mechanical bonuses.',

    '<b>Active Quests:</b> All quests currently in the "active" state, with their uncompleted objectives '
    'listed. Completed and failed quests are excluded from this block to keep the prompt focused.',

    '<b>Act Context:</b> The current act number (I, II, or III), turn limits for the current act, and '
    'the act2StartTurn value. This allows the AI to pace the narrative appropriately and foreshadow '
    'impending transitions.',

    '<b>Conversation History:</b> The last 10 exchanges between the player and the AI DM, providing '
    'persistent NPC memory and narrative continuity. This sliding window ensures the AI remembers recent '
    'events without exceeding context limits.',

    '<b>Journey Summary:</b> A full campaign TLDR that is updated each turn by the AI itself. This '
    'summary must remain under 150 words and captures the essential plot progression, key decisions, '
    'and party status. It serves as long-term memory when the conversation history window is insufficient.',

    '<b>Success Rate:</b> The current overall success percentage along with a complete breakdown of all '
    'bonus factors contributing to it. This visibility allows the AI to calibrate narrative tension '
    'and adjust difficulty cues in the prose.'
]))

story.append(section('2.2 ASCII-Only Conversion'))
story.append(body(
    'Before being sent to the AI, the entire prompt undergoes an ASCII sanitization pass via the '
    'toAscii() utility function. This conversion strips smart quotes (replacing them with straight quotes), '
    'em dashes (replaced with double hyphens), en dashes, non-breaking spaces, ellipsis characters, and '
    'other Unicode glyphs that can cause JSON parsing failures or unexpected model behavior. This step is '
    'critical because the AI response must be parseable as valid JSON, and Unicode artifacts in the prompt '
    'can cause the model to produce malformed output. The sanitization is lossless in the sense that the '
    'narrative meaning is preserved; only the typographic encoding is normalized.'
))

story.append(section('2.3 JSON Schema Appendage'))
story.append(body(
    'The system prompt concludes with a complete JSON schema definition that the AI must follow when '
    'constructing its response. This schema specifies every field in the DMResponse object, including '
    'required fields, optional fields, data types, and nested structures. The schema acts as a contract '
    'between the AI and the game engine, ensuring that every response can be parsed and applied '
    'mechanically. The engine validates the AI response against this schema during the extraction phase, '
    'and any field that does not conform is handled by the fallback system described in Chapter 7.'
))


# ============================================================================
# CHAPTER 3: DM RESPONSE SCHEMA
# ============================================================================
story.append(chapter('Chapter 3: DM Response Schema'))

story.append(body(
    'The DMResponse is the structured data contract between the AI Dungeon Master and the game engine. '
    'Every turn, the AI must produce a JSON object conforming to this schema. The schema contains 20 '
    'top-level fields that capture every aspect of the game state update: narrative content, mechanical '
    'changes, dice results, and narrative metadata. Understanding this schema is essential for debugging, '
    'extending the game, or building custom tools that interact with the engine.'
))

story.append(section('3.1 Narrative Fields'))

story.append(make_table(
    ['Field', 'Type', 'Required', 'Description'],
    [
        ['story_summary', 'string', 'Yes', 'One-paragraph summary of what happened this turn'],
        ['journey_so_far', 'string', 'Yes', 'Updated campaign TLDR (max 150 words)'],
        ['dm_narration', 'string', 'Yes', 'Full narrative prose (300+ words, 2-4 paragraphs)'],
        ['tension_note', 'string', 'No', 'DM note on narrative tension level'],
        ['consequences', 'string', 'No', 'Description of consequences for player choices'],
    ],
    col_widths=[1.4*inch, 0.8*inch, 0.7*inch, 2.9*inch]
))
story.append(Paragraph('Table 3: DMResponse Narrative Fields', caption_style))

story.append(body(
    'The dm_narration field is the heart of the player experience. It must contain at least 300 words '
    'of rich, atmospheric prose written in a Gaiman-esque literary style. The AI is explicitly instructed '
    'to write the narrative first, then append the JSON block. The story_summary and journey_so_far fields '
    'serve as the game memory system, with the summary capturing the immediate turn events and the journey '
    'serving as a running campaign synopsis.'
))

story.append(section('3.2 Character &amp; Turn Fields'))

story.append(make_table(
    ['Field', 'Type', 'Description'],
    [
        ['human_pc_id', 'string', 'ID of the PC who acts next in the spotlight'],
        ['human_pc_reason', 'string', 'Narrative justification for why this PC acts next'],
        ['next_pc_id', 'string', 'Alternative next PC (NPC-triggered)'],
        ['pc_agreement', 'object[]', 'Per-PC party consensus rating'],
    ],
    col_widths=[1.5*inch, 0.9*inch, 3.4*inch]
))
story.append(Paragraph('Table 4: DMResponse Character &amp; Turn Fields', caption_style))

story.append(body(
    'The human_pc_id and human_pc_reason fields implement the "spotlight rotation" system, ensuring '
    'that different party members receive narrative focus across turns. The AI selects which character '
    'should be the protagonist of the next scene and provides a narrative justification. The pc_agreement '
    'array captures how each party member feels about recent events, enabling the engine to detect '
    'intra-party conflict or consensus.'
))

story.append(section('3.3 Combat &amp; Dice Fields'))

story.append(make_table(
    ['Field', 'Type', 'Description'],
    [
        ['dice_rolls', 'object[]', 'Array of d20 rolls with roller name, DC, and success boolean'],
        ['damage_dealt', 'object[]', 'Damage amounts with source and target entity IDs'],
        ['injury_events', 'object[]', 'New injuries with descriptions matched to INJURY_TABLE'],
        ['state_updates', 'object[]', 'HP deltas, conditions, death flags (core update mechanism)'],
    ],
    col_widths=[1.4*inch, 1.0*inch, 3.4*inch]
))
story.append(Paragraph('Table 5: DMResponse Combat &amp; Dice Fields', caption_style))

story.append(body(
    'Every d20 roll must be narrated, not merely reported. The AI is instructed to describe the roll '
    'dramatically, whether it succeeds or fails. The damage_dealt array tracks all damage flows, and the '
    'injury_events array provides descriptions that the engine fuzzy-matches against the INJURY_TABLE to '
    'apply mechanical injury effects. The state_updates array is the most critical field -- it is the '
    'sole mechanism through which the AI can modify the game state, and every change flows through '
    'applyMechanics() for validation.'
))

story.append(section('3.4 World State Fields'))

story.append(make_table(
    ['Field', 'Type', 'Description'],
    [
        ['npc_encounters', 'object[]', 'NPCs encountered this turn with behavior and pantheon'],
        ['new_active_npcs', 'object[]', 'NPCs added to the active NPC tracking list'],
        ['shard_event', 'string', 'Description of any Shard-related events this turn'],
        ['boss_phase_trigger', 'boolean', 'True if boss combat should advance to next phase'],
        ['item_drops', 'object[]', 'Items discovered or received this turn'],
        ['quest_updates', 'object[]', 'Quest status changes, new objectives, completions'],
    ],
    col_widths=[1.5*inch, 1.0*inch, 3.3*inch]
))
story.append(Paragraph('Table 6: DMResponse World State Fields', caption_style))

story.append(section('3.5 State Update Sub-Schema'))
story.append(body(
    'Each object in the state_updates array follows a specific sub-schema. The pc_id field is always '
    'required and serves as the routing key: it identifies which character or entity the update targets. '
    'The remaining fields are optional and specify what changes to apply.'
))

story.append(make_table(
    ['Field', 'Type', 'Required', 'Description'],
    [
        ['pc_id', 'string', 'Yes', 'Target entity ID ("ANTAGONIST" for boss HP)'],
        ['hp_delta', 'number', 'No', 'HP change (positive = heal, negative = damage)'],
        ['new_condition', 'string', 'No', 'Add a status condition (if not already present)'],
        ['remove_condition', 'string', 'No', 'Remove a specific status condition'],
        ['dead', 'boolean', 'No', 'If true, mark entity as dead (triggers Test of Faith)'],
    ],
    col_widths=[1.3*inch, 0.7*inch, 0.7*inch, 3.1*inch]
))
story.append(Paragraph('Table 7: State Update Sub-Schema', caption_style))

story.append(section('3.6 Example JSON Response'))
story.append(body('Below is a simplified example of a valid DMResponse JSON object:'))
story.append(Paragraph(
    '{<br/>'
    '&nbsp;&nbsp;"dm_narration": "The chamber trembles as Odin rises...",<br/>'
    '&nbsp;&nbsp;"story_summary": "The party confronted Odin in Asgard...",<br/>'
    '&nbsp;&nbsp;"journey_so_far": "After obtaining the Pale Shard...",<br/>'
    '&nbsp;&nbsp;"human_pc_id": "heracles",<br/>'
    '&nbsp;&nbsp;"human_pc_reason": "Heracles steps forward...",<br/>'
    '&nbsp;&nbsp;"dice_rolls": [<br/>'
    '&nbsp;&nbsp;&nbsp;&nbsp;{"roller": "Heracles", "roll": 17, "dc": 15, "success": true}<br/>'
    '&nbsp;&nbsp;],<br/>'
    '&nbsp;&nbsp;"state_updates": [<br/>'
    '&nbsp;&nbsp;&nbsp;&nbsp;{"pc_id": "heracles", "hp_delta": -12}<br/>'
    '&nbsp;&nbsp;],<br/>'
    '&nbsp;&nbsp;"npc_encounters": [{"name": "Odin", "behavior": "hostile"}],<br/>'
    '&nbsp;&nbsp;"shard_event": null,<br/>'
    '&nbsp;&nbsp;"item_drops": [],<br/>'
    '&nbsp;&nbsp;"quest_updates": []<br/>'
    '}',
    code_style
))


# ============================================================================
# CHAPTER 4: STATE UPDATE PROTOCOL
# ============================================================================
story.append(chapter('Chapter 4: State Update Protocol'))

story.append(body(
    'Every state change in the Deities &amp; Demigods engine flows through the AI JSON response and is '
    'processed by the applyMechanics() function. This centralized approach ensures that all game state '
    'mutations are validated, clamped, and logged consistently. The AI is the sole author of state '
    'changes; the player cannot directly modify HP, conditions, or any other mechanical property. This '
    'design choice enforces narrative consistency and prevents cheating or state corruption.'
))

story.append(section('4.1 HP Delta Processing'))
story.append(body(
    'HP changes are the most common state updates. The processing pipeline applies several safeguards '
    'to prevent invalid states caused by malformed AI responses:'
))
story.extend(bullet_list([
    '<b>Type Coercion:</b> Every hp_delta value is wrapped in Number() to prevent string concatenation '
    'bugs. If the AI returns "12" instead of 12, the coercion ensures numeric addition.',
    '<b>Upper Clamp:</b> HP is capped at maxHp using Math.min(maxHp, currentHp + delta). A healing '
    'potion cannot raise HP above the character maximum.',
    '<b>Lower Clamp:</b> HP is clamped to 0 minimum. HP cannot go negative, even from massive damage.',
    '<b>Antagonist Routing:</b> If pc_id equals "ANTAGONIST", the hp_delta is routed to '
    'antagonistHp instead of any character object. Antagonist HP uses separate maxHp tracking.',
]))

story.append(section('4.2 Condition Management'))
story.append(body(
    'Status conditions (such as "poisoned", "stunned", "invisible", "blessed") are managed as string '
    'arrays on each character object. The applyMechanics() function processes two condition-related '
    'fields from the state_updates:'
))
story.extend(bullet_list([
    '<b>new_condition:</b> Added to the character condition array only if not already present. This '
    'prevents duplicate conditions from stacking unintentionally.',
    '<b>remove_condition:</b> Filtered out of the character condition array. If the condition does not '
    'exist, the removal is silently ignored (no error thrown).',
    'Both operations are case-sensitive. The AI must use the exact condition string defined in the '
    'game constants to ensure proper matching.',
]))

story.append(section('4.3 Death Detection &amp; Processing'))
story.append(body(
    'Death is detected through two mechanisms. First, if the AI explicitly sets dead: true in a state '
    'update, the character is immediately marked as deceased. Second, if any HP update results in HP '
    'reaching 0, the engine automatically sets dead: true and clamps HP to 0. Upon death detection, '
    'several cascading systems activate:'
))
story.extend(numbered_list([
    'The dead flag is set to true and HP is clamped to 0.',
    'If the deceased PC was carrying the prophecy, the prophecy is transferred to another living PC '
    '(the "successor" mechanism).',
    'The Test of Faith engine is triggered (see Chapter 8) to determine if divine intervention occurs.',
    'The character is excluded from the Party State block in future prompts, preventing the AI from '
    'referencing them as active participants.',
    'All conditions on the deceased character are preserved (for potential revival mechanics).',
]))

story.append(section('4.4 Antagonist HP Routing'))
story.append(body(
    'The antagonist (final boss) is not part of the regular party array and therefore requires a '
    'separate routing mechanism. When the AI returns a state_update with pc_id set to the string '
    '"ANTAGONIST", the engine routes the hp_delta to the antagonistHp field on the GameState object. '
    'Antagonist HP is clamped between 0 and antagonistMaxHp using the same Math.min/Math.max safeguards '
    'applied to player characters. When antagonistHp reaches 0, the boss is considered defeated and '
    'the victory conditions are evaluated.'
))

story.append(section('4.5 NPC State Updates'))
story.append(body(
    'If the pc_id in a state_update does not match any character in the party, the engine searches the '
    'activeNPCs array for a matching NPC name or ID. If found, the HP delta and condition updates are '
    'applied to that NPC. If an NPC is marked as dead, they are removed from the activeNPCs list entirely, '
    'preventing them from appearing in future encounters or state snapshots.'
))

story.append(section('4.6 Save/Load State Merging'))
story.append(body(
    'The save system uses localStorage for persistence. When a saved game is loaded, the loadGame() '
    'function merges the saved state with the defaults from createInitialState(). This merge strategy '
    'handles version upgrades gracefully: if a newer version of the game adds new fields to the state '
    'object, loading an older save file will populate those fields with their default values rather than '
    'leaving them undefined. Missing fields are filled with defaults, and the game continues from the '
    'last valid state without errors.'
))


# ============================================================================
# CHAPTER 5: SUCCESS RATE ENGINE
# ============================================================================
story.append(chapter('Chapter 5: Success Rate Engine'))

story.append(body(
    'The success rate is the single most important metric in the Deities &amp; Demigods engine. It '
    'represents the party overall probability of defeating the antagonist and completing the campaign '
    'victoriously. Displayed to the player as a percentage, it is recalculated after every turn once '
    'all state updates have been applied. The success rate is not a static difficulty setting but rather '
    'an emergent property of the party current status, achievements, and narrative progress.'
))

story.append(section('5.1 The Nine Factors'))
story.append(body(
    'The calculateSuccessRate(factors) function computes the final percentage by summing nine distinct '
    'factors, each representing a different aspect of party strength or narrative advantage. The formula '
    'is designed to produce a baseline of approximately 50% for a fresh party, with meaningful variation '
    'based on player decisions and campaign events.'
))

story.append(make_table(
    ['#', 'Factor', 'Formula', 'Range', 'Description'],
    [
        ['1', 'Base Chance', '50 (fixed)', '+50', 'Starting baseline for all campaigns'],
        ['2', 'Party Living', 'min(livingPCs * 2, 10)', '+0 to +10', '+2 per living PC, max 10'],
        ['3', 'Prophecy State', 'See mapping', '-5 to +8', 'dormant +0, awakening +3, manifesting +5, fulfilled +8, broken -5'],
        ['4', 'Allied Gods', 'min(alliedGods * 3, 15)', '+0 to +15', '+3 per allied good NPC, max 15'],
        ['5', 'PC Renown', 'min(Sum(level/3), 8)', '+0 to +8', 'Sum of classLevel/3 per PC'],
        ['6', 'Power Bonus', 'min(Sum(hp/100), 10)', '+0 to +10', 'Sum of currentHP/100 per PC'],
        ['7', 'Alignment Harmony', 'clamp(harmony, -5, +5)', '-5 to +5', 'Party alignment agreement score'],
        ['8', 'Story Achievements', 'min(achievements * 2, 12)', '+0 to +12', 'Completed quests + floor(clues/2)'],
        ['9', 'Antagonist Type', 'greater_god ? -5 : 0', '-5 or 0', 'Penalty for Greater God antagonists'],
    ],
    col_widths=[0.3*inch, 0.9*inch, 1.5*inch, 0.8*inch, 2.3*inch]
))
story.append(Paragraph('Table 8: Success Rate Factor Breakdown', caption_style))

story.append(section('5.2 Total Clamping'))
story.append(body(
    'After all nine factors are summed, the total is clamped to the range [5, 95]. This prevents the '
    'success rate from reaching 0% (which would make the game unwinnable) or 100% (which would remove '
    'all tension). The clamping ensures that there is always a meaningful chance of both victory and '
    'defeat, maintaining player engagement throughout the campaign. In practice, early-game success rates '
    'typically hover around 50-65%, mid-game around 40-60%, and end-game shows the widest variance at '
    '25-75% depending on the party cumulative achievements and losses.'
))

story.append(section('5.3 Factor Recalculation Details'))
story.append(body(
    'Each factor is computed from live game state data on every recalculation. The key computations are:'
))
story.extend(bullet_list([
    '<b>livingPCs:</b> party.pcs.filter(pc => !pc.dead).length -- counts only surviving characters.',
    '<b>alliedGods:</b> npcHistory.filter(npc => npc.alignment and npc.alignment.includes("good")).length '
    '-- counts all NPCs with "good" in their alignment string.',
    '<b>pcRenown:</b> Sum of Math.max(Math.floor(pc.classLevel / 3)) across all living PCs. Includes '
    'thiefLevel as a separate component for thief-class characters.',
    '<b>pcPower:</b> Sum of (pc.hp / 100) across all living PCs, reflecting raw survivability.',
    '<b>storyAchievements:</b> completedQuests.length + Math.floor(clues.length / 2). Both quest '
    'completion and clue discovery contribute to the party narrative momentum.',
]))


# ============================================================================
# CHAPTER 6: NARRATIVE VOICE GUIDELINES
# ============================================================================
story.append(chapter('Chapter 6: Narrative Voice Guidelines'))

story.append(body(
    'The narrative voice of the Deities &amp; Demigods AI Dungeon Master is deliberately crafted to '
    'evoke the style of Neil Gaiman -- literary, atmospheric, wry, and deeply aware of the weight of '
    'myth. This is not the breezy tone of a typical chatbot nor the dry exposition of a technical manual. '
    'The DM speaks with the authority of someone who has witnessed the birth and death of gods and '
    'understands that mythology is not merely story but the architecture of belief itself.'
))

story.append(section('6.1 Prose Requirements'))
story.extend(bullet_list([
    '<b>Minimum Length:</b> dm_narration must contain at least 300 words per turn (2-4 rich paragraphs). '
    'Shorter responses are flagged by the validation system.',
    '<b>Sensory Detail:</b> Every scene must include at least two distinct sensory impressions -- the '
    'smell of ozone before a lightning bolt, the texture of ancient stone under trembling fingers, the '
    'sound of a god laughter echoing through empty halls.',
    '<b>Character Voice:</b> Each NPC speaks with a distinct voice. Odin speaks in riddles; Thor bellows; '
    'Loki whispers with honeyed words. The AI must maintain these vocal signatures across turns.',
    '<b>Mythological Weight:</b> References to the deeper mythology of each pantheon should be woven '
    'naturally into the narrative, not dumped in exposition blocks.',
]))

story.append(section('6.2 Dice Roll Narration'))
story.append(body(
    'Every d20 roll must be narrated, not merely reported. The AI is instructed to describe the physical '
    'action of the roll, the moment of tension as the die tumbles, and the dramatic outcome. A natural 20 '
    'should feel like a moment of divine favor -- the blade finding the one gap in the armor, the words '
    'striking exactly the right chord. A natural 1 should feel like fate conspiring against the hero -- '
    'the ground giving way at the worst possible moment, the spell sputtering out just as it needed to '
    'work. Even mundane successes and failures should carry narrative weight.'
))

story.append(section('6.3 Injury &amp; Death Narration'))
story.append(body(
    'Injuries are narrated with visceral, sensory detail. A deep cut is not "you take 8 damage" but '
    'rather a description of steel parting flesh, the hot rush of blood, the shock of pain that makes '
    'the world narrow to a single point. Death is treated with gravity and weight -- it is permanent '
    'in this game, and the narration must reflect that permanence. The loss of a character should feel '
    'like the loss of a mythic figure: profound, irreversible, and resonant with meaning.'
))

story.append(section('6.4 Token Budgets'))
story.append(make_table(
    ['Context', 'Token Budget', 'Purpose'],
    [
        ['Opening Scene', '8,000 tokens', 'Full establishing narrative with character introductions'],
        ['Regular Turn', '4,000 tokens', 'Ongoing narrative progression and mechanical updates'],
        ['Action Options', '200 tokens', 'Concise player choice descriptions (via Groq)'],
    ],
    col_widths=[1.5*inch, 1.3*inch, 3.0*inch]
))
story.append(Paragraph('Table 9: Narrative Token Budgets', caption_style))

story.append(note(
    'The system prompt explicitly instructs the AI: "Write the narrative prose first. Then, append the '
    'JSON block at the end." This ordering ensures that the AI prioritizes storytelling quality over '
    'mechanical bookkeeping, producing prose that reads naturally without JSON artifacts.'
))


# ============================================================================
# CHAPTER 7: FALLBACK SYSTEM
# ============================================================================
story.append(chapter('Chapter 7: Fallback System'))

story.append(body(
    'No AI system is infallible. Network connections drop, rate limits trigger, API keys expire, and '
    'sometimes the model simply produces malformed output. The Deities &amp; Demigods engine implements '
    'a comprehensive fallback system that handles six distinct failure scenarios, ensuring that the game '
    'never becomes unplayable due to a transient error. Each scenario has been designed to be recoverable '
    'except for the catastrophic case of an invalid API key.'
))

story.append(section('7.1 Scenario 1: API Rate Limit (HTTP 429)'))
story.append(body(
    'When the Gemini API returns a 429 status code, the engine initiates exponential backoff with three '
    'retry attempts. The delays are 6 seconds, 12 seconds, and 24 seconds respectively. If all three '
    'retries fail, the engine falls back to a pre-written template that generates a generic scene '
    'progression. The template is context-aware -- it references the current act, location, and party '
    'status to maintain narrative continuity even without AI generation.'
))
story.append(note('Recovery: Automatic. The next player action will retry the API call with a fresh request.'))

story.append(section('7.2 Scenario 2: Malformed JSON Response'))
story.append(body(
    'The most common failure mode is the AI producing JSON that does not perfectly conform to the '
    'expected schema. The engine handles this through a multi-stage recovery process:'
))
story.extend(numbered_list([
    '<b>Regex Extraction:</b> The engine uses a regex pattern to locate the JSON block within the AI '
    'response, handling markdown code fences, inline JSON, and various formatting edge cases.',
    '<b>Partial Parse:</b> If the JSON is partially valid (some fields missing or malformed), the engine '
    'extracts whatever fields are available and fills missing fields with safe defaults.',
    '<b>Narration Salvage:</b> The dm_narration field is always the highest priority. Even if the JSON '
    'is completely unparseable, the engine attempts to extract narrative text from the response body '
    'and displays it to the player.',
    '<b>Default State:</b> If no state_updates can be parsed, the engine assumes no state changes '
    'occurred this turn. The game continues with the previous state intact.',
]))

story.append(section('7.3 Scenario 3: Empty/Truncated Response'))
story.append(body(
    'Sometimes the AI returns an empty response or a response truncated by token limits. In these cases, '
    'the engine falls back to a library of pre-written scene templates categorized by act and narrative '
    'situation. Each template contains 200-400 words of generic but atmospheric prose that references '
    'the party and current quest context. The template system is designed to be invisible to the player '
    '-- the prose reads naturally and maintains narrative momentum.'
))

story.append(section('7.4 Scenario 4: Invalid API Key / Network Error'))
story.append(body(
    'This is the only non-recoverable failure scenario. If the API key is invalid or the network is '
    'completely unavailable, the engine displays an error message to the player explaining that the AI '
    'DM cannot be reached. The game state is preserved, and the player can retry after resolving the '
    'issue. This scenario is marked as BLOCKING because no template can substitute for the core AI '
    'narrative generation.'
))
story.append(note('Recovery: BLOCKING. Player must fix the API key or network connection to continue.'))

story.append(section('7.5 Scenario 5: Save Data Corruption'))
story.append(body(
    'Save game data stored in localStorage can theoretically become corrupted by browser storage limits, '
    'manual editing, or extension interference. The loadGame() function handles this by merging the saved '
    'data with the defaults from createInitialState(). Any missing or malformed field is replaced with '
    'its default value. This means that even a partially corrupted save can be recovered, though some '
    'progress (such as items or quest state in the corrupted fields) may be lost.'
))
story.append(note('Recovery: RECOVERABLE. Missing fields are filled with defaults; game continues.'))

story.append(section('7.6 Scenario 6: Injury ID Not Found'))
story.append(body(
    'When the AI generates an injury_event with a description that does not exactly match any entry in '
    'the INJURY_TABLE, the engine performs fuzzy matching against the table using string similarity '
    'scoring. If no match exceeds the similarity threshold, the engine assigns a generic injury from '
    'the most appropriate category (Physical, Magic, Poison, or Psionic) based on keyword analysis of '
    'the description. This ensures that every injury described in the narrative produces a mechanical '
    'effect, even if the AI uses creative or unusual terminology.'
))
story.append(note('Recovery: RECOVERABLE. Fuzzy matching finds closest injury; fallback to generic.'))

story.append(section('7.7 Post-Parse Validation'))
story.append(body(
    'After all extraction and parsing is complete, the engine performs a final validation check. The '
    'dm_narration field must exist and must be a non-empty string. If this validation fails, the engine '
    'uses a last-resort fallback template that apologizes for the interruption and provides a minimal '
    'scene description. This ensures the player always receives some narrative content, even in the '
    'worst-case failure scenario.'
))


# ============================================================================
# CHAPTER 8: TEST OF FAITH ENGINE
# ============================================================================
story.append(chapter('Chapter 8: Test of Faith Engine'))

story.append(body(
    'The Test of Faith is one of the most dramatic mechanical systems in Deities &amp; Demigods. It '
    'represents moments of divine intervention where the gods themselves intervene in mortal affairs -- '
    'sometimes to aid the party, sometimes to hinder them, and sometimes to simply watch. The system '
    'adds an element of unpredictability and mythological resonance that elevates the game beyond a '
    'pure stat-check simulation.'
))

story.append(section('8.1 Trigger Conditions'))
story.append(body(
    'The checkTestOfFaith() function runs after every applyMechanics() call. It evaluates a series of '
    'guard conditions and trigger conditions in strict order. All guard conditions must pass before any '
    'trigger condition is evaluated.'
))

story.append(subsection('Guard Conditions'))
story.extend(numbered_list([
    '<b>Act Guard:</b> Must be Act II or later. Tests of Faith do not occur during the tutorial phase '
    'of Act I.',
    '<b>Cooldown Guard:</b> At least 10 turns must have passed since the last Test of Faith. This '
    'prevents divine intervention from feeling routine or spammy.',
    '<b>Miracle Threshold:</b> Fewer than 2 miracles must have been used in the entire campaign. This '
    'ensures that miracles remain rare and dramatic.',
]))

story.append(subsection('Trigger Conditions (checked if all guards pass)'))
story.extend(numbered_list([
    '<b>Death Save:</b> A PC died this turn and has not been previously saved by a miracle. This is '
    'the most common trigger -- a dying character calls out for divine aid.',
    '<b>Boss Phase:</b> The AI set boss_phase_trigger to true, indicating the antagonist is entering '
    'a new and more dangerous combat phase.',
    '<b>Desperate Odds:</b> The success rate has dropped below 40%, indicating the party is in serious '
    'danger of campaign failure.',
]))

story.append(section('8.2 Roll Processing'))
story.append(body(
    'When a Test of Faith is triggered, the system rolls a d20 and processes the result through three '
    'outcome brackets. Each bracket produces dramatically different mechanical effects.'
))

story.append(make_table(
    ['Roll Range', 'Outcome', 'Mechanical Effects'],
    [
        ['18-20', 'MIRACLE',
         '+8 success rate, +1 shard charge, rekindle shard. Death: revive at 1 HP, restore prophecy, remove successor. Boss: 15% max HP damage.'],
        ['4-17', 'FATE HOLDS',
         'No mechanical changes. The gods watch but do not act.'],
        ['1-3', "MURPHY'S LAW",
         '-5 success rate, random item loses 1 charge, shard darkens.'],
    ],
    col_widths=[0.8*inch, 1.2*inch, 3.8*inch]
))
story.append(Paragraph('Table 10: Test of Faith Outcome Table', caption_style))

story.append(section('8.3 Miracle Effects in Detail'))
story.append(body(
    'A Miracle (roll 18-20) is the most powerful single event in the game. It combines narrative '
    'dramatics with significant mechanical benefits:'
))
story.extend(bullet_list([
    '<b>Success Rate Boost:</b> +8 percentage points, representing divine favor improving the party '
    'overall odds.',
    '<b>Shard Recharge:</b> +1 charge to the Shard artifact, allowing an additional summoning attempt.',
    '<b>Shard Rekindle:</b> If the Shard was darkened (from a previous Murphy Law result), it is '
    'restored to normal status. The shardDark flag is set to false.',
    '<b>Death Reversal:</b> If the trigger was a PC death, the deceased character is revived at 1 HP. '
    'If the prophecy had been transferred to a successor PC, the successor is removed and the original '
    'carrier reclaims the prophecy.',
    '<b>Boss Damage:</b> If the trigger was a boss phase transition, the antagonist takes damage equal '
    'to 15% of their maximum HP, representing divine wrath interfering with the boss power-up.',
]))

story.append(section('8.4 Prophecy Restoration'))
story.append(body(
    'When a Miracle reverses a death that caused a prophecy transfer, the engine must carefully unwind '
    'the succession chain. If a successor PC was added solely as a prophecy carrier (i.e., they were '
    'not already in the party for other reasons), they are removed from the party roster. The original '
    'PC reclaims their role as prophecy carrier, and the prophecy state is restored to whatever it was '
    'before the death occurred. This restoration ensures narrative consistency -- the prophecy follows '
    'its destined bearer, not an emergency replacement.'
))


# ============================================================================
# CHAPTER 9: DIFFICULTY SCALING
# ============================================================================
story.append(chapter('Chapter 9: Difficulty Scaling'))

story.append(body(
    'Difficulty in Deities &amp; Demigods is not controlled by a single slider or setting. Instead, it '
    'emerges from the complex interaction of party composition, narrative choices, resource management, '
    'and random chance. The success rate formula (Chapter 5) produces different difficulty curves at '
    'different stages of the campaign, and the AI DM is instructed to calibrate narrative tension based '
    'on the current success rate value.'
))

story.append(section('9.1 Difficulty Curve by Act'))

story.append(make_table(
    ['Act', 'Typical Success Rate', 'Characteristics'],
    [
        ['Act I', '50-65%',
         'Party forming, no major threats, prophecy dormant, full party alive'],
        ['Act II', '40-60%',
         'Antagonist -5 penalty active, injuries accumulate, NPCs may be lost'],
        ['Act III', '25-75%',
         'Boss battle, high variance, miracles possible, final confrontation'],
    ],
    col_widths=[0.8*inch, 1.5*inch, 3.5*inch]
))
story.append(Paragraph('Table 11: Difficulty Curve by Campaign Act', caption_style))

story.append(section('9.2 Difficulty-Increasing Factors'))
story.extend(bullet_list([
    '<b>PC Deaths:</b> Each death removes the +2 living PC bonus and reduces the party capability. '
    'Multiple deaths compound this effect.',
    '<b>Broken Prophecy:</b> The -5 penalty from a broken prophecy significantly impacts the success '
    'rate and represents the party failure to fulfill a divine mandate.',
    '<b>Alignment Disharmony:</b> When party members have conflicting alignments, the harmony bonus '
    'becomes a penalty, reducing the success rate by up to 5 points.',
    '<b>Greater God Antagonist:</b> The flat -5 penalty for facing a Greater God reflects the immense '
    'power differential between mortals and supreme deities.',
    '<b>Injury Accumulation:</b> Injuries reduce effective HP and combat capability, indirectly '
    'lowering the Power Bonus factor.',
]))

story.append(section('9.3 Difficulty-Decreasing Factors'))
story.extend(bullet_list([
    '<b>Allied NPCs:</b> Each good-aligned NPC in the history adds +3 to the success rate, up to a '
    'maximum of +15. Diplomatic play is rewarded mechanically.',
    '<b>Fulfilled Prophecy:</b> Achieving a fulfilled prophecy state grants +8 to the success rate, '
    'the single largest positive bonus available.',
    '<b>Completed Quests:</b> Each completed quest contributes to the Story Achievements factor, '
    'rewarding thorough exploration and engagement.',
    '<b>High PC Levels:</b> Characters with higher class levels contribute more to the PC Renown '
    'factor, representing growing legendary status.',
]))


# ============================================================================
# CHAPTER 10: HP VALIDATION & COMBAT SAFETY
# ============================================================================
story.append(chapter('Chapter 10: HP Validation &amp; Combat Safety'))

story.append(body(
    'HP management is one of the most safety-critical systems in the engine. Because the AI generates '
    'HP deltas as part of its JSON response, and because AI output can be unpredictable, the engine '
    'implements multiple layers of validation to prevent invalid HP states. These safeguards protect '
    'against both accidental errors (the AI miscounting damage) and edge cases (simultaneous death '
    'and healing effects).'
))

story.append(section('10.1 HP Capping'))
story.extend(bullet_list([
    '<b>Upper Cap:</b> HP is capped using Math.min(maxHp, currentHp + delta) for all entity types. '
    'No healing effect can raise HP above the entity maximum. This applies to PCs, NPCs, and '
    'antagonists.',
    '<b>Lower Cap:</b> HP is clamped to 0 using Math.max(0, newHp). HP cannot go negative, even from '
    'massive damage. If a character has 5 HP and takes 50 damage, HP becomes 0 (not -45).',
    '<b>Antagonist Capping:</b> Antagonist HP uses the same Math.min/Math.max pattern with '
    'antagonistMaxHp as the upper bound.',
]))

story.append(section('10.2 HP Delta Coercion'))
story.append(body(
    'Every hp_delta value from the AI response is wrapped in Number() before processing. This prevents '
    'string concatenation bugs that could occur if the AI returns a string representation of a number '
    '(e.g., "-12" instead of -12). Without this coercion, the expression currentHp + "-12" would '
    'produce string concatenation rather than subtraction, resulting in invalid HP values like '
    '"45-12" instead of 33.'
))

story.append(section('10.3 Damage Over Time (DOT)'))
story.append(body(
    'Conditions that cause ongoing damage (such as poison or bleeding) are processed at the start of '
    'each turn. The DOT check evaluates whether hp has dropped to 0 or below and, if so, sets the '
    'dead flag to true. This ensures that damage-over-time effects can kill characters, not just '
    'damage them. Death from DOT triggers the same cascade as death from direct damage: prophecy '
    'transfer, Test of Faith check, and removal from the active party block.'
))

story.append(section('10.4 Death Cascade'))
story.append(body(
    'When any entity HP reaches 0 (whether from direct damage, DOT, or a state_update with dead: true), '
    'the following cascade is triggered:'
))
story.extend(numbered_list([
    'The dead flag is set to true and HP is clamped to 0.',
    'For PCs carrying the prophecy: the prophecy is transferred to a successor.',
    'The Test of Faith engine is invoked to check for divine intervention.',
    'If no miracle occurs, the character is permanently removed from active play.',
    'For NPCs: the entity is removed from the activeNPCs array.',
    'For the antagonist: victory conditions are evaluated.',
]))


# ============================================================================
# CHAPTER 11: ITEM SYSTEM INTERNALS
# ============================================================================
story.append(chapter('Chapter 11: Item System Internals'))

story.append(body(
    'The item system in Deities &amp; Demigods is more complex than a simple inventory list. Items have '
    'active effects (triggered on use), passive modifiers (applied on equip), charges (consumed on use), '
    'and rarity tiers that influence drop rates and AI behavior. The system supports 35 distinct items '
    'across four categories, each with unique mechanical effects.'
))

story.append(section('11.1 Item Template Structure'))
story.append(body(
    'All items are defined in the ITEM_TEMPLATES constant, which contains 35 complete item definitions. '
    'Each template specifies the item name, category, rarity, description, active modifiers, passive '
    'modifiers, maximum charges, and any special conditions. The AI references these templates when '
    'generating item_drops in its response JSON.'
))

story.append(section('11.2 Active Modifiers'))
story.append(body(
    'Active modifiers are processed by the handleUseItem() function when a player uses an item from '
    'their inventory. The following modifier types are supported:'
))

story.append(make_table(
    ['Modifier', 'Effect', 'Example Items'],
    [
        ['healing', 'Restore specified HP amount', 'Healing Potion, Greater Healing Potion'],
        ['full_heal', 'Restore to max HP', 'Ambrosia'],
        ['cure_poison', 'Remove poison conditions', 'Antitoxin, Universal Antidote'],
        ['cure_all_poison', 'Remove all injuries in poison category', 'Universal Antidote'],
        ['death_ward', 'Prevent next death', 'Aegis Fragment'],
        ['invisible', 'Apply invisible condition', 'Potion of Invisibility'],
        ['str_set', 'Set STR to specified value', 'Potion of Giant Strength'],
    ],
    col_widths=[1.3*inch, 2.2*inch, 2.3*inch]
))
story.append(Paragraph('Table 12: Active Item Modifiers', caption_style))

story.append(section('11.3 Passive Modifiers'))
story.append(body(
    'Passive modifiers are applied when an item is equipped and remain active until the item is '
    'unequipped or its charges are depleted. Passive modifiers include:'
))
story.extend(bullet_list([
    '<b>damage:</b> Adds flat damage bonus to all attacks.',
    '<b>ac:</b> Improves Armor Class (lower is better).',
    '<b>regen:</b> Restores a fixed HP amount at the start of each turn.',
    '<b>vampiric:</b> Heals the wielder for a percentage of damage dealt.',
    '<b>fear_immune:</b> Prevents fear-based conditions and morale checks.',
    '<b>true_sight:</b> Reveals invisible entities and illusions.',
]))

story.append(section('11.4 Deep Copy Safety'))
story.append(body(
    'A critical implementation detail: the cure_all_poison modifier deep copies the injuries array '
    'before filtering out poison-type injuries. This prevents cache corruption that could occur if the '
    'engine mutated the injuries array directly. Without the deep copy, reference sharing between the '
    'game state and the React component state could cause phantom injuries to appear or disappear '
    'between renders. This is a common pitfall in JavaScript state management, and the deep copy '
    'ensures that each state mutation produces a clean, independent object graph.'
))

story.append(section('11.5 Charge System'))
story.append(body(
    'Items with limited charges track their remaining uses in the charges field. Each use decrements '
    'the charge count by 1. When charges reach 0, the item remains in inventory but becomes unusable. '
    'The AI generates item_drops in its response JSON, and the engine adds new items (with full charges) '
    'to the appropriate party member inventory. Certain powerful items have only 1 charge, making each '
    'use a significant strategic decision.'
))


# ============================================================================
# CHAPTER 12: QUEST SYSTEM
# ============================================================================
story.append(chapter('Chapter 12: Quest System'))

story.append(body(
    'The quest system tracks narrative objectives that provide structure to the campaign and contribute '
    'to the success rate calculation. Quests are managed as structured objects with well-defined states, '
    'and the AI DM generates quest_updates as part of every turn response to advance or modify quests.'
))

story.append(section('12.1 Quest Object Structure'))
story.append(body(
    'Each quest is represented by a Quest object containing the following fields:'
))
story.extend(bullet_list([
    '<b>id:</b> Unique string identifier for the quest.',
    '<b>title:</b> Display name shown in the quest log.',
    '<b>description:</b> Full narrative description of the quest objectives.',
    '<b>type:</b> One of "main", "side", or "hidden". Main quests drive the central plot; side quests '
    'offer optional rewards; hidden quests are revealed through exploration.',
    '<b>status:</b> One of "active", "completed", or "failed". Only active quests appear in the '
    'system prompt for DM awareness.',
    '<b>objectives:</b> Array of specific, measurable objectives that must be completed.',
    '<b>rewards:</b> Description of rewards granted upon completion.',
]))

story.append(section('12.2 Starting Quests'))
story.append(body(
    'Every new campaign begins with two quests automatically added to the quest log:'
))
story.extend(bullet_list([
    '<b>"The Shard Awakens" (main):</b> The central quest that drives the entire campaign. '
    'Objectives include discovering the Shard, understanding its power, and using it against the '
    'antagonist.',
    '<b>"Divine Allies" (side):</b> A side quest encouraging the party to seek out and befriend '
    'NPCs, particularly good-aligned deities who can contribute to the success rate.',
]))

story.append(section('12.3 Quest Updates'))
story.append(body(
    'The AI generates quest_updates in its response JSON each turn. These updates can create new quests, '
    'advance existing quest objectives, complete quests, or mark quests as failed. The quest_updates are '
    'included in the system prompt schema so the AI DM is always aware of the current quest landscape '
    'and can make narrative decisions that align with active objectives.'
))


# ============================================================================
# CHAPTER 13: SAVE/LOAD ARCHITECTURE
# ============================================================================
story.append(chapter('Chapter 13: Save/Load Architecture'))

story.append(body(
    'The save/load system provides persistent storage for campaign progress using the browser '
    'localStorage API. The system is designed for reliability and forward compatibility, handling '
    'version upgrades gracefully by merging saved data with default state templates.'
))

story.append(section('13.1 Save Slots'))
story.append(body(
    'The game supports multiple save slots, each represented by a SaveSlot interface:'
))
story.extend(bullet_list([
    '<b>id:</b> Unique identifier for the save slot.',
    '<b>name:</b> Player-assigned name for the save.',
    '<b>timestamp:</b> ISO date string of when the save was created.',
    '<b>turn:</b> The game turn number at the time of saving.',
    '<b>act:</b> The current act (1, 2, or 3).',
    '<b>partyNames:</b> Array of party member names for quick identification.',
]))

story.append(section('13.2 Save Mechanism'))
story.append(body(
    'When the player saves (manually or via auto-save), the complete GameState object is serialized to '
    'JSON and stored in localStorage under a key derived from the save slot ID. The serialization '
    'includes all mutable game state: party data, antagonist HP, quest status, prophecy state, NPC '
    'history, conversation history, Shard status, items, injuries, and the journey summary.'
))

story.append(section('13.3 Load Mechanism'))
story.append(body(
    'When loading a saved game, the loadGame() function performs a merge operation between the saved '
    'state and the defaults from createInitialState(). This merge follows a simple rule: for every '
    'field in the default state, if the saved state contains a value for that field, the saved value '
    'is used; otherwise, the default value is applied. This approach provides several benefits:'
))
story.extend(bullet_list([
    '<b>Version Upgrade Compatibility:</b> New fields added in later game versions are populated with '
    'defaults when loading older saves.',
    '<b>Corruption Recovery:</b> Missing or undefined fields do not cause crashes; they are silently '
    'replaced with safe defaults.',
    '<b>Debugging Support:</b> Developers can manually edit localStorage entries to test specific '
    'game states without worrying about incomplete data.',
]))

story.append(body(
    'The load operation is atomic: if any error occurs during deserialization, the system falls back '
    'to createInitialState() and starts a fresh game rather than crashing. This ensures that the game '
    'is always launchable, even if saved data is corrupted beyond recovery.'
))

story.append(Spacer(1, 40))

# Final decorative line
line_data2 = [['']]
line_table2 = Table(line_data2, colWidths=[PAGE_WIDTH * 0.4])
line_table2.setStyle(TableStyle([
    ('LINEBELOW', (0, 0), (-1, -1), 1.5, DARK_RED),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
]))
story.append(line_table2)

story.append(Spacer(1, 12))
story.append(Paragraph(
    '<i>End of Dungeon Master\'s Handbook</i>',
    ParagraphStyle('EndNote', fontName='Times-Italic', fontSize=10, textColor=SUBTITLE_COLOR, alignment=TA_CENTER)
))
story.append(Paragraph(
    'Deities &amp; Demigods | Technical Reference v1.0 | Generated by Z.ai',
    ParagraphStyle('EndFooter', fontName='Times-Roman', fontSize=8, textColor=SUBTITLE_COLOR, alignment=TA_CENTER)
))


# ============================================================================
# PAGE NUMBERING
# ============================================================================

def add_page_number(canvas_obj, doc_obj):
    """Add page numbers and header/footer to each page."""
    canvas_obj.saveState()
    page_num = doc_obj.page

    # Footer - page number
    canvas_obj.setFont('Times-Roman', 8)
    canvas_obj.setFillColor(HexColor('#999999'))
    canvas_obj.drawCentredString(
        letter[0] / 2, 0.5 * inch,
        f'-- {page_num} --'
    )

    # Header - skip cover page
    if page_num > 1:
        canvas_obj.setFont('Times-Italic', 7)
        canvas_obj.setFillColor(HexColor('#AAAAAA'))
        canvas_obj.drawRightString(
            letter[0] - inch, letter[1] - 0.6 * inch,
            "Deities & Demigods -- DM's Handbook"
        )
        canvas_obj.line(
            inch, letter[1] - 0.7 * inch,
            letter[0] - inch, letter[1] - 0.7 * inch
        )

    canvas_obj.restoreState()


# ============================================================================
# BUILD THE PDF
# ============================================================================

def build():
    """Build the PDF document."""
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"PDF generated successfully: {OUTPUT_PATH}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH):,} bytes")

if __name__ == '__main__':
    build()
