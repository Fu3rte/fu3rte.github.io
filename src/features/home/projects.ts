import { currentLang } from '../../shared/i18n';

export type Text = { zh: string; en: string };

export type CaseBlockKey = 'problem' | 'decisions' | 'contribution' | 'outcomes';

export type Project = {
  id: string;
  name: string;
  href: string;
  accent: 'sky' | 'grass';
  stickyStock: 'sticky-blue' | 'sticky-green';
  category: Text;
  summary: Text;
  role: Text;
  period: string;
  status: Text;
  tech: string[];
  nodes: string[];
  highlights: Text[];
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
    accent: 'sky',
    stickyStock: 'sticky-blue',
    category: { zh: '自己用的训练小助手', en: 'Personal Training Helper' },
    summary: {
      zh: '平时自己健身常改计划，嫌手改表格太麻烦，就拿一个 ReAct 循环做了这个小工具：跟它说一句今天怎么练，它帮我把档案、课表和本地日志对上。',
      en: 'I tweak my training split a lot and got tired of updating sheets by hand, so I built a small helper around one ReAct loop to update my profile, plan, and local logs from plain text.',
    },
    role: { zh: '从头自己摸索着写', en: 'Built solo from scratch' },
    period: '2026.03 —',
    status: { zh: '一边练一边改', en: 'Still tinkering' },
    tech: ['Python', 'FastAPI', 'ReAct', 'SQLite'],
    nodes: ['Plain Words', 'Tool Guard', 'Local SQLite'],
    highlights: [
      {
        zh: '改一次课表不用顺手改三张表，跨表同步靠预设好的工具一次做完。',
        en: 'Changing a split updates the schedule without manually editing three separate files.',
      },
      {
        zh: '全部记录存本地 SQLite，不绑任何云端 App，随时导得出、查得到。',
        en: 'All logs stay in local SQLite with zero cloud lock-in — easy to inspect or back up anytime.',
      },
    ],
    blocks: {
      problem: [
        {
          zh: '平时自己记训练，最劝退的其实不是练完写两组数字，而是每次一换计划，档案、课表和旧记录就得跟着手改一遍，经常改烦了就不记了。',
          en: 'The annoying part of keeping workout notes is not logging sets — it is rewriting your profile, split, and old sheets every time you tweak your routine.',
        },
        {
          zh: '我当时就想做一个自己顺手的小工具：随手打一句话，它就能把对应那几块本地数据更新好，而且不能随便乱改写坏旧记录。',
          en: 'I wanted a simple personal helper where a short sentence updates the right local records without scrambling past sessions.',
        },
      ],
      decisions: [
        {
          zh: '只用一个 ReAct 循环，不硬上多智能体。训练这件小事一共没几个动作，简单一点反而容易排查哪一步出了问题。',
          en: 'Stuck to a single ReAct loop instead of multi-agent orchestration. For a handful of training actions, simpler means far easier to debug.',
        },
        {
          zh: '模型不碰 SQL，只准调我提前写死结构的写入函数。理解人话交给模型，校验和事务老老实实写在 Python 里。',
          en: 'The model never generates SQL — it only calls typed Python functions. Language goes to the model; validation stays in plain code.',
        },
        {
          zh: '把「当前计划」和「练过的历史」拆开存，计划怎么调整，过去已经练完的账都不动。',
          en: 'Separated active plans from completed logs so reshuffling next week never rewrites what already happened.',
        },
      ],
      contribution: [
        {
          zh: '一边查资料一边从零搭起了数据表结构、工具函数、Agent 循环和 FastAPI 接口。',
          en: 'Built the SQLite schema, tool functions, loop, and FastAPI endpoints myself as I learned.',
        },
        {
          zh: '在入口加了参数检查，模型偶尔编出不存在的字段名时直接退回重试，不往数据库里写脏东西。',
          en: 'Added strict argument checks at the boundary so hallucinated field names bounce before touching storage.',
        },
      ],
      outcomes: [
        {
          zh: '现在「这周改推拉腿，留住上周记录」这种随口交代的话，跑一轮就能改稳。',
          en: 'A single message handles cross-table tweaks like switching splits while keeping older entries intact.',
        },
        {
          zh: '数据全留在自己电脑的 SQLite 里，踏实、好备份，也随时能用简单的 SQL 核对。',
          en: 'Everything sits right in a local SQLite file — easy to back up and easy to sanity-check.',
        },
      ],
    },
  },
  {
    id: 'calisthenics-log',
    name: 'calisthenics-log',
    href: 'https://github.com/Fu3rte/calisthenics-log',
    accent: 'grass',
    stickyStock: 'sticky-green',
    category: { zh: '街健打卡小看板', en: 'Bodyweight Record Board' },
    summary: {
      zh: '练单杠双杠时不想一直低头点手机表单，就写了个命令行小脚本配纯 JSON 文件：喘口气的工夫敲一行字，回家再用 React 看板看进步曲线。',
      en: 'I hated tapping tiny phone forms with chalky hands by the pull-up bar, so I paired a one-line CLI logger with a plain JSON file and a React board to watch numbers climb.',
    },
    role: { zh: '自己写着玩兼自用', en: 'Solo hobby build' },
    period: '2026.01 — 2026.03',
    status: { zh: '够用且稳定', en: 'Done & in daily use' },
    tech: ['React', 'TypeScript', 'JSON'],
    nodes: ['CLI One-Liner', 'Plain JSON', 'React Board'],
    highlights: [
      {
        zh: '录一组动作只需要几秒钟，不会把组间休息变成刷手机时间。',
        en: 'Logging a set takes seconds, so rest time stays for catching breath instead of scrolling.',
      },
      {
        zh: '数据文件跟着代码仓库走，换电脑直接 git pull 就能接着看。',
        en: 'Data lives right in git — moving to another machine is just a git pull away.',
      },
    ],
    blocks: {
      problem: [
        {
          zh: '在户外单杠区练街健的时候，手里经常有汗或镁粉，用常规健身 App 一层层点进去填数字特别打断节奏。',
          en: 'Out by the bars with sweaty hands, tapping through multi-screen fitness apps breaks the flow of a session.',
        },
        {
          zh: '同时我也不想把几年的训练数存在不知道哪天会关停的第三方云笔记里。',
          en: 'I also wanted my training history in a format I own forever instead of locked inside someone else\'s app.',
        },
      ],
      decisions: [
        {
          zh: '把「记」和「看」拆开：记的时候只走命令行，一行打完就继续吊杠；看的时候回电脑打开 React 页面慢慢复盘。',
          en: 'Split logging from reviewing: fast one-line CLI at workout time, calm React dashboard back at the desk.',
        },
        {
          zh: '数据只用一个纯 JSON 文本，直接用 git 版本管理，零运维零依赖。',
          en: 'Chose a single plain JSON file versioned with git — zero servers, zero accounts, zero fuss.',
        },
      ],
      contribution: [
        {
          zh: '自己定了 JSON 数据结构、写了录入脚本和前端数据展示看板。',
          en: 'Designed the JSON format, wrote the quick CLI script, and built the React board.',
        },
      ],
      outcomes: [
        {
          zh: '记录成本降到最低，反而真的能坚持每周记完每一组引体和双杠。',
          en: 'Because logging takes almost zero effort, it actually stuck as a weekly habit.',
        },
        {
          zh: '看着纯文本文件慢慢变长、曲线往上走，比花哨的徽章系统更有成就感。',
          en: 'Watching that plain file grow alongside steady rep gains feels better than any gamified streak.',
        },
      ],
    },
  },
];
