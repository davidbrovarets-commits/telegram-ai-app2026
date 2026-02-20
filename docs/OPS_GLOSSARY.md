# OPS Glossary

This document explains technical terms, infrastructure concepts, and operations standards used across the project docs and scripts.

---

## 1. Core Architecture & Workflow Terms

**SSOT (Single Source of Truth)**
Üks ja ainus koht, kus "tõde" elab (nt andmebaas või konkreetne repositooriumi fail). Kõik teised komponendid, mudelid ja scriptid peavad lugema infot sealt, mitte looma dubleerivaid definitsioone.

**Edge Function vs RPC**
- **Edge Function:** Serverita (serverless) funktsioon, mis on deploiritud globaalselt Edge'i peale (Supabase `supabase/functions/` kataloog). Näiteks `serve-feed`. Need on eraldi TypeScripti skriptid, mis käituvad API-otspunktidena.
- **RPC (Remote Procedure Call):** Andmebaasi sisene salvestatud protseduur (stored procedure), mida saab Supabase API kaudu välja kutsuda. See elab otse PostgreSQL andmebaasis, mitte TypeScripti pildis.

**Mermaid vs ASCII (Diagrammid)**
- **Mermaid:** Markdown diagrammide süntaks, mis genereerib automaatselt visuaalseid jooniseid piltidena toetatud brauserites ja tööriistades (nagu GitHub). Suurepärane kiireks arhitektuuri ülevaateks.
- **ASCII:** Lihttekstis loodud joonis. Ei sõltu ühestki renderdamismootorist ja on alati "toorena" otse-loetav mistahes terminalis või lihtsas tekstiredaktoris.

**1 View vs 2 Views (Arhitektuuri dokumentatsioon)**
- **1 View (Executive View):** Kõrgetasemeline joonis. Näitab ainult suuri komponente (Andmebaas, Kasutaja, Tehisintellekt) ja nendevahelisi põhiseoseid. Fookuses on äri- või protsessiloogika.
- **2 Views (Technical View):** Detailne joonis, mis näitab spetsiifilisi tabeleid, faile, skripte, Edge Funktsioone ja andmekoormust (payload). Fookuses on tehniline implementatsioon ja sisenemispunktid.

---

## 2. Evidence (Tõendite) Terminid

**Commit SHA**
Git'i unikaalne identifikaator iga "salvestamise" (commit'i) jaoks. See on matemaatiline tõestus, et muudatus eksisteerib koodibaasis. Evidence standards nõuab *alati* muudatuse tõendamisel Commit SHA esitamist.

**Workflow `run_id`**
GitHub Actions automatiseeritud käivituse (run'i) identifikaator. Kui koodimudatus lükati üles ja see käivitas CI (testimise) või automaatse deploymenti serverisse, on `run_id` tõestuseks, et testid läbisid edukalt ja muudatus jõudis produktsiooni.
