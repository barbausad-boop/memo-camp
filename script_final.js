const SUPABASE_URL = "https://gdjenoyyclazwbqvdmcx.supabase.co";
const SUPABASE_KEY = "sb_publishable_cUr1KyPEvF9jGMKsB3DO1A_lITF0XQK";

let client;
let supabaseConnected = false;
let participantActuelId = null; // Stocker l'ID du participant en cours d'édition
let formationsExistantes = {}; // Stocker les formations existantes

try {
  client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
  console.error("❌ Erreur initialisation Supabase:", error);
}

// Données de secours pour les régions et districts
const donneesSenegal = [
  { id: 1, nom: 'Dakar' },
  { id: 2, nom: 'Thiès' },
  { id: 3, nom: 'Fleuve' },
  { id: 4, nom: 'Petite Côte' },
  { id: 5, nom: 'Kaolack' },
  { id: 6, nom: 'Casamance' }
];

const districtsSenegal = {
  1: [ // Dakar
    { id: 101, nom: 'Dakar', region_id: 1 },
    { id: 102, nom: 'Rufisque', region_id: 1 },
    { id: 103, nom: 'Guédiawaye', region_id: 1 }
  ],
  2: [ // Thiès
    { id: 201, nom: 'Jappo', region_id: 2 },
    { id: 202, nom: 'Diobass', region_id: 2 },
    { id: 203, nom: 'Baol', region_id: 2 },
    { id: 204, nom: 'Daniel-Brottier', region_id: 2 }
  ],
  3: [ // Fleuve
    { id: 301, nom: 'Saint-Louis', region_id: 3 },
    { id: 302, nom: 'Matam', region_id: 3 },
    { id: 303, nom: 'Podor', region_id: 3 }
  ],
  4: [ // Petite Côte
    { id: 401, nom: 'Mbour', region_id: 4 },
    { id: 402, nom: 'Saly', region_id: 4 },
    { id: 403, nom: 'Joal', region_id: 4 }
  ],
  5: [ // Kaolack
    { id: 501, nom: 'Kaolack', region_id: 5 },
    { id: 502, nom: 'Tambacounda', region_id: 5 },
    { id: 503, nom: 'Kolda', region_id: 5 }
  ],
  6: [ // Casamance
    { id: 601, nom: 'Ziguinchor', region_id: 6 },
    { id: 602, nom: 'Bignona', region_id: 6 },
    { id: 603, nom: 'Oussouye', region_id: 6 }
  ]
};

// Stocker les districts localement
window.districtsSenegal = districtsSenegal;

// ============================================
// FONCTION UTILITAIRE: GESTION D'ERREURS
// ============================================
function showErrorWithDetails(title, error) {
  let message = title + "\n\n";
  
  if (error instanceof TypeError) {
    if (error.message.includes("Failed to fetch")) {
      message += "❌ Impossible de se connecter à la base de données.\n";
      message += "Raisons possibles:\n";
      message += "• Pas de connexion internet\n";
      message += "• Serveur Supabase inaccessible\n";
      message += "• Problème de configuration CORS\n\n";
      message += "⚠️ L'application fonctionne en mode hors ligne.\n";
      message += "Les données sont stockées localement.";
    } else {
      message += error.message;
    }
  } else if (error.message) {
    message += error.message;
  } else {
    message += JSON.stringify(error);
  }
  
  console.error("Error Details:", error);
  return message;
}

// Fonction pour logger les erreurs avec contexte
function logError(context, error) {
  console.error(`[${context}] ❌`, error);
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} - Erreur: ${context}`);
}

// ============================================
// TEST DE CONNEXION SUPABASE
// ============================================
async function testSupabaseConnection() {
  try {
    console.log("🔍 Test de connexion Supabase...");
    const { data, error } = await client
      .from('regions')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    supabaseConnected = true;
    console.log("✅ Supabase connecté avec succès");
    return true;
  } catch (error) {
    supabaseConnected = false;
    logError("Test Supabase", error);
    console.warn("⚠️ Supabase indisponible - Mode hors ligne activé");
    return false;
  }
}

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log("🚀 Application Memo-Camp chargée");
  
  // Tester la connexion Supabase
  await testSupabaseConnection();
  
  // Attendre que le DOM soit prêt
  setTimeout(async () => {
    try {
      await chargerRegions();
      await mettreAJourStatistiques();
      await chargerParticipants();
      
      // Afficher le statut de connexion
      const status = supabaseConnected 
        ? "🟢 Base de données connectée" 
        : "🟡 Mode hors ligne (données locales)";
      console.log(status);
      
    } catch (error) {
      logError("Initialisation application", error);
    }
  }, 500);
});

// ============================================
// GESTION DES ONGLETS
// ============================================
function showTab(tabId) {
  try {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

    if (tabId === 'tab-participants') {
      chargerParticipants();
    } else if (tabId === 'tab-promotions') {
      chargerPromotions();
    } else if (tabId === 'tab-statistiques') {
      chargerStatistiques();
    }
  } catch (error) {
    logError("showTab", error);
  }
}

// ============================================
// DÉTECTION DE PARTICIPANT EXISTANT
// ============================================
async function detecterParticipantExistant() {
  try {
    const firstName = document.getElementById('first_name').value.trim();
    const lastName = document.getElementById('last_name').value.trim();

    // Reset
    document.getElementById('participant-detection').style.display = 'none';
    document.getElementById('formations-completed').style.display = 'none';
    participantActuelId = null;
    formationsExistantes = {};

    if (!firstName || !lastName) return;

    if (!supabaseConnected) {
      console.log("⏭️ Supabase indisponible - Pas de détection");
      return;
    }

    console.log(`🔍 Recherche de ${firstName} ${lastName}...`);

    // Chercher le participant par prénom et nom
    const { data: participants, error } = await client
      .from('Participants')
      .select('*')
      .ilike('first_name', `%${firstName}%`)
      .ilike('last_name', `%${lastName}%`);

    if (error) throw error;

    if (participants && participants.length > 0) {
      const participant = participants[0]; // Prendre le premier match
      participantActuelId = participant.id;

      console.log(`✅ Participant trouvé: ID ${participantActuelId}`);

      // Charger les formations existantes
      const { data: formations, error: formError } = await client
        .from('Formation')
        .select('*, stage_id(code), branche_id(nom)')
        .eq('participant_id', participantActuelId);

      if (formError) throw formError;

      if (formations && formations.length > 0) {
        // Organiser les formations par stage
        formations.forEach(f => {
          formationsExistantes[f.stage_id.code] = {
            annee: f.annee_stage,
            lieu: f.lieu_stage,
            branche: f.branche_id ? f.branche_id.nom : null,
            id: f.id
          };
        });

        afficherDetectionParticipant(participant, formations);
      }
    } else {
      console.log("ℹ️ Aucun participant existant trouvé");
    }

  } catch (error) {
    logError("detecterParticipantExistant", error);
  }
}

// ============================================
// AFFICHER DÉTECTION DE PARTICIPANT
// ============================================
function afficherDetectionParticipant(participant, formations) {
  const detectionDiv = document.getElementById('participant-detection');
  const contentDiv = document.getElementById('detection-content');

  let html = `<p><strong>Participant:</strong> ${participant.first_name} ${participant.last_name}</p>`;
  html += `<p><strong>Région:</strong> ${participant.region_id || '?'} | <strong>District:</strong> ${participant.district_id || '?'}</p>`;
  
  if (formations.length > 0) {
    html += `<div class="participant-history">`;
    html += `<strong>📚 Formations complétées:</strong><br>`;
    formations.forEach(f => {
      html += `
        <div class="stage-completed">
          <span class="check">✓</span> <strong>${f.stage_id.code}</strong> (${f.annee_stage}) 
          ${f.branche_id ? `- Branche: ${f.branche_id.nom}` : ''}
          ${f.lieu_stage ? `- Lieu: ${f.lieu_stage}` : ''}
        </div>
      `;
    });
    html += `</div>`;
  }

  contentDiv.innerHTML = html;
  detectionDiv.style.display = 'block';

  // Pré-cocher les formations complétées
  Object.keys(formationsExistantes).forEach(stageCode => {
    const checkbox = document.getElementById(`has_${stageCode.toLowerCase().replace('.', '')}`);
    if (checkbox) {
      checkbox.disabled = true;
      checkbox.checked = true;
      const fields = document.getElementById(`${stageCode.toLowerCase().replace('.', '')}_fields`);
      if (fields) {
        fields.classList.remove('active');
        fields.style.display = 'none';
      }
    }
  });

  console.log(`✅ Détection affichée - ${formations.length} formations trouvées`);
}

// ============================================
// CONTINUER LE PARCOURS
// ============================================
async function continuerParticipant() {
  console.log(`📝 Continuation du parcours pour participant ${participantActuelId}`);
  
  // Masquer la détection
  document.getElementById('participant-detection').style.display = 'none';

  // Afficher les formations complétées
  afficherFormationsCompletees();

  // L'utilisateur peut cocher les prochaines formations
  // Les formations complétées restent grisées et cochées
}

// ============================================
// AFFICHER FORMATIONS COMPLÉTÉES
// ============================================
function afficherFormationsCompletees() {
  const formationsCompletedDiv = document.getElementById('formations-completed');
  const listDiv = document.getElementById('formations-completed-list');

  if (Object.keys(formationsExistantes).length === 0) {
    return;
  }

  let html = '';
  Object.entries(formationsExistantes).forEach(([stageCode, details]) => {
    html += `
      <div class="stage-completed">
        <span class="check">✓</span> <strong>${stageCode}</strong> (${details.annee})
        ${details.branche ? `- ${details.branche}` : ''}
        ${details.lieu ? `- ${details.lieu}` : ''}
      </div>
    `;
  });

  listDiv.innerHTML = html;
  formationsCompletedDiv.style.display = 'block';
}

// ============================================
// RÉINITIALISER LE FORMULAIRE
// ============================================
function reinitialiserFormulaire() {
  document.querySelector('form').reset();
  document.getElementById('participant-detection').style.display = 'none';
  document.getElementById('formations-completed').style.display = 'none';
  
  // Réactiver tous les checkboxes
  ['ci', 'cep', 'cnb', 'cbb'].forEach(stage => {
    const checkbox = document.getElementById(`has_${stage}`);
    if (checkbox) {
      checkbox.disabled = false;
      checkbox.checked = false;
    }
    const fields = document.getElementById(`${stage}_fields`);
    if (fields) {
      fields.classList.remove('active');
    }
  });

  participantActuelId = null;
  formationsExistantes = {};
  
  console.log("🔄 Formulaire réinitialisé");
}

// ============================================
// CHARGER LES RÉGIONS
// ============================================
async function chargerRegions() {
  try {
    console.log("📍 Chargement des régions...");
    
    const select = document.getElementById('region_id');
    if (!select) {
      throw new Error("SELECT region_id non trouvé dans le DOM!");
    }

    let data = donneesSenegal;

    // Essayer de charger depuis Supabase seulement si connecté
    if (supabaseConnected) {
      try {
        const { data: supabaseData, error } = await Promise.race([
          client.from('regions').select('id, nom').order('nom'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout Supabase")), 5000)
          )
        ]);

        if (error) throw error;
        if (supabaseData && supabaseData.length > 0) {
          data = supabaseData;
          console.log("✅ Régions chargées depuis Supabase");
        }
      } catch (supabaseError) {
        logError("Chargement régions Supabase", supabaseError);
        console.log("⚠️ Utilisation des données locales");
      }
    } else {
      console.log("⏭️ Supabase indisponible → Données locales");
    }

    // Remplir le select
    select.innerHTML = '<option value="">-- Sélectionner une région --</option>';
    
    data.forEach(region => {
      const option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.nom;
      select.appendChild(option);
    });

    console.log(`✅ ${data.length} régions chargées`);

  } catch (error) {
    logError("chargerRegions", error);
    const message = showErrorWithDetails("Erreur chargement régions", error);
    console.error(message);
  }
}

// ============================================
// CHARGER LES DISTRICTS
// ============================================
async function chargerDistricts() {
  try {
    const regionId = document.getElementById('region_id').value;
    console.log("🔄 Région sélectionnée:", regionId);

    const districtSelect = document.getElementById('district_id');

    if (!regionId) {
      districtSelect.innerHTML = '<option value="">-- Sélectionner un district --</option>';
      return;
    }

    let data = [];

    // Essayer Supabase seulement si connecté
    if (supabaseConnected) {
      try {
        const { data: supabaseData, error } = await Promise.race([
          client
            .from('districts')
            .select('id, nom')
            .eq('region_id', parseInt(regionId))
            .order('nom'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout Supabase")), 5000)
          )
        ]);

        if (error) throw error;
        if (supabaseData && supabaseData.length > 0) {
          data = supabaseData;
          console.log("✅ Districts chargés depuis Supabase");
        } else {
          data = window.districtsSenegal[regionId] || [];
        }
      } catch (supabaseError) {
        logError("Chargement districts Supabase", supabaseError);
        data = window.districtsSenegal[regionId] || [];
      }
    } else {
      data = window.districtsSenegal[regionId] || [];
    }

    // Remplir le select
    districtSelect.innerHTML = '<option value="">-- Sélectionner un district --</option>';
    
    if (data.length === 0) {
      console.warn("⚠️ Aucun district trouvé");
      districtSelect.innerHTML += '<option disabled>Aucun district disponible</option>';
      return;
    }

    data.forEach(district => {
      const option = document.createElement('option');
      option.value = district.id;
      option.textContent = district.nom;
      districtSelect.appendChild(option);
    });

    console.log(`✅ ${data.length} districts chargés`);

  } catch (error) {
    logError("chargerDistricts", error);
  }
}

// ============================================
// TOGGLE STAGE
// ============================================
function toggleStage(stage) {
  try {
    const checkbox = document.getElementById(`has_${stage}`);
    const fields = document.getElementById(`${stage}_fields`);
    
    if (checkbox.checked) {
      fields.classList.add('active');
    } else {
      fields.classList.remove('active');
      clearStageFields(stage);
    }
  } catch (error) {
    logError("toggleStage", error);
  }
}

function clearStageFields(stage) {
  try {
    const fields = document.querySelectorAll(`#${stage}_fields input, #${stage}_fields select`);
    fields.forEach(field => field.value = '');
  } catch (error) {
    logError("clearStageFields", error);
  }
}

// ============================================
// VALIDATION HIÉRARCHIQUE
// ============================================
function validerHierarchieStages() {
  try {
    const stages = ['ci', 'cep', 'cnb', 'cbb'];
    const checks = stages.map(s => document.getElementById(`has_${s}`).checked);
    
    for (let i = 0; i < checks.length - 1; i++) {
      if (!checks[i] && checks[i + 1]) {
        alert(`❌ Erreur : Vous devez compléter les stages en ordre`);
        return false;
      }
    }

    if (document.getElementById('has_cep').checked && !document.getElementById('cep_branche').value) {
      alert("❌ La branche est obligatoire pour le C.E.P");
      return false;
    }

    if (document.getElementById('has_cnb').checked && !document.getElementById('cnb_branche').value) {
      alert("❌ La branche est obligatoire pour le C.N.B");
      return false;
    }

    return true;
  } catch (error) {
    logError("validerHierarchieStages", error);
    return false;
  }
}

// ============================================
// ENREGISTRER PARTICIPANT (MODE ÉDITION OU CRÉATION)
// ============================================
async function enregistrerParticipant() {
  try {
    if (!validerHierarchieStages()) return;

    if (!supabaseConnected) {
      alert("⚠️ Impossible d'enregistrer : base de données indisponible\n\nVérifiez votre connexion internet et réessayez.");
      return;
    }

    const firstName = document.getElementById('first_name').value.trim();
    const lastName = document.getElementById('last_name').value.trim();
    const regionId = document.getElementById('region_id').value;
    const districtId = document.getElementById('district_id').value;

    if (!firstName || !lastName || !regionId || !districtId) {
      alert("❌ Prénom, Nom, Région et District sont obligatoires");
      return;
    }

    let participantId = participantActuelId;

    // SI aucun participant existant, créer un nouveau
    if (!participantId) {
      console.log("➕ Création d'un nouveau participant");

      const participant = {
        first_name: firstName,
        last_name: lastName,
        date_naissance: document.getElementById('date_naissance').value || null,
        lieu_naissance: document.getElementById('lieu_naissance').value || null,
        phone: document.getElementById('phone').value || null,
        email: document.getElementById('email').value || null,
        fonction_actuelle: document.getElementById('fonction_actuelle').value || null,
        groupe_base: document.getElementById('groupe_base').value || null,
        region_id: parseInt(regionId),
        district_id: parseInt(districtId)
      };

      const { data: participantData, error: participantError } = await client
        .from('Participants')
        .insert([participant])
        .select();

      if (participantError) throw participantError;

      participantId = participantData[0].id;
      console.log("✅ Nouveau participant créé:", participantId);
    } else {
      console.log(`📝 Mise à jour du participant existant: ${participantId}`);
    }

    // Récupérer les stages
    const stagesMap = {
      'ci': { code: 'C.I', ordre: 1, needBranch: false },
      'cep': { code: 'C.E.P', ordre: 2, needBranch: true },
      'cnb': { code: 'C.N.B', ordre: 3, needBranch: true },
      'cbb': { code: 'C.B.B', ordre: 4, needBranch: false }
    };

    const formations = [];

    for (const [stageKey, stageInfo] of Object.entries(stagesMap)) {
      const hasStage = document.getElementById(`has_${stageKey}`).checked;
      
      // Ignorer les formations déjà complétées
      if (formationsExistantes[stageInfo.code]) {
        console.log(`⏭️ ${stageInfo.code} déjà complété - Ignoré`);
        continue;
      }

      if (hasStage) {
        const annee = document.getElementById(`${stageKey}_annee`).value;
        const lieu = document.getElementById(`${stageKey}_lieu`).value || null;
        let brancheId = null;

        if (stageInfo.needBranch) {
          const branchNom = document.getElementById(`${stageKey}_branche`).value;
          try {
            const { data: branchData } = await client
              .from('branches')
              .select('id')
              .eq('nom', branchNom)
              .single();
            
            if (branchData) brancheId = branchData.id;
          } catch (error) {
            logError("Chargement branche", error);
          }
        }

        try {
          const { data: stageData } = await client
            .from('stages')
            .select('id')
            .eq('code', stageInfo.code)
            .single();

          formations.push({
            participant_id: participantId,
            stage_id: stageData.id,
            branche_id: brancheId,
            annee_stage: parseInt(annee),
            lieu_stage: lieu
          });

          console.log(`✅ Formation ajoutée: ${stageInfo.code} (${annee})`);
        } catch (error) {
          logError("Chargement stage", error);
        }
      }
    }

    // Ajouter les formations SEULEMENT si des nouvelles ont été cochées
    if (formations.length > 0) {
      const { error: formationError } = await client
        .from('Formation')
        .insert(formations);

      if (formationError) throw formationError;
      
      console.log(`✅ ${formations.length} nouvelle(s) formation(s) enregistrée(s)`);
    } else {
      console.log("ℹ️ Aucune nouvelle formation à ajouter");
    }

    alert("✅ Enregistrement réussi !\n\nParticipant continué sans doublons.");

    // Réinitialiser
    reinitialiserFormulaire();

    // Recharger les données
    await mettreAJourStatistiques();
    await chargerParticipants();

  } catch (error) {
    logError("enregistrerParticipant", error);
    const message = showErrorWithDetails("Erreur d'enregistrement", error);
    alert(message);
  }
}

// ============================================
// CHARGER LES PARTICIPANTS
// ============================================
async function chargerParticipants() {
  try {
    if (!supabaseConnected) {
      const tableBody = document.getElementById('tableBody');
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">⏸️ Base de données indisponible - Mode hors ligne</td></tr>';
      }
      return;
    }

    const recherche = document.getElementById('search') ? document.getElementById('search').value.trim() : '';

    let query = client
      .from('parcours_participant')
      .select('*');

    if (recherche) {
      query = query.or(
        `first_name.ilike.%${recherche}%,last_name.ilike.%${recherche}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    const participants = {};
    data.forEach(row => {
      const key = `${row.id}_${row.first_name}_${row.last_name}`;
      if (!participants[key]) {
        participants[key] = {
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
          fonction_actuelle: row.fonction_actuelle,
          groupe_base: row.groupe_base,
          region_nom: row.region_nom || '-',
          district_nom: row.district_nom || '-',
          formations: []
        };
      }
      if (row.formation_id) {
        participants[key].formations.push({
          stage_code: row.stage_code,
          branche: row.branche_nom,
          annee: row.annee_stage,
          lieu: row.lieu_stage
        });
      }
    });

    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    if (Object.keys(participants).length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Aucun participant</td></tr>';
      return;
    }

    Object.values(participants).forEach(p => {
      const stages = p.formations.map(f => f.stage_code).join(', ');
      tableBody.innerHTML += `
        <tr>
          <td>${p.first_name || '-'}</td>
          <td>${p.last_name || '-'}</td>
          <td>${p.region_nom}</td>
          <td>${stages || 'Aucun'}</td>
          <td>
            <button onclick="afficherProfil(${p.id})" class="btn-small">👁️ Voir</button>
          </td>
        </tr>
      `;
    });

  } catch (error) {
    logError("chargerParticipants", error);
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = 
      `<tr><td colspan="5" style="text-align: center; color: red;">⚠️ Erreur chargement</td></tr>`;
  }
}

// ============================================
// AFFICHER LE PROFIL COMPLET
// ============================================
async function afficherProfil(participantId) {
  try {
    if (!supabaseConnected) {
      alert("⚠️ Base de données indisponible");
      return;
    }

    const { data, error } = await client
      .from('parcours_participant')
      .select('*')
      .eq('id', participantId);

    if (error) throw error;

    if (data.length === 0) {
      alert("Profil non trouvé");
      return;
    }

    const p = data[0];
    let profil = `${p.first_name} ${p.last_name}\n`;
    profil += `Région: ${p.region_nom || '-'}\n`;
    profil += `District: ${p.district_nom || '-'}\n`;
    profil += `Fonction: ${p.fonction_actuelle || '-'}\n`;
    profil += `Groupe: ${p.groupe_base || '-'}\n\n`;
    profil += `Parcours:\n`;

    data.forEach(row => {
      if (row.stage_code) {
        profil += `- ${row.stage_code} (${row.annee_stage})`;
        if (row.branche_nom) profil += ` - Branche: ${row.branche_nom}`;
        if (row.lieu_stage) profil += ` - Lieu: ${row.lieu_stage}`;
        profil += `\n`;
      }
    });

    alert(profil);

  } catch (error) {
    logError("afficherProfil", error);
    const message = showErrorWithDetails("Erreur affichage profil", error);
    alert(message);
  }
}

// ============================================
// CHARGER PROMOTIONS
// ============================================
async function chargerPromotions() {
  try {
    if (!supabaseConnected) {
      const container = document.getElementById('promotions_container');
      if (container) {
        container.innerHTML = '<p style="text-align: center; color: #999;">⏸️ Base de données indisponible</p>';
      }
      return;
    }

    const { data, error } = await client
      .from('parcours_participant')
      .select('*')
      .not('stage_code', 'is', null)
      .order('annee_stage', { ascending: false })
      .order('stage_ordre', { ascending: true });

    if (error) throw error;

    const promotions = {};
    data.forEach(row => {
      const key = `${row.stage_code}_${row.annee_stage}`;
      if (!promotions[key]) {
        promotions[key] = {
          stage: row.stage_code,
          annee: row.annee_stage,
          participants: []
        };
      }
      if (!promotions[key].participants.find(p => p.id === row.id)) {
        promotions[key].participants.push({
          id: row.id,
          name: `${row.first_name} ${row.last_name}`,
          region: row.region_nom,
          branche: row.branche_nom,
          lieu: row.lieu_stage
        });
      }
    });

    const container = document.getElementById('promotions_container');
    container.innerHTML = '';

    Object.values(promotions)
      .sort((a, b) => b.annee - a.annee)
      .forEach(promo => {
        const html = `
          <div class="promotion-card">
            <h3>${promo.stage} - ${promo.annee} (${promo.participants.length} participants)</h3>
            <ul>
              ${promo.participants.map(p => `
                <li>
                  ${p.name}
                  ${p.region ? ` - ${p.region}` : ''}
                  ${p.branche ? ` - ${p.branche}` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
        container.innerHTML += html;
      });

    if (Object.keys(promotions).length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #999;">Aucune promotion trouvée</p>';
    }

  } catch (error) {
    logError("chargerPromotions", error);
    const container = document.getElementById('promotions_container');
    container.innerHTML = '<p style="color: red;">⚠️ Erreur chargement promotions</p>';
  }
}

// ============================================
// CHARGER STATISTIQUES
// ============================================
async function chargerStatistiques() {
  try {
    if (!supabaseConnected) {
      document.getElementById('stats_by_stage').innerHTML = '<p style="color: #999;">⏸️ Indisponible</p>';
      document.getElementById('stats_by_branch').innerHTML = '<p style="color: #999;">⏸️ Indisponible</p>';
      document.getElementById('stats_by_region').innerHTML = '<p style="color: #999;">⏸️ Indisponible</p>';
      document.getElementById('stats_by_district').innerHTML = '<p style="color: #999;">⏸️ Indisponible</p>';
      return;
    }

    // Par stage
    const { data: stageStats } = await client
      .from('Formation')
      .select('stage_id(code), COUNT(*)', { count: 'exact' })
      .group_by('stage_id');

    let stageHtml = '<ul>';
    if (stageStats && stageStats.length > 0) {
      stageStats.forEach(stat => {
        if (stat.stage_id) {
          stageHtml += `<li>${stat.stage_id.code}: ${stat.count} participants</li>`;
        }
      });
    } else {
      stageHtml += '<li>Aucune donnée</li>';
    }
    stageHtml += '</ul>';
    document.getElementById('stats_by_stage').innerHTML = stageHtml;

    // Par branche
    const { data: branchStats } = await client
      .from('Formation')
      .select('branche_id(nom), COUNT(*)', { count: 'exact' })
      .not('branche_id', 'is', null)
      .group_by('branche_id');

    let branchHtml = '<ul>';
    if (branchStats && branchStats.length > 0) {
      branchStats.forEach(stat => {
        if (stat.branche_id) {
          branchHtml += `<li>${stat.branche_id.nom}: ${stat.count} participants</li>`;
        }
      });
    } else {
      branchHtml += '<li>Aucune donnée</li>';
    }
    branchHtml += '</ul>';
    document.getElementById('stats_by_branch').innerHTML = branchHtml;

    // Par région
    const { data: regionStats } = await client
      .from('Participants')
      .select('region_id(nom), COUNT(*)', { count: 'exact' })
      .not('region_id', 'is', null)
      .group_by('region_id');

    let regionHtml = '<ul>';
    if (regionStats && regionStats.length > 0) {
      regionStats.forEach(stat => {
        if (stat.region_id) {
          regionHtml += `<li>${stat.region_id.nom}: ${stat.count} participants</li>`;
        }
      });
    } else {
      regionHtml += '<li>Aucune donnée</li>';
    }
    regionHtml += '</ul>';
    document.getElementById('stats_by_region').innerHTML = regionHtml;

    // Par district
    const { data: districtStats } = await client
      .from('Participants')
      .select('district_id(nom), COUNT(*)', { count: 'exact' })
      .not('district_id', 'is', null)
      .group_by('district_id');

    let districtHtml = '<ul>';
    if (districtStats && districtStats.length > 0) {
      districtStats.forEach(stat => {
        if (stat.district_id) {
          districtHtml += `<li>${stat.district_id.nom}: ${stat.count} participants</li>`;
        }
      });
    } else {
      districtHtml += '<li>Aucune donnée</li>';
    }
    districtHtml += '</ul>';
    document.getElementById('stats_by_district').innerHTML = districtHtml;

  } catch (error) {
    logError("chargerStatistiques", error);
  }
}

// ============================================
// METTRE À JOUR STATISTIQUES
// ============================================
async function mettreAJourStatistiques() {
  try {
    if (!supabaseConnected) {
      document.getElementById('totalParticipants').textContent = '?';
      document.getElementById('totalFormations').textContent = '?';
      document.getElementById('totalBranches').textContent = '?';
      return;
    }

    const { count: countParticipants } = await client
      .from('Participants')
      .select('*', { count: 'exact', head: true });

    const { count: countFormations } = await client
      .from('Formation')
      .select('*', { count: 'exact', head: true });

    const { data: branches } = await client
      .from('Formation')
      .select('branche_id')
      .not('branche_id', 'is', null);

    const uniqueBranches = new Set(branches.map(f => f.branche_id)).size;

    document.getElementById('totalParticipants').textContent = countParticipants || 0;
    document.getElementById('totalFormations').textContent = countFormations || 0;
    document.getElementById('totalBranches').textContent = uniqueBranches || 0;

  } catch (error) {
    logError("mettreAJourStatistiques", error);
    document.getElementById('totalParticipants').textContent = '?';
    document.getElementById('totalFormations').textContent = '?';
    document.getElementById('totalBranches').textContent = '?';
  }
}
