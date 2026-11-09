import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { TRIAGE_SYSTEM_PROMPT } from "./prompt";
import { aiReplySchema, type AiReply, type ChatMessage } from "./types";

let client: Anthropic | undefined;

/**
 * One turn of the intake conversation. Throws on any failure, and the route then
 * shows the phone number. Nothing here logs what the patient wrote.
 */
export async function askClaude(messages: ChatMessage[]): Promise<AiReply> {
  client ??= new Anthropic({ timeout: 25_000, maxRetries: 1 });

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // If a safety filter wrongly declines a medical message, retry on another model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: TRIAGE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages,
    output_config: { effort: "medium", format: zodOutputFormat(aiReplySchema) },
  });

  if (response.stop_reason === "refusal") throw new Error("AI declined the request");
  if (!response.parsed_output) throw new Error("AI reply did not match the schema");
  return response.parsed_output;
}
