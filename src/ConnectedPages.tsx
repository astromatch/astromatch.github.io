import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Bookmark, Send, Sparkles, Trash2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppShell, ButtonLink, Page } from "./components";
import { ApiError } from "./lib/api";
import { auth } from "./lib/firebase";
import { accountApi } from "./lib/account";
import {
  conversationsApi,
  type ConversationContext,
  type ConversationMessage,
} from "./lib/conversations";
import { libraryApi, type Library } from "./lib/library";
import { relationshipsApi, type Relationship } from "./lib/relationships";
import { setAnalyticsConsent, track } from "./lib/analytics";
import { ProfileTabs } from "./ProfileTabs";

const message = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "AstroMatch could not connect. Please try again.";

export function AskPage() {
  const [params, setParams] = useSearchParams();
  const requestedRelationship = params.get("relationshipId") ?? "";
  const requestedConversation = params.get("conversationId") ?? "";
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [context, setContext] = useState<ConversationContext>(
    requestedRelationship ? "relationship" : "personal",
  );
  const [relationshipId, setRelationshipId] = useState(requestedRelationship);
  const [conversationId, setConversationId] = useState(requestedConversation);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [text, setText] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    track("ask_screen_viewed");
    relationshipsApi
      .all()
      .then(setRelationships)
      .catch(() => setRelationships([]));
  }, []);
  useEffect(() => {
    if (!requestedConversation) return;
    conversationsApi
      .get(requestedConversation)
      .then((value) => {
        setConversationId(value.conversation.id);
        setContext(value.conversation.contextType);
        setRelationshipId(value.conversation.relationshipId ?? "");
        setMessages(value.messages);
      })
      .catch((value) => setError(message(value)));
  }, [requestedConversation]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const question = text.trim();
    if (!question || waiting) return;
    if (context === "relationship" && !relationshipId) {
      setError("Choose a relationship first.");
      return;
    }
    setWaiting(true);
    setError("");
    setMessages((items) => [
      ...items,
      { id: crypto.randomUUID(), role: "user", content: question },
    ]);
    setText("");
    track("astrology_question_submitted", { context_type: context });
    try {
      let id = conversationId;
      if (!id) {
        const created = await conversationsApi.create({
          contextType: context,
          relationshipId: context === "relationship" ? relationshipId : null,
          title: question.slice(0, 80),
        });
        id = created.id;
        setConversationId(id);
        setParams({ conversationId: id }, { replace: true });
      }
      const answer = await conversationsApi.send(id, question);
      setMessages((items) => [...items, answer]);
      track("astrology_answer_completed", { context_type: context });
    } catch (value) {
      setError(message(value));
      track("astrology_answer_failed", {
        context_type: context,
        error_category: value instanceof ApiError ? value.code : "network",
      });
    } finally {
      setWaiting(false);
    }
  }
  function reset(next: ConversationContext) {
    setContext(next);
    setConversationId("");
    setMessages([]);
    setParams({});
    setError("");
  }
  return (
    <AppShell>
      <div className="chat">
        <Page eyebrow="A PRIVATE CONVERSATION" title="Ask AstroMatch" />
        <div className="mode-row">
          <button
            className={context === "personal" ? "active" : ""}
            onClick={() => reset("personal")}
          >
            My patterns
          </button>
          <button
            className={context === "relationship" ? "active" : ""}
            onClick={() => reset("relationship")}
          >
            A relationship
          </button>
          <button
            className={context === "general" ? "active" : ""}
            onClick={() => reset("general")}
          >
            General
          </button>
        </div>
        {context === "relationship" && (
          <label className="chat-context">
            Relationship
            <select
              value={relationshipId}
              disabled={Boolean(conversationId)}
              onChange={(event) => setRelationshipId(event.target.value)}
            >
              <option value="">Choose a relationship</option>
              {relationships
                .filter(
                  (item) => item.compatibilityStatus === "compatibility_ready",
                )
                .map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.title ??
                      item.person?.displayName ??
                      "Private relationship"}
                  </option>
                ))}
            </select>
          </label>
        )}
        <div className="messages" aria-live="polite">
          {!messages.length && (
            <div className="chat-intro">
              <Sparkles />
              <h2>What are you trying to understand?</h2>
              <p>
                Answers use only the chart or relationship context you
                deliberately select.
              </p>
            </div>
          )}
          {messages.map((item) => (
            <div
              key={item.id}
              className={`message ${item.role === "user" ? "me" : "astro"}`}
            >
              {item.role === "assistant" && (
                <small>ASTROMATCH · INTERPRETATION</small>
              )}
              <p>{item.content}</p>
              {item.assistantPayload?.reflectionPrompts.map((prompt) => (
                <p className="reflection" key={prompt}>
                  {prompt}
                </p>
              ))}
              {item.assistantPayload?.limitations.map((limit) => (
                <small key={limit}>{limit}</small>
              ))}
              {item.role === "assistant" && (
                <div className="feedback">
                  <span>Was this helpful?</span>
                  <button
                    onClick={() =>
                      void conversationsApi.feedback(item.id, "helpful")
                    }
                  >
                    Yes
                  </button>
                  <button
                    onClick={() =>
                      void conversationsApi.feedback(item.id, "not_helpful")
                    }
                  >
                    Not quite
                  </button>
                </div>
              )}
            </div>
          ))}
          {waiting && (
            <div className="thinking">
              <i />
              <i />
              <i /> Reading the selected context…
            </div>
          )}
          {error && (
            <p role="alert" className="form-message">
              {error}
            </p>
          )}
        </div>
        <form className="composer" onSubmit={submit}>
          <textarea
            maxLength={2000}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={1}
            placeholder="Ask what’s on your mind…"
            aria-label="Your question"
          />
          <button disabled={!text.trim() || waiting} aria-label="Send">
            <Send />
          </button>
        </form>
      </div>
    </AppShell>
  );
}

export function SavedPage() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<
    "saved_items" | "conversations" | "share_cards"
  >("saved_items");
  const load = () =>
    libraryApi
      .get()
      .then(setLibrary)
      .catch((value) => setError(message(value)));
  useEffect(() => {
    void load();
  }, []);
  async function remove(id: string, kind: "saved" | "conversation" | "share") {
    if (kind === "saved") await libraryApi.remove(id);
    else if (kind === "conversation") await conversationsApi.archive(id);
    else await libraryApi.revokeShare(id);
    await load();
  }
  const items = library?.[tab] ?? [];
  return (
    <AppShell>
      <Page eyebrow="YOUR PRIVATE LIBRARY" title="Saved" />
      <div className="tabs">
        <button
          className={tab === "saved_items" ? "active" : ""}
          onClick={() => setTab("saved_items")}
        >
          Saved
        </button>
        <button
          className={tab === "conversations" ? "active" : ""}
          onClick={() => setTab("conversations")}
        >
          Conversations
        </button>
        <button
          className={tab === "share_cards" ? "active" : ""}
          onClick={() => setTab("share_cards")}
        >
          Share cards
        </button>
      </div>
      {error && (
        <p role="alert" className="form-message">
          {error}
        </p>
      )}
      {!library ? (
        <p>Opening your library…</p>
      ) : items.length ? (
        <div className="list">
          {tab === "saved_items" &&
            library.saved_items.map((item) => (
              <article className="list-row" key={item.id}>
                <Link
                  to={
                    item.item_type === "blueprint_insight"
                      ? "/blueprint"
                      : `/relationships/${item.relationship_id}/report`
                  }
                >
                  <Bookmark />
                  <div>
                    <h3>{item.item_type.replaceAll("_", " ")}</h3>
                    <p>{item.content_key ?? "Complete report"}</p>
                  </div>
                </Link>
                <button
                  aria-label="Remove saved item"
                  onClick={() => void remove(item.id, "saved")}
                >
                  <Trash2 />
                </button>
              </article>
            ))}
          {tab === "conversations" &&
            library.conversations.map((item) => (
              <article className="list-row" key={item.id}>
                <Link to={`/ask?conversationId=${item.id}`}>
                  <Sparkles />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.contextType} context</p>
                  </div>
                </Link>
                <button
                  aria-label="Archive conversation"
                  onClick={() => void remove(item.id, "conversation")}
                >
                  <Trash2 />
                </button>
              </article>
            ))}
          {tab === "share_cards" &&
            library.share_cards.map((item) => (
              <article className="list-row" key={item.id}>
                <div>
                  <Sparkles />
                  <div>
                    <h3>Private share card</h3>
                    <p>
                      {item.payload.strongest_category?.replaceAll("_", " ") ??
                        "Relationship summary"}{" "}
                      · not publicly hosted
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Revoke share card"
                  onClick={() => void remove(item.id, "share")}
                >
                  <Trash2 />
                </button>
              </article>
            ))}
        </div>
      ) : (
        <div className="empty">
          <Bookmark />
          <h2>Keep the useful parts close</h2>
          <p>
            Your saved reports, insights, conversations and private share cards
            will live here.
          </p>
          <ButtonLink to="/relationships">Explore relationships</ButtonLink>
        </div>
      )}
    </AppShell>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [consent, setConsent] = useState(
    localStorage.getItem("am:analytics-consent") === "granted",
  );
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  async function exportData() {
    setBusy("export");
    setStatus("");
    try {
      const data = await accountApi.exportData();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `astromatch-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Your private export was downloaded.");
    } catch (value) {
      setStatus(message(value));
    } finally {
      setBusy("");
    }
  }
  async function deleteAccount() {
    if (
      !confirm(
        "Delete your AstroMatch account? Your account will be disabled immediately and scheduled for permanent removal.",
      )
    )
      return;
    setBusy("delete");
    try {
      await accountApi.deleteAccount();
      await auth?.signOut();
      for (const key of Object.keys(localStorage))
        if (key.startsWith("am:")) localStorage.removeItem(key);
      navigate("/login?deleted=1", { replace: true });
    } catch (value) {
      setStatus(message(value));
      setBusy("");
    }
  }
  return (
    <AppShell>
      <div className="settings-profile-shell">
        <Page eyebrow="YOUR ACCOUNT" title="Settings" />
        <ProfileTabs />
        <div className="settings-list">
          <section>
            <h2>Privacy</h2>
            <label className="toggle">
              Anonymous product analytics
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => {
                  setConsent(event.target.checked);
                  setAnalyticsConsent(event.target.checked);
                }}
              />
              <i />
            </label>
            <p>
              Never includes names, email, birth data, locations or question
              text.
            </p>
          </section>
          <section>
            <h2>Account</h2>
            <button disabled={Boolean(busy)} onClick={() => void exportData()}>
              Export my data{" "}
              <span>{busy === "export" ? "Preparing…" : "JSON download"}</span>
            </button>
            <button
              onClick={async () => {
                await auth?.signOut();
                track("logout_completed");
                navigate("/login");
              }}
            >
              Log out
            </button>
            <button
              disabled={Boolean(busy)}
              className="danger"
              onClick={() => void deleteAccount()}
            >
              {busy === "delete" ? "Deleting…" : "Delete account"}
            </button>
            {status && <p role="status">{status}</p>}
          </section>
          <section>
            <h2>Legal</h2>
            <Link to="/privacy">
              Privacy policy <ArrowRight />
            </Link>
            <Link to="/terms">
              Terms of use <ArrowRight />
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
