
import { GoogleGenAI, Type } from "@google/genai";
import { LiteratureEntry, Criterion, ScreeningResult, ModelType } from "../types";

export const screenLiterature = async (
  entry: LiteratureEntry,
  criteria: Criterion[],
  modelName: ModelType = ModelType.GEMINI_FLASH,
  useSearch: boolean = false
): Promise<ScreeningResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const inclusionCriteria = criteria.filter(c => c.type === 'Inclusion').map(c => c.text);
  const exclusionCriteria = criteria.filter(c => c.type === 'Exclusion').map(c => c.text);

  const prompt = `
    You are an expert medical researcher performing a systematic review. 
    Screen the following research paper based on the provided inclusion and exclusion criteria.
    
    --- PROVIDED PAPER DATA ---
    TITLE: ${entry.title}
    DOI: ${entry.doi || 'N/A'}
    PMID: ${entry.pmid || 'N/A'}
    ABSTRACT: ${entry.abstract || 'Not provided in text'}
    --- END DATA ---

    ${useSearch ? 'IMPORTANT: Please use Google Search to verify the paper details using the DOI or Title if the provided abstract is missing or insufficient to make a final decision.' : ''}

    INCLUSION CRITERIA:
    ${inclusionCriteria.length > 0 ? inclusionCriteria.join('\n') : 'None provided.'}

    EXCLUSION CRITERIA:
    ${exclusionCriteria.length > 0 ? exclusionCriteria.join('\n') : 'None provided.'}

    Instructions:
    1. Evaluate the paper against EACH criterion individually.
    2. Decision must be 'Include' ONLY if it meets ALL inclusion criteria AND matches NO exclusion criteria.
    3. Provide the score and specific reason for EACH criterion.
  `;

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        decision: {
          type: Type.STRING,
          description: "Final decision: 'Include', 'Exclude', or 'Unsure'",
        },
        reasoning: {
          type: Type.STRING,
          description: "Overall summary reasoning.",
        },
        criteriaScores: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              criterion: { type: Type.STRING },
              passed: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ["criterion", "passed", "reason"]
          }
        }
      },
      required: ["decision", "reasoning", "criteriaScores"],
    },
  };

  // Only enable tools if model supports it and user requested it
  if (useSearch && modelName === ModelType.GEMINI_PRO) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: config,
    });

    const result = JSON.parse(response.text);
    return result as ScreeningResult;
  } catch (error) {
    console.error("Gemini Screening Error:", error);
    throw error;
  }
};
