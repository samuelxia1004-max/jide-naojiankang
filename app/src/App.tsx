import {
  Activity,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  Eraser,
  Home,
  PenTool,
  Plus,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { dailyTaskSets, guideCards, nBackSets, selfCheckMiniTasks, selfCheckSets, spacedRecallSets } from "./contentBanks";
import {
  choiceTrainingModules,
  choiceTrainingSetCount,
  type ChoiceTrainingKind,
  type ChoiceTrainingModule,
} from "./expandedTraining";
import { buildExportBundle, toCsv } from "./lib/exportData";
import { createId, createParticipantAlias } from "./lib/ids";
import { scoreClockDrawing, type ClockAutoScore, type ClockStroke } from "./lib/clockScoring";
import {
  buildNBackSequence,
  isExpectedMatch,
  nextNBackLevel,
  summarizeNBack,
  type NBackResponse,
} from "./lib/nback";
import { getResultBand, getResultCopy, getSelfCheckSuggestions, getSelfCheckTrendCopy } from "./lib/selfCheck";
import {
  appendSelfCheck,
  appendTrainingSession,
  readConsent,
  readPilotParticipants,
  readSelfChecks,
  readSettings,
  readTrainingSessions,
  saveConsent,
  savePilotParticipants,
  saveSettings,
} from "./lib/storage";
import type { ClockChecklist, PilotParticipant, SelfCheckSession, TrainingSession } from "./types";

type View = "home" | "self-check" | "training" | "guide" | "pilot";
type SelfCheckStep = "consent" | "words" | "recall" | "clock" | "questions" | "scenario" | "result";

const selfCheckSteps: SelfCheckStep[] = ["consent", "words", "recall", "clock", "questions", "scenario", "result"];

function refreshData() {
  return {
    selfChecks: readSelfChecks(),
    trainingSessions: readTrainingSessions(),
    participants: readPilotParticipants(),
  };
}

function emptyClockChecklist(): ClockChecklist {
  return {
    hasCircle: false,
    hasNumbers: false,
    hasHands: false,
    userFeltDifficult: false,
    autoScore: 0,
    numberSectors: 0,
    handLines: 0,
  };
}

function rotateIndex(current: number, total: number) {
  return (current + 1) % total;
}

function buildSequenceFor(setIndex: number, level: number) {
  const currentSet = nBackSets[setIndex];
  return buildNBackSequence(level, currentSet.length, currentSet.stimuli);
}

function getTrainingTrendCopy(current: TrainingSession, previous?: TrainingSession | null) {
  if (!previous) {
    return "这是第一次练习记录。先熟悉节奏，不用急着追求分数。";
  }

  if (current.accuracy >= previous.accuracy + 10 && current.falseAlarms <= previous.falseAlarms) {
    return "这次比上次更顺一些，专注和判断都值得表扬。";
  }

  if (current.accuracy <= previous.accuracy - 10 || current.falseAlarms >= previous.falseAlarms + 2) {
    return "这次比上次吃力一点也没关系。练习会受疲劳、情绪和环境影响，休息后再来一轮就好。";
  }

  return "这次和上次差不多，稳定练习本身就很好。慢慢来，比一次冲高更重要。";
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [view, setView] = useState<View>("home");
  const [settings, setSettings] = useState(readSettings);
  const [data, setData] = useState(refreshData);

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.dataset.fontScale = settings.fontScale;
  }, [settings]);

  const go = (nextView: View) => {
    setView(nextView);
    setData(refreshData());
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" onClick={() => go("home")} aria-label="回到首页">
          <span className="brand-mark">记</span>
          <span>
            <strong>记得</strong>
            <small>中文脑健康工具</small>
          </span>
        </button>

        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="切换字号"
            title="切换字号"
            onClick={() =>
              setSettings((current) => ({
                ...current,
                fontScale: current.fontScale === "normal" ? "large" : "normal",
              }))
            }
          >
            字
          </button>
          <label className="mode-toggle">
            <input
              type="checkbox"
              checked={settings.facilitatorMode}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  facilitatorMode: event.target.checked,
                }))
              }
            />
            <span>试点模式</span>
          </label>
        </div>
      </header>

      <main>
        {view === "home" && <HomeView go={go} data={data} />}
        {view === "self-check" && (
          <SelfCheckView
            facilitatorMode={settings.facilitatorMode}
            participants={data.participants}
            onSaved={() => setData(refreshData())}
            goHome={() => go("home")}
          />
        )}
        {view === "training" && <TrainingView onSaved={() => setData(refreshData())} goHome={() => go("home")} />}
        {view === "guide" && <GuideView goHome={() => go("home")} />}
        {view === "pilot" && (
          <PilotView
            data={data}
            settingsMode={settings.facilitatorMode}
            onChange={() => setData(refreshData())}
            goHome={() => go("home")}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="主导航">
        <NavButton active={view === "home"} icon={<Home />} label="首页" onClick={() => go("home")} />
        <NavButton active={view === "self-check"} icon={<ClipboardCheck />} label="自检" onClick={() => go("self-check")} />
        <NavButton active={view === "training"} icon={<Brain />} label="训练" onClick={() => go("training")} />
        <NavButton active={view === "guide"} icon={<BookOpen />} label="指南" onClick={() => go("guide")} />
        <NavButton active={view === "pilot"} icon={<Database />} label="数据" onClick={() => go("pilot")} />
      </nav>
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "nav-button active" : "nav-button"} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function HomeView({
  go,
  data,
}: {
  go: (view: View) => void;
  data: ReturnType<typeof refreshData>;
}) {
  const latestSelfCheck = data.selfChecks[0];
  const latestTraining = data.trainingSessions[0];

  return (
    <section className="screen home-screen">
      <div className="hero-panel">
        <div className="system-note">
          <ShieldCheck size={20} />
          本地保存 · 非诊断 · 中文适老
        </div>
        <h1>把一次担心，变成一次清楚的记录。</h1>
        <p>
          给 55+ 长者和家人使用的脑健康自检与记忆训练工具。现在内置 {selfCheckSets.length} 套自检、{nBackSets.length + spacedRecallSets.length + dailyTaskSets.length + choiceTrainingSetCount} 套练习和 {guideCards.length} 条学习指南，只提供教育和记录，不给医学结论。
        </p>
      </div>

      <div className="action-grid">
        <FeatureButton
          icon={<ClipboardCheck />}
          title="开始自检"
          text="题组轮换：词语回忆、时钟绘制、日常观察和生活小任务。"
          onClick={() => go("self-check")}
        />
        <FeatureButton
          icon={<Brain />}
          title="记忆训练"
          text="覆盖注意、回忆、分类、步骤、沟通、数字、路线、用药等多类练习。"
          onClick={() => go("training")}
        />
        <FeatureButton
          icon={<BookOpen />}
          title="照护者指南"
          text="阿尔茨海默病基础、就医沟通、家庭支持、社区试点。"
          onClick={() => go("guide")}
        />
        <FeatureButton
          icon={<Database />}
          title="试点数据"
          text="匿名编号、题组记录、汇总导出，适合社区教育活动。"
          onClick={() => go("pilot")}
        />
      </div>

      <div className="status-grid">
        <StatusPanel title="最近自检" value={latestSelfCheck ? getResultCopy(latestSelfCheck.resultBand) : "还没有记录"} />
        <StatusPanel title="最近训练" value={latestTraining ? `${latestTraining.accuracy}% 准确率` : "还没有记录"} />
      </div>
    </section>
  );
}

function FeatureButton({
  icon,
  title,
  text,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button className="feature-button" onClick={onClick}>
      <span className="feature-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </button>
  );
}

function StatusPanel({ title, value }: { title: string; value: string }) {
  return (
    <section className="status-panel">
      <span>{title}</span>
      <strong>{value}</strong>
    </section>
  );
}

function SetToolbar({
  label,
  sets,
  selectedIndex,
  onSelect,
  onNext,
}: {
  label: string;
  sets: { id: string; title: string }[];
  selectedIndex: number;
  onSelect: (nextIndex: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="set-toolbar">
      <label>
        <span>{label}</span>
        <select value={selectedIndex} onChange={(event) => onSelect(Number(event.target.value))}>
          {sets.map((set, index) => (
            <option key={set.id} value={index}>
              {String(index + 1).padStart(2, "0")} · {set.title}
            </option>
          ))}
        </select>
      </label>
      <button className="secondary-button compact" onClick={onNext}>
        <Shuffle size={20} />
        换一套
      </button>
    </div>
  );
}

function SelfCheckView({
  facilitatorMode,
  participants,
  onSaved,
  goHome,
}: {
  facilitatorMode: boolean;
  participants: PilotParticipant[];
  onSaved: () => void;
  goHome: () => void;
}) {
  const [setIndex, setSetIndex] = useState(0);
  const currentSet = selfCheckSets[setIndex];
  const currentMiniTask = selfCheckMiniTasks[setIndex % selfCheckMiniTasks.length];
  const [step, setStep] = useState<SelfCheckStep>(() => (readConsent() ? "words" : "consent"));
  const [participantAlias, setParticipantAlias] = useState(participants[0]?.alias ?? "");
  const [rememberedWords, setRememberedWords] = useState<string[]>([]);
  const [clockChecklist, setClockChecklist] = useState<ClockChecklist>(emptyClockChecklist);
  const [observationFlags, setObservationFlags] = useState<string[]>([]);
  const [miniTaskChoices, setMiniTaskChoices] = useState<string[]>([]);
  const [result, setResult] = useState<SelfCheckSession | null>(null);
  const [selfCheckTrend, setSelfCheckTrend] = useState("");

  const resetSelfCheck = (nextIndex = setIndex, nextStep: SelfCheckStep = readConsent() ? "words" : "consent") => {
    setSetIndex(nextIndex);
    setRememberedWords([]);
    setClockChecklist(emptyClockChecklist());
    setObservationFlags([]);
    setMiniTaskChoices([]);
    setResult(null);
    setSelfCheckTrend("");
    setStep(nextStep);
  };

  const acceptConsent = () => {
    saveConsent({ version: "v1", scope: "local-only", acceptedAt: new Date().toISOString() });
    setStep("words");
  };

  const toggleWord = (word: string) => {
    setRememberedWords((current) =>
      current.includes(word) ? current.filter((item) => item !== word) : [...current, word],
    );
  };

  const toggleObservation = (item: string) => {
    setObservationFlags((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  };

  const toggleMiniTaskChoice = (item: string) => {
    setMiniTaskChoices((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  };

  const updateClockScore = (score: ClockAutoScore) => {
    setClockChecklist((current) => ({
      ...current,
      hasCircle: score.hasCircle,
      hasNumbers: score.hasNumbers,
      hasHands: score.hasHands,
      autoScore: score.confidence,
      numberSectors: score.numberSectors,
      handLines: score.handLines,
    }));
  };

  const finish = () => {
    const miniTaskCorrect = miniTaskChoices.filter((item) => currentMiniTask.helpfulChoices.includes(item)).length;
    const previousSession = readSelfChecks()[0] ?? null;
    const resultBand = getResultBand(rememberedWords.length, clockChecklist, observationFlags);
    const session: SelfCheckSession = {
      id: createId("self"),
      createdAt: new Date().toISOString(),
      setId: currentSet.id,
      setTitle: currentSet.title,
      miniTaskId: currentMiniTask.id,
      miniTaskTitle: currentMiniTask.title,
      participantAlias: facilitatorMode ? participantAlias || undefined : undefined,
      recallCount: rememberedWords.length,
      clockChecklist,
      observationFlags,
      miniTaskCorrect,
      miniTaskTotal: currentMiniTask.helpfulChoices.length,
      resultBand,
    };
    appendSelfCheck(session);
    setResult(session);
    setSelfCheckTrend(getSelfCheckTrendCopy(session, previousSession));
    onSaved();
    setStep("result");
  };

  return (
    <section className="screen flow-screen">
      <ScreenHeader title="开始自检" subtitle="教育型记录，不替代医生评估。" goHome={goHome} />
      <SetToolbar
        label="选择自检套题"
        sets={selfCheckSets}
        selectedIndex={setIndex}
        onSelect={(nextIndex) => resetSelfCheck(nextIndex)}
        onNext={() => resetSelfCheck(rotateIndex(setIndex, selfCheckSets.length))}
      />
      <Progress current={selfCheckSteps.indexOf(step) + 1} total={selfCheckSteps.length} />

      {step === "consent" && (
        <Panel>
          <div className="panel-heading">
            <ShieldCheck />
            <h2>使用前说明</h2>
          </div>
          <p>
            本工具不会收集姓名、身份证、电话或住址。结果默认只保存在本设备上，可随时清除浏览器数据。
          </p>
          <p>
            它不是医学检查，也不能替代医生。如果你或家人持续担心记忆变化，请咨询合格医生。
          </p>
          <button className="primary-button" onClick={acceptConsent}>
            我理解，开始记录
          </button>
        </Panel>
      )}

      {step === "words" && (
        <Panel>
          <div className="set-meta">
            第 {setIndex + 1} / {selfCheckSets.length} 套 · {currentSet.title}
          </div>
          <div className="panel-heading">
            <Activity />
            <h2>先记住三个词</h2>
          </div>
          <p>请慢慢读一遍，等会儿会请你回忆。</p>
          <div className="word-strip" aria-label="需要记住的词语">
            {currentSet.words.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
          <button className="primary-button" onClick={() => setStep("recall")}>
            我准备好了
          </button>
        </Panel>
      )}

      {step === "recall" && (
        <Panel>
          <div className="panel-heading">
            <ClipboardCheck />
            <h2>回忆刚才的词</h2>
          </div>
          <p>不用紧张。请点选你记得的词。</p>
          <div className="choice-list">
            {currentSet.words.map((word) => (
              <label key={word} className="large-check">
                <input type="checkbox" checked={rememberedWords.includes(word)} onChange={() => toggleWord(word)} />
                <span>{word}</span>
              </label>
            ))}
          </div>
          <button className="primary-button" onClick={() => setStep("clock")}>
            下一步
          </button>
        </Panel>
      )}

      {step === "clock" && (
        <Panel>
          <div className="panel-heading">
            <PenTool />
            <h2>画一个时钟</h2>
          </div>
          <p>{currentSet.clockPrompt} 请画出圆形表盘、主要数字和指针。系统会在本设备上自动识别，不上传图像。</p>
          <ClockPad key={currentSet.id} onScoreChange={updateClockScore} />
          <div className="auto-score-grid" aria-label="时钟自动识别结果">
            <AutoScoreBadge label="表盘" active={clockChecklist.hasCircle} />
            <AutoScoreBadge label="数字" active={clockChecklist.hasNumbers} detail={`${clockChecklist.numberSectors ?? 0} 个区域`} />
            <AutoScoreBadge label="指针" active={clockChecklist.hasHands} detail={`${clockChecklist.handLines ?? 0} 根`} />
            <AutoScoreBadge label="参考分" active={(clockChecklist.autoScore ?? 0) >= 67} detail={`${clockChecklist.autoScore ?? 0}%`} />
          </div>
          <p className="hint-text">自动识别只是练习参考。字写得轻、屏幕太小或手指挡住，都可能影响识别。</p>
          <div className="choice-list">
            <ChecklistItem
              label="过程有点吃力"
              checked={clockChecklist.userFeltDifficult}
              onChange={(value) => setClockChecklist((current) => ({ ...current, userFeltDifficult: value }))}
            />
          </div>
          <button className="primary-button" onClick={() => setStep("questions")}>
            下一步
          </button>
        </Panel>
      )}

      {step === "questions" && (
        <Panel>
          <div className="panel-heading">
            <BookOpen />
            <h2>日常观察</h2>
          </div>
          <p>下面不是量表，只是帮助家人整理最近看到的变化。符合就勾选。</p>
          {facilitatorMode && participants.length > 0 && (
            <label className="select-row">
              匿名编号
              <select value={participantAlias} onChange={(event) => setParticipantAlias(event.target.value)}>
                <option value="">不关联编号</option>
                {participants.map((participant) => (
                  <option key={participant.alias} value={participant.alias}>
                    {participant.alias}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="choice-list">
            {currentSet.observations.map((item) => (
              <ChecklistItem
                key={item}
                label={item}
                checked={observationFlags.includes(item)}
                onChange={() => toggleObservation(item)}
              />
            ))}
          </div>
          <button className="primary-button" onClick={() => setStep("scenario")}>
            下一步
          </button>
        </Panel>
      )}

      {step === "scenario" && (
        <Panel>
          <div className="set-meta">
            生活小任务 · {currentMiniTask.title}
          </div>
          <div className="panel-heading">
            <ClipboardCheck />
            <h2>选出有帮助的做法</h2>
          </div>
          <p>{currentMiniTask.prompt}</p>
          <p>这一步不是考试，只是练习把生活里的重点挑出来。请选出你觉得比较有帮助的做法。</p>
          <div className="choice-list">
            {currentMiniTask.choices.map((item) => (
              <ChecklistItem
                key={item}
                label={item}
                checked={miniTaskChoices.includes(item)}
                onChange={() => toggleMiniTaskChoice(item)}
              />
            ))}
          </div>
          <button className="primary-button" onClick={finish}>
            完成记录
          </button>
        </Panel>
      )}

      {step === "result" && result && (
        <Panel emphasis>
          <div className="result-badge">
            <CheckCircle2 />
            {getResultCopy(result.resultBand)}
          </div>
          <h2>这次记录已保存在本设备</h2>
          <p>
            本次套题：{result.setTitle}；词语回忆 {result.recallCount} / 3；日常观察勾选 {result.observationFlags.length} 项；生活小任务 {result.miniTaskCorrect ?? 0} / {result.miniTaskTotal ?? 0} 项。
          </p>
          <div className="feedback-box">
            <strong>这次变化</strong>
            <p>{selfCheckTrend}</p>
          </div>
          <div className="advice-list">
            <strong>接下来可以这样做</strong>
            <ul>
              {getSelfCheckSuggestions(result).map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={() => resetSelfCheck(rotateIndex(setIndex, selfCheckSets.length), "words")}>
              <Shuffle size={20} />
              做下一套
            </button>
            <button className="primary-button" onClick={goHome}>
              回到首页
            </button>
          </div>
        </Panel>
      )}
    </section>
  );
}

function AutoScoreBadge({ label, active, detail }: { label: string; active: boolean; detail?: string }) {
  return (
    <div className={active ? "auto-score-badge active" : "auto-score-badge"}>
      <strong>{label}</strong>
      <span>{active ? "已识别" : "未识别"}{detail ? ` · ${detail}` : ""}</span>
    </div>
  );
}

function ClockPad({ onScoreChange }: { onScoreChange: (score: ClockAutoScore) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const strokesRef = useRef<ClockStroke[]>([]);
  const activeStrokeRef = useRef<ClockStroke | null>(null);

  const updateScore = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onScoreChange(scoreClockDrawing(strokesRef.current, canvas.width, canvas.height));
  };

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point || !drawing.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    activeStrokeRef.current?.push({ ...point, t: Date.now() });
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    updateScore();
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    activeStrokeRef.current = [{ ...point, t: Date.now() }];
    strokesRef.current = [...strokesRef.current, activeStrokeRef.current];
    canvas.setPointerCapture(event.pointerId);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const stop = () => {
    drawing.current = false;
    activeStrokeRef.current = null;
    updateScore();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
    activeStrokeRef.current = null;
    updateScore();
  };

  return (
    <div className="clock-pad">
      <canvas
        ref={canvasRef}
        width={640}
        height={420}
        aria-label="时钟绘制区域"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={stop}
        onPointerCancel={stop}
      />
      <button className="secondary-button compact" onClick={clear}>
        <Eraser size={20} />
        清空重画
      </button>
    </div>
  );
}

function ChecklistItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="large-check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

type TrainingMode = "nback" | "spaced" | "daily" | ChoiceTrainingKind;

const coreTrainingOptions: Array<{ id: TrainingMode; title: string; shortTitle: string; description: string }> = [
  { id: "nback", title: "n-back 工作记忆", shortTitle: "n-back", description: "判断当前字是否和前面相同。" },
  { id: "spaced", title: "间隔回忆", shortTitle: "回忆", description: "先记住物品，再从相似项中找回。" },
  { id: "daily", title: "日常计划", shortTitle: "计划", description: "从生活场景里选择更稳妥做法。" },
  ...choiceTrainingModules.map((module) => ({
    id: module.id,
    title: module.title,
    shortTitle: module.shortTitle,
    description: module.description,
  })),
];

function TrainingView({ onSaved, goHome }: { onSaved: () => void; goHome: () => void }) {
  const [activeTab, setActiveTab] = useState<TrainingMode>("nback");
  const activeChoiceModule = choiceTrainingModules.find((module) => module.id === activeTab);

  return (
    <section className="screen flow-screen">
      <ScreenHeader title="记忆训练" subtitle="多类型练习，只记录表现和趋势，不代表医学评估。" goHome={goHome} />
      <div className="training-mode-grid" aria-label="训练类型">
        {coreTrainingOptions.map((option) => (
          <button
            key={option.id}
            className={activeTab === option.id ? "active" : ""}
            onClick={() => setActiveTab(option.id)}
          >
            <strong>{option.shortTitle}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
      {activeTab === "nback" && <NBackTrainer onSaved={onSaved} />}
      {activeTab === "spaced" && <SpacedRecallTrainer onSaved={onSaved} />}
      {activeTab === "daily" && <DailyTaskTrainer onSaved={onSaved} />}
      {activeChoiceModule && <ChoiceTrainingModuleView module={activeChoiceModule} onSaved={onSaved} />}
    </section>
  );
}

function NBackTrainer({ onSaved }: { onSaved: () => void }) {
  const [setIndex, setSetIndex] = useState(0);
  const currentSet = nBackSets[setIndex];
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState(() => buildSequenceFor(0, 1));
  const [trialIndex, setTrialIndex] = useState(0);
  const [responses, setResponses] = useState<NBackResponse[]>([]);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [summary, setSummary] = useState<ReturnType<typeof summarizeNBack> | null>(null);
  const [trend, setTrend] = useState("");

  const reset = (nextLevel = level, nextSetIndex = setIndex) => {
    setSetIndex(nextSetIndex);
    setLevel(nextLevel);
    setSequence(buildSequenceFor(nextSetIndex, nextLevel));
    setTrialIndex(0);
    setResponses([]);
    setStartedAt(Date.now());
    setSummary(null);
    setTrend("");
  };

  const answer = (userMatched: boolean) => {
    const expectedMatch = isExpectedMatch(sequence, trialIndex, level);
    const nextResponses = [...responses, { stimulus: sequence[trialIndex], expectedMatch, userMatched }];
    setResponses(nextResponses);

    if (trialIndex === sequence.length - 1) {
      const nextSummary = summarizeNBack(nextResponses);
      const nextLevel = nextNBackLevel(level, nextSummary.accuracy, nextSummary.falseAlarms);
      const session: TrainingSession = {
        id: createId("train"),
        kind: "nback",
        setId: currentSet.id,
        setTitle: currentSet.title,
        level,
        trials: nextSummary.trials,
        accuracy: nextSummary.accuracy,
        falseAlarms: nextSummary.falseAlarms,
        durationMs: Date.now() - startedAt,
        createdAt: new Date().toISOString(),
      };
      const previous = readTrainingSessions().find((item) => item.kind === "nback") ?? null;
      appendTrainingSession(session);
      onSaved();
      setSummary(nextSummary);
      setTrend(getTrainingTrendCopy(session, previous));
      setLevel(nextLevel);
    } else {
      setTrialIndex((current) => current + 1);
    }
  };

  return (
    <Panel>
      <SetToolbar
        label="选择 n-back 套题"
        sets={nBackSets}
        selectedIndex={setIndex}
        onSelect={(nextIndex) => reset(level, nextIndex)}
        onNext={() => reset(level, rotateIndex(setIndex, nBackSets.length))}
      />
      <div className="training-topline">
        <span>
          {level}-back · {currentSet.title}
        </span>
        <span>
          {summary ? sequence.length : trialIndex + 1} / {sequence.length}
        </span>
      </div>
      <div className="stimulus-box" aria-live="polite">
        {summary ? "本轮完成" : sequence[trialIndex]}
      </div>
      {!summary ? (
        <>
          <p className="hint-text">
            如果当前字和 {level} 步前相同，请点“相同”；如果不同，请点“不同”。
          </p>
          <div className="button-row">
            <button className="secondary-button" onClick={() => answer(false)}>
              不同
            </button>
            <button className="primary-button" onClick={() => answer(true)}>
              相同
            </button>
          </div>
        </>
      ) : (
        <div className="result-stack">
          <p>
            套题：{currentSet.title}；准确率 {summary.accuracy}%；误点 {summary.falseAlarms} 次。
          </p>
          <div className="feedback-box">
            <strong>这次变化</strong>
            <p>{trend}</p>
          </div>
          <p>下一轮建议从 {level}-back 开始。</p>
          <div className="button-row">
            <button className="secondary-button" onClick={() => reset(level, rotateIndex(setIndex, nBackSets.length))}>
              <Shuffle size={20} />
              换套练习
            </button>
            <button className="primary-button" onClick={() => reset(level)}>
              <RotateCcw size={20} />
              再练一轮
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function SpacedRecallTrainer({ onSaved }: { onSaved: () => void }) {
  const [setIndex, setSetIndex] = useState(0);
  const currentSet = spacedRecallSets[setIndex];
  const [stage, setStage] = useState<"learn" | "recall" | "done">("learn");
  const [selected, setSelected] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [trend, setTrend] = useState("");
  const score = selected.filter((item) => currentSet.targets.includes(item)).length;
  const falseAlarms = selected.filter((item) => !currentSet.targets.includes(item)).length;

  const reset = (nextSetIndex = setIndex) => {
    setSetIndex(nextSetIndex);
    setSelected([]);
    setStartedAt(Date.now());
    setTrend("");
    setStage("learn");
  };

  const toggle = (item: string) => {
    setSelected((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  const finish = () => {
    const accuracy = Math.round((score / currentSet.targets.length) * 100);
    const session: TrainingSession = {
      id: createId("train"),
      kind: "spacedRecall",
      setId: currentSet.id,
      setTitle: currentSet.title,
      level: 1,
      trials: currentSet.targets.length,
      accuracy,
      falseAlarms,
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString(),
    };
    const previous = readTrainingSessions().find((item) => item.kind === "spacedRecall") ?? null;
    appendTrainingSession(session);
    onSaved();
    setTrend(getTrainingTrendCopy(session, previous));
    setStage("done");
  };

  return (
    <Panel>
      <SetToolbar
        label="选择间隔回忆套题"
        sets={spacedRecallSets}
        selectedIndex={setIndex}
        onSelect={reset}
        onNext={() => reset(rotateIndex(setIndex, spacedRecallSets.length))}
      />
      {stage === "learn" && (
        <>
          <div className="set-meta">
            第 {setIndex + 1} / {spacedRecallSets.length} 套 · {currentSet.title}
          </div>
          <h2>先记住四样东西</h2>
          <div className="word-strip spaced">
            {currentSet.targets.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p>读一遍后，点下面按钮进入回忆。</p>
          <button className="primary-button" onClick={() => setStage("recall")}>
            开始回忆
          </button>
        </>
      )}
      {stage === "recall" && (
        <>
          <h2>你记得哪些？</h2>
          <div className="choice-list two-col">
            {currentSet.choices.map((item) => (
              <ChecklistItem key={item} label={item} checked={selected.includes(item)} onChange={() => toggle(item)} />
            ))}
          </div>
          <button className="primary-button" onClick={finish}>
            完成练习
          </button>
        </>
      )}
      {stage === "done" && (
        <div className="result-stack">
          <div className="result-badge">
            <CheckCircle2 />
            本轮完成
          </div>
          <p>
            套题：{currentSet.title}；记起 {score} / {currentSet.targets.length} 项；误点 {falseAlarms} 次。练习结果已保存在本设备。
          </p>
          <div className="feedback-box">
            <strong>这次变化</strong>
            <p>{trend}</p>
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={() => reset(rotateIndex(setIndex, spacedRecallSets.length))}>
              <Shuffle size={20} />
              换套练习
            </button>
            <button className="primary-button" onClick={() => reset()}>
              <RotateCcw size={20} />
              再练一轮
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function DailyTaskTrainer({ onSaved }: { onSaved: () => void }) {
  const [setIndex, setSetIndex] = useState(0);
  const currentSet = dailyTaskSets[setIndex];
  const [selected, setSelected] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [done, setDone] = useState(false);
  const [trend, setTrend] = useState("");
  const score = selected.filter((item) => currentSet.targets.includes(item)).length;
  const falseAlarms = selected.filter((item) => !currentSet.targets.includes(item)).length;

  const reset = (nextSetIndex = setIndex) => {
    setSetIndex(nextSetIndex);
    setSelected([]);
    setStartedAt(Date.now());
    setDone(false);
    setTrend("");
  };

  const toggle = (item: string) => {
    setSelected((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  const finish = () => {
    const accuracy = Math.round((score / currentSet.targets.length) * 100);
    const session: TrainingSession = {
      id: createId("train"),
      kind: "dailyTask",
      setId: currentSet.id,
      setTitle: currentSet.title,
      level: 1,
      trials: currentSet.targets.length,
      accuracy,
      falseAlarms,
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString(),
    };
    const previous = readTrainingSessions().find((item) => item.kind === "dailyTask") ?? null;
    appendTrainingSession(session);
    onSaved();
    setTrend(getTrainingTrendCopy(session, previous));
    setDone(true);
  };

  return (
    <Panel>
      <SetToolbar
        label="选择日常计划套题"
        sets={dailyTaskSets}
        selectedIndex={setIndex}
        onSelect={reset}
        onNext={() => reset(rotateIndex(setIndex, dailyTaskSets.length))}
      />
      {!done ? (
        <>
          <div className="set-meta">
            第 {setIndex + 1} / {dailyTaskSets.length} 套 · {currentSet.title}
          </div>
          <h2>从生活场景里选重点</h2>
          <p>{currentSet.prompt}</p>
          <p className="hint-text">请选出 3 个更稳妥、更有帮助的做法。选多了也没关系，练习重点是慢慢分辨。</p>
          <div className="choice-list">
            {currentSet.choices.map((item) => (
              <ChecklistItem key={item} label={item} checked={selected.includes(item)} onChange={() => toggle(item)} />
            ))}
          </div>
          <button className="primary-button" onClick={finish}>
            完成练习
          </button>
        </>
      ) : (
        <div className="result-stack">
          <div className="result-badge">
            <CheckCircle2 />
            本轮完成
          </div>
          <p>
            套题：{currentSet.title}；选中有帮助做法 {score} / {currentSet.targets.length} 项；误点 {falseAlarms} 次。练习结果已保存在本设备。
          </p>
          <div className="feedback-box">
            <strong>这次变化</strong>
            <p>{trend}</p>
          </div>
          <div className="advice-list">
            <strong>生活提示</strong>
            <ul>
              <li>{currentSet.tip}</li>
              <li>这类练习只是帮助整理生活重点，不代表医学评估。</li>
            </ul>
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={() => reset(rotateIndex(setIndex, dailyTaskSets.length))}>
              <Shuffle size={20} />
              换套练习
            </button>
            <button className="primary-button" onClick={() => reset()}>
              <RotateCcw size={20} />
              再练一轮
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function ChoiceTrainingModuleView({ module, onSaved }: { module: ChoiceTrainingModule; onSaved: () => void }) {
  const [setIndex, setSetIndex] = useState(0);
  const currentSet = module.sets[setIndex];
  const [selected, setSelected] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [done, setDone] = useState(false);
  const [trend, setTrend] = useState("");
  const score = selected.filter((item) => currentSet.targets.includes(item)).length;
  const falseAlarms = selected.filter((item) => !currentSet.targets.includes(item)).length;

  const reset = (nextSetIndex = setIndex) => {
    setSetIndex(nextSetIndex);
    setSelected([]);
    setStartedAt(Date.now());
    setDone(false);
    setTrend("");
  };

  const toggle = (item: string) => {
    setSelected((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  const finish = () => {
    const accuracy = Math.round((score / currentSet.targets.length) * 100);
    const session: TrainingSession = {
      id: createId("train"),
      kind: module.id,
      setId: currentSet.id,
      setTitle: `${module.title}｜${currentSet.title}`,
      level: 1,
      trials: currentSet.targets.length,
      accuracy,
      falseAlarms,
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString(),
    };
    const previous = readTrainingSessions().find((item) => item.kind === module.id) ?? null;
    appendTrainingSession(session);
    onSaved();
    setTrend(getTrainingTrendCopy(session, previous));
    setDone(true);
  };

  return (
    <Panel>
      <SetToolbar
        label={`选择${module.title}套题`}
        sets={module.sets}
        selectedIndex={setIndex}
        onSelect={reset}
        onNext={() => reset(rotateIndex(setIndex, module.sets.length))}
      />
      {!done ? (
        <>
          <div className="set-meta">
            第 {setIndex + 1} / {module.sets.length} 套 · {currentSet.title}
          </div>
          <h2>{module.title}</h2>
          <p>{module.instruction}</p>
          <p>{currentSet.prompt}</p>
          <p className="hint-text">请选择 3 项。干扰项有些也像是对的，慢慢比对比一次点完更好。</p>
          <div className="choice-list">
            {currentSet.choices.map((item) => (
              <ChecklistItem key={item} label={item} checked={selected.includes(item)} onChange={() => toggle(item)} />
            ))}
          </div>
          <button className="primary-button" onClick={finish}>
            完成练习
          </button>
        </>
      ) : (
        <div className="result-stack">
          <div className="result-badge">
            <CheckCircle2 />
            本轮完成
          </div>
          <p>
            类型：{module.title}；套题：{currentSet.title}；选中目标 {score} / {currentSet.targets.length} 项；误点 {falseAlarms} 次。
          </p>
          <div className="feedback-box">
            <strong>这次变化</strong>
            <p>{trend}</p>
          </div>
          <div className="advice-list">
            <strong>本轮更稳妥的 3 项</strong>
            <ul>
              {currentSet.targets.map((target) => (
                <li key={target}>{target}</li>
              ))}
            </ul>
          </div>
          <div className="advice-list">
            <strong>练习提示</strong>
            <ul>
              <li>{currentSet.tip}</li>
              <li>这只是练习表现，不用把一次得分看得太重。</li>
            </ul>
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={() => reset(rotateIndex(setIndex, module.sets.length))}>
              <Shuffle size={20} />
              换套练习
            </button>
            <button className="primary-button" onClick={() => reset()}>
              <RotateCcw size={20} />
              再练一轮
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function GuideView({ goHome }: { goHome: () => void }) {
  return (
    <section className="screen guide-screen">
      <ScreenHeader title="照护者指南" subtitle="把担心说清楚，把羞耻感降下来。" goHome={goHome} />
      <div className="guide-count">
        <BookOpen size={20} />
        已整理 {guideCards.length} 条家庭和社区试点提示
      </div>
      <div className="guide-list">
        {guideCards.map((section, index) => (
          <article className="guide-item" key={section.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          </article>
        ))}
      </div>
      <Panel>
        <h2>内容边界</h2>
        <p>
          指南内容用于家庭教育和沟通准备，不替代医生、医院工具或专业评估。页面不会给出疾病标签，也不承诺训练可以预防疾病。
        </p>
      </Panel>
    </section>
  );
}

function PilotView({
  data,
  settingsMode,
  onChange,
  goHome,
}: {
  data: ReturnType<typeof refreshData>;
  settingsMode: boolean;
  onChange: () => void;
  goHome: () => void;
}) {
  const [exportConsent, setExportConsent] = useState(false);

  const addParticipant = () => {
    const next: PilotParticipant = {
      alias: createParticipantAlias(data.participants.length),
      createdAt: new Date().toISOString(),
    };
    savePilotParticipants([...data.participants, next]);
    onChange();
  };

  const exportJson = () => {
    saveConsent({ version: "v1", scope: "anonymous-export", acceptedAt: new Date().toISOString() });
    const bundle = buildExportBundle(data.participants, data.selfChecks, data.trainingSessions);
    downloadText(`jide-export-${Date.now()}.json`, JSON.stringify(bundle, null, 2), "application/json");
  };

  const exportCsv = () => {
    saveConsent({ version: "v1", scope: "anonymous-export", acceptedAt: new Date().toISOString() });
    const bundle = buildExportBundle(data.participants, data.selfChecks, data.trainingSessions);
    downloadText(`jide-export-${Date.now()}.csv`, toCsv(bundle), "text/csv;charset=utf-8");
  };

  return (
    <section className="screen pilot-screen">
      <ScreenHeader title="试点数据" subtitle="只导出匿名编号、题组和汇总指标。" goHome={goHome} />
      {!settingsMode && (
        <Panel>
          <h2>试点模式未开启</h2>
          <p>顶部开关打开后，可添加匿名编号并把自检记录关联到参与者。单人使用时不需要开启。</p>
        </Panel>
      )}
      <div className="status-grid">
        <StatusPanel title="匿名编号" value={`${data.participants.length} 个`} />
        <StatusPanel title="自检记录" value={`${data.selfChecks.length} 条`} />
        <StatusPanel title="训练记录" value={`${data.trainingSessions.length} 条`} />
      </div>
      <Panel>
        <div className="panel-heading">
          <UserPlus />
          <h2>匿名参与者</h2>
        </div>
        <p>请只使用自动生成的编号，不录入姓名、电话、住址或其他身份信息。</p>
        <button className="secondary-button" onClick={addParticipant}>
          <Plus size={20} />
          添加匿名编号
        </button>
        {data.participants.length > 0 && (
          <div className="participant-list">
            {data.participants.map((participant) => (
              <span key={participant.alias}>{participant.alias}</span>
            ))}
          </div>
        )}
      </Panel>
      <Panel emphasis>
        <div className="panel-heading">
          <Download />
          <h2>导出匿名汇总</h2>
        </div>
        <p>导出内容只包含编号、时间、题组、模块结果和汇总指标。导出前请确认已获得活动参与者知情同意。</p>
        <label className="large-check">
          <input type="checkbox" checked={exportConsent} onChange={(event) => setExportConsent(event.target.checked)} />
          <span>我确认只导出匿名汇总数据</span>
        </label>
        <div className="button-row">
          <button className="secondary-button" disabled={!exportConsent} onClick={exportJson}>
            导出 JSON
          </button>
          <button className="primary-button" disabled={!exportConsent} onClick={exportCsv}>
            导出 CSV
          </button>
        </div>
      </Panel>
    </section>
  );
}

function ScreenHeader({ title, subtitle, goHome }: { title: string; subtitle: string; goHome: () => void }) {
  return (
    <div className="screen-header">
      <button className="back-button" onClick={goHome}>
        <Home size={20} />
        首页
      </button>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="progress-wrap" aria-label={`第 ${current} 步，共 ${total} 步`}>
      <div className="progress-label">
        <span>进度</span>
        <strong>
          {current} / {total}
        </strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function Panel({ children, emphasis = false }: { children: ReactNode; emphasis?: boolean }) {
  return <section className={emphasis ? "panel emphasis" : "panel"}>{children}</section>;
}
