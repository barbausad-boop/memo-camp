const SUPABASE_URL = "https://gdjenoyyclazwbqvdmcx.supabase.co";
const SUPABASE_KEY = "sb_publishable_cUr1KyPEvF9jGMKsB3DO1A_lITF0XQK";

let client;
let supabaseConnected = false;
let participantActuelId = null;
let formationsExistantes = {};

try {
  client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
  console.error("❌ Erreur initialisation Supabase:", error);
}

// Données de secours
const donneesSenegal = [
  { id: 1, nom: 'Dakar' },
  { id: 2, nom: 'Thiès' },
  { id: 3, nom: 'Fleuve' },
  { id: 4, nom: 'Petite Côte' },
  { id: 5, nom: 'Kaolack' },
  { id: 6, nom: 'Casamance' }
];

const districtsSenegal = {
  1: [ { id: 101, nom: 'Dakar', region_id: 1 }, { id: 102, nom: 'Rufisque', region_id: 1 }, { id: 103, nom: 'Guédiawaye', region_id: 1 } ],
  2: [ { id: 201, nom: 'Jappo', region_id: 2 }, { id: 202, nom: 'Diobass', region_id: 2 }, { id: 203, nom: 'Baol', region_id: 2 }, { id: 204, nom: 'Daniel-Brottier', region_id: 2 } ],
  3: [ { id: 301, nom: 'Saint-Louis', region_id: 3 }, { id: 302, nom: 'Matam', region_id: 3 }, { id: 303, nom: 'Podor', region_id: 3 } ],
  4: [ { id: 401, nom: 'Mbour', region_id: 4 }, { id: 402, nom: 'Saly', region_id: 4 }, { id: 403, nom: 'Joal', region_id: 4 } ],
  5: [ { id: 501, nom: 'Kaolack', region_id: 5 }, { id: 502, nom: 'Tambacounda', region_id: 5 }, { id: 503, nom: 'Kolda', region_id: 5 } ],
  6: [ { id: 601, nom: 'Ziguinchor', region_id: 6 }, { id: 602, nom: 'Bignona', region_id: 6 }, { id: 603, nom: 'Oussouye', region_id: 6 } ]
};

window.districtsSenegal = districtsSenegal;

function showErrorWithDetails(title, error) {
  let message = title + "\n\n";
  if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
    message += "❌ Impossible de se connecter à la base de données.\n";
    message += "Raisons: Pas internet / Serveur indisponible / CORS\n\n";
    message += "⚠️ Mode hors ligne activé.";
  } else if (error.message) {
    message += error.message;
  } else {
    message += JSON.stringify(error);
  }
  console.error("Error Details:", error);
  return message;
}

function logError(context, error) {
  console.error(`[${context}] ❌`, error);
}

async function testSupabaseConnection() {
  try {
    console.log("🔍 Test de connexion Supabase...");
    const { data, error } = await client
      .from('regions')
      .select('count', { count: 'exact', head: true });
    
    supabaseConnected = true;
    console.log("✅ Supabase connecté");
    return true;
  } catch (error) {
    supabaseConnected = false;
    logError("Test Supabase", error);
    console.warn("⚠️ Supabase indisponible");
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log("🚀 Application Memo-Camp chargée");
  await testSupabaseConnection();
  setTimeout(async () => {
    try {
      await chargerRegions();
      await mettreAJourStatistiques();
      await chargerParticipants();
    } catch (error) {
      logError("Initialisation", error);
    }
  }, 500);
});

function showTab(tabId) {
  try {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    if (tabId === 'tab-participants') chargerParticipants();
    else if (tabId === 'tab-promotions') chargerPromotions();
    else if (tabId === 'tab-statistiques') chargerStatistiques();
  } catch (error) {
    logError("showTab", error);
  }
}

async function detecterParticipantExistant() {
  try {
    const firstName = document.getElementById('first_name').value.trim();
    const lastName = document.getElementById('last_name').value.trim();
    document.getElementById('participant-detection').style.display = 'none';
    document.getElementById('formations-completed').style.display = 'none';
    participantActuelId = null;
    formationsExistantes = {};
    if (!firstName || !lastName || !supabaseConnected) return;
    const { data: participants, error } = await client
      .from('Participants')
      .select('*')
      .ilike('first_name', `%${firstName}%`)
      .ilike('last_name', `%${lastName}%`);
    if (error) throw error;
    if (participants && participants.length > 0) {
      const participant = participants[0];
      participantActuelId = participant.id;
      const { data: formations, error: formError } = await client
        .from('Formation')
        .select('*, stage_id(code), branche_id(nom)')
        .eq('participant_id', participantActuelId);
      if (formError) throw formError;
      if (formations && formations.length > 0) {
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
    }
  } catch (error) {
    logError("detecterParticipantExistant", error);
  }
}

function afficherDetectionParticipant(participant, formations) {
  const detectionDiv = document.getElementById('participant-detection');
  const contentDiv = document.getElementById('detection-content');
  let html = `<p><strong>Participant:</strong> ${participant.first_name} ${participant.last_name}</p>`;
  if (formations.length > 0) {
    html += `<div class="participant-history">`;
    html += `<strong>📚 Formations complétées:</strong><br>`;
    formations.forEach(f => {
      html += `<div class="stage-completed"><span class="check">✓</span> <strong>${f.stage_id.code}</strong> (${f.annee_stage}) ${f.branche_id ? `- ${f.branche_id.nom}` : ''} ${f.lieu_stage ? `- ${f.lieu_stage}` : ''}</div>`;
    });
    html += `</div>`;
  }
  contentDiv.innerHTML = html;
  detectionDiv.style.display = 'block';
  Object.keys(formationsExistantes).forEach(stageCode => {
    const stageKey = stageCode.toLowerCase().replace('.', '');
    const checkbox = document.getElementById(`has_${stageKey}`);
    if (checkbox) {
      checkbox.disabled = true;
      checkbox.checked = true;
      const fields = document.getElementById(`${stageKey}_fields`);
      if (fields) {
        fields.classList.remove('active');
        fields.style.display = 'none';
      }
    }
  });
}

function continuerParticipant() {
  document.getElementById('participant-detection').style.display = 'none';
  afficherFormationsCompletees();
}

function afficherFormationsCompletees() {
  const formationsCompletedDiv = document.getElementById('formations-completed');
  const listDiv = document.getElementById('formations-completed-list');
  if (Object.keys(formationsExistantes).length === 0) return;
  let html = '';
  Object.entries(formationsExistantes).forEach(([stageCode, details]) => {
    html += `<div class="stage-completed"><span class="check">✓</span> <strong>${stageCode}</strong> (${details.annee}) ${details.branche ? `- ${details.branche}` : ''} ${details.lieu ? `- ${details.lieu}` : ''}</div>`;
  });
  listDiv.innerHTML = html;
  formationsCompletedDiv.style.display = 'block';
}

function reinitialiserFormulaire() {
  document.querySelector('form').reset();
  document.getElementById('participant-detection').style.display = 'none';
  document.getElementById('formations-completed').style.display = 'none';
  ['ci', 'cep', 'cnb', 'cbb'].forEach(stage => {
    const checkbox = document.getElementById(`has_${stage}`);
    if (checkbox) {
      checkbox.disabled = false;
      checkbox.checked = false;
    }
    const fields = document.getElementById(`${stage}_fields`);
    if (fields) fields.classList.remove('active');
  });
  participantActuelId = null;
  formationsExistantes = {};
}

async function chargerRegions() {
  try {
    const select = document.getElementById('region_id');
    if (!select) throw new Error("SELECT region_id non trouvé!");
    let data = donneesSenegal;
    if (supabaseConnected) {
      try {
        const { data: supabaseData, error } = await Promise.race([
          client.from('regions').select('id, nom').order('nom'),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);
        if (!error && supabaseData && supabaseData.length > 0) data = supabaseData;
      } catch (e) {
        console.log("⚠️ Utilisation données locales");
      }
    }
    select.innerHTML = '<option value="">-- Sélectionner une région --</option>';
    data.forEach(region => {
      const option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.nom;
      select.appendChild(option);
    });
  } catch (error) {
    logError("chargerRegions", error);
  }
}

async function chargerDistricts() {
  try {
    const regionId = document.getElementById('region_id').value;
    const districtSelect = document.getElementById('district_id');
    if (!regionId) {
      districtSelect.innerHTML = '<option value="">-- Sélectionner un district --</option>';
      return;
    }
    let data = [];
    if (supabaseConnected) {
      try {
        const { data: supabaseData, error } = await Promise.race([
          client.from('districts').select('id, nom').eq('region_id', parseInt(regionId)).order('nom'),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);
        if (!error && supabaseData && supabaseData.length > 0) {
          data = supabaseData;
        } else {
          data = window.districtsSenegal[regionId] || [];
        }
      } catch (e) {
        data = window.districtsSenegal[regionId] || [];
      }
    } else {
      data = window.districtsSenegal[regionId] || [];
    }
    districtSelect.innerHTML = '<option value="">-- Sélectionner un district --</option>';
    if (data.length === 0) {
      districtSelect.innerHTML += '<option disabled>Aucun district</option>';
      return;
    }
    data.forEach(district => {
      const option = document.createElement('option');
      option.value = district.id;
      option.textContent = district.nom;
      districtSelect.appendChild(option);
    });
  } catch (error) {
    logError("chargerDistricts", error);
  }
}

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
      alert("❌ Branche obligatoire pour C.E.P");
      return false;
    }
    if (document.getElementById('has_cnb').checked && !document.getElementById('cnb_branche').value) {
      alert("❌ Branche obligatoire pour C.N.B");
      return false;
    }
    return true;
  } catch (error) {
    logError("validerHierarchieStages", error);
    return false;
  }
}

async function enregistrerParticipant() {
  try {
    if (!validerHierarchieStages()) return;
    if (!supabaseConnected) {
      alert("⚠️ Base indisponible");
      return;
    }
    const firstName = document.getElementById('first_name').value.trim();
    const lastName = document.getElementById('last_name').value.trim();
    const regionId = document.getElementById('region_id').value;
    const districtId = document.getElementById('district_id').value;
    if (!firstName || !lastName || !regionId || !districtId) {
      alert("❌ Prénom, Nom, Région et District obligatoires");
      return;
    }
    let participantId = participantActuelId;
    if (!participantId) {
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
      const { data: participantData, error: participantError } = await client.from('Participants').insert([participant]).select();
      if (participantError) throw participantError;
      participantId = participantData[0].id;
    }
    const stagesMap = {
      'ci': { code: 'C.I', ordre: 1, needBranch: false },
      'cep': { code: 'C.E.P', ordre: 2, needBranch: true },
      'cnb': { code: 'C.N.B', ordre: 3, needBranch: true },
      'cbb': { code: 'C.B.B', ordre: 4, needBranch: false }
    };
    const formations = [];
    for (const [stageKey, stageInfo] of Object.entries(stagesMap)) {
      const hasStage = document.getElementById(`has_${stageKey}`).checked;
      if (formationsExistantes[stageInfo.code]) continue;
      if (hasStage) {
        const annee = document.getElementById(`${stageKey}_annee`).value;
        const lieu = document.getElementById(`${stageKey}_lieu`).value || null;
        let brancheId = null;
        if (stageInfo.needBranch) {
          const branchNom = document.getElementById(`${stageKey}_branche`).value;
          try {
            const { data: branchData } = await client.from('branches').select('id').eq('nom', branchNom).single();
            if (branchData) brancheId = branchData.id;
          } catch (e) {
            logError("Chargement branche", e);
          }
        }
        try {
          const { data: stageData } = await client.from('stages').select('id').eq('code', stageInfo.code).single();
          formations.push({
            participant_id: participantId,
            stage_id: stageData.id,
            branche_id: brancheId,
            annee_stage: parseInt(annee),
            lieu_stage: lieu
          });
        } catch (e) {
          logError("Chargement stage", e);
        }
      }
    }
    if (formations.length > 0) {
      const { error: formationError } = await client.from('Formation').insert(formations);
      if (formationError) throw formationError;
    }
    alert("✅ Enregistrement réussi !");
    reinitialiserFormulaire();
    await mettreAJourStatistiques();
    await chargerParticipants();
  } catch (error) {
    logError("enregistrerParticipant", error);
    alert(showErrorWithDetails("Erreur enregistrement", error));
  }
}

async function chargerParticipants() {
  try {
    if (!supabaseConnected) {
      const tableBody = document.getElementById('tableBody');
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">⏸️ Indisponible</td></tr>';
      return;
    }
    const recherche = document.getElementById('search') ? document.getElementById('search').value.trim() : '';
    let query = client.from('parcours_participant').select('*');
    if (recherche) query = query.or(`first_name.ilike.%${recherche}%,last_name.ilike.%${recherche}%`);
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
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Aucun participant</td></tr>';
      return;
    }
    Object.values(participants).forEach(p => {
      const stages = p.formations.map(f => f.stage_code).join(', ');
      tableBody.innerHTML += `<tr><td>${p.first_name || '-'}</td><td>${p.last_name || '-'}</td><td>${p.region_nom}</td><td>${stages || 'Aucun'}</td><td><button onclick="afficherProfil(${p.id})" class="btn-small">👁️</button></td></tr>`;
    });
  } catch (error) {
    logError("chargerParticipants", error);
  }
}

async function afficherProfil(participantId) {
  try {
    if (!supabaseConnected) {
      alert("⚠️ Base indisponible");
      return;
    }
    const { data, error } = await client.from('parcours_participant').select('*').eq('id', participantId);
    if (error) throw error;
    if (data.length === 0) {
      alert("Profil non trouvé");
      return;
    }
    const p = data[0];
    let profil = `${p.first_name} ${p.last_name}\n`;
    profil += `Région: ${p.region_nom || '-'}\n`;
    profil += `District: ${p.district_nom || '-'}\nFonction: ${p.fonction_actuelle || '-'}\n`;
    profil += `Groupe: ${p.groupe_base || '-'}\n\nParcours:\n`;
    data.forEach(row => {
      if (row.stage_code) {
        profil += `- ${row.stage_code} (${row.annee_stage})`;
        if (row.branche_nom) profil += ` - ${row.branche_nom}`;
        if (row.lieu_stage) profil += ` - ${row.lieu_stage}`;
        profil += `\n`;
      }
    });
    alert(profil);
  } catch (error) {
    logError("afficherProfil", error);
    alert(showErrorWithDetails("Erreur profil", error));
  }
}

// ============================================
// CHARGER PROMOTIONS - NOUVEAU FORMAT
// ============================================
async function chargerPromotions() {
  try {
    if (!supabaseConnected) {
      const container = document.getElementById('promotions_container');
      if (container) container.innerHTML = '<p style="text-align:center;">⏸️ Indisponible</p>';
      return;
    }

    console.log("📊 Chargement promotions...");

    // Récupérer TOUTES les formations avec leurs détails
    const { data, error } = await client
      .from('parcours_participant')
      .select('*')
      .not('stage_code', 'is', null)
      .order('annee_stage', { ascending: false });

    if (error) throw error;

    // Organiser par stage → branche → année
    const promotionsByStage = {
      'C.I': { label: '1️⃣ C.I (Camp Initiation)', data: {} },
      'C.E.P': { label: '2️⃣ C.E.P (Camp École Préparatoire)', data: {} },
      'C.N.B': { label: '3️⃣ C.N.B (Camp National Branche)', data: {} },
      'C.B.B': { label: '4️⃣ C.B.B (Camp Badge Bois)', data: {} }
    };

    data.forEach(row => {
      if (!promotionsByStage[row.stage_code]) return;

      const brancheKey = row.branche_nom || 'Sans branche';
      if (!promotionsByStage[row.stage_code].data[brancheKey]) {
        promotionsByStage[row.stage_code].data[brancheKey] = {};
      }

      const annee = row.annee_stage;
      if (!promotionsByStage[row.stage_code].data[brancheKey][annee]) {
        promotionsByStage[row.stage_code].data[brancheKey][annee] = [];
      }

      if (!promotionsByStage[row.stage_code].data[brancheKey][annee].find(p => p.id === row.id)) {
        promotionsByStage[row.stage_code].data[brancheKey][annee].push({
          id: row.id,
          name: `${row.first_name} ${row.last_name}`,
          region: row.region_nom,
          lieu: row.lieu_stage
        });
      }
    });

    const container = document.getElementById('promotions_container');
    let html = '';

    // Afficher par stage
    Object.entries(promotionsByStage).forEach(([stageCode, stageInfo]) => {
      const branchData = stageInfo.data;
      
      // S'il y a des données pour ce stage
      if (Object.keys(branchData).length > 0) {
        html += `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">`;
        html += `<h2 style="margin-top: 0;">${stageInfo.label}</h2>`;

        // Si C.I ou C.B.B (sans branche)
        if (stageCode === 'C.I' || stageCode === 'C.B.B') {
          const participants = branchData['Sans branche'] || {};
          const totalParticipants = Object.values(participants).reduce((sum, arr) => sum + arr.length, 0);
          
          html += `<p><strong>Total: ${totalParticipants} participants</strong></p>`;
          
          // Afficher par année (décroissant)
          const annees = Object.keys(participants).sort((a, b) => b - a);
          annees.forEach(annee => {
            const count = participants[annee].length;
            html += `<div style="background: rgba(255,255,255,0.1); padding: 10px; margin: 8px 0; border-radius: 4px;">`;
            html += `<strong>${annee}:</strong> ${count} participant(s)`;
            html += `<ul style="margin: 8px 0 0 0; padding-left: 20px;">`;
            participants[annee].forEach(p => {
              html += `<li>${p.name}${p.region ? ` - ${p.region}` : ''}${p.lieu ? ` - ${p.lieu}` : ''}</li>`;
            });
            html += `</ul></div>`;
          });
        }
        // Si C.E.P ou C.N.B (avec branches)
        else {
          Object.entries(branchData).forEach(([brancheName, yearData]) => {
            const totalBranche = Object.values(yearData).reduce((sum, arr) => sum + arr.length, 0);
            
            html += `<div style="background: rgba(255,255,255,0.15); padding: 15px; margin: 12px 0; border-radius: 6px; border-left: 4px solid #FFD700;">`;
            html += `<strong style="font-size: 16px;">🌳 Branche ${brancheName}: ${totalBranche} participant(s)</strong>`;
            
            // Afficher par année (décroissant)
            const annees = Object.keys(yearData).sort((a, b) => b - a);
            annees.forEach(annee => {
              const count = yearData[annee].length;
              html += `<div style="background: rgba(255,255,255,0.08); padding: 8px; margin: 8px 0; border-radius: 3px;">`;
              html += `<strong>${annee}:</strong> ${count} participant(s)`;
              html += `<ul style="margin: 6px 0 0 0; padding-left: 20px; font-size: 13px;">`;
              yearData[annee].forEach(p => {
                html += `<li>${p.name}${p.region ? ` - ${p.region}` : ''}${p.lieu ? ` - ${p.lieu}` : ''}</li>`;
              });
              html += `</ul></div>`;
            });
            
            html += `</div>`;
          });
        }
        
        html += `</div>`;
      }
    });

    if (html === '') {
      html = '<p style="text-align:center; color: #999;">❌ Aucune promotion trouvée</p>';
    }

    container.innerHTML = html;
    console.log("✅ Promotions chargées");

  } catch (error) {
    logError("chargerPromotions", error);
    const container = document.getElementById('promotions_container');
    container.innerHTML = '<p style="color:red;">❌ Erreur chargement</p>';
  }
}

// ============================================
// CHARGER STATISTIQUES - CORRIGÉ
// ============================================
async function chargerStatistiques() {
  try {
    if (!supabaseConnected) {
      document.getElementById('stats_by_stage').innerHTML = '<p>⏸️ Indisponible</p>';
      document.getElementById('stats_by_branch').innerHTML = '<p>⏸️ Indisponible</p>';
      document.getElementById('stats_by_region').innerHTML = '<p>⏸️ Indisponible</p>';
      document.getElementById('stats_by_district').innerHTML = '<p>⏸️ Indisponible</p>';
      return;
    }

    console.log("📊 Calcul statistiques...");

    // PAR STAGE - Requête correcte
    const { data: allFormations, error: formError } = await client
      .from('Formation')
      .select('*, stage_id(code)');

    if (formError) throw formError;

    const stageCounts = {};
    allFormations.forEach(f => {
      const stageName = f.stage_id?.code || 'Inconnu';
      stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
    });

    let stageHtml = '<ul>';
    if (Object.keys(stageCounts).length > 0) {
      Object.entries(stageCounts).forEach(([stage, count]) => {
        stageHtml += `<li><strong>${stage}:</strong> ${count} participant(s)</li>`;
      });
    } else {
      stageHtml += '<li>Aucune donnée</li>';
    }
    stageHtml += '</ul>';
    document.getElementById('stats_by_stage').innerHTML = stageHtml;

    // PAR BRANCHE - Requête correcte
    const { data: branchFormations, error: branchError } = await client
      .from('Formation')
      .select('*, branche_id(nom)')
      .not('branche_id', 'is', null);

    if (branchError) throw branchError;

    const branchCounts = {};
    branchFormations.forEach(f => {
      const branchName = f.branche_id?.nom || 'Inconnu';
      branchCounts[branchName] = (branchCounts[branchName] || 0) + 1;
    });

    let branchHtml = '<ul>';
    if (Object.keys(branchCounts).length > 0) {
      Object.entries(branchCounts).forEach(([branch, count]) => {
        branchHtml += `<li><strong>${branch}:</strong> ${count} participant(s)</li>`;
      });
    } else {
      branchHtml += '<li>Aucune donnée</li>';
    }
    branchHtml += '</ul>';
    document.getElementById('stats_by_branch').innerHTML = branchHtml;

    // PAR RÉGION - Requête correcte
    const { data: regionParticipants, error: regionError } = await client
      .from('Participants')
      .select('*, region_id(nom)');

    if (regionError) throw regionError;

    const regionCounts = {};
    regionParticipants.forEach(p => {
      const regionName = p.region_id?.nom || 'Inconnu';
      regionCounts[regionName] = (regionCounts[regionName] || 0) + 1;
    });

    let regionHtml = '<ul>';
    if (Object.keys(regionCounts).length > 0) {
      Object.entries(regionCounts).forEach(([region, count]) => {
        regionHtml += `<li><strong>${region}:</strong> ${count} participant(s)</li>`;
      });
    } else {
      regionHtml += '<li>Aucune donnée</li>';
    }
    regionHtml += '</ul>';
    document.getElementById('stats_by_region').innerHTML = regionHtml;

    // PAR DISTRICT - Requête correcte
    const { data: districtParticipants, error: districtError } = await client
      .from('Participants')
      .select('*, district_id(nom)');

    if (districtError) throw districtError;

    const districtCounts = {};
    districtParticipants.forEach(p => {
      const districtName = p.district_id?.nom || 'Inconnu';
      districtCounts[districtName] = (districtCounts[districtName] || 0) + 1;
    });

    let districtHtml = '<ul>';
    if (Object.keys(districtCounts).length > 0) {
      Object.entries(districtCounts).forEach(([district, count]) => {
        districtHtml += `<li><strong>${district}:</strong> ${count} participant(s)</li>`;
      });
    } else {
      districtHtml += '<li>Aucune donnée</li>';
    }
    districtHtml += '</ul>';
    document.getElementById('stats_by_district').innerHTML = districtHtml;

    console.log("✅ Statistiques calculées");

  } catch (error) {
    logError("chargerStatistiques", error);
  }
}

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
