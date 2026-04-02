const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
        ShadingType, VerticalAlign, PageNumber, PageBreak, ExternalHyperlink, TableOfContents } = require('docx');
const fs = require('fs');
const path = require('path');

// Color scheme - Dark Fantasy Theme
const colors = {
  primary: '1A1F16',      // Deep Forest Ink
  body: '2D3329',         // Dark Moss Gray
  secondary: '4A5548',    // Neutral Olive
  accent: 'C19A6B',       // Terra Cotta Gold
  tableBg: 'F8FAF7',      // Ultra-Pale Mint White
  white: 'FFFFFF'
};

// Standard table border
const tableBorder = { style: BorderStyle.SINGLE, size: 8, color: colors.secondary };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// Create the document
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Times New Roman', size: 22 } }
    },
    paragraphStyles: [
      {
        id: 'Title',
        name: 'Title',
        basedOn: 'Normal',
        run: { size: 72, bold: true, color: colors.primary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER }
      },
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 36, bold: true, color: colors.primary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 28, bold: true, color: colors.secondary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 24, bold: true, color: colors.body, font: 'Times New Roman' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: 'main-bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: 'numbered-steps',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: 'numbered-steps-2',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: 'numbered-steps-3',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: 'numbered-steps-4',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [
    // ═══════════════════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════════════════
    {
      properties: {
        page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } }
      },
      children: [
        new Paragraph({ spacing: { before: 2400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'DEITIES & DEMIGODS', size: 72, bold: true, color: colors.primary, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: 'MYTHWORLD ENGINE', size: 48, color: colors.accent, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 800, after: 200 },
          children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 24, color: colors.secondary })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 800 },
          children: [new TextRun({ text: 'THE COMPLETE RULEBOOK', size: 32, bold: true, color: colors.body, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: 'A Tactical Roleplaying Game of Divine Conflict', size: 24, italics: true, color: colors.secondary, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: 'Based on the AD&D 1st Edition Deities & Demigods (1980)', size: 22, color: colors.secondary, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 1600 },
          children: [new TextRun({ text: '195 Characters • 17 Pantheons • Infinite Adventures', size: 20, color: colors.accent, font: 'Times New Roman' })]
        }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS + MAIN CONTENT
    // ═══════════════════════════════════════════════════════════════════════════
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Deities & Demigods: Mythworld Engine', size: 18, color: colors.secondary, font: 'Times New Roman' })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '— ', size: 20, color: colors.secondary }),
              new TextRun({ children: [PageNumber.CURRENT], size: 20, color: colors.secondary }),
              new TextRun({ text: ' —', size: 20, color: colors.secondary })
            ]
          })]
        })
      },
      children: [
        // Table of Contents
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun({ text: 'Table of Contents', size: 36, bold: true })]
        }),
        new TableOfContents('Table of Contents', {
          hyperlink: true,
          headingStyleRange: '1-3'
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: 'Note: Right-click the Table of Contents and select "Update Field" to refresh page numbers.', size: 18, color: '999999', italics: true })]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════════════════════════════════════════
        // CHAPTER 1: INTRODUCTION
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Chapter 1: Introduction')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Welcome to Deities & Demigods: Mythworld Engine, a tactical roleplaying game that puts players in control of the most powerful beings across human mythology. Drawing from the original AD&D Deities & Demigods 1st Edition sourcebook (1980), this game brings together gods, demigods, heroes, and monsters from seventeen distinct mythological pantheons into a unified system for divine conflict and epic storytelling.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Unlike traditional roleplaying games where characters start as humble adventurers, Mythworld Engine assumes characters are already at the pinnacle of power. A session might see Zeus clashing with Odin, Ra confronting the machinations of Set, or Cthulhu rising from the depths to challenge all creation. The game is designed for epic scale conflicts where every decision resonates across the cosmos.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'The Mythworld Engine uses artificial intelligence to power a Dungeon Master that narrates the story, controls NPCs, and adjudicates rules in real-time. This creates a dynamic, responsive gaming experience where every playthrough is unique. The AI DM remembers your choices, tracks relationships, and weaves a narrative that responds to your actions.', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('What Makes This Game Unique')]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Mythworld Engine stands apart from other roleplaying games through several innovative features that combine classic tabletop mechanics with modern AI technology:', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'AI-Powered Dungeon Master: The game uses Gemini AI to generate rich, atmospheric narration in the style of Neil Gaiman, creating a dark fairy tale atmosphere for adult players. The AI remembers previous events and maintains narrative consistency.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Three-Act Structure: Every campaign follows a dramatic arc from introduction through escalation to climactic boss battle, with the antagonist\'s identity revealed only in the final act for maximum dramatic impact.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Shard System: Central to the game is a mysterious artifact that can summon gods to aid your party. Choose wisely when to use its limited charges, as the beings it calls may not always be friendly.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Permadeath: Character death is permanent. When a hero falls, they are gone forever, raising the stakes of every encounter and making tactical decisions meaningful.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Seventeen Pantheons: Draw from Greek, Norse, Egyptian, Cthulhu Mythos, Melnibonéan, Nehwon, Celtic, Indian, Chinese, Japanese, Central American, Babylonian, Finnish, and more mythological traditions.', size: 22, font: 'Times New Roman' })]
        }),

        // ═══════════════════════════════════════════════════════════════════════════
        // CHAPTER 2: GETTING STARTED
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Chapter 2: Getting Started')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Before you can begin your mythic journey, you need to obtain API keys that power the AI Dungeon Master. The game uses two AI services: Google Gemini for narration and Groq for fast action options. Both offer free tiers that are sufficient for gameplay.', size: 22, font: 'Times New Roman' })]
        }),

        // GEMINI API KEY SECTION
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Obtaining a Gemini API Key')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Gemini is Google\'s most advanced AI model, used in Mythworld Engine to generate rich, atmospheric narration and control the Dungeon Master. The free tier provides generous usage limits that are more than sufficient for regular gameplay. Gemini 2.5 Flash is used for its balance of speed and quality in generating narrative content.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Follow these steps to obtain your Gemini API key:', size: 22, bold: true, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps', level: 0 },
          children: [new TextRun({ text: 'Visit Google AI Studio', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Navigate to aistudio.google.com in your web browser. This is Google\'s official platform for accessing their AI models. You will need a Google account to proceed.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps', level: 0 },
          children: [new TextRun({ text: 'Sign In or Create Account', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Sign in with your existing Google account (Gmail, YouTube, etc.) or create a new one. The same account you use for Gmail will work here.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps', level: 0 },
          children: [new TextRun({ text: 'Accept Terms of Service', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'If this is your first time using Google AI Studio, you will need to accept the terms of service and usage policies. Review these carefully, especially regarding content generation.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps', level: 0 },
          children: [new TextRun({ text: 'Get API Key', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Click on "Get API Key" in the left sidebar or navigate to the API Keys section. You may need to verify your identity via phone number in some regions.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps', level: 0 },
          children: [new TextRun({ text: 'Create API Key', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Click "Create API Key" and select or create a Google Cloud project. The free tier does not require billing to be enabled, though you may need to set up a project.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps', level: 0 },
          children: [new TextRun({ text: 'Copy and Store Your Key', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Copy the API key that appears. It will look like: AIzaSy... (39 characters total). Store this securely. You will enter it into the Mythworld Engine app to enable the AI Dungeon Master.', size: 22, font: 'Times New Roman' })]
        }),

        // Gemini Pricing Table
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('Gemini Free Tier Limits')]
        }),
        new Table({
          columnWidths: [4680, 4680],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Resource', bold: true, size: 22 })] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Free Tier Limit', bold: true, size: 22 })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Requests per minute', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '15', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Requests per day', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1,500', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Tokens per minute', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1,000,000', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Tokens per day', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Unlimited', size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: 'Table 2.1: Gemini API Free Tier Limits', size: 18, italics: true, color: colors.secondary })]
        }),

        // GROQ API KEY SECTION
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Obtaining a Groq API Key')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Groq provides ultra-fast AI inference using specialized hardware (LPUs). In Mythworld Engine, Groq powers the generation of action options, providing rapid response times that keep the game flowing smoothly. While optional, a Groq key significantly improves the gameplay experience by reducing wait times between actions.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Follow these steps to obtain your Groq API key:', size: 22, bold: true, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-2', level: 0 },
          children: [new TextRun({ text: 'Visit Groq Console', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Navigate to console.groq.com in your web browser. Groq is a separate service from Google and requires its own account.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-2', level: 0 },
          children: [new TextRun({ text: 'Sign Up or Sign In', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Create a new account or sign in with an existing one. Groq supports sign-up via email, Google, or GitHub accounts.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-2', level: 0 },
          children: [new TextRun({ text: 'Navigate to API Keys', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Once logged in, look for "API Keys" in the left sidebar or in your account settings. The dashboard is straightforward and easy to navigate.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-2', level: 0 },
          children: [new TextRun({ text: 'Create New API Key', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Click "Create API Key" and give it a name like "Mythworld Engine" so you can identify it later. Groq allows multiple API keys for different projects.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-2', level: 0 },
          children: [new TextRun({ text: 'Copy and Store Your Key', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Copy the API key immediately. It will look like: gsk_xxxx... (56 characters total). You will not be able to see it again after closing the window, so store it securely.', size: 22, font: 'Times New Roman' })]
        }),

        // Groq Pricing Table
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('Groq Free Tier Limits')]
        }),
        new Table({
          columnWidths: [4680, 4680],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Resource', bold: true, size: 22 })] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Free Tier Limit', bold: true, size: 22 })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Requests per minute', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '30', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Requests per day', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '14,400', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Tokens per minute', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '30,000', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Tokens per day', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1,000,000+', size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: 'Table 2.2: Groq API Free Tier Limits', size: 18, italics: true, color: colors.secondary })]
        }),

        // ENTERING KEYS
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Entering Your API Keys')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Once you have obtained both API keys, enter them into the Mythworld Engine to begin playing. The game interface provides input fields for both keys on the main screen. Your keys are stored locally in your browser\'s localStorage and are never sent to any server except Google and Groq directly.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-3', level: 0 },
          children: [new TextRun({ text: 'Open the Mythworld Engine app in your web browser', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-3', level: 0 },
          children: [new TextRun({ text: 'Locate the API Key input fields in the header or settings panel', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-3', level: 0 },
          children: [new TextRun({ text: 'Paste your Gemini API key in the "Gemini Key" field', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-3', level: 0 },
          children: [new TextRun({ text: 'Paste your Groq API key in the "Groq Key" field (optional but recommended)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-3', level: 0 },
          children: [new TextRun({ text: 'Click "Start New Campaign" to begin your adventure', size: 22, font: 'Times New Roman' })]
        }),

        // ═══════════════════════════════════════════════════════════════════════════
        // CHAPTER 3: HOW TO PLAY
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Chapter 3: How to Play')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Starting Your Campaign')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Every campaign begins with the selection of your party. You will choose from a pool of heroes and demigods drawn from mythologies around the world. Each character has unique abilities, statistics, and personality traits that affect how they interact with the world and other characters.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'The party selection process:', size: 22, bold: true, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-4', level: 0 },
          children: [new TextRun({ text: 'Click "Start New Campaign" after entering your API keys', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-4', level: 0 },
          children: [new TextRun({ text: 'Browse the available heroes and demigods (12 random options are presented)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-4', level: 0 },
          children: [new TextRun({ text: 'Click on characters to add them to your party (you can select multiple)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-4', level: 0 },
          children: [new TextRun({ text: 'Click "Confirm Party" when ready to begin', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'numbered-steps-4', level: 0 },
          children: [new TextRun({ text: 'A mysterious Shard artifact will be assigned to your party, and the opening narration will begin', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: 'At campaign start, a Greater God is secretly selected as the antagonist. Their identity remains hidden until Act III, adding mystery and tension to your journey. Throughout Acts I and II, you will encounter hints and clues about who or what opposes you.', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Taking Actions')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'The game is turn-based, with each character taking actions in sequence. When it is your character\'s turn, the AI DM will present 3-4 action options. These options are context-aware, taking into account your character\'s abilities, current situation, and available resources. Some options may be marked as alignment-appropriate for your character.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Action options are presented as numbered choices. Click the number button (1, 2, 3, or 4) to select your action. The AI DM will then narrate the result, including any dice rolls, damage dealt, or consequences. Actions can include:', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Attack: Engage in combat using weapons or innate abilities', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Defend: Take defensive stance to reduce incoming damage', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Negotiate: Attempt to resolve conflicts through dialogue', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Explore: Investigate the environment for secrets or resources', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Use Item: Activate an item from your inventory', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Summon Shard: Use the mysterious artifact to call a god to your aid', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Dice Rolls and Resolution')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Mythworld Engine uses the classic d20 system for resolving actions. When an action has an uncertain outcome, a twenty-sided die (d20) is rolled against a Difficulty Class (DC). If the roll meets or exceeds the DC, the action succeeds. Natural 20 is always a critical success, while natural 1 is always a critical failure.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'The AI DM handles all dice rolling automatically, displaying results in the narrative. Rolls are shown with the roller\'s name, die type, result, DC, and whether it succeeded. Damage rolls use various dice (d4, d6, d8, d10, d12) depending on the weapon or ability used. All dice rolls are fair and random.', size: 22, font: 'Times New Roman' })]
        }),

        // ═══════════════════════════════════════════════════════════════════════════
        // CHAPTER 4: GAME MECHANICS
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Chapter 4: Game Mechanics')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('The Three-Act Structure')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Every Mythworld Engine campaign follows a dramatic three-act structure inspired by classical storytelling. This structure ensures a satisfying narrative arc with building tension and a climactic finale.', size: 22, font: 'Times New Roman' })]
        }),

        // Act I
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('Act I: The Awakening')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'In Act I, party members are introduced one at a time as they discover the mysterious Shard artifact. The antagonist exists only as a shadowy presence, never directly encountered. This act focuses on world-building, character development, and establishing the central mystery. Expect 5-10 turns as you explore your surroundings and meet potential allies.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Party members introduced sequentially', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Shard artifact discovered and explained', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Antagonist appears only as rumors and shadows', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Initial quests and objectives established', size: 22, font: 'Times New Roman' })]
        }),

        // Act II
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('Act II: The Gathering Storm')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Act II brings the full party together and introduces 1-2 gods or powerful NPCs per turn. Alliances are formed, rivalries emerge, and clues about the antagonist accumulate. The Shard may be used to summon allies, but charges are limited. This is the longest act, typically lasting 10-20 turns as the stakes escalate.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Full party assembled and active', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Gods and NPCs encountered regularly (1-2 per turn)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Clues about antagonist revealed through encounters', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Shard can summon divine allies (limited charges)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Side quests and character arcs develop', size: 22, font: 'Times New Roman' })]
        }),

        // Act III
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('Act III: The Divine Confrontation')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Act III is the climactic boss battle against the revealed antagonist—a Greater God with multiple combat phases. The antagonist\'s identity, hidden throughout Acts I and II, is finally revealed. Combat occurs in three phases of escalating difficulty, with the god unleashing their full divine power in the final phase. Victory or death awaits.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Antagonist identity revealed', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Three-phase boss battle', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Phase 1: Standard divine powers', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Phase 2: Summons and area effects', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Phase 3: TRUE FORM - Ultimate power unleashed', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Victory ends the campaign triumphantly', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Divine Ranks')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Characters in Mythworld Engine are organized into divine ranks that determine their base power level. Higher ranks have more hit points, stronger abilities, and greater magic resistance. Understanding these ranks is essential for tactical decision-making.', size: 22, font: 'Times New Roman' })]
        }),
        new Table({
          columnWidths: [2000, 1500, 1500, 4360],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Rank', bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'HP Range', bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MR %', bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Description', bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Greater Gods', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '300-450', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '50-100%', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Supreme deities ruling fundamental aspects of reality', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Lesser Gods', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '200-350', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '25-90%', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Middle tier divinity governing specific domains', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Demigods', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '150-300', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '0-85%', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Threshold between mortality and divinity', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Heroes', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '50-150', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Variable', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Mortals of legendary stature', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Monsters', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Varies', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Varies', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Beings outside the divine hierarchy', size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: 'Table 4.1: Divine Ranks and Statistics', size: 18, italics: true, color: colors.secondary })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('The Shard System')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Central to every campaign is the mysterious Shard artifact—an ancient piece of power from before the gods themselves. The Shard allows your party to summon divine beings to aid you, but its power is limited and its use is risky. Each Shard has only 2 charges, and once used, they are gone forever.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Using the Shard:', size: 22, bold: true, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Declare which god or type of being you wish to summon', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'A d20 roll is made against DC 10', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Success: The summoned being appears and aids your party', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Failure: Something else may appear—or nothing at all', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Some Shards favor specific pantheons or alignment types', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: 'Strategic use of the Shard can turn the tide of battle, but wasting charges on failed summons can leave you without help when you need it most. Choose your moment carefully, and consider which pantheon your Shard favors.', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Combat and Injuries')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Combat in Mythworld Engine follows AD&D 1st Edition principles with streamlined automation. When combat occurs, initiative is tracked, attacks are resolved with d20 rolls against Armor Class (AC), and damage reduces hit points. Magic Resistance (MR) provides a percentage chance to negate magical effects entirely.', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'When characters take significant damage, they may suffer Injuries that persist for multiple turns. Injuries come in four types:', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Physical: Cuts, broken bones, internal bleeding (cured by rest or healing magic)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Magic: Arcane burns, soul fractures, planar taint (cured by Dispel Magic and Restoration)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Poison: Venom, toxins, acid burns (cured by Antitoxin or Neutralize Poison)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Psionic: Mental fatigue, psychic trauma (cured by rest or psychic healing)', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: 'Each injury applies specific penalties to dice rolls, statistics, or abilities. Some injuries cause ongoing damage each turn until cured. Managing injuries requires careful use of healing items and strategic rest during the campaign.', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Items and Inventory')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Throughout your adventure, you will discover items through exploration, NPC encounters, combat rewards, and quest completion. Items are categorized by type and rarity, each providing unique effects that can aid your party.', size: 22, font: 'Times New Roman' })]
        }),
        new Table({
          columnWidths: [2340, 2340, 4680],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Item Type', bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Acquisition', bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Examples', bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Potions', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'NPCs, drops, exploration', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Healing Potion, Ambrosia, Antitoxin', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Artifacts', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Quests, gods, encounters', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Aegis Fragment, Eye of Horus, Stormbringer Shard', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Equipment', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Battle, drops, quests', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Mithral Chain, Vorpal Blade, Boots of Speed', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Scrolls', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Exploration, conversation', size: 22 })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Scroll of Wisdom, Protection, Teleportation', size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: 'Table 4.2: Item Types and Acquisition', size: 18, italics: true, color: colors.secondary })]
        }),

        // ═══════════════════════════════════════════════════════════════════════════
        // CHAPTER 5: THE PANTHEONS
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Chapter 5: The Pantheons')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Mythworld Engine draws from seventeen distinct mythological traditions, each with its own gods, heroes, and monsters. Understanding the relationships between pantheons—and between individual gods within them—can provide tactical advantages in social encounters and combat.', size: 22, font: 'Times New Roman' })]
        }),

        // Pantheon Table
        new Table({
          columnWidths: [2500, 6860],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pantheon', bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Key Deities and Themes', bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Greek', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Zeus, Hera, Athena, Apollo, Poseidon, Hades. Olympian drama, heroic tragedy, fate.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Norse', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Odin, Thor, Loki, Freya, Balder, Hel. Ragnarok, honor, cunning, inevitable doom.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Egyptian', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Ra, Osiris, Isis, Set, Anubis, Thoth. Cycles, judgment, ancient mysteries.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Cthulhu Mythos', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Cthulhu, Nyarlathotep, Shub-Niggurath. Cosmic horror, madness, ancient entities.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Melnibonéan', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Arioch, Stormbringer, Elric. Law vs Chaos, soul-drinking blades, tragic heroes.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Nehwon', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Fafhrd, Gray Mouser, Death. Sword and sorcery, urban adventure, trickery.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Celtic', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Dagda, Lugh, Morrigan, Brigit. Nature, fate, seasonal cycles, warrior poetry.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Indian', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Vishnu, Shiva, Indra, Kali. Dharma, cosmic cycles, divine avatars.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Chinese', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Jade Emperor, celestial bureaucracy. Order, hierarchy, celestial wisdom.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Japanese', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Amaterasu, Izanagi, Susanowo. Kami, honor, sun and storm.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Central American', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Quetzalcoatl, Tezcatlipoca, Tlaloc. Blood sacrifice, sun, duality.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Babylonian', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Marduk, Ishtar, Nergal. Ancient laws, cosmic order, civilization.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Finnish', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Ukko, Ilmatar, Väinämöinen. Nature magic, runic songs, epic poetry.', size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Krynn', size: 22, bold: true })] })] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Paladine, Takhisis, Raistlin. Dragonlance Chronicles, balance, redemption.', size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: 'Table 5.1: The Seventeen Pantheons', size: 18, italics: true, color: colors.secondary })]
        }),

        // ═══════════════════════════════════════════════════════════════════════════
        // APPENDIX: TIPS AND STRATEGIES
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Appendix: Tips and Strategies')]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Success in Mythworld Engine requires strategic thinking, careful resource management, and understanding of the game\'s systems. Here are proven strategies from experienced players:', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Party Composition')]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Balance your party with a mix of combat-focused and diplomacy-focused characters', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Consider pantheon synergies—gods from the same tradition may have existing relationships', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Demigods offer a good balance of power and flexibility for player characters', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Pay attention to alignment—chaotic and lawful characters may conflict in decisions', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Shard Usage')]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Save at least one Shard charge for Act III—the final battle may require divine intervention', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Research your Shard\'s favored pantheon to maximize summon success chances', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Consider summoning allies before boss battles rather than during them', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'A failed summon is not always wasted—sometimes unexpected allies appear', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Combat Tactics')]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Target enemy weaknesses when revealed—some gods have vulnerabilities to specific damage types', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Use defensive actions when heavily injured—survival is more important than damage', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Magic Resistance can negate powerful spells—consider physical attacks against high-MR foes', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'In Act III boss fights, save resources for Phase 3 when the god reveals their TRUE FORM', size: 22, font: 'Times New Roman' })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Social Encounters')]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Read NPC personalities before engaging—knowing their alignment helps predict reactions', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Ancient enmities between gods can be exploited—mentioning rivalries may sway opinions', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Gods with WIS > 15 cannot be easily deceived—honesty is often the best policy', size: 22, font: 'Times New Roman' })]
        }),
        new Paragraph({
          numbering: { reference: 'main-bullets', level: 0 },
          children: [new TextRun({ text: 'Offerings and respectful language can improve relations with prideful deities', size: 22, font: 'Times New Roman' })]
        }),

        // Final Paragraph
        new Paragraph({
          spacing: { before: 400, after: 200 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 24, color: colors.secondary })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'May your legends echo through eternity.', size: 24, italics: true, color: colors.accent, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '— The Mythworld Engine', size: 22, color: colors.secondary, font: 'Times New Roman' })]
        })
      ]
    }
  ]
});

// Generate the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/z/my-project/public/downloads/Mythworld_Engine_Rulebook.docx', buffer);
  console.log('Rulebook created successfully!');
}).catch(err => {
  console.error('Error creating rulebook:', err);
});
