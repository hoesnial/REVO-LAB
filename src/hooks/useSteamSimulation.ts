"use client";

import { useCallback, useEffect, useReducer } from "react";
import { SIMULATION } from "@/lib/simulation/simulationConstants";
import { applySteamAction, initialSteamState, stepSteam, type SteamAction, type SteamState } from "@/lib/simulation/steamEngine";

type SimulationUpdate = SteamAction | { type: "tick"; steps: number };

function reducer(state: SteamState, action: SimulationUpdate): SteamState {
  if (action.type !== "tick") return applySteamAction(state, action);
  let next = state;
  for (let i = 0; i < action.steps; i += 1) next = stepSteam(next, SIMULATION.fixedStep);
  return next;
}

export function useSteamSimulation(active = true) {
  const [state, update] = useReducer(reducer, undefined, initialSteamState);
  const dispatch = useCallback((action: SteamAction) => update(action), []);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let previous: number | null = null;
    let accumulator = 0;
    let disposed = false;

    const animate = (now: number) => {
      if (disposed) return;
      if (document.hidden) {
        previous = null;
        accumulator = 0;
      } else {
        if (previous !== null) {
          accumulator += Math.min((now - previous) / 1000, SIMULATION.maxFrameTime);
          const steps = Math.floor((accumulator + 1e-9) / SIMULATION.fixedStep);
          if (steps > 0) {
            accumulator -= steps * SIMULATION.fixedStep;
            update({ type: "tick", steps });
          }
        }
        previous = now;
      }
      frame = window.requestAnimationFrame(animate);
    };

    // Discard the background interval on both transitions. There is no catch-up
    // burst, resource consumption, or accidental mission completion in hidden tabs.
    const visibilityChanged = () => { previous = null; accumulator = 0; };
    document.addEventListener("visibilitychange", visibilityChanged);
    frame = window.requestAnimationFrame(animate);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [active]);

  return { state, dispatch };
}
