import type { NextApiResponse } from "next";
import { withCORSAuth, AuthenticatedRequest } from "@/lib/api/middleware";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { initializeAdminApp } from "@/lib/firebase-admin";
import { aiService } from "@/lib/ai/ai-service";

// Initialize Firebase Admin
initializeAdminApp();
const db = getAdminFirestore();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { postId, content } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ error: "postId and content are required" });
    }

    // Generate the summary using the AI service
    const prompt = `Please generate a concise, engaging summary of the following blog post content. 
The summary should be 2-3 sentences long and capture the main points in a compelling way.

Blog Post Content:
${content}`;

    const aiResponse = await aiService.generateText(prompt, {
      maxTokens: 150,
      temperature: 0.7,
    });

    if (!aiResponse.success) {
      throw new Error(aiResponse.error || "Failed to generate summary");
    }

    // Extract the generated text from the response
    const summary =
      (aiResponse as any).text?.trim() ||
      (aiResponse as any).content?.trim() ||
      "";

    if (!summary) {
      throw new Error("Generated summary is empty");
    }

    // Update the blog post with the generated summary
    const postRef = db.collection("blog-posts").doc(postId);
    await postRef.update({
      aiSummary: summary,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, summary });
  } catch (error: any) {
    console.error("Error generating summary:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate summary",
      details: error.details,
    });
  }
}

export default withCORSAuth(handler);
