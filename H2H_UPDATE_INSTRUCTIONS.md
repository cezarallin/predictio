# Instrucțiuni Actualizare Dueluri H2H

## 📸 Cum să adaugi dueluri noi din screenshot-uri

Deoarece utilizatorii sunt resetați săptămânal, datele H2H sunt stocate într-o constantă `H2H_HISTORICAL_DATA` în loc de baza de date.

### Locația fișierului:
```
src/app/api/stats/route.ts
```

### Pași pentru actualizare:

1. **Fă screenshot la duelurile H2H finalizate** (înainte de reset)

2. **Deschide fișierul** `src/app/api/stats/route.ts`

3. **Găsește secțiunea** `H2H_HISTORICAL_DATA` (liniile 3-39)

4. **Adaugă noile dueluri** la sfârșitul array-ului:

```typescript
const H2H_HISTORICAL_DATA = [
  // ... dueluri existente ...
  
  // ⬇️ ADAUGĂ AICI DUELURILE NOI ⬇️
  {
    challenger: "NumeJucator1",      // Jucătorul care a provocat
    challenged: "NumeJucator2",      // Jucătorul provocat
    winner: "NumeJucator2",          // Câștigătorul (sau "Egalitate")
    challengerScore: 4,              // Predicții corecte challenger
    challengedScore: 3,              // Predicții corecte challenged
    challengerOdds: 7.80,           // Total cote challenger
    challengedOdds: 37.77,          // Total cote challenged
    matchDate: "2025-10-16",        // Data meciurilor (YYYY-MM-DD)
    completedAt: "2025-10-16"       // Data finalizării
  },
];
```

### 📋 Template pentru copiere rapidă:

```typescript
  {
    challenger: "___",
    challenged: "___",
    winner: "___",
    challengerScore: _,
    challengedScore: _,
    challengerOdds: _.__, 
    challengedOdds: _.__,
    matchDate: "2025-__-__",
    completedAt: "2025-__-__"
  },
```

### ⚠️ Note importante:

- **Numele jucătorilor** trebuie să fie identice cu cele din `HISTORICAL_DATA` (Tony, Cezar, Dew, mihai94, Tone Andrei, Flo)
- **Winner** poate fi:
  - Numele unuia dintre cei doi jucători (cel cu cote mai mari)
  - `"Egalitate"` dacă cotele sunt egale
- **Virgula finală** este importantă (`,` la sfârșitul obiectului)
- **Format dată**: folosește format ISO (YYYY-MM-DD)

### 🎯 Ce calculează automat sistemul:

Odată ce adaugi datele, sistemul calculează automat:
- ⚔️ **Campion H2H** - cel cu cele mai multe victorii
- 🎮 **Cel Mai Activ H2H** - cel cu cele mai multe dueluri
- 🔥 **Dominare H2H** - dacă win rate >= 70%
- 🗡️ **Victorii H2H** - badge cu număr de victorii

### 📊 Exemplu complet din screenshot actual:

```typescript
const H2H_HISTORICAL_DATA = [
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 4,
    challengedScore: 3,
    challengerOdds: 7.80,
    challengedOdds: 37.77,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
  {
    challenger: "Dew",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 4,
    challengedScore: 3,
    challengerOdds: 7.80,
    challengedOdds: 37.77,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
  {
    challenger: "Tony",
    challenged: "Dew",
    winner: "Egalitate",
    challengerScore: 4,
    challengedScore: 4,
    challengerOdds: 7.80,
    challengedOdds: 7.80,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
];
```

### ✅ Verificare după actualizare:

După ce salvezi fișierul, verifică în pagina de Stats:
1. Badge-urile jucătorilor se actualizează automat
2. Secțiunea "Dueluri H2H Finalizate" afișează toate duelurile
3. "Bilanț Dueluri" afișează victoriile și win rate-ul fiecărui jucător

---

**💡 Tip:** Salvează screenshot-urile H2H într-un folder `screenshots/h2h/` pentru referință viitoare!


