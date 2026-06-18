import { GoogleGenerativeAI } from "@google/generative-ai";
import Car from "../models/Car.js";

// System prompt instructing the model on the Fleet Advisor rules
const SYSTEM_PROMPT = `You are the "CarRental Fleet Advisor," an expert automotive and travel concierge integrated into a premium vehicle rental platform. Your goal is to help users select the absolute perfect vehicle for their specific journey, budget, and passenger needs.

### RULES OF ENGAGEMENT:
* **Safety & Terrain First:** If the user mentions mountains, hill stations (e.g., Manali), or off-roading, you MUST prioritize SUVs, high ground clearance, or vehicles with higher torque. Do not recommend small hatchbacks for heavy mountain driving.
* **Passenger & Luggage Math:** Always factor in luggage. If a user has 5 people, a 5-seater might be too cramped if they also have "lots of luggage." In those cases, suggest stepping up to a 7-seater or an SUV with a larger boot.
* **EV Practicality:** If a user asks for an EV for a "long road trip" (e.g., > 300km), gently remind them to consider charging station availability on their route, and offer a hybrid/diesel alternative as a backup suggestion.
* **Budget Strictness:** Never recommend a primary vehicle that exceeds the user's stated daily budget. 
* **Tone:** Friendly, practical, concise, and highly knowledgeable. 

### OUTPUT STRUCTURE:
To ensure the frontend UI renders your advice beautifully, always format your response using this Markdown template:

#### 🏆 Top Recommendation: [Brand Model]
* **Why it's perfect:** [1-2 sentences explaining exactly how it matches their specific trip, passenger count, or budget].
* **Estimated Cost:** ₹[Price]/day 
* **Key Advantage:** [e.g., Excellent highway mileage, massive boot space, automatic transmission for city traffic].

#### ⚖️ Great Alternative: [Brand Model]
* **Why consider this:** [Briefly explain why this is a good backup—e.g., it's cheaper, or it's a 7-seater for extra luggage room].
* **Estimated Cost:** ₹[Price]/day

#### 💡 Travel Tip
[Provide one highly relevant, single-sentence tip based on their query (e.g., advice on hill driving, EV charging, or maximizing boot space).]`;

/**
 * Get recommendation from Gemini based on user query and available cars
 * POST /api/ai/advisor
 */
export const getRecommendation = async (req, res) => {
    try {
        const { userQuery } = req.body;

        if (!userQuery) {
            return res.json({ success: false, message: "Please enter a message or query." });
        }

        // Fetch active/available cars from the database
        const availableCars = await Car.find({ isAvailable: true });

        if (availableCars.length === 0) {
            return res.json({
                success: true,
                recommendation: "#### 📭 Fleet is currently empty\n\nNo cars are available for rent at the moment. Please check back later!"
            });
        }

        // Format compact fleet details to optimize tokens
        const compactFleet = availableCars.map(car =>
            `${car.brand} ${car.model} | ${car.category} | ${car.seating_capacity} Seats | ${car.fuel_type} | ${car.transmission} | ₹${car.pricePerDay}/day`
        ).join("\n");

        const promptToSend = `
${SYSTEM_PROMPT}

User Query: "${userQuery}"

Available Fleet:
${compactFleet}
`;

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Provide a highly polished fallback mock advisor response if GEMINI_API_KEY is not defined in .env
            console.warn("[AI Advisor] GEMINI_API_KEY is missing. Returning local advisor matching logic.");
            const recommendation = generateLocalRecommendation(userQuery, availableCars);
            return res.json({
                success: true,
                recommendation,
                warning: "Running in offline mode. Please set GEMINI_API_KEY in your .env file to enable dynamic AI recommendations."
            });
        }

        // Initialize Gemini legacy SDK client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(promptToSend);
        const recommendationText = result.response.text();

        res.json({
            success: true,
            recommendation: recommendationText
        });

    } catch (error) {
        console.error("[AI Advisor Error]:", error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Helper to generate simple offline recommendations if the Gemini key is not configured.
 */
function generateLocalRecommendation(query, cars) {
    const queryLower = query.toLowerCase();

    // Simple parsing to understand if budget is specified
    let budgetLimit = Infinity;
    const rupeeMatch = query.match(/(?:₹|rs\.?|inr)\s?(\d+)/i) || query.match(/under\s?(\d+)/i) || query.match(/budget\s?(\d+)/i);
    if (rupeeMatch) {
        budgetLimit = parseInt(rupeeMatch[1], 10);
    }

    // Identify if mountain or long trip
    const isMountain = queryLower.includes("manali") || queryLower.includes("mountain") || queryLower.includes("hill") || queryLower.includes("shimla") || queryLower.includes("leh");
    const isFamily = queryLower.includes("family") || queryLower.includes("5 people") || queryLower.includes("5 passenger") || queryLower.includes("6 people") || queryLower.includes("7 people");

    // Filter cars under budget
    let candidates = cars.filter(c => c.pricePerDay <= budgetLimit);
    if (candidates.length === 0) {
        candidates = cars; // ignore budget if nothing matches
    }

    // Find top recommendation
    let top = null;
    let backup = null;

    if (isMountain) {
        // Look for SUV or high-capacity candidates first
        const suvs = candidates.filter(c => c.category.toLowerCase().includes("suv") || c.transmission.toLowerCase().includes("automatic"));
        top = suvs[0] || candidates[0];
    } else if (isFamily) {
        // Look for 7 or 6 seaters
        const bigCars = candidates.filter(c => c.seating_capacity >= 5);
        top = bigCars[0] || candidates[0];
    } else {
        top = candidates[0];
    }

    // Find backup recommendation
    const backups = candidates.filter(c => c._id.toString() !== (top ? top._id.toString() : ""));
    backup = backups[0] || cars[0];

    if (!top) {
        return "#### 📭 Fleet is currently empty\n\nNo cars are available at this time.";
    }

    return `#### 🏆 Top Recommendation: ${top.brand} ${top.model} (Offline Advisor Mode)
* **Why it's perfect:** It fits your target requirements and matches the requested terrain and passenger preferences.
* **Estimated Cost:** ₹${top.pricePerDay}/day 
* **Key Advantage:** Reliable performance with convenient ${top.transmission} transmission and ${top.fuel_type} efficiency.

#### ⚖️ Great Alternative: ${backup ? `${backup.brand} ${backup.model}` : "None available"}
* **Why consider this:** It serves as a great alternative that is budget-friendly and fully equipped.
* **Estimated Cost:** ₹${backup ? backup.pricePerDay : 0}/day

#### 💡 Travel Tip
Remember to check the fuel tank, tyre pressure, and local regional permissions before starting your trip. Set GEMINI_API_KEY in your .env to unlock full AI Advisor capability!`;
}
