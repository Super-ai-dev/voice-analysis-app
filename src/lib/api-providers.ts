// OpenAI Provider
export const callOpenAI = async (text: string, prompt: string, apiKey: string) => {
  try {
    if (!apiKey) {
      throw new Error('OpenAI APIキーが設定されていません。設定画面から追加してください。');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`OpenAI API エラー: ${data.error.message}`);
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error instanceof Error ? error : new Error('OpenAI APIの呼び出しに失敗しました');
  }
};

// Google AI (Gemini) Provider
export const callGemini = async (text: string, prompt: string, apiKey: string) => {
  try {
    if (!apiKey) {
      throw new Error('Gemini APIキーが設定されていません。設定画面から追加してください。');
    }

    // Gemini APIの実装
    // 実際の実装ではGoogle AI SDKを使用します
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${prompt}\n\n${text}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Gemini API エラー: ${data.error.message}`);
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error instanceof Error ? error : new Error('Gemini APIの呼び出しに失敗しました');
  }
};

// Groq Provider
export const callGroq = async (text: string, prompt: string, apiKey: string) => {
  try {
    if (!apiKey) {
      throw new Error('Groq APIキーが設定されていません。設定画面から追加してください。');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Groq API エラー: ${data.error.message}`);
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API error:', error);
    throw error instanceof Error ? error : new Error('Groq APIの呼び出しに失敗しました');
  }
};

// STT Provider (Whisper)
export const transcribeWithWhisper = async (audioFile: File, apiKey: string) => {
  try {
    if (!apiKey) {
      throw new Error('OpenAI APIキーが設定されていません。設定画面から追加してください。');
    }

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', 'ja');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Whisper API エラー: ${data.error.message}`);
    }
    return data.text;
  } catch (error) {
    console.error('Whisper API error:', error);
    throw error instanceof Error ? error : new Error('Whisper APIの呼び出しに失敗しました');
  }
};

// STT Provider (Groq)
// 注意: 現在GroqはWhisper APIを直接提供していないため、OpenAIのWhisper APIを使用します
export const transcribeWithGroq = async (audioFile: File, groqApiKey: string, openaiApiKey: string) => {
  try {
    // Groq APIキーは現在使用していませんが、将来的にGroqがSTT APIを提供した場合に備えて引数として残しています
    if (!openaiApiKey) {
      throw new Error('OpenAI APIキーが設定されていません。設定画面から追加してください。');
    }

    // OpenAIのWhisperを使用
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', 'ja');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: formData
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`音声認識エラー: ${data.error.message}`);
    }
    return data.text;
  } catch (error) {
    console.error('音声認識エラー:', error);
    throw error instanceof Error ? error : new Error('音声認識に失敗しました');
  }
};
