
export interface LiteratureEntry {
  id: string;
  index: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  doi: string;
  pmid: string;
  pmcid: string;
  fullText: string;
  screeningResult?: ScreeningResult;
}

export interface ScreeningResult {
  decision: 'Include' | 'Exclude' | 'Unsure';
  reasoning: string;
  criteriaScores: Array<{
    criterion: string;
    passed: boolean;
    reason: string;
  }>;
}

export interface Criterion {
  id: string;
  text: string;
  type: 'Inclusion' | 'Exclusion';
}

export enum ModelType {
  GEMINI_FLASH = 'gemini-3-flash-preview',
  GEMINI_PRO = 'gemini-3-pro-preview'
}
