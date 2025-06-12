# SAE_Advanced_Deployment

**Amin Belalia**  
**Luka Salvo**

# Planificateur d'Événements

Bienvenue dans le Planificateur d'Événements, une application web permettant de créer, gérer et suivre des événements. Développée avec React pour le frontend, Node.js/Express pour le backend, et PostgreSQL pour la base de données, cette application offre une interface intuitive pour organiser et participer à des événements.

## Fonctionnalités

- Création d'événements avec titre, date, heure, lieu et description.
- Modification et suppression d'événements par leur créateur.
- Filtrage des événements (tous, futurs, passés).
- Système d'authentification avec inscription et connexion.
- Gestion des inscriptions aux événements.
- Affichage des événements auxquels l'utilisateur participe.

## Prérequis

- Docker et Docker Compose pour exécuter l'application.
- Un terminal pour exécuter les commandes.
- Docker Swarm initialisé (nécessaire pour le déploiement avec les secrets).

## Installation

### 1. Clonez le dépôt

```bash
git clone https://github.com/LukaSalvo/SAE_Advanced_Deployment
cd SAE_Advanced_Deployment
```

### 2. Initialisez Docker Swarm (si ce n'est pas déjà fait)

```bash
docker swarm init
```

### 3. Créez les secrets Docker pour les données sensibles

```bash
echo "nom_de_votre_USER" | docker secret create db_user -
echo "votre_mot_de_passe" | docker secret create db_password -
echo "votre_jwt_secret_key" | docker secret create jwt_secret -
```

> Remplacez les valeurs (`nom_de_votre_USER`, `votre_mot_de_passe`, `votre_jwt_secret_key`) par celles que vous souhaitez utiliser.

### 4. Construisez les images Docker (si elles ne sont pas déjà construites)

```bash
docker build -t sae_advanced_deployment-backend:latest ./backend
docker build -t sae_advanced_deployment-db:latest ./db-init
docker build -t sae_advanced_deployment-frontend:latest ./frontend
```

### 5. Déployez l'application avec Docker Stack

```bash
docker stack deploy -c docker-compose.yml mon_stack
```

Accédez à l'application dans votre navigateur à l'adresse : [http://localhost:3000](http://localhost:3000)

## Utilisation

- **Inscription/Connexion** : Utilisez les boutons "Se connecter" ou "S'inscrire" pour accéder à votre compte.
- **Création d'événement** : Connectez-vous, puis remplissez le formulaire en bas de la page pour ajouter un événement.
- **Gestion des événements** : Modifiez ou supprimez vos propres événements via les boutons "Modifier" et "Supprimer".
- **Participation** : Cliquez sur "Assister" pour vous inscrire à un événement.

## Structure du projet

```
SAE_Advanced_Deployment/
├── backend/                # Backend Node.js/Express
│   ├── Dockerfile
│   ├── index.js
│   ├── package-lock.json
│   └── package.json
├── db-init/               # Initialisation de la base de données
│   └── init.sql
├── docker-compose.yml     # Configuration Docker pour Swarm
├── docs/                  # Documentation
│   └── synthetise.md
├── explication.md         # Explications supplémentaires
├── frontend/              # Frontend React
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── public/
│   ├── README.md
│   └── src/
│   └── vite.config.js
└── README.md              # Ce fichier
```

## Contribution

1. Forkez le dépôt.
2. Créez une branche pour votre fonctionnalité :

```bash
git checkout -b feature/nouvelle-fonctionnalite
```

3. Committez vos changements :

```bash
git commit -m "Description de la modification"
```

4. Poussez vers le dépôt :

```bash
git push origin feature/nouvelle-fonctionnalite
```

5. Ouvrez une pull request.

## Contact

Pour toute question ou suggestion, contactez-moi via [luka.salvo23@gmail.com](mailto:luka.salvo23@gmail.com) ou ouvrez une issue sur le dépôt GitHub.

## Remarques supplémentaires

- Assurez-vous que les ports `3000`, `3001` et `5432` ne sont pas utilisés par d'autres applications sur votre machine.
- Pour arrêter la stack, utilisez :

```bash
docker stack rm mon_stack
```

- Pour vérifier l'état des services, utilisez :

```bash
docker stack ps mon_stack
```
