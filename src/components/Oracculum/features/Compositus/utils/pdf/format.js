import { LABELS } from "./constants";

export function i18n(lang, key, fallback) {
    const L = LABELS[lang] || LABELS.fr;
    return L[key] ?? fallback ?? key;
}

export function TT(t, lang, key, fr, en) {
    if (typeof t === "function") {
        const v = t(key);
        if (v && v !== key) return v;
    }
    return lang === "fr" ? fr : en;
}

export function safeText(v) {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object") {
        return v.name || v.normalized || v.summary || v.raw || "";
    }
    return "";
}

export function pickTitleText(job) {
    const jt = job?.job_title;
    if (!jt) return "";
    if (typeof jt === "string") return jt;
    return jt.normalized || jt.raw || "";
}

export function pickShortDescText(job) {
    const sd = job?.short_description;
    if (!sd) return "";
    if (typeof sd === "string") return sd;
    return sd.summary || "";
}

export function timeLocaleString(iso, lang) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString(lang === "fr" ? "fr-FR" : "en-US");
}

export function offerKindLabel(item, lang) {
    const mode = String(item?.offer_mode || "").toLowerCase();
    const isExisting =
        typeof item?.is_new_offer === "boolean"
            ? !item.is_new_offer
            : mode === "existing";
    return isExisting ? i18n(lang, "offer_existing") : i18n(lang, "offer_new");
}

export function normSource(v) {
    return (v || "internal").toLowerCase();
}

export function pdfSafe(v) {
    if (v == null) return "";
    let s = String(v);

    try {
        s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    } catch { }

    s = s
        .replace(/[•●▪︎◦]/g, "- ")
        .replace(/[“”«»]/g, '"')
        .replace(/[’]/g, "'")
        .replace(/[–—]/g, "-")
        .replace(/\u00A0/g, " ");

    s = s.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");

    return s;
}

const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeStr = (v) => (v == null ? "" : String(v));

const clamp01 = (x) => {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
};
const toPct = (x) => {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return n <= 1 ? Math.round(clamp01(n) * 100) : Math.round(Math.max(0, Math.min(100, n)));
};

const stripExt = (filename) =>
    typeof filename === "string" ? filename.replace(/\.(pdf|docx?|rtf|txt)$/i, "") : filename;

function getLangBlock(obj, lang) {
    if (!obj || typeof obj !== "object") return {};
    return obj?.[lang] ?? obj?.en ?? obj?.fr ?? obj ?? {};
}

export function pickCandidateLangBlock(candidate, lang) {
    const llmBlock = getLangBlock(candidate?.llm, lang);
    const mainBlock = getLangBlock(candidate, lang);
    return llmBlock && Object.keys(llmBlock).length > 0 ? llmBlock : mainBlock;
}

export function pickCandidateName(candidate, data, t, lang) {
    return (
        candidate?.name ||
        candidate?.displayName ||
        data?.name ||
        candidate?._raw?.llm?.[lang]?.name ||
        candidate?._raw?.llm?.en?.name ||
        candidate?._raw?.name ||
        TT(t, lang, "no_name", "Sans nom", "No name")
    );
}

export function pickCandidateScorePct(candidate, data, lang) {
    if (Number.isFinite(Number(candidate?.score))) return Math.round(Number(candidate.score));
    if (Number.isFinite(Number(candidate?.percentage))) return Math.round(Number(candidate.percentage));

    if (Number.isFinite(Number(data?.combined_score))) return toPct(Number(data.combined_score));
    if (Number.isFinite(Number(data?.match_score))) return Math.round(Number(data.match_score));

    const raw = candidate?._raw ?? candidate ?? {};
    const cs = raw?.combined_score;

    if (Array.isArray(cs)) {
        const id = raw?.collab_key || stripExt(raw?.name);
        const found =
            cs.find((c) => c?.collab_key && c.collab_key === id) ||
            cs.find((c) => stripExt(c?.name) === id);

        if (found) {
            if (Number.isFinite(Number(found.combined_score))) return toPct(Number(found.combined_score));
            if (Number.isFinite(Number(found.score))) return toPct(Number(found.score));
        }
    }

    if (Number.isFinite(Number(raw?.combined_score))) return toPct(Number(raw.combined_score));
    if (Number.isFinite(Number(raw?.score))) return toPct(Number(raw.score));
    if (Number.isFinite(Number(raw?.embedding_score))) return toPct(Number(raw.embedding_score));

    return 0;
}

export function candidateSummaryLists(candidate, data) {
    const summary = (data && typeof data === "object" && data.summary) || {};
    return {
        skills_matched: safeArr(summary.skills_matched),
        skills_missing: safeArr(summary.skills_missing),
        experience_matched: safeArr(summary.experience_matched),
        experience_missing: safeArr(summary.experience_missing),
        qualifications_matched: safeArr(summary.qualifications_matched),
        qualifications_missing: safeArr(summary.qualifications_missing),
        reasoning: safeStr((data && data.reasoning) || ""),
        suggestions: Array.isArray(data?.suggestions)
            ? data.suggestions
            : Array.isArray(candidate?.suggestions)
                ? candidate.suggestions
                : [],
    };
}
