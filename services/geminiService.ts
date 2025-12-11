import { GoogleGenAI, Type } from "@google/genai";
import { Location, Decoration } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_GEMINI_API_KEY });}
export const generateLocations = async (itineraryText: string): Promise<Location[]> => {
  const prompt = `
    Analyze the following travel itinerary for Germany (Roth, Frankfurt, Black Forest) and France (Alsace, Colmar).
    
    ITINERARY START
    ${itineraryText}
    ITINERARY END
    
    Task:
    1. Extract 12-15 distinct locations. 
    2. MANDATORY: You MUST include specific attractions mentioned such as "Badeparadies Schwarzwald" (Water Park), "Europa-Park", "Haut-Koenigsbourg", "Montagne des Singes" as their own separate points, do not merge them into the city name.
    3. Ignore generic terms like "Camp 1", "Camp 2", "Airport" unless it's a major stop (like start/end).
    4. Generate coordinates (x, y) for a map canvas where:
       - The map covers Southwest Germany and Eastern France.
       - Frankfurt is at the Top (North, low Y).
       - Colmar/Alsace is Middle-Left (West, high Y, low X).
       - Roth is Top-Right (East of Frankfurt).
       - Black Forest (Titisee/Feldberg/Schluchsee) is Bottom-Right (South-East).
       - x: 0-100 (Left to Right), y: 0-100 (Top to Bottom).
       - CRITICAL: Spread out markers visually. If two locations are geographically close (like Titisee and Badeparadies), separate them by at least 15% distance on the x or y axis so the UI pins do not overlap.
    
    Output Format: JSON Array.
    Each item:
    - name: Name in Traditional Chinese (繁體中文).
    - description: A cute, Chiikawa-style description (using "哇！", "好期待！", "哭哭", "好厲害" etc.). Limit to 2 sentences.
    - emoji: Relevant emoji (e.g., 🌊 for water park, 🎢 for theme park).
    - x: number (10-90).
    - y: number (10-90).
    - tags: 2-3 keywords (Traditional Chinese).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            emoji: { type: Type.STRING },
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from Gemini");
  
  const data = JSON.parse(text);
  // Add IDs if missing
  return data.map((item: any, index: number) => ({
    ...item,
    id: item.id || `loc-${index}-${Date.now()}`
  }));
};

export const generateMapBackground = async (itineraryText: string): Promise<string> => {
  // We infer the region is Germany/France border based on the itinerary
  const prompt = `
    A very cute, kawaii, hand-drawn vector style map background of the border between France (Alsace) and Germany (Black Forest).
    Style: Chiikawa anime style (Nagano), pastel colors.
    Geography: Rhine river flowing north-south in the middle. Mountains (Black Forest) on the right (East), Vosges mountains on the left (West).
    Colors: Very light Cream paper texture background. Pale green forests, baby blue river.
    Aesthetic: Clean, simple, 'loose' ink lines like a children's book illustration.
    IMPORTANT: High brightness, low contrast background image so markers stand out. No text labels.
    View: Top-down 2D map.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "4:3",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate map image");
};

export const generateChiikawaCharacters = async (): Promise<Decoration[]> => {
  const characters = [
    { 
      name: "吉伊卡娃", 
      prompt: "Full body sticker of Chiikawa (small white bear) wearing swimming goggles and a floatie, looking nervous but happy. White background, simple thick black outlines, vector flat style.",
      defaultMsg: "水...水好涼！"
    },
    { 
      name: "小八貓", 
      prompt: "Full body sticker of Hachiware (cat with blue tips) holding a camera taking a photo of scenery, speaking. White background, simple thick black outlines, vector flat style.",
      defaultMsg: "這個好像很厲害耶！"
    },
    { 
      name: "烏薩奇", 
      prompt: "Full body sticker of Usagi (yellow rabbit) running fast with a French baguette in mouth, crazy eyes. White background, simple thick black outlines, vector flat style.",
      defaultMsg: "普魯亞哈！！"
    },
    { 
      name: "栗子饅頭", 
      prompt: "Full body sticker of Kurimanju (otter) holding a german beer mug, sighing with satisfaction 'Haa...'. White background, simple thick black outlines, vector flat style.",
      defaultMsg: "哈..."
    }
  ];

  const promises = characters.map(async (char, index) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: [{ text: char.prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      if (!imageUrl) return null;

      // Deterministic but scattered placement
      // Chiikawa (0) -> Water/Pool area (bottom right often)
      // Hachiware (1) -> Scenery (middle)
      // Usagi (2) -> Running around (left)
      // Kurimanju (3) -> Beer (Top right / Germany)
      const positions = [
        { x: 80, y: 80 }, // Near Titisee/Water
        { x: 50, y: 50 },
        { x: 25, y: 70 },
        { x: 75, y: 20 }
      ];

      return {
        id: `char-${index}`,
        name: char.name,
        imageUrl,
        x: positions[index].x + (Math.random() * 10 - 5),
        y: positions[index].y + (Math.random() * 10 - 5),
        rotation: (Math.random() * 20) - 10,
        scale: 0.9,
        message: char.defaultMsg
      } as Decoration;
    } catch (e) {
      console.error(`Failed to generate ${char.name}`, e);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((d): d is Decoration => d !== null);
};
