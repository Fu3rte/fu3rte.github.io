import { currentLang } from '../../shared/i18n';

export type Text = { zh: string; en: string };

export type CaseBlockKey = 'problem' | 'decisions' | 'contribution' | 'outcomes';

export type Project = {
  id: string;
  name: string;
  href: string;
  category: Text;
  summary: Text;
  role: Text;
  period: string;
  status: Text;
  tech: string[];
  nodes: string[];
  blocks: Record<CaseBlockKey, Text[]>;
};

export const CASE_BLOCK_KEYS: CaseBlockKey[] = ['problem', 'decisions', 'contribution', 'outcomes'];

export function pick(text: Text): string {
  return currentLang() === 'zh' ? text.zh : text.en;
}
export const PROJECTS: Project[] = [
  {
    id: 'fit-agent',
    name: 'Fit-Agent',
    href: 'https://github.com/Fu3rte/Fit-Agent',
    category: { zh: 'AI 训练助手', en: 'AI Training Assistant' },
    summary: {
      zh: '通过自然语言维护训练档案、计划与课程日志，由单个 ReAct Agent 循环驱动的个人力量训练助手。',
      en: 'A personal strength-training assistant that keeps profile, plan and session logs in shape through natural language, running on a single ReAct agent loop.',
    },
    role: { zh: '独立设计与开发', en: 'Sole designer and developer' },
    period: '2026.03 —',
    status: { zh: '持续迭代', en: 'Actively maintained' },
    tech: ['Python', 'FastAPI', 'ReAct', 'SQLite'],
    nodes: ['Profile + Plan + Logs', 'ReAct Agent', 'Training Assistant'],
    blocks: {
      problem: [
        {
          zh: '训练记录的真实成本不在记，而在改：计划调整一次，档案、课表和历史口径就要跟着手改一遍，多数人的记录因此停在第三周。',
          en: 'The real cost of training logs is not writing them but amending them. Change the plan once and the profile, the schedule and the history all need a manual edit, which is where most people stop by week three.',
        },
        {
          zh: '要解决的问题是：让一次自然语言表达的意图，直接落到结构化的档案与日志上，同时保持数据可核验。',
          en: 'The problem to solve: let one natural-language intention land directly on structured profile and log data, while keeping that data auditable.',
        },
      ],
      decisions: [
        {
          zh: '单个 ReAct 循环而不是多智能体编排。训练域的工具数量有限，多智能体带来的调度成本与不可解释的中间态，收益远低于代价。',
          en: 'One ReAct loop instead of multi-agent orchestration. The tool surface in this domain is small, and scheduling cost plus opaque intermediate states cost more than they return.',
        },
        {
          zh: '工具层只暴露结构化写入接口，模型不直接拼 SQL。模型负责理解意图，事务与校验留在代码侧。',
          en: 'Tools expose structured writes only; the model never composes SQL. Intent understanding belongs to the model, transactions and validation stay in code.',
        },
        {
          zh: '档案与计划分离存储，计划可被追溯地重排，历史日志保持不可变。',
          en: 'Profile and plan are stored separately so a plan can be resequenced with history intact, and past sessions stay immutable.',
        },
      ],
      contribution: [
        {
          zh: '从零完成领域模型、工具注册表、Agent 循环与后端接口的全部设计与实现。',
          en: 'Designed and implemented the domain model, tool registry, agent loop and backend API from scratch.',
        },
        {
          zh: '为工具调用定义了参数校验与失败即中止的约定，模型幻觉出的字段名在入口就被拒绝。',
          en: 'Defined argument validation and fail-fast behaviour for tool calls, so field names invented by the model are rejected at the boundary.',
        },
      ],
      outcomes: [
        {
          zh: '一次对话即可完成「这周换成推拉腿分化，把上次的记录留住」这类跨表修改。',
          en: 'One conversation can carry out a cross-table change such as "switch this week to push-pull-legs and keep last session\'s record".',
        },
        {
          zh: '全部数据留在本地 SQLite，随时可用 SQL 核验，不依赖任何第三方存储。',
          en: 'All data stays in local SQLite and can be verified with SQL at any time, with no third-party storage dependency.',
        },
      ],
    },
  },
  {
    id: 'contextus',
    name: 'contextus',
    href: 'https://github.com/Fu3rte/contextus',
    category: { zh: 'RAG 文档问答', en: 'RAG Document Q&A' },
    summary: {
      zh: '最小可运行的 RAG 文档问答：分块、pgvector 余弦检索与生成，并配有 React + shadcn 调试台。',
      en: 'The smallest working RAG document Q&A: chunk, pgvector cosine retrieval and generation, with a React + shadcn debug console.',
    },
    role: { zh: '独立设计与开发', en: 'Sole designer and developer' },
    period: '2026.05 — 2026.08',
    status: { zh: '已完成', en: 'Completed' },
    tech: ['React', 'TypeScript', 'pgvector', 'RAG', 'FastAPI'],
    nodes: ['Documents', 'Chunking', 'pgvector Retrieval', 'RAG Answer'],
    blocks: {
      problem: [
        {
          zh: '市面上的 RAG 示例把检索质量藏在答案后面：看不出错了一整条链路里的哪一步，也就无法判断该改分块还是改召回。',
          en: 'Typical RAG demos hide retrieval quality behind the answer. When something is wrong you cannot tell which stage failed, so you cannot decide whether to fix chunking or recall.',
        },
        {
          zh: '要做一套链路全部摊开、每一步都可复现的最小实现。',
          en: 'Build the smallest implementation where every stage of the chain is laid out and reproducible.',
        },
      ],
      decisions: [
        {
          zh: '调试台与问答共用同一份请求体，检索命中片段、相似度分数与最终 prompt 同屏可见。',
          en: 'The debug console and the Q&A path share one request body, so matched chunks, similarity scores and the final prompt appear on the same screen.',
        },
        {
          zh: '分块参数、Top-K、相似度阈值全部外置为可改配置，不做自动调优黑箱。',
          en: 'Chunking parameters, top-K and the similarity threshold stay external configuration; no auto-tuning black box.',
        },
        {
          zh: '检索直接用 pgvector 余弦距离，不引入独立向量库，减少一个需要解释的变量。',
          en: 'Retrieval uses pgvector cosine distance directly, with no separate vector store, removing one more variable to explain.',
        },
      ],
      contribution: [
        {
          zh: '独立完成分块与向量化管线、pgvector 检索层、生成接口与前端调试台。',
          en: 'Owned the chunking and embedding pipeline, the pgvector retrieval layer, the generation endpoint and the frontend console.',
        },
        {
          zh: '为每个命中片段补上了来源页与原文偏移，答案可以逐句回溯到文档位置。',
          en: 'Added source page and character offset to every matched chunk so each sentence can be traced back into the document.',
        },
      ],
      outcomes: [
        {
          zh: '整链路可在一条命令内本地复现，含数据库迁移与示例文档。',
          en: 'The whole chain reproduces locally in one command, migrations and sample documents included.',
        },
        {
          zh: '调试台可直接对比两组分块参数的召回差异，改参数前后的差别肉眼可判。',
          en: 'The console lets two chunking settings be compared side by side, so the difference shows up without instrumentation.',
        },
      ],
    },
  },
  {
    id: 'dsh-sight',
    name: 'dsh-sight',
    href: 'https://github.com/Fu3rte/dsh-sight',
    category: { zh: '多模态扩展', en: 'Multimodal Extension' },
    summary: {
      zh: '为纯文本 DeepSeek Harness 模型加入视觉能力，内置免费与低成本 VLM 预设，支持多图批量分析。',
      en: 'Plug-in vision for text-only DeepSeek Harness models, with free and low-cost VLM presets plus multi-image batch analysis.',
    },
    role: { zh: '独立设计与开发', en: 'Sole designer and developer' },
    period: '2026.07 —',
    status: { zh: '持续迭代', en: 'Actively maintained' },
    tech: ['VLM', 'Python', 'FastAPI'],
    nodes: ['Text + Images', 'VLM Presets', 'Batch Analysis'],
    blocks: {
      problem: [
        {
          zh: '宿主模型的上下文里塞不进图，而一次截图问一句话的需求每天都在发生。',
          en: 'The host model cannot take images in its context, yet the need to screenshot something and ask one question about it happens every day.',
        },
        {
          zh: '需要在不改动宿主调用链的前提下外挂一层视觉，且这层可以按预算换模型。',
          en: 'Add a vision layer outside the host call chain, leaving that chain untouched and letting the layer be swapped by budget.',
        },
      ],
      decisions: [
        {
          zh: '视觉侧只做转述：把图转成结构化描述再交回宿主，不让第二个模型参与最终推理。',
          en: 'The vision side only paraphrases: turn the image into a structured description and hand it back, never let a second model do the final reasoning.',
        },
        {
          zh: 'VLM 以预设集合提供，免费档与低价档可切换，调用方按任务量选档。',
          en: 'VLMs ship as preset bundles with free and low-cost tiers, so the caller picks a tier by workload.',
        },
        {
          zh: '多图走批量接口而不是逐图请求，把往返次数压到一次。',
          en: 'Multiple images go through one batch call rather than per-image requests, cutting round trips to one.',
        },
      ],
      contribution: [
        {
          zh: '设计与实现外挂层的全部代码：预设管理、图片规范化、批量编排与结果回填。',
          en: 'Designed and built the entire plug-in layer: preset management, image normalisation, batch orchestration and result back-filling.',
        },
        {
          zh: '把宿主侧改动压到零，扩展只通过已有的文本输入通道进入。',
          en: 'Kept host-side changes at zero; the extension enters only through the existing text input channel.',
        },
      ],
      outcomes: [
        {
          zh: '纯文本宿主模型可以直接接住多图提问，无需替换宿主或改其提示词。',
          en: 'A text-only host can answer multi-image questions without being replaced or having its prompt edited.',
        },
        {
          zh: '批量路径把同一批图片的调用数收敛到一次，成本随预设档位可预测。',
          en: 'The batch path collapses one set of images into a single call, and cost stays predictable per preset tier.',
        },
      ],
    },
  },
  {
    id: 'nl2sql-agent',
    name: 'nl2sql-agent',
    href: 'https://github.com/Fu3rte/nl2sql-agent',
    category: { zh: '数据查询 Agent', en: 'Data Query Agent' },
    summary: {
      zh: '把自然语言问题翻译成 SQL 并执行取数的 Agent，带 schema 注入与结果校验。',
      en: 'An agent that turns natural-language questions into SQL, runs them and checks what comes back, with schema injection and result validation.',
    },
    role: { zh: '独立设计与开发', en: 'Sole designer and developer' },
    period: '2026.02 — 2026.04',
    status: { zh: '已完成', en: 'Completed' },
    tech: ['LangChain', 'LangGraph', 'Python', 'SQL'],
    nodes: ['Question', 'Schema', 'Generated SQL', 'Result Check'],
    blocks: {
      problem: [
        {
          zh: '业务侧提问题的方式和写 SQL 的人不在同一张表上：一句话的取数需求要排一次队。',
          en: 'The people asking the question and the people writing SQL never share a table: one sentence of data need costs a round of queuing.',
        },
        {
          zh: '要解决的不是「能不能生成 SQL」，而是生成的 SQL 敢不敢直接执行。',
          en: 'The problem is not whether SQL can be generated but whether the generated SQL is safe to execute directly.',
        },
      ],
      decisions: [
        {
          zh: '只读事务加表白名单，写操作与越权表在数据库层就被挡住，不依赖提示词约束。',
          en: 'Read-only transactions and a table allowlist block writes and out-of-scope tables at the database layer instead of trusting prompt instructions.',
        },
        {
          zh: 'schema 以结构化形式注入而不是塞满上下文窗口，模型只在必要字段上做判断。',
          en: 'Inject schema as structured data rather than flooding the context window, so the model only reasons over the fields it needs.',
        },
        {
          zh: '生成的 SQL 先做语法与列名校验，失败则带错误信息回炉一次。',
          en: 'Generated SQL passes syntax and column validation first, and on failure is retried once with the error attached.',
        },
      ],
      contribution: [
        {
          zh: '独立完成 schema 抽取、图编排、校验回路与执行层。',
          en: 'Owned schema extraction, graph orchestration, the validation loop and the execution layer.',
        },
      ],
      outcomes: [
        {
          zh: '一次失败重试后仍不合格的语句直接拒答，不返回看似合理实则错位的数字。',
          en: 'Statements still failing after one retry are refused outright, so no plausible-looking wrong number gets returned.',
        },
      ],
    },
  },
  {
    id: 'calisthenics-log',
    name: 'calisthenics-log',
    href: 'https://github.com/Fu3rte/calisthenics-log',
    category: { zh: '数据可视化', en: 'Data Visualisation' },
    summary: {
      zh: '纯自重训练记录看板：JSON 存数据，React 渲染，命令行逐组录入。',
      en: 'A bodyweight-training record board: JSON for data, React for rendering, set-by-set entry from the command line.',
    },
    role: { zh: '独立设计与开发', en: 'Sole designer and developer' },
    period: '2026.01 — 2026.03',
    status: { zh: '已完成', en: 'Completed' },
    tech: ['React', 'TypeScript', 'JSON'],
    nodes: ['CLI Entry', 'JSON Store', 'React Board'],
    blocks: {
      problem: [
        {
          zh: '训练现场只有手机和一身汗，任何需要点选表单的记录方式都会被打断。',
          en: 'At the bar you have a phone and sweat; any record flow that needs form tapping gets abandoned.',
        },
      ],
      decisions: [
        {
          zh: '录入走命令行，一行一组，手不离杠也能记完。',
          en: 'Entry happens in the command line, one line per set, so the bar never needs to be let go.',
        },
        {
          zh: '数据是纯 JSON 文本文件，可用 git 追踪，不绑任何服务与账号。',
          en: 'Data is a plain JSON text file, tracked by git and bound to no service or account.',
        },
      ],
      contribution: [
        {
          zh: '独立完成录入脚本、数据格式设计与看板渲染。',
          en: 'Owned the entry script, the data format and the board rendering.',
        },
      ],
      outcomes: [
        {
          zh: '录入成本压到一行一次，历史曲线随文件版本自然增长。',
          en: 'Entry cost drops to one line per record, and the history curve grows with the file version.',
        },
      ],
    },
  },
];
