const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Load environment variables

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.askAI = async (req, res) => {
  try {
    const prompt = req.body.prompt; // Get the prompt from the request body
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content from Gemini API
    const result = await model.generateContent(prompt);

    // Check and return response
    if (result && result.response && typeof result.response.text === "function") {
      res.json({ aiResponse: result.response.text() });
    } else {
      res.status(500).json({ message: "Invalid response from Gemini API", result });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: "Failed to fetch AI response", error: error.message });
  }
};
