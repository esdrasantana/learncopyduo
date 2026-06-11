import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateBody {
  projectId: string;
  count?: number;
  sourceType: "text" | "pdf" | "image" | "url" | "file";
  sourceTitle: string;
  text?: string;
  url?: string;
  fileBase64?: string;
  fileMime?: string;
  focusTopic?: string; // for adaptive learning
}

async function fetchUrlText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 StudyOS-Bot" } });
  if (!res.ok) throw new Error(`URL fetch failed: ${res.status}`);
  const html = await res.text();
  // strip scripts/styles and tags
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 20000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body: GenerateBody = await req.json();
    const count = Math.max(1, Math.min(20, body.count ?? 5));

    // Build user content (multimodal)
    const userContent: any[] = [];
    let contentPreview = "";

    const instruction = `Você é um tutor especialista que cria questões de múltipla escolha (A, B, C, D, E) em português brasileiro.
Crie EXATAMENTE ${count} questões a partir do conteúdo fornecido.
${body.focusTopic ? `Foque no tópico: "${body.focusTopic}".` : ""}
Cada questão deve ter:
- enunciado claro
- 5 alternativas plausíveis (A–E), apenas UMA correta
- a alternativa correta indicada pela letra
- explicação detalhada da resposta correta
- nível de dificuldade: easy, medium ou hard
- a matéria (subject) e o assunto (topic) inferidos do conteúdo

Use SEMPRE a ferramenta "save_questions" para retornar os dados.`;

    userContent.push({ type: "text", text: instruction });

    if (body.sourceType === "text" && body.text) {
      contentPreview = body.text.slice(0, 500);
      userContent.push({ type: "text", text: `\n\nConteúdo:\n${body.text.slice(0, 20000)}` });
    } else if (body.sourceType === "url" && body.url) {
      const txt = await fetchUrlText(body.url);
      contentPreview = txt.slice(0, 500);
      userContent.push({ type: "text", text: `\n\nConteúdo extraído de ${body.url}:\n${txt}` });
    } else if (body.sourceType === "image" && body.fileBase64) {
      contentPreview = `[Imagem]`;
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${body.fileMime || "image/png"};base64,${body.fileBase64}` },
      });
    } else if ((body.sourceType === "pdf" || body.sourceType === "file") && body.fileBase64) {
      contentPreview = `[${body.sourceType.toUpperCase()}: ${body.sourceTitle}]`;
      userContent.push({
        type: "file",
        file: {
          filename: body.sourceTitle || "doc.pdf",
          file_data: `data:${body.fileMime || "application/pdf"};base64,${body.fileBase64}`,
        },
      });
    } else {
      throw new Error("Conteúdo inválido ou ausente.");
    }

    // Tool schema for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "save_questions",
          description: "Save the generated multiple-choice questions",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    statement: { type: "string" },
                    alt_a: { type: "string" },
                    alt_b: { type: "string" },
                    alt_c: { type: "string" },
                    alt_d: { type: "string" },
                    alt_e: { type: "string" },
                    correct: { type: "string", enum: ["A", "B", "C", "D", "E"] },
                    explanation: { type: "string" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    subject: { type: "string" },
                    topic: { type: "string" },
                  },
                  required: ["statement", "alt_a", "alt_b", "alt_c", "alt_d", "alt_e", "correct", "explanation", "difficulty", "subject", "topic"],
                },
              },
            },
            required: ["questions"],
          },
        },
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: userContent }],
        tools,
        tool_choice: { type: "function", function: { name: "save_questions" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI gateway: ${aiRes.status} ${errText}` }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return tool call");
    const args = JSON.parse(toolCall.function.arguments);
    const questions = args.questions as any[];

    // Persist source
    const { data: source, error: sErr } = await supabase
      .from("sources")
      .insert({
        user_id: user.id,
        project_id: body.projectId,
        type: body.sourceType,
        title: body.sourceTitle,
        url: body.url ?? null,
        content_preview: contentPreview,
      })
      .select()
      .single();
    if (sErr) throw sErr;

    // Persist subjects/topics + questions
    const subjectsCache = new Map<string, string>();
    const topicsCache = new Map<string, string>();

    async function getSubjectId(name: string): Promise<string> {
      const key = name.trim();
      if (subjectsCache.has(key)) return subjectsCache.get(key)!;
      const { data: existing } = await supabase
        .from("subjects")
        .select("id")
        .eq("user_id", user.id)
        .eq("project_id", body.projectId)
        .eq("name", key)
        .maybeSingle();
      if (existing) {
        subjectsCache.set(key, existing.id);
        return existing.id;
      }
      const { data: created, error } = await supabase
        .from("subjects")
        .insert({ user_id: user.id, project_id: body.projectId, name: key })
        .select("id")
        .single();
      if (error) throw error;
      subjectsCache.set(key, created.id);
      return created.id;
    }

    async function getTopicId(subjectId: string, name: string): Promise<string> {
      const key = `${subjectId}:${name.trim()}`;
      if (topicsCache.has(key)) return topicsCache.get(key)!;
      const { data: existing } = await supabase
        .from("topics")
        .select("id")
        .eq("subject_id", subjectId)
        .eq("name", name.trim())
        .maybeSingle();
      if (existing) {
        topicsCache.set(key, existing.id);
        return existing.id;
      }
      const { data: created, error } = await supabase
        .from("topics")
        .insert({ user_id: user.id, project_id: body.projectId, subject_id: subjectId, name: name.trim() })
        .select("id")
        .single();
      if (error) throw error;
      topicsCache.set(key, created.id);
      return created.id;
    }

    const created: any[] = [];
    for (const q of questions) {
      const subjectId = await getSubjectId(q.subject || "Geral");
      const topicId = await getTopicId(subjectId, q.topic || "Geral");
      const { data: qrow, error: qErr } = await supabase
        .from("questions")
        .insert({
          user_id: user.id,
          project_id: body.projectId,
          source_id: source.id,
          subject_id: subjectId,
          topic_id: topicId,
          subject_name: q.subject,
          topic_name: q.topic,
          statement: q.statement,
          alt_a: q.alt_a,
          alt_b: q.alt_b,
          alt_c: q.alt_c,
          alt_d: q.alt_d,
          alt_e: q.alt_e,
          correct: q.correct,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })
        .select()
        .single();
      if (qErr) throw qErr;
      // schedule new question for today
      await supabase.from("review_schedule").insert({
        question_id: qrow.id,
        user_id: user.id,
        project_id: body.projectId,
        due_date: new Date().toISOString().slice(0, 10),
        interval_days: 0,
        repetitions: 0,
      });
      created.push(qrow);
    }

    return new Response(JSON.stringify({ ok: true, count: created.length, sourceId: source.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
