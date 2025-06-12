// backend/index.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const upload = multer({ dest: 'uploads/' });

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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});