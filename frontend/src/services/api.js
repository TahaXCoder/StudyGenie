import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadDocument = async (file, onProgress, controller) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    signal: controller?.signal,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
  return response.data;
};

export const chatStream = (query, onMessage, onSources, onError, onComplete) => {
  const controller = new AbortController();
  
  fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    signal: controller.signal,
  })
    .then((response) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function processStream() {
        reader.read().then(({ done, value }) => {
          if (done) {
            if (onComplete) onComplete();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                if (onComplete) onComplete();
                return;
              }
              
              try {
                const data = JSON.parse(dataStr);
                
                if (data.type === 'sources') {
                  onSources(data.sources);
                } else if (data.response) {
                  // Cloudflare's streaming format often has 'response' field
                  onMessage(data.response);
                } else if (data.choices && data.choices[0]?.delta?.content) {
                  // Standard OpenAI/DeepSeek format
                  onMessage(data.choices[0].delta.content);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
          processStream();
        });
      }

      processStream();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    });

  return controller;
};

export const resetIndex = async () => {
  const response = await api.post('/reset-index');
  return response.data;
};
