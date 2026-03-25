import { ImageResponse } from "@vercel/og";

import { createClient } from "@/utils/supabase/server";

export const runtime = "edge";
export const alt = "CodeKingdom scout card";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, github_username, kingdoms(name, prestige, buildings(type, level, built_at))"
    )
    .eq("username", username)
    .maybeSingle();

  const kingdom = profile?.kingdoms?.[0];

  if (!profile || !kingdom) {
    return new Response("Kingdom not found", { status: 404 });
  }

  const topBuildings = [...(kingdom.buildings ?? [])]
    .sort((a, b) => b.level - a.level)
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background:
            "radial-gradient(circle at top left, rgba(201,168,76,0.24), transparent 30%), linear-gradient(180deg, #171120 0%, #09070e 100%)",
          color: "#f7f1e4",
          padding: "48px",
          fontFamily: "serif",
        }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(201,168,76,0.28)",
            borderRadius: 28,
            padding: 36,
            background: "rgba(10, 8, 15, 0.55)",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                  color: "#C9A84C",
                }}>
                CodeKingdom
              </div>
              <div style={{ fontSize: 64, fontWeight: 700, marginTop: 16 }}>
                {kingdom.name}
              </div>
              <div
                style={{
                  fontSize: 28,
                  marginTop: 14,
                  color: "rgba(247,241,228,0.72)",
                }}>
                @{profile.github_username ?? profile.username}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                padding: "18px 22px",
                borderRadius: 22,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              <div
                style={{
                  fontSize: 16,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: "rgba(247,241,228,0.6)",
                }}>
                Prestige
              </div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: "#C9A84C",
                  marginTop: 12,
                }}>
                {kingdom.prestige.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 36 }}>
            {topBuildings.map((building) => (
              <div
                key={`${building.type}-${building.built_at}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 280,
                  padding: 20,
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                <div
                  style={{
                    fontSize: 16,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: "rgba(247,241,228,0.55)",
                  }}>
                  Stronghold
                </div>
                <div
                  style={{
                    fontSize: 30,
                    marginTop: 12,
                    textTransform: "capitalize",
                  }}>
                  {building.type.replaceAll("_", " ")}
                </div>
                <div style={{ fontSize: 22, marginTop: 18, color: "#C9A84C" }}>
                  Level {building.level}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
