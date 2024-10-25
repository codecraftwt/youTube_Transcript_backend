const express = require("express");
const bodyParser = require("body-parser");
const ytdl = require("ytdl-core");
const { getTranscript } = require("youtube-transcript");
const cors=require('cors')
const app = express();


app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

async function extractAudioAndTranscript(youtubeUrl) {
  const info = await ytdl.getInfo(youtubeUrl);
  const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

  const audioUrl = audioFormats[0].url;
  const videoId = info.videoDetails.videoId;
  const transcriptLink = `https://www.youtube.com/watch?v=${videoId}#transcript`;

  return {
    audio_url: audioUrl,
    transcript_link: transcriptLink,
  };
}

// Function to extract audio and transcripts from a playlist
async function extractFromPlaylist(playlistUrl) {
  const playlistInfo = await ytdl.getInfo(playlistUrl);
  const videos = playlistInfo.videoDetails;

  const results = [];
  for (const video of videos) {
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    const audioAndTranscript = await extractAudioAndTranscript(videoUrl);
    results.push(audioAndTranscript);
  }

  return results;
}

// Route to extract audio and transcript from YouTube URL
app.post("/extract", async (req, res) => {
  const youtubeUrl = req.body.url;

  if (!youtubeUrl) {
    return res.status(400).json({ error: "You must provide a YouTube URL." });
  }

  try {
    if (youtubeUrl.includes("playlist")) {
      const results = await extractFromPlaylist(youtubeUrl);
      res.json(results);
    } else {
      const response = await extractAudioAndTranscript(youtubeUrl);
      res.json(response);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
