#  Planificateur d’Événements Locaux 

##  Objectif du projet

Ce projet a pour but de développer un **Minimum Viable Product (MVP)** d'une application web permettant aux utilisateurs de **créer, découvrir et participer à des événements locaux** tels que :

- Meetups entre passionnés
- Ateliers de formation ou d’initiation
- Événements communautaires ou culturels
- Petits concerts, expositions, etc.

##  Proposition de valeur

L’application vise à **favoriser la vie locale et les échanges de proximité** à travers une plateforme simple, intuitive et rapide à déployer. Elle s’adresse à la fois au grand public et aux professionnels.
L'utilisateur l'ambda pourra consulter en illimités les évènement proche de chez lui et y participer. IL pourra aussi créer 3 évènements gratuitement. Au dela de ces 3 évènement gratuits, il devra payer 5 euros par évènement crée. 
Pour les proffesionnels, un abonnement existe pour 7.99 euro / mois, vous pourrez créer des évènements en illimité et les évènement seront boosté sur la page principale. 

### Fonctionnalités principales :

-  Découverte des événements proches par ville ou code postal
-  Création d’un événement avec nom, description, lieu, date/heure
-  Création de compte utilisateur
-  Possibilité pour chaque utilisateur de **créer gratuitement jusqu’à 3 événements**
-  Pour les professionnels : **abonnement mensuel peu coûteux** permettant de créer un nombre illimité d’événements


## Technologies utilisées

**Frontend :**
- React (Vite)
- CSS (personnalisé)
- ESLint (configuré)
- Docker (conteneurisation du client)

**Backend :**
- Node.js + Express (API REST)
- Gestion des utilisateurs, événements et abonnements
- Docker (conteneurisation du serveur)

**Base de données :**
- Sans doutes PostGressSQL

**Infrastructure & Déploiement :**
- Docker Compose (orchestration des services)
- GitHub Actions (CI/CD – à mettre en place)
- Cloud (déploiement prévu)

**Documentation :**
- README.md (instructions)
- docs/synthetise.md (historique, choix, obstacles)
- explication.md (présentation générale du projet)

##  Résultat attendu

Un prototype minimal mais complet, capable de :

- Être lancé en local avec `docker compose up`
- Être déployé facilement dans le cloud (accès public)
- Gérer l’inscription, la connexion, la création d’événements et l’abonnement

##  Documentation

Toutes les instructions seront détaillées dans le fichier `README.md` : installation, utilisation, architecture technique.