-- 014: one-time codes a parent generates to link a child's phone.
CREATE TABLE device_pairing_codes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id    UUID        NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    parent_id   UUID        NOT NULL REFERENCES parents(id)  ON DELETE CASCADE,
    code        CHAR(6)     NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- A live (unused) code must be unique so a code identifies exactly one child.
CREATE UNIQUE INDEX uq_pairing_live_code ON device_pairing_codes (code) WHERE used_at IS NULL;
CREATE INDEX idx_pairing_child ON device_pairing_codes (child_id, created_at DESC);
