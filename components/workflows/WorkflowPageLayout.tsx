/**
 * WorkflowPageLayout Component
 *
 * Main layout and UI structure for workflow pages.
 * Renders sidebar, inputs panel, result panel, prompt input, and recent generations.
 *
 * Responsibilities:
 * - Render sidebar with chat integration
 * - Render 2-column layout (inputs left, result+prompt+gallery right)
 * - Mobile overlay handling
 */

"use client";

import { ChatSidebar } from "@/components/chat/Sidebar/ChatSidebar";
import { InputsPanel, ResultPanel, RecentGenerations } from "@/components/workflows/shared";
import { workflowLogger } from "@/lib/logger";
import type { WorkflowPageState } from "@/hooks/workflows/common/useWorkflowPageState";
import type { WorkflowActions } from "@/hooks/workflows/common/useWorkflowActions";
import type { ChatIntegration } from "@/hooks/workflows/common/useChatIntegration";
import type { WorkflowPageConfig } from "./WorkflowPage";

interface WorkflowPageLayoutProps<TSettings extends Record<string, unknown>> {
  config: WorkflowPageConfig<TSettings>;
  state: WorkflowPageState<TSettings>;
  actions: WorkflowActions;
  chat: ChatIntegration;
}

export function WorkflowPageLayout<TSettings extends Record<string, unknown>>({
  config,
  state,
  actions,
  chat,
}: WorkflowPageLayoutProps<TSettings>) {
  const { PromptInputComponent } = config;

  return (
    <div className="h-screen overflow-hidden bg-gray-200 px-0 py-0 sm:px-1 sm:py-1 md:px-2">
      <div className="mx-auto flex h-full max-w-none gap-0 sm:gap-1">
        {/* Sidebar */}
        <ChatSidebar
          isOpen={state.isSidebarOpen}
          onClose={() => state.setIsSidebarOpen(false)}
          isCollapsed={state.isCollapsed}
          onToggleCollapse={() => state.setIsCollapsed(!state.isCollapsed)}
          onNewChat={chat.handleNewChat}
          conversations={chat.conversations}
          currentConversationId={chat.currentConversationId}
          onLoadConversation={chat.handleLoadConversation}
          onDeleteConversation={chat.handleDeleteConversation}
          onDuplicateConversation={chat.handleDuplicateConversation}
          onRenameConversation={chat.handleRenameConversation}
        />

        {/* Main Content Area */}
        <div className="border-pw-black/10 flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-white/90 to-white/80 shadow-2xl backdrop-blur-lg">
          {/* Header */}
          <div className="flex-shrink-0 bg-transparent px-4 py-2 sm:px-6">
            <h1 className="text-pw-black/80 text-base font-semibold">{config.name}</h1>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-hidden px-4 pb-4 pt-3 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
              {/* 2-Column Layout: Inputs (left, 380px) | Result + Prompt + Gallery (right, flex-1) */}
              <div className="flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row">
                {/* Left Column: Inputs Panel (380px fixed) */}
                <div className="h-full flex-shrink-0 overflow-hidden lg:w-[380px]">
                  <div className="border-pw-black/10 h-full rounded-xl border bg-gradient-to-br from-white/80 to-white/70 p-4 backdrop-blur-lg">
                    <InputsPanel
                      data={state.workflowState.inputData}
                      onChange={state.workflowState.setInputData}
                      onCropSource={actions.handleCropSource}
                      onCropReference={actions.handleCropReference}
                    />
                  </div>
                </div>

                {/* Right Column: Result + Prompt + Gallery (flex-1) */}
                <div className="h-full flex-1 overflow-hidden">
                  <div className="border-pw-black/10 h-full overflow-y-auto rounded-xl border bg-gradient-to-br from-white/80 to-white/70 p-4 backdrop-blur-lg">
                    <div className="flex h-full flex-col gap-2">
                      {/* Result Panel */}
                      <div className="min-h-0 flex-[2.5] overflow-visible">
                        <ResultPanel
                          imageUrl={state.workflowState.resultImage}
                          mediaType={state.workflowState.resultMediaType}
                          isGenerating={
                            state.isGenerating ||
                            state.editHook?.isEditing ||
                            state.upscaleHook?.isUpscaling ||
                            state.isGeneratingVideo
                          }
                          generatingType={
                            state.isGeneratingVideo
                              ? "video"
                              : state.upscaleHook?.isUpscaling
                                ? "upscale"
                                : state.editHook?.isEditing
                                  ? "edit"
                                  : "render"
                          }
                          onCreateVideo={state.handlers.handleCreateVideo}
                          onUpscale={actions.handleUpscale}
                          onDownload={() =>
                            state.handlers.handleDownload(
                              state.workflowState.resultImage || undefined,
                              undefined,
                              state.workflowState.resultMediaType
                            )
                          }
                          onCrop={actions.handleCropResult}
                          renderName={state.renderName}
                          onRenderNameChange={state.setRenderName}
                          onEdit={actions.handleEdit}
                          onImageClick={actions.handleResultClick}
                        />
                      </div>

                      {/* Prompt Input with Settings */}
                      <div className="flex min-h-0 flex-shrink-0 flex-col">
                        <PromptInputComponent
                          prompt={state.workflowState.prompt}
                          onPromptChange={state.workflowState.setPrompt}
                          onGenerate={actions.handleGenerate}
                          onEnhancePrompt={
                            state.enhanceHook ? actions.handleEnhancePrompt : undefined
                          }
                          isGenerating={state.isGenerating}
                          isEnhancing={state.enhanceHook?.isEnhancing}
                          disabled={false}
                          settings={state.workflowState.settings}
                          onSettingsChange={state.workflowState.setSettings}
                          hasReferenceImage={state.workflowState.inputData.referenceImages.some(
                            (img) => img.preview !== null
                          )}
                        />
                      </div>

                      {/* Recent Generations */}
                      <div className="min-h-0 flex-[1.5] overflow-hidden">
                        <RecentGenerations
                          generations={state.generations.recentGenerations}
                          onSelect={(gen) => {
                            const index = state.generations.recentGenerations.findIndex(
                              (g) => g.id === gen.id
                            );
                            state.lightbox.openLightbox(
                              {
                                id: gen.id,
                                imageUrl: gen.imageUrl,
                                timestamp: gen.timestamp,
                                name: gen.name,
                                prompt: gen.prompt,
                                sourceImageUrl: (gen as any).sourceImageUrl, // Add source image
                                type:
                                  gen.type === "image"
                                    ? "render"
                                    : (gen.type as "render" | "video" | "upscale"),
                              },
                              index
                            );
                          }}
                          onDownload={(gen) => {
                            // Determine if this is a video based on type field
                            const isVideo = gen.type === "video";
                            const mediaType = isVideo ? "video" : "image";
                            const extension = isVideo ? ".mp4" : ".jpg";

                            workflowLogger.debug("Download Debug", {
                              genType: gen.type,
                              genMediaType: (gen as any).mediaType ?? "unknown",
                              isVideo,
                              mediaType,
                              extension,
                              url: gen.imageUrl,
                            });

                            // Generate descriptive filename based on type
                            let filename: string;
                            const timestamp = gen.timestamp
                              ? new Date(gen.timestamp)
                                  .toISOString()
                                  .slice(0, 19)
                                  .replace(/[T:]/g, "-")
                              : "unknown";

                            if (gen.type === "video") {
                              filename = `video-${timestamp}${extension}`;
                            } else if (gen.type === "upscale") {
                              filename = `upscaled-${timestamp}${extension}`;
                            } else if (gen.type === "render") {
                              filename = `render-${timestamp}${extension}`;
                            } else if (gen.name) {
                              // Fallback: use DB name
                              const nameWithoutExt = gen.name.includes(".")
                                ? gen.name.substring(0, gen.name.lastIndexOf("."))
                                : gen.name;
                              filename = `${nameWithoutExt}${extension}`;
                            } else {
                              filename = `generation-${timestamp}${extension}`;
                            }

                            state.handlers.handleDownload(gen.imageUrl, filename, mediaType);
                          }}
                          onDelete={state.generations.deleteGeneration}
                          onEdit={state.handlers.handleLoadForEdit}
                          onCreateVideo={state.handlers.handleLoadForVideo}
                          onUpscale={actions.handleUpscale}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {state.isSidebarOpen && (
          <div
            className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => state.setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
