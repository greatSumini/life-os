const DISCORD_API_BASE = "https://discord.com/api/v10";

const HEADERS = {
  "User-Agent": "DiscordBot (https://github.com/greatSumini/life-os, 1.0)",
  "Content-Type": "application/json",
  Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
};

async function createDmChannel(userId: string): Promise<string> {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ recipient_id: userId }),
  });

  if (!res.ok) {
    throw new Error(`DM channel creation failed: ${res.status}`);
  }

  const data = await res.json();
  return data.id;
}

async function sendDiscordMessage(
  channelId: string,
  content: string
): Promise<string> {
  const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error(`Message send failed: ${res.status}`);
  }

  const data = await res.json();
  return data.id;
}

export async function POST(request: Request) {
  const { message } = await request.json();

  if (!message || typeof message !== "string" || message.trim() === "") {
    return Response.json({ error: "메세지가 비어있습니다." }, { status: 400 });
  }

  const userId = process.env.DISCORD_USER_ID;
  if (!userId || !process.env.DISCORD_BOT_TOKEN) {
    return Response.json(
      { error: "서버 설정 오류입니다." },
      { status: 500 }
    );
  }

  try {
    const channelId = await createDmChannel(userId);
    const messageId = await sendDiscordMessage(channelId, message);
    return Response.json({ success: true, messageId });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "알 수 없는 오류";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
