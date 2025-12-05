import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateCourseSummary = async (courseTitle: string, userNotes: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `I am taking a course titled "${courseTitle}". Here are my rough notes: "${userNotes}". Please provide a structured, concise summary of these notes and suggest 3 key actionable takeaways. Output in Markdown.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text || "Could not generate summary.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error connecting to AI assistant.";
    }
};

export const suggestBookAnalysis = async (bookTitle: string, author: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `Provide a very brief (2 sentences) synopsis and 3 main themes for the book "${bookTitle}" by ${author}.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text || "No info available.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI unavailable.";
    }
};

export const searchOnlineContent = async (query: string, type: 'book' | 'movie') => {
    try {
        const ai = getClient();
        const itemSchema = type === 'book' ? {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                author: { type: Type.STRING },
                year: { type: Type.NUMBER },
                publisher: { type: Type.STRING },
                coverUrl: { type: Type.STRING, description: "A valid URL to the book cover image" },
            }
        } : {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                director: { type: Type.STRING },
                genre: { type: Type.STRING },
                year: { type: Type.NUMBER },
                posterUrl: { type: Type.STRING, description: "A valid URL to the movie poster image" }
            }
        };

        const prompt = type === 'book' 
            ? `Search for books matching the query "${query}". Return a list of the top 5 most relevant results. For each book, provide the title, author, publication year, publisher, and a cover image URL.`
            : `Search for movies matching the query "${query}". Return a list of the top 5 most relevant results. For each movie, provide the title, director, genre, release year, and a poster image URL.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: itemSchema
                }
            }
        });
        
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Search Error:", error);
        return [];
    }
}