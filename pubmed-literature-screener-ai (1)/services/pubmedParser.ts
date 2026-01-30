
import { LiteratureEntry } from '../types';

export const parsePubMedTxt = (content: string): LiteratureEntry[] => {
  if (!content) return [];

  // Support for both common PubMed TXT formats
  const isTaggedFormat = content.includes('PMID- ') || content.includes('TI  - ');

  if (isTaggedFormat) {
    return parseTaggedFormat(content);
  } else {
    return parseAbstractFormat(content);
  }
};

/**
 * Parses the standard "Abstract" text format (paragraphs)
 */
const parseAbstractFormat = (content: string): LiteratureEntry[] => {
  // Normalize line endings and split by entry numbering "1. ", "2. " etc.
  // Use positive lookahead to keep the numbers
  const entries = content.split(/\r?\n(?=\d+\.\s+)/).filter(e => e.trim().length > 0);
  
  return entries.map((rawEntry, idx) => {
    const trimmedEntry = rawEntry.trim();
    // Split by double newline to identify paragraphs (supports both \n\n and \r\n\r\n)
    const blocks = trimmedEntry.split(/\r?\n\r?\n/).map(b => b.trim()).filter(b => b.length > 0);
    
    if (blocks.length < 2) return null;

    // Block 0: Meta (Journal, Year)
    const metaLine = blocks[0];
    const journalMatch = metaLine.match(/\d+\.\s+(.*?)\.\s+(\d{4})/);
    const journal = journalMatch ? journalMatch[1] : 'Unknown Journal';
    const year = journalMatch ? journalMatch[2] : 'Unknown Year';

    // Block 1: Title
    const title = blocks[1];

    // IDs (PMID, DOI)
    const pmidMatch = trimmedEntry.match(/PMID:\s*(\d+)/);
    const doiMatch = trimmedEntry.match(/DOI:\s*([^\s\n\r]+)/);

    // Abstract Logic: Find paragraphs that look like research text
    // Usually everything after block 2 (Authors) that isn't meta info
    let abstract = "";
    let authors = "Unknown Authors";
    
    if (blocks.length > 2) {
      authors = blocks[2];
      const contentBlocks = blocks.slice(3).filter(b => {
        const lower = b.toLowerCase();
        return !lower.startsWith('pmid:') && 
               !lower.startsWith('doi:') && 
               !lower.startsWith('author information') &&
               !lower.startsWith('conflict of interest') &&
               b.length > 50;
      });
      abstract = contentBlocks.join('\n\n');
    }

    return {
      id: pmidMatch ? pmidMatch[1] : `entry-${idx}`,
      index: (idx + 1).toString(),
      title,
      authors,
      journal,
      year,
      abstract: abstract.trim(),
      doi: doiMatch ? doiMatch[1].replace(/\.$/, '') : "",
      pmid: pmidMatch ? pmidMatch[1] : "",
      pmcid: "",
      fullText: trimmedEntry
    };
  }).filter((entry): entry is LiteratureEntry => entry !== null);
};

/**
 * Parses the "PubMed" tagged format (TI  - , AB  - , etc.)
 */
const parseTaggedFormat = (content: string): LiteratureEntry[] => {
  // Split into individual records based on the PMID tag which usually starts each record
  const records = content.split(/\r?\n(?=PMID-)/).filter(r => r.trim().length > 0);
  
  return records.map((record, idx) => {
    const lines = record.split(/\r?\n/);
    let pmid = "", title = "", abstract = "", doi = "", journal = "", year = "", authors = [];

    let currentTag = "";
    for (const line of lines) {
      const tagMatch = line.match(/^([A-Z]{2,4})\s*-\s?(.*)/);
      if (tagMatch) {
        currentTag = tagMatch[1];
        const value = tagMatch[2];
        if (currentTag === 'PMID') pmid = value;
        if (currentTag === 'TI') title = value;
        if (currentTag === 'AB') abstract = value;
        if (currentTag === 'JT') journal = value;
        if (currentTag === 'DP') year = value.substring(0, 4);
        if (currentTag === 'AU') authors.push(value);
        if (currentTag === 'AID' && value.includes('[doi]')) {
          doi = value.replace('[doi]', '').trim();
        }
      } else if (line.startsWith('      ') && currentTag) {
        // Handle multi-line values (indented)
        const continuation = line.trim();
        if (currentTag === 'TI') title += " " + continuation;
        if (currentTag === 'AB') abstract += " " + continuation;
      }
    }

    if (!title && !pmid) return null;

    return {
      id: pmid || `tag-${idx}`,
      index: (idx + 1).toString(),
      title: title || "No Title Found",
      authors: authors.join(', ') || "Unknown Authors",
      journal: journal || "Unknown Journal",
      year: year || "Unknown Year",
      abstract: abstract.trim(),
      doi,
      pmid,
      pmcid: "",
      fullText: record
    };
  }).filter((entry): entry is LiteratureEntry => entry !== null);
};
