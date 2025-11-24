/**
 * Session Export API
 * Converts session report to downloadable Markdown file
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 10;

interface SessionReport {
  userText: string;
  timestamp: string;
  insight: {
    emotional_summary: string;
    core_wound: string;
    core_desire: string;
    archetype_guess: string;
    supporting_quotes: string[];
  };
  story: {
    hero_description: string;
    villain_description: string;
    current_chapter: string;
    desired_chapter: string;
    story_paragraph: string;
  };
  prototype: {
    goal: string;
    constraints: string[];
    day_by_day_plan: {
      day: number;
      focus: string;
      tasks: string[];
    }[];
    potential_ai_features: string[];
    risks: string[];
  };
  symbol: {
    primary_symbol: string;
    secondary_symbols: string[];
    conceptual_motifs: string[];
    ui_motifs: string[];
    color_palette_suggestions: Array<{ color: string; meaning: string }>;
  };
  totalDuration?: number;
  consistency?: {
    score: number;
    notes: string[];
  };
  preprocessing?: {
    extractedQuotes: string[];
    pronoun: string;
    keywords: string[];
  };
}

/**
 * POST /api/session/export
 * Converts session report to Markdown and returns as downloadable file
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { report } = body as { report: SessionReport };

    if (!report) {
      return NextResponse.json(
        { ok: false, error: 'Session report is required' },
        { status: 400 }
      );
    }

    // Generate Markdown
    const markdown = generateMarkdown(report);

    // Return as downloadable file
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="creative-session-${Date.now()}.md"`,
      },
    });
  } catch (error: any) {
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate Markdown from session report
 */
function generateMarkdown(report: SessionReport): string {
  const date = new Date(report.timestamp).toLocaleString();

  let md = `# Creative Acceleration Session\n\n`;
  md += `**Generated:** ${date}\n`;
  md += `**Duration:** ${report.totalDuration ? (report.totalDuration / 1000).toFixed(2) : 'N/A'}s\n`;
  md += `**Consistency Score:** ${report.consistency?.score || 'N/A'}/100\n\n`;

  md += `---\n\n`;

  // Preprocessing
  if (report.preprocessing) {
    md += `## 🔬 Preprocessing\n\n`;
    md += `- **Pronoun:** ${report.preprocessing.pronoun}\n`;
    md += `- **Keywords:** ${report.preprocessing.keywords.join(', ')}\n`;
    md += `- **Extracted Quotes:** ${report.preprocessing.extractedQuotes.length}\n\n`;

    if (report.preprocessing.extractedQuotes.length > 0) {
      md += `### Quotes\n\n`;
      report.preprocessing.extractedQuotes.forEach((quote, i) => {
        md += `${i + 1}. "${quote}"\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  }

  // User Input
  md += `## 📝 Your Challenge\n\n`;
  md += `${report.userText}\n\n`;
  md += `---\n\n`;

  // Insight
  md += `## 🔮 Emotional Insight\n\n`;
  md += `**Archetype:** ${report.insight.archetype_guess}\n\n`;
  md += `### Emotional Summary\n\n`;
  md += `${report.insight.emotional_summary}\n\n`;
  md += `### Core Wound\n\n`;
  md += `> ${report.insight.core_wound}\n\n`;
  md += `### Core Desire\n\n`;
  md += `> ${report.insight.core_desire}\n\n`;

  if (report.insight.supporting_quotes.length > 0) {
    md += `### Supporting Quotes\n\n`;
    report.insight.supporting_quotes.forEach((quote, i) => {
      md += `${i + 1}. *"${quote}"*\n`;
    });
    md += `\n`;
  }

  md += `---\n\n`;

  // Story
  md += `## 📖 Story Arc\n\n`;
  md += `### The Story\n\n`;
  md += `${report.story.story_paragraph}\n\n`;
  md += `### The Hero\n\n`;
  md += `${report.story.hero_description}\n\n`;
  md += `### The Villain\n\n`;
  md += `${report.story.villain_description}\n\n`;
  md += `### Current Chapter\n\n`;
  md += `${report.story.current_chapter}\n\n`;
  md += `### Desired Chapter\n\n`;
  md += `${report.story.desired_chapter}\n\n`;
  md += `---\n\n`;

  // Prototype
  md += `## ⚡ 5-Day Sprint\n\n`;
  md += `**Goal:** ${report.prototype.goal}\n\n`;
  md += `### Constraints\n\n`;
  report.prototype.constraints.forEach((c, i) => {
    md += `${i + 1}. ${c}\n`;
  });
  md += `\n`;

  md += `### Sprint Plan\n\n`;
  report.prototype.day_by_day_plan.forEach((day) => {
    md += `#### Day ${day.day}: ${day.focus}\n\n`;
    day.tasks.forEach((task) => {
      md += `- ${task}\n`;
    });
    md += `\n`;
  });

  md += `### Potential AI Features\n\n`;
  report.prototype.potential_ai_features.forEach((feature, i) => {
    md += `${i + 1}. ${feature}\n`;
  });
  md += `\n`;

  md += `### Risks\n\n`;
  report.prototype.risks.forEach((risk, i) => {
    md += `${i + 1}. ${risk}\n`;
  });
  md += `\n`;

  md += `---\n\n`;

  // Symbol
  md += `## ✨ Visual Symbols\n\n`;
  md += `### Primary Symbol\n\n`;
  md += `${report.symbol.primary_symbol}\n\n`;
  md += `### Secondary Symbols\n\n`;
  report.symbol.secondary_symbols.forEach((s, i) => {
    md += `- ${s}\n`;
  });
  md += `\n`;

  md += `### Conceptual Motifs\n\n`;
  report.symbol.conceptual_motifs.forEach((m, i) => {
    md += `- ${m}\n`;
  });
  md += `\n`;

  md += `### UI Motifs\n\n`;
  report.symbol.ui_motifs.forEach((m, i) => {
    md += `- ${m}\n`;
  });
  md += `\n`;

  md += `### Color Palette\n\n`;
  report.symbol.color_palette_suggestions.forEach((ce) => {
    md += `- **${ce.color}**: ${ce.meaning}\n`;
  });
  md += `\n`;

  md += `---\n\n`;

  // Consistency
  if (report.consistency) {
    md += `## 🔗 Consistency Analysis\n\n`;
    md += `**Score:** ${report.consistency.score}/100\n\n`;
    md += `### Notes\n\n`;
    report.consistency.notes.forEach((note) => {
      md += `- ${note}\n`;
    });
    md += `\n`;
  }

  md += `---\n\n`;
  md += `*Generated by Creative OS - Multi-Agent Intelligence System*\n`;

  return md;
}
