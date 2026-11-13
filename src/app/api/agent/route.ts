import { NextResponse } from "next/server";
import { getBrain, mockBrain } from "@/lib/agent/brain";
import { runAgent } from "@/lib/agent/pipeline";
import type { AgentRequest, AgentResponse } from "@/lib/agent/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as AgentRequest;
  const brain = getBrain();
  const events = await runAgent(brain, mockBrain, body);
  const res: AgentResponse = { engine: brain.engine, events };
  return NextResponse.json(res);
}
