import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the Google GenAI SDK.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'placeholder_key' });

/**
 * 1. Real-Time Smart Bidding Co-Pilot Widget
 */
export const getBiddingAdvice = async ({ player, currentBid, remainingBudget, squadComposition, competitorMaxBudget }) => {
  const minIncrement = Math.max(1000000, Math.ceil(player.basePrice * 0.1)); // 10L or 10%
  const targetBid = currentBid > 0 ? currentBid + minIncrement : player.basePrice;

  if (targetBid > remainingBudget) {
    return "⚠️ OUT OF BUDGET: Capital thresholds exceeded.";
  }

  // Ensure default structure if missing
  const composition = squadComposition || { Batsman: 0, Bowler: 0, 'All-rounder': 0, 'Wicket-keeper': 0 };

  try {
    const prompt = `
Context: Act as an elite sports franchise data analyst and risk strategist whispering in the ear of a team owner during a high-stakes draft.
Inputs:
- Player name: ${player.name}
- Position: ${player.position}
- Player stats: Matches=${player.stats.matches}, Runs=${player.stats.runs}, Wickets=${player.stats.wickets}, Rating=${player.stats.rating}
- Base Price: ₹${(player.basePrice / 10000000).toFixed(2)} Cr
- Current High Bid: ₹${(currentBid / 10000000).toFixed(2)} Cr
- Target Bid to make: ₹${(targetBid / 10000000).toFixed(2)} Cr
- Team Owner's Budget Left: ₹${(remainingBudget / 10000000).toFixed(2)} Cr
- Team Owner's Current Roster Counts: Batsmen=${composition.Batsman}, Bowlers=${composition.Bowler}, All-rounders=${composition['All-rounder']}, Wicket-keepers=${composition['Wicket-keeper']}
- Roster Target Requirements: 3 Batsmen, 4 Bowlers, 3 All-rounders, 1 Wicket-keeper.

Constraints:
Compare their roster counts against targets. Recommend whether to "BID" (if vacancy exists) or "DO NOT BID" / "HOLD" (if position is filled/saving cash). Generate a punchy strategic calculation. Max length: 25 words. Do not exceed 25 words.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error in bidding co-pilot:', error);
    return "Hold back. Conserve budget for upcoming key players.";
  }
};

/**
 * 2. Post-Auction Mock Tournament Simulation Engine
 */
export const getTournamentSimulation = async (teamsData) => {
  try {
    const prompt = `
Context: Act as a premium text-based sports video game simulation engine processing a complex statistical tournament matrix.
Inputs:
${JSON.stringify(teamsData, null, 2)}

Constraints:
Analyze technical squad balancing, player synergies, and depth.
Generate an engaging, dramatic text simulation of a complete league tournament including group stages, round-robin casualties, semi-final highlights with fictional match scorecards, and a grand finale crowning the league champion team and designating a tournament MVP.
Must return a beautifully clean, deeply descriptive Markdown document utilizing these explicit headers:
## 🏆 AUCTION-PRO CHAMPIONSHIP SIMULATION REEL
### Roster Analysis & Season Forecast
### ⚡ The Knockout Phase
### 👑 The Grand Finale
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error('Error in tournament simulation:', error);
    return `## 🏆 AUCTION-PRO CHAMPIONSHIP SIMULATION REEL
### Roster Analysis & Season Forecast
Failed to run complex simulation. The rosters look highly competitive!
### ⚡ The Knockout Phase
Fierce competition.
### 👑 The Grand Finale
A thrilling finale.`;
  }
};

/**
 * 3. Pre-Auction Dynamic Market Price Predictor
 */
export const getMarketPricePrediction = async ({ player, totalTeams, startingBudget }) => {
  try {
    const prompt = `
Context: Act as a sports insurance actuary and algorithmic market evaluator calculating baseline player valuations.
Inputs:
- Player Name: ${player.name}
- Position: ${player.position}
- Matches: ${player.stats.matches}
- Runs: ${player.stats.runs}
- Wickets: ${player.stats.wickets}
- Rating: ${player.stats.rating}
- Base Price: ₹${(player.basePrice / 10000000).toFixed(2)} Cr
- Total Teams in Room: ${totalTeams}
- Starting Budget per Team: ₹${(startingBudget / 10000000).toFixed(2)} Cr

Constraints:
Formulate the output exclusively as a clean, parser-safe raw JSON object. Do not wrap the response in markdown code blocks (e.g. \`\`\`json) or provide conversational text prefixes/suffixes. The returned object model must match this structural constraint exactly:
{
  "estimatedRange": "₹X.XX Cr - ₹Y.YY Cr",
  "biddingVibe": "Low Interest / Steady Bids / Intense Bidding War",
  "marketJustification": "String max 35 words outlining the asset logic"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error in market price prediction:', error);
    // Return a safe fallback
    const crBase = (player.basePrice / 10000000).toFixed(2);
    return {
      estimatedRange: `₹${crBase} Cr - ₹${(parseFloat(crBase) * 1.5).toFixed(2)} Cr`,
      biddingVibe: "Steady Bids",
      marketJustification: "Solid statistics and reasonable base price point."
    };
  }
};

/**
 * 4. Live Automated Press Release Headline Ticker
 */
export const getPressReleaseHeadlines = async ({ playerName, role, basePrice, closingPrice, winningTeam }) => {
  try {
    const isDoubleOrMore = closingPrice >= (basePrice * 2);
    const prompt = `
Context: Act as a rapid-fire breaking sports media journalist sitting at a live broadcast news wire terminal.
Inputs:
- Player Name: ${playerName}
- Role/Position: ${role}
- Base Price: ₹${(basePrice / 10000000).toFixed(2)} Cr
- Final Closing Price: ₹${(closingPrice / 10000000).toFixed(2)} Cr
- Winning Team Title: ${winningTeam}

Constraints:
We calculated that the final price ${isDoubleOrMore ? 'IS' : 'IS NOT'} double or greater than the base price.
${
  isDoubleOrMore 
    ? 'Craft a sensational, explosive headline framing the deal as a history-making blockbuster investment.' 
    : 'Frame the headline as a calculated defensive tactical steal of the day.'
}
Return the response string strictly inside a clean JSON array containing exactly 2 contrasting headlines (e.g. one focused on the value/steal aspect or drama, one focused on the impact).
Do not wrap in markdown code blocks.
Example format:
["📰 HEADLINE ONE", "📰 HEADLINE TWO"]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error in press release headlines:', error);
    return [
      `📰 Blockbuster! ${playerName} joins ${winningTeam} for ₹${(closingPrice / 10000000).toFixed(2)} Cr!`,
      `📰 Tactical move: ${winningTeam} secures ${playerName} in competitive bidding.`
    ];
  }
};

/**
 * 5. Automated Team Branding & Crest Prompt Generator
 */
export const getTeamBranding = async ({ teamName, primaryColor, vibe }) => {
  try {
    const prompt = `
Context: Act as an expert corporate athletic brand creative director building a franchise visual identity.
Inputs:
- Team Name: ${teamName}
- Corporate Primary Hex Color: ${primaryColor}
- Chosen Brand Character Vibe: ${vibe} (could be 'Aggressive', 'Fearless', 'Tactical', 'Calculated')

Constraints:
1. Generate a powerful, inspiring team motto slogan matching the psychological configuration profile of the chosen vibe.
2. Craft an incredibly complex, artistic, hyper-detailed prompt text block engineered for an image generation system (like Imagen 3 or DALL-E) instructing it to output a premium 3D vector metallic corporate team emblem badge design using the exact color parameters on a clean isolated backing.
Structure the returned data frame strictly as a valid JSON object matching this schema exactly (no markdown formatting):
{
  "teamSlogan": "String text value",
  "imageGeneratorPrompt": "String prompt description..."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error in team branding generator:', error);
    return {
      teamSlogan: "Victory Through Unity and Strength!",
      imageGeneratorPrompt: `Premium 3D vector metallic logo badge for '${teamName}' featuring primary color ${primaryColor}, embodying a ${vibe} character, clean isolated background.`
    };
  }
};

/**
 * 6. AI Squad Strategy Generator & Roster Designer
 */
export const getDraftStrategy = async ({ availablePlayers, remainingBudget, currentRoster }) => {
  try {
    const prompt = `
Context: Act as a pro draft advisor, expert coach and statistics strategist. You are helping a Team Owner construct a championship playing roster.
Inputs:
- Owner Remaining Budget: ₹${(remainingBudget / 10000000).toFixed(2)} Cr
- Current Franchise Squad: ${JSON.stringify(currentRoster)}
- Available Player Pool (Available for Draft): ${JSON.stringify(availablePlayers)}
- League Composition Targets: 3 Batsmen, 4 Bowlers, 3 All-rounders, 1 Wicket-keeper.

Constraints:
Analyze the available player pool and suggest a specific bid/acquisition list that fits within their remaining budget.
Detail which available players they should target next and specify how much they should bid (suggested bid amount) for them.
Suggest a tactical playing lineup strategy. Return the response as a clean, engaging Markdown document.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error('Error generating AI strategy plan:', error);
    return `### ⚡ AI Franchise Strategy Draft
* Hold budget for premium bowlers in the next round.
* Target available Batsmen at base price to maintain depth.`;
  }
};

/**
 * 7. Rules Chatbot Advisor Engine
 */
export const getChatbotReply = async ({ query, rules }) => {
  try {
    const rulesContext = rules.map(r => `Rule: ${r.title}\nContent: ${r.content}`).join('\n\n');
    const prompt = `
Context: Act as an expert Draft Moderator and rule analyst for the AUCTION-PRO platform. Answer the user's questions regarding rules, rosters, budgets, and draft procedures.
Rules Context from Database:
${rulesContext}

User Query: "${query}"

Constraints:
Answer the user's question concisely, referencing the rules context above where applicable. Keep the tone friendly, professional, and sports-analyst themed. Max length: 75 words.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error in Chatbot reply:', error);
    return "I am currently experiencing connection issues, but I advise checking the match scheduler or verifying your budget metrics.";
  }
};
