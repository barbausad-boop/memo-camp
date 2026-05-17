# 📋 Memo-Camp

**Plateforme de gestion complète des formations scoutes - Scouts du Sénégal**

## 🔗 Accès à l'application

### **Version Simplifiée (Recommandée)** ✅
👉 **https://memo-camp.vercel.app/index_simple.html**

### Caractéristiques :
- ✅ Enregistrement multi-stages des participants
- ✅ Validation hiérarchique (C.I → C.E.P → C.N.B → C.B.B)
- ✅ Gestion des branches (Jaune, Vert, Rouge)
- ✅ Onglet "Participants" - Liste complète
- ✅ Onglet "Promotions" - Classement par année et stage
- ✅ Onglet "Statistiques" - Par stage et branche

---

## 📊 Fonctionnalités

### **1. Inscription des participants** 📝
- Informations personnelles (Prénom, Nom, Date de naissance, etc.)
- Parcours complet de formation
- Validation de la hiérarchie des stages
- Sélection des branches pour C.E.P et C.N.B

### **2. Gestion des stages** 🎓
- **C.I** (Camp Initiation)
- **C.E.P** (Camp École Préparatoire) + Branche
- **C.N.B** (Camp National Branche) + Branche
- **C.B.B** (Camp Badge Bois)

### **3. Affichage des données** 👥
- Liste de tous les participants
- Profil complet avec parcours
- Promotions par année et stage
- Statistiques détaillées

---

## 🛠️ Configuration Supabase

### Tables créées :
- `Participants` - Informations des participants
- `Formation` - Parcours de formation
- `stages` - Types de stages (C.I, C.E.P, C.N.B, C.B.B)
- `branches` - Branches spécialisées (Jaune, Vert, Rouge)
- `regions` - Régions du Sénégal
- `districts` - Districts par région

### Scripts SQL :
- `supabase_setup.sql` - Création complète des tables

---

## 📱 Technologie

- **Frontend** : HTML5, CSS3, JavaScript
- **Backend** : Supabase (PostgreSQL)
- **Déploiement** : Vercel
- **Authentification** : Clé API publique Supabase

---

## 🚀 Comment démarrer

1. Cloner le repository
2. Créer un projet Supabase
3. Exécuter `supabase_setup.sql` dans l'éditeur SQL
4. Désactiver la sécurité au niveau des lignes (RLS) sur les tables
5. Déployer sur Vercel

---

## 📄 Fichiers principaux

| Fichier | Description |
|---------|------------|
| `index_simple.html` | Interface principale simplifiée |
| `script_simple.js` | Logique JavaScript |
| `styles.css` | Styles CSS |
| `supabase_setup.sql` | Script création base de données |

---

## ⚙️ Variables d'environnement

```javascript
SUPABASE_URL = "https://gdjenoyyclazwbqvdmcx.supabase.co"
SUPABASE_KEY = "sb_publishable_cUr1KyPEvF9jGMKsB3DO1A_lITF0XQK"
```

---

## 📞 Support

Pour toute question ou bug, veuillez créer une issue sur GitHub.

---

**Créé pour les Scouts du Sénégal** 🏕️
