import { GoogleGenAI, Type } from "@google/genai";
import type { GeminiAnalysis } from '../types';

// Initialize the Google AI client with the API key from environment variables.
// Export the instance for use in other parts of the app, like chat.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A concise summary of the entire transcript in 2-4 sentences."
        },
        correctedTranscript: {
            type: Type.STRING,
            description: "The full transcript, corrected for any spelling or grammatical errors."
        },
        topics: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: "A list of the main topics or keywords discussed."
        },
        actionItems: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: "A list of any specific action items or tasks mentioned."
        }
    },
    required: ["summary", "correctedTranscript", "topics", "actionItems"]
};


export const analyzeTranscript = async (transcript: string): Promise<GeminiAnalysis | null> => {
    if (!transcript.trim()) {
        return null;
    }

    try {
        const prompt = `
            You are an expert meeting assistant. Analyze the following transcript.
            1. Provide a concise summary of the conversation.
            2. Correct any spelling or grammatical errors in the transcript.
            3. Identify the main topics or keywords.
            4. Extract any clear action items or tasks.
            
            Return the result as a single JSON object that strictly follows the provided schema.

            Transcript:
            ---
            ${transcript}
            ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonString = response.text;
        const parsedJson = JSON.parse(jsonString);

        // Basic validation
        if (parsedJson && parsedJson.summary && parsedJson.correctedTranscript) {
            return parsedJson as GeminiAnalysis;
        } else {
            console.error("Gemini response did not match the expected schema.", parsedJson);
            return null;
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return null;
    }
};