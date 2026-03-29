"""Persistence helpers for signal rows."""

from database import supabase


def persist_signals(signals: list[dict]) -> int:
    """Persist signals with upsert when available, fallback to insert if schema is behind."""
    if not signals:
        return 0

    try:
        supabase.table("signals").upsert(
            signals,
            on_conflict="company,signal_type,headline",
        ).execute()
        return len(signals)
    except Exception as exc:
        message = str(exc)
        if "42P10" in message and "ON CONFLICT" in message:
            print("[signal_store] missing unique constraint for signal upsert; falling back to insert")
            try:
                supabase.table("signals").insert(signals).execute()
                return len(signals)
            except Exception as insert_exc:
                print(f"[signal_store] fallback insert failed: {insert_exc}")
                return 0

        print(f"[signal_store] persist failed: {exc}")
        return 0
