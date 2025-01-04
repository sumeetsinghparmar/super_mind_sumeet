require('dotenv').config();

const express = require('express');
const path = require('path');


const app = express();
const PORT = 3000;

var DATASTAX_APP_TOKEN = process.env.DATASTAX_APP_TOKEN;

class LangflowClient {
  constructor(baseURL, applicationToken) {
      this.baseURL = baseURL;
      this.applicationToken = applicationToken;
  }
  async post(endpoint, body, headers = {"Content-Type": "application/json"}) {
      headers["Authorization"] = `Bearer ${this.applicationToken}`;
      headers["Content-Type"] = "application/json";
      const url = `${this.baseURL}${endpoint}`;
      try {
          const response = await fetch(url, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(body)
          });

          const responseMessage = await response.json();
          if (!response.ok) {
              throw new Error(`${response.status} ${response.statusText} - ${JSON.stringify(responseMessage)}`);
          }
          return responseMessage;
      } catch (error) {
          console.error('Request Error:', error.message);
          throw error;
      }
  }

  async initiateSession(flowId, langflowId, inputValue, inputType = 'chat', outputType = 'chat', stream = false, tweaks = {}) {
      const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
      return this.post(endpoint, { input_value: inputValue, input_type: inputType, output_type: outputType, tweaks: tweaks });
  }

  handleStream(streamUrl, onUpdate, onClose, onError) {
      const eventSource = new EventSource(streamUrl);

      eventSource.onmessage = event => {
          const data = JSON.parse(event.data);
          onUpdate(data);
      };

      eventSource.onerror = event => {
          console.error('Stream Error:', event);
          onError(event);
          eventSource.close();
      };

      eventSource.addEventListener("close", () => {
          onClose('Stream closed');
          eventSource.close();
      });

      return eventSource;
  }

  async runFlow(flowIdOrName, langflowId, inputValue, inputType = 'chat', outputType = 'chat', tweaks = {}, stream = false, onUpdate, onClose, onError) {
      try {
          const initResponse = await this.initiateSession(flowIdOrName, langflowId, inputValue, inputType, outputType, stream, tweaks);
          // console.log('Init Response:', initResponse);
          if (stream && initResponse && initResponse.outputs && initResponse.outputs[0].outputs[0].artifacts.stream_url) {
              const streamUrl = initResponse.outputs[0].outputs[0].artifacts.stream_url;
              console.log(`Streaming from: ${streamUrl}`);
              this.handleStream(streamUrl, onUpdate, onClose, onError);
          }
          return initResponse;
      } catch (error) {
          console.error('Error running flow:', error);
          onError('Error initiating session');
      }
  }
}

async function main_data_fetcher(inputValue, inputType = 'chat', outputType = 'chat', stream = false) {
  const flowIdOrName = 'a1e09cf6-ac31-4420-b063-47f7ab01fd04';
  const langflowId = '114f75bd-3f1f-4b83-9b32-56c3b78c2082';
  const applicationToken = DATASTAX_APP_TOKEN;
  const langflowClient = new LangflowClient('https://api.langflow.astra.datastax.com', applicationToken);

  try {
      const tweaks = {
          "AstraDBToolComponent-41nL3": {},
          "ParseData-HiKNz": {},
          "TextOutput-x1G74": {}
      };

      const response = await langflowClient.initiateSession(
          flowIdOrName,
          langflowId,
          inputValue,
          inputType,
          outputType,
          stream,
          tweaks
      );

      if (response && response.outputs) {
          const flowOutputs = response.outputs[0];
          const firstComponentOutputs = flowOutputs.outputs[0];
          const outputMessage = firstComponentOutputs.outputs?.text?.message || "No message found in response.";
          console.log('Data Output:', outputMessage);
          return outputMessage;
      } else {
          return { message: "No response outputs available." };
      }
  } catch (error) {
      console.error('Main Error:', error.message);
      return { message: "Error occurred during processing." };
  }
}

async function main_insight_fetcher(inputValue, inputType = 'chat', outputType = 'chat', stream = false) {
  const flowIdOrName = 'bacd954c-6ab4-4984-b513-a379ac91650b';
  const langflowId = '114f75bd-3f1f-4b83-9b32-56c3b78c2082';
  const applicationToken = DATASTAX_APP_TOKEN;
  const langflowClient = new LangflowClient('https://api.langflow.astra.datastax.com',
      applicationToken);

  try {
    const tweaks = {
      "Prompt-tXN0V": {},
      "Prompt-KkB83": {},
      "Prompt-LF392": {},
      "NVIDIAModelComponent-G8ym9": {},
      "NVIDIAModelComponent-9twge": {},
      "NVIDIAModelComponent-SPUSm": {},
      "CombineText-GpMM3": {},
      "ChatInput-YNmPU": {},
      "ChatOutput-0fovM": {}
    };
    response = await langflowClient.runFlow(
        flowIdOrName,
        langflowId,
        inputValue,
        inputType,
        outputType,
        tweaks,
        stream,
        (data) => console.log("Received:", data.chunk), // onUpdate
        (message) => console.log("Stream Closed:", message), // onClose
        (error) => console.log("Stream Error:", error) // onError
    );
    if (!stream && response && response.outputs) {
        const flowOutputs = response.outputs[0];
        const firstComponentOutputs = flowOutputs.outputs[0];
        const output = firstComponentOutputs.outputs.message;
        const final_output = JSON.parse(output.message.text);
        console.log("Insights: ", final_output);
        return final_output;
    }
  } catch (error) {
    console.error('Main Error', error.message);
  }
}



// DATASTAX LANGFLOW OVER -------------------------



// Serve static files (CSS and JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve the test.html file on the '/' route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

app.get('/api/fetchData', async (req, res) => {
  const inputValue = req.query.inputValue || ""; // Replace with your default value if needed
  const inputType = "chat";
  const outputType = "chat";
  const sort_by = req.query.sort_by || "likes";
  const data_type = req.query.data_type || "normal"; // or avg

  try {
    const result = await main_data_fetcher(inputValue, inputType, outputType, false);
    const fixed_result = result.replace(/,\s*\]$/, ']');
    const parsedResult = JSON.parse(fixed_result);

    // Sort the JSON array based on the `sort_by` query parameter
    if (sort_by === "likes" || sort_by === "shares" || sort_by === "comments" || sort_by === "reach") {
      parsedResult.sort((a, b) => b[sort_by] - a[sort_by]);
    }

    // If the request is asking for average data
    if (data_type === "avg") {
      // Calculate average data for each post type (Reels, Video, Carousel)
      const postTypes = ['reels', 'carousel', 'static images'];
      const averageData = [];

      postTypes.forEach(postType => {
        const filteredPosts = parsedResult.filter(post => post.postType === postType);
        
        if (filteredPosts.length > 0) {
          const totalLikes = filteredPosts.reduce((sum, post) => sum + post.likes, 0);
          const totalShares = filteredPosts.reduce((sum, post) => sum + post.shares, 0);
          const totalComments = filteredPosts.reduce((sum, post) => sum + post.comments, 0);
          const totalReach = filteredPosts.reduce((sum, post) => sum + post.reach, 0);

          const averageLikes = parseFloat((totalLikes / filteredPosts.length).toFixed(2));
          const averageShares = parseFloat((totalShares / filteredPosts.length).toFixed(2));
          const averageComments = parseFloat((totalComments / filteredPosts.length).toFixed(2));
          const averageReach = parseFloat((totalReach / filteredPosts.length).toFixed(2));

          averageData.push({
            postType,
            averageLikes,
            averageShares,
            averageComments,
            averageReach
          });
        }
      });

      // Sort the average data array based on the `sort_by` query parameter
      if (sort_by === "likes" || sort_by === "shares" || sort_by === "comments" || sort_by === "reach") {
        const sortField = `average${sort_by.charAt(0).toUpperCase() + sort_by.slice(1)}`;
        averageData.sort((a, b) => b[sortField] - a[sortField]);
      }

      // Return both normal and average data
      res.json({
        normalData: parsedResult,
        averageData: averageData
      });

    } else {
      // Return only the normal data if not requesting averages
      res.json(parsedResult);
    }

  } catch (error) {
    console.log("ERROR: ", error);
    res.status(500).json({ error: "Failed to process the request." });
  }
});

app.get('/api/fetchInsights', async (req, res) => {

  const inputValue = req.query.inputValue || "";
  console.log("INPUT DATA FOR INSIGHT: ", inputValue);

  try {
    const result = await main_insight_fetcher(inputValue);

    return res.json(result);

  } catch (error) {
    console.log("ERROR: ", error);
    res.status(500).json({ error: "Failed to process the request." });
  }

});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
