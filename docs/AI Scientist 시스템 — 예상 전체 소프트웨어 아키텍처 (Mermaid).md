# AI Scientist 시스템 — 예상 전체 소프트웨어 아키텍처 (Mermaid)

조사한 결과(Kosmos 논문 및 오픈소스 구현, Sakana AI Scientist, Google AI Co-Scientist, Stanford Virtual Lab)를 바탕으로 작성한 **예상(추정) 소프트웨어 아키텍처**입니다. 통신 프로토콜을 화살표 라벨에 표기했습니다.

> 참고: 이들은 본질적으로 **LLM 에이전트 시스템**이므로, 전통적인 "프론트엔드-백엔드-DB" 3계층 외에 **에이전트 오케스트레이션 계층**과 **외부 LLM/도구 계층**이 핵심을 이룹니다. 시스템에 따라 프론트엔드나 DB가 없을 수도 있습니다(예: Sakana는 연구용 CLI/배치 위주, DB가 필수 아님).

---

## 1. 대표 사례: Kosmos (Edison Scientific) 상세 아키텍처

가장 완성도 높은 제품형 시스템이므로 프론트엔드·백엔드·DB·샌드박스를 모두 포함합니다.

```mermaid
flowchart TB
    subgraph CLIENT["FRONTEND (Client Layer)"]
        UI["Web App / Dashboard<br/>(React 등 SPA)"]
        SSE["실시간 진행상황 스트리밍 뷰<br/>(연구 사이클/로그)"]
    end

    subgraph EDGE["API / BACKEND Layer"]
        GW["API Gateway / Auth<br/>(REST, JWT/OAuth2)"]
        APP["Application Server<br/>(연구 작업 생성·관리)"]
        QUEUE["Task Queue / Job Orchestrator<br/>(비동기 작업 디스패치)"]
    end

    subgraph ORCH["AGENT ORCHESTRATION Layer (핵심)"]
        DIRECTOR["Research Director<br/>(마스터 오케스트레이터)"]
        WM[("WORLD MODEL<br/>구조화된 공유 메모리<br/>(상태/가설/발견 통합)")]
        PLAN["Plan Creator / Reviewer<br/>(다음 사이클 작업 제안)"]

        subgraph WORKERS["병렬 Worker Agents (사이클당 ~10개)"]
            LIT["Literature Search Agent"]
            DATA["Data Analysis Agent"]
            HYPO["Hypothesis Generator"]
            EXP["Experiment Designer"]
        end
    end

    subgraph EXECENV["Sandboxed Execution Layer"]
        SBX["Docker Sandbox<br/>(Python/R 코드 실행)<br/>network=none, 자원제한"]
    end

    subgraph DATASTORE["DATA / STORAGE Layer"]
        SQLDB[("관계형 DB<br/>(PostgreSQL)<br/>작업·사용자·메타데이터")]
        GRAPH[("Knowledge Graph<br/>(Neo4j)<br/>개념 관계")]
        VEC[("Vector Store<br/>(임베딩/검색)")]
        BLOB[("Object Storage<br/>(코드·그림·리포트 아티팩트)")]
        CACHE[("Redis<br/>(캐시/세션)")]
    end

    subgraph EXTERNAL["EXTERNAL Services"]
        LLM["Frontier LLM API<br/>(Claude / GPT / Gemini)"]
        SCHOLAR["문헌 API<br/>(Semantic Scholar / arXiv / PubMed)"]
    end

    UI -- "HTTPS / REST (JSON)" --> GW
    GW -- "Server-Sent Events (SSE) / WebSocket" --> SSE
    GW -- "내부 호출" --> APP
    APP -- "Enqueue job (AMQP/내부 RPC)" --> QUEUE

    QUEUE -- "작업 디스패치" --> DIRECTOR

    DIRECTOR -- "작업 분배" --> PLAN
    PLAN -- "사이클 작업 생성" --> WORKERS
    LIT -- "결과 통합" --> WM
    DATA -- "결과 통합" --> WM
    HYPO -- "결과 통합" --> WM
    EXP -- "결과 통합" --> WM
    WM -- "다음 사이클 목표 제안" --> DIRECTOR

    DATA -- "코드 실행 요청" --> SBX
    SBX -- "실행 결과 반환" --> DATA
    LIT -- "HTTPS / REST" --> SCHOLAR
    LIT -- "HTTPS API call (JSON)" --> LLM
    DATA -- "HTTPS API call (JSON)" --> LLM
    HYPO -- "HTTPS API call (JSON)" --> LLM
    EXP -- "HTTPS API call (JSON)" --> LLM

    WM -- "상태 영속화 (SQL)" --> SQLDB
    WM -- "관계 저장 (Bolt protocol)" --> GRAPH
    WM -- "유사도 검색" --> VEC
    DIRECTOR -- "아티팩트 저장 (S3 API)" --> BLOB
    APP -- "조회/저장" --> SQLDB
    APP -- "캐시 (RESP)" --> CACHE

    BLOB -- "최종 리포트 제공" --> APP
```

---

## 2. 일반화 아키텍처 (4개 시스템 공통 패턴)

오케스트레이터의 이름만 다를 뿐(Kosmos: Research Director/World Model, Sakana: Experiment Manager, Google: Supervisor, Stanford: AI PI) 구조는 거의 동일합니다.

```mermaid
flowchart TB
    subgraph FE["FRONTEND (선택적)"]
        U["사용자 / 연구자"]
        WEBUI["Web UI / Chat / CLI"]
    end

    subgraph BE["BACKEND / API Layer"]
        API["API Server + Auth<br/>(REST over HTTPS)"]
        ORCHESTRATOR["Orchestrator Agent<br/>Kosmos: Research Director · World Model<br/>Sakana: Experiment Manager<br/>Google: Supervisor<br/>Stanford: AI PI"]
    end

    subgraph AGENTS["MULTI-AGENT Layer (LLM Agents)"]
        A1["생성 에이전트<br/>(가설/아이디어 생성)"]
        A2["분석/실험 에이전트<br/>(데이터·코드 실행)"]
        A3["문헌 에이전트<br/>(literature search)"]
        A4["비평/리뷰 에이전트<br/>(Critic / Reviewer)"]
        MEM[("공유 메모리/상태<br/>World Model · Tree Search Nodes<br/>· Tournament(Elo) · 회의 Transcript")]
    end

    subgraph TOOLS["TOOL & EXECUTION Layer"]
        CODE["코드 실행 샌드박스<br/>(Docker)"]
        SCI["과학 도구<br/>(AlphaFold/Rosetta/ESM 등)"]
        LITAPI["문헌 API<br/>(Semantic Scholar/arXiv/PubMed)"]
    end

    subgraph LLMS["FOUNDATION MODELS (외부)"]
        GPT["OpenAI GPT / o1·o3"]
        CLA["Anthropic Claude"]
        GEM["Google Gemini"]
    end

    subgraph DATA["DATA / STORAGE (선택적)"]
        DB[("DB: 작업/사용자/메타")]
        KG[("Knowledge Graph")]
        OBJ[("Object Storage<br/>리포트·그림·코드")]
    end

    U --> WEBUI
    WEBUI -- "HTTPS / REST (JSON)" --> API
    API -- "WebSocket/SSE (실시간 진행)" --> WEBUI
    API -- "연구 목표 전달" --> ORCHESTRATOR

    ORCHESTRATOR -- "작업 분배/조율" --> A1 & A2 & A3 & A4
    A1 & A2 & A3 & A4 -- "결과 기록/공유" --> MEM
    MEM -- "다음 단계 제안" --> ORCHESTRATOR

    A2 -- "실행 요청" --> CODE
    A2 -- "도구 호출" --> SCI
    A3 -- "HTTPS / REST" --> LITAPI

    A1 -- "HTTPS API (JSON)" --> LLMS
    A2 -- "HTTPS API (JSON)" --> LLMS
    A3 -- "HTTPS API (JSON)" --> LLMS
    A4 -- "HTTPS API (JSON)" --> LLMS

    ORCHESTRATOR -- "영속화 (SQL)" --> DB
    MEM -- "관계 저장 (Bolt)" --> KG
    ORCHESTRATOR -- "아티팩트 (S3 API)" --> OBJ
    OBJ -- "최종 리포트" --> API
```

---

## 통신 프로토콜 요약

| 구간 | 프로토콜 | 비고 |
| :--- | :--- | :--- |
| 사용자 ↔ 프론트엔드 | HTTPS | 브라우저/CLI |
| 프론트엔드 ↔ 백엔드 API | HTTPS + REST (JSON) | 작업 생성/조회 |
| 백엔드 → 프론트엔드(실시간) | WebSocket / Server-Sent Events(SSE) | 연구 진행상황·로그 스트리밍 |
| 백엔드 ↔ 작업 큐 | AMQP / 내부 RPC | 비동기 장시간 작업(최대 12시간) |
| 에이전트 ↔ 외부 LLM | HTTPS REST (JSON, OpenAI 호환 API) | GPT/Claude/Gemini 호출 |
| 에이전트 ↔ 문헌 API | HTTPS REST | Semantic Scholar/arXiv/PubMed |
| 에이전트 ↔ 코드 샌드박스 | 컨테이너 IPC / 로컬 소켓 | 격리된 Docker, network=none |
| 오케스트레이터 ↔ 관계형 DB | SQL (TCP) | 상태/메타데이터 영속화 |
| 메모리 ↔ Knowledge Graph | Bolt protocol (Neo4j) | 개념 관계 그래프 |
| 백엔드 ↔ Object Storage | S3 API (HTTPS) | 리포트/그림/코드 아티팩트 |
| 백엔드 ↔ 캐시 | RESP (Redis) | 세션/캐시 |

## 시스템별 차이 (선택적 구성요소)

| 구성요소 | Kosmos | Sakana v2 | Google Co-Scientist | Stanford Virtual Lab |
| :--- | :--- | :--- | :--- | :--- |
| 프론트엔드 | 있음(웹 플랫폼) | 거의 없음(연구용 CLI/배치) | 있음(엔터프라이즈) | 거의 없음(연구 코드) |
| 공유 메모리 | World Model | Tree Search 노드 | Tournament/Elo 상태 | 회의 Transcript |
| DB/Graph | PostgreSQL+Neo4j+Vector | 파일/로그 위주 | 내부 인프라 | 파일/로그 위주 |
| 코드 샌드박스 | Docker | Docker(필수 권장) | 내부 | 외부 도구(AlphaFold 등) |
| 기반 LLM | 외부 프론티어(비공개) | Claude/GPT/o1 등 | Gemini(자사) | GPT-4 계열 |

---

## 참고 URL (Reference Sources)

### Edison Scientific / Kosmos
- Kosmos 논문 (arXiv): https://arxiv.org/abs/2511.02824
- Edison Scientific 공식 사이트: https://edisonscientific.com/
- FutureHouse — Announcing Edison Scientific: https://www.futurehouse.org/research-announcements/announcing-edison-scientific
- Alzforum — Introducing Kosmos: https://www.alzforum.org/news/research-news/introducing-kosmos-ai-scientist-makes-discoveries-overnight
- IntuitionLabs — Agentic AI in Pharma R&D (Incyte & Kosmos): https://intuitionlabs.ai/articles/agentic-ai-pharma-rd-incyte-kosmos
- Turing Post — FOD#126: What is Kosmos AI?: https://www.turingpost.com/p/fod126
- Kosmos 오픈소스 구현체 (GitHub): https://github.com/jimmc414/Kosmos
- LinkedIn (Samuel Rodriques, world model 설명): https://www.linkedin.com/posts/samuel-g-rodriques-080a9b22_kosmos-our-newest-ai-scientist-is-available-activity-7391852578470445056-pDS_

### Sakana.ai — The AI Scientist (v1/v2)
- AI Scientist v1 소개: https://sakana.ai/ai-scientist/
- AI Scientist v1 논문 (arXiv): https://arxiv.org/abs/2408.06292
- AI Scientist v2 논문 (arXiv): https://arxiv.org/abs/2504.08066
- AI Scientist v2 (GitHub, 아키텍처·실행 상세): https://github.com/SakanaAI/AI-Scientist-v2
- AI Scientist Nature 게재 소식: https://sakana.ai/ai-scientist-nature/

### Google DeepMind — AI Co-Scientist
- Google Research 블로그: https://research.google/blog/accelerating-scientific-breakthroughs-with-an-ai-co-scientist/
- DeepMind 블로그 (Co-Scientist coalition): https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/
- 논문 (arXiv): https://arxiv.org/abs/2502.18864
- Nature 게재: https://www.nature.com/articles/s41586-026-10644-y
- Google Cloud 문서 (Co-Scientist & AlphaEvolve): https://docs.cloud.google.com/gemini/enterprise/docs/co-scientist-and-alphaevolve

### Stanford — The Virtual Lab
- Stanford News: https://news.stanford.edu/stories/2025/07/ai-virtual-scientists-lab-llms
- Stanford Medicine News: https://med.stanford.edu/cancer/about/news/inside-the-virtual-lab--how-ai-scientists-are-accelerating-disco.html
- 논문 (PubMed): https://pubmed.ncbi.nlm.nih.gov/40730228/
- 프리프린트 (bioRxiv): https://www.biorxiv.org/content/10.1101/2024.11.11.623004v1

### 기타 (배경/맥락)
- Nature — Multi-agent AI systems need transparency: https://www.nature.com/articles/s42256-026-01183-2
- arXiv — Autonomous Agents for Scientific Discovery (survey): https://arxiv.org/html/2510.09901v1
- GEN — Google DeepMind and Edison Are Building the AI Scientist: https://www.genengnews.com/topics/artificial-intelligence/google-deepmind-and-edison-are-building-the-ai-scientist/
