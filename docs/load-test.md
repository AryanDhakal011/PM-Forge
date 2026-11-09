# Load-test status

No hosted production stack exists to load test. Realistic voice load at twice an agreed peak, regional network RTT, TURN/TLS, vendor 429s, agent memory/CPU headroom, cancellation/failover and actual billed cost are **not measured**. Unit tests across independent SQLite connections verify shared limits, not user capacity.

Owner: project owner plus deployment operator. Provision staging with explicitly approved spend, choose expected peak and a budget/time cap, use fictional licensed audio, record per-stage p50/p95, provider limits and errors, then disable admission after the run. Do not infer capacity from daily request quotas or mock tests. Keep raw answers out of operational reports.
