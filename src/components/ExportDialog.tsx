import React from 'react';
import { toast } from 'react-toastify';
import { exportService } from '../services/exportService';
import type { GeminiAnalysis, AssemblyAITurn } from '../types';

interface ExportDialogProps {
  onClose: () => void;
  isOpen: boolean;
  transcript: string;
  analysis: GeminiAnalysis | null;
  turns?: AssemblyAITurn[];  // Add turns for subtitle generation
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  transcript,
  analysis,
  turns,
  onClose,
  isOpen
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  if (!isOpen) return null;

  const handleExport = async (format: 'pdf' | 'docx' | 'srt' | 'vtt') => {
    setIsExporting(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      const fileName = `transcript_${date}`;
      const content = {
        transcript,
        summary: analysis?.summary || '',
        correctedTranscript: analysis?.correctedTranscript || '',
        actionItems: analysis?.actionItems || [],
        topics: analysis?.topics || [],
        turns: turns || []
      };
      
      let blob: Blob;
      switch (format) {
        case 'pdf':
          blob = await exportService.exportToPDF(content);
          break;
        case 'docx':
          blob = await exportService.exportToDOCX(content);
          break;
        case 'srt':
          blob = await exportService.exportToSRT(content);
          break;
        case 'vtt':
          blob = await exportService.exportToVTT(content);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      exportService.downloadBlob(blob, `${fileName}.${format}`);
      toast.success(`Successfully exported as ${format.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to export as ${format.toUpperCase()}: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTestSubtitles = async () => {
    setIsExporting(true);
    try {
      const { srt, vtt } = await exportService.createTestSubtitles();
      exportService.downloadBlob(srt, 'test_subtitles.srt');
      exportService.downloadBlob(vtt, 'test_subtitles.vtt');
      toast.success('Test subtitle files generated successfully!');
    } catch (error) {
      console.error('Test subtitle error:', error);
      toast.error('Failed to generate test subtitles');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Export Transcript</h2>
        
        <div className="space-y-3">
          <div className="text-sm text-gray-400 mb-3">Document Formats</div>
          
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50 text-left"
          >
            📄 Export as PDF
          </button>
          
          <button
            onClick={() => handleExport('docx')}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50 text-left"
          >
            📝 Export as DOCX (Word Document)
          </button>

          <div className="text-sm text-gray-400 mb-3 mt-6">Subtitle Formats</div>
          
          <button
            onClick={() => handleExport('srt')}
            disabled={isExporting || !turns || turns.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 disabled:opacity-50 text-left"
            title={!turns || turns.length === 0 ? "No timing data available for subtitles" : ""}
          >
            🎬 Export as SRT Subtitles
          </button>
          
          <button
            onClick={() => handleExport('vtt')}
            disabled={isExporting || !turns || turns.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 disabled:opacity-50 text-left"
            title={!turns || turns.length === 0 ? "No timing data available for subtitles" : ""}
          >
            🎥 Export as VTT (WebVTT) Subtitles
          </button>

          {(!turns || turns.length === 0) && (
            <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded mb-3">
              ⚠️ Subtitle formats require recorded audio with timing data
              <br />
              <button
                onClick={handleTestSubtitles}
                disabled={isExporting}
                className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
              >
                Generate Test Subtitles
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          disabled={isExporting}
          className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
