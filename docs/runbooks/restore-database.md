# Restore database from backup

**RTO target:** 4 hours  
**RPO target:** 24 hours (daily `pg_dump` → R2)

## Prerequisites

- Encrypted backup file from R2 (`onemore-backups/YYYY-MM-DD/onemore.sql.gz.gpg`)
- GPG decryption key on ops machine
- Maintenance window announced

## Steps

1. **Stop API** to prevent writes:
   ```bash
   docker compose -f docker/compose.prod.yml stop api web
   ```

2. **Decrypt backup** (example):
   ```bash
   gpg --decrypt onemore.sql.gz.gpg | gunzip > onemore.sql
   ```

3. **Drop and recreate database** (destructive):
   ```bash
   docker compose -f docker/compose.prod.yml exec postgres \
     psql -U onemore -c 'DROP DATABASE onemore WITH (FORCE);'
   docker compose -f docker/compose.prod.yml exec postgres \
     psql -U onemore -c 'CREATE DATABASE onemore;'
   ```

4. **Restore**:
   ```bash
   docker compose -f docker/compose.prod.yml exec -T postgres \
     psql -U onemore -d onemore < onemore.sql
   ```

5. **Run pending migrations** (if backup predates latest schema):
   ```bash
   docker compose -f docker/compose.prod.yml --env-file docker/.env.prod exec -T api sh < docker/scripts/migrate.sh
   ```

6. **Start services**:
   ```bash
   docker compose -f docker/compose.prod.yml up -d
   ```

7. **Verify**: health check, login, sample workout history row count.

## Notes

- GDPR export files on disk (`onemore_export_data` volume) are **not** in SQL dumps — restore separately if needed.
- Document incident in post-mortem template.
