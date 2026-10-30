/** Operating pressure and available capacity have opposite directions. */
export function stakeholderSignal(
  variable: { bad: boolean; max: number },
  value: number,
) {
  const capacity = Math.max(
    0,
    Math.min(1, variable.bad ? 1 - value / variable.max : value / variable.max),
  );
  return {
    opacity: 0.35 + capacity * 0.65,
    label:
      capacity < 0.4
        ? "Guarded / capacity is constrained"
        : capacity > 0.7
          ? "Engaged / room for a commitment"
          : "Listening / trust is conditional",
  };
}
