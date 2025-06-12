// backend/index.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});

app.use(cors());
app.use(express.json());

// POST endpoint to handle audio upload and transcription
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const audioPath = req.file.path;

    // Use form-data package
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model_id', 'scribe_v1');

    // Send request to ElevenLabs Speech-to-Text API
    const response = await axios.post('https://api.elevenlabs.io/v1/speech-to-text', formData, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        ...formData.getHeaders(),
      },
    });

    // Delete the uploaded file after processing
    fs.unlinkSync(audioPath);

    res.json({ text: response.data.text });
  } catch (error) {
    console.error('Transcription error:', error.response?.data || error.message);
    
    // Handle specific ElevenLabs error cases
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// New POST endpoint to convert text to tasks using AI
app.post('/convert-to-tasks', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided for task conversion.' });
    }

    const prompt = `Convert the following text into a structured JSON array of tasks. Each task should have a 'description' field and a 'completed' field (boolean, default to false). If no tasks are clearly identifiable, return an empty array. Do not include any other text or formatting, just the JSON array.\n\nText: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();

    // Remove markdown code block delimiters if present
    const cleanJsonText = jsonText.replace(/^```json\n/g, '').replace(/\n```$/g, '');

    // Attempt to parse the JSON output from the AI
    let tasks;
    try {
      tasks = JSON.parse(cleanJsonText);
      // Ensure it's an array, even if the AI sometimes returns a single object
      if (!Array.isArray(tasks)) {
        tasks = [tasks];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // If parsing fails, try to recover or return a generic task
      tasks = [{ description: text, completed: false }]; 
    }

    res.json({ tasks });

  } catch (error) {
    console.error('Error converting to tasks:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to convert to tasks.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});