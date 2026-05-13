const SUPABASE_URL = "https://gdjenoyyclazwbqvdmcx.supabase.co";
const SUPABASE_KEY = "sb_publishable_cUr1KyPEvF9jGMKsB3DO1A_lITF0XQK";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Afficher/Masquer les onglets
function showTab(tabId) {
  // Masquer tous les onglets
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Désactiver tous les boutons
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Afficher l'onglet sélectionné
  document.getElementById(tabId).classList.add('active');
  
  // Activer le bouton correspondant
  event.target.classList.add('active');

  // Recharger les données
  if (tabId === 'tab-participants') {
    chargerParticipants();
  } else if (tabId === 'tab-formations') {
    filtrerParAnnee();
  }
}

// ============================================
// ENREGISTREMENT DU DOSSIER
// ============================================
async function enregistrerDossier() {
  try {
    // Validation des champs obligatoires
    const first_name = document.getElementById("first_name").value.trim();
    const last_name = document.getElementById("last_name").value.trim();
    const stage = document.getElementById("stage").value.trim();
    const branche = document.getElementById("branche").value;
    const annee_stage = document.getElementById("annee_stage").value;

    if (!first_name || !last_name || !stage || !branche || !annee_stage) {
      alert("❌ Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    // Créer l'objet participant
    const participant = {
      first_name,
      last_name,
      groupe_scout: document.getElementById("groupe_scout").value,
      district: document.getElementById("district").value,
      fonction: document.getElementById("fonction").value,
      date_naissance: document.getElementById("date_naissance").value,
      lieu_naissance: document.getElementById("lieu_naissance").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value
    };

    // Insérer le participant
    const { data: participantData, error: participantError } = await client
      .from("Participants")
      .insert([participant])
      .select();

    if (participantError) {
      throw new Error(participantError.message);
    }

    const participantId = participantData[0].id;

    // Créer l'objet formation
    const formation = {
      participant_id: participantId,
      stage,
      branche,
      annee_stage: parseInt(annee_stage),
      lieu_stage: document.getElementById("lieu_stage").value
    };

    // Insérer la formation
    const { error: formationError } = await client
      .from("Formation")
      .insert([formation]);

    if (formationError) {
      throw new Error(formationError.message);
    }

    alert("✅ Dossier enregistré avec succès!");

    // Vider le formulaire
    document.getElementById("first_name").value = "";
    document.getElementById("last_name").value = "";
    document.getElementById("date_naissance").value = "";
    document.getElementById("lieu_naissance").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("email").value = "";
    document.getElementById("groupe_scout").value = "";
    document.getElementById("district").value = "";
    document.getElementById("fonction").value = "";
    document.getElementById("stage").value = "";
    document.getElementById("branche").value = "";
    document.getElementById("annee_stage").value = "";
    document.getElementById("lieu_stage").value = "";

    // Recharger les données
    await chargerParticipants();
    await filtrerParAnnee();
    await mettreAJourStatistiques();

  } catch (error) {
    console.error("Erreur:", error);
    alert("❌ Erreur lors de l'enregistrement: " + error.message);
  }
}

// ============================================
// CHARGER LES PARTICIPANTS
// ============================================
async function chargerParticipants() {
  try {
    const recherche = document.getElementById("search").value.trim();

    let query = client
      .from("Participants")
      .select("*");

    if (recherche) {
      query = query.or(
        `first_name.ilike.%${recherche}%,last_name.ilike.%${recherche}%,email.ilike.%${recherche}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Aucun participant trouvé</td></tr>';
      return;
    }

    data.forEach(participant => {
      tableBody.innerHTML += `
        <tr>
          <td>${participant.id}</td>
          <td>${participant.first_name || "-"}</td>
          <td>${participant.last_name || "-"}</td>
          <td>${participant.district || "-"}</td>
          <td>${participant.fonction || "-"}</td>
          <td>${participant.email || "-"}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error("Erreur:", error);
    document.getElementById("tableBody").innerHTML = 
      `<tr><td colspan="6" style="text-align: center; color: red;">Erreur: ${error.message}</td></tr>`;
  }
}

// ============================================
// FILTRER LES FORMATIONS PAR ANNÉE
// ============================================
async function filtrerParAnnee() {
  try {
    const annee = document.getElementById("filtre_annee").value;

    let query = client
      .from("Formation")
      .select(`
        id,
        stage,
        branche,
        annee_stage,
        lieu_stage,
        Participants(
          first_name,
          last_name
        )
      `);

    if (annee) {
      query = query.eq("annee_stage", parseInt(annee));
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const tableBody = document.getElementById("formationTable");
    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Aucune formation trouvée</td></tr>';
      return;
    }

    data.forEach(formation => {
      tableBody.innerHTML += `
        <tr>
          <td>
            ${formation.Participants?.first_name || ""} 
            ${formation.Participants?.last_name || ""}
          </td>
          <td>${formation.stage || "-"}</td>
          <td>${formation.branche || "-"}</td>
          <td>${formation.annee_stage || "-"}</td>
          <td>${formation.lieu_stage || "-"}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error("Erreur:", error);
    document.getElementById("formationTable").innerHTML = 
      `<tr><td colspan="5" style="text-align: center; color: red;">Erreur: ${error.message}</td></tr>`;
  }
}

// ============================================
// METTRE À JOUR LES STATISTIQUES
// ============================================
async function mettreAJourStatistiques() {
  try {
    // Total participants
    const { count: countParticipants } = await client
      .from("Participants")
      .select("*", { count: "exact", head: true });

    // Total formations
    const { count: countFormations } = await client
      .from("Formation")
      .select("*", { count: "exact", head: true });

    // Total branches (distinct)
    const { data: branches } = await client
      .from("Formation")
      .select("branche");

    const uniqueBranches = new Set(branches.map(f => f.branche)).size;

    document.getElementById("totalParticipants").textContent = countParticipants || 0;
    document.getElementById("totalFormations").textContent = countFormations || 0;
    document.getElementById("totalBranches").textContent = uniqueBranches || 0;

  } catch (error) {
    console.error("Erreur statistiques:", error);
  }
}

// ============================================
// EXPORTER EN CSV
// ============================================
async function exporterCSV(type) {
  try {
    let data, headers, filename;

    if (type === 'participants') {
      const { data: participantsData } = await client
        .from("Participants")
        .select("*");

      headers = ['ID', 'Prénom', 'Nom', 'Date de naissance', 'Lieu de naissance', 'Téléphone', 'Email', 'Groupe Scout', 'District', 'Fonction'];
      data = participantsData.map(p => [
        p.id,
        p.first_name || '',
        p.last_name || '',
        p.date_naissance || '',
        p.lieu_naissance || '',
        p.phone || '',
        p.email || '',
        p.groupe_scout || '',
        p.district || '',
        p.fonction || ''
      ]);
      filename = 'participants.csv';

    } else if (type === 'formations') {
      const { data: formationsData } = await client
        .from("Formation")
        .select(`
          id,
          stage,
          branche,
          annee_stage,
          lieu_stage,
          Participants(first_name, last_name)
        `);

      headers = ['Participant', 'Stage', 'Branche', 'Année', 'Lieu'];
      data = formationsData.map(f => [
        `${f.Participants?.first_name || ''} ${f.Participants?.last_name || ''}`,
        f.stage || '',
        f.branche || '',
        f.annee_stage || '',
        f.lieu_stage || ''
      ]);
      filename = 'formations.csv';
    }

    // Créer le CSV
    let csv = headers.join(',') + '\n';
    data.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.click();

    alert("✅ Export CSV réussi!");

  } catch (error) {
    console.error("Erreur export:", error);
    alert("❌ Erreur lors de l'export: " + error.message);
  }
}

// ============================================
// INITIALISATION AU CHARGEMENT
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log("Application chargée");
  await mettreAJourStatistiques();
  await chargerParticipants();
  await filtrerParAnnee();
});
