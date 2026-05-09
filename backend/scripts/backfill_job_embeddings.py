"""
Backfill missing semantic job embeddings for active job listings.

Usage:
    cd backend && .venv/bin/python scripts/backfill_job_embeddings.py

This script mutates the configured database by filling `vector_embedding`
for active, non-deleted jobs where the field is currently null.
"""

from sqlmodel import Session, select

from core.database import engine
from models.job_listings import JobListing
from services.machines.job_matching import job_matching_service


def main() -> int:
    if job_matching_service.model is None:
        status = job_matching_service.get_runtime_status()
        print(f"FAILED: semantic matcher unavailable: {status['last_load_error']}")
        return 1

    scanned = 0
    updated = 0
    skipped = 0
    failed = 0

    with Session(engine) as session:
        jobs = session.exec(
            select(JobListing).where(
                (JobListing.is_active == True)
                & (JobListing.is_deleted == False)
                & (JobListing.vector_embedding == None)
            )
        ).all()

        for job in jobs:
            scanned += 1
            text_to_embed = f"{job.title} {job.description} {job.requirements or ''}"
            try:
                embedding_bytes = job_matching_service.generate_and_serialize(text_to_embed)
                if embedding_bytes is None:
                    skipped += 1
                    continue
                job.vector_embedding = embedding_bytes
                session.add(job)
                updated += 1
            except Exception as exc:
                failed += 1
                print(f"FAILED job {job.id} ({job.title}): {exc}")

        session.commit()

    print(
        f"scanned={scanned} updated={updated} skipped={skipped} failed={failed}"
    )
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
