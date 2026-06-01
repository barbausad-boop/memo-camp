# 📋 Memo-Camp

**Plateforme de gestion complète des formations scoutes - Scouts du Sénégal**

## 🔗 Accès à l'application

### **Version Complète avec Régions & Districts** ✅
👉 **https://memo-camp.vercel.app/index_final.html**

---

## ✨ Caractéristiques principales

- ✅ **Enregistrement multi-stages** des participants
- ✅ **Sélection des régions et districts** (Thiès, Dakar, Fleuve, etc.)
- ✅ **Validation hiérarchique** (C.I → C.E.P → C.N.B → C.B.B)
- ✅ **Gestion des branches** (Jaune, Vert, Rouge)
- ✅ **4 onglets complets** :
  - 📝 **Inscription** - Formulaire d'enregistrement
  - 👥 **Participants** - Liste avec région et stages
  - 🎓 **Promotions** - Groupement par année et stage
  - 📊 **Statistiques** - Par stage, branche, région, district

---

## 🎓 Stages de Formation

| Stage | Code | Branche | Description |
|-------|------|---------|-------------|
| Camp Initiation | C.I | - | Introduction au scoutisme |
| Camp École Préparatoire | C.E.P | ✓ | Formation spécialisée par branche |
| Camp National Branche | C.N.B | ✓ | Formation avancée |
| Camp Badge Bois | C.B.B | - | Spécialisation en plein air |

---

## 📊 Fonctionnalités

### **1. Inscription des participants** 📝
- Informations personnelles (Prénom, Nom, Date de naissance, etc.)
- Sélection de la **région** et du **district**
- Parcours complet de formation multi-stages
- Validation automatique de la hiérarchie

### **2. Gestion des régions/districts** 📍
- **Régions** : Dakar, Thiès, Fleuve, Petite Côte, Kaolack, Casamance
- **Districts** : Filtrés automatiquement par région
- **Exemple** : Région Thiès → Districts (Jappo, Diobass, Baol, Daniel-Brottier)

### **3. Affichage des données** 👥
- Liste complète des participants avec région
- Profil détaillé de chaque participant
- Promotions regroupées par année et stage
- Statistiques par stage, branche, région, district

---

## 🛠️ Architecture Technique

### **Base de Données (Supabase)**

**Tables principales :**
- `Participants` - Informations des participants (nom, prénom, région, district, etc.)
- `Formation` - Parcours de formation de chaque participant
- `stages` - Types de stages (C.I, C.E.P, C.N.B, C.B.B)
- `branches` - Branches spécialisées (Jaune, Vert, Rouge)
- `regions` - Régions du Sénégal
- `districts` - Districts par région
- `parcours_participant` - Vue complète du parcours

### **Stack Technologique**
- **Frontend** : HTML5, CSS3, JavaScript
- **Backend** : Supabase (PostgreSQL)
- **Déploiement** : Vercel
- **Authentification** : Clé API publique Supabase

---

## 📁 Fichiers du Projet

| Fichier | Description |
|---------|------------|
| `index_final.html` | Interface principale (RECOMMANDÉ) |
| `script_final.js` | Logique JavaScript complète |
| `styles.css` | Feuille de styles |
| `supabase_setup.sql` | Script de création des tables |
| `index_simple.html` | Version simplifiée (sans région/district) |
| `script_simple.js` | Logique de la version simple |

---

## 🚀 Démarrage rapide

### **Étape 1 : Prérequis**
- Compte Supabase actif
- Projet "memo-camp" créé
- Tables créées (exécuter `supabase_setup.sql`)
- RLS désactivé sur toutes les tables

### **Étape 2 : Configuration**
```javascript
// Les clés sont déjà configurées dans script_final.js
const SUPABASE_URL = "https://gdjenoyyclazwbqvdmcx.supabase.co"
const SUPABASE_KEY = "sb_publishable_cUr1KyPEvF9jGMKsB3DO1A_lITF0XQK"
```

### **Étape 3 : Accès**
👉 https://memo-camp.vercel.app/index_final.html

---

## 📋 Guide d'utilisation

### **Enregistrer un participant**
1. Sélectionner une **région** (exemple: Thiès)
2. Sélectionner un **district** (se remplit automatiquement)
3. Remplir les informations personnelles
4. Cocher les stages suivis
5. Ajouter l'année et le lieu de chaque stage
6. Pour C.E.P et C.N.B : sélectionner la branche
7. Cliquer sur "✅ Enregistrer"

### **Consulter les participants**
- Onglet **"Participants"** : liste complète
- Bouton **"👁️ Voir"** : affiche le profil complet

### **Voir les promotions**
- Onglet **"Promotions"**
- Groupement par stage et année
- Affichage de la région pour chaque participant

### **Statistiques**
- Onglet **"Statistiques"**
- Statistiques complètes par stage, branche, région, district

---

## 🔒 Sécurité

### **Configuration Supabase**
- RLS (Row Level Security) **désactivé** pour développement
- Clés API publiques utilisées
- Accès direct à la base de données

**⚠️ Pour production :**
- Activer RLS
- Utiliser des clés privées
- Ajouter l'authentification

---

## 📞 Support

Pour toute question, bug ou suggestion, créez une issue sur GitHub.

---

## 📝 Licence

Créé pour les **Scouts du Sénégal** 🏕️

**Dernière mise à jour :** Juin 2026
