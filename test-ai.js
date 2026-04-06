import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
  const response = await client.responses.create({
    model: "gpt-5.4",
    input: "Say hello like a nurse assistant app",
  });

  console.log(response.output_text);
}

run().catch(console.error);