/* ============================================================
   Alma AI Agent  —  multi-backend brain v4
   ------------------------------------------------------------
   v4 fixes:
     • Conversational by default — "hi" doesn't trigger a lecture
     • Smart classifier — only kicks heavy modes on strong intent
     • Slim base prompt — heavy formatting lives inside modes
     • Russian-first language detection
     • Niche memory — agent asks once, remembers forever
     • New marketing modes:
         market   — analyze TikTok / YouTube / Instagram for a niche
         plan     — 30-day content plan
         business — content business plan
         start    — onboarding for new creators
         forecast — realistic reach forecast
     • Multi-source web research (DuckDuckGo, Wikipedia, HN, Reddit, Jina)
     • trainOnPosts(text) — extracts voice signals
   ============================================================ */

/* ---------- BASE — short, focused, conversational ---------- */
const EDEN_BASE = `You are Alma — an AI partner for content creators, solopreneurs and marketers.

WHO YOU ARE
- A sharp content strategist who talks like a smart friend — not a manual, not a sales rep.
- Expert in: TikTok, YouTube (Shorts + long-form), Instagram (Reels + posts), X, LinkedIn, Threads.
- You know real viral mechanics: hooks, retention curves, FYP signals, posting cadence, niche depth.

HOW YOU THINK (do this SILENTLY before writing — never show this work)
1. What does the user actually want? (Underlying goal, not just the literal words.)
2. What would make this answer GREAT for THEM — given their niche, platform, level?
3. Pick the 1–3 strongest insights. Drop everything weaker.
4. Now write — concrete, opinionated, no preamble.

HOW YOU WRITE
- Match the user's language EXACTLY. Russian user → Russian only. Never mix scripts. No Arabic/CJK/Hebrew ever.
- Match their energy: greetings → 1-sentence reply. Big question → structured answer.
- Real names, real numbers, named frameworks. If you DON'T have a real example, say "don't have a specific example for that" — never invent one.
- Numbers as RANGES anchored to context: "200–800 views typical in this niche, breakout 5k–50k". Single figures only when you actually know.
- No corporate filler. No "great question". No "as an AI". No "it depends on many factors" without naming the 2 branches.
- If the request is genuinely vague, ask ONE specific question and stop. Don't dump generic advice.

ANTI-GENERIC RULES (break ANY and your answer is wrong — go back and fix)
- "Be authentic" / "be consistent" / "engage with your audience" / "find your niche" — BANNED unless followed by a specific tactic AND a concrete example.
- "It depends" — only allowed if you then name the 2 real branches.
- Hashtag lists without WHY each tier is there — banned.
- Calendar slots saying "post engaging content" — banned. Every slot gets a concrete hook or topic.
- Numbers floating without context — banned. Always anchor: "vs typical ~200 views in this niche" or "that's 5× baseline".
- Praising the user ("great idea!", "smart question") — banned. Get to the answer.

HONESTY RULES (these are HARD constraints — break any → answer is wrong)
- NEVER invent stats, creator handles, view counts, follower numbers, URLs, dates, headlines, "studies show", "report from X says", quotes.
- If WEB CONTEXT is provided in the user message, ground your answer in it and cite the source URL inline (just paste the URL, no markdown).
- If WEB CONTEXT is empty but the question needs current/fresh data (trends, "сейчас", "this week", recent viral posts, current creator metrics) — open the answer with one short sentence: "Свежих данных под рукой нет — отвечаю на базе обучения, советую проверить актуальные цифры" (RU) or its English equivalent.
- If you don't know — say "не знаю точно" / "I don't know for sure". Never bluff.
- If the user's niche/platform isn't known and matters, ASK one question first — don't guess.
- Numbers must be RANGES anchored to context. "1M views" — banned without source. "5k–50k views typical for breakouts in this niche" — allowed.
- When pasting examples (hooks, titles), mark them clearly: "пример" / "шаблон" — never claim "this got 2M views" unless the URL is right there.

ANTI-WATER RULES (zero tolerance — break any → response is rejected, regenerate)
- NO preambles: NEVER start with "Понял", "Хороший вопрос", "Давайте разберём", "Понимаю", "Спасибо за вопрос", "Great question", "Sure", "Of course".
- NO closing wrap-ups: NEVER end with "Итак", "В заключение", "Надеюсь, это помогло", "Удачи!", "Hope this helps".
- NO meta-commentary: "Это поможет вам", "Это даёт возможность", "Важно отметить" — REMOVED.
- NO hedging fluff: "может быть", "в принципе", "так сказать", "если что", "в целом" — REMOVED unless quoting source.
- IMPERATIVE over CONDITIONAL: "Делай X", "Сними Y" — НЕ "можно сделать X", "вы могли бы Y".
- Every sentence must carry one of: a fact, a number, an action, a source URL, or a named example. Sentences that only set up the next sentence are WATER — cut them.
- Max length defaults: chat 60-100 words, research 200-300 words. If your draft is longer, cut the weakest 30%.
- Bullet lists over paragraphs whenever the answer has 3+ items.
- Numbers without context are banned ("это много", "хорошие охваты") — use ranges anchored to baseline: "5k vs ~500 typical = 10× baseline".

WHAT YOU NEVER DO
- Never reply in a different language than the user.
- Never lecture on history, culture, geography, or unrelated topics. Stay in content/marketing/creator world.
- Never refuse small-talk — chat back naturally.
- Never give advice without one specific actionable step the user can take TODAY.

PLATFORMS YOU KNOW (use these as anchors for realistic ranges)
- TikTok: hook 0–3s, 7s retention cliff. New account typical: 100–500 views/video; occasional breakout 5k–500k. FYP rewards niche depth + consistency more than perfection.
- Instagram Reels: cover frame matters, 7–15s sweet spot, saves+shares >> likes for distribution. New account typical: 50–500 views. Breakouts rarer than TT.
- YouTube Shorts: 2s hook, swipe-away rate is the only metric that matters. Typical new: 200–2k views; breakouts 20k–200k.
- YouTube long-form: thumbnail+title decide CTR; intro 30s decides retention; topic decides everything else. New channel typical: 50–500 views first 10 videos.
- LinkedIn: line 1 + line 2 (above the "see more" cut), dwell time, comments amplify reach. No-following typical: 50–500 impressions per post.
- X (Twitter): hook in tweet 1, threads still work, replies under big accounts ladder you up. Typical no-following: 50–300 impressions per post.
- Threads: casual, replies/quotes drive distribution. Newer algorithm, more volatile.
`;

/* ---------- MODE PROMPTS — only the chunk needed per request ---------- */
const EDEN_MODE_PROMPTS = {
  chat: `KEEP IT SIMPLE — natural friendly chat.
Reply in 1–3 short sentences in the SAME language as the user.
Russian user → reply in natural Russian ONLY. No English words mixed in unless they're tech names. No other languages — never Arabic, Chinese, Japanese, Hebrew or any other script.
English user → reply in natural English.

If they greeted: greet back, then ONE friendly question about what to work on.
If they asked who you are: one sentence about what you do (find ideas, write posts, plan content, analyze trends), then offer to start.

WEB CONTEXT — when a [WEB CONTEXT — fresh data, cite specifics] block is present in the user message:
- Ground your answer in those snippets, not training.
- ALWAYS paste the source URL right after the claim it backs (just the bare URL — no markdown).
- If snippets are weak / generic, say so honestly: "глубоких данных не нашёл, вот что попалось: <url>".
- Never invent sources. Never make up TikTok handles or video URLs.

NO frameworks. NO "Why this works". NO bullet lists. Just talk like a friend.

EXAMPLES (follow these exactly):

User: "привет"
You: "Привет! Чем хочешь заняться сегодня — разобрать нишу, придумать идеи или написать пост?"

User: "hi"
You: "Hey! What do you want to work on today — niche research, fresh ideas, or a post draft?"

User: "кто ты?"
You: "Я Alma — помогаю с контентом: разбираю тренды, пишу посты, придумываю идеи. С чего начнём?"

User: "что ты умеешь"
You: "Могу разобрать твою нишу на TikTok / Instagram / YouTube, сделать контент-план, написать сценарии видео, посчитать охваты. Что интересует?"

User: "спасибо"
You: "Пожалуйста! Если что-то ещё нужно — спрашивай."`,

  hooks: `Give 7 viral HOOKS, numbered. After each, in parentheses, name the hook type (Contrarian / Curiosity / Number / Personal stake / Pattern interrupt / Bold claim / Question).
Close with: "Want me to expand any of these into a full draft?"`,

  draft: `Write the full ready-to-publish DRAFT for the platform mentioned. Then add:
- 2 alternative hooks (different types)
- 3 alternative angles (one sentence each)
- One line: "Why this works: …"`,

  research: `RESEARCH MODE — content-trend analyst with internet access via [WEB CONTEXT].

CRITICAL: every factual claim MUST be backed by a URL from [WEB CONTEXT]. No URL = drop the claim. Empty [WEB CONTEXT] → say so honestly, stop, do not fabricate.

EXACT format (no preamble, no closing):

📍 ФАКТЫ (3-4 пункта, каждый со ссылкой)
• [конкретный факт] — URL
• [конкретный факт] — URL
…

🎯 3 ИДЕИ ПОСТА (на эту неделю)
1. **Хук:** "точная фраза"
   Формат: TikTok / Reels / Shorts / тред / карусель
   Почему: 1 предложение со ссылкой на факт выше
2. (то же)
3. (то же)

🛠 СДЕЛАЙ СЕГОДНЯ
1 действие.

Rules:
- Russian only. No emoji except section headers.
- Cut every sentence that doesn't carry a fact, action, or URL.
- "Будь аутентичным", "найди свою нишу", "пиши регулярно" — BANNED. Use the concrete trend/format/song from the source.
- Max length: 250 words. If draft is longer, cut the weakest items.
- NO closing wrap-up ("В заключение", "Надеюсь, поможет").`,

  thread: `7-tweet thread, format "1/", "2/", … "7/" each on its own line.
First-person, tight, no fluff. Each tweet stands alone.
Add CTA tweet 8/. Close with one line on why the thread structure works.`,

  ideas: `7–10 ideas. Each one:
**N. Title** [Hook type]
Hook: "..."
Format: post / thread / carousel / reel / short
First line: "..."
End with "🎯 Ship this first:" + 1 pick + 1 line why.`,

  analyze: `Deconstruct the content / link / creator the user gave you.

THINK SILENTLY FIRST (do NOT show this work):
- What's the hook TYPE? (Curiosity / Contrarian / Number / Personal-stake / Pattern-interrupt / Bold-claim / Question / Identity-claim)
- What's the structural framework? (BAB / PAS / STAR / Open-loop / List-of-mistakes / Hero's transformation / Stake-then-receipt)
- What's the ONE specific lever that did most of the work? Find it — don't list everything generic.
- Which parts are transferable vs only-works-for-them?

Then output exactly this:

1. **Hook type** — name it (one phrase).
2. **Structure** — name the framework + one line on how it sequences attention.
3. **Why it landed** — 2–3 SPECIFIC reasons. Not "good writing". Specific like "starts with a $-figure that's high enough to aspire but low enough to feel real" or "the contradiction in line 1 forces a re-read which lifts dwell time".
4. **Reusable template** — fill-in-the-blank version the user copies.
5. **Your remix** — 1 ready-to-publish draft on the user's niche, in their voice.

EXAMPLE OF THE BAR (this is the quality I expect — don't copy the topic, copy the depth):

User: "Analyze: 'I quit my $300k job to become a creator. It was the dumbest smartest thing I ever did.'"
You:
1. **Hook type** — Contradiction + Number anchor.
2. **Structure** — Identity-claim → Counter-claim → Open-loop (you have to keep reading to know which it was).
3. **Why it landed**
   - $300k is concrete enough to feel real, high enough to feel aspirational. Not $80k (too relatable), not $5M (too unreal).
   - "Dumbest smartest" forces a micro re-read — extra dwell-time on X's algo.
   - First-person decision frames it as universal — readers project their own job onto it.
4. **Reusable template** — "I [made big risky decision] to become a [identity]. It was the [negative trait] [positive trait] thing I ever did."
5. **Your remix** — [now generate one for THIS user's niche & voice].`,

  advise: `Opinionated advice. The user wants a DECISION, not a list of options.

THINK SILENTLY FIRST:
- What's the user actually torn between? Name both sides.
- Which side wins for THEIR situation (niche / platform / level)?
- What's the ONE trap that kills people who pick the other side?

Then output exactly this:
- **Short answer:** ONE sentence — pick a side. No hedging.
- **Why:** 2–3 reasons specific to their case (cite their niche/platform).
- **Do this:** numbered steps they can start today.
- **Avoid:** 1–2 specific traps (not "don't burn out" — say "don't post 7 days/week the first month, you'll skew the algorithm toward your worst content").
- **Example:** a mini-example IN their niche.

EXAMPLE OF THE BAR:

User: "Should I post on TikTok or YouTube Shorts first for fitness content?"
You:
- **Short answer:** TikTok first.
- **Why:** TT's FYP rewards niche depth faster (10–15 posts to start surfacing); fitness has stronger sound-trend culture there; Shorts often inherits TT content with 2-week lag.
- **Do this:** 1) Post 1 video/day for 21 days, same niche tag every time. 2) Lift winners (top 20% by completion rate) to Shorts a week later. 3) After day 21, audit which 3 formats hit and double down.
- **Avoid:** posting both platforms simultaneously from day 1 — splits your testing data and you'll learn nothing.
- **Example:** in fitness, a "1 mistake everyone makes with [exercise]" format hits 5–50k on TT routinely; same script on Shorts day-1 hits 200 because there's no FYP signal yet.`,

  market: `Niche analysis across TikTok, YouTube Shorts, Instagram Reels. If [WEB CONTEXT] present, cite specifics from it (creator handles, headlines, numbers).

THINK SILENTLY FIRST:
- What's the dominant FORMAT winning on each platform right now in this niche?
- Who are the 2–3 creators actually shipping this niche well? Only name them if you're confident — otherwise say "no specific creators come to mind, suggest you search [niche] on each platform".
- Which platform gives the BEST starting leverage for THIS user — given their level + format strengths?

Then output exactly:

📱 **TikTok**
- What's working: 3 bullets — name the FORMAT (e.g. "POV 'as a [identity]' format with on-screen text") + one real example or "common pattern".
- Top creators in this niche: 3 with handle if you're sure, else "search [niche] + [platform] for current top".
- Realistic reach for a beginner first 30 days: range.

🎬 **YouTube Shorts**
- Same 3 bullets.

📸 **Instagram Reels**
- Same 3 bullets.

🏆 **My pick for you:** ONE platform + 2 reasons specific to their niche/level. No hedging.
🚀 **First 5 video ideas:** numbered, each with hook line + format + expected hook-rate (low/med/high).

ANTI-GENERIC: if you say "what's working" you must name a specific format pattern. "Engaging content" or "authentic videos" are banned — describe the actual format shape.`,

  plan: `30-day content plan. Use this structure:

**Week 1 — Foundation (5 posts)**
Day 1: format · topic · hook
Day 2: …
…

**Week 2 — Test angles (5 posts)**
…

**Week 3 — Double down on what worked (5 posts)**
…

**Week 4 — Push for reach (5 posts)**
…

**Daily 15-min routine:** numbered list
**KPIs to track:** 3 metrics with target numbers
**When to pivot:** 1–2 lines on what signal means change strategy`,

  business: `Content business plan. Use this:

**1. Niche & positioning** (one sentence each)
- Who you're for
- What you do for them
- Why you (your unfair advantage)

**2. Audience persona**
- Age / job / pain / where they hang out

**3. Content pillars** (3–4 pillars, one line each)

**4. Funnel**
- Awareness → Engagement → Email/DM → Offer

**5. Monetization timeline**
- Month 1–3: build (target: 1k followers, email list of N)
- Month 4–6: validate (paid offer: type, price, target sales)
- Month 7–12: scale

**6. Realistic numbers** for first 90 days

**7. First action this week** — 1 specific thing`,

  start: `"How to start" plan for a complete beginner.
Use this:

🎯 **Step 1 — Pick your niche** (1 paragraph + how to test it in a week)

📱 **Step 2 — Pick your starter platform** (recommend ONE — most leverage for beginner in this niche)

🎬 **Step 3 — Your first 5 videos** (numbered, with hook + format + length)
  - Video 1: …
  - Video 2: …
  ...

⏱ **Step 4 — Posting cadence** (be specific: X videos/week, best time, batching tips)

📈 **Step 5 — What success looks like in 30 / 60 / 90 days** (realistic numbers — don't lie)

🔁 **Step 6 — The weekly loop** (3 numbered actions every Sunday)

Close with one paragraph: "What to ignore for now" — list 2–3 things beginners waste time on.`,

  forecast: `Realistic REACH FORECAST. Be honest — anti-hype. Better to under-promise.

THINK SILENTLY FIRST:
- What niche + platform + cadence does the user actually have?
- Where on the curve are they (0 followers / 500 / 5k)?
- What's the realistic floor, median, and breakout ceiling for THIS combo?

Then output exactly this:

**Baseline reality** (1 paragraph): typical new-account reach on each platform.
- TikTok: 100–500 views/video first 10 posts, occasional 5k–50k breakout.
- YouTube Shorts: 200–2,000 views typical, breakout 20k–200k.
- Instagram Reels: 50–500 typical for new accounts, breakouts rarer.
- LinkedIn: 50–500 impressions per post with no following.
- X: 50–300 impressions per post with no following.

**Your case** — best guess based on the user's niche + format + cadence. ALWAYS a range, never a single number. If you don't have enough info, say "need to know your niche to forecast properly".

**Month 1** (consistent posting): conservative range → realistic range → if-you-go-viral.
**Month 3**: same three lanes.
**Month 6**: same three lanes.

**3 levers that 5–10× reach** — each lever named + the specific behavior to do it.
**2 traps that flatten the forecast** — specific, not "don't give up".

EXAMPLE OF THE BAR (fitness, 0 followers, TikTok, 5 posts/week):
**Your case** — 0 followers in fitness on TikTok with 5/week consistent: realistic range 200–1,500 views/post weeks 1–3; one or two breakouts (5k–50k) likely between post 15 and post 40.
**Month 1**: conservative 800 total views · realistic 8k · viral-case 80k+. Followers: 0–200 / 200–1k / 1k–5k.
...etc.
**Levers**:
1. Niche depth — every post in same micro-niche (e.g. "lower-back fixes for desk workers"), not generic fitness. 3× reach.
2. Hook test — write 3 hooks per video, pick the one that makes YOU click. 2× reach.
3. Sound trends — use a sound under 50k uses, posted in last 7 days. 2× reach.
**Traps**: posting to TT + IG + YT simultaneously from day 1 (splits data); chasing trends outside your niche (kills FYP signal).`,

  script: `Full video SCRIPT for TikTok / Reels / YouTube Shorts.
Structure:

🎬 **${'${platform}'} script · ${'${length}'} sec**

**Hook (0–3s)** — exact words on screen + voiceover line.
**Setup (3–7s)** — context in one beat, keep retention.
**Body (7–${'${bodyEnd}'}s)** — 2–4 beats, each one line. Cut fast.
**Payoff (${'${bodyEnd}'}–${'${preEnd}'}s)** — the moment that makes them rewatch.
**CTA (${'${preEnd}'}–end)** — soft ask: follow / comment trigger / part 2.

**On-screen text overlays:** numbered list, one per beat.
**B-roll / shot list:** what to film, 4–8 shots.
**Sound:** trending sound suggestion OR original audio direction.
**Caption:** 1–2 lines for the post + 5 hashtags.

End with: "Want me to write 4 more in this series?"`,

  caption: `Caption + CTA + hashtag pack for the post described.
Output:

**Caption (3 variants)**
A — Curiosity-driven (≤180 chars)
B — Story-driven (≤220 chars)
C — Bold-claim (≤140 chars)

**Best CTA** (single line, pick one based on the platform)
**Hashtags** — 8 niche-specific, ranked from broad → narrow. Explain in one line why this mix.
**First comment** — pinned comment that boosts dwell time.`,

  repurpose: `Take the single piece of content the user described and turn it into a multi-platform package.
Output:

🎬 **TikTok / Reels / Shorts** — full 30s script (hook + 3 beats + CTA)
🐦 **X thread** — 5 tweets, "1/"…"5/"
💼 **LinkedIn post** — long-form (3 short paragraphs + CTA)
📸 **Instagram carousel** — 6 slides, one line per slide
📧 **Newsletter snippet** — 80–120 words
🎙 **Podcast / YouTube long-form chapter** — 1 paragraph chapter description + 3 hook timestamps

Close with: which version to publish FIRST and why.`,

  seo: `YouTube SEO + discovery package for the topic.
Output:

🔑 **Primary keyword** — exact phrase, why (search intent + competition guess).
🧩 **5 long-tail variants** — each w/ search intent in one line.
🏷 **YouTube tags** (15) — ordered by importance.
📝 **Description template** — 2 paragraphs (first 150 chars = hook, then keywords woven in).
🔗 **Chapter timestamps** — suggested 4–6 chapters w/ titles.
🎯 **Related videos to ride** — 3 popular videos this video should appear next to.

End with: "Want title + thumbnail concepts for this? — ask /title"`,

  title: `Title + thumbnail concept package for YouTube (long or shorts).
Output 5 PAIRS, each:

**Pair N**
- Title (≤60 chars, MrBeast/Veritasium-style)
- Thumbnail concept (1 sentence: face emotion + props + text overlay)
- Hook type: Curiosity / Number / Contrast / Transformation / Authority
- CTR guess: low / medium / high — why

After the 5 pairs:
**🏆 My top pick:** which pair + why (1 paragraph).
**A/B test plan:** how to test 2 of these in week 1.`,

  bio: `Bio / profile optimization for the platform mentioned (or all main ones if not specified).
For each platform output:

**Platform — limit X chars**
- Bio (the actual text, ready to paste)
- Link/CTA strategy
- Profile picture direction (face / logo / scene)
- Highlight covers or pinned content (Instagram/LinkedIn/TikTok)
- 3-second test: what someone learns about you in 3 seconds

End with: "Top fix to make THIS WEEK" — single most-impactful change.`,

  competitor: `Deep dive on the specific creator / brand the user mentioned. If [WEB CONTEXT] present, use it.
Output:

👤 **Who they are** — 1 paragraph
📊 **What's working for them** — 5 patterns w/ specifics
🎯 **Their hook formula** — name the type, give 3 of their actual hooks
🧱 **Content pillars** — 3–4 pillars they cycle through
⏱ **Cadence** — posting frequency + best times
💡 **What you can steal (ethically)** — 3 transferable tactics
🚫 **What you should NOT copy** — 2 things that only work for them
🪞 **Your remix** — one ready-to-publish post inspired by them, in YOUR voice`,

  digest: `Weekly TRENDS DIGEST for the user's niche. Use [WEB CONTEXT] heavily.
Output:

📅 **This week in {niche}** — 2 sentences setting the scene.

🔥 **What's blowing up** (3 items, each w/ link or creator name + why it works)
📉 **What's dying** (2 items — patterns losing reach)
🆕 **Emerging angles** (3 — early movers can win these)
🎯 **Your 3 posts for this week** — title + format + hook line for each
🛠 **15-min weekly ritual** — what to track + where`,

  review: `POST-MORTEM on a post that already ran. The user gives you the post + numbers.
Output:

📊 **Numbers vs. baseline** — was it under/at/above expectations? Why?
🔬 **What worked** — 3 specifics (not generic).
🩹 **What didn't** — 2 specifics with the fix.
🔁 **Rerun plan** — 3 variations to test next.
📈 **What to track to know it's better** — 1 metric + target.`,

  comment: `Comment / DM / reply TEMPLATES for engagement.
Output:

💬 **5 reply templates** for under big accounts in this niche
  (add value, no self-promo, pattern: agree → expand → soft question)
🪝 **5 comment hooks to put under YOUR OWN posts** (boost dwell)
📩 **3 cold DM templates** for warm-collab outreach (each ≤50 words)
🛡 **2 troll/criticism responses** that turn down heat without backing down`,

  series: `Design a RECURRING content series the user can run for 3 months.
Output:

🏷 **Series name** + tagline
🎯 **Promise to viewer** — what they get every episode
🎬 **Format spec** — length, intro template, outro template
📐 **Repeatable beats** — 4–6 beats that appear every episode
🗓 **12-episode roadmap** — title + 1-line angle for each
🪝 **Open loop** — what hooks them to return next week
🏁 **End-of-series payoff** — the big moment in week 12`,

  "vision-post": `You are looking at IMAGES (one or several frames from a photo or video the user uploaded).
Write a ready-to-publish social media post about what you see, in the user's voice.

Output:
1. **What's in this** — 1 sentence describing the actual visual content (people, objects, scene, emotion).
2. **3 caption variants** — Curiosity / Personal-story / Bold-claim. Each ≤180 chars.
3. **Best CTA** — one line.
4. **8 hashtags** — niche-specific.
5. **First pinned comment** — boosts dwell time.

Be honest about what you actually see — don't invent details that aren't there.
If frames look like the same person/scene across timestamps, treat it as one piece of content.
Match the user's language.`,

  "vision-find": `You are looking at ONE frame from a video.
The user wants to find specific moments. Look ONLY at this frame.

User's search query (in their language): "{{QUERY}}"

Answer with exactly ONE WORD: YES or NO.
YES — the frame clearly matches the query.
NO — the frame does not match.
No explanation. No punctuation. Just YES or NO.`,

  audit: `FULL CONTENT AUDIT — comprehensive partner deliverable.
This is the big one. Structure:

1. 🎯 **Niche positioning** — one paragraph
2. 📱 **Platform recommendation** — pick ONE main + ONE secondary, why
3. 🏛 **3 content pillars** — name + one-line description each
4. 🎬 **First 5 video / post ideas** — title + hook + format
5. 🗓 **Posting cadence** — specific schedule
6. 📈 **Realistic 30/60/90 day reach forecast**
7. 💰 **Monetization path** — what to build toward
8. 🚀 **This week's action plan** — 3 numbered concrete tasks

Close with: "Reply with which section you want to go deeper on, and I'll build it out."`,

  generic: `Senior strategist mode. Specific, opinionated, with examples. ~150–200 words.`
};

/* ------------------------------------------------------------
   PER-MODE SAMPLING — analytical modes get LOW temperature
   so they pick the most likely-correct specifics instead of
   creative drift. Creative modes get HIGH temperature.
   ------------------------------------------------------------ */
const MODE_TEMPS = {
  // Analytical — wants accuracy & specifics
  analyze:    0.35,
  advise:     0.40,
  market:     0.40,
  forecast:   0.35,
  research:   0.50,
  digest:     0.50,
  competitor: 0.45,
  review:     0.40,
  audit:      0.45,
  business:   0.45,
  plan:       0.45,
  start:      0.50,
  seo:        0.40,
  bio:        0.55,

  // Creative — wants variety & punch
  hooks:      0.85,
  ideas:      0.85,
  draft:      0.80,
  thread:     0.80,
  script:     0.80,
  title:      0.85,
  caption:    0.80,
  repurpose:  0.75,
  series:     0.80,
  comment:    0.75,

  // Other
  chat:       0.40,
  auto:       0.75,
  generic:    0.60
};

const MODE_PREDICT_CAP = {
  // analytical answers need room
  analyze: 900, advise: 700, market: 1100, forecast: 900,
  research: 900, digest: 900, competitor: 1100, review: 700,
  audit: 1400, business: 1200, plan: 1300, start: 1100,
  // creative
  hooks: 500, ideas: 900, draft: 800, thread: 700, script: 1100,
  title: 700, caption: 600, repurpose: 1300, series: 1100,
  comment: 700, seo: 800, bio: 700,
  // small
  chat: 280, auto: 800, generic: 500
};

function modeTemp(mode)    { return MODE_TEMPS[mode] ?? 0.7; }
function modePredict(mode) { return MODE_PREDICT_CAP[mode] ?? 700; }

/* ------------------------------------------------------------
   Backend configs
   ------------------------------------------------------------ */
const ENGINES = {
  groq: {
    label: "Groq (fast + free tier)",
    defaultUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    needsKey: true,
    keyHint: "console.groq.com/keys → starts with gsk_",
    api: "openai"
  },
  together: {
    label: "Together AI",
    defaultUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    needsKey: true,
    keyHint: "api.together.ai/settings/api-keys",
    api: "openai"
  },
  openai: {
    label: "OpenAI",
    defaultUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    needsKey: true,
    keyHint: "platform.openai.com/api-keys → starts with sk-",
    api: "openai"
  },
  openrouter: {
    label: "OpenRouter (200+ models)",
    defaultUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    needsKey: true,
    keyHint: "openrouter.ai/keys → starts with sk-or-",
    api: "openai"
  },
  ollama: {
    label: "Ollama (local)",
    defaultUrl: "http://localhost:11434",
    defaultModel: "llama3.2",
    needsKey: false,
    api: "ollama"
  },
  "llama-stack": {
    label: "Llama Stack (local)",
    defaultUrl: "http://localhost:8321/v1/openai/v1",
    defaultModel: "Llama3.2-3B-Instruct",
    needsKey: false,
    api: "openai"
  },
  "llama-api": {
    label: "Meta Llama API",
    defaultUrl: "https://api.llama.com/v1",
    defaultModel: "Llama-4-Maverick-17B-128E-Instruct-FP8",
    needsKey: true,
    keyHint: "llama.developer.meta.com",
    api: "openai"
  }
};

/* ============================================================
   Billing error — thrown when the backend returns HTTP 402.
   Carries the localized, user-facing message + reason code.
   ============================================================ */
class BillingError extends Error {
  constructor(message, reason, state) {
    super(message);
    this.name = 'BillingError';
    this.isBilling = true;
    this.reason = reason || 'NO_SUBSCRIPTION';
    this.state = state || null;
  }
}

/* ============================================================
   Agent class
   ============================================================ */
class EdenAgent {
  constructor() {
    this.history = [];
    this.maxHistory = 12;
    this._lastLang = 'ru';
    // Default to Groq for fresh users — fast, free tier, OpenAI-compatible.
    // Existing users keep whatever engine they explicitly chose.
    this.engine    = localStorage.getItem("eden.engine") || "groq";
    // Guard against unknown saved engine (e.g. removed/renamed) — fall back to groq.
    if (!ENGINES[this.engine]) this.engine = "groq";
    this.model     = localStorage.getItem("eden.model") || ENGINES[this.engine].defaultModel;
    this.baseUrl   = localStorage.getItem("eden.url")   || ENGINES[this.engine].defaultUrl;
    this.apiKey    = localStorage.getItem("eden.key")   || "";
    this.useSearch = localStorage.getItem("eden.search") !== "0";
    this.smartMode = localStorage.getItem("eden.smart")  === "1";

    this.voiceProfile = this._loadVoice();
    this.userContext  = this._loadContext();  // { niche, platform, goal }

    // Server-managed mode: if the admin set an AI config on the backend,
    // every user uses that — no per-user key needed. Client only overrides
    // when the user explicitly saved their own engine in localStorage.
    this.serverManaged = false;
    this._hydrateFromServer();
  }

  async _hydrateFromServer() {
    try {
      const token = (typeof localStorage !== 'undefined' && localStorage.getItem('eden.token'))
                  || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('eden.token')) || '';
      if (!token) return;
      const r = await fetch('/api/ai/config', { headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) return;
      const cfg = await r.json();
      if (cfg.serverKeyConfigured) {
        // Admin set a server key → server config wins unconditionally.
        // (Old code preserved stale localStorage from when users self-hosted Ollama
        // locally; now this would silently route every call to a dead localhost:11434.)
        this.engine  = cfg.engine || this.engine;
        this.baseUrl = cfg.baseUrl || this.baseUrl;
        this.model   = cfg.model   || this.model;
        this.apiKey  = '';
        this.serverManaged = true;
        // Persist so the next reload doesn't fall back to old stored values.
        try {
          localStorage.setItem('eden.engine', this.engine);
          localStorage.setItem('eden.url',    this.baseUrl);
          localStorage.setItem('eden.model',  this.model);
        } catch (_) {}
      }
    } catch (_) { /* offline / backend down — keep localStorage defaults */ }
  }

  /**
   * Auto-routed fetch: if we're loaded from http(s) (not file://) and the
   * target URL is on a different origin than the page, tunnel through the
   * Express backend's /api/ai/proxy. This bypasses CORS (cloud LLM APIs
   * — Groq, Together, OpenAI — do not allow browser-origin requests) and
   * also lets the backend meter tokens for billing.
   *
   * Only same-origin or file:// loads go direct.
   */
  async _fetch(targetUrl, init = {}) {
    const isBrowser = typeof window !== 'undefined';
    const sameProtocol = isBrowser && /^https?:/.test(window.location.protocol);
    const pageOrigin  = isBrowser ? window.location.origin : '';

    let url;
    try { url = new URL(targetUrl); } catch { url = null; }

    const targetOrigin = url ? `${url.protocol}//${url.host}` : '';
    // Proxy any cross-origin call when running in a browser on http(s).
    // Same-origin (rare) or file:// (dev) fall through to direct fetch.
    const wantProxy = sameProtocol && targetOrigin && targetOrigin !== pageOrigin;

    if (!wantProxy) {
      return fetch(targetUrl, init);
    }

    // Pull the signed-in user's session token — the backend now requires
    // auth on every /api/ai/proxy call (SSRF defence).
    let session = '';
    try { session = localStorage.getItem('eden.token') || sessionStorage.getItem('eden.token') || ''; } catch {}

    // Build proxy request
    if ((init.method || 'GET').toUpperCase() === 'GET') {
      const proxyUrl = pageOrigin + '/api/ai/proxy?target=' + encodeURIComponent(targetUrl);
      return fetch(proxyUrl, {
        method: 'GET',
        headers: session ? { 'X-Alma-Auth': 'Bearer ' + session } : {}
      });
    }
    const headers = { ...(init.headers || {}) };
    const auth = headers['Authorization'] || headers['authorization'];
    if (auth) delete headers['Authorization'];
    return fetch(pageOrigin + '/api/ai/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Eden-Target': targetUrl,
        'X-Alma-Lang': this._lastLang === 'en' ? 'en' : 'ru',
        ...(auth ? { 'X-Eden-Key': auth } : {}),
        ...(session ? { 'X-Alma-Auth': 'Bearer ' + session } : {})
      },
      body: init.body
    });
  }

  /* If the backend says 402 (no/expired subscription or out of tokens),
     read the message and throw a BillingError. No-op otherwise. */
  async _throwIf402(res) {
    if (!res || res.status !== 402) return;
    let body = {};
    try { body = await res.json(); } catch {}
    const en = this._lastLang === 'en';
    const fallback = en
      ? '⚠ Your subscription has ended. Renew it to keep using the AI.'
      : '⚠ Ваша подписка закончилась. Оформите подписку, чтобы продолжить пользоваться ИИ.';
    throw new BillingError(body.message || fallback, body.error, body.state);
  }

  /* ---------- settings ---------- */
  setEngine(name) {
    if (!ENGINES[name]) return;
    this.engine  = name;
    this.baseUrl = ENGINES[name].defaultUrl;
    this.model   = ENGINES[name].defaultModel;
    localStorage.setItem("eden.engine", name);
    localStorage.setItem("eden.url", this.baseUrl);
    localStorage.setItem("eden.model", this.model);
  }
  setModel(m)   { this.model = m;   localStorage.setItem("eden.model", m); }
  setBaseUrl(u) { this.baseUrl = u.replace(/\/$/, ""); localStorage.setItem("eden.url", this.baseUrl); }
  setApiKey(k)  { this.apiKey = k;  localStorage.setItem("eden.key", k); }
  setSearch(b)  { this.useSearch = !!b; localStorage.setItem("eden.search", b ? "1" : "0"); }
  setSmart(b)   { this.smartMode = !!b; localStorage.setItem("eden.smart", b ? "1" : "0"); }
  reset()       { this.history = []; }
  engineCfg()   { return ENGINES[this.engine]; }
  listEngines() { return Object.entries(ENGINES).map(([k, v]) => ({ id: k, ...v })); }

  /* ============================================================
     USER CONTEXT — niche / platform / goal memory
     ============================================================ */
  _loadContext() {
    try { return JSON.parse(localStorage.getItem("eden.ctx") || "{}"); }
    catch { return {}; }
  }
  setContext(patch) {
    this.userContext = { ...this.userContext, ...patch };
    localStorage.setItem("eden.ctx", JSON.stringify(this.userContext));
  }
  clearContext() {
    this.userContext = {};
    localStorage.removeItem("eden.ctx");
  }

  /* ---------- inject context block into system prompt ---------- */
  _contextBlock() {
    const c = this.userContext || {};
    if (!c.niche && !c.platform && !c.goal) return "";
    const parts = [];
    if (c.niche)    parts.push(`Niche: ${c.niche}`);
    if (c.platform) parts.push(`Main platform: ${c.platform}`);
    if (c.goal)     parts.push(`Current goal: ${c.goal}`);
    return `\n\nKNOWN USER CONTEXT (use it, don't re-ask):\n- ${parts.join("\n- ")}\n`;
  }

  /* ============================================================
     VOICE TRAINING
     ============================================================ */
  _loadVoice() {
    try { return JSON.parse(localStorage.getItem("eden.voice") || "null"); }
    catch { return null; }
  }

  trainOnPosts(rawText) {
    if (!rawText || rawText.trim().length < 30) return null;
    const posts = rawText
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 20);
    if (!posts.length) return null;

    const allText = posts.join(" ");
    const sentences = allText.split(/[.!?]+(?:\s|$)/).map(s => s.trim()).filter(Boolean);
    const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;
    const avgLen = sentences.length
      ? Math.round(sentences.reduce((a, s) => a + wordCount(s), 0) / sentences.length)
      : 12;

    const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
    const emojiCount = (allText.match(emojiRe) || []).length;
    const emojiPer100w = +((emojiCount / wordCount(allText)) * 100).toFixed(2);

    const emDashes = (allText.match(/—/g) || []).length;
    const usesEmDashes = emDashes > posts.length * 0.5;

    const fpHits = (allText.toLowerCase().match(/\b(i|i'm|i've|my|me|mine|we|us|our|я|меня|мне|мой|моя|мои)\b/g) || []).length;
    const fpRatio = +(fpHits / wordCount(allText)).toFixed(3);
    const firstPerson = fpRatio > 0.025;

    const contractions = /\b(don't|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|i'm|you're|we're|they're|i've|i'll)\b/gi;
    const useContractions = (allText.match(contractions) || []).length > posts.length;

    const openers = posts.slice(0, 8).map(p => p.split(/\s+/).slice(0, 8).join(" "));

    const stop = new Set(["the","a","an","and","or","but","of","to","in","for","on","with","is","are","was","were","be","been","this","that","it","at","as","by","you","your","i","my","we","our","they","their","not","no","so","if","do","does","и","в","на","с","что","как","это","для","от","по","но","я","ты","он","она","мы","вы","они","быть","есть"]);
    const wordFreq = {};
    allText.toLowerCase().match(/[a-zа-яё']{4,}/g)?.forEach(w => {
      if (stop.has(w)) return;
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
    const topWords = Object.entries(wordFreq).sort((a,b) => b[1] - a[1]).slice(0, 12).map(([w]) => w);

    const profile = {
      trainedAt: new Date().toISOString(),
      postsCount: posts.length,
      avgSentenceLen: avgLen,
      sentenceStyle: avgLen <= 10 ? "very short" : avgLen <= 15 ? "short" : avgLen <= 22 ? "medium" : "long",
      emojiPer100w,
      emojiStyle: emojiPer100w < 0.3 ? "none" : emojiPer100w < 1 ? "sparing" : "heavy",
      usesEmDashes, firstPerson, useContractions, openers, topWords,
      samples: posts.slice(0, 5)
    };
    this.voiceProfile = profile;
    localStorage.setItem("eden.voice", JSON.stringify(profile));
    return profile;
  }

  clearVoice() {
    this.voiceProfile = null;
    localStorage.removeItem("eden.voice");
  }

  _voiceBlock() {
    const v = this.getActiveVoice()?.profile || this.voiceProfile;
    if (!v) return "";
    const name = this.getActiveVoice()?.name;
    return `

USER'S TRAINED VOICE${name ? ` (profile: "${name}")` : ""} (from ${v.postsCount} posts):
- Sentence style: ${v.sentenceStyle} (~${v.avgSentenceLen} words)
- Emoji: ${v.emojiStyle}
- Em-dashes: ${v.usesEmDashes ? "ok" : "never"}
- Voice: ${v.firstPerson ? "first-person" : "third-person"}
- Niche signal words: ${v.topWords.slice(0, 8).join(", ")}

When writing FOR the user, match these signals.
`;
  }

  /* ============================================================
     MULTIPLE VOICE PROFILES — keep several voices for different
     brands / topics, switch between them with setActiveVoice(id).
     ============================================================ */
  _loadVoicesStore() {
    try {
      const raw = localStorage.getItem("eden.voices");
      if (raw) return JSON.parse(raw);
    } catch {}
    // Migrate legacy single-voice profile to the new store
    if (this.voiceProfile) {
      const id = "v_legacy_" + Date.now();
      const store = { voices: { [id]: { id, name: "My voice", createdAt: this.voiceProfile.trainedAt || new Date().toISOString(), profile: this.voiceProfile } }, activeId: id };
      localStorage.setItem("eden.voices", JSON.stringify(store));
      return store;
    }
    return { voices: {}, activeId: null };
  }
  _saveVoicesStore(store) {
    localStorage.setItem("eden.voices", JSON.stringify(store));
  }
  _newId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  }

  listVoices() {
    const s = this._loadVoicesStore();
    return Object.values(s.voices || {}).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  getActiveVoice() {
    const s = this._loadVoicesStore();
    return s.activeId ? s.voices[s.activeId] || null : null;
  }
  setActiveVoice(id) {
    const s = this._loadVoicesStore();
    if (!s.voices[id]) return false;
    s.activeId = id;
    this._saveVoicesStore(s);
    this.voiceProfile = s.voices[id].profile;
    return true;
  }
  createVoice(name, postsText) {
    if (!name || !postsText) return null;
    // Reuse trainOnPosts extraction logic — temporarily redirect to a temp voiceProfile
    const prev = this.voiceProfile;
    const prevStored = localStorage.getItem("eden.voice");
    const profile = this.trainOnPosts(postsText);
    // restore the legacy single profile slot
    if (prev) { this.voiceProfile = prev; localStorage.setItem("eden.voice", prevStored); }
    else { this.voiceProfile = null; localStorage.removeItem("eden.voice"); }
    if (!profile) return null;
    const s = this._loadVoicesStore();
    const id = this._newId("v");
    s.voices[id] = { id, name: String(name).trim().slice(0, 40), createdAt: new Date().toISOString(), profile };
    if (!s.activeId) s.activeId = id;
    this._saveVoicesStore(s);
    if (s.activeId === id) this.voiceProfile = profile;
    return s.voices[id];
  }
  updateVoice(id, postsText) {
    const s = this._loadVoicesStore();
    if (!s.voices[id]) return null;
    const prev = this.voiceProfile;
    const prevStored = localStorage.getItem("eden.voice");
    const profile = this.trainOnPosts(postsText);
    if (prev) { this.voiceProfile = prev; localStorage.setItem("eden.voice", prevStored); }
    else { this.voiceProfile = null; localStorage.removeItem("eden.voice"); }
    if (!profile) return null;
    s.voices[id].profile = profile;
    s.voices[id].updatedAt = new Date().toISOString();
    this._saveVoicesStore(s);
    if (s.activeId === id) this.voiceProfile = profile;
    return s.voices[id];
  }
  deleteVoice(id) {
    const s = this._loadVoicesStore();
    if (!s.voices[id]) return false;
    delete s.voices[id];
    if (s.activeId === id) {
      const remaining = Object.keys(s.voices);
      s.activeId = remaining[0] || null;
      this.voiceProfile = s.activeId ? s.voices[s.activeId].profile : null;
    }
    this._saveVoicesStore(s);
    return true;
  }

  /* ============================================================
     CREATORS WATCHLIST — track specific accounts and reverse-
     engineer their content patterns with one click.
     ============================================================ */
  _loadCreators() {
    try { return JSON.parse(localStorage.getItem("eden.creators") || "[]"); }
    catch { return []; }
  }
  _saveCreators(arr) {
    localStorage.setItem("eden.creators", JSON.stringify(arr));
  }
  listCreators() { return this._loadCreators(); }
  addCreator({ handle, platform = "", notes = "" }) {
    if (!handle) return null;
    const arr = this._loadCreators();
    const clean = String(handle).trim().replace(/^@/, "");
    if (arr.find(c => c.handle.toLowerCase() === clean.toLowerCase() && c.platform === platform)) return null;
    const entry = {
      id: this._newId("c"),
      handle: clean,
      platform,
      notes: String(notes).slice(0, 200),
      addedAt: new Date().toISOString(),
      lastAnalyzed: null
    };
    arr.unshift(entry);
    this._saveCreators(arr);
    return entry;
  }
  removeCreator(id) {
    this._saveCreators(this._loadCreators().filter(c => c.id !== id));
  }
  markCreatorAnalyzed(id) {
    const arr = this._loadCreators();
    const c = arr.find(x => x.id === id);
    if (c) { c.lastAnalyzed = new Date().toISOString(); this._saveCreators(arr); }
  }

  /**
   * Run a deep-dive on a creator. Returns a streamed analysis through onChunk.
   * Uses the existing 'competitor' mode + web search for fresh signals.
   */
  async deepDiveCreator(creator, onChunk) {
    const text = `Разбери ${creator.handle}${creator.platform ? ` на ${creator.platform}` : ""}. Что у них работает, какие хуки, паттерны, кадэнс. Что я могу перенять.`;
    return this.chat(text, onChunk);
  }

  /* ============================================================
     ANALYZE URL — paste any link, get a structural breakdown.
     Smart router: YouTube → captions API; otherwise → Jina reader.
     ============================================================ */
  _isYoutubeUrl(url) {
    return /(?:^|\/\/)(?:www\.)?(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/i.test(url);
  }

  async analyzeUrl(url, onChunk) {
    let content = null;
    let source = 'jina';
    let extraMeta = '';
    let isMetadataOnly = false;

    if (this._isYoutubeUrl(url) && typeof window !== 'undefined' && window.EdenAPI) {
      onChunk?.("🎬 YouTube — получаю транскрипт…", { type: "status" });
      try {
        const t = await window.EdenAPI.transcribeYoutube(url);
        if (t.transcript) {
          content = t.transcript;
          source = t.source || 'youtube-captions';
          isMetadataOnly = !!t.fallback;
          if (t.fallback) {
            extraMeta = `\n[METADATA ONLY — у видео нет субтитров. Анализирую по: ${[t.title&&'title',t.author&&'channel',t.thumbnail&&'thumbnail','page metadata'].filter(Boolean).join(', ')}]`;
            onChunk?.(`(Субтитров нет — анализирую по заголовку, каналу и метаданным страницы.)\n`, { type: "status" });
          } else {
            extraMeta = `\n[TRANSCRIPT lang=${t.lang} · ${t.segments?.length || 0} segments · ${t.chars} chars]`;
          }
        }
      } catch (e) {
        onChunk?.(`(YouTube недоступен: ${e.message}) — пробую через Jina…\n`, { type: "status" });
      }
    }

    if (!content) {
      onChunk?.("🔗 Качаю содержимое страницы…", { type: "status" });
      content = await this._fetchUrl(url);
    }
    if (!content || content.length < 50) {
      throw new Error("Не удалось получить ничего о ссылке. Проверь, что URL открывается. Для TikTok/Instagram нужна аудио-транскрипция (настрой Whisper в админке).");
    }
    onChunk?.(`✓ Контент получен через ${source}. Разбираю структуру…\n\n`, { type: "status" });

    const promptHeader = isMetadataOnly
      ? `Сделай структурный разбор YouTube-видео по доступным метаданным (субтитров нет, только заголовок/канал/описание/превью).

Под "Hook type" разбери, как сформулирован ЗАГОЛОВОК — это первый хук видео.
Под "Structure" — реконструируй вероятный сценарий по заголовку + описанию + теме канала.
Честно отметь, что часть выводов это гипотеза (на основе метаданных, не транскрипта).`
      : `Сделай структурный разбор контента ниже.`;

    const prompt = `${promptHeader}

[CONTENT FROM ${url}]${extraMeta}
${content.slice(0, 4000)}

Используй структуру:
1. **Hook type** — тип цепляющего открывающего ${isMetadataOnly ? '(анализируй заголовок видео)' : ''}
2. **Structure** — название фреймворка (BAB / PAS / STAR / Hook-Promise-Proof-CTA / другой)
3. **Why it landed** — 3 конкретные причины (${isMetadataOnly ? 'на основе title + thumbnail' : 'цитируй фразы из транскрипта'})
4. **Key moments** — ${isMetadataOnly ? 'пропусти, если нет транскрипта' : 'если транскрипт с таймкодами, отметь ключевые секунды'}
5. **Reusable template** — заполняемый шаблон
6. **Твой ремикс** — 1 готовый пост в твоём голосе на ту же тему`;
    return this.chat(prompt, onChunk);
  }

  /** Standalone: transcribe a YouTube URL (returns the raw object). */
  async transcribeYouTube(url) {
    if (typeof window === 'undefined' || !window.EdenAPI) throw new Error('EdenAPI not loaded');
    return window.EdenAPI.transcribeYoutube(url);
  }

  /** Standalone: transcribe an uploaded audio/video file via Whisper API. */
  async transcribeFile(file) {
    if (typeof window === 'undefined' || !window.EdenAPI) throw new Error('EdenAPI not loaded');
    return window.EdenAPI.transcribeAudio(file);
  }

  /* ============================================================
     BOOST POST → WEEK — превращает один пост в 7 связанных постов
     на неделю (разные форматы и углы той же темы).
     ============================================================ */
  async boostIntoWeek(sourceText, platform = "", onChunk) {
    if (!sourceText || sourceText.trim().length < 20) {
      throw new Error("Слишком короткий исходник");
    }
    const lang = this._detectLang(sourceText);
    const langRule = lang === "ru" ? "Все 7 постов — на русском." : "All 7 posts in English.";

    const sys = `Ты Alma — content multiplier. Превращаешь один пост в неделю контента.
${langRule}

Получив исходный пост, выдай РОВНО 7 связанных постов на 7 дней, каждый на ту же тему, но с разным углом и форматом. Не повторяйся.

Output ТОЛЬКО JSON-массив из 7 объектов, без prose, без markdown-fence:
[
  {
    "day": 1,
    "format": "thread | post | carousel | reel | story | poll | quote",
    "hook": "первая строка поста",
    "body": "полный текст готовый к публикации (50-200 слов)",
    "cta": "одной строкой",
    "why": "одной строкой — почему именно этот формат в этот день"
  }
]

Распределение по дням:
- День 1 (Пн): главный пост (как исходник, но усилен)
- День 2 (Вт): контр-аргумент / другая точка зрения
- День 3 (Ср): мини-кейс или личная история по теме
- День 4 (Чт): практический how-to / чеклист
- День 5 (Пт): провокационный хук / поляризующее мнение
- День 6 (Сб): визуальный формат (карусель / reel description)
- День 7 (Вс): рефлексия + вопрос аудитории

${platform ? `Главная платформа: ${platform}.` : ""}`;

    const messages = [
      { role: "system", content: sys + this._voiceBlock() },
      { role: "user", content: `ИСХОДНЫЙ ПОСТ:\n${sourceText}\n\nВыдай 7 постов JSON-массивом.` }
    ];
    const raw = await this._oneShot(messages, { temperature: 0.85, num_predict: 1800 });
    const arr = this._safeJsonArray(raw);
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr.slice(0, 7).map((x, i) => ({
      day:    Number(x.day) || (i + 1),
      format: String(x.format || "post").slice(0, 24),
      hook:   String(x.hook || "").slice(0, 200),
      body:   String(x.body || "").slice(0, 1200),
      cta:    String(x.cta || "").slice(0, 140),
      why:    String(x.why || "").slice(0, 140)
    }));
  }

  /* ============================================================
     LANGUAGE DETECTION + CLEAN-UP
     ============================================================ */
  _detectLang(text) {
    if (/[Ѐ-ӿ]/.test(text)) return "ru";
    return "en";
  }

  /**
   * Strip foreign scripts (Arabic, Hebrew, CJK, Devanagari etc.) from the
   * model output when the user is writing in Russian or English.
   * Small models like Llama 3.2 sometimes bleed in random other-language
   * tokens; this is a safety net.
   */
  _cleanLangBleed(text, lang) {
    if (!text) return text;
    // Always strip these scripts — they shouldn't appear for RU/EN users:
    //   U+0590–U+08FF  Hebrew / Arabic / Syriac / Thaana / Arabic Supp.
    //   U+0900–U+0DFF  Devanagari / Bengali / Tamil / Telugu / Sinhala …
    //   U+3040–U+30FF  Hiragana / Katakana
    //   U+3400–U+9FFF  CJK Unified Ideographs (Chinese / Japanese kanji)
    //   U+AC00–U+D7AF  Hangul (Korean)
    const foreign = /[֐-ࣿऀ-෿぀-ヿ㐀-鿿가-힯]+/g;
    let cleaned = text.replace(foreign, "");
    // Collapse double-spaces / orphan punctuation left after stripping
    cleaned = cleaned
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\(\s*\)/g, "")
      .trim();
    return cleaned;
  }

  /* ============================================================
     INTENT CLASSIFIER — conservative, defaults to CHAT
     ============================================================ */
  classify(text) {
    const t = text.trim().toLowerCase();
    const wordCount = t.split(/\s+/).filter(Boolean).length;

    // Greetings & small talk → chat
    if (/^(hi|hello|hey|yo|sup|hola|здравствуй|здравствуйте|привет|приветик|здаров|здарова|hi!|hello!|привет!|hey!|good morning|good evening|добрый (день|вечер|утро))\W*$/i.test(t)) return "chat";
    if (/^(thanks|thank you|спасибо|спс|cool|nice|ok|okay|got it|понял|ага|хорошо|ладно|👍|❤️|🙏)\W*$/i.test(t)) return "chat";
    if (/^(who are you|what (can|do) you do|what are you|кто ты|что ты (умеешь|можешь)|что ты|расскажи о себе)\b/i.test(t)) return "chat";
    if (/^(how are you|how('s| is) it going|как дела|как ты|как жизнь)/i.test(t)) return "chat";

    // Very short messages without any keywords → chat
    if (wordCount <= 3 && !/\b(idea|hook|draft|post|plan|trend|analy|market|advice|совет|идея|план|пост|анализ|тренд|охват)\w*/i.test(t)) {
      return "chat";
    }

    // URL → analyze
    if (/https?:\/\/\S+/.test(text)) return "analyze";

    // === FULL AUDIT — highest priority compound intent ===
    if (/\b(full audit|content audit|полн(ый|ое|ая) (аудит|разбор|анализ)|сделай аудит|проведи аудит|partner mode|сделай всё|сделай все)\b/i.test(t)) return "audit";

    // === Content-partner specific functions ===

    // Video scripts
    if (/\b(script|сценари[йя]|напиши .* (видео|ролик|reel|reels|short|shorts|tiktok|тикток)|video script|сценарий для (видео|тикток|reels|shorts))\b/i.test(t)) return "script";

    // Caption + hashtags
    if (/\b(caption|кэпшн|капшн|описание (поста|для поста|к посту)|hashtag|hashtags|хэштег|хештег|подпис[ьи] к (посту|видео|reel|reels))\b/i.test(t)) return "caption";

    // Repurpose
    if (/\b(repurpose|repurposing|перепакуй|перепакова|adapt for|переделай (под|на)|раздели на форматы|multi[- ]?platform|кросспостинг|на все платформы)\b/i.test(t)) return "repurpose";

    // YouTube SEO
    if (/\b(seo|keyword|keywords|youtube tags|description for|оптимизаци[яи]|ключев(ые|ых) слов|youtube .* поиск|youtube discovery)\b/i.test(t)) return "seo";

    // YouTube title + thumbnail
    if (/\b(title|titles|thumbnail|thumbnails|превью|обложк[аи]|youtube (название|заголовок|тайтл)|тайтл|click[- ]?bait|ctr)\b/i.test(t)) return "title";

    // Bio
    if (/\b(bio|profile|био|описание (профиля|канала|акк|инсты)|optimize (my )?profile|оптимиз.* (профиль|био)|шапка профиля)\b/i.test(t)) return "bio";

    // Competitor deep-dive
    if (/\b(competitor|конкурент|разбер[иь] (конкурент|канал|аккаунт|блогер|инсту)|deep[- ]?dive|разбор канала|изучи (канал|акк|блогер)|@[a-zа-я0-9_.]+)\b/i.test(t)) return "competitor";

    // Weekly digest
    if (/\b(weekly|еженедельн|digest|дайджест|news of (the )?week|что нового|новости (за )?неделю|trends (digest|weekly)|тренды (за )?неделю)\b/i.test(t)) return "digest";

    // Post-mortem review
    if (/\b(post[- ]?mortem|why did .* flop|why did .* (under)?perform|разбор (моего|опубликован)|разбер[иь] (пост|видео) .* (получил|набрал)|review my post|анализ моего поста|почему .* не зашло|почему .* провалил)\b/i.test(t)) return "review";

    // Comment / DM templates
    if (/\b(comment templates?|reply templates?|dm templates?|шаблон(ы)? (комментар|ответ|сообщений|dm)|как отвечать на комм|cold dm)\b/i.test(t)) return "comment";

    // Series design
    if (/\b(series|сери[яиюй]|рубрик[аиу]|recurring (series|format)|content series|еженедельн.* (рубрик|сери)|design a series)\b/i.test(t)) return "series";

    // Strong marketing intents
    if (/\b(market analy|analy.* (niche|market|industry|trend)|анализ (рынка|ниши|конкурент)|проанализир|разбер[иь] (рынок|нишу|тикток|инстаграм|ютуб|youtube|tiktok|instagram)|tt vs|tiktok vs|какая (платформа|соцсеть)|where should i post|на какой платформе)\b/i.test(t)) return "market";

    if (/\b(forecast|reach forecast|how (many|much) views|прогноз|сколько просмотров|сколько охват|какие (просмотры|охваты)|expected views|will i get views|какой будет охват)\b/i.test(t)) return "forecast";

    if (/\b(business plan|content business|monetiz|revenue|зарабат|монетиз|бизнес[- ]?план|как (выйти на|зарабат))\b/i.test(t)) return "business";

    if (/\b(content (plan|calendar)|30[- ]day|posting (plan|schedule|calendar)|контент[- ]?план|план постов|план на месяц|расписан|cadence)\b/i.test(t)) return "plan";

    if (/\b(how (do i|to) start|getting started|i'm new|just starting|how to begin|с чего начать|как начать|только начинаю|нович(ок|ку)|первое видео|первые видео)\b/i.test(t)) return "start";

    if (/\b(analyz|analyse|deconstruct|break down|teardown|why .* works?|reverse[- ]engineer|разбер[иь] (пост|видео|ролик)|почему .*работает|разбор)\b/i.test(t)) return "analyze";

    if (/\b(advise|advice|should i|what'?s? better|how (should|do) i|coach|совет|посоветуй|что лучше|как лучше)\b/i.test(t)) return "advise";

    if (/\b(hook|hooks|opener|opener|хук|хуки|зацеп)\b/i.test(t)) return "hooks";

    if (/\b(thread|7[- ]tweet|expand into a thread|тред|треды)\b/i.test(t)) return "thread";

    if (/\b(draft|write (me )?(a )?(post|tweet|caption|reel|carousel)|linkedin post|tweet|caption|carousel|напиши|сочини|составь пост|готовый пост)\b/i.test(t)) return "draft";

    if (/\b(this week|trend|trending|what worked|what'?s working|research|stud(y|ies)|competitor|viral right now|что сейчас|что в тренде|что работает|что виральн)\b/i.test(t)) return "research";

    if (/\b(idea|ideas|topic|topics|angle|angles|идея|идеи|темы|темку|англ)\b/i.test(t)) return "ideas";

    if (/\b(surprise me|propose|brainstorm|pick something|удиви|предложи|сам предложи)\b/i.test(t)) return "auto";

    // Long but no clear signal → generic strategist mode
    if (wordCount > 12) return "generic";

    // Default: just chat
    return "chat";
  }

  shouldSearch(text, mode) {
    if (!this.useSearch) return false;
    // URLs always trigger a fetch even in chat mode.
    if (/https?:\/\//.test(text)) return true;

    // Hot-words mean the user is asking for current real-world data
    // OR is discussing content/marketing strategy where market context
    // genuinely helps. We honour them even in chat-mode — otherwise
    // small questions get answered from training and we hallucinate.
    //
    // Two separate regexes: \b only works for ASCII word chars in JS,
    // so cyrillic words match via plain substring (good enough — false
    // positives just trigger an extra harmless search).

    // Bucket 1: "I want real, current data" signals
    const HOT_EN = /\b(trend|trending|this week|today|latest|now|recent|2024|2025|2026|competitor|viral|news|popular|going viral|fyp|breakout|source|cite|link|url|tiktok|youtube|instagram|reels|shorts|threads|linkedin)\b/i;
    const HOT_RU = /(тренд|сейчас|сегодня|на этой неделе|свеж|популярн|вирусн|зашло|в моде|анализ|кто сейчас|что зайдёт|что зайдет|хайп|тикток|ютуб|инстаграм|шортс|линкедин|источник|ссылк|пруф)/i;
    if (HOT_EN.test(text) || HOT_RU.test(text)) return true;

    // Bucket 2: "I'm discussing market / content strategy" signals.
    // These trigger a quick market scan so answers are grounded in
    // what's actually working in the niche right now, not training.
    const MARKET_EN = /\b(niche|audience|market|monetiz|pricing|sponsorship|brand deal|case study|benchmark|growth|reach|format|hook|funnel|copywriting|positioning|competitor|alternative|stack|workflow)\b/i;
    const MARKET_RU = /(ниш|аудитор|рынок|монетиз|спонсор|кейс|бенчмарк|рост|охват|формат|хук|воронк|копирайт|позиционир|конкурент|альтернатив|стек|воркфлоу|подписчик|комьюнити|ER|вовлеч)/i;
    if (MARKET_EN.test(text) || MARKET_RU.test(text)) return true;

    if (mode === "chat") return false;
    const webModes = new Set([
      "research", "analyze", "market", "forecast",
      "audit", "digest", "competitor", "seo", "title"
    ]);
    return webModes.has(mode);
  }

  /* ============================================================
     WEB RESEARCH — search → fetch top pages → return real content.
     Two-pass: snippet round (titles+blurbs) gets the candidate URLs,
     then we OPEN the top 2 pages and pull their text so the LLM sees
     actual article bodies, not just headlines. This is what makes the
     answers concrete instead of "in general TikTok has trends like…".
     ============================================================ */
  async searchWeb(query) {
    const out = [];

    // Direct URL in the query → fetch it immediately.
    const urlMatch = query.match(/https?:\/\/\S+/);
    if (urlMatch) {
      const fetched = await this._fetchUrl(urlMatch[0]);
      if (fetched) out.push(`URL CONTENT (${urlMatch[0]}):\n${fetched}`);
    }

    const cleanQ = query.replace(/https?:\/\/\S+/g, "").trim() || query;

    // Pass 1: snippet search across sources (fast).
    const searches = await Promise.allSettled([
      this._searchPrimary(cleanQ),       // /api/web/search → DDG Lite (titles+urls)
      this._searchWikipedia(cleanQ),
      this._searchHackerNews(cleanQ),
      this._searchReddit(cleanQ),
    ]);

    const labels = ["WEB", "WIKIPEDIA", "HACKER NEWS", "REDDIT"];
    searches.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        out.push(`${labels[i]}:\n${r.value}`);
      }
    });

    // Pass 2: deep-fetch the top 2 URLs from the snippet block.
    // This is the difference between "I read the headline" and
    // "I read the article" — without it the LLM gets nothing
    // specific to cite.
    const primaryBlock = searches[0]?.value || "";
    const urls = [...primaryBlock.matchAll(/\((https?:\/\/[^\s)]+)\)/g)]
      .map(m => m[1])
      .filter(u => !/duckduckgo\.com|google\.com\/search/.test(u))
      .slice(0, 2);

    if (urls.length) {
      const fetched = await Promise.allSettled(urls.map(u => this._fetchPrimary(u)));
      fetched.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          // Cap each page at 3000 chars so two pages fit comfortably in context.
          const text = r.value.slice(0, 3000);
          out.push(`ARTICLE — ${urls[i]}:\n${text}`);
        }
      });
    }

    return out.length ? out.join("\n\n---\n\n").slice(0, 14000) : null;
  }

  /**
   * Search sources run on our backend. Same-origin call,
   * so CSP `connect-src 'self'` is happy.
   * Primary: /api/web/* (DuckDuckGo HTML + cheerio fetch, auth required).
   * Fallback: /api/search/* (legacy, anonymous).
   */
  _authHeader() {
    const t = (window.EdenAPI && EdenAPI.getToken && EdenAPI.getToken())
            || localStorage.getItem('eden.token')
            || '';
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  async _searchPrimary(query) {
    try {
      const r = await fetch('/api/web/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this._authHeader() },
        body: JSON.stringify({ query: query.slice(0, 200), limit: 8 })
      });
      if (!r.ok) return null;
      const d = await r.json();
      if (!d.results || !d.results.length) return null;
      // Compact format the LLM eats well: title — snippet (url)
      return d.results.map(x => `• ${x.title} — ${x.snippet || ''} (${x.url})`).join('\n');
    } catch { return null; }
  }

  async _fetchPrimary(url) {
    try {
      const r = await fetch('/api/web/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this._authHeader() },
        body: JSON.stringify({ url, max: 6000 })
      });
      if (!r.ok) return null;
      const d = await r.json();
      return d.text || null;
    } catch { return null; }
  }

  async _searchBackend(engine, query) {
    try {
      const u = engine === 'fetch-url'
        ? `/api/search/fetch-url?url=${encodeURIComponent(query)}`
        : `/api/search/${engine}?q=${encodeURIComponent(query.slice(0, 200))}`;
      const r = await fetch(u);
      if (!r.ok) return null;
      const d = await r.json();
      return d.text || null;
    } catch { return null; }
  }

  async _searchDuckDuckGo(query) {
    // Primary: my new /api/web/search (cheerio-scraped DDG HTML).
    // Fallback: legacy /api/search/ddg (kept for old setups).
    return (await this._searchPrimary(query)) ?? this._searchBackend('ddg', query);
  }
  _searchWikipedia(query)  { return this._searchBackend('wikipedia', query); }
  _searchHackerNews(query) { return this._searchBackend('hn',        query); }
  _searchReddit(query)     { return this._searchBackend('reddit',    query); }
  async _fetchUrl(url) {
    return (await this._fetchPrimary(url)) ?? this._searchBackend('fetch-url', url);
  }

  /* ============================================================
     CONNECTIVITY CHECK
     ============================================================ */
  async checkConnection() {
    const cfg = this.engineCfg();
    try {
      if (cfg.api === "ollama") {
        const r = await this._fetch(this.baseUrl + "/api/tags");
        if (!r.ok) return { ok: false, msg: "Ollama isn't responding" };
        const data = await r.json();
        const names = (data.models || []).map(m => m.name);
        const hasModel = names.some(n => n.startsWith(this.model.split(":")[0]));
        return { ok: true, hasModel,
          msg: hasModel ? `Connected · ${this.model} ready`
                        : `Connected · pull a model: ollama pull ${this.model}` };
      }
      const r = await this._fetch(this.baseUrl + "/models", {
        headers: this.apiKey ? { Authorization: "Bearer " + this.apiKey } : {}
      });
      if (!r.ok) {
        if (r.status === 401) return { ok: false, msg: "Invalid API key" };
        return { ok: false, msg: `Server returned ${r.status}` };
      }
      const data = await r.json();
      const names = (data.data || data.models || []).map(m => m.id || m.name).filter(Boolean);
      const hasModel = names.some(n => n === this.model || n.includes(this.model));
      return { ok: true, hasModel,
        msg: hasModel ? `Connected · ${this.model} ready`
                      : `Connected · model "${this.model}" not found in server` };
    } catch {
      return { ok: false, msg: `Can't reach ${this.baseUrl}` };
    }
  }

  /* ---------- build messages ---------- */
  buildMessages(userText, mode, webContext) {
    const lang = this._detectLang(userText);
    const langTop = lang === "ru"
      ? "ABSOLUTE RULE: The user is writing in RUSSIAN. Reply ONLY in natural Russian. Never use Arabic, Chinese, Japanese, Hebrew, Korean or any other script. No mixed-language output.\n\n"
      : "ABSOLUTE RULE: Reply in English. Never use Arabic, Chinese, Japanese, Hebrew or any other non-Latin script. No mixed-language output.\n\n";
    const langBottom = lang === "ru"
      ? "\n\nFINAL REMINDER: Output ONLY Russian characters and Latin tech terms. No Arabic. No CJK. No Hebrew. Russian only."
      : "\n\nFINAL REMINDER: Output in English only. No foreign scripts.";

    const sys = langTop
      + EDEN_BASE
      + this._contextBlock()
      + this._voiceBlock()
      + "\n\nCURRENT MODE: " + mode.toUpperCase()
      + "\n" + (EDEN_MODE_PROMPTS[mode] || EDEN_MODE_PROMPTS.generic)
      + langBottom;

    let userMsg = userText;
    if (webContext) userMsg = `[WEB CONTEXT — fresh data, cite specifics]\n${webContext}\n\n[USER REQUEST]\n${userText}`;

    return [
      { role: "system", content: sys },
      ...this.history.slice(-this.maxHistory),
      { role: "user", content: userMsg }
    ];
  }

  /* ---------- main chat ---------- */
  async chat(userText, onChunk) {
    this._lastLang = this._detectLang(userText);
    const mode = this.classify(userText);

    try {
      // Whenever the question needs current data (trends, sources, tiktok,
      // youtube, links…) we run the FULL multi-step smart loop — plan,
      // search, fetch top pages, draft, critique, polish. This is what
      // turns the model from "answers from training" into an actual
      // researcher that cites real URLs.
      const needsResearch = this.shouldSearch(userText, mode);
      if (needsResearch || this.smartMode) {
        return await this._chatSmart(userText, onChunk, mode);
      }
      if (mode === "chat") {
        return await this._chatFast(userText, onChunk, mode);
      }
      return await this._chatFast(userText, onChunk, mode);
    } catch (e) {
      // Subscription ended / out of tokens → answer politely instead of crashing.
      if (e && e.isBilling) {
        const msg = e.message;
        onChunk?.(msg, { type: "token" });
        onChunk?.("", { type: "done", billing: e.reason, state: e.state });
        this.history.push({ role: "user", content: userText });
        this.history.push({ role: "assistant", content: msg });
        return msg;
      }
      throw e;
    }
  }

  /* ---------- fast single-pass ---------- */
  async _chatFast(userText, onChunk, mode) {
    mode = mode || this.classify(userText);
    const lang = this._detectLang(userText);

    // ===== CHAT MODE — streamed, low temperature, light filtering =====
    // Stream so the user sees progress (otherwise UI looks frozen 5-15s on
    // a local 3B model). Low temp keeps it deterministic single-language.
    // Final cleanup strips any foreign-script tokens before history save.
    if (mode === "chat") {
      // Chat-mode CAN ground itself in web data when the user asks for
      // a source / mentions a platform / asks "what's trending". We
      // detect that via shouldSearch (which now matches HOT-words even
      // in chat mode) and run a quick search before the LLM call.
      let chatWebCtx = null;
      if (this.shouldSearch(userText, mode)) {
        onChunk?.("🔍 Ищу в интернете…", { type: "status" });
        chatWebCtx = await this.searchWeb(userText);
        onChunk?.(chatWebCtx ? "" : "(свежих данных не нашёл — отвечаю по обучению)\n\n",
                  { type: "status" });
      }
      const messages = this.buildMessages(userText, mode, chatWebCtx);
      // Force chat to be SHORT and quick — small num_ctx for speed
      const full = await this._streamChat(messages, onChunk, lang);
      const cleaned = this._cleanLangBleed(full, lang);
      this.history.push({ role: "user", content: userText });
      this.history.push({ role: "assistant", content: cleaned });
      onChunk?.("", { type: "done" });
      return cleaned;
    }

    let webCtx = null;
    if (this.shouldSearch(userText, mode)) {
      onChunk?.("🔍 Searching the web…", { type: "status" });
      webCtx = await this.searchWeb(userText);
      onChunk?.(webCtx ? "" : "(no fresh data — relying on training)\n\n",
                { type: "status" });
    }

    const messages = this.buildMessages(userText, mode, webCtx);
    const full = await this._stream(messages, onChunk, {
      temperature: modeTemp(mode),
      num_predict: modePredict(mode)
    });
    const cleaned = this._cleanLangBleed(full, lang);

    this.history.push({ role: "user", content: userText });
    this.history.push({ role: "assistant", content: cleaned });
    onChunk?.("", { type: "done" });
    return cleaned;
  }

  /* ============================================================
     SMART MODE — multi-step (steps are emitted but UI hides them)
     ============================================================ */
  async _chatSmart(userText, onChunk, mode) {
    mode = mode || this.classify(userText);
    // If the user asks about trends/sources/platforms, force "research"
    // mode so the draft uses the structured ФАКТЫ → ИНСАЙТ → 3 ИДЕИ template
    // instead of the short chat persona.
    if (mode === "chat" && this.shouldSearch(userText, mode)) {
      mode = "research";
    }

    // ----- 1. PLAN -----
    onChunk?.("🧠 Думаю и составляю план…", { type: "status" });
    onChunk?.("", { type: "step", step: "plan", title: "Planning", status: "running" });
    const planMsgs = [
      { role: "system", content:
        `You are a planning assistant for a content/marketing AI.
Output ONLY this JSON, no prose, no markdown fence:
{"steps":["step 1","step 2",...],"needs_web":true|false,"web_query":"..."}
Rules:
- 2 to 4 steps max
- needs_web=true for ANY question about: trends, what's popular, what's working now,
  TikTok/YouTube/Instagram/Reels/Shorts, specific people, competitors, products,
  recent news, dates 2024-2026, sources / citations
- web_query in English, optimized for search engines (e.g. "TikTok viral trends June 2026")` },
      { role: "user", content: userText }
    ];
    const planRaw = await this._oneShot(planMsgs, { temperature: 0.2 });
    const plan = this._safeJson(planRaw) || { steps: ["Direct answer"], needs_web: this.shouldSearch(userText, mode), web_query: userText };
    // Override: if our HOT-word check already said the question needs research,
    // force needs_web=true even when the planner missed it.
    if (this.shouldSearch(userText, mode)) plan.needs_web = true;
    onChunk?.("", { type: "step", step: "plan", status: "done",
      detail: plan.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") });

    // ----- 2. RESEARCH -----
    let webCtx = null;
    if (plan.needs_web && this.useSearch) {
      onChunk?.("🔍 Ищу свежие данные в интернете и читаю топ-страницы…", { type: "status" });
      onChunk?.("", { type: "step", step: "research", title: "Researching", status: "running" });
      webCtx = await this.searchWeb(plan.web_query || userText);
      onChunk?.("", { type: "step", step: "research", status: "done",
        detail: webCtx ? webCtx.slice(0, 600) + "…" : "No fresh data." });
      if (webCtx) {
        onChunk?.("📚 Анализирую найденное…", { type: "status" });
      } else {
        onChunk?.("(данные не нашёл — отвечу осторожно, без выдумок)\n\n", { type: "status" });
      }
    }

    // ----- 3. DRAFT -----
    onChunk?.("", { type: "step", step: "draft", title: "Drafting", status: "running" });
    const draftMsgs = this.buildMessages(userText, mode, webCtx);
    const draft = await this._oneShot(draftMsgs, { temperature: 0.85 });
    onChunk?.("", { type: "step", step: "draft", status: "done", detail: draft.slice(0, 300) + "…" });

    // ----- 4. CRITIQUE -----
    onChunk?.("✏️ Проверяю на выдумки и слабые места…", { type: "status" });
    onChunk?.("", { type: "step", step: "critique", title: "Critique", status: "running" });
    const critMsgs = [
      { role: "system", content:
        `You are a brutal fact-checker for a content-marketing AI.

YOUR JOB — find every claim in the DRAFT that:
1. Has a specific number (views, followers, engagement) WITHOUT a backing URL in [WEB CONTEXT]
2. Names a creator handle (@something) that doesn't appear verbatim in [WEB CONTEXT]
3. Quotes a "trend name" / hashtag that's not in [WEB CONTEXT]
4. Uses vague phrases like "be authentic", "find your niche", "post consistently" without a concrete tactic
5. Misses one of the required sections: ФАКТЫ, ЧТО ЭТО ЗНАЧИТ, 3 УНИКАЛЬНЫЕ ИДЕИ, СЛЕДУЮЩИЙ ШАГ

For each violation: output a single bullet "- FIX: <what to change>".
Be RUTHLESS. If the draft hallucinates numbers — flag every one.
If [WEB CONTEXT] is thin, say "FIX: drop fabricated numbers and add disclaimer that data is limited".

WEB CONTEXT (the only truth):
${(webCtx || '(empty — draft must NOT contain any specific stats)').slice(0, 4000)}` },
      { role: "user", content: `USER REQUEST:\n${userText}\n\nDRAFT:\n${draft}\n\nConcrete fixes (bullet list):` }
    ];
    const critique = await this._oneShot(critMsgs, { temperature: 0.3 });
    onChunk?.("", { type: "step", step: "critique", status: "done", detail: critique });

    // ----- 5. REVISE (streamed) -----
    onChunk?.("✨ Финализирую ответ с фактами и идеями…", { type: "status" });
    onChunk?.("", { type: "step", step: "revise", title: "Polishing", status: "running" });
    const lang = this._detectLang(userText);
    const langDirective = lang === "ru"
      ? "Reply ENTIRELY in Russian."
      : "Reply in English.";
    // CRITICAL: include the mode-specific template so revise actually
    // produces the ФАКТЫ → ИНСАЙТ → ИДЕИ structure (not free-form text).
    const modeBlock = EDEN_MODE_PROMPTS[mode] || EDEN_MODE_PROMPTS.generic;
    const webBlockForRevise = webCtx
      ? `\n\n[WEB CONTEXT — fresh data, cite specifics with bare URLs]\n${webCtx}\n[/WEB CONTEXT]`
      : `\n\n[WEB CONTEXT — empty. Do NOT invent any specific stats, handles, hashtags. Say "конкретных свежих данных у меня нет" and give cautious, principle-level advice.]`;
    const reviseMsgs = [
      { role: "system", content: EDEN_BASE + "\n" + langDirective + this._contextBlock() + this._voiceBlock() +
        `\n\nCURRENT MODE: ${mode.toUpperCase()}\n${modeBlock}` +
        webBlockForRevise +
        `\n\nYou are REVISING a draft using the editor's notes. Apply EVERY fix. Output ONLY the final polished version — no preamble, no "Here's the revised version", no explanations.` },
      { role: "user", content:
        `ORIGINAL REQUEST:\n${userText}\n\nDRAFT:\n${draft}\n\nEDITOR'S NOTES (apply ALL):\n${critique}\n\nFinal polished version:` }
    ];

    const full = await this._stream(reviseMsgs, onChunk, {
      temperature: 0.55,                  // polish: warm but not random
      num_predict: modePredict(mode)
    });
    onChunk?.("", { type: "step", step: "revise", status: "done" });

    const cleaned = this._cleanLangBleed(full, lang);
    this.history.push({ role: "user", content: userText });
    this.history.push({ role: "assistant", content: cleaned });
    onChunk?.("", { type: "done" });
    return cleaned;
  }

  /* ---------- non-streamed one-shot ---------- */
  async _oneShot(messages, opts = {}) {
    const cfg = this.engineCfg();
    const body = cfg.api === "ollama"
      ? { model: this.model, messages, stream: false,
          options: { temperature: opts.temperature ?? 0.7, num_ctx: 8192,
                     ...(opts.num_predict ? { num_predict: opts.num_predict } : {}) } }
      : { model: this.model, messages, stream: false, temperature: opts.temperature ?? 0.7,
          ...(opts.num_predict ? { max_tokens: opts.num_predict } : {}) };

    // JSON mode — forces the model to emit syntactically valid JSON.
    // Hugely improves reliability of structured features (ideas, boost, plans).
    if (opts.json) {
      if (cfg.api === "ollama") body.format = "json";
      else body.response_format = { type: "json_object" };
    }

    const headers = { "Content-Type": "application/json" };
    if (cfg.api !== "ollama" && this.apiKey) headers.Authorization = "Bearer " + this.apiKey;
    const path = cfg.api === "ollama" ? "/api/chat" : "/chat/completions";

    let res;
    try {
      res = await this._fetch(this.baseUrl + path, { method: "POST", headers, body: JSON.stringify(body) });
    } catch { return ""; }
    await this._throwIf402(res);          // throws BillingError on 402
    if (!res.ok) return "";
    try {
      const j = await res.json();
      return cfg.api === "ollama" ? (j.message?.content || "") : (j.choices?.[0]?.message?.content || "");
    } catch { return ""; }
  }

  _safeJson(text) {
    if (!text) return null;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    try { return JSON.parse(cleaned.slice(start, end + 1)); }
    catch { return null; }
  }

  /** Light repair of common small-model JSON mistakes. */
  _repairJson(s) {
    return String(s)
      .replace(/```json|```/g, "")
      // smart quotes → straight
      .replace(/[“”„‟]/g, '"')
      .replace(/[‘’‚‛]/g, "'")
      // trailing commas before } or ]
      .replace(/,\s*([}\]])/g, "$1")
      .trim();
  }

  _safeJsonArray(text) {
    if (!text) return null;
    const cleaned = this._repairJson(text);

    // 1) Direct array  [ ... ]
    const aStart = cleaned.indexOf("[");
    const aEnd   = cleaned.lastIndexOf("]");
    if (aStart !== -1 && aEnd > aStart) {
      try {
        const arr = JSON.parse(cleaned.slice(aStart, aEnd + 1));
        if (Array.isArray(arr) && arr.length) return arr;
      } catch { /* fall through */ }
    }

    // 2) Wrapper object  { "ideas": [...] } / { "items": [...] } / { "posts": [...] }
    try {
      const obj = JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1));
      for (const k of ["ideas", "items", "posts", "results", "data", "list"]) {
        if (Array.isArray(obj?.[k]) && obj[k].length) return obj[k];
      }
      // any array value inside the object
      const anyArr = Object.values(obj || {}).find(v => Array.isArray(v) && v.length);
      if (anyArr) return anyArr;
    } catch { /* fall through */ }

    // 3) Per-object salvage — pull each {...} block and parse individually,
    //    skipping the ones that are malformed. Resilient to one bad object.
    const objs = [];
    const re = /\{[^{}]*\}/g;
    let m;
    while ((m = re.exec(cleaned)) !== null) {
      try { objs.push(JSON.parse(m[0])); } catch { /* skip bad object */ }
    }
    return objs.length ? objs : null;
  }

  /* ============================================================
     IMPROVE A DRAFT — rewrite the user's text in their voice,
     sharper hook, no fluff. Returns plain text.
     ============================================================ */
  async improveDraft({ body, title = "", platform = "" } = {}) {
    if (!body || body.trim().length < 10) return null;
    const lang = this._detectLang(body);
    const langDirective = lang === "ru" ? "Russian" : "English";

    const sys = `You are Alma — a sharp content editor.
Improve the draft below. Keep the author's intent and core message intact.
${this._voiceBlock() || `Default voice: short sentences, first-person, no em-dashes, dry humor.`}

Rules:
- Output ONLY the rewritten draft text — no preamble, no "Here is the improved version", no explanations, no markdown fence.
- Same language as input (${langDirective}).
- Sharpen the hook (first 1–2 lines).
- Cut filler. Tighten sentences.
- Keep platform best-practices in mind${platform ? ` (platform: ${platform})` : ""}.
- Match the user's voice if a voice profile exists; otherwise default voice rules.`;

    const messages = [
      { role: "system", content: sys },
      { role: "user", content: (title ? `TITLE: ${title}\n\n` : "") + `DRAFT:\n${body}\n\nRewrite it:` }
    ];

    const out = await this._oneShot(messages, { temperature: 0.7 });
    return (out || "").trim();
  }

  /* ============================================================
     MEDIA — image + video processing for VISION queries
     ============================================================ */

  /** Convert any File to a JPEG/PNG data URL. */
  async _fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error("Couldn't read file"));
      r.readAsDataURL(file);
    });
  }

  /** Get video duration in seconds (resolves quickly via metadata only). */
  async _getVideoMeta(file) {
    return new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.playsInline = true;
      const url = URL.createObjectURL(file);
      v.src = url;
      v.onloadedmetadata = () => {
        const meta = { duration: v.duration, width: v.videoWidth, height: v.videoHeight, url };
        resolve(meta);
      };
      v.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Cannot decode video")); };
    });
  }

  /**
   * Extract N frames from a video as JPEG data URLs.
   * Returns: [{ time, dataUrl }, ...]
   */
  async extractVideoFrames(file, { count = 6, intervalSec = null, maxWidth = 640, quality = 0.72 } = {}) {
    const meta = await this._getVideoMeta(file);
    const duration = meta.duration;

    // Determine timestamps
    let stamps = [];
    if (intervalSec) {
      for (let t = intervalSec / 2; t < duration; t += intervalSec) stamps.push(t);
      if (stamps.length > 60) stamps = stamps.filter((_, i) => i % Math.ceil(stamps.length / 60) === 0);
    } else {
      for (let i = 0; i < count; i++) {
        stamps.push((duration / (count + 1)) * (i + 1));
      }
    }

    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = meta.url;
    await new Promise((res, rej) => { video.onloadeddata = res; video.onerror = () => rej(new Error("Decode failed")); });

    const aspect = video.videoWidth / video.videoHeight || 16 / 9;
    const w = Math.min(video.videoWidth || maxWidth, maxWidth);
    const h = Math.round(w / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    const frames = [];
    for (const t of stamps) {
      await new Promise((res) => {
        const onSeeked = () => { video.removeEventListener("seeked", onSeeked); res(); };
        video.addEventListener("seeked", onSeeked);
        try { video.currentTime = Math.min(t, duration - 0.05); } catch { res(); }
      });
      // small extra wait for paint on Safari
      await new Promise(r => setTimeout(r, 30));
      try {
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        frames.push({ time: t, dataUrl });
      } catch {}
    }
    return { frames, meta };
  }

  /**
   * Heuristic: does the user message indicate a "find moment" query?
   */
  _isFindIntent(text) {
    const t = (text || "").toLowerCase();
    return /\b(найди|найти|где (тут|в видео|на видео|момент)|на какой (минут|секунд)|с какой минуты|таймкод|таймкоды|moment|find (the|a) (person|moment|scene|time|spot)|when does|where (in the video|is)|locate|at what time)\b/i.test(t)
        || /\b(в синей|в красной|в чёрной|в белой|wearing|with the|подош[её]л|asks for|holding)\b/i.test(t);
  }

  /* ============================================================
     ROUTE — main entry for media-augmented chat
     ============================================================ */
  /**
   * Accept text + attached files (image/video). Routes to:
   *  - vision-find  (video + "find ..." query) → returns timecodes
   *  - vision-post  (image OR video + general request) → writes post
   *
   * onChunk(chunk, meta) — same protocol as .chat()
   * For find mode meta.type can be: "status" | "find-progress" | "find-result"
   */
  async chatWithMedia(text, attachments, onChunk) {
    if (!attachments || !attachments.length) return this.chat(text, onChunk);

    const lang = this._detectLang(text || "");
    const hasVideo = attachments.some(a => (a.file?.type || a.type || "").startsWith("video/"));
    const isFind = hasVideo && this._isFindIntent(text);

    try {
      if (isFind) {
        const videoAtt = attachments.find(a => (a.file?.type || a.type || "").startsWith("video/"));
        await this.findInVideo(videoAtt.file, text, onChunk);
        onChunk?.("", { type: "done" });
      } else {
        await this._visionPost(text, attachments, onChunk, lang);
        onChunk?.("", { type: "done" });
      }
    } catch (e) {
      onChunk?.("", { type: "vision-error", message: e.message || String(e) });
      throw e;
    }
  }

  /** Write a post based on uploaded image(s)/video. */
  async _visionPost(text, attachments, onChunk, lang) {
    onChunk?.(lang === "ru" ? "📸 Смотрю на медиа…" : "📸 Looking at the media…", { type: "status" });

    // Build image list (max ~8 frames total to keep payload reasonable)
    const images = [];
    for (const a of attachments) {
      const type = a.file?.type || a.type || "";
      if (type.startsWith("image/")) {
        const dataUrl = await this._fileToDataUrl(a.file);
        images.push({ dataUrl, label: a.name || "image" });
      } else if (type.startsWith("video/")) {
        onChunk?.(lang === "ru" ? "🎬 Извлекаю ключевые кадры…" : "🎬 Extracting keyframes…", { type: "status" });
        const { frames } = await this.extractVideoFrames(a.file, { count: 6 });
        frames.forEach(f => images.push({
          dataUrl: f.dataUrl,
          label: `${a.name || "video"} @ ${this._fmtTime(f.time)}`,
          time: f.time
        }));
      }
    }

    if (!images.length) throw new Error(lang === "ru" ? "Не удалось обработать файлы" : "No usable media found");
    if (images.length > 8) images.splice(8);  // hard cap

    onChunk?.(lang === "ru" ? `✓ ${images.length} кадра(ов) готово.\n\n` : `✓ ${images.length} frame(s) ready.\n\n`, { type: "status" });

    // Build the vision system prompt
    const userTxt = text && text.trim()
      ? text
      : (lang === "ru" ? "Напиши пост про это медиа в моём голосе." : "Write a post about this media in my voice.");

    const messages = this.buildMessages(userTxt, "vision-post", null);
    await this._streamWithImages(messages, images, onChunk, lang);
  }

  /**
   * Per-frame YES/NO search over a video.
   * Emits {type:"find-progress", current, total} during scan,
   * and finally {type:"find-result", matches: [{time, dataUrl}], query} when done.
   */
  async findInVideo(videoFile, query, onChunk) {
    const lang = this._detectLang(query || "");
    onChunk?.(lang === "ru" ? "🔍 Сканирую видео покадрово…" : "🔍 Scanning video frame by frame…", { type: "status" });

    const meta = await this._getVideoMeta(videoFile);
    const duration = meta.duration;
    // Sample density: every 2s for short videos, capped at 30 frames
    const interval = duration <= 60 ? 2 : duration <= 300 ? 5 : 10;
    const { frames } = await this.extractVideoFrames(videoFile, { intervalSec: interval });
    URL.revokeObjectURL(meta.url);

    const total = frames.length;
    onChunk?.(lang === "ru" ? `📊 ${total} кадров. Проверяю каждый…\n\n` : `📊 ${total} frames. Checking each…\n\n`, { type: "status" });

    const matches = [];
    for (let i = 0; i < total; i++) {
      const f = frames[i];
      onChunk?.("", { type: "find-progress", current: i + 1, total });
      const sys = EDEN_MODE_PROMPTS["vision-find"].replace("{{QUERY}}", query);
      const messages = [
        { role: "system", content: sys },
        { role: "user", content: lang === "ru" ? "Этот кадр подходит?" : "Does this frame match?" }
      ];
      try {
        const ans = await this._oneShotWithImages(messages, [{ dataUrl: f.dataUrl }]);
        if (/^\s*yes\b/i.test(ans || "")) {
          matches.push({ time: f.time, dataUrl: f.dataUrl });
        }
      } catch (e) {
        // Throw on first frame if model doesn't support images
        if (i === 0) throw e;
      }
    }

    onChunk?.("", { type: "find-result", matches, query, total, videoName: videoFile.name });
  }

  _fmtTime(sec) {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  /* ============================================================
     VISION TRANSPORT — Ollama + OpenAI compatible
     ============================================================ */

  /**
   * Streaming chat with images. Mutates last user message to include images
   * in the format expected by the backend.
   */
  async _streamWithImages(messages, images, onChunk, lang) {
    const cfg = this.engineCfg();
    const last = messages[messages.length - 1];

    if (cfg.api === "ollama") {
      last.images = images.map(img => img.dataUrl.split(",")[1]);
      return this._streamOllamaVision(messages, onChunk, lang);
    }
    last.content = [
      { type: "text", text: typeof last.content === "string" ? last.content : "" },
      ...images.map(img => ({ type: "image_url", image_url: { url: img.dataUrl } }))
    ];
    return this._streamOpenAIVision(messages, onChunk, lang);
  }

  /** Non-stream short call with images (used for find mode yes/no). */
  async _oneShotWithImages(messages, images) {
    const cfg = this.engineCfg();
    const last = messages[messages.length - 1];
    let body;

    if (cfg.api === "ollama") {
      last.images = images.map(img => img.dataUrl.split(",")[1]);
      body = { model: this.model, messages, stream: false, options: { temperature: 0.1, num_ctx: 4096 } };
    } else {
      last.content = [
        { type: "text", text: typeof last.content === "string" ? last.content : "" },
        ...images.map(img => ({ type: "image_url", image_url: { url: img.dataUrl } }))
      ];
      body = { model: this.model, messages, stream: false, temperature: 0.1 };
    }

    const headers = { "Content-Type": "application/json" };
    if (cfg.api !== "ollama" && this.apiKey) headers.Authorization = "Bearer " + this.apiKey;
    const path = cfg.api === "ollama" ? "/api/chat" : "/chat/completions";

    const res = await this._fetch(this.baseUrl + path, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const t = await res.text();
      throw this._visionError(t, res.status);
    }
    const j = await res.json();
    return cfg.api === "ollama" ? (j.message?.content || "") : (j.choices?.[0]?.message?.content || "");
  }

  async _streamOllamaVision(messages, onChunk, lang) {
    const body = { model: this.model, messages, stream: true,
                   options: { temperature: 0.75, top_p: 0.92, num_ctx: 8192 } };
    let res;
    try {
      res = await this._fetch(this.baseUrl + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      throw new Error(lang === "ru"
        ? `Не могу достучаться до Ollama (${this.baseUrl}). Запущен ли \`ollama serve\`?`
        : `Can't reach Ollama at ${this.baseUrl}.`);
    }
    if (!res.ok) {
      const t = await res.text();
      throw this._visionError(t, res.status, lang);
    }
    const full = await this._readNDJSON(res, onChunk, (j) => j.message?.content || "");
    return this._cleanLangBleed(full, lang);
  }

  async _streamOpenAIVision(messages, onChunk, lang) {
    const body = { model: this.model, messages, stream: true, temperature: 0.75 };
    const headers = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = "Bearer " + this.apiKey;

    let res;
    try {
      res = await this._fetch(this.baseUrl + "/chat/completions", {
        method: "POST", headers, body: JSON.stringify(body)
      });
    } catch {
      throw new Error(`Can't reach ${this.baseUrl}`);
    }
    if (!res.ok) {
      const t = await res.text();
      throw this._visionError(t, res.status, lang);
    }
    const full = await this._readSSE(res, onChunk);
    return this._cleanLangBleed(full, lang);
  }

  _visionError(errText, status, lang = "en") {
    const t = (errText || "").toLowerCase();
    if (/does not support images?|no image/i.test(t) ||
        /unknown field "images"/i.test(t) ||
        /invalid content type/i.test(t) ||
        status === 400) {
      return new Error(lang === "ru"
        ? `Текущая модель "${this.model}" не умеет смотреть на изображения. Открой админку и переключись на vision-модель: ollama pull llama3.2-vision (или GPT-4o / Claude 3.5 / Gemini через OpenAI-совместимый эндпоинт).`
        : `Current model "${this.model}" can't see images. Switch to a vision model: \`ollama pull llama3.2-vision\` — or use GPT-4o / Claude / Gemini via the OpenAI-compatible endpoint in admin.`);
    }
    if (status === 401) return new Error(lang === "ru" ? "Неверный API-ключ" : "Invalid API key");
    return new Error(`Vision error ${status}: ${(errText || "").slice(0, 200)}`);
  }

  /* ============================================================
     GENERATE STRUCTURED IDEAS for the Library view.
     Returns a parsed array of idea objects.
     ============================================================ */
  async generateIdeas({ count = 9, nicheFilter = null } = {}) {
    const c = this.userContext || {};
    const niche    = nicheFilter || c.niche    || "general creators / solopreneurs";
    const platform = c.platform || "TikTok, Instagram Reels, LinkedIn, X";
    const lang = c.niche && /[Ѐ-ӿ]/.test(c.niche) ? "ru" : "en";

    const sys = `You are Alma — a viral content idea generator.
Generate ${count} fresh, distinct content ideas in the user's niche.
Each idea should be REAL and ready to execute, not generic advice.

Output ONLY a JSON array of ${count} objects, no prose, no markdown fence.
Each object MUST have these exact keys:
{
  "title": "short punchy title (3-6 words)",
  "niche": "the user's niche, 1-2 words",
  "platform": "single best platform for THIS idea (TikTok / Reels / Shorts / LinkedIn / X / Threads / YouTube)",
  "multiplier": "estimated view multiplier vs niche average, format like '8.4x' (range 2x-15x)",
  "hookType": "Contrarian | Curiosity | Number list | Personal stake | Pattern interrupt | Bold claim | Question | Story",
  "hook": "the actual opening line, in ${lang === 'ru' ? 'Russian' : 'English'}, in quotes-free string",
  "format": "post | thread | carousel | reel | short | long-form",
  "desc": "1-sentence WHY it works, naming the mechanism (~15 words, in ${lang === 'ru' ? 'Russian' : 'English'})"
}

Make ideas diverse — different platforms, different hook types, different formats.
At least 2 ideas should be contrarian / risky.
At least 1 should be a specific personal-story format.
At least 1 should be a teardown / comparison.

User niche: ${niche}
User platform focus: ${platform}`;

    const messages = [
      { role: "system", content: sys },
      { role: "user", content: `Generate ${count} ideas now as a JSON array. Only JSON.` }
    ];

    const raw = await this._oneShot(messages, { temperature: 0.95, num_predict: 1600 });
    const arr = this._safeJsonArray(raw);
    if (!Array.isArray(arr) || !arr.length) return null;

    // Sanitize / coerce
    return arr.slice(0, count).map(x => ({
      title:      String(x.title || "Untitled").slice(0, 80),
      niche:      String(x.niche || niche).slice(0, 30),
      platform:   String(x.platform || "TikTok").slice(0, 24),
      multiplier: String(x.multiplier || "3.0x").replace(/[^0-9.x×]/gi, "").replace("X", "x") || "3.0x",
      hookType:   String(x.hookType || "Curiosity").slice(0, 24),
      hook:       String(x.hook || "").slice(0, 220),
      format:     String(x.format || "post").slice(0, 16),
      desc:       String(x.desc || "").slice(0, 220)
    }));
  }

  /* ---------- backend streaming ----------
     opts: { temperature?: number, num_predict?: number }
     If omitted, defaults to "creative" 0.85 / 700 tokens (back-compat).
     ----------------------------------------- */
  async _stream(messages, onChunk, opts = {}) {
    const cfg = this.engineCfg();
    if (cfg.api === "ollama") return this._streamOllama(messages, onChunk, opts);
    return this._streamOpenAI(messages, onChunk, opts);
  }

  /** Fast streaming for chat-mode: lower temperature, smaller context, capped tokens. */
  async _streamChat(messages, onChunk, lang) {
    const cfg = this.engineCfg();
    if (cfg.api === "ollama") {
      const body = {
        model: this.model, messages, stream: true,
        options: {
          temperature: 0.4,
          top_p: 0.9,
          num_ctx: 4096,        // bigger context = remembers voice + history
          num_predict: 280      // allows fuller replies without dragging
        }
      };
      let res;
      try {
        res = await this._fetch(this.baseUrl + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      } catch {
        throw new Error("Can't reach Ollama at " + this.baseUrl);
      }
      await this._throwIf402(res);
      if (!res.ok) {
        const t = await res.text();
        throw new Error("Ollama error: " + t.slice(0, 240));
      }
      return this._readNDJSON(res, onChunk, (j) => j.message?.content || "");
    }
    // OpenAI-compatible
    const body = {
      model: this.model, messages, stream: true,
      temperature: 0.4, top_p: 0.9, max_tokens: 320
    };
    const headers = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = "Bearer " + this.apiKey;
    const res = await this._fetch(this.baseUrl + "/chat/completions", {
      method: "POST", headers, body: JSON.stringify(body)
    });
    await this._throwIf402(res);
    if (!res.ok) throw new Error("OpenAI error " + res.status);
    return this._readSSE(res, onChunk);
  }

  async _streamOllama(messages, onChunk, opts = {}) {
    const body = {
      model: this.model, messages, stream: true,
      options: {
        temperature: opts.temperature ?? 0.85,
        top_p: 0.92,
        num_ctx: 8192,
        num_predict: opts.num_predict ?? 700
      }
    };
    let res;
    try {
      res = await this._fetch(this.baseUrl + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      throw new Error("Can't reach Ollama at " + this.baseUrl + ". Is `ollama serve` running?");
    }
    await this._throwIf402(res);
    if (!res.ok) {
      const text = await res.text();
      if (/model .* not found/i.test(text))
        throw new Error(`Model "${this.model}" not installed. Run: ollama pull ${this.model}`);
      throw new Error("Ollama error: " + text.slice(0, 240));
    }
    return this._readNDJSON(res, onChunk, (json) => json.message?.content || "");
  }

  async _streamOpenAI(messages, onChunk, opts = {}) {
    const body = {
      model: this.model, messages, stream: true,
      temperature: opts.temperature ?? 0.85,
      top_p: 0.92,
      max_tokens: opts.num_predict ?? 700
    };
    const headers = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = "Bearer " + this.apiKey;

    let res;
    try {
      res = await this._fetch(this.baseUrl + "/chat/completions", {
        method: "POST", headers, body: JSON.stringify(body)
      });
    } catch {
      throw new Error("Can't reach " + this.baseUrl);
    }
    await this._throwIf402(res);
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) throw new Error("Invalid API key. Set it in settings.");
      if (res.status === 404) throw new Error(`Model "${this.model}" not found on this server.`);
      throw new Error(`Server ${res.status}: ${text.slice(0, 240)}`);
    }
    return this._readSSE(res, onChunk);
  }

  /* ---------- stream parsers ---------- */
  async _readNDJSON(res, onChunk, extract) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop();
      for (const ln of lines) {
        if (!ln.trim()) continue;
        try {
          const j = JSON.parse(ln);
          const piece = extract(j);
          if (piece) { full += piece; onChunk?.(piece, { type: "token" }); }
        } catch {}
      }
    }
    return full;
  }

  async _readSSE(res, onChunk) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop();
      for (const ln of lines) {
        const line = ln.trim();
        if (!line || !line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return full;
        try {
          const j = JSON.parse(data);
          const piece = j.choices?.[0]?.delta?.content || "";
          if (piece) { full += piece; onChunk?.(piece, { type: "token" }); }
        } catch {}
      }
    }
    return full;
  }
}

window.EdenAgent = EdenAgent;
window.EDEN_ENGINES = ENGINES;
