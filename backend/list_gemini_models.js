require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  console.log('Listing available Gemini models...');

  try {
    for await (const model of genAI.listModels()) {
      console.log(`Model: ${model.name}`);
      console.log(`  DisplayName: ${model.displayName}`);
      console.log(`  SupportedGenerationMethods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('---');
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels(); 