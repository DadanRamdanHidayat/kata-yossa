import { and, asc, eq } from "drizzle-orm";
import AppShell from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { requireApproved } from "@/lib/guards";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { user } = await requireApproved();
  const { c } = await searchParams;

  // Hanya muat percakapan milik pengguna ini
  let activeId: string | undefined;
  let initial: { role: "user" | "assistant"; content: string }[] = [];
  if (c && UUID.test(c)) {
    const [owned] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.id, c), eq(conversations.userId, user.id)));
    if (owned) {
      activeId = owned.id;
      const rows = await db
        .select({ role: messages.role, content: messages.content })
        .from(messages)
        .where(eq(messages.conversationId, owned.id))
        .orderBy(asc(messages.createdAt));
      initial = rows.map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
    }
  }

  return (
    <AppShell
      active="chat"
      isAdmin={user.role === "admin"}
      email={user.email}
      title="Konsultasi Bisnis Kata Yossa"
      subtitle="AI siap menganalisis strategi dan kesiapan Anda"
    >
      <ChatWindow key={activeId ?? "new"} conversationId={activeId} initialMessages={initial} />
    </AppShell>
  );
}