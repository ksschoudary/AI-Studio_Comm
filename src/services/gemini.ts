import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SentimentTimeline {
  score: number;
  label: string;
  summary: string;
}

export interface SentimentData {
  historical: SentimentTimeline; // Last 6 months
  current: SentimentTimeline;    // Up to 1 month
  longTerm: SentimentTimeline;   // 1 to 6 months ahead
  drivers: { 
    factor: string; 
    impact: 'positive' | 'negative' | 'neutral'; 
    description: string;
    evidence: string; // Specific news/data point
  }[];
  sources: { title: string; url: string }[];
}

export async function getCommoditySentiment(commodity: string, context: 'India' | 'Global'): Promise<SentimentData> {
  const prompt = `Executive multi-horizon sentiment analysis for ${commodity} (${context}). 
  
  SOURCES: Hindu Business Line, Economic Times, Financial Express, NDTV Profit, Krishi Jagran, iGrain, Tribune.
  
  PILLARS:
  1. WEATHER-POLICY: Impact of climate on export/import duties and MSP.
  2. LOGISTICS: Port/warehouse status.
  3. TRADE: Global benchmarks vs local prices.

  HORIZONS:
  - HISTORICAL (6m): Past performance.
  - CURRENT (1m): Immediate sentiment (last 7 days).
  - LONG TERM (1-6m): Future projections.

  JSON OUTPUT:
  - historical/current/longTerm: {score: -100 to 100, label: string, summary: 2-sentence max}
  - drivers: [{factor, impact, description, evidence}] (Min 4)
  
  Be concise. Use Google Search for latest data.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseSchema: {
        type: "OBJECT",
        properties: {
          historical: {
            type: "OBJECT",
            properties: {
              score: { type: "NUMBER" },
              label: { type: "STRING" },
              summary: { type: "STRING" }
            },
            required: ["score", "label", "summary"]
          },
          current: {
            type: "OBJECT",
            properties: {
              score: { type: "NUMBER" },
              label: { type: "STRING" },
              summary: { type: "STRING" }
            },
            required: ["score", "label", "summary"]
          },
          longTerm: {
            type: "OBJECT",
            properties: {
              score: { type: "NUMBER" },
              label: { type: "STRING" },
              summary: { type: "STRING" }
            },
            required: ["score", "label", "summary"]
          },
          drivers: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                factor: { type: "STRING" },
                impact: { type: "STRING" },
                description: { type: "STRING" },
                evidence: { type: "STRING" }
              },
              required: ["factor", "impact", "description", "evidence"]
            }
          }
        },
        required: ["historical", "current", "longTerm", "drivers"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  // Extract sources from grounding metadata
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
    title: chunk.web?.title || "Source",
    url: chunk.web?.uri || "#"
  })) || [];

  return {
    ...data,
    sources
  };
}
