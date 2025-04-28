import { create } from 'zustand';

interface PromptConfig {
  id: string;
  text: string;
}

interface ApiKey {
  provider: 'openai' | 'gemini' | 'groq';
  key: string;
}

interface AudioUpload {
  id: string;
  fileName: string;
  duration: number;
  createdAt: Date;
}

interface Report {
  id: string;
  audioId: string;
  content: string;
  provider: 'openai' | 'gemini' | 'groq';
  createdAt: Date;
}

interface AppState {
  // 認証状態
  user: any | null;
  setUser: (user: any | null) => void;

  // プロンプト設定
  prompts: PromptConfig[];
  selectedPromptId: string | null;
  addPrompt: (prompt: PromptConfig) => void;
  updatePrompt: (id: string, text: string) => void;
  deletePrompt: (id: string) => void;
  selectPrompt: (id: string | null) => void;
  clearPrompts: () => void;

  // APIキー
  apiKeys: ApiKey[];
  addApiKey: (apiKey: ApiKey) => void;
  updateApiKey: (provider: 'openai' | 'gemini' | 'groq', key: string) => void;
  deleteApiKey: (provider: 'openai' | 'gemini' | 'groq') => void;

  // 音声アップロード
  audioUploads: AudioUpload[];
  addAudioUpload: (upload: AudioUpload) => void;

  // レポート
  reports: Report[];
  addReport: (report: Report) => void;

  // 設定
  sttProvider: 'openai' | 'groq';
  llmProvider: 'openai' | 'gemini' | 'groq';
  setSttProvider: (provider: 'openai' | 'groq') => void;
  setLlmProvider: (provider: 'openai' | 'gemini' | 'groq') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // 認証状態
  user: null,
  setUser: (user) => set({ user }),

  // プロンプト設定
  prompts: [],
  selectedPromptId: null,
  addPrompt: (prompt) => set((state) => ({ prompts: [...state.prompts, prompt] })),
  updatePrompt: (id, text) => set((state) => ({
    prompts: state.prompts.map((p) => p.id === id ? { ...p, text } : p)
  })),
  deletePrompt: (id) => set((state) => ({
    prompts: state.prompts.filter((p) => p.id !== id)
  })),
  selectPrompt: (id) => set({ selectedPromptId: id }),
  // プロンプトをすべてクリア
  clearPrompts: () => set({ prompts: [] }),

  // APIキー
  apiKeys: [],
  addApiKey: (apiKey) => set((state) => ({
    apiKeys: [...state.apiKeys.filter((k) => k.provider !== apiKey.provider), apiKey]
  })),
  updateApiKey: (provider, key) => set((state) => ({
    apiKeys: state.apiKeys.map((k) => k.provider === provider ? { ...k, key } : k)
  })),
  deleteApiKey: (provider) => set((state) => ({
    apiKeys: state.apiKeys.filter((k) => k.provider !== provider)
  })),

  // 音声アップロード
  audioUploads: [],
  addAudioUpload: (upload) => set((state) => ({
    audioUploads: [upload, ...state.audioUploads]
  })),

  // レポート
  reports: [],
  addReport: (report) => set((state) => ({
    reports: [report, ...state.reports]
  })),

  // 設定
  sttProvider: 'openai',
  llmProvider: 'openai',
  setSttProvider: (provider) => set({ sttProvider: provider }),
  setLlmProvider: (provider) => set({ llmProvider: provider }),
}));
