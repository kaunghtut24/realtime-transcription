import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import type { AssemblyAITurn } from '../types';

interface ExportContent {
  transcript: string;
  summary: string;
  correctedTranscript: string;
  actionItems: string[];
  topics: string[];
  turns?: AssemblyAITurn[];  // Add turns for subtitle generation
}

export class ExportService {
  async exportToPDF(content: ExportContent): Promise<Blob> {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width - 2 * margin;
    
    // Add title
    doc.setFontSize(18);
    doc.text('Transcript Export', margin, margin);
    
    // Add metadata
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, margin + 10);
    
    // Add transcript section
    let y = margin + 25;
    doc.setFontSize(14);
    doc.text('Original Transcript', margin, y);
    y += 10;
    
    doc.setFontSize(12);
    const transcriptLines = doc.splitTextToSize(content.transcript, pageWidth);
    transcriptLines.forEach((line: string) => {
      if (y > doc.internal.pageSize.height - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 7;
    });
    
    // Add analysis if available
    if (content.summary) {
      doc.addPage();
      y = margin;
      
      doc.setFontSize(16);
      doc.text('Analysis', margin, y);
      y += 10;
      
      // Summary
      doc.setFontSize(14);
      doc.text('Summary', margin, y);
      y += 7;
      
      doc.setFontSize(12);
      const summaryLines = doc.splitTextToSize(content.summary, pageWidth);
      summaryLines.forEach((line: string) => {
        if (y > doc.internal.pageSize.height - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 7;
      });

      // Topics
      if (content.topics.length > 0) {
        y += 10;
        doc.setFontSize(14);
        doc.text('Topics', margin, y);
        y += 7;

        doc.setFontSize(12);
        content.topics.forEach((topic: string) => {
          if (y > doc.internal.pageSize.height - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(`• ${topic}`, margin, y);
          y += 7;
        });
      }

      // Action Items
      if (content.actionItems.length > 0) {
        y += 10;
        doc.setFontSize(14);
        doc.text('Action Items', margin, y);
        y += 7;

        doc.setFontSize(12);
        content.actionItems.forEach((item: string) => {
          const itemLines = doc.splitTextToSize(`• ${item}`, pageWidth);
          itemLines.forEach((line: string) => {
            if (y > doc.internal.pageSize.height - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin, y);
            y += 7;
          });
        });
      }
    }

    return doc.output('blob');
  }

  async exportToDOCX(content: ExportContent): Promise<Blob> {
    try {
      console.log('📝 Starting DOCX export with content:', {
        transcriptLength: content.transcript.length,
        hasSummary: !!content.summary,
        actionItemsCount: content.actionItems.length,
        topicsCount: content.topics.length
      });

      const children: Paragraph[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Transcript Export',
              bold: true,
              size: 32
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Date: ${new Date().toLocaleString()}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [new TextRun({ text: "" })]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Original Transcript",
              bold: true,
              size: 28
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: content.transcript,
              size: 24
            })
          ]
        })
      ];

      // Add analysis sections if available
      if (content.summary) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "" })]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Analysis",
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Summary",
                bold: true,
                size: 26
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: content.summary,
                size: 24
              })
            ]
          })
        );

        if (content.topics.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Topics",
                  bold: true,
                  size: 26
                })
              ]
            })
          );

          content.topics.forEach((topic: string) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${topic}`,
                    size: 24
                  })
                ]
              })
            );
          });
        }

        if (content.actionItems.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Action Items",
                  bold: true,
                  size: 26
                })
              ]
            })
          );

          content.actionItems.forEach((item: string) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${item}`,
                    size: 24
                  })
                ]
              })
            );
          });
        }
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });

      console.log('📝 DOCX document created, generating blob...');
      const blob = await Packer.toBlob(doc);
      console.log('✅ DOCX export completed successfully');
      return blob;
    } catch (error) {
      console.error('❌ DOCX export failed:', error);
      throw new Error(`DOCX export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper function to format time for SRT format (HH:MM:SS,mmm)
  private formatTimeForSRT(timeInSeconds: number): string {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  // Helper function to format time for VTT format (HH:MM:SS.mmm)
  private formatTimeForVTT(timeInSeconds: number): string {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  async exportToSRT(content: ExportContent): Promise<Blob> {
    if (!content.turns || content.turns.length === 0) {
      throw new Error('No timing data available for subtitle generation');
    }

    let srtContent = '';
    let subtitleIndex = 1;

    for (const turn of content.turns) {
      if (turn.words && turn.words.length > 0) {
        // Group words into subtitle chunks (max ~80 characters or 5 seconds)
        let currentChunk: any[] = [];
        let currentText = '';
        let chunkStartTime = turn.words[0].start;
        let chunkEndTime = turn.words[0].end;

        for (const word of turn.words) {
          // Check if we should start a new chunk
          const wouldExceedLength = (currentText + ' ' + word.text).length > 80;
          const wouldExceedTime = word.end - chunkStartTime > 5.0;
          
          if (currentChunk.length > 0 && (wouldExceedLength || wouldExceedTime)) {
            // Generate subtitle for current chunk
            srtContent += `${subtitleIndex}\n`;
            srtContent += `${this.formatTimeForSRT(chunkStartTime)} --> ${this.formatTimeForSRT(chunkEndTime)}\n`;
            srtContent += `${currentText.trim()}\n\n`;
            subtitleIndex++;

            // Start new chunk
            currentChunk = [word];
            currentText = word.text;
            chunkStartTime = word.start;
            chunkEndTime = word.end;
          } else {
            // Add to current chunk
            currentChunk.push(word);
            currentText += (currentText ? ' ' : '') + word.text;
            chunkEndTime = word.end;
          }
        }

        // Add the final chunk if there are remaining words
        if (currentChunk.length > 0 && currentText.trim()) {
          srtContent += `${subtitleIndex}\n`;
          srtContent += `${this.formatTimeForSRT(chunkStartTime)} --> ${this.formatTimeForSRT(chunkEndTime)}\n`;
          srtContent += `${currentText.trim()}\n\n`;
          subtitleIndex++;
        }
      }
    }

    return new Blob([srtContent], { type: 'text/plain; charset=utf-8' });
  }

  async exportToVTT(content: ExportContent): Promise<Blob> {
    if (!content.turns || content.turns.length === 0) {
      throw new Error('No timing data available for subtitle generation');
    }

    let vttContent = 'WEBVTT\n\n';

    for (const turn of content.turns) {
      if (turn.words && turn.words.length > 0) {
        // Group words into subtitle chunks (max ~80 characters or 5 seconds)
        let currentChunk: any[] = [];
        let currentText = '';
        let chunkStartTime = turn.words[0].start;
        let chunkEndTime = turn.words[0].end;

        for (const word of turn.words) {
          // Check if we should start a new chunk
          const wouldExceedLength = (currentText + ' ' + word.text).length > 80;
          const wouldExceedTime = word.end - chunkStartTime > 5.0;
          
          if (currentChunk.length > 0 && (wouldExceedLength || wouldExceedTime)) {
            // Generate subtitle for current chunk
            vttContent += `${this.formatTimeForVTT(chunkStartTime)} --> ${this.formatTimeForVTT(chunkEndTime)}\n`;
            vttContent += `${currentText.trim()}\n\n`;

            // Start new chunk
            currentChunk = [word];
            currentText = word.text;
            chunkStartTime = word.start;
            chunkEndTime = word.end;
          } else {
            // Add to current chunk
            currentChunk.push(word);
            currentText += (currentText ? ' ' : '') + word.text;
            chunkEndTime = word.end;
          }
        }

        // Add the final chunk if there are remaining words
        if (currentChunk.length > 0 && currentText.trim()) {
          vttContent += `${this.formatTimeForVTT(chunkStartTime)} --> ${this.formatTimeForVTT(chunkEndTime)}\n`;
          vttContent += `${currentText.trim()}\n\n`;
        }
      }
    }

    return new Blob([vttContent], { type: 'text/vtt; charset=utf-8' });
  }

  public downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Test function to create sample subtitle data
  public async createTestSubtitles(): Promise<{ srt: Blob; vtt: Blob }> {
    const testTurns: AssemblyAITurn[] = [
      {
        type: 'Turn',
        turn_order: 1,
        turn_is_formatted: true,
        end_of_turn: true,
        transcript: 'Hello everyone, welcome to this test recording.',
        words: [
          { text: 'Hello', word_is_final: true, start: 0.5, end: 1.0, confidence: 0.95 },
          { text: 'everyone,', word_is_final: true, start: 1.1, end: 1.8, confidence: 0.98 },
          { text: 'welcome', word_is_final: true, start: 2.0, end: 2.6, confidence: 0.97 },
          { text: 'to', word_is_final: true, start: 2.7, end: 2.9, confidence: 0.99 },
          { text: 'this', word_is_final: true, start: 3.0, end: 3.3, confidence: 0.98 },
          { text: 'test', word_is_final: true, start: 3.4, end: 3.8, confidence: 0.96 },
          { text: 'recording.', word_is_final: true, start: 3.9, end: 4.5, confidence: 0.94 }
        ]
      },
      {
        type: 'Turn',
        turn_order: 2,
        turn_is_formatted: true,
        end_of_turn: true,
        transcript: 'This is a demonstration of the subtitle export functionality.',
        words: [
          { text: 'This', word_is_final: true, start: 5.0, end: 5.3, confidence: 0.98 },
          { text: 'is', word_is_final: true, start: 5.4, end: 5.6, confidence: 0.99 },
          { text: 'a', word_is_final: true, start: 5.7, end: 5.8, confidence: 0.97 },
          { text: 'demonstration', word_is_final: true, start: 5.9, end: 6.8, confidence: 0.95 },
          { text: 'of', word_is_final: true, start: 6.9, end: 7.1, confidence: 0.98 },
          { text: 'the', word_is_final: true, start: 7.2, end: 7.4, confidence: 0.99 },
          { text: 'subtitle', word_is_final: true, start: 7.5, end: 8.1, confidence: 0.96 },
          { text: 'export', word_is_final: true, start: 8.2, end: 8.7, confidence: 0.97 },
          { text: 'functionality.', word_is_final: true, start: 8.8, end: 9.5, confidence: 0.94 }
        ]
      }
    ];

    const content = {
      transcript: 'Test transcript',
      summary: '',
      correctedTranscript: '',
      actionItems: [],
      topics: [],
      turns: testTurns
    };

    const srtBlob = await this.exportToSRT(content);
    const vttBlob = await this.exportToVTT(content);

    return { srt: srtBlob, vtt: vttBlob };
  }
}

export const exportService = new ExportService();
