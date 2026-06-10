
# OneMore
# Product Requirements Document (PRD) Enterprise v1.0

> **Supplements:** [docs/README.md](docs/README.md) — MVP MoSCoW, algorithms, RBAC, NFRs, data model, technical spec, ADRs. Section 27 MVP scope is superseded by [OneMore_MVP_MoSCoW.md](docs/prd/OneMore_MVP_MoSCoW.md).

## 1. Executive Summary

OneMore è una piattaforma digitale di allenamento e coaching fitness progettata per servire due categorie di utenti:

1. Utenti indipendenti che desiderano pianificare, registrare e analizzare i propri allenamenti.
2. Personal trainer e coach che necessitano di strumenti professionali per programmare, monitorare e seguire i propri clienti.

La filosofia del prodotto è semplice:

> Ogni allenamento genera dati. Ogni dato deve generare valore.

---

# 2. Product Vision

## Mission

Consentire a chiunque di migliorare la propria forma fisica attraverso programmazione, tracking, analisi e coaching.

## North Star Metric

Percentuale di utenti che completano almeno 3 allenamenti a settimana per 12 settimane consecutive.

---

# 3. Product Principles

## Coach Optional
L'app deve essere utilizzabile senza coach.

## Data Driven
I dati devono produrre insight.

## Mobile First
L'esperienza durante l'allenamento deve essere rapidissima.

## Progressive Disclosure
La complessità deve essere nascosta all'utente finale.

---

# 4. User Personas

## Independent Athlete

Obiettivo:
- monitorare progressi
- registrare allenamenti
- creare schede

Pain points:
- fogli Excel
- note smartphone
- app troppo complesse

## Coached Client

Obiettivo:
- seguire una programmazione
- ricevere supporto

## Personal Trainer

Obiettivo:
- seguire clienti
- creare programmi
- monitorare andamento
- mantenere relazione

---

# 5. Complete User Journey

## Primo accesso

Registrazione → onboarding → selezione obiettivi → generazione scheda iniziale → dashboard → primo allenamento

## Ciclo settimanale

Dashboard → allenamento → tracking → analytics → feedback → nuovo allenamento

---

# 6. Onboarding System

Profilo (nome, username, età, altezza, peso), obiettivo, livello, disponibilità, ambiente, motivazione (livelli 1–3). Output: generazione programma iniziale.

---

# 7. Dashboard Utente

Widget: allenamento, progressi, obiettivi, record, comunicazioni coach.

---

# 8. Training Program Engine

Programma (nome, descrizione, obiettivo, durata, autore), giorni A–D, esercizi (serie, reps, peso, recupero, RPE, RIR, note).

---

# 9. Progression Engine

Progressione lineare, doppia, volume, intensità. Versionamento automatico.

---

# 10. Workout Execution

1–2 tap per serie; modifica peso/reps; complete/skip/sostituzione; recovery timer; note private e coach.

---

# 11. Free Workouts

Allenamenti senza scheda (viaggio, test, libero).

---

# 12. Exercise Library

Nome, descrizione, categoria, muscoli, attrezzatura; esercizi custom.

---

# 13. History System

Data, durata, scheda, risultati, note; ricerca avanzata.

---

# 14. Progress Intelligence

e1RM, volume, costanza, plateau detection.

---

# 15. Goal System

Forza, peso corporeo, frequenza, volume.

---

# 16. Motivation System

Livelli 1–3, achievement, streak, Progress Score.

---

# 17. Coach Platform

Dashboard: clienti, lead, revisioni, notifiche. Filtri clienti.

---

# 18. Coach CRM

Lead management, pipeline, activity log.

---

# 19. Coach-Client Relationship

Username, QR, link. Multi-coach.

---

# 20. Messaging System

Testo V1; notifiche, cronologia, ricerca.

---

# 21. Coach Automation Engine

Alert inattività/stallo/aderenza; reminder; suggerimenti.

---

# 22. Notification Center

Workout, progressi, PR, obiettivi, coach, sistema.

---

# 23. UX Specifications

Mobile: zero attrito, 1–2 tap/serie. Desktop: coach, analytics, pianificazione.

---

# 24. Data Model

User, Coach, Client, Lead, Program, ProgramVersion, WorkoutDay, Exercise, WorkoutSession, ExerciseExecution, Goal, Message, Notification, PersonalRecord.

> **Expanded in** [OneMore_Data_Model.md](docs/prd/OneMore_Data_Model.md).

---

# 25. Security

GDPR, audit log, versioning, backup.

> **Expanded in** [OneMore_RBAC_Privacy.md](docs/prd/OneMore_RBAC_Privacy.md).

---

# 26. KPI Framework

DAU/WAU/MAU, retention; coach clienti/schede; onboarding completion, time to first workout.

> **Expanded in** [OneMore_Analytics_Events.md](docs/prd/OneMore_Analytics_Events.md).

---

# 27. MVP Scope

> **Superseded by** [OneMore_MVP_MoSCoW.md](docs/prd/OneMore_MVP_MoSCoW.md).

---

# 28. Future Roadmap

V2: check-in, foto, allegati. V3: smartwatch, salute. V4: marketplace.

---

Fine documento.
