# SAE_Advanced_Deployment


Amin belalia 
Luka Salvo


# Planificateur d'Evénements

Bienvenue dans le Planificateur d'Evénements, une application web permettant de créer, gérer et suivre des événements. Développée avec React pour le frontend, Node.js/Express pour le backend, et PostgreSQL pour la base de données, cette application offre une interface intuitive pour organiser et participer à des événements.

## Fonctionnalités

    Création d'événements avec titre, date, heure, lieu et description.
    Modification et suppression d'événements par leur créateur.
    Filtrage des événements (tous, futurs, passés).
    Système d'authentification avec inscription et connexion.
    Gestion des inscriptions aux événements.
    Affichage des événements auxquels l'utilisateur participe.

## Prérequis

    Docker et Docker Compose pour exécuter l'application.
    Un terminal pour exécuter les commandes.

## Installation

    Clone le dépôt : git clone https://github.com/LukaSalvo/SAE_Advanced_Deployment cd sae_advanced_deployment
    Créez un fichier .env à la racine du projet avec les variables suivantes (remplacez les valeurs par les vôtres) : DB_USER=your_username DB_HOST=db DB_NAME=your_database DB_PASSWORD=your_password DB_PORT=5432 JWT_SECRET=your_jwt_secret_key PORT=3001
    Lancez l'application avec Docker Compose : docker-compose up --build
    Accédez à l'application dans votre navigateur à l'adresse : http://localhost:3000.

## Utilisation

    Inscription/Connexion : Utilisez les boutons "Se connecter" ou "S'inscrire" pour accéder à votre compte.
    Création d'événement : Connectez-vous, puis remplissez le formulaire en bas de la page pour ajouter un événement.
    Gestion des événements : Modifiez ou supprimez vos propres événements via les boutons "Modifier" et "Supprimer".
    Participation : Cliquez sur "Assister" pour vous inscrire à un événement.

## Structure du projet
SAE_Advanced_Deployment/
|-- backend/              # Backend Node.js/Express
|   |-- Dockerfile
|   |-- index.js
|   |-- package-lock.json
|   |-- package.json
|-- db-init/              # Initialisation de la base de données
|   |-- init.sql
|-- docker-compose.yml    # Configuration Docker
|-- docs/                 # Documentation
|   |-- synthetise.md
|-- explication.md        # Explications supplémentaires
|-- frontend/             # Frontend React
|   |-- Dockerfile
|   |-- eslint.config.js
|   |-- index.html
|   |-- package-lock.json
|   |-- package.json
|   |-- public/
|   |-- README.md
|   |-- src/
|   |-- vite.config.js
|-- README.md             # Ce fichier

## Contribution

    Forkez le dépôt.
    Créez une branche pour votre fonctionnalité : git checkout -b feature/nouvelle-fonctionnalite.
    Committez vos changements : git commit -m "Description de la modification".
    Poussez vers le dépôt : git push origin feature/nouvelle-fonctionnalite.
    Ouvrez une pull request.



## Contact
Pour toute question ou suggestion, contactez-moi via [luka.salvo23@gmail.com] ou ouvrez une issue sur le dépôt GitHub.