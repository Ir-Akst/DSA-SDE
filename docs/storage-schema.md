# AlgoRecall 2.0 — Storage Schema & Persistence Specification

## 1. LocalStorage Key Namespaces

AlgoRecall uses prefix-scoped localStorage keys to prevent collisions and support multi-user profile isolation.

### Key Prefix Convention
- **Global / Unscoped**: `algorecall_<resource>`
- **User Scoped**: `algorecall_<userId>_<resource>` (Default fallback user is `default_user`)

### Standard LocalStorage Keys
| Storage Key | Type | Description |
| :--- | :--- | :--- |
| `algorecall_user_profile` | `Object` | Active user profile, theme, settings, and auth state. |
| `algorecall_problems_state` | `Object` | Master map of problem progress indexed by Problem ID. |
| `algorecall_srs_state` | `Object` | Leitner SRS cards, box levels, review schedules, history. |
| `algorecall_roadmap_progress` | `Object` | Dual-stream 120-day roadmap progression and stream completions. |
| `algorecall_mock_history` | `Array` | History of completed and active mock interview sessions. |
| `algorecall_quick_notes` | `Object` | User notes keyed by problem ID. |
| `algorecall_pilot_metrics` | `Object` | 28-day pilot validation checkpoints and metric history. |
| `algorecall_sync_queue` | `Array` | Pending mutations queued for cloud synchronization. |
| `algorecall_schema_version` | `Number` | Current data schema version (`2`). |

---

## 2. Entity Schemas

### 2.1 Problem State (`algorecall_problems_state`)
```json
{
  "two-sum": {
    "status": "solved",            // "unattempted" | "attempted" | "solved"
    "solvedAt": 1709424000000,     // Unix timestamp (ms)
    "firstSolvedAt": 1709424000000,
    "solveCount": 1,
    "lastAttemptAt": 1709424000000,
    "totalTimeSpentMs": 720000,
    "source": "curriculum",        // "curriculum" | "mock" | "revision" | "independent"
    "hintsUsed": 0,                // 0 = independent, >0 = assisted
    "notes": "Used hash map for O(n) one-pass solution."
  }
}
```

### 2.2 SRS Card State (`algorecall_srs_state`)
```json
{
  "cards": {
    "two-sum": {
      "problemId": "two-sum",
      "box": 2,                    // Leitner box 1 through 5
      "difficulty": "Easy",        // "Easy" | "Medium" | "Hard"
      "intervalDays": 3,
      "lastReviewed": 1709424000000,
      "nextReview": 1709683200000,
      "repetitionCount": 2,
      "lapses": 0,
      "history": [
        {
          "reviewedAt": 1709424000000,
          "rating": "Easy",
          "previousBox": 1,
          "newBox": 2
        }
      ]
    }
  }
}
```

### 2.3 Roadmap 120-Day Progress (`algorecall_roadmap_progress`)
```json
{
  "activeRoadmapId": "curriculum-120",
  "currentDay": 5,
  "completedDays": [1, 2, 3, 4],
  "days": {
    "1": {
      "streamACompleted": true,
      "streamBCompleted": true,
      "completedAt": 1709078400000
    }
  },
  "customTracks": []
}
```

### 2.4 Mock Interview Session (`algorecall_mock_history`)
```json
[
  {
    "id": "mock_1709500000_abc",
    "timestamp": 1709500000000,
    "track": "General SDE",
    "difficulty": "Medium",
    "timeAllocatedMin": 45,
    "timeSpentSec": 2100,
    "status": "completed",
    "score": 85,                   // Percentage (0-100)
    "analyticsScore": 17.0,        // Mapped /20 scale
    "problems": [
      {
        "id": "two-sum",
        "title": "Two Sum",
        "score": 90,
        "notes": "Optimal solution"
      }
    ]
  }
]
```

---

## 3. Schema Migrations (v1 to v2)

The `MigrationManager` module automatically detects schema versions upon application startup.

### Migration Step (v1 $\to$ v2):
1. **Deduplication & Canonical ID Normalization**:
   - Converts old numeric or slug formats into canonical kebab-case IDs.
2. **Dual-Stream Roadmap Schema**:
   - Upgrades single flat `completed` flags into `{ streamACompleted, streamBCompleted }`.
3. **SRS Interval Normalization**:
   - Upgrades legacy continuous multipliers into deterministic 5-stage Leitner intervals (1, 3, 7, 14, 30 days).
4. **Backup Creation**:
   - A complete snapshot of v1 data is archived to `algorecall_backup_v1_<timestamp>` prior to executing migrations.

---

## 4. Cloud Synchronization & OCC Versioning

For users signed into Supabase, the synchronization payload format is structured as follows:

```json
{
  "user_id": "uuid-v4-string",
  "client_version": 42,
  "last_synced_at": "2026-11-04T00:00:00Z",
  "payload": {
    "problems_state": { ... },
    "srs_state": { ... },
    "roadmap_progress": { ... },
    "mock_history": [ ... ],
    "user_profile": { ... }
  }
}
```

### OCC Conflict Resolution Algorithm
1. The remote database checks `payload.client_version === remote.version`.
2. If matched: remote writes payload and returns `version = remote.version + 1`.
3. If mismatch (`remote.version > payload.client_version`):
   - The remote payload is pulled to the client.
   - For every problem in `problems_state`, the entry with the highest `lastAttemptAt` or `solvedAt` is retained.
   - For SRS cards, the card with the highest `repetitionCount` or latest `lastReviewed` wins.
   - The merged state is assigned `version = remote.version + 1` and pushed back.

