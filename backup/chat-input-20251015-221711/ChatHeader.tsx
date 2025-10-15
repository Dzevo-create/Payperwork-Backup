"use client";

import { useState } from "react";
import { Share2, Menu, ChevronDown, Edit2 } from "lucide-react";

export type GPTModel = "gpt-4o" | "gpt-5";
export type AIModel = "chatgpt" | "claude" | "gemini";
export type VideoModel = "kling" | "sora2";

interface ChatHeaderProps {
  onMenuClick?: () => void;
  selectedModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
  selectedGPTModel?: GPTModel;
  onGPTModelChange?: (model: GPTModel) => void;
  selectedVideoModel?: VideoModel;
  onVideoModelChange?: (model: VideoModel) => void;
  mode?: "chat" | "image" | "video";
  chatName?: string;
  onChatNameChange?: (name: string) => void;
  isSuperChatEnabled?: boolean;
  onSuperChatToggle?: (enabled: boolean) => void;
}

export function ChatHeader({
  onMenuClick,
  selectedModel = "chatgpt",
  onModelChange,
  selectedGPTModel = "gpt-4o",
  onGPTModelChange,
  selectedVideoModel = "kling",
  onVideoModelChange,
  mode = "chat",
  chatName = "Neuer Chat",
  onChatNameChange,
  isSuperChatEnabled = false,
  onSuperChatToggle
}: ChatHeaderProps) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(chatName);

  const gptModels: { id: GPTModel; name: string; version: string; badge?: string; desc?: string }[] = [
    { id: "gpt-4o", name: "ChatGPT", version: "4o", desc: "Schnell" },
    { id: "gpt-5", name: "ChatGPT", version: "5", badge: "Neu", desc: "Leistungsstark" },
  ];

  const chatModels: { id: AIModel; name: string; version: string }[] = [
    { id: "chatgpt", name: "ChatGPT", version: selectedGPTModel === "gpt-4o" ? "4o" : "5" },
    { id: "claude", name: "Claude", version: "3.5" },
    { id: "gemini", name: "Gemini", version: "2.0" },
  ];

  const videoModels: { id: VideoModel; name: string; version: string }[] = [
    { id: "kling", name: "Payperwork Move", version: "v.1" },
    { id: "sora2", name: "Payperwork Move", version: "v.2" },
  ];

  const getModelDisplay = () => {
    if (mode === "image") {
      return { name: "Payperwork Flash", version: "v.1" };
    } else if (mode === "video") {
      const model = videoModels.find(m => m.id === selectedVideoModel) || videoModels[0];
      return { name: model.name, version: model.version };
    } else {
      // Chat mode - show model name with version
      if (selectedModel === "chatgpt") {
        return { name: "ChatGPT", version: selectedGPTModel === "gpt-4o" ? "4o" : "5" };
      } else if (selectedModel === "claude") {
        return { name: "Claude", version: "3.5" };
      } else if (selectedModel === "gemini") {
        return { name: "Gemini", version: "2.0" };
      }
      // Fallback
      return { name: "ChatGPT", version: "4o" };
    }
  };

  const currentModelDisplay = getModelDisplay();

  const handleSaveName = () => {
    if (editedName.trim()) {
      onChatNameChange?.(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditedName(chatName);
      setIsEditingName(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 bg-transparent">
      {/* Left: Mobile Menu + Model Selector + Chat Name */}
      <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 hover:bg-pw-black/5 rounded-lg transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4 text-pw-black/60" />
        </button>

        {/* Model Selector Dropdown - Compact single line */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => (mode === "chat" || mode === "video") && setIsModelDropdownOpen(!isModelDropdownOpen)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors ${
              (mode === "chat" || mode === "video")
                ? "bg-pw-black/5 hover:bg-pw-black/10 cursor-pointer"
                : "bg-pw-black/5 cursor-default"
            }`}
          >
            <span className="text-[10px] sm:text-xs font-medium text-pw-black whitespace-nowrap">
              {currentModelDisplay.name} {currentModelDisplay.version}
            </span>
            {(mode === "chat" || mode === "video") && (
              <ChevronDown className={`w-3 h-3 text-pw-black/60 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Dropdown Menu - For chat mode */}
          {mode === "chat" && isModelDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsModelDropdownOpen(false)}
              />

              {/* AI Models Menu */}
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-pw-black/10 overflow-hidden z-20">
                {/* ChatGPT Section with versions */}
                <div className="border-b border-pw-black/10">
                  <div className="px-3 py-2 bg-pw-black/5">
                    <div className="text-xs font-semibold text-pw-black/60 uppercase tracking-wider">
                      ChatGPT
                    </div>
                  </div>
                  {gptModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange?.("chatgpt");
                        onGPTModelChange?.(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 text-left hover:bg-pw-black/5 transition-colors ${
                        selectedModel === "chatgpt" && selectedGPTModel === model.id ? 'bg-pw-accent/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-pw-black">
                            Version {model.version}
                          </div>
                          {model.desc && (
                            <div className="text-xs text-pw-black/60">
                              {model.desc}
                            </div>
                          )}
                        </div>
                        {model.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-pw-accent/20 text-pw-accent rounded">
                            {model.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Other AI Models */}
                <div>
                  <button
                    onClick={() => {
                      onModelChange?.("claude");
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left hover:bg-pw-black/5 transition-colors ${
                      selectedModel === "claude" ? 'bg-pw-accent/10' : ''
                    }`}
                  >
                    <div className="text-sm font-semibold text-pw-black">
                      Claude
                    </div>
                    <div className="text-xs text-pw-black/60">
                      Version 3.5 • Bald verfügbar
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onModelChange?.("gemini");
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left hover:bg-pw-black/5 transition-colors ${
                      selectedModel === "gemini" ? 'bg-pw-accent/10' : ''
                    }`}
                  >
                    <div className="text-sm font-semibold text-pw-black">
                      Gemini
                    </div>
                    <div className="text-xs text-pw-black/60">
                      Version 2.0 • Bald verfügbar
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Video Models Menu */}
          {mode === "video" && isModelDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsModelDropdownOpen(false)}
              />

              {/* Video Models Menu */}
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-pw-black/10 overflow-hidden z-20">
                {videoModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onVideoModelChange?.(model.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left hover:bg-pw-black/5 transition-colors ${
                      selectedVideoModel === model.id ? 'bg-pw-accent/10' : ''
                    }`}
                  >
                    <div className="text-sm font-semibold text-pw-black">
                      {model.name}
                    </div>
                    <div className="text-xs text-pw-black/60">
                      {model.version}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Chat Name with Edit - More space from model */}
        <div className="hidden sm:flex items-center min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="text-xs sm:text-sm font-medium text-pw-black bg-transparent border-b border-pw-accent focus:outline-none px-1 min-w-0 max-w-[200px]"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-1.5 group min-w-0">
              <span className="text-xs sm:text-sm font-medium text-pw-black/70 truncate max-w-[150px] sm:max-w-[200px]">
                {chatName}
              </span>
              <button
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-pw-black/5 rounded transition-opacity flex-shrink-0"
              >
                <Edit2 className="w-3 h-3 text-pw-black/60" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: SuperChat Toggle + Share Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* SuperChat Toggle - Only in chat mode */}
        {mode === "chat" && (
          <button
            onClick={() => onSuperChatToggle?.(!isSuperChatEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              isSuperChatEnabled
                ? "bg-pw-black text-white shadow-sm"
                : "bg-pw-black/5 text-pw-black/70 hover:bg-pw-black/10"
            }`}
          >
            <span className="font-semibold">{isSuperChatEnabled ? "SuperChat" : "Standard"}</span>
            <span className="hidden sm:inline text-[10px] opacity-70">
              {isSuperChatEnabled ? "Generative UI" : "Text only"}
            </span>
          </button>
        )}

        {/* Share Button */}
        <button
          className="p-1.5 hover:bg-pw-black/5 rounded-lg transition-colors flex-shrink-0"
          aria-label="Share chat"
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pw-black/60" />
        </button>
      </div>
    </header>
  );
}
