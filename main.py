import json
import logging
import os
import re
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from uuid import uuid4
from typing import Any, Literal

from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(_PROJECT_ROOT / ".env")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
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

try:
    from supabase import Client as SupabaseClient, create_client as _create_supabase_client
except Exception:  # pragma: no cover - optional import at runtime
    SupabaseClient = None  # type: ignore[assignment]
    _create_supabase_client = None  # type: ignore[assignment]


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthspan-ai-brain")

_DEBUG_LOG_PATH = _PROJECT_ROOT / ".cursor" / "debug-014a59.log"
ParseSource = Literal["llm", "regex", "fallback"]


def _agent_log(location: str, message: str, data: dict[str, Any], hypothesis_id: str) -> None:
    # #region agent log
    try:
        payload = {
            "sessionId": "014a59",
            "location": location,
            "message": message,
            "data": data,
            "hypothesisId": hypothesis_id,
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
        }
        _DEBUG_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
    # #endregion


SAMPLE_ALEX_LAB_TEXT = (
    "Alex Morgan labs: HbA1c 5.8%, fasting glucose 104 mg/dL, ApoB 112 mg/dL, "
    "LDL-C 142 mg/dL, HDL-C 45 mg/dL, triglycerides 168 mg/dL, hs-CRP 3.2 mg/L, "
    "Vitamin D 22 ng/mL, resting HR 74 bpm, HRV 32 ms, sleep 5.8 hr, VO2 max 32."
)


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
    parse_source: ParseSource = "fallback"
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


def _alex_biomarkers() -> Biomarkers:
    return Biomarkers(
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
    )


def fallback_parse_response() -> ParseResponse:
    return ParseResponse(person_name="Alex Morgan", biomarkers=_alex_biomarkers())


_BIOMARKER_REGEX: list[tuple[str, list[str]]] = [
    ("hba1c", [r"(?:HbA1c|Hemoglobin A1c)[^\d]{0,40}([\d.]+)\s*%?", r"hba1c[:\s]+([\d.]+)\s*%?"]),
    ("fasting_glucose", [r"(?:Fasting Glucose|fasting glucose)[^\d]{0,40}([\d.]+)", r"fasting_glucose[:\s]+([\d.]+)"]),
    ("apob", [r"(?:ApoB|Apolipoprotein B)[^\d]{0,40}([\d.]+)", r"apob[:\s]+([\d.]+)"]),
    ("ldl_c", [r"(?:LDL[- ]C|LDL Cholesterol)[^\d]{0,40}([\d.]+)", r"ldl_c[:\s]+([\d.]+)"]),
    ("hdl_c", [r"(?:HDL[- ]C|HDL Cholesterol)[^\d]{0,40}([\d.]+)", r"hdl_c[:\s]+([\d.]+)"]),
    ("triglycerides", [r"Triglycerides[^\d]{0,40}([\d.]+)", r"triglycerides[:\s]+([\d.]+)"]),
    ("hs_crp", [r"(?:hs-CRP|High-Sensitivity CRP)[^\d]{0,40}([\d.]+)", r"hs_crp[:\s]+([\d.]+)"]),
    ("vitamin_d", [r"(?:Vitamin D|25-Hydroxy Vitamin D)[^\d]{0,40}([\d.]+)", r"vitamin_d[:\s]+([\d.]+)"]),
    ("resting_hr", [r"(?:Resting HR|Resting Heart Rate)[^\d]{0,40}([\d.]+)", r"resting_hr[:\s]+([\d.]+)"]),
    ("hrv", [r"(?:HRV|Heart Rate Variability)[^\d]{0,40}([\d.]+)", r"hrv[:\s]+([\d.]+)"]),
    ("sleep_duration", [r"(?:Sleep Duration|Average Sleep Duration|sleep duration)[^\d]{0,40}([\d.]+)", r"sleep[:\s]+([\d.]+)\s*hr", r"sleep_duration[:\s]+([\d.]+)"]),
    ("vo2_max", [r"(?:VO2 max|VO2 Max)[^\d]{0,40}([\d.]+)", r"vo2_max[:\s]+([\d.]+)"]),
]

_NAME_REGEX = [
    r"(?:Patient|Name):\s*([A-Za-z .'-]+?)(?:\n|Date|Age|Sex|$)",
    r"Patient:\s*([A-Za-z .'-]+)",
    r"^([A-Za-z .'-]+)\s+labs:",
]


def _first_regex_match(text: str, patterns: list[str]) -> float | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                continue
    return None


def regex_parse_labs_text(raw_text: str) -> ParseResponse | None:
    values: dict[str, float] = {}
    for key, patterns in _BIOMARKER_REGEX:
        found = _first_regex_match(raw_text, patterns)
        if found is not None:
            values[key] = found

    required_keys = [key for key, _ in _BIOMARKER_REGEX]
    if len(values) < len(required_keys):
        _agent_log(
            "main.py:regex_parse_labs_text",
            "regex incomplete",
            {"found_count": len(values), "missing": [k for k in required_keys if k not in values]},
            "B",
        )
        return None

    person_name = "Unknown Patient"
    for pattern in _NAME_REGEX:
        match = re.search(pattern, raw_text, flags=re.IGNORECASE)
        if match:
            person_name = match.group(1).strip()
            break

    return ParseResponse(person_name=person_name, biomarkers=Biomarkers.model_validate(values))


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


def parse_labs_text(raw_text: str) -> tuple[ParseResponse, ParseSource]:
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

    # #region agent log
    _agent_log(
        "main.py:parse_labs_text",
        "parse entry",
        {
            "text_len": len(raw_text),
            "text_excerpt": raw_text[:120],
            "has_anthropic_key": bool(os.getenv("ANTHROPIC_API_KEY")),
            "has_openai_key": bool(os.getenv("OPENAI_API_KEY")),
        },
        "C",
    )
    # #endregion

    try:
        raw = call_llm_json(system_prompt, user_prompt)
        result = ParseResponse.model_validate(raw)
        # #region agent log
        _agent_log(
            "main.py:parse_labs_text",
            "parse llm success",
            {
                "parse_source": "llm",
                "person_name": result.person_name,
                "hba1c": result.biomarkers.hba1c,
                "apob": result.biomarkers.apob,
            },
            "B",
        )
        # #endregion
        return result, "llm"
    except Exception as exc:
        logger.exception("Parse endpoint LLM failed; trying regex. Error: %s", exc)
        # #region agent log
        _agent_log(
            "main.py:parse_labs_text",
            "parse llm failed",
            {"error_type": type(exc).__name__, "error": str(exc)[:240]},
            "B",
        )
        # #endregion

    regex_result = regex_parse_labs_text(raw_text)
    if regex_result is not None:
        # #region agent log
        _agent_log(
            "main.py:parse_labs_text",
            "parse regex success",
            {
                "parse_source": "regex",
                "person_name": regex_result.person_name,
                "hba1c": regex_result.biomarkers.hba1c,
                "apob": regex_result.biomarkers.apob,
            },
            "B",
        )
        # #endregion
        return regex_result, "regex"

    fallback = fallback_parse_response()
    # #region agent log
    _agent_log(
        "main.py:parse_labs_text",
        "parse fallback used",
        {
            "parse_source": "fallback",
            "person_name": fallback.person_name,
            "hba1c": fallback.biomarkers.hba1c,
        },
        "B",
    )
    # #endregion
    return fallback, "fallback"


def store_lab_record(record: LabRecord) -> None:
    GLOBAL_LAB_HISTORY.append(record)
    key = record.user_id or "__anonymous__"
    LAB_HISTORY.setdefault(key, []).append(record)


@app.post("/api/parse", response_model=ParseResponse)
def parse_labs(payload: ParseRequest) -> ParseResponse:
    parsed, _parse_source = parse_labs_text(payload.raw_text)
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
    parse_source: ParseSource = "fallback"

    try:
        raw_bytes = await file.read()
        reader = PdfReader(BytesIO(raw_bytes))
        pages = [p.extract_text() or "" for p in reader.pages]
        raw_text = "\n".join(pages).strip()
        if len(raw_text) < 20:
            raise ValueError("PDF text extraction produced too little text.")
    except Exception as exc:
        logger.exception("PDF extraction failed. Error: %s", exc)
        # #region agent log
        _agent_log(
            "main.py:upload_and_parse_labs",
            "pdf extraction failed",
            {"file_name": file_name, "error_type": type(exc).__name__},
            "A",
        )
        # #endregion
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not extract readable text from this PDF. "
                "Export a text-based PDF (not a scanned image) and try again."
            ),
        ) from exc

    parsed, parse_source = parse_labs_text(raw_text)
    used_fallback = parse_source == "fallback"
    # #region agent log
    _agent_log(
        "main.py:upload_and_parse_labs",
        "upload parsed",
        {
            "file_name": file_name,
            "extracted_characters": len(raw_text),
            "parse_source": parse_source,
            "person_name": parsed.person_name,
            "hba1c": parsed.biomarkers.hba1c,
            "apob": parsed.biomarkers.apob,
        },
        "A",
    )
    # #endregion

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
        parse_source=parse_source,
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


# =============================================================================
# Module 3 — Unified server-side scoring (teammate prompt contract)
# =============================================================================
#
# Primary path: LLM generates strict JSON via the MediTwin scoring prompt.
# Fallback path: deterministic engine produces the SAME JSON schema.


DOMAIN_WEIGHTS: dict[str, float] = {
    "metabolic": 0.20,
    "cardio": 0.20,
    "inflammation": 0.15,
    "muscle": 0.15,
    "cognition": 0.15,
    "sleep": 0.15,
}

DomainKey = Literal["metabolic", "cardio", "inflammation", "muscle", "cognition", "sleep"]
StatusLevel = Literal["optimal", "watch", "priority"]

DOMAIN_META: dict[str, tuple[str, str, str]] = {
    "metabolic": ("Metabolic Resilience", "Metabolic", "Activity"),
    "cardio": ("Cardiovascular Longevity", "Cardio", "HeartPulse"),
    "inflammation": ("Inflammation / Immune Aging", "Inflammation", "Flame"),
    "muscle": ("Muscle & Mobility Reserve", "Muscle", "Dumbbell"),
    "cognition": ("Cognitive Resilience", "Cognition", "Brain"),
    "sleep": ("Sleep & Recovery", "Sleep", "Moon"),
}

DOMAIN_FORMULAS: dict[str, str] = {
    "metabolic": "Weighted sum: HbA1c 30%, fasting glucose 20%, triglycerides 20%, exercise 20%, sleep 10%.",
    "cardio": "Weighted sum: ApoB 35%, LDL-C 20%, HDL-C 15%, triglycerides 15%, resting HR 15%.",
    "inflammation": "Weighted sum: hs-CRP 40%, vitamin D 25%, sleep 20%, stress 15%.",
    "muscle": "Weighted sum: exercise 25%, strength training 25%, VO2 max 30%, protein 20%.",
    "cognition": "Weighted sum: sleep 35%, stress 20%, exercise 20%, metabolic score 25%.",
    "sleep": "Weighted sum: sleep duration 40%, HRV 25%, resting HR 20%, stress 15%.",
}

DOMAIN_RECOMMENDATIONS: dict[str, list[str]] = {
    "metabolic": ["Add 30g fiber/day", "Zone 2 cardio 150 min/week", "Reduce ultra-processed carbs"],
    "cardio": ["Discuss ApoB strategy with physician", "Soluble fiber + omega-3", "Zone 2 + strength"],
    "inflammation": ["Correct vitamin D", "Anti-inflammatory diet", "Sleep optimization"],
    "muscle": ["Strength training 3×/week", "Protein 1.6 g/kg", "Mobility daily"],
    "cognition": ["Sleep +45 min", "Aerobic + resistance", "Cognitive load variety"],
    "sleep": ["+45 min sleep", "Wind-down protocol", "Reduce evening alcohol"],
}

SCORE_SYSTEM_PROMPT = """
You are MediTwin's Healthspan Scoring Engine for a hackathon prototype.

Your job: given a user's intake + lab biomarkers, output ONE valid JSON object.

CRITICAL OUTPUT RULES:
1. Output ONLY valid JSON. No markdown, no code fences, no text before or after.
2. Educational directional estimate only — NOT medical advice.
3. All scores are integers 0–100 unless biologicalAgeGap (1 decimal place).
4. Do NOT copy example scores from any sample user. Compute everything ONLY from the input data provided.

CALCULATION ORDER (MANDATORY):
STEP 1 — For each domain, compute each component sub-score (0–100) using band rules.
STEP 2 — Domain score = round(weighted sum of its components).
STEP 3 — overallHealthspanScore = round(0.20×metabolic + 0.20×cardio + 0.15×inflammation + 0.15×muscle + 0.15×cognition + 0.15×sleep)
STEP 4 — biologicalAgeGap = round to 1 decimal: max(0, min(15, (100 - overallHealthspanScore) × 0.15 + lifestyle_penalty))
  lifestyle_penalty: +1.0 if sleepHours < 6; +0.5 if exerciseFreq < 2; +0.5 if stress >= 8; +0.5 if 2+ biomarkers have status "priority"
STEP 5 — bottlenecks = the 3 domains with the LOWEST scores, sorted ascending.

JSON SCHEMA keys:
overallHealthspanScore, biologicalAgeGap, chronologicalAge, domains[], bottlenecks[], biomarkers[], breakdown{overall,weights,domains[]}, summary, disclaimer

Domain status: score >= 75 optimal; 60–74 watch; < 60 priority.
Return valid JSON only.
""".strip()


class ScoreComponent(BaseModel):
    label: str
    raw: str
    score: float
    weight: float


class BreakdownDomain(BaseModel):
    key: str
    label: str
    score: int
    formula: str
    components: list[ScoreComponent]


class ScoreBreakdown(BaseModel):
    overall: int
    weights: dict[str, float]
    domains: list[BreakdownDomain]


class ScoreDomainItem(BaseModel):
    key: DomainKey
    label: str
    short: str
    score: int
    status: StatusLevel
    icon: str
    drivers: list[str]
    recommendations: list[str]


class ScoreBiomarkerItem(BaseModel):
    name: str
    value: float
    unit: str
    optimal: str
    status: StatusLevel
    note: str = ""


class ScoreBottleneckItem(BaseModel):
    key: str
    label: str
    score: int
    drivers: list[str]


class MediTwinScoreResponse(BaseModel):
    overallHealthspanScore: int
    biologicalAgeGap: float
    chronologicalAge: int
    domains: list[ScoreDomainItem]
    bottlenecks: list[ScoreBottleneckItem]
    biomarkers: list[ScoreBiomarkerItem]
    breakdown: ScoreBreakdown
    summary: str
    disclaimer: str = "Educational directional estimate only. Not medical advice."


class ScoreComputeRequest(BaseModel):
    user_id: str | None = None
    intake: IntakeData
    biomarkers: Biomarkers
    interventions: list[str] = Field(default_factory=list)


class ScoreComputeResponse(BaseModel):
    snapshot_id: str
    user_id: str | None = None
    source: Literal["llm", "fallback"]
    score: MediTwinScoreResponse
    created_at: str
    persisted: bool = False


SCORE_HISTORY: dict[str, list[ScoreComputeResponse]] = {}
GLOBAL_SCORE_HISTORY: list[ScoreComputeResponse] = []


def _clamp(n: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, n))


def _band(value: float, best: float, worst: float, direction: Literal["lower", "higher"]) -> float:
    """Piecewise-linear scorer mirroring scoringEngine.ts:band()."""
    if direction == "lower":
        if value <= best:
            return 100.0
        if value >= worst:
            return 0.0
        return _clamp(100.0 * (worst - value) / (worst - best))
    if value >= best:
        return 100.0
    if value <= worst:
        return 0.0
    return _clamp(100.0 * (value - worst) / (best - worst))


def _weighted(components: list[ScoreComponent]) -> int:
    total_weight = sum(c.weight for c in components) or 1.0
    weighted_sum = sum(c.score * c.weight for c in components)
    return round(weighted_sum / total_weight)


def _domain_status(score: int) -> StatusLevel:
    if score >= 75:
        return "optimal"
    if score >= 60:
        return "watch"
    return "priority"


def _biomarker_status(name: str, value: float) -> StatusLevel:
    rules: dict[str, tuple[float, float, Literal["lower", "higher"]]] = {
        "HbA1c": (5.4, 6.0, "lower"),
        "Fasting Glucose": (95, 110, "lower"),
        "ApoB": (80, 100, "lower"),
        "LDL-C": (100, 130, "lower"),
        "HDL-C": (50, 40, "higher"),
        "Triglycerides": (100, 175, "lower"),
        "hs-CRP": (1.0, 3.0, "lower"),
        "Vitamin D": (40, 25, "higher"),
        "Resting HR": (65, 75, "lower"),
        "HRV": (50, 35, "higher"),
        "Sleep Duration": (7.0, 6.0, "higher"),
        "VO2 max": (42, 35, "higher"),
    }
    rule = rules.get(name)
    if rule is None:
        return "watch"
    best, worst, direction = rule
    sub_score = _band(value, best, worst, direction)
    return _domain_status(round(sub_score))


def _build_biomarker_items(biomarkers: Biomarkers, intake: IntakeData) -> list[ScoreBiomarkerItem]:
    specs: list[tuple[str, float, str, str]] = [
        ("HbA1c", biomarkers.hba1c, "%", "< 5.4"),
        ("Fasting Glucose", biomarkers.fasting_glucose, "mg/dL", "70-95"),
        ("ApoB", biomarkers.apob, "mg/dL", "< 80"),
        ("LDL-C", biomarkers.ldl_c, "mg/dL", "< 100"),
        ("HDL-C", biomarkers.hdl_c, "mg/dL", "> 50"),
        ("Triglycerides", biomarkers.triglycerides, "mg/dL", "< 100"),
        ("hs-CRP", biomarkers.hs_crp, "mg/L", "< 1.0"),
        ("Vitamin D", biomarkers.vitamin_d, "ng/mL", "40-60"),
        ("Resting HR", biomarkers.resting_hr, "bpm", "55-65"),
        ("HRV", biomarkers.hrv, "ms", "> 50"),
        ("Sleep Duration", intake.sleep_hours, "hr/night", "7-8.5"),
        ("VO2 max", biomarkers.vo2_max, "ml/kg/min", "> 42"),
    ]
    items: list[ScoreBiomarkerItem] = []
    for name, value, unit, optimal in specs:
        status = _biomarker_status(name, value)
        note = ""
        if status == "priority":
            note = "Above demo target — worth discussing with a clinician."
        elif status == "watch":
            note = "Directional signal to monitor over time."
        items.append(
            ScoreBiomarkerItem(
                name=name,
                value=value,
                unit=unit,
                optimal=optimal,
                status=status,
                note=note,
            )
        )
    return items


def _compute_breakdown_domains(
    intake: IntakeData,
    biomarkers: Biomarkers,
    interventions: list[str],
) -> list[BreakdownDomain]:
    sleep = intake.sleep_hours
    exercise = intake.exercise_freq
    stress = intake.stress
    strength_on = "strength" in interventions
    protein_on = "protein" in interventions

    sleep_score = _clamp(100 - abs(sleep - 7.75) * 25)
    stress_score = _clamp(100 - stress * 10)
    exercise_score = _clamp((exercise / 5.0) * 100)

    component_groups: dict[str, list[ScoreComponent]] = {
        "metabolic": [
            ScoreComponent(label="HbA1c", raw=f"{biomarkers.hba1c} %", score=_band(biomarkers.hba1c, 5.2, 6.5, "lower"), weight=0.30),
            ScoreComponent(label="Fasting Glucose", raw=f"{biomarkers.fasting_glucose} mg/dL", score=_band(biomarkers.fasting_glucose, 85, 125, "lower"), weight=0.20),
            ScoreComponent(label="Triglycerides", raw=f"{biomarkers.triglycerides} mg/dL", score=_band(biomarkers.triglycerides, 80, 200, "lower"), weight=0.20),
            ScoreComponent(label="Exercise", raw=f"{exercise} d/wk", score=exercise_score, weight=0.20),
            ScoreComponent(label="Sleep", raw=f"{sleep} h", score=sleep_score, weight=0.10),
        ],
        "cardio": [
            ScoreComponent(label="ApoB", raw=f"{biomarkers.apob} mg/dL", score=_band(biomarkers.apob, 70, 130, "lower"), weight=0.35),
            ScoreComponent(label="LDL-C", raw=f"{biomarkers.ldl_c} mg/dL", score=_band(biomarkers.ldl_c, 90, 160, "lower"), weight=0.20),
            ScoreComponent(label="HDL-C", raw=f"{biomarkers.hdl_c} mg/dL", score=_band(biomarkers.hdl_c, 60, 35, "higher"), weight=0.15),
            ScoreComponent(label="Triglycerides", raw=f"{biomarkers.triglycerides} mg/dL", score=_band(biomarkers.triglycerides, 80, 200, "lower"), weight=0.15),
            ScoreComponent(label="Resting HR", raw=f"{biomarkers.resting_hr} bpm", score=_band(biomarkers.resting_hr, 58, 85, "lower"), weight=0.15),
        ],
        "inflammation": [
            ScoreComponent(label="hs-CRP", raw=f"{biomarkers.hs_crp} mg/L", score=_band(biomarkers.hs_crp, 0.5, 4.0, "lower"), weight=0.40),
            ScoreComponent(label="Vitamin D", raw=f"{biomarkers.vitamin_d} ng/mL", score=_band(biomarkers.vitamin_d, 50, 20, "higher"), weight=0.25),
            ScoreComponent(label="Sleep", raw=f"{sleep} h", score=sleep_score, weight=0.20),
            ScoreComponent(label="Stress", raw=f"{stress}/10", score=stress_score, weight=0.15),
        ],
        "muscle": [
            ScoreComponent(label="Exercise", raw=f"{exercise} d/wk", score=exercise_score, weight=0.25),
            ScoreComponent(label="Strength training", raw="On" if strength_on else "Off", score=100 if strength_on else 30, weight=0.25),
            ScoreComponent(label="VO2 max", raw=f"{biomarkers.vo2_max} ml/kg/min", score=_band(biomarkers.vo2_max, 45, 25, "higher"), weight=0.30),
            ScoreComponent(label="Protein optimization", raw="On" if protein_on else "Off", score=100 if protein_on else 40, weight=0.20),
        ],
    }

    metabolic_score = _weighted(component_groups["metabolic"])
    component_groups["cognition"] = [
        ScoreComponent(label="Sleep", raw=f"{sleep} h", score=sleep_score, weight=0.35),
        ScoreComponent(label="Stress", raw=f"{stress}/10", score=stress_score, weight=0.20),
        ScoreComponent(label="Exercise", raw=f"{exercise} d/wk", score=exercise_score, weight=0.20),
        ScoreComponent(label="Metabolic score", raw=str(metabolic_score), score=metabolic_score, weight=0.25),
    ]
    component_groups["sleep"] = [
        ScoreComponent(label="Sleep duration", raw=f"{sleep} h", score=sleep_score, weight=0.40),
        ScoreComponent(label="HRV", raw=f"{biomarkers.hrv} ms", score=_band(biomarkers.hrv, 60, 20, "higher"), weight=0.25),
        ScoreComponent(label="Resting HR", raw=f"{biomarkers.resting_hr} bpm", score=_band(biomarkers.resting_hr, 58, 85, "lower"), weight=0.20),
        ScoreComponent(label="Stress", raw=f"{stress}/10", score=stress_score, weight=0.15),
    ]

    breakdown_domains: list[BreakdownDomain] = []
    for key in ("metabolic", "cardio", "inflammation", "muscle", "cognition", "sleep"):
        label, _, _ = DOMAIN_META[key]
        components = component_groups[key]
        breakdown_domains.append(
            BreakdownDomain(
                key=key,
                label=label,
                score=_weighted(components),
                formula=DOMAIN_FORMULAS[key],
                components=components,
            )
        )
    return breakdown_domains


def _drivers_from_components(components: list[ScoreComponent], limit: int = 3) -> list[str]:
    weakest = sorted(components, key=lambda c: c.score)[:limit]
    return [f"{c.label}: {c.raw}" for c in weakest]


def _estimate_biological_age_gap(
    overall_score: int,
    intake: IntakeData,
    biomarker_items: list[ScoreBiomarkerItem],
) -> float:
    lifestyle_penalty = 0.0
    if intake.sleep_hours < 6:
        lifestyle_penalty += 1.0
    if intake.exercise_freq < 2:
        lifestyle_penalty += 0.5
    if intake.stress >= 8:
        lifestyle_penalty += 0.5
    priority_count = sum(1 for b in biomarker_items if b.status == "priority")
    if priority_count >= 2:
        lifestyle_penalty += 0.5

    gap = (100 - overall_score) * 0.15 + lifestyle_penalty
    return round(_clamp(gap, 0, 15), 1)


def build_score_response_fallback(
    intake: IntakeData,
    biomarkers: Biomarkers,
    interventions: list[str],
) -> MediTwinScoreResponse:
    breakdown_domains = _compute_breakdown_domains(intake, biomarkers, interventions)
    overall = round(sum(d.score * DOMAIN_WEIGHTS[d.key] for d in breakdown_domains))
    biomarker_items = _build_biomarker_items(biomarkers, intake)

    domain_items: list[ScoreDomainItem] = []
    for bd in breakdown_domains:
        label, short, icon = DOMAIN_META[bd.key]
        domain_items.append(
            ScoreDomainItem(
                key=bd.key,  # type: ignore[arg-type]
                label=label,
                short=short,
                score=bd.score,
                status=_domain_status(bd.score),
                icon=icon,
                drivers=_drivers_from_components(bd.components),
                recommendations=DOMAIN_RECOMMENDATIONS[bd.key][:3],
            )
        )

    sorted_domains = sorted(domain_items, key=lambda d: d.score)
    bottlenecks = [
        ScoreBottleneckItem(
            key=d.key,
            label=d.label,
            score=d.score,
            drivers=d.drivers[:2],
        )
        for d in sorted_domains[:3]
    ]

    top_names = ", ".join(b.label for b in bottlenecks)
    summary = (
        f"Directional healthspan readiness is {overall}/100 for age {intake.age}. "
        f"Top opportunities to support first: {top_names}."
    )

    return MediTwinScoreResponse(
        overallHealthspanScore=overall,
        biologicalAgeGap=_estimate_biological_age_gap(overall, intake, biomarker_items),
        chronologicalAge=intake.age,
        domains=domain_items,
        bottlenecks=bottlenecks,
        biomarkers=biomarker_items,
        breakdown=ScoreBreakdown(
            overall=overall,
            weights=DOMAIN_WEIGHTS,
            domains=breakdown_domains,
        ),
        summary=summary,
    )


def _score_user_prompt(payload: ScoreComputeRequest) -> str:
    return json.dumps(
        {
            "intake": payload.intake.model_dump(),
            "biomarkers": payload.biomarkers.model_dump(),
            "interventions": payload.interventions,
            "instructions": (
                "Return ONE JSON object matching the MediTwin score schema. "
                "Use the band rules and domain weights from the system prompt. "
                "chronologicalAge must equal intake.age."
            ),
        },
        indent=2,
    )


def generate_score_llm(payload: ScoreComputeRequest) -> MediTwinScoreResponse:
    raw = call_llm_json(SCORE_SYSTEM_PROMPT, _score_user_prompt(payload))
    score = MediTwinScoreResponse.model_validate(raw)
    score.chronologicalAge = payload.intake.age
    return score


_supabase_client_cache: SupabaseClient | None = None  # type: ignore[valid-type]


def _supabase_admin_client() -> SupabaseClient | None:  # type: ignore[valid-type]
    global _supabase_client_cache
    if _supabase_client_cache is not None:
        return _supabase_client_cache
    if _create_supabase_client is None:
        return None
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None
    _supabase_client_cache = _create_supabase_client(url, key)
    return _supabase_client_cache


def _snapshot_row_to_response(row: dict[str, Any]) -> ScoreComputeResponse:
    if row.get("score_payload"):
        score = MediTwinScoreResponse.model_validate(row["score_payload"])
    else:
        score = build_score_response_fallback(
            IntakeData.model_validate(row.get("intake") or {}),
            Biomarkers.model_validate(row.get("biomarkers") or fallback_parse_response().biomarkers.model_dump()),
            list(row.get("interventions") or []),
        )
    return ScoreComputeResponse(
        snapshot_id=row.get("snapshot_id") or f"snap_{row.get('id', uuid4().hex[:12])}",
        user_id=row.get("user_id"),
        source=row.get("source") or "fallback",
        score=score,
        created_at=str(row.get("created_at") or datetime.now(timezone.utc).isoformat()),
        persisted=True,
    )


def _persist_score_response(response: ScoreComputeResponse, payload: ScoreComputeRequest) -> bool:
    client = _supabase_admin_client()
    if client is None or not response.user_id:
        return False
    try:
        client.table("score_snapshots").insert(
            {
                "snapshot_id": response.snapshot_id,
                "user_id": response.user_id,
                "overall_score": response.score.overallHealthspanScore,
                "bio_age_gap": response.score.biologicalAgeGap,
                "domain_scores": {d.key: d.score for d in response.score.domains},
                "bottlenecks": [b.model_dump() for b in response.score.bottlenecks],
                "interventions": payload.interventions,
                "intake": payload.intake.model_dump(),
                "biomarkers": payload.biomarkers.model_dump(),
                "score_payload": response.score.model_dump(),
                "source": response.source,
            }
        ).execute()
        return True
    except Exception as exc:
        logger.warning("Supabase score snapshot insert failed; falling back to memory. Error: %s", exc)
        return False


def _store_score_in_memory(response: ScoreComputeResponse) -> None:
    GLOBAL_SCORE_HISTORY.append(response)
    key = response.user_id or "__anonymous__"
    SCORE_HISTORY.setdefault(key, []).append(response)


@app.post("/score/compute", response_model=ScoreComputeResponse)
def score_compute(payload: ScoreComputeRequest) -> ScoreComputeResponse:
    source: Literal["llm", "fallback"] = "fallback"
    try:
        score = generate_score_llm(payload)
        source = "llm"
    except Exception as exc:
        logger.exception("LLM score generation failed; serving fallback. Error: %s", exc)
        score = build_score_response_fallback(payload.intake, payload.biomarkers, payload.interventions)

    response = ScoreComputeResponse(
        snapshot_id=f"snap_{uuid4().hex[:12]}",
        user_id=payload.user_id,
        source=source,
        score=score,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    response.persisted = _persist_score_response(response, payload)
    if not response.persisted:
        _store_score_in_memory(response)
    return response


@app.get("/score/latest", response_model=ScoreComputeResponse | None)
def score_latest(user_id: str | None = None) -> ScoreComputeResponse | None:
    client = _supabase_admin_client()
    if client is not None and user_id:
        try:
            result = (
                client.table("score_snapshots")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            rows = result.data or []
            if rows:
                return _snapshot_row_to_response(rows[0])
        except Exception as exc:
            logger.warning("Supabase /score/latest read failed; falling back to memory. Error: %s", exc)

    key = user_id or "__anonymous__"
    records = SCORE_HISTORY.get(key) or []
    if records:
        return records[-1]
    if user_id is None and GLOBAL_SCORE_HISTORY:
        return GLOBAL_SCORE_HISTORY[-1]
    return None


@app.get("/score/history", response_model=list[ScoreComputeResponse])
def score_history(user_id: str | None = None, limit: int = 50) -> list[ScoreComputeResponse]:
    safe_limit = max(1, min(limit, 500))

    client = _supabase_admin_client()
    if client is not None and user_id:
        try:
            result = (
                client.table("score_snapshots")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=False)
                .limit(safe_limit)
                .execute()
            )
            rows = result.data or []
            if rows:
                return [_snapshot_row_to_response(r) for r in rows]
        except Exception as exc:
            logger.warning("Supabase /score/history read failed; falling back to memory. Error: %s", exc)

    if user_id is None:
        return GLOBAL_SCORE_HISTORY[-safe_limit:]
    return SCORE_HISTORY.get(user_id, [])[-safe_limit:]

