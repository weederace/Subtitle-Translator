import { SubtitleItem, SubtitleFormat } from '../types';

/**
 * Splits a string by a delimiter up to N times
 */
function splitN(str: string, delimiter: string, n: number): string[] {
  const parts: string[] = [];
  let current = str;
  for (let i = 0; i < n; i++) {
    const idx = current.indexOf(delimiter);
    if (idx === -1) break;
    parts.push(current.substring(0, idx));
    current = current.substring(idx + 1);
  }
  parts.push(current);
  return parts;
}

/**
 * Parse SRT Subtitle Format
 */
export function parseSRT(content: string): SubtitleItem[] {
  // Normalize newlines
  const normalized = content.replace(/\r\n/g, '\n').trim();
  // Split by double newlines to get subtitle blocks
  const blocks = normalized.split(/\n\s*\n/);
  const items: SubtitleItem[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const lines = block.split('\n').map(l => l.trim());
    if (lines.length < 2) continue;

    let indexLine = '';
    let timestampLine = '';
    let textStartLineIndex = 2;

    // Check if first line contains the arrow (meaning no index line is present)
    if (lines[0].includes('-->')) {
      timestampLine = lines[0];
      textStartLineIndex = 1;
    } else {
      indexLine = lines[0];
      timestampLine = lines[1];
    }

    if (!timestampLine || !timestampLine.includes('-->')) {
      // Find the line that actually has -->
      const tsIdx = lines.findIndex(l => l.includes('-->'));
      if (tsIdx !== -1) {
        timestampLine = lines[tsIdx];
        textStartLineIndex = tsIdx + 1;
        indexLine = lines.slice(0, tsIdx).join(' ');
      } else {
        continue; // Skip invalid block
      }
    }

    const [start, end] = timestampLine.split('-->').map(t => t.trim());
    const textLines = lines.slice(textStartLineIndex);
    const text = textLines.join('\n');

    // Extract speaker prefix if any (e.g. "Narrator: Hello" or "[Narrator] Hello")
    let speaker = '';
    let dialogueText = text;
    const speakerMatch = text.match(/^([A-Za-z0-9\s_-]+):\s*(.*)/s);
    if (speakerMatch) {
      speaker = speakerMatch[1] + ': ';
      dialogueText = speakerMatch[2];
    }

    items.push({
      id: indexLine || String(items.length + 1),
      startTime: start,
      endTime: end,
      text: dialogueText,
      originalText: dialogueText,
      speaker: speaker || undefined,
    });
  }

  return items;
}

/**
 * Serialize SubtitleItems to SRT Format
 */
export function serializeSRT(items: SubtitleItem[]): string {
  return items.map((item, idx) => {
    const text = item.speaker ? `${item.speaker}${item.translatedText || item.text}` : (item.translatedText || item.text);
    return `${item.id || (idx + 1)}\n${item.startTime} --> ${item.endTime}\n${text}\n`;
  }).join('\n') + '\n';
}

/**
 * Parse VTT Subtitle Format
 */
export function parseVTT(content: string): SubtitleItem[] {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  
  // Find where actual content begins (skip WEBVTT header and global metadata/NOTES)
  let startIdx = 0;
  while (startIdx < lines.length) {
    const line = lines[startIdx].trim();
    if (line.startsWith('WEBVTT') || line.startsWith('NOTE') || line === '') {
      startIdx++;
    } else {
      break;
    }
  }

  const restContent = lines.slice(startIdx).join('\n').trim();
  const blocks = restContent.split(/\n\s*\n/);
  const items: SubtitleItem[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const blockLines = block.split('\n').map(l => l.trim());
    let timestampLine = '';
    let indexLine = '';
    let textStartLineIndex = 1;

    if (blockLines[0].includes('-->')) {
      timestampLine = blockLines[0];
    } else if (blockLines.length >= 2 && blockLines[1].includes('-->')) {
      indexLine = blockLines[0];
      timestampLine = blockLines[1];
      textStartLineIndex = 2;
    } else {
      const tsIdx = blockLines.findIndex(l => l.includes('-->'));
      if (tsIdx !== -1) {
        timestampLine = blockLines[tsIdx];
        indexLine = blockLines.slice(0, tsIdx).join(' ');
        textStartLineIndex = tsIdx + 1;
      } else {
        continue; // No timestamp line found, skip
      }
    }

    const [start, end] = timestampLine.split('-->').map(t => t.trim());
    const textLines = blockLines.slice(textStartLineIndex);
    const text = textLines.join('\n');

    let speaker = '';
    let dialogueText = text;
    const speakerMatch = text.match(/^([A-Za-z0-9\s_-]+):\s*(.*)/s);
    if (speakerMatch) {
      speaker = speakerMatch[1] + ': ';
      dialogueText = speakerMatch[2];
    }

    items.push({
      id: indexLine || String(items.length + 1),
      startTime: start,
      endTime: end,
      text: dialogueText,
      originalText: dialogueText,
      speaker: speaker || undefined,
    });
  }

  return items;
}

/**
 * Serialize SubtitleItems to VTT Format
 */
export function serializeVTT(items: SubtitleItem[]): string {
  let output = 'WEBVTT\n\n';
  output += items.map((item, idx) => {
    const text = item.speaker ? `${item.speaker}${item.translatedText || item.text}` : (item.translatedText || item.text);
    const idLine = item.id ? `${item.id}\n` : '';
    return `${idLine}${item.startTime} --> ${item.endTime}\n${text}\n`;
  }).join('\n') + '\n';
  return output;
}

/**
 * Parse ASS/SSA Subtitle Format
 */
export function parseASS(content: string): { items: SubtitleItem[]; rawLines: Array<{ type: 'raw' | 'dialogue'; content: string; index?: number }> } {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const items: SubtitleItem[] = [];
  const rawLines: Array<{ type: 'raw' | 'dialogue'; content: string; index?: number }> = [];

  let inEvents = false;
  let formatFields: string[] = [];
  let startIndex = 1;
  let endIndex = 2;
  let textIndex = 9; // Default Text column is 9 in typical files

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('[Events]')) {
      inEvents = true;
      rawLines.push({ type: 'raw', content: line });
      continue;
    }

    if (inEvents && trimmedLine.startsWith('Format:')) {
      rawLines.push({ type: 'raw', content: line });
      const formatString = trimmedLine.substring(7).trim();
      formatFields = formatString.split(',').map(f => f.trim());
      
      const sIdx = formatFields.findIndex(f => f === 'Start');
      const eIdx = formatFields.findIndex(f => f === 'End');
      const tIdx = formatFields.findIndex(f => f === 'Text');
      
      if (sIdx !== -1) startIndex = sIdx;
      if (eIdx !== -1) endIndex = eIdx;
      if (tIdx !== -1) textIndex = tIdx;
      continue;
    }

    if (inEvents && (trimmedLine.startsWith('Dialogue:') || trimmedLine.startsWith('Comment:'))) {
      const prefix = trimmedLine.startsWith('Dialogue:') ? 'Dialogue:' : 'Comment:';
      const eventContent = trimmedLine.substring(prefix.length).trim();
      
      // Limit splits to textIndex to keep the dialogue text block combined as a single string
      const fields = splitN(eventContent, ',', textIndex);
      
      if (fields.length > Math.max(startIndex, endIndex)) {
        const start = fields[startIndex]?.trim() || '';
        const end = fields[endIndex]?.trim() || '';
        const text = fields[textIndex] || '';

        let speaker = '';
        let dialogueText = text;
        const speakerMatch = text.match(/^([A-Za-z0-9\s_-]+):\s*(.*)/s);
        if (speakerMatch) {
          speaker = speakerMatch[1] + ': ';
          dialogueText = speakerMatch[2];
        }

        const itemIdx = items.length;
        const preDialogueFields = fields.slice(0, textIndex).join(',');
        
        items.push({
          id: String(itemIdx + 1),
          startTime: start,
          endTime: end,
          text: dialogueText,
          originalText: dialogueText,
          speaker: speaker || undefined,
          rawPreDialogueText: `${prefix} ${preDialogueFields},`
        });

        rawLines.push({ type: 'dialogue', content: line, index: itemIdx });
      } else {
        // Safe fallback for malformed line
        rawLines.push({ type: 'raw', content: line });
      }
    } else {
      // Any other header info or styles lines
      rawLines.push({ type: 'raw', content: line });
    }
  }

  return { items, rawLines };
}

/**
 * Serialize SubtitleItems back to ASS/SSA Format using preserved raw lines
 */
export function serializeASS(
  items: SubtitleItem[],
  rawLines: Array<{ type: 'raw' | 'dialogue'; content: string; index?: number }>
): string {
  return rawLines.map(line => {
    if (line.type === 'raw') {
      return line.content;
    } else if (line.type === 'dialogue' && line.index !== undefined) {
      const item = items[line.index];
      if (!item) return line.content; // Fallback to original

      const text = item.speaker ? `${item.speaker}${item.translatedText || item.text}` : (item.translatedText || item.text);
      return `${item.rawPreDialogueText || 'Dialogue: '}${text}`;
    }
    return '';
  }).join('\n');
}

/**
 * Master parser that auto-detects and processes the subtitle format
 */
export function parseSubtitleFile(
  filename: string,
  content: string
): { items: SubtitleItem[]; format: SubtitleFormat; extraData?: any } {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (extension === 'vtt' || content.trim().startsWith('WEBVTT')) {
    return { items: parseVTT(content), format: 'vtt' };
  } else if (extension === 'ass' || content.includes('[V4+ Styles]')) {
    const parsed = parseASS(content);
    return { items: parsed.items, format: 'ass', extraData: parsed.rawLines };
  } else if (extension === 'ssa' || content.includes('[V4 Styles]')) {
    const parsed = parseASS(content);
    return { items: parsed.items, format: 'ssa', extraData: parsed.rawLines };
  } else {
    // Default to SRT
    return { items: parseSRT(content), format: 'srt' };
  }
}

/**
 * Master serializer that compiles items back into subtitle string
 */
export function serializeSubtitleFile(
  items: SubtitleItem[],
  format: SubtitleFormat,
  extraData?: any
): string {
  switch (format) {
    case 'srt':
      return serializeSRT(items);
    case 'vtt':
      return serializeVTT(items);
    case 'ass':
    case 'ssa':
      return serializeASS(items, extraData);
    default:
      return serializeSRT(items);
  }
}
