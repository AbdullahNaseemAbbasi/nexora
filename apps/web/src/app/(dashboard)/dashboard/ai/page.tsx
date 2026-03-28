"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Wand2, FileText, MessageSquare, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

type Tab = "chat" | "suggest" | "summarize";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiPage() {
  const [tab, setTab] = useState<Tab>("chat");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggest tasks state
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [removedIndexes, setRemovedIndexes] = useState<Set<number>>(new Set());

  // Summarize state
  const [textToSummarize, setTextToSummarize] = useState("");
  const [summary, setSummary] = useState("");
  const [summarizeLoading, setSummarizeLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await apiClient.post("/ai/chat", { message: msg });
      setMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Failed to get response";
      toast.error(errMsg);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I could not process your request. Please check the API key configuration." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSuggestTasks = async () => {
    if (!goal.trim()) { toast.error("Please enter a goal"); return; }
    setSuggestLoading(true);
    setSuggestedTasks([]);
    setRemovedIndexes(new Set());
    try {
      const res = await apiClient.post("/ai/suggest-tasks", {
        goal: goal.trim(),
        context: context.trim() || undefined,
      });
      setSuggestedTasks(res.data.tasks || []);
      if (!res.data.tasks?.length) toast.error("No tasks generated. Try a more specific goal.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate tasks");
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!textToSummarize.trim()) { toast.error("Please enter text to summarize"); return; }
    setSummarizeLoading(true);
    setSummary("");
    try {
      const res = await apiClient.post("/ai/summarize", { text: textToSummarize.trim() });
      setSummary(res.data.summary || "");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to summarize");
    } finally {
      setSummarizeLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "chat", label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "suggest", label: "Suggest Tasks", icon: <Wand2 className="h-3.5 w-3.5" /> },
    { id: "summarize", label: "Summarize", icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          <h1 className="text-2xl font-semibold">AI Assistant</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Powered by LLaMA 3.3 · Generate tasks, summarize text, or chat about your projects
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border border-border rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
              tab === t.id
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== CHAT TAB ===== */}
      {tab === "chat" && (
        <div className="border border-border rounded-lg overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground/20 mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium">Start a conversation</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Ask about project planning, task prioritization, team workflows, or anything else.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {[
                    "What tasks should I prioritize this week?",
                    "How do I structure a sprint planning?",
                    "What makes a good project roadmap?",
                    "Help me write a task description",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="text-left px-3 py-2.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 bg-foreground rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-background" strokeWidth={2} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-foreground text-background rounded-br-sm"
                      : "bg-accent text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 bg-accent rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-medium">Me</span>
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 bg-foreground rounded-full flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-background" strokeWidth={2} />
                </div>
                <div className="bg-accent px-3.5 py-3 rounded-xl rounded-bl-sm flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask anything about project management..."
                className="flex-1 bg-accent/50 border border-border rounded-lg px-3.5 py-2 text-sm outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/60"
                disabled={chatLoading}
              />
              <Button
                size="sm"
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="px-3"
              >
                {chatLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Press Enter to send · Powered by Groq + LLaMA 3.3
            </p>
          </div>
        </div>
      )}

      {/* ===== SUGGEST TASKS TAB ===== */}
      {tab === "suggest" && (
        <div className="max-w-2xl space-y-5">
          <div className="border border-border rounded-lg p-5 space-y-4">
            <div>
              <label className="text-[13px] font-medium block mb-1.5">Project goal *</label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Build a user authentication system for a web app"
                className="w-full h-10 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleSuggestTasks()}
              />
            </div>
            <div>
              <label className="text-[13px] font-medium block mb-1.5">
                Additional context <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Use Next.js, Prisma, and JWT tokens"
                className="w-full h-10 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors"
              />
            </div>
            <Button onClick={handleSuggestTasks} disabled={suggestLoading || !goal.trim()}>
              {suggestLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating tasks...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate tasks
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {suggestedTasks.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-[13px] font-semibold">
                  Suggested tasks ({suggestedTasks.length - removedIndexes.size})
                </p>
                <p className="text-[11px] text-muted-foreground">Click × to remove</p>
              </div>
              <div className="divide-y divide-border">
                {suggestedTasks.map((task, i) => {
                  if (removedIndexes.has(i)) return null;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors group"
                    >
                      <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-[13px]">{task}</span>
                      <button
                        onClick={() => setRemovedIndexes((prev) => { const next = new Set(Array.from(prev)); next.add(i); return next; })}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-border bg-accent/30">
                <p className="text-[11px] text-muted-foreground">
                  Copy these tasks into your project manually, or go to Projects to create them.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SUMMARIZE TAB ===== */}
      {tab === "summarize" && (
        <div className="max-w-2xl space-y-5">
          <div className="border border-border rounded-lg p-5 space-y-4">
            <div>
              <label className="text-[13px] font-medium block mb-1.5">Text to summarize *</label>
              <textarea
                value={textToSummarize}
                onChange={(e) => setTextToSummarize(e.target.value)}
                placeholder="Paste any long text, meeting notes, requirements document, or article..."
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-foreground/30 transition-colors resize-none"
                rows={8}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {textToSummarize.length} / 5000 characters
              </p>
            </div>
            <Button onClick={handleSummarize} disabled={summarizeLoading || !textToSummarize.trim()}>
              {summarizeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Summarizing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Summarize text
                </>
              )}
            </Button>
          </div>

          {summary && (
            <div className="border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                <p className="text-[13px] font-semibold">Summary</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
