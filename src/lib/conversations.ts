import { api } from "./api";

export type ConversationContext = "general" | "personal" | "relationship";
export interface Conversation {
  id: string;
  title: string;
  contextType: ConversationContext;
  relationshipId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface AssistantPayload {
  answer: string;
  reflectionPrompts: string[];
  limitations: string[];
}
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  assistantPayload?: AssistantPayload;
  createdAt?: string;
}

const obj = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
const str = (value: unknown) => (typeof value === "string" ? value : undefined);
const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
function conversation(value: unknown): Conversation {
  const x = obj(value);
  return {
    id: str(x.id) ?? "",
    title: str(x.title) ?? "Private conversation",
    contextType: (str(x.contextType) ??
      str(x.context_type) ??
      "personal") as ConversationContext,
    relationshipId: str(x.relationshipId) ?? str(x.relationship_id) ?? null,
    createdAt: str(x.createdAt) ?? str(x.created_at),
    updatedAt: str(x.updatedAt) ?? str(x.updated_at),
  };
}
function message(value: unknown): ConversationMessage {
  const x = obj(value);
  const payload = obj(x.assistantPayload ?? x.assistant_payload);
  return {
    id: str(x.id) ?? "",
    role: (str(x.role) ?? "user") as ConversationMessage["role"],
    content:
      str(x.userContent) ?? str(x.user_content) ?? str(payload.answer) ?? "",
    assistantPayload: Object.keys(payload).length
      ? {
          answer: str(payload.answer) ?? "",
          reflectionPrompts: strings(
            payload.reflectionPrompts ?? payload.reflection_prompts,
          ),
          limitations: strings(payload.limitations),
        }
      : undefined,
    createdAt: str(x.createdAt) ?? str(x.created_at),
  };
}

export const conversationsApi = {
  async all(signal?: AbortSignal) {
    const raw = await api<unknown>("/api/v1/conversations", { signal });
    return (Array.isArray(raw) ? raw : []).map(conversation);
  },
  async create(input: {
    contextType: ConversationContext;
    relationshipId?: string | null;
    title: string;
  }) {
    return conversation(
      await api<unknown>("/api/v1/conversations", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },
  async get(id: string, signal?: AbortSignal) {
    const raw = obj(
      await api<unknown>(`/api/v1/conversations/${id}`, { signal }),
    );
    return {
      conversation: conversation(raw.conversation),
      messages: (Array.isArray(raw.messages) ? raw.messages : []).map(message),
    };
  },
  async send(id: string, content: string) {
    const raw = obj(
      await api<unknown>(`/api/v1/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    );
    return message({ ...raw, role: "assistant" });
  },
  feedback: (id: string, rating: "helpful" | "not_helpful") =>
    api(`/api/v1/messages/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    }),
  archive: (id: string) =>
    api<void>(`/api/v1/conversations/${id}`, { method: "DELETE" }),
};
