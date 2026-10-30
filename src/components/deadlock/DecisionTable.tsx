"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import { board, objects, resolutions, project } from "@/lib/deadlock/content";
import { Dialog } from "@/components/ui/Dialog";
import { evidenceRelation, previewSocket } from "@/lib/deadlock/engine";
import type { Evidence, Lane, Resolution } from "@/lib/deadlock/types";
import { GuardControl, type SceneProps } from "./runtime";
import { Avatar } from "./Stage";
import s from "./Deadlock.module.css";
export default function DecisionTable({
  state,
  dispatch,
  busy,
  preview,
}: SceneProps) {
  const [confirm, setConfirm] = useState(false);
  const [picked, setPicked] = useState<Lane | null>(null),
    [hover, setHover] = useState<{ lane: Lane; res: Resolution } | null>(null);
  const entered = useRef({ lane: "", res: "", at: 0 }),
    keyboard = useRef(0),
    drag = useRef(false);
  const show = (lane: Lane, res: Resolution) => {
    try {
      preview(previewSocket(state, lane, res));
      setHover({ lane, res });
      if (entered.current.lane !== lane || entered.current.res !== res)
        entered.current = { lane, res, at: performance.now() };
    } catch {
      preview();
    }
  };
  const choose = (lane: Lane, res: Resolution) => {
    dispatch({
      type: "SOCKET",
      lane,
      res,
      previewMs:
        entered.current.lane === lane && entered.current.res === res
          ? Math.max(0, performance.now() - entered.current.at)
          : 0,
    });
    setPicked(null);
    setHover(null);
    preview();
  };
  return (
    <>
      <header className={s.sceneHead}>
        <div>
          <p className={s.kicker}>Chapter 1 · The Table</p>
          <h2>Put the conflict on the table.</h2>
        </div>
        <p className={s.muted} data-beat>
          Move a token. Watch the cost before committing. Attach what you
          actually saw.
        </p>
      </header>
      <div className={s.table}>
        <div className={s.tableIntro}>
          <span>FOUNDATION · {board.foundation}</span>
          <span>PERSUASION POINTS · {state.ap} / 5</span>
        </div>
        <div className={s.conflictLanes}>
          {board.lanes.map((lane) => {
            const id = lane.id,
              c = state.lanes[id];
            return (
              <section
                key={id}
                className={s.lane}
                data-res={c.res || ""}
                aria-label={`${lane.name} conflict lane`}
              >
                <div className={s.laneHeading}>
                  <h3>{lane.name}</h3>
                  <button
                    className={s.token}
                    aria-label={`Lift ${id} decision token. Enter to lift, arrow keys choose a socket, Enter to drop.`}
                    aria-pressed={picked === id}
                    onClick={() => {
                      if (drag.current) {
                        drag.current = false;
                        return;
                      }
                      setPicked(picked === id ? null : id);
                      keyboard.current = 0;
                      show(id, "R");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                        e.preventDefault();
                        setPicked(id);
                        keyboard.current =
                          (keyboard.current +
                            (e.key === "ArrowRight" ? 1 : 3)) %
                          4;
                        show(id, resolutions[keyboard.current]);
                      }
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (picked === id)
                          choose(id, resolutions[keyboard.current]);
                        else {
                          setPicked(id);
                          keyboard.current = 0;
                          show(id, "R");
                        }
                      }
                    }}
                    onPointerDown={(e) => {
                      drag.current = false;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setPicked(id);
                    }}
                    onPointerMove={(e) => {
                      if (
                        !e.currentTarget.hasPointerCapture(e.pointerId) ||
                        e.buttons === 0
                      )
                        return;
                      drag.current = true;
                      const rect = e.currentTarget.getBoundingClientRect();
                      gsap.set(e.currentTarget, {
                        x: e.clientX - (rect.left + rect.width / 2),
                        y: e.clientY - (rect.top + rect.height / 2),
                      });
                      const target = document
                        .elementFromPoint(e.clientX, e.clientY)
                        ?.closest<HTMLElement>("[data-socket]");
                      if (target?.dataset.lane === id)
                        show(id, target.dataset.res as Resolution);
                    }}
                    onPointerUp={(e) => {
                      gsap.set(e.currentTarget, { clearProps: "transform" });
                      if (!drag.current) return;
                      const target = document
                        .elementFromPoint(e.clientX, e.clientY)
                        ?.closest<HTMLElement>("[data-socket]");
                      if (
                        target?.dataset.lane === id &&
                        target.getAttribute("aria-disabled") !== "true"
                      )
                        choose(id, target.dataset.res as Resolution);
                    }}
                    onPointerCancel={(e) =>
                      gsap.set(e.currentTarget, { clearProps: "transform" })
                    }
                  >
                    ⌖
                  </button>
                </div>
                <div className={s.requirementPair}>
                  <div className={s.requirement}>
                    {lane.robotics}
                    <small>ROBOTICS · {lane.rWeeks} weeks</small>
                  </div>
                  <div className={s.requirement}>
                    {lane.software}
                    <small>SOFTWARE · {lane.sWeeks} weeks</small>
                  </div>
                </div>
                <div className={s.sockets}>
                  {board.sockets.map((socket) => {
                    const disabled =
                      busy ||
                      (socket.id === "B" &&
                        state.ap + (c.res === "B" ? 2 : 0) < 2);
                    return (
                      <button
                        key={socket.id}
                        className={s.socket}
                        data-socket=""
                        data-lane={id}
                        data-res={socket.id}
                        data-resolution={socket.id}
                        data-selected={c.res === socket.id}
                        aria-disabled={disabled}
                        disabled={disabled}
                        title={
                          disabled
                            ? "Needs 2 persuasion points. Change another compromise first."
                            : socket.id === "B"
                              ? "2 persuasion points and 1 week of runway."
                              : "Preview the live instruments before committing."
                        }
                        onPointerEnter={() => show(id, socket.id)}
                        onPointerLeave={() => {
                          preview();
                          setHover(null);
                          entered.current = { lane: "", res: "", at: 0 };
                        }}
                        onFocus={() => show(id, socket.id)}
                        onBlur={() => {
                          preview();
                          setHover(null);
                        }}
                        onClick={() => choose(id, socket.id)}
                      >
                        {
                          {
                            R: "Back Dev",
                            S: "Back Ines",
                            B: "Compromise",
                            D: "Leave for later",
                          }[socket.id]
                        }
                        <small>
                          {socket.id === "B"
                            ? "Use 2 persuasion points and 1 week to bring both sides into the plan."
                            : socket.id === "D"
                              ? "Leave this for later. It costs nothing now, but the problem is still there."
                              : socket.id === "R"
                                ? lane.robotics
                                : lane.software}
                        </small>
                      </button>
                    );
                  })}
                </div>
                <label className={s.defense}>
                  <span>
                    SUPPORTING EVIDENCE ·{" "}
                    {c.res
                      ? evidenceRelation(c.evidence, id, c.res)
                      : "NO TOKEN YET"}
                  </span>
                  <select
                    aria-label={`${id} defense clamp`}
                    value={c.evidence || ""}
                    disabled={busy}
                    onChange={(e) =>
                      dispatch({
                        type: "ATTACH",
                        lane: id,
                        card: e.target.value
                          ? (e.target.value as Evidence)
                          : undefined,
                      })
                    }
                  >
                    <option value="">No evidence attached</option>
                    {objects
                      .filter((o) => state.inspected.includes(o.id))
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.id} · {o.title}
                        </option>
                      ))}
                  </select>
                </label>
              </section>
            );
          })}
        </div>
        <p className={s.previewLegend} role="status">
          {hover
            ? `${hover.lane.toUpperCase()} → ${{ R: "Dev", S: "Ines", B: "Compromise", D: "Leave for later" }[hover.res]}. The faint needles show your complete projected plan.`
            : picked
              ? `${picked.toUpperCase()} token lifted. Tap a socket, or use arrow keys and Enter.`
              : "Hover or focus a choice to preview the consequences. Changing a compromise returns its points and week."}
        </p>
        <div className={s.planFooter}>
          <span className={s.muted}>
            Three arguments. Five persuasion points.
          </span>
          <GuardControl
            label="Review and lock the plan"
            disabled={busy || board.lanes.some((l) => !state.lanes[l.id].res)}
            onCommit={() => {
              preview();
              setConfirm(true);
            }}
          />
        </div>
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Before you lock the plan"
        size="lg"
      >
        <div className={`${s.game} ${s.planSummary}`}>
          <p className={s.kicker}>YOU CHOSE</p>
          <ul>
            {board.lanes.map((l) => (
              <li key={l.id}>
                <strong>{l.id === "learning" ? "Confirmation" : l.name}</strong>
                <span>
                  {
                    {
                      R: "Dev",
                      S: "Ines",
                      B: "Compromise (−2 persuasion, −1 week)",
                      D: "Leave for later",
                    }[state.lanes[l.id].res || "D"]
                  }
                </span>
              </li>
            ))}
          </ul>
          <h3>Projected consequences</h3>
          <div className={s.summaryMetrics}>
            {(["rob", "sw", "runway", "ready", "align"] as const).map((key) => (
              <span key={key}>
                {
                  {
                    rob: "Robotics resentment",
                    sw: "Software resentment",
                    runway: "Runway",
                    ready: "Readiness",
                    align: "Team alignment",
                  }[key]
                }
                <b>
                  {state[key] - project.initial[key] > 0 ? "+" : ""}
                  {state[key] - project.initial[key]}
                  {key === "runway" ? " weeks" : ""}
                </b>
              </span>
            ))}
          </div>
          <p className={s.muted}>
            These changes are relative to the start of the case. Locking carries
            this plan and the team’s response into the next chapter.
          </p>
          <div className={s.row}>
            <button className={s.button} onClick={() => setConfirm(false)}>
              Change something
            </button>
            <button
              className={s.brassButton}
              disabled={busy}
              onClick={() => {
                setConfirm(false);
                dispatch({ type: "LOCK_PLAN" });
              }}
            >
              Lock it →
            </button>
          </div>
        </div>
      </Dialog>
      <div className={s.castRow}>
        <Avatar
          person="Dev"
          mood={
            state.rob >= 60 ? "tense" : state.rob <= 40 ? "pleased" : "neutral"
          }
        />
        <Avatar person="Mara" />
        <Avatar
          person="Ines"
          mood={
            state.sw >= 60 ? "tense" : state.sw <= 40 ? "pleased" : "neutral"
          }
        />
      </div>
    </>
  );
}
