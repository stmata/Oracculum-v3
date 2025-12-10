export const PDF_MARGINS = { left: 12, top: 16, right: 12 };
export const PDF_WIDTH = 210;
export const PDF_USABLE_WIDTH = PDF_WIDTH - (PDF_MARGINS.left + PDF_MARGINS.right);

export const FONT = {
    FAMILY: "helvetica",
    TITLE: 16,
    H1: 13,
    H2: 11,
    TEXT: 11,
    SMALL: 9,
};

export const LABELS = {
    fr: {
        analysis: "Analyse",
        analysis_date: "Date d’analyse",
        matches_found: "Candidats retenus",
        description_title: "Description du poste",
        candidates: "Candidats",
        job: "Poste",
        no_name: "Sans nom",
        department: "Département",
        location: "Localisation",
        candidate_source: "Source candidats",
        offer_type: "Type d’offre",
        offer_new: "Nouvelle",
        offer_existing: "Existante",
    },
    en: {
        analysis: "Analysis",
        analysis_date: "Analysis date",
        matches_found: "Matches found",
        description_title: "Job description",
        candidates: "Candidates",
        job: "Job",
        no_name: "No name",
        department: "Department",
        location: "Location",
        candidate_source: "Candidate source",
        offer_type: "Offer type",
        offer_new: "New",
        offer_existing: "Existing",
    },
};
