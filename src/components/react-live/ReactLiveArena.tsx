import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SandpackCodeEditor,
  SandpackPreview,
  SandpackProvider,
  SandpackTests,
  UnstyledOpenInCodeSandboxButton,
  useSandpack,
  useSandpackNavigation,
} from "@codesandbox/sandpack-react";
import {
  EXERCISES,
  editablePaths,
  toSandpackFiles,
  type ReactExercise,
} from "../../data/react-live";

/* ------------------------------------------------------------------ */
/* Types & persistence                                                  */
/* ------------------------------------------------------------------ */

interface ExerciseRun {
  pass: number;
  fail: number;
  total: number;
  at: number;
}

interface ArenaStorage {
  /** exerciseId -> editable path -> user's in-progress code */
  edits: Record<string, Record<string, string>>;
  /** exerciseId -> stats of the last completed test run */
  runs: Record<string, ExerciseRun>;
  /** exerciseId -> timestamp of the first all-green run */
  solved: Record<string, number>;
}

const STORAGE_KEY = "iprep.react-live.v1";

/** Stable empty-object identity so SandpackProvider props never churn. */
const EMPTY_EDITS: Record<string, string> = {};

function loadStorage(): ArenaStorage {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { edits: {}, runs: {}, solved: {} };
    const parsed = JSON.parse(raw) as Partial<ArenaStorage>;
    return {
      edits: parsed.edits ?? {},
      runs: parsed.runs ?? {},
      solved: parsed.solved ?? {},
    };
  } catch {
    return { edits: {}, runs: {}, solved: {} };
  }
}

function commitStorage(next: ArenaStorage): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode — arena still works, just without persistence */
  }
}

/* ------------------------------------------------------------------ */
/* Site theme detection (the site toggles a `dark` class on <html>)     */
/* ------------------------------------------------------------------ */

function useSiteDarkMode(): boolean {
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return dark;
}

/* ------------------------------------------------------------------ */
/* Test result collection (from SandpackTests onComplete specs)         */
/* ------------------------------------------------------------------ */

interface SpecBlock {
  tests?: Record<string, { status?: string }>;
  describes?: Record<string, SpecBlock>;
}

function collectSpecResult(
  specs: Record<string, SpecBlock>,
): { pass: number; fail: number } {
  let pass = 0;
  let fail = 0;

  const walk = (block: SpecBlock): void => {
    for (const test of Object.values(block.tests ?? {})) {
      if (test.status === "pass") pass += 1;
      else if (test.status === "fail") fail += 1;
    }
    for (const child of Object.values(block.describes ?? {})) walk(child);
  };

  for (const spec of Object.values(specs ?? {})) walk(spec);
  return { pass, fail };
}

/* ------------------------------------------------------------------ */
/* Mini icons                                                           */
/* ------------------------------------------------------------------ */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...props}>
    <path d="M21 12a9 9 0 1 1-2.6-6.3" />
    <path d="M21 3v5h-5" />
  </svg>
);

const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...props}>
    <path d="m21 2-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8Zm0 0L19 3m-3.5 3.5L18 9" />
  </svg>
);

const ExternalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...props}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

const BulbIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...props}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" />
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...props}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Arena root                                                           */
/* ------------------------------------------------------------------ */

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  Hard: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
};

export default function Arena() {
  const [storage, setStorage] = useState<ArenaStorage>(() => loadStorage());
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const dark = useSiteDarkMode();

  const exercise = useMemo(
    () => EXERCISES.find((ex) => ex.id === exerciseId) ?? EXERCISES[0],
    [exerciseId],
  );

  const finishedCount = Object.values(storage.solved).length;

  const recordRun = useCallback(
    (run: ExerciseRun) => {
      setStorage((prev) => {
        if (prev.runs[exerciseId]?.at === run.at) return prev;
        const solved = { ...prev.solved };
        if (run.total > 0 && run.fail === 0 && !solved[exerciseId]) {
          solved[exerciseId] = run.at;
        }
        const next: ArenaStorage = {
          ...prev,
          runs: { ...prev.runs, [exerciseId]: run },
          solved,
        };
        commitStorage(next);
        return next;
      });
    },
    [exerciseId],
  );

  // Read the latest storage at call time so `persistEdits` keeps a stable
  // identity — new identities would ripple into the SandpackProvider tree.
  const storageRef = useRef(storage);
  storageRef.current = storage;

  const persistEdits = useCallback(
    (id: string, edits: Record<string, string>) => {
      commitStorage({
        ...storageRef.current,
        edits: { ...storageRef.current.edits, [id]: edits },
      });
    },
    [],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* Exercise picker */}
      <aside className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto scroll-thin lg:pr-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Challenges</h2>
          <span className="text-xs tabular-nums text-ink-muted">
            {finishedCount}/{EXERCISES.length} solved
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {EXERCISES.map((ex) => {
            const run = storage.runs[ex.id];
            const green = run && run.total > 0 && run.fail === 0;
            const solvedAt = storage.solved[ex.id];
            const isActive = ex.id === exercise.id;

            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setExerciseId(ex.id)}
                aria-current={isActive ? "true" : undefined}
                className={
                  "group flex w-full flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-colors " +
                  (isActive
                    ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/40"
                    : "border-line bg-surface hover:border-indigo-300 dark:hover:border-indigo-800")
                }
              >
                <span className="flex w-full items-center gap-2">
                  <span
                    className={
                      "grid h-6 w-6 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-semibold " +
                      (solvedAt
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : "bg-surface-raised text-ink-secondary")
                    }
                  >
                    {solvedAt ? <CheckIcon className="h-3.5 w-3.5" /> : ex.num}
                  </span>
                  <span className="truncate text-sm font-semibold">{ex.title}</span>
                  <span
                    className={
                      "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                      DIFFICULTY_STYLES[ex.difficulty]
                    }
                  >
                    {ex.difficulty}
                  </span>
                </span>
                <span className="line-clamp-1 text-xs text-ink-secondary">
                  {ex.tagline}
                </span>
                {run && run.total > 0 && (
                  <span
                    className={
                      "inline-flex items-center gap-1 text-[11px] font-medium tabular-nums " +
                      (green
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-500 dark:text-zinc-400")
                    }
                  >
                    {green ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : (
                      <XIcon className="h-3 w-3" />
                    )}
                    {run.pass}/{run.total} tests
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 rounded-2xl border border-dashed border-line p-3 text-[11px] leading-relaxed text-ink-muted">
          Your code and solved badges are stored locally in this browser. First
          load takes a few seconds — the Sandpack bundler is fetched from the
          CodeSandbox CDN.
        </p>
      </aside>

      {/* Workspace */}
      <section className="min-w-0">
        <Workspace
          key={exercise.id}
          exercise={exercise}
          dark={dark}
          initialEdits={storage.edits[exercise.id] ?? EMPTY_EDITS}
          onRun={recordRun}
          onEdits={persistEdits}
        />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Workspace                                                            */
/* ------------------------------------------------------------------ */

interface WorkspaceProps {
  exercise: ReactExercise;
  dark: boolean;
  /** Restored user edits for this exercise (from localStorage). */
  initialEdits: Record<string, string>;
  onEdits: (
    id: string,
    edits: Record<string, string>,
  ) => void;
  onRun: (run: ExerciseRun) => void;
}

function Workspace({
  exercise,
  dark,
  initialEdits,
  onEdits,
  onRun,
}: WorkspaceProps) {
  // Built once per exercise (the component is keyed on the exercise id).
  const [files] = useState(() => toSandpackFiles(exercise, initialEdits));
  // Stable identities are critical: SandpackProvider re-derives its file
  // state whenever `props.customSetup` (an object) changes identity, which
  // recompiles the bundler and re-runs the tests — an inline literal here
  // would turn every test completion into an endless recompile loop.
  const customSetup = useMemo(() => ({ entry: "/index.js" }), []);
  const providerOptions = useMemo(
    () => ({ recompileMode: "delayed" as const, recompileDelay: 700 }),
    [],
  );
  const scaffold = useMemo(() => {
    const paths: Record<string, string> = {};
    for (const [path, file] of Object.entries(exercise.files)) {
      paths[path] = file.code;
    }
    return paths;
  }, [exercise]);
  const [lastRun, setLastRun] = useState<ExerciseRun | null>(null);

  const handleRun = useCallback(
    (specs: Record<string, SpecBlock>) => {
      const { pass, fail } = collectSpecResult(specs);
      const run: ExerciseRun = { pass, fail, total: pass + fail, at: Date.now() };
      setLastRun(run);
      onRun(run);
    },
    [onRun],
  );

  const allGreen =
    lastRun !== null && lastRun.total > 0 && lastRun.fail === 0;

  return (
    <SandpackProvider
      theme={dark ? "dark" : "light"}
      template="react"
      files={files}
      customSetup={customSetup}
      options={providerOptions}
    >
      <EditPersistence
        exerciseId={exercise.id}
        scaffold={scaffold}
        onEdits={onEdits}
      />



      {/* Brief */}
      <div className="card mb-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            Challenge {String(exercise.num).padStart(2, "0")}
          </span>
          <span
            className={
              "chip font-semibold " + DIFFICULTY_STYLES[exercise.difficulty]
            }
          >
            {exercise.difficulty}
          </span>
          {exercise.concepts.map((concept) => (
            <span
              key={concept}
              className="hidden bg-surface-raised text-ink-secondary sm:inline-flex"
              style={{ fontSize: "11px" }}
            >
              {concept}
            </span>
          ))}
          <span
            className={
              "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " +
              (allGreen
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : lastRun
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-surface-raised text-ink-secondary")
            }
          >
            {allGreen ? (
              <CheckIcon className="h-3.5 w-3.5" />
            ) : (
              <BulbIcon className="h-3.5 w-3.5" />
            )}
            {lastRun
              ? allGreen
                ? "All tests passing"
                : `${lastRun.pass}/${lastRun.total} passing`
              : "Run the tests"}
          </span>
        </div>

        <h2 className="mt-3 text-lg font-semibold tracking-tight">
          {exercise.title}
        </h2>
        <p
          className="mt-1.5 text-[15px] leading-relaxed text-ink-secondary"
          style={{ whiteSpace: "pre-line" }}
        >
          {exercise.brief}
        </p>

        <ul className="mt-3 space-y-1.5">
          {exercise.requirements.map((req) => (
            <li
              key={req}
              className="flex gap-2 rounded-lg bg-surface-raised px-3 py-2 text-[13px] leading-relaxed text-[color:var(--ink-secondary)]"
            >
              <CheckMark />
              <span className="min-w-0 font-mono text-xs">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      <ActionToolbar exercise={exercise} />

      {/* Sandbox grid */}
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-line bg-zinc-50 dark:bg-zinc-900 h-[440px]">
          <SandpackCodeEditor
            showTabs
            showLineNumbers
            showInlineErrors
            showReadOnly={false}
            closableTabs={false}
            style={{ height: "100%" }}
          />
        </div>

        <div className="grid gap-3">
          <div className="overflow-hidden rounded-2xl border border-line bg-zinc-50 dark:bg-zinc-900 h-[250px]">
            <SandpackPreview
              showOpenInCodeSandbox={false}
              style={{ height: "100%" }}
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-zinc-50 dark:bg-zinc-900 h-[266px]">
            <SandpackTests
              style={{ height: "100%" }}
              onComplete={handleRun}
            />
          </div>
        </div>
      </div>

      <HintSection hints={exercise.hints} />
    </SandpackProvider>
  );
}

const CheckMark = () => (
  <span
    aria-hidden="true"
    className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400"
  />
);

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

function EditPersistence({
  exerciseId,
  scaffold,
  onEdits,
}: {
  exerciseId: string;
  scaffold: Record<string, string>;
  onEdits: (id: string, edits: Record<string, string>) => void;
}) {
  const { sandpack } = useSandpack();
  const filesRef = useRef(sandpack.files);
  filesRef.current = sandpack.files;

  useEffect(() => {
    const id = window.setTimeout(() => {
      const edits: Record<string, string> = {};
      for (const [path, file] of Object.entries(filesRef.current)) {
        const base = scaffold[path];
        if (base !== undefined && file.code !== base) {
          edits[path] = file.code;
        }
      }
      onEdits(exerciseId, edits);
    }, 700);
    return () => window.clearTimeout(id);
  }, [sandpack.files, exerciseId, scaffold, onEdits]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Toolbar                                                              */
/* ------------------------------------------------------------------ */

function ActionToolbar({ exercise }: { exercise: ReactExercise }) {
  const { sandpack } = useSandpack();
  const { refresh } = useSandpackNavigation();
  const [note, setNote] = useState("");

  const reset = useCallback(() => {
    for (const path of editablePaths(exercise)) {
      sandpack.updateFile(path, exercise.files[path].code);
    }
    setNote("Scaffold restored");
  }, [exercise, sandpack]);

  const revealSolution = useCallback(() => {
    if (
      !window.confirm(
        "Overwrite your code with the reference solution for this challenge?",
      )
    ) {
      return;
    }
    for (const [path, code] of Object.entries(exercise.solution)) {
      sandpack.updateFile(path, code);
    }
    setNote("Solution loaded — study it, then hit Reset to try again");
  }, [exercise, sandpack]);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(""), 2600);
    return () => window.clearTimeout(id);
  }, [note]);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => refresh()}
        className="btn btn-primary"
      >
        <RefreshIcon className="h-4 w-4" />
        Re-run preview &amp; tests
      </button>
      <button type="button" onClick={reset} className="btn btn-secondary">
        Reset scaffold
      </button>
      <button type="button" onClick={revealSolution} className="btn btn-danger-soft">
        <KeyIcon className="h-4 w-4" />
        Reveal solution
      </button>
      <UnstyledOpenInCodeSandboxButton className="btn btn-secondary ml-auto">
        <ExternalIcon className="h-4 w-4" />
        Open in CodeSandbox
      </UnstyledOpenInCodeSandboxButton>

      <span
        aria-live="polite"
        className={
          "order-last w-full text-xs text-emerald-600 dark:text-emerald-400 " +
          (note ? "" : "invisible")
        }
      >
        {note || "·"}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hints                                                                */
/* ------------------------------------------------------------------ */

function HintSection({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0);

  return (
    <div className="mt-4 card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <BulbIcon className="h-4 w-4 text-amber-500" />
          Hints
        </h3>
        <span className="text-xs tabular-nums text-ink-muted">
          {revealed}/{hints.length}
        </span>
      </div>

      {revealed > 0 && (
        <ul className="mt-2.5 space-y-2">
          {hints.slice(0, revealed).map((hint) => (
            <li
              key={hint}
              className="rounded-lg bg-surface-raised px-3 py-2 text-[13px] leading-relaxed text-[color:var(--ink-secondary)]"
            >
              {hint}
            </li>
          ))}
        </ul>
      )}

      {revealed < hints.length && (
        <button
          type="button"
          onClick={() => setRevealed((n) => n + 1)}
          className="btn btn-soft mt-3 w-full"
        >
          Reveal hint {revealed + 1} of {hints.length}
        </button>
      )}
    </div>
  );
}
