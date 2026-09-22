import { jsPDF } from 'jspdf';
import type { FeedbackReport } from '@/types/feedback';
import { prettyDimension } from './utils';

interface BuildArgs {
  report: FeedbackReport;
  topic: string;
  userName: string;
  role: string;
  overallScore: number;
}

const INK = { r: 17, g: 24, b: 39 };
const MUTE = { r: 100, g: 116, b: 139 };
const GREEN = { r: 22, g: 163, b: 74 };
const AMBER = { r: 217, g: 119, b: 6 };
const RED = { r: 220, g: 38, b: 38 };
const FOREST = { r: 48, g: 81, b: 72 };

function scoreRGB(v: number) {
  if (v >= 75) return GREEN;
  if (v >= 50) return AMBER;
  return RED;
}

/** Builds a clean LIGHT-MODE PDF of the feedback report and triggers a
 *  download. Mirrors the on-screen sections without the dark styling. */
export function exportFeedbackPdf({ report, topic, userName, role, overallScore }: BuildArgs) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 48;
  const contentW = pageW - M * 2;
  let y = M;

  const ensure = (needed: number) => {
    if (y + needed > pageH - M) {
      doc.addPage();
      y = M;
    }
  };

  const setColor = (c: { r: number; g: number; b: number }) => doc.setTextColor(c.r, c.g, c.b);

  // ---- header band ----
  doc.setFillColor(FOREST.r, FOREST.g, FOREST.b);
  doc.rect(0, 0, pageW, 96, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Qlue', M, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 230, 226);
  doc.text('AI Interview Feedback Report', M, 62);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString(), pageW - M, 44, { align: 'right' });
  y = 128;

  // ---- identity + score ----
  setColor(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(userName || 'Candidate', M, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  setColor(MUTE);
  doc.text(`${role}  ·  ${topic}`, M, y);

  // score chip on the right
  const sc = scoreRGB(overallScore);
  doc.setFillColor(sc.r, sc.g, sc.b);
  doc.roundedRect(pageW - M - 96, y - 42, 96, 52, 10, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(String(overallScore), pageW - M - 48, y - 14, { align: 'center' });
  doc.setFontSize(8);
  doc.text('OVERALL / 100', pageW - M - 48, y - 2, { align: 'center' });
  y += 28;

  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, pageW - M, y);
  y += 26;

  const heading = (text: string) => {
    ensure(40);
    setColor(FOREST);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(text, M, y);
    y += 18;
  };

  const paragraph = (text: string) => {
    setColor(INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const lines = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      ensure(16);
      doc.text(line, M, y);
      y += 15;
    }
  };

  const bullets = (items: string[], emptyText: string) => {
    const list = items.length ? items : [emptyText];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    for (const it of list) {
      const lines = doc.splitTextToSize(it, contentW - 16);
      ensure(lines.length * 15 + 4);
      doc.setFillColor(FOREST.r, FOREST.g, FOREST.b);
      doc.circle(M + 3, y - 3.5, 2, 'F');
      setColor(INK);
      doc.text(lines, M + 14, y);
      y += lines.length * 15 + 4;
    }
    y += 8;
  };

  // ---- executive summary ----
  heading('Executive summary');
  paragraph(report.executiveSummary || 'No summary available.');
  y += 10;

  // ---- dimensions ----
  const dims = Object.entries(report.dimensionScores).sort((a, b) => b[1] - a[1]);
  if (dims.length) {
    heading('Dimension breakdown');
    doc.setFontSize(10);
    for (const [key, value] of dims) {
      ensure(26);
      const label = prettyDimension(key);
      setColor(INK);
      doc.setFont('helvetica', 'normal');
      doc.text(label, M, y);
      doc.setFont('helvetica', 'bold');
      doc.text(String(Math.round(value)), pageW - M, y, { align: 'right' });
      // bar
      const barY = y + 5;
      const barW = contentW;
      doc.setFillColor(233, 236, 239);
      doc.roundedRect(M, barY, barW, 6, 3, 3, 'F');
      const c = scoreRGB(value);
      doc.setFillColor(c.r, c.g, c.b);
      doc.roundedRect(M, barY, Math.max(4, (barW * Math.min(100, value)) / 100), 6, 3, 3, 'F');
      y += 24;
    }
    y += 8;
  }

  // ---- strengths ----
  heading('Your strengths');
  bullets(report.strengths, 'Great effort in completing the session.');

  // ---- improvements ----
  heading('Areas for improvement');
  bullets(report.weaknesses, 'No major weaknesses identified.');

  // ---- recommendations ----
  if (report.recommendations.length) {
    heading('Recommendations');
    bullets(report.recommendations, '');
  }

  // ---- transcript ----
  if (report.transcript.length) {
    heading('Q&A transcript');
    doc.setFontSize(10);
    for (const entry of report.transcript) {
      const isAI = entry.role.toUpperCase() === 'AI';
      const prefix = isAI ? 'Qlue: ' : 'You: ';
      const lines = doc.splitTextToSize(prefix + entry.text, contentW);
      ensure(lines.length * 14 + 8);
      setColor(isAI ? FOREST : MUTE);
      doc.setFont('helvetica', isAI ? 'bold' : 'normal');
      doc.text(lines, M, y);
      y += lines.length * 14 + 8;
    }
  }

  const safeTopic = topic.replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/\s+/g, '_');
  doc.save(`Qlue_Feedback_${safeTopic || 'Report'}.pdf`);
}
