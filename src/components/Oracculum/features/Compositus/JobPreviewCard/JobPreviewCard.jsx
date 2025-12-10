import React, { useState } from "react";
import styles from "./JobPreviewCard.module.css";
import * as AiIcons from "react-icons/ai";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as BsIcons from "react-icons/bs";
import * as BiIcons from "react-icons/bi";
import * as HiIcons from "react-icons/hi";
import * as Hi2Icons from "react-icons/hi2";
import * as IoIcons from "react-icons/io";
import * as Io5Icons from "react-icons/io5";
import * as TbIcons from "react-icons/tb";
import * as CgIcons from "react-icons/cg";
import * as VscIcons from "react-icons/vsc";
import * as SlIcons from "react-icons/sl";
import * as TiIcons from "react-icons/ti";
import * as WiIcons from "react-icons/wi";
import * as CiIcons from "react-icons/ci";
import * as LuIcons from "react-icons/lu";
import * as RxIcons from "react-icons/rx";
import { LuArrowRightToLine } from "react-icons/lu";
import { useAppContext } from "../../../../../context/AppContext";
import { useTranslation } from "../../../../../utils/useTranslation";

const iconPacks = {
  ai: AiIcons,
  fa: FaIcons,
  md: MdIcons,
  bs: BsIcons,
  bi: BiIcons,
  hi: HiIcons,
  hi2: Hi2Icons,
  io: IoIcons,
  io5: Io5Icons,
  tb: TbIcons,
  cg: CgIcons,
  vsc: VscIcons,
  sl: SlIcons,
  ti: TiIcons,
  wi: WiIcons,
  ci: CiIcons,
  lu: LuIcons,
  rx: RxIcons,
};

const getIconComponentFromImport = (importString) => {
  if (!importString) return AiIcons.AiOutlineInfoCircle;
  const match = importString.match(
    /import\s+{\s*(\w+)\s*}\s+from\s+['"]react-icons\/([\w\d]+)['"]/i
  );
  if (!match) return AiIcons.AiOutlineInfoCircle;
  const iconName = match[1];
  const packPrefix = match[2].toLowerCase();
  const pack = iconPacks[packPrefix];
  return (pack && pack[iconName]) || AiIcons.AiOutlineInfoCircle;
};

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string";
const arr = (v) => (Array.isArray(v) ? v : []);
const s = (v) => (isStr(v) ? v : "");

function formatJobTitle(jt) {
  if (!jt) return "";
  if (!isObj(jt)) return s(jt);
  const bits = [];
  if (jt.seniority) bits.push(String(jt.seniority));
  if (jt.normalized || jt.raw) bits.push(jt.normalized || jt.raw);
  const specs = arr(jt.specializations).filter(Boolean).join(", ");
  if (specs) bits.push(`(${specs})`);
  return bits.filter(Boolean).join(" ");
}

function formatShortDescription(sd) {
  if (!sd) return "";
  if (!isObj(sd)) return s(sd);
  const seg = [];
  if (sd.summary) seg.push(sd.summary);
  if (sd.team_context) seg.push(`Team: ${sd.team_context}`);
  if (sd.business_impact) seg.push(`Impact: ${sd.business_impact}`);
  const domains = arr(sd.domain_keywords).filter(Boolean).join(", ");
  if (domains) seg.push(`Domains: ${domains}`);
  return seg.join(" | ");
}

function formatResponsibility(r) {
  if (!r) return "";
  if (!isObj(r)) return s(r);
  return s(r.statement);
}

function formatShortDescriptionLines(sd) {
  const out = [];
  if (!sd) return out;
  if (!isObj(sd)) {
    const v = s(sd);
    return v ? [v] : out;
  }
  if (sd.summary) out.push(sd.summary);
  if (sd.team_context) out.push(`Équipe : ${sd.team_context}`);
  if (sd.business_impact) out.push(`Impact : ${sd.business_impact}`);
  const domains = arr(sd.domain_keywords).filter(Boolean).join(", ");
  if (domains) out.push(`Domaines : ${domains}`);
  return out;
}

function _plur(n, singulier, pluriel) {
  return `${n} ${n > 1 ? pluriel : singulier}`;
}

function humanizeSkill(sk, t) {
  if (!sk) return "";
  if (!isObj(sk)) return s(sk);

  const name = s(sk.name) || s(sk.normalized);
  if (!name) return "";

  const parts = [];
  if (sk.must_have) parts.push("Obligatoire");
  if (sk.proficiency) parts.push(String(sk.proficiency));

  if (sk.years_min != null) {
    parts.push(`au moins ${_plur(sk.years_min, "an", "ans")}`);
  }
  if (sk.recency_months_max != null) {
    parts.push(`expérience dans les ${sk.recency_months_max} derniers mois`);
  }

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
    if (lead.length) lines.push(`Leadership : ${lead.join(", ")}`);
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

const JobPreviewCard = ({ job }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getIconComponentFromImport(job && job.react_icon_import);
  const { lang } = useAppContext();
  const { t } = useTranslation();

  const data = (job && (job[lang] || job.en)) || {};

  const titleText = formatJobTitle(data.job_title) || "N/A";
  const descText =
    formatShortDescription(data.short_description) ||
    s(data.short_description) ||
    t("short_description");

  const responsibilitiesList = arr(data.responsibilities)
    .map((r) => formatResponsibility(r))
    .filter(Boolean);

  const skillsList = arr(data.required_skills)
    .map((sk) => humanizeSkill(sk, t))
    .filter(Boolean)
    .slice(0, 10);

  const experienceList = summarizeDesiredExperience(data.desired_experience);

  const qualificationsList = Array.isArray(data.qualifications)
    ? data.qualifications.map((q) => (isStr(q) ? q : JSON.stringify(q))).filter(Boolean)
    : explodeQualifications(data.qualifications);

  return (
    <div className={styles.card}>
      <div className={styles.iconSection}>
        <div className={styles.iconCircle}>
          <Icon className={styles.icon} />
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>
          {t("job_position")}: {titleText}
        </h3>

        {formatShortDescriptionLines(data.short_description).length
          ? formatShortDescriptionLines(data.short_description).map((line, i) => (
            <p key={i} className={styles.description}>{line}</p>
          ))
          : <p className={styles.description}>{t("short_description")}</p>
        }

        {isExpanded && (
          <div className={styles.detailsContainer}>
            <div className={styles.detailSection}>
              <h4 className={styles.detailTitle}>{t("responsibilities")}:</h4>
              {responsibilitiesList.length ? (
                responsibilitiesList.map((line, i) => (
                  <p key={i} className={styles.detailItem}>
                    <LuArrowRightToLine className={styles.iconList} />
                    {line}
                  </p>
                ))
              ) : (
                <p className={styles.detailItem}>—</p>
              )}
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailTitle}>{t("skills")}:</h4>
              {skillsList.length ? (
                skillsList.map((line, i) => (
                  <p key={i} className={styles.detailItem}>
                    <LuArrowRightToLine className={styles.iconList} />
                    {line}
                  </p>
                ))
              ) : (
                <p className={styles.detailItem}>—</p>
              )}
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailTitle}>{t("experience")}:</h4>
              {experienceList.length ? (
                experienceList.map((exp, i) => (
                  <p key={i} className={styles.detailItem}>
                    <LuArrowRightToLine className={styles.iconList} />
                    {exp}
                  </p>
                ))
              ) : (
                <p className={styles.detailItem}>—</p>
              )}
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailTitle}>{t("qualifications")}:</h4>
              {qualificationsList.length ? (
                qualificationsList.map((q, i) => (
                  <p key={i} className={styles.detailItem}>
                    <LuArrowRightToLine className={styles.iconList} />
                    {q}
                  </p>
                ))
              ) : (
                <p className={styles.detailItem}>—</p>
              )}
            </div>
          </div>
        )}

        <span
          className={styles.learnMore}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? (
            <>
              {t("learn_less")} <span className={styles.arrowLess}>↑</span>
            </>
          ) : (
            <>
              {t("learn_more")} <span className={styles.arrow}>→</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default JobPreviewCard;