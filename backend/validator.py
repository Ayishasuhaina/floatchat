import re

# Strict SQL safety validator

FORBIDDEN_KEYWORDS = [
    r"\binsert\b",
    r"\bupdate\b",
    r"\bdelete\b",
    r"\bdrop\b",
    r"\balter\b",
    r"\bcreate\b",
    r"\btruncate\b",
    r"\breplace\b",
    r"\bgrant\b",
    r"\brevoke\b",
    r"\bmerge\b",
    r"\bexecute\b",
    r"\bexec\b",
    r"\bcall\b",
    r"\bunion\b",  # Restrict UNION to prevent potential injection combining
    r"\binto\b",
    r"\bload\b",
    r"\boutfile\b",
]

ALLOWED_TABLES = ["floats", "profiles", "measurements", "metadata_store"]


def validate_sql_query(query: str) -> tuple[bool, str]:
    """
    Validates a SQL query for safety.
    Returns (is_safe, error_message).
    """

    if not query:
        return False, "Query is empty"

    # Normalize whitespace and lowercase for parsing
    normalized = " ".join(query.strip().lower().split())

    # 1. Must be a SELECT query
    # CTEs are allowed if they start with WITH
    if not (normalized.startswith("select") or normalized.startswith("with")):
        return False, "Query must start with SELECT or WITH"

    # 2. Check for forbidden keywords/commands
    for kw_pattern in FORBIDDEN_KEYWORDS:
        if re.search(kw_pattern, normalized):
            # Fix: don't use a backslash-containing expression directly
            # inside an f-string.
            keyword = kw_pattern.replace(r"\b", "")
            return False, f"Forbidden keyword detected in query: {keyword}"

    # 3. Prevent database system catalog access
    # SQLite: sqlite_schema, sqlite_master, sqlite_temp_schema, sqlite_temp_master
    # PostgreSQL: pg_, information_schema
    catalog_patterns = [
        r"\bsqlite_",
        r"\bpg_",
        r"\binformation_schema\b",
    ]

    for cat_pattern in catalog_patterns:
        if re.search(cat_pattern, normalized):
            return False, "Access to system tables or metadata catalogs is forbidden."

    # 4. Table names validation
    # Extract table references by identifying words after FROM or JOIN
    table_refs = re.findall(
        r"\b(?:from|join)\s+([a-zA-Z0-9_\.]+)",
        normalized,
    )

    for table in table_refs:
        # Strip schema if any (e.g. public.measurements)
        table_name = table.split(".")[-1].strip("`\"'() ")

        # If it's not in the allowed table list, check whether
        # it is a CTE defined in the WITH clause.
        if table_name not in ALLOWED_TABLES:

            cte_definitions = re.findall(
                r"\bwith\s+([a-zA-Z0-9_]+)\s+as\b",
                normalized,
            )

            cte_definitions += re.findall(
                r",\s*([a-zA-Z0-9_]+)\s+as\b",
                normalized,
            )

            if (
                table_name not in cte_definitions
                and table_name not in ALLOWED_TABLES
            ):
                return (
                    False,
                    f"Unauthorized table access attempted: '{table_name}'. "
                    "Only 'floats', 'profiles', and 'measurements' may be queried.",
                )

    return True, "Query is safe"