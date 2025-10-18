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

'use client';

import { ChatSidebar } from '@/components/chat/Sidebar/ChatSidebar';
import { InputsPanel, ResultPanel, RecentGenerations } from '@/components/workflows/shared';
import { workflowLogger } from '@/lib/logger';
import type { WorkflowPageState } from '@/hooks/workflows/common/useWorkflowPageState';
import type { WorkflowActions } from '@/hooks/workflows/common/useWorkflowActions';
import type { ChatIntegration } from '@/hooks/workflows/common/useChatIntegration';
import type { WorkflowPageConfig } from './WorkflowPage';

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
    <div className="h-screen bg-pw-dark overflow-hidden px-0 sm:px-1 md:px-2 py-0 sm:py-1">
      <div className="h-full flex gap-0 sm:gap-1 max-w-none mx-auto">
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
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-lg border border-pw-black/10">
          {/* Header */}
          <div className="px-4 sm:px-6 py-2 bg-transparent flex-shrink-0">
            <h1 className="text-base font-semibold text-pw-black/80">{config.name}</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-3 flex flex-col gap-6 overflow-hidden">
              {/* 2-Column Layout: Inputs (left, 380px) | Result + Prompt + Gallery (right, flex-1) */}
              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                {/* Left Column: Inputs Panel (380px fixed) */}
                <div className="lg:w-[380px] flex-shrink-0 h-full overflow-hidden">
                  <div className="h-full p-4 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl">
                    <InputsPanel
                      data={state.workflowState.inputData}
                      onChange={state.workflowState.setInputData}
                      onCropSource={actions.handleCropSource}
                      onCropReference={actions.handleCropReference}
                    />
                  </div>
                </div>

                {/* Right Column: Result + Prompt + Gallery (flex-1) */}
                <div className="flex-1 h-full overflow-hidden">
                  <div className="h-full p-4 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-xl overflow-y-auto">
                    <div className="h-full flex flex-col gap-2">
                      {/* Result Panel */}
                      <div className="flex-[2.5] min-h-0 overflow-visible">
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
                            state.isGeneratingVideo ? "video"
                            : state.upscaleHook?.isUpscaling ? "upscale"
                            : state.editHook?.isEditing ? "edit"
                            : "render"
                          }
                          onCreateVideo={state.handlers.handleCreateVideo}
                          onUpscale={actions.handleUpscale}
                          onDownload={() => state.handlers.handleDownload(
                            state.workflowState.resultImage || undefined,
                            undefined,
                            state.workflowState.resultMediaType
                          )}
                          onCrop={actions.handleCropResult}
                          renderName={state.renderName}
                          onRenderNameChange={state.setRenderName}
                          onEdit={actions.handleEdit}
                          onImageClick={actions.handleResultClick}
                        />
                      </div>

                      {/* Prompt Input with Settings */}
                      <div className="flex-shrink-0 min-h-0 flex flex-col">
                        <PromptInputComponent
                          prompt={state.workflowState.prompt}
                          onPromptChange={state.workflowState.setPrompt}
                          onGenerate={actions.handleGenerate}
                          onEnhancePrompt={state.enhanceHook ? actions.handleEnhancePrompt : undefined}
                          isGenerating={state.isGenerating}
                          isEnhancing={state.enhanceHook?.isEnhancing}
                          disabled={false}
                          settings={state.workflowState.settings}
                          onSettingsChange={state.workflowState.setSettings}
                        />
                      </div>

                      {/* Recent Generations */}
                      <div className="flex-[1.5] min-h-0 overflow-hidden">
                        <RecentGenerations
                          generations={state.generations.recentGenerations}
                          onSelect={(gen) => {
                            const index = state.generations.recentGenerations.findIndex((g) => g.id === gen.id);
                            state.lightbox.openLightbox({
                              id: gen.id,
                              imageUrl: gen.imageUrl,
                              timestamp: gen.timestamp,
                              name: gen.name,
                              prompt: gen.prompt,
                              sourceImageUrl: (gen as any).sourceImageUrl, // Add source image
                              type: gen.type === "image" ? "render" : gen.type as "render" | "video" | "upscale"
                            }, index);
                          }}
                          onDownload={(gen) => {
                            // Determine if this is a video based on type field
                            const isVideo = gen.type === "video";
                            const mediaType = isVideo ? "video" : "image";
                            const extension = isVideo ? ".mp4" : ".jpg";

                            workflowLogger.debug('Download Debug', {
                              genType: gen.type,
                              genMediaType: (gen as any).mediaType ?? 'unknown',
                              isVideo,
                              mediaType,
                              extension,
                              url: gen.imageUrl
                            });

                            // Generate descriptive filename based on type
                            let filename: string;
                            const timestamp = gen.timestamp
                              ? new Date(gen.timestamp).toISOString().slice(0, 19).replace(/[T:]/g, '-')
                              : 'unknown';

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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
            onClick={() => state.setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
