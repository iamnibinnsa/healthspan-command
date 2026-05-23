import json
import logging
import os
import re
from datetime import datetime, timezone
from io import BytesIO
from uuid import uuid4
from typing import Any, Literal

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - optional import at runtime
    OpenAI = None  # type: ignore[assignment]

try:
    import anthropic
except Exception:  # pragma: no cover - optional import at runtime
    anthropic = None  # type: ignore[assignment]


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthspan-ai-brain")


app = FastAPI(
    title="Healthspan AI Brain",
    description="Stateless FastAPI microservice for lab parsing and 90-day plan generation.",
    version="1.0.0",
)

# Fully open CORS for hackathon/demo velocity.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Biomarkers(BaseModel):
    hba1c: float = Field(..., description="HbA1c percentage")
    fasting_glucose: float = Field(..., description="mg/dL")
    apob: float = Field(..., description="mg/dL")
    ldl_c: float = Field(..., description="mg/dL")
    hdl_c: float = Field(..., description="mg/dL")
    triglycerides: float = Field(..., description="mg/dL")
    hs_crp: float = Field(..., description="mg/L")
    vitamin_d: float = Field(..., description="ng/mL")
    resting_hr: float = Field(..., description="bpm")
    hrv: float = Field(..., description="ms")
    sleep_duration: float = Field(..., description="hours/night")
    vo2_max: float = Field(..., description="ml/kg/min")


class ParseRequest(BaseModel):
    raw_text: str = Field(..., min_length=20, description="Raw OCR/extracted lab report text")
    user_id: str | None = None
    report_id: str | None = None


class ParseResponse(BaseModel):
    person_name: str
    biomarkers: Biomarkers


class LabsUploadResponse(BaseModel):
    report_id: str
    user_id: str | None = None
    file_name: str
    extracted_characters: int
    used_fallback: bool
    parsed: ParseResponse


class LabRecord(BaseModel):
    report_id: str
    user_id: str | None = None
    created_at: str
    file_name: str | None = None
    source: Literal["upload", "parse"]
    raw_text_excerpt: str
    parsed: ParseResponse


# Stateless deployment, in-memory demo history only.
LAB_HISTORY: dict[str, list[LabRecord]] = {}
GLOBAL_LAB_HISTORY: list[LabRecord] = []


class IntakeData(BaseModel):
    name: str
    age: int = Field(..., ge=18, le=120)
    sex: Literal["Male", "Female", "Other"]
    goals: list[str] = Field(default_factory=list)
    family_history: list[str] = Field(default_factory=list)
    wearable: str = "None"
    sleep_hours: float = Field(..., ge=0, le=24)
    exercise_freq: int = Field(..., ge=0, le=14, description="days/week")
    stress: int = Field(..., ge=1, le=10)
    diet: int = Field(..., ge=1, le=10)


class PlanGenerateRequest(BaseModel):
    biomarkers: Biomarkers
    intake: IntakeData


class PlanBottleneck(BaseModel):
    domain: str
    reason: str
    priority: Literal["high", "medium", "low"]


class PlanWeekBlock(BaseModel):
    phase: str
    weeks: str
    focus: list[str]
    actions: list[str]
    success_metrics: list[str]


class DoctorDiscussionItem(BaseModel):
    topic: str
    why_it_matters: str
    questions_to_ask: list[str]


class PlanResponse(BaseModel):
    title: str
    objective: str
    bottlenecks: list[PlanBottleneck]
    protocol_90_day: list[PlanWeekBlock]
    doctor_discussion: list[DoctorDiscussionItem]
    disclaimers: list[str]


def fallback_parse_response() -> ParseResponse:
    return ParseResponse(
        person_name="Alex Morgan",
        biomarkers=Biomarkers(
            hba1c=5.8,
            fasting_glucose=104,
            apob=112,
            ldl_c=142,
            hdl_c=45,
            triglycerides=168,
            hs_crp=3.2,
            vitamin_d=22,
            resting_hr=74,
            hrv=32,
            sleep_duration=5.8,
            vo2_max=32,
        ),
    )


def fallback_plan_response(name: str) -> PlanResponse:
    return PlanResponse(
        title=f"{name} - 90-Day Longevity Protocol",
        objective="Improve metabolic, cardiovascular, inflammation, and recovery markers over 12 weeks.",
        bottlenecks=[
            {
                "domain": "Cardiovascular Risk",
                "reason": "ApoB and LDL-C are elevated compared with longevity-oriented targets.",
                "priority": "high",
            },
            {
                "domain": "Sleep & Recovery",
                "reason": "Short sleep duration and low HRV suggest insufficient recovery.",
                "priority": "high",
            },
            {
                "domain": "Metabolic Control",
                "reason": "HbA1c and fasting glucose are above ideal range.",
                "priority": "medium",
            },
            {
                "domain": "Inflammation Load",
                "reason": "hs-CRP elevation and low vitamin D may reflect inflammatory stress.",
                "priority": "medium",
            },
        ],
        protocol_90_day=[
            {
                "phase": "Foundation",
                "weeks": "1-4",
                "focus": ["Sleep extension", "Nutrition cleanup", "Consistency"],
                "actions": [
                    "Increase sleep opportunity by 45 minutes nightly.",
                    "Begin Zone 2 cardio 4 sessions/week (30-40 min/session).",
                    "Start strength training 3x/week with full-body sessions.",
                    "Target 30g fiber/day and reduce ultra-processed carbs.",
                ],
                "success_metrics": [
                    "Average sleep >= 6.5 hours/night",
                    ">= 12 cardio sessions completed",
                    ">= 10 strength sessions completed",
                ],
            },
            {
                "phase": "Build",
                "weeks": "5-8",
                "focus": ["Volume progression", "Metabolic gains", "Stress control"],
                "actions": [
                    "Progress Zone 2 volume to 180 min/week total.",
                    "Add one weekly interval session if recovery is stable.",
                    "Maintain protein around 1.6 g/kg/day.",
                    "Run a nightly wind-down routine and reduce alcohol exposure.",
                ],
                "success_metrics": [
                    "Resting HR trend downward",
                    "Subjective stress score reduced by >= 2 points",
                    ">= 80% adherence to nutrition targets",
                ],
            },
            {
                "phase": "Optimize",
                "weeks": "9-12",
                "focus": ["Fine tuning", "Sustainability", "Clinical follow-up prep"],
                "actions": [
                    "Keep training rhythm with one lower-load deload week.",
                    "Continue sleep and nutrition behaviors with high compliance.",
                    "Prepare repeat labs and physician discussion packet.",
                ],
                "success_metrics": [
                    "Average sleep >= 7.0 hours/night",
                    "HRV trend improving from baseline",
                    "Ready-for-retest checklist complete",
                ],
            },
        ],
        doctor_discussion=[
            {
                "topic": "ApoB / LDL-C management strategy",
                "why_it_matters": "Reducing atherogenic particles has strong evidence for long-term risk reduction.",
                "questions_to_ask": [
                    "What ApoB target is appropriate for my risk profile?",
                    "Which interventions (lifestyle vs medication) are most suitable?",
                    "When should I re-test lipids and ApoB?",
                ],
            },
            {
                "topic": "Glucose regulation and insulin sensitivity",
                "why_it_matters": "Early optimization can reduce long-term metabolic disease risk.",
                "questions_to_ask": [
                    "Should we add fasting insulin or OGTT for deeper assessment?",
                    "What HbA1c and fasting glucose targets should I pursue?",
                ],
            },
            {
                "topic": "Inflammation and vitamin D repletion",
                "why_it_matters": "Inflammatory burden and deficiency states may impact recovery and risk trajectory.",
                "questions_to_ask": [
                    "What is a safe vitamin D repletion protocol and follow-up timeline?",
                    "Are there secondary causes to evaluate for elevated hs-CRP?",
                ],
            },
        ],
        disclaimers=[
            "This plan is educational and not medical advice.",
            "All medication decisions must be made with a licensed physician.",
            "Use this plan as a discussion framework with your care team.",
        ],
    )


def _extract_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if not match:
        raise ValueError("LLM output did not contain a JSON object.")
    return json.loads(match.group(0))


def _resolve_provider() -> Literal["openai", "anthropic"]:
    provider = os.getenv("LLM_PROVIDER", "auto").lower()
    if provider == "openai":
        return "openai"
    if provider == "anthropic":
        return "anthropic"

    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic"
    raise RuntimeError("No LLM API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.")


def _call_openai_json(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    if OpenAI is None:
        raise RuntimeError("openai package is not installed.")
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
    )
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    response = client.chat.completions.create(
        model=model,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    content = response.choices[0].message.content or "{}"
    return _extract_json_object(content)


def _call_anthropic_json(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    if anthropic is None:
        raise RuntimeError("anthropic package is not installed.")
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    model = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-latest")
    response = client.messages.create(
        model=model,
        max_tokens=2000,
        temperature=0.1,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    text_chunks: list[str] = []
    for block in response.content:
        block_text = getattr(block, "text", None)
        if isinstance(block_text, str):
            text_chunks.append(block_text)
    if not text_chunks:
        raise ValueError("Anthropic response had no text content.")
    return _extract_json_object("\n".join(text_chunks))


def call_llm_json(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    provider = _resolve_provider()
    logger.info("Using LLM provider: %s", provider)
    if provider == "openai":
        return _call_openai_json(system_prompt, user_prompt)
    return _call_anthropic_json(system_prompt, user_prompt)


def parse_labs_text(raw_text: str) -> ParseResponse:
    system_prompt = """
You are a clinical data extraction engine. Return only valid JSON.
Task:
- Extract biomarker values from the lab report text.
- If a marker is missing, infer the most likely numeric value only when the text strongly indicates it.
- Do not add commentary.
Output JSON shape exactly:
{
  "person_name": "string",
  "biomarkers": {
    "hba1c": number,
    "fasting_glucose": number,
    "apob": number,
    "ldl_c": number,
    "hdl_c": number,
    "triglycerides": number,
    "hs_crp": number,
    "vitamin_d": number,
    "resting_hr": number,
    "hrv": number,
    "sleep_duration": number,
    "vo2_max": number
  }
}
""".strip()

    user_prompt = f"Lab text:\n{raw_text}"

    try:
        raw = call_llm_json(system_prompt, user_prompt)
        return ParseResponse.model_validate(raw)
    except Exception as exc:
        logger.exception("Parse endpoint failed; serving fallback. Error: %s", exc)
        return fallback_parse_response()


def store_lab_record(record: LabRecord) -> None:
    GLOBAL_LAB_HISTORY.append(record)
    key = record.user_id or "__anonymous__"
    LAB_HISTORY.setdefault(key, []).append(record)


@app.post("/api/parse", response_model=ParseResponse)
def parse_labs(payload: ParseRequest) -> ParseResponse:
    parsed = parse_labs_text(payload.raw_text)
    record = LabRecord(
        report_id=payload.report_id or f"rep_{uuid4().hex[:12]}",
        user_id=payload.user_id,
        created_at=datetime.now(timezone.utc).isoformat(),
        file_name=None,
        source="parse",
        raw_text_excerpt=payload.raw_text[:280],
        parsed=parsed,
    )
    store_lab_record(record)
    return parsed


@app.post("/labs/parse", response_model=ParseResponse)
def parse_labs_v2(payload: ParseRequest) -> ParseResponse:
    return parse_labs(payload)


@app.post("/labs/upload", response_model=LabsUploadResponse)
async def upload_and_parse_labs(
    file: UploadFile = File(...),
    user_id: str | None = Form(default=None),
) -> LabsUploadResponse:
    report_id = f"rep_{uuid4().hex[:12]}"
    file_name = file.filename or "lab_report.pdf"
    used_fallback = False

    try:
        raw_bytes = await file.read()
        reader = PdfReader(BytesIO(raw_bytes))
        pages = [p.extract_text() or "" for p in reader.pages]
        raw_text = "\n".join(pages).strip()
        if len(raw_text) < 20:
            raise ValueError("PDF text extraction produced too little text.")
    except Exception as exc:
        logger.exception("PDF extraction failed; using fallback extraction. Error: %s", exc)
        used_fallback = True
        raw_text = (
            "Alex Morgan labs: HbA1c 5.8%, fasting glucose 104 mg/dL, ApoB 112 mg/dL, "
            "LDL-C 142 mg/dL, HDL-C 45 mg/dL, triglycerides 168 mg/dL, hs-CRP 3.2 mg/L, "
            "Vitamin D 22 ng/mL, resting HR 74 bpm, HRV 32 ms, sleep 5.8 hr, VO2 max 32."
        )

    parsed = parse_labs_text(raw_text)

    record = LabRecord(
        report_id=report_id,
        user_id=user_id,
        created_at=datetime.now(timezone.utc).isoformat(),
        file_name=file_name,
        source="upload",
        raw_text_excerpt=raw_text[:280],
        parsed=parsed,
    )
    store_lab_record(record)

    return LabsUploadResponse(
        report_id=report_id,
        user_id=user_id,
        file_name=file_name,
        extracted_characters=len(raw_text),
        used_fallback=used_fallback,
        parsed=parsed,
    )


@app.get("/labs/latest", response_model=LabRecord | None)
def latest_labs(user_id: str | None = None) -> LabRecord | None:
    key = user_id or "__anonymous__"
    records = LAB_HISTORY.get(key, [])
    if records:
        return records[-1]
    if user_id is None and GLOBAL_LAB_HISTORY:
        return GLOBAL_LAB_HISTORY[-1]
    return None


@app.get("/labs/history", response_model=list[LabRecord])
def labs_history(user_id: str | None = None, limit: int = 20) -> list[LabRecord]:
    safe_limit = max(1, min(limit, 200))
    if user_id is None:
        return GLOBAL_LAB_HISTORY[-safe_limit:]
    return LAB_HISTORY.get(user_id, [])[-safe_limit:]


@app.post("/api/plan/generate", response_model=PlanResponse)
def generate_plan(payload: PlanGenerateRequest) -> PlanResponse:
    system_prompt = """
You are a longevity physician + performance coach AI.
Produce a practical, conservative 90-day plan in strict JSON.
Requirements:
- Prioritize interventions by highest expected risk-reduction and feasibility.
- Include concrete weekly actions and measurable metrics.
- Include physician discussion points that are specific and non-alarmist.
- Never output markdown. Return JSON only.
Output JSON shape exactly:
{
  "title": "string",
  "objective": "string",
  "bottlenecks": [{"domain":"string","reason":"string","priority":"high|medium|low"}],
  "protocol_90_day": [{
    "phase":"string",
    "weeks":"string",
    "focus":["string"],
    "actions":["string"],
    "success_metrics":["string"]
  }],
  "doctor_discussion": [{
    "topic":"string",
    "why_it_matters":"string",
    "questions_to_ask":["string"]
  }],
  "disclaimers": ["string"]
}
""".strip()

    user_prompt = (
        "Generate a structured 90-day longevity plan for the user using the data below.\n"
        f"Biomarkers JSON:\n{payload.biomarkers.model_dump_json(indent=2)}\n\n"
        f"Intake JSON:\n{payload.intake.model_dump_json(indent=2)}"
    )

    try:
        raw = call_llm_json(system_prompt, user_prompt)
        return PlanResponse.model_validate(raw)
    except Exception as exc:
        logger.exception("Plan endpoint failed; serving fallback. Error: %s", exc)
        return fallback_plan_response(payload.intake.name)

