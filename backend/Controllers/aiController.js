const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Load environment variables

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const ASSESSMENT_PROMPT = `
Analyze the following support ticket to determine urgency and impact. Use this format:
{
  "urgency": "low|medium|high",
  "impact": "low|medium|high"
}

Guidelines:
1. Urgency (Required response time):
- High: Requires immediate action (minutes/hours)
- Medium: Should be resolved within 24 hours
- Low: No time sensitivity (days/weeks acceptable)

2. Impact (Business consequences):
- High: Critical functionality broken, data loss, security issues, >50% users affected
- Medium: Partial functionality loss, significant UX degradation, 5-50% users affected
- Low: Minor issues, cosmetic problems, single user affected

Examples:
1. Title: "Payment gateway failure", 
   Description: "Customers cannot complete purchases"
   → {"urgency": "high", "impact": "high"}

2. Title: "VIP customer complaint", 
   Description: "Enterprise client cannot access premium features"
   → {"urgency": "high", "impact": "medium"}

3. Title: "Server performance degradation", 
   Description: "API response times increased by 300%"
   → {"urgency": "medium", "impact": "high"}

4. Title: "Password reset broken", 
   Description: "Users reporting password reset emails not arriving"
   → {"urgency": "medium", "impact": "medium"}

5. Title: "Mobile app crash", 
   Description: "App crashes when viewing order history"
   → {"urgency": "medium", "impact": "medium"}

6. Title: "Typo in FAQ section", 
   Description: "Misspelled word in question #3"
   → {"urgency": "low", "impact": "low"}

7. Title: "Feature request", 
   Description: "Add dark mode theme option"
   → {"urgency": "low", "impact": "low"}

8. Title: "Security vulnerability", 
   Description: "XSS vulnerability in comment section"
   → {"urgency": "high", "impact": "high"}

9. Title: "Dashboard loading slow", 
   Description: "Admin dashboard takes 8 seconds to load"
   → {"urgency": "medium", "impact": "medium"}

10. Title: "Export functionality broken",
    Description: "CSV exports missing last 24 hours of data"
    → {"urgency": "high", "impact": "medium"}

Important Notes:
- Respond ONLY with valid JSON
- No additional explanations
- Use lowercase values
- Default to medium priority if uncertain
- Prioritize functional issues over cosmetic ones
- Consider security issues as high urgency/impact

Current Ticket:
Title: {TITLE}
Description: {DESCRIPTION}
`;

exports.assessTicket = async (ticketData) => {
  try {
    const { title, description } = ticketData;

    if (!title?.trim() || !description?.trim()) {
      throw new Error("Title and description are required");
    }

    const fullPrompt = ASSESSMENT_PROMPT.replace("{TITLE}", title).replace(
      "{DESCRIPTION}",
      description
    );

    const result = await model.generateContent(fullPrompt);
    const responseText = await result.response.text();

    // Clean and parse the JSON response
    const jsonString = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const assessment = JSON.parse(jsonString);

    // Validate response
    const validValues = ["low", "medium", "high"];
    if (
      !validValues.includes(assessment.urgency) ||
      !validValues.includes(assessment.impact)
    ) {
      throw new Error("Invalid AI response format");
    }

    // Calculate priority using the priority matrix
    const priorityMatrix = {
      high: { high: "high", medium: "high", low: "medium" },
      medium: { high: "high", medium: "medium", low: "low" },
      low: { high: "medium", medium: "low", low: "low" },
    };

    const priority = priorityMatrix[assessment.urgency][assessment.impact];

    let baseExp;
    if (priority === "high") {
      baseExp = 300;
    } else if (priority === "medium") {
      baseExp = 200;
    } else {
      baseExp = 100;
    }

    return {
      ...assessment,
      priority,
      baseExp,
    };
  } catch (error) {
    console.error("Assessment Error:", error);
    throw new Error(`AI Assessment failed: ${error.message}`);
  }
};

exports.assessTicketEndpoint = async (req, res) => {
  try {
    const assessment = await assessTicket(req.body);
    res.json(assessment);
  } catch (error) {
    console.error("Assessment Endpoint Error:", error);
    res.status(500).json({
      message: error.message || "Failed to assess ticket",
    });
  }
};

exports.askAI = async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // Generate content from Gemini API
    const result = await model.generateContent(prompt);

    // Check and return response
    if (result?.response && typeof result.response.text === "function") {
      res.json({ aiResponse: result.response.text() });
    } else {
      res
        .status(500)
        .json({ message: "Invalid response from Gemini API", result });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch AI response", error: error.message });
  }
};
