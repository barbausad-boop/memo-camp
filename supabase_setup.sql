-- ============================================
-- CRÉATION DES TABLES SUPABASE
-- Copie ce script dans l'éditeur SQL de Supabase
-- ============================================

-- 1. TABLE RÉGIONS
CREATE TABLE IF NOT EXISTS regions (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO regions (nom) VALUES 
  ('Dakar'),
  ('Thiès'),
  ('Fleuve'),
  ('Petite Côte'),
  ('Kaolack'),
  ('Casamance')
ON CONFLICT DO NOTHING;

-- 2. TABLE DISTRICTS
CREATE TABLE IF NOT EXISTS districts (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  region_id BIGINT NOT NULL REFERENCES regions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nom, region_id)
);

INSERT INTO districts (nom, region_id) VALUES 
  ('Jappo', (SELECT id FROM regions WHERE nom = 'Thiès')),
  ('Diobass', (SELECT id FROM regions WHERE nom = 'Thiès')),
  ('Baol', (SELECT id FROM regions WHERE nom = 'Thiès')),
  ('Daniel-Brottier', (SELECT id FROM regions WHERE nom = 'Thiès'))
ON CONFLICT DO NOTHING;

-- 3. TABLE BRANCHES
CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO branches (nom) VALUES 
  ('Jaune'),
  ('Vert'),
  ('Rouge')
ON CONFLICT DO NOTHING;

-- 4. TABLE STAGES
CREATE TABLE IF NOT EXISTS stages (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  nom VARCHAR(100) NOT NULL,
  ordre INT NOT NULL UNIQUE,
  branche_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO stages (code, nom, ordre, branche_required) VALUES 
  ('C.I', 'Camp Initiation', 1, FALSE),
  ('C.E.P', 'Camp École Préparatoire', 2, TRUE),
  ('C.N.B', 'Camp National Branche', 3, TRUE),
  ('C.B.B', 'Camp Badge Bois', 4, FALSE)
ON CONFLICT DO NOTHING;

-- 5. TABLE LIEUX DE STAGE
CREATE TABLE IF NOT EXISTS lieux_stage (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. TABLE PARTICIPANTS (MODIFIÉE)
DROP TABLE IF EXISTS "Participants" CASCADE;

CREATE TABLE IF NOT EXISTS "Participants" (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_naissance DATE,
  lieu_naissance VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(150),
  fonction_actuelle VARCHAR(100),
  groupe_base VARCHAR(100),
  region_id BIGINT REFERENCES regions(id),
  district_id BIGINT REFERENCES districts(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. TABLE FORMATIONS (COMPLÈTEMENT MODIFIÉE)
DROP TABLE IF EXISTS "Formation" CASCADE;

CREATE TABLE IF NOT EXISTS "Formation" (
  id BIGSERIAL PRIMARY KEY,
  participant_id BIGINT NOT NULL REFERENCES "Participants"(id) ON DELETE CASCADE,
  stage_id BIGINT NOT NULL REFERENCES stages(id),
  branche_id BIGINT REFERENCES branches(id),
  annee_stage INT NOT NULL,
  lieu_stage VARCHAR(150),
  region_accueil_id BIGINT REFERENCES regions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_id, stage_id)
);

-- 8. INDEX POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_formation_participant ON "Formation"(participant_id);
CREATE INDEX IF NOT EXISTS idx_formation_stage ON "Formation"(stage_id);
CREATE INDEX IF NOT EXISTS idx_formation_annee ON "Formation"(annee_stage);
CREATE INDEX IF NOT EXISTS idx_participants_region ON "Participants"(region_id);
CREATE INDEX IF NOT EXISTS idx_participants_district ON "Participants"(district_id);

-- 9. VUE POUR AFFICHER LE PARCOURS COMPLET
CREATE OR REPLACE VIEW parcours_participant AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.fonction_actuelle,
  p.groupe_base,
  f.id as formation_id,
  s.code as stage_code,
  s.nom as stage_nom,
  s.ordre as stage_ordre,
  b.nom as branche_nom,
  f.annee_stage,
  f.lieu_stage,
  f.created_at as date_enregistrement
FROM "Participants" p
LEFT JOIN "Formation" f ON p.id = f.participant_id
LEFT JOIN stages s ON f.stage_id = s.id
LEFT JOIN branches b ON f.branche_id = b.id
ORDER BY p.last_name, s.ordre;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
