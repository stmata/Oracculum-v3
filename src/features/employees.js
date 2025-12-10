const BASE_URL = window._env_?.VITE_APP_BAS_URL2;

const URL_IMPORT = `${BASE_URL}/import_employees`;
const URL_PEOPLE_OVERVIEW = `${BASE_URL}/people_overview`;
const URL_DELETE_PERSON = `${BASE_URL}/delete_employee`;


export async function importEmployees(files) {
  const fd = new FormData();
  const kinds = [];

  const appendWithKind = (file, kindValue, fallbackName) => {
    if (!file) return;
    const name =
      typeof file?.name === "string" && file.name ? file.name : fallbackName;
    fd.append("files", file, name);
    kinds.push(kindValue);
  };

  appendWithKind(files?.professeurs, "EAP_Professeurs", "professeurs.csv");
  appendWithKind(files?.publication, "EAP_Professeurs", "publication.csv");
  appendWithKind(files?.iresearch, "EAP_Professeurs", "iresearch.csv");
  appendWithKind(files?.teaching, "EAP_Professeurs", "teaching.csv");

  appendWithKind(
    files?.administratifs,
    "EAP_Administratif",
    "administratifs.csv"
  );
  appendWithKind(
    files?.entretiens,
    "EAP_EntretiensProfessionnels",
    "entretiens.csv"
  );

  if (kinds.length === 0) {
    return { ok: false, data: { detail: "no_files" } };
  }

  kinds.forEach((k) => fd.append("kinds", k));

  const resp = await fetch(URL_IMPORT, { method: "POST", body: fd });

  let data = null;
  try {
    data = await resp.json();
  } catch {
    try {
      data = JSON.parse(await resp.text());
    } catch {
      data = null;
    }
  }

  const success =
    data && typeof data.success !== "undefined"
      ? typeof data.success === "string"
        ? data.success.toLowerCase() === "true"
        : Boolean(data.success)
      : false;

  return { ok: resp.ok && success, data };
}


export async function fetchAllPeople(email) {
  const url = email
    ? `${URL_PEOPLE_OVERVIEW}?email=${encodeURIComponent(email)}`
    : URL_PEOPLE_OVERVIEW;

  let resp;
  try {
    resp = await fetch(url, { method: "GET" });
  } catch (networkErr) {
    throw new Error(`[PEOPLE] network error: ${String(networkErr)}`);
  }

  if (!resp.ok) {
    let errDetail = "";
    try {
      const errJson = await resp.json();
      errDetail = errJson?.detail ? ` - ${errJson.detail}` : "";
    } catch {
    }
    throw new Error(`[PEOPLE] HTTP ${resp.status}${errDetail}`);
  }

  const data = await resp.json();
  return data || {};
}


export function openJobStream(jobId, onUpdate) {
  if (!jobId) {
    return () => {};
  }

  const url = `${BASE_URL}/jobs/${encodeURIComponent(jobId)}/stream`;
  const es = new EventSource(url);

  es.onopen = () => {
  };

  es.addEventListener("update", (ev) => {
    try {
      const payload = JSON.parse(ev.data);
      onUpdate?.(payload);
    } catch (e) {
    }
  });

  es.onmessage = (ev) => {
    try {
      const payload = JSON.parse(ev.data);
      onUpdate?.(payload);
    } catch (e) {
    }
  };

  es.addEventListener("keepalive", () => {
  });

  es.addEventListener("error", (ev) => {
  });

  return () => {
    try {
      es.close();
    } catch (e) {
    }
  };
}


export async function deletePerson(options = {}) {
  const { category, fullName, matriculeCollaborateur, position } = options;

  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (fullName) {
    params.set("full_name", fullName);
  }

  if (matriculeCollaborateur) {
    params.set("matricule_collaborateur", matriculeCollaborateur);
  }

  if (position) {
    params.set("position", position);
  }

  const url = `${URL_DELETE_PERSON}?${params.toString()}`;

  let resp;
  try {
    resp = await fetch(url, { method: "DELETE" });
  } catch (networkErr) {
    throw new Error(`[DELETE] network error: ${String(networkErr)}`);
  }

  let data = null;
  try {
    data = await resp.json();
  } catch {
    data = null;
  }

  if (!resp.ok) {
    const detail = data && data.detail ? ` - ${data.detail}` : "";
    throw new Error(`[DELETE] HTTP ${resp.status}${detail}`);
  }

  return data;
}

