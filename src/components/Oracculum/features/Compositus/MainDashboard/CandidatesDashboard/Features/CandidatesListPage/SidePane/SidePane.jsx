import React, { useMemo } from "react";
import styles from "./SidePane.module.css";
import { useTranslation } from "../../../../../../../../../utils/useTranslation";

function isVacataireItem(item) {
  if (!item) return false;
  if (item?._source === "externe") return true;
  if (Array.isArray(item?.sources) && item.sources.includes("Vacataires")) return true;
  if (item?.parsed || item?.cv?.parsed) return true;
  return false;
}

function safeJoin(arr, sep = ", ") {
  return Array.isArray(arr) ? arr.filter(Boolean).join(sep) : "";
}

function fmtDate(y) {
  if (!y) return "—";
  const s = String(y).trim();
  return s.toLowerCase() === "present" ? "Présent" : s;
}

function fmtYear(value) {
  if (!value) return "—";
  const s = String(value).trim().toLowerCase();
  if (s === "present") return "Présent";
  const match = s.match(/\d{4}/);
  return match ? match[0] : "—";
}

export default function SidePane({ open, onClose, item, mode }) {
  const isVac = isVacataireItem(item);
  const { t } = useTranslation();

  const historyYears = useMemo(() => {
    const h = item?.history || {};
    return Object.keys(h).sort().reverse();
  }, [item]);

  const parsedRaw = item?.parsed || item?.cv?.parsed || null;

  const iden = parsedRaw?.identity || {};
  const contacts = parsedRaw?.contacts || {};
  const skillsHard = parsedRaw?.skills?.hard || [];
  const skillsSoft = parsedRaw?.skills?.soft || [];
  const languages = parsedRaw?.skills?.languages || [];
  const projects = parsedRaw?.projects || [];
  const certifs = parsedRaw?.certifications || [];
  const education = parsedRaw?.education || [];
  const experience = Array.isArray(parsedRaw?.experience) ? parsedRaw.experience : [];

  const experienceSorted = useMemo(() => {
    const toRank = (e) => {
      const end =
        e?.end && String(e.end).toLowerCase() !== "present"
          ? Number(String(e.end).slice(0, 4))
          : 9999;
      const start = e?.start ? Number(String(e.start).slice(0, 4)) : -1;
      return (end || -1) * 10000 + (start || -1);
    };
    return [...experience].sort((a, b) => toRank(b) - toRank(a));
  }, [experience]);

  const llmSummary = item?.summary?.llm || null;
  const profIdentity = llmSummary?.identity || {};
  const profCompetencies = llmSummary?.competencies || {};
  const profStrengths = Array.isArray(llmSummary?.strengths) ? llmSummary.strengths : [];
  const profDevNeeds = Array.isArray(llmSummary?.development_needs)
    ? llmSummary.development_needs
    : [];
  const profRoles = Array.isArray(llmSummary?.recommended_roles)
    ? llmSummary.recommended_roles
    : [];
  const profSummaryLong = llmSummary?.summary_long || item?.summary?.summary_long || "";

  const displayedName =
    item?.summary?.identity?.name ||
    iden?.full_name ||
    item?.collab_key ||
    "—";

  const currentRole =
    item?.Academic_Title ||
    profIdentity?.academic_title ||
    item?.summary?.identity?.current_role ||
    iden?.current_title?.raw ||
    iden?.current_title?.normalized ||
    "—";

  const nip = item?.NIP || profIdentity?.nip || "—";
  const campus = item?.Campus || profIdentity?.campus || "—";
  const discipline = item?.Discipline || profIdentity?.discipline || "—";
  const positionType = item?.Position_Type || profIdentity?.position_type || "—";
  const academy = item?.Academy || profIdentity?.academy || "—";
  const researchCenter = item?.Research_Center || profIdentity?.research_center || "—";
  const fte = item?.FTE || "—";
  const workload24 = item?.Workload_2024_25 || "—";
  const workload25 = item?.Workload_2025_26 || "—";
  const aacsb = item?.AACSB_Qualification || "—";
  const cefdq = item?.CEFDG_Qualification || item?.CEFDG_Qualification || "—";

  const researchInterests = Array.isArray(item?.Research_Interests)
    ? item.Research_Interests
    : profCompetencies?.research || [];

  const teachingInterests = Array.isArray(item?.Teaching_Interests)
    ? item.Teaching_Interests
    : profCompetencies?.teaching || [];

  const unifiedCompetencies = Array.isArray(item?.Unified_Competencies)
    ? item.Unified_Competencies
    : [];

  const publicationCount =
    typeof item?.Publication_Count === "number"
      ? item.Publication_Count
      : null;
  const publicationYears = Array.isArray(item?.Publication_Years)
    ? item.Publication_Years
    : [];
  const publicationTitles = Array.isArray(item?.Publication_Titles)
    ? item.Publication_Titles
    : [];
  const journals = Array.isArray(item?.Journals) ? item.Journals : [];

  return (
    <aside
      className={`${styles.pane} ${open ? styles.open : ""}`}
      aria-hidden={!open}
    >
      <div className={styles.head}>
        <div className={styles.title}>
          {isVac ? displayedName : nip || displayedName}
        </div>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label={t("pane_close", "Fermer")}
        >
          ×
        </button>
      </div>

      {mode === "view" && (
        <div className={styles.body}>
          {!isVac ? (
            <>
              <div className={styles.section}>
                <div className={styles.k}>{t("pane_campus", "Campus")}</div>
                <div className={styles.v}>{campus}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>{t("pane_discipline", "Discipline")}</div>
                <div className={styles.v}>{discipline}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>{t("pane_position_type", "Type de poste")}</div>
                <div className={styles.v}>{positionType}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>{t("pane_academy", "Académie")}</div>
                <div className={styles.v}>{academy}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>
                  {t("pane_research_center", "Centre de recherche")}
                </div>
                <div className={styles.v}>{researchCenter}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>
                  {t("pane_qualifications", "Qualifications")}
                </div>
                <div className={styles.v}>
                  <div>{t("pane_aacsb", "AACSB")} : {aacsb}</div>
                  <div>{t("pane_cefdg", "CEFDG")} : {cefdq}</div>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>
                  {t("pane_teaching_interests", "Intérêts d’enseignement")}
                </div>
                <div className={styles.v}>
                  {teachingInterests.length ? (
                    <ul className={styles.expertiseList}>
                      {teachingInterests.slice(0, 10).map((tLabel, i) => (
                        <li key={i} className={styles.expertiseItem}>
                          <span className={styles.bullet}>•</span> {tLabel}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>
                  {t("pane_research_interests", "Intérêts de recherche")}
                </div>
                <div className={styles.v}>
                  {researchInterests.length ? (
                    <ul className={styles.expertiseList}>
                      {researchInterests.slice(0, 10).map((r, i) => (
                        <li key={i} className={styles.expertiseItem}>
                          <span className={styles.bullet}>•</span> {r}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              {profStrengths.length ? (
                <div className={styles.section}>
                  <div className={styles.k}>
                    {t("pane_strengths", "Forces principales")}
                  </div>
                  <div className={styles.v}>
                    <ul className={styles.expertiseList}>
                      {profStrengths.map((s, i) => (
                        <li key={i} className={styles.expertiseItem}>
                          <span className={styles.bullet}>•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {profDevNeeds.length ? (
                <div className={styles.section}>
                  <div className={styles.k}>
                    {t("pane_development_needs", "Axes de développement")}
                  </div>
                  <div className={styles.v}>
                    <ul className={styles.expertiseList}>
                      {profDevNeeds.map((d, i) => (
                        <li key={i} className={styles.expertiseItem}>
                          <span className={styles.bullet}>•</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {profRoles.length ? (
                <div className={styles.section}>
                  <div className={styles.k}>
                    {t("pane_recommended_roles", "Rôles recommandés")}
                  </div>
                  <div className={styles.v}>
                    <ul className={styles.expertiseList}>
                      {profRoles.map((r, i) => (
                        <li key={i} className={styles.expertiseItem}>
                          <span className={styles.bullet}>•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {profSummaryLong && (
                <div className={styles.section}>
                  <div className={styles.k}>
                    {t("pane_summary", "Résumé global")}
                  </div>
                  <p className={styles.v}>{profSummaryLong}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.section}>
                <div className={styles.k}>
                  {t("pane_current_title", "Titre actuel")}
                </div>
                <div className={styles.v}>{currentRole}</div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>
                  {t("pane_location", "Localisation")}
                </div>
                <div className={styles.v}>
                  {iden?.location_current || contacts?.location || "—"}
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>{t("pane_contacts", "Contacts")}</div>
                <div className={styles.v}>
                  {contacts?.email ? <div>Email: {contacts.email}</div> : null}
                  {contacts?.phone ? (
                    <div>{t("pane_phone", "Téléphone")}: {contacts.phone}</div>
                  ) : null}
                  {contacts?.portfolio ? (
                    <div>Portfolio: {contacts.portfolio}</div>
                  ) : null}
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.k}>
                  {t("pane_hard_skills", "Compétences clés (hard)")}
                </div>
                <div className={styles.v}>
                  {skillsHard.length ? (
                    <ul className={styles.expertiseList}>
                      {skillsHard.slice(0, 8).map((s, i) => (
                        <li key={i} className={styles.expertiseItem}>
                          <span className={styles.bullet}>•</span>{" "}
                          {s?.name || s?.normalized || "—"}
                          {s?.subskills?.length ? (
                            <> ({safeJoin(s.subskills)})</>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              {languages?.length ? (
                <div className={styles.section}>
                  <div className={styles.k}>{t("pane_languages", "Langues")}</div>
                  <div className={styles.v}>
                    {languages.map((l, i) => (
                      <div key={i}>
                        {l.language}
                        {l.proficiency ? `: ${l.proficiency}` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {projects?.length ? (
                <div className={styles.section}>
                  <div className={styles.k}>{t("pane_projects", "Projets")}</div>
                  <ul className={styles.expertiseList}>
                    {projects.slice(0, 5).map((p, i) => (
                      <li key={i} className={styles.expertiseItem}>
                        <span className={styles.bullet}>•</span>{" "}
                        <strong>{p.name}</strong> — {p.summary || "—"}
                        {p.tech_stack?.length ? (
                          <> (Tech: {safeJoin(p.tech_stack)})</>
                        ) : null}
                        {p.outcomes?.length ? (
                          <> — {t("pane_results", "Résultats")}: {safeJoin(p.outcomes)}</>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {certifs?.length ? (
                <div className={styles.section}>
                  <div className={styles.k}>
                    {t("pane_certifications", "Certifications")}
                  </div>
                  <ul className={styles.expertiseList}>
                    {certifs.map((c, i) => (
                      <li key={i} className={styles.expertiseItem}>
                        <span className={styles.bullet}>•</span>{" "}
                        {c.name} {c.issuer ? `— ${c.issuer}` : ""}{" "}
                        {c.year ? `(${c.year})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {education?.length ? (
                <div className={styles.section}>
                  <div className={styles.k}>
                    {t("pane_education", "Éducation")}
                  </div>
                  <ul className={styles.expertiseList}>
                    {education.map((e, i) => (
                      <li key={i} className={styles.expertiseItem}>
                        <span className={styles.bullet}>•</span>{" "}
                        {e.degree ? `${e.degree} ` : ""}
                        {e.field ? `en ${e.field} ` : ""}
                        {e.institution ? `— ${e.institution} ` : ""}
                        {e.start || e.end
                          ? `(${fmtDate(e.start)}–${fmtDate(e.end)})`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {parsedRaw?.summary_long ? (
                <div className={styles.section}>
                  <div className={styles.k}>
                    {t("pane_summary", "Résumé global")}
                  </div>
                  <p className={styles.v}>{parsedRaw.summary_long}</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {mode === "history" && (
        <>
          {isVac ? (
            <div className={styles.timeline} role="list">
              {experienceSorted.length === 0 ? (
                <div className={styles.empty}>
                  {t("pane_no_experience", "Aucune expérience trouvée.")}
                </div>
              ) : (
                experienceSorted.map((e, idx) => (
                  <div
                    className={styles.row}
                    key={idx}
                    role="listitem"
                    aria-label={`Expérience ${e?.title?.raw || e?.title?.normalized || ""}`}
                  >
                    <div className={styles.time2}>
                      {fmtYear(e?.start)}
                      <br />–<br />
                      {fmtYear(e?.end)}
                    </div>
                    <div className={styles.event}>
                      <div className={styles.evTitle}>
                        {e?.title?.raw || e?.title?.normalized || "—"}
                        {e?.company ? ` — ${e.company}` : ""}
                        {e?.location ? ` — ${e.location}` : ""}
                      </div>
                      <div className={styles.evSub}>
                        {e?.achievements?.length
                          ? e.achievements.join(" · ")
                          : e?.industry || e?.employment_type || "—"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className={styles.timeline} role="list">
              <div className={styles.section}>
                <div className={styles.k}>
                  {t("pane_publications", "Publications")}
                </div>
                <div className={styles.v}>
                  <div>
                    {t("pane_publications_count", "Nombre total")} :{" "}
                    {publicationCount != null ? publicationCount : "—"}
                  </div>
                  {publicationYears.length ? (
                    <div>
                      {t("pane_publications_years", "Années")} :{" "}
                      {publicationYears.join(", ")}
                    </div>
                  ) : null}
                  {publicationTitles.length ? (
                    <ul className={styles.expertiseList}>
                      {publicationTitles.slice(0, 5).map((p, i) => (
                        <li key={i} className={styles.expertiseItem}>
                          <span className={styles.bullet}>•</span> {p}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {journals.length ? (
                    <div style={{ marginTop: 4 }}>
                      <strong>
                        {t("pane_main_journals", "Revues principales")} :
                      </strong>{" "}
                      {journals.slice(0, 5).join(", ")}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
