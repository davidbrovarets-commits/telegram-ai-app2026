# NEWS SYSTEM SNAPSHOT
- Generated at: 2026-02-12T19:47:11.075Z
- SUPABASE_URL host: `wbajyysqvkkdqsugupyj.supabase.co`
- ANON key present: `true`
- SERVICE key present: `true`

## 0) GitHub Actions (READ-ONLY status)
> Uses `gh` CLI if available. If not installed/authenticated, shows an error string.
- gh auth: `ERROR: Command failed: gh auth status -t`

### Workflows (list)
```
ERROR: Command failed: gh workflow list --all
'gh' is not recognized as an internal or external command,
operable program or batch file.

```

### Recent runs (top 25)
```
ERROR: Command failed: gh run list --limit 25
'gh' is not recognized as an internal or external command,
operable program or batch file.

```

## 1) News freshness & totals
- Total rows in news: **1213**

### Newest 5 by created_at
| id | status | image_status | created_at | published_at | scope | land | city | type | title |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1921 | POOL | placeholder | 2026-02-12T19:46:24.766304+00:00 | 2026-02-11T00:00:00+00:00 | COUNTRY | — | — | IMPORTANT | Німеччина посилює безбар'єрність |
| 1922 | POOL | placeholder | 2026-02-12T19:46:24.766304+00:00 | 2026-02-10T00:00:00+00:00 | COUNTRY | — | — | INFO | Німеччина та Молдова посилюють співпрацю у соціальній сфері |
| 2167 | POOL | placeholder | 2026-02-12T19:46:24.766304+00:00 | 2026-02-10T19:03:07+00:00 | COUNTRY | — | — | FUN | Замок Бланкенхайн святкує: подвійний ювілей музею |
| 2204 | POOL | placeholder | 2026-02-12T19:46:24.766304+00:00 | 2026-02-12T10:43:12+00:00 | STATE | Thüringen | — | FUN | Карнавал 2026 у Тюрингії: що очікувати |
| 1923 | POOL | placeholder | 2026-02-12T19:46:24.766304+00:00 | 2026-02-10T00:00:00+00:00 | COUNTRY | — | — | INFO | Програма "MY TURN": Новий етап підтримки для жінок-мігранток |

### Oldest 5 pending (status POOL/ACTIVE and image_status != generated)
| id | status | image_status | attempts | last_attempt | created_at | scope | land | city | type | title |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1543 | POOL | placeholder | 0 | — | 2026-02-05T21:01:31.204988+00:00 | COUNTRY | — | — | INFO | [UA Mock] Ukraine-Krieg: Selenskyj erwartet nächste Gesprächsrunde in den USA |
| 1629 | POOL | placeholder | 0 | — | 2026-02-05T21:24:52.789519+00:00 | COUNTRY | — | — | FUN | [UA Mock] DSV-Sportchef Maier über Olympia: „Emma hat jetzt noch die Leichtigkeit des Seins“ |
| 1598 | POOL | placeholder | 0 | — | 2026-02-05T21:24:52.789519+00:00 | COUNTRY | — | — | INFO | Призначено нового голову ключового відомства соцзабезпечення Німеччини |
| 1577 | POOL | placeholder | 0 | — | 2026-02-05T21:24:52.789519+00:00 | COUNTRY | — | — | INFO | Ринок праці Німеччини під тиском: що це означає для українців? |
| 1602 | POOL | placeholder | 0 | — | 2026-02-05T21:24:52.789519+00:00 | COUNTRY | — | — | FUN | [UA Mock] Jugendhilfe: Wohngruppe in Bremen für kriminelle und gewalttätige Jugendliche |

## 2) Distributions (status/scope/type/geo)

### status (sample last 5000)
| status | count |
| --- | --- |
| POOL | 1000 |

### image_status (sample last 5000)
| image_status | count |
| --- | --- |
| placeholder | 961 |
| generated | 25 |
| failed | 14 |

### scope (sample last 5000)
| scope | count |
| --- | --- |
| COUNTRY | 697 |
| CITY | 250 |
| STATE | 53 |

### type (sample last 5000)
| type | count |
| --- | --- |
| FUN | 603 |
| INFO | 266 |
| IMPORTANT | 131 |

## 3) Image-only policy violations (should be ZERO in UI)
- generated BUT image_url IS NULL: **0**
- ACTIVE BUT image_status != generated: **0**

## 4) Backlog & retry health
- Pending items (POOL/ACTIVE and not generated): **1188**

### image_generation_attempts histogram (sample last 5000 pool/active)
| attempts | count |
| --- | --- |
| 0 | 925 |
| 1 | 42 |
| 2 | 9 |
| 3 | 24 |

## 5) Storage sanity (sample HEAD checks)
| id | head_ok | status | image_url (truncated) |
| --- | --- | --- | --- |
| 1873 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1872 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1875 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1874 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1877 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1881 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1895 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1893 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1896 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |
| 1880 | OK | 200 | https://wbajyysqvkkdqsugupyj.supabase.co/storage/v1/object/public/images/news/18… |

## 6) User state sanity (optional)
- Example userId: `aca0c6e9...`
- user_news_states: none for this user yet.

## 7) Heuristic conclusions (read-only)
- Newest created_at age: **1 min**
- If newest age is high and Actions are paused -> “no new news” is expected.
- Pending backlog > 0 + image_status not generated -> Image generator likely paused/stuck or failing.
- ACTIVE but not generated > 0 -> UI must NOT show them (image-only policy).
