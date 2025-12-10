import jsPDF from "jspdf";
import { PDF_MARGINS, PDF_USABLE_WIDTH, FONT } from "./constants";
import {
    safeText,
    pickTitleText,
    pickShortDescText,
    timeLocaleString,
    offerKindLabel,
    normSource,
    TT,
    pdfSafe,
    pickCandidateLangBlock,
    pickCandidateName,
    pickCandidateScorePct,
    candidateSummaryLists
} from "./format";


const COLORS = { primary: "#171C3F", accent: "#cf3a34" };

function setTextColorHex(doc, hex) {
    const h = (hex || "").replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    doc.setTextColor(r, g, b);
}

function setPrimary(doc) { setTextColorHex(doc, COLORS.primary); }
function setAccent(doc) { setTextColorHex(doc, COLORS.accent); }


function writeWrapped(doc, lines, left, y, lineH = 6) {
    for (const ln of lines) {
        const txt = pdfSafe(ln);
        if (y > 280) {
            doc.addPage();
            y = PDF_MARGINS.top;
        }
        doc.text(txt, left, y);
        y += lineH;
    }
    return y;
}


function wrapFactory(doc) {
    return (text, width = PDF_USABLE_WIDTH) => {
        const clean = pdfSafe(text);
        return doc.splitTextToSize(clean, width);
    };
}
function writeBullets(doc, lines, left, y, wrap, indent = 2, lineH = 5) {
    doc.setFont(FONT.FAMILY, "normal");
    doc.setFontSize(FONT.TEXT);
    for (const ln of lines) {
        if (String(ln).trim().startsWith("[-]")) setAccent(doc);
        else setPrimary(doc);

        const wrapped = wrap(`- ${ln}`);
        y = writeWrapped(doc, wrapped, left + indent, y, lineH);
    }
    setPrimary(doc);
    return y;
}

function writeSectionTitle(doc, title, left, y) {
    setPrimary(doc);
    doc.setFont(FONT.FAMILY, "bold");
    doc.setFontSize(FONT.H1);
    doc.text(title, left, y);
    return y + 6;
}


const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string";
const arr = (v) => (Array.isArray(v) ? v : []);
const s = (v) => (isStr(v) ? v : "");

function _plur(n, singulier, pluriel) {
    return `${n} ${n > 1 ? pluriel : singulier}`;
}
function humanizeSkill(sk) {
    if (!sk) return "";
    if (!isObj(sk)) return s(sk);

    const name = s(sk.name) || s(sk.normalized);
    if (!name) return "";

    const parts = [];
    if (sk.must_have) parts.push("Obligatoire");
    if (sk.proficiency) parts.push(String(sk.proficiency));
    if (sk.years_min != null) parts.push(`au moins ${_plur(sk.years_min, "an", "ans")}`);
    if (sk.recency_months_max != null) parts.push(`expérience dans les ${sk.recency_months_max} derniers mois`);

    const versions = arr(sk.versions_or_flavors).filter(Boolean);
    if (versions.length) parts.push(versions[0]);

    const subskills = arr(sk.subskills).filter(Boolean);
    if (subskills.length) parts.push(subskills.slice(0, 2).join(" / "));

    return [name, parts.length ? `— ${parts.join(", ")}` : ""].filter(Boolean).join(" ");
}

function summarizeDesiredExperience(de) {
    if (!de) return [];
    if (!isObj(de)) return [s(de)].filter(Boolean);

    const lines = [];
    const hasMin = de.years_min != null;
    const hasMax = de.years_max != null;

    if (hasMin && hasMax) lines.push(`Expérience : entre ${de.years_min} et ${de.years_max} ans`);
    else if (hasMin) lines.push(`Expérience : au moins ${_plur(de.years_min, "an", "ans")}`);
    else if (hasMax) lines.push(`Expérience : jusqu'à ${_plur(de.years_max, "an", "ans")}`);

    if (de.work_model) lines.push(`Modèle : ${de.work_model}`);
    if (de.client_facing != null) lines.push(`Client : ${de.client_facing ? "oui" : "non"}`);
    if (de.travel_percent_max != null) lines.push(`Déplacements : jusqu'à ${de.travel_percent_max}%`);

    if (isObj(de.location)) {
        const loc = [de.location.city, de.location.region_or_state, de.location.country]
            .filter(Boolean).join(", ");
        if (loc) lines.push(`Localisation : ${loc}`);
    }

    const pushList = (label, list) => {
        const v = arr(list).filter(Boolean);
        if (v.length) lines.push(`${label} : ${v.join(", ")}`);
    };
    pushList("Secteurs", de.industries);
    pushList("Domaines", de.domains);
    pushList("Méthodologies", de.methodologies);
    pushList("Environnements", de.environments);
    pushList("Habilitations", de.security_clearance);
    pushList("Exemples projets", de.notable_project_examples);

    if (Array.isArray(de.team_size_range) && de.team_size_range.length === 2) {
        lines.push(`Taille d'équipe : de ${de.team_size_range[0]} à ${de.team_size_range[1]}`);
    }
    if (isObj(de.leadership)) {
        const lead = [];
        if (de.leadership.people_managed_min != null)
            lead.push(`personnes gérées : au moins ${de.leadership.people_managed_min}`);
        if (de.leadership.projects_led_min != null)
            lead.push(`projets menés : au moins ${de.leadership.projects_led_min}`);
        if (lead.length) lines.push(`Leadership : ${lead.join(" , ")}`);
    }

    return lines;
}

function explodeQualifications(q) {
    if (!q) return [];
    if (!isObj(q)) return [s(q)].filter(Boolean);
    const out = [];

    if (isObj(q.education)) {
        const eg = [];
        if (q.education.degree_level_min) eg.push(`Min: ${q.education.degree_level_min}`);
        const fos = arr(q.education.fields_of_study).filter(Boolean).join(", ");
        if (fos) eg.push(fos);
        if (eg.length) out.push(`Éducation: ${eg.join(" · ")}`);
    }

    const certs = arr(q.certifications)
        .map((c) => {
            if (isObj(c)) {
                const nm = s(c.name);
                const iss = s(c.issuer);
                const req = c.required === true ? " (Obligatoire)" : "";
                if (!nm) return "";
                return iss ? `${nm} — ${iss}${req}` : `${nm}${req}`;
            }
            return s(c);
        })
        .filter(Boolean);
    if (certs.length) out.push(`Certifications: ${certs.join(", ")}`);

    const langs = arr(q.languages)
        .map((l) => {
            if (isObj(l)) {
                const nm = s(l.name);
                const lv = s(l.level);
                return nm ? `${nm}${lv ? ` (${lv})` : ""}` : "";
            }
            return s(l);
        })
        .filter(Boolean);
    if (langs.length) out.push(`Langues: ${langs.join(", ")}`);

    const wa = arr(q.work_authorization)
        .map((w) => {
            if (isObj(w)) {
                const c = s(w.country);
                const req = w.required ? "Obligatoire" : "Optionnel";
                return c ? `${c} — ${req}` : "";
            }
            return s(w);
        })
        .filter(Boolean);
    if (wa.length) out.push(`Autorisation de travail: ${wa.join(", ")}`);

    const bkg = arr(q.background_checks).filter(Boolean);
    if (bkg.length) out.push(`Vérifs d'antécédents: ${bkg.join(", ")}`);

    const phys = arr(q.physical_requirements).filter(Boolean);
    if (phys.length) out.push(`Exigences physiques: ${phys.join(", ")}`);

    const other = arr(q.other).filter(Boolean);
    if (other.length) out.push(`Autres: ${other.join(", ")}`);

    return out;
}

function collectExtras(job) {
    const lines = [];
    const pushKV = (label, v) => {
        if (v == null || v === "") return;
        lines.push(`${label}: ${v}`);
    };

    pushKV("Type de contrat", job.employment_type || job.contract_type);
    pushKV("Modèle de travail", job.work_model);
    pushKV("Horaires", job.schedule);
    pushKV("Séniorité", isObj(job.job_title) ? job.job_title?.seniority : "");
    const domains = arr(job?.short_description?.domain_keywords).join(", ");
    if (domains) pushKV("Domaines", domains);
    const industries = arr(job?.industries).join(", ");
    if (industries) pushKV("Secteurs", industries);

    if (isObj(job.compensation)) {
        const c = job.compensation;
        const parts = [];
        if (c.currency) parts.push(c.currency);
        if (c.min != null && c.max != null) parts.push(`${c.min}–${c.max}`);
        else if (c.min != null) parts.push(`≥ ${c.min}`);
        else if (c.max != null) parts.push(`≤ ${c.max}`);
        if (c.period) parts.push(`/${c.period}`);
        if (parts.length) pushKV("Rémunération", parts.join(" "));
    } else if (job.salary_range) {
        pushKV("Rémunération", job.salary_range);
    }

    const benefits = arr(job.benefits).filter(Boolean);
    if (benefits.length) lines.push(`Avantages: ${benefits.join(", ")}`);

    return lines;
}

export function exportMatchingPdf({ item, lang = "fr", t }) {
    const job = item?.job_description?.[lang] || {};
    const matches = Array.isArray(item?.matches) ? item.matches : [];
    const analysisDate = timeLocaleString(item?.date, lang);

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const wrap = wrapFactory(doc);
    setPrimary(doc);

    let y = PDF_MARGINS.top;
    const left = PDF_MARGINS.left;

    const title = pickTitleText(job) || TT(t, lang, "job", "Poste", "Job");
    doc.setFont(FONT.FAMILY, "bold");
    doc.setFontSize(FONT.TITLE);
    doc.text(`${TT(t, lang, "analysis", "Analyse", "Analysis")} — ${title}`, left, y);
    y += 8;

    doc.setFont(FONT.FAMILY, "normal");
    doc.setFontSize(FONT.TEXT);

    const metaLines = [];
    metaLines.push(`${TT(t, lang, "analysis_date", "Date d’analyse", "Analysis date")}: ${analysisDate}`);
    metaLines.push(`${TT(t, lang, "candidate_source", "Source candidats", "Candidate source")}: ${normSource(item?.candidate_source)}`);
    metaLines.push(`${TT(t, lang, "offer_type", "Type d’offre", "Offer type")}: ${offerKindLabel(item, lang)}`);
    const dep = safeText(job?.department);
    if (dep) metaLines.push(`${TT(t, lang, "department", "Département", "Department")}: ${dep}`);
    const loc = safeText(job?.location);
    if (loc) metaLines.push(`${TT(t, lang, "location", "Localisation", "Location")}: ${loc}`);
    metaLines.push(`${TT(t, lang, "matches_found", "Correspondances trouvées", "Matches found")}: ${matches.length}`);
    y = writeWrapped(doc, metaLines, left, y);
    y += 4;

    const shortDesc = pickShortDescText(job);
    if (shortDesc) {
        y = writeSectionTitle(doc, TT(t, lang, "description_title", "Description courte", "Short description"), left, y);
        doc.setFont(FONT.FAMILY, "normal");
        doc.setFontSize(FONT.TEXT);
        y = writeWrapped(doc, wrap(shortDesc), left, y);
        y += 4;
    }

    const fullDesc =
        safeText(job.full_description) ||
        safeText(job.description) ||
        safeText(job.raw) ||
        "";

    if (fullDesc) {
        y = writeSectionTitle(
            doc,
            TT(t, lang, "full_job_description", "Description complète du poste", "Full job description"),
            left,
            y
        );
        doc.setFont(FONT.FAMILY, "normal");
        doc.setFontSize(FONT.TEXT);
        y = writeWrapped(doc, wrap(fullDesc), left, y);
        y += 2;
    }

    const respList = arr(job.responsibilities)
        .map((r) => (isObj(r) ? s(r.statement) : s(r)))
        .filter(Boolean);
    if (respList.length) {
        y = writeSectionTitle(doc, TT(t, lang, "responsibilities", "Responsabilités", "Responsibilities"), left, y);
        y = writeBullets(doc, respList, left, y, wrap);
        y += 2;
    }

    const skillsList = arr(job.required_skills).map(humanizeSkill).filter(Boolean);
    if (skillsList.length) {
        y = writeSectionTitle(doc, TT(t, lang, "skills", "Compétences", "Skills"), left, y);
        y = writeBullets(doc, skillsList, left, y, wrap);
        y += 2;
    }

    const experienceList = summarizeDesiredExperience(job.desired_experience);
    if (experienceList.length) {
        y = writeSectionTitle(doc, TT(t, lang, "experience", "Expérience souhaitée", "Desired experience"), left, y);
        y = writeBullets(doc, experienceList, left, y, wrap);
        y += 2;
    }

    const qualificationsList = Array.isArray(job.qualifications)
        ? job.qualifications.map((q) => (isStr(q) ? q : JSON.stringify(q))).filter(Boolean)
        : explodeQualifications(job.qualifications);
    if (qualificationsList.length) {
        y = writeSectionTitle(doc, TT(t, lang, "qualifications", "Qualifications", "Qualifications"), left, y);
        y = writeBullets(doc, qualificationsList, left, y, wrap);
        y += 2;
    }

    const extras = collectExtras(job);
    if (extras.length) {
        y = writeSectionTitle(doc, TT(t, lang, "additional_info", "Informations complémentaires", "Additional information"), left, y);
        y = writeBullets(doc, extras, left, y, wrap);
        y += 2;
    }

    y = writeSectionTitle(doc, TT(t, lang, "candidates", "Candidats", "Candidates"), left, y);
    doc.setFont(FONT.FAMILY, "normal");
    doc.setFontSize(FONT.TEXT);

    if (!matches.length) {
        y = writeWrapped(doc, ["-"], left, y);
        y += 6;
    } else {
        matches.forEach((candidate, i) => {
            const data = pickCandidateLangBlock(candidate, lang);
            const name = pickCandidateName(candidate, data, t, lang);

            const pct = pickCandidateScorePct(candidate, data, lang);

            doc.setFont(FONT.FAMILY, "bold");
            doc.setFontSize(FONT.H2 || 12);
            y = writeWrapped(doc, [`${i + 1}. ${name} — ${pct}%`], left, y);
            doc.setFont(FONT.FAMILY, "normal");
            doc.setFontSize(FONT.TEXT);

            const {
                skills_matched, skills_missing,
                experience_matched, experience_missing,
                qualifications_matched, qualifications_missing,
                reasoning, suggestions
            } = candidateSummaryLists(candidate, data);

            if (reasoning) {
                y = writeWrapped(doc, wrap(reasoning), left + 2, y, 5);
                y += 2;
            }

            const skillsLabel = TT(t, lang, "skills", "Compétences", "Skills");
            if (skills_matched.length || skills_missing.length) {
                doc.setFont(FONT.FAMILY, "bold");
                doc.setFontSize(FONT.H2 || 12);
                y = writeWrapped(doc, [skillsLabel], left, y);

                doc.setFont(FONT.FAMILY, "normal");
                doc.setFontSize(FONT.TEXT);
                const lines = [
                    ...(skills_matched.length ? [`[+] ${skills_matched.join(" • ")}`] : []),
                    ...(skills_missing.length ? [`[-] ${skills_missing.join(" • ")}`] : []),
                ];
                y = writeBullets(doc, lines, left, y, wrap);
                y += 2;
            }

            const expLabel = TT(t, lang, "experience", "Expérience", "Experience");
            if (experience_matched.length || experience_missing.length) {
                doc.setFont(FONT.FAMILY, "bold");
                doc.setFontSize(FONT.H2 || 12);
                y = writeWrapped(doc, [expLabel], left, y);

                doc.setFont(FONT.FAMILY, "normal");
                doc.setFontSize(FONT.TEXT);
                const lines = [
                    ...(experience_matched.length ? [`[+] ${experience_matched.join(" • ")}`] : []),
                    ...(experience_missing.length ? [`[-] ${experience_missing.join(" • ")}`] : []),
                ];
                y = writeBullets(doc, lines, left, y, wrap);
                y += 2;
            }

            const qualLabel = TT(t, lang, "qualifications", "Qualifications", "Qualifications");
            if (qualifications_matched.length || qualifications_missing.length) {
                doc.setFont(FONT.FAMILY, "bold");
                doc.setFontSize(FONT.H2 || 12);
                y = writeWrapped(doc, [qualLabel], left, y);

                doc.setFont(FONT.FAMILY, "normal");
                doc.setFontSize(FONT.TEXT);
                const lines = [
                    ...(qualifications_matched.length ? [`[+] ${qualifications_matched.join(" • ")}`] : []),
                    ...(qualifications_missing.length ? [`[-] ${qualifications_missing.join(" • ")}`] : []),
                ];
                y = writeBullets(doc, lines, left, y, wrap);
                y += 2;
            }

            if (Array.isArray(suggestions) && suggestions.length) {
                const label = TT(t, lang, "program_suggestions", "Suggestions de programme", "Program Suggestions");
                doc.setFont(FONT.FAMILY, "bold");
                doc.setFontSize(FONT.H2 || 12);
                y = writeWrapped(doc, [label], left, y);

                const lines = suggestions
                    .map((s) => {
                        if (typeof s === "string") return s;
                        if (s && typeof s === "object") {
                            const rec = s.recommendation || {};
                            const name2 = pdfSafe(rec.best_match || "");
                            const url = pdfSafe(rec.url || "");
                            const reason2 = pdfSafe(rec.reason || "");
                            const missing = pdfSafe(s.missing || "");
                            const parts = [];
                            if (missing) parts.push(`Need: ${missing}`);
                            if (name2 && url) parts.push(`See: ${name2} — ${url}`);
                            else if (name2) parts.push(`See: ${name2}`);
                            if (reason2) parts.push(reason2);
                            return parts.filter(Boolean).join("\n");
                        }
                        return "";
                    })
                    .filter(Boolean);

                y = writeBullets(doc, lines, left, y, wrap);
                y += 2;
            }

            y += 2;
        });
    }

    const safeName = (title || "analysis").replace(/\s+/g, "_");
    const dateForName = analysisDate.replace(/[/:,\s]/g, "-");
    const fileName = `${safeName}_${dateForName}.pdf`;
    doc.save(fileName);
}
