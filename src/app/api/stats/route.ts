import { NextResponse } from 'next/server';

// Date H2H din fotografii - actualizează aici când ai noi dueluri finalizate
// NOTĂ: Pentru a adăuga dueluri noi, adaugă obiecte în acest array
const H2H_HISTORICAL_DATA = [
  {
    challenger: "Cezar",
    challenged: "Tone Andrei",
    winner: "Cezar",
    challengerScore: 5,
    challengedScore: 4,
    challengerOdds: 7.80,
    challengedOdds: 6.99,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "mihai94",
    challengerScore: 5,
    challengedScore: 5,
    challengerOdds: 11.57,
    challengedOdds: 7.80,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
  {
    challenger: "Tony",
    challenged: "Tone Andrei",
    winner: "Tone Andrei",
    challengerScore: 4,
    challengedScore: 4,
    challengerOdds: 4.67,
    challengedOdds: 6.99,
    matchDate: "2025-10-09",
    completedAt: "2025-10-09"
  },
  {
    challenger: "Tony",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 3,
    challengedScore: 5,
    challengerOdds: 3.20,
    challengedOdds: 8.80,
    matchDate: "2025-10-10",
    completedAt: "2025-10-10"
  },
  {
    challenger: "Cezar",
    challenged: "Tone Andrei",
    winner: "Tone Andrei",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 5.67,
    challengedOdds: 8.40,
    matchDate: "2025-10-10",
    completedAt: "2025-10-10"
  },
  {
    challenger: "Cezar",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 5.67,
    challengedOdds: 8.80,
    matchDate: "2025-10-10",
    completedAt: "2025-10-10"
  },
  {
    challenger: "Cezar",
    challenged: "mihai94",
    winner: "Egalitate",
    challengerScore: 6,
    challengedScore: 6,
    challengerOdds: 7.29,
    challengedOdds: 7.29,
    matchDate: "2025-10-11",
    completedAt: "2025-10-11"
  },
  {
    challenger: "Dew",
    challenged: "Cezar",
    winner: "Dew",
    challengerScore: 7,
    challengedScore: 5,
    challengerOdds: 15.04,
    challengedOdds: 6.31,
    matchDate: "2025-10-12",
    completedAt: "2025-10-12"
  },
  {
    challenger: "Cezar",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 7.52,
    challengedOdds: 10.87,
    matchDate: "2025-10-13",
    completedAt: "2025-10-13"
  },
  {
    challenger: "Tony",
    challenged: "Tone Andrei",
    winner: "Tone Andrei",
    challengerScore: 1,
    challengedScore: 2,
    challengerOdds: 2.49,
    challengedOdds: 5.81,
    matchDate: "2025-10-17",
    completedAt: "2025-10-17"
  },
  {
    challenger: "mihai94",
    challenged: "Tony",
    winner: "mihai94",
    challengerScore: 1,
    challengedScore: 1,
    challengerOdds: 3.32,
    challengedOdds: 2.49,
    matchDate: "2025-10-17",
    completedAt: "2025-10-17"
  },
  {
    challenger: "mihai94",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 1,
    challengedScore: 2,
    challengerOdds: 3.32,
    challengedOdds: 5.81,
    matchDate: "2025-10-17",
    completedAt: "2025-10-17"
  },
  {
    challenger: "Tony",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 1,
    challengedScore: 2,
    challengerOdds: 2.49,
    challengedOdds: 5.81,
    matchDate: "2025-10-17",
    completedAt: "2025-10-17"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Cezar",
    winner: "Tone Andrei",
    challengerScore: 2,
    challengedScore: 1,
    challengerOdds: 5.81,
    challengedOdds: 3.32,
    matchDate: "2025-10-17",
    completedAt: "2025-10-17"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 1,
    challengedScore: 1,
    challengerOdds: 2.49,
    challengedOdds: 3.32,
    matchDate: "2025-10-17",
    completedAt: "2025-10-17"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "Egalitate",
    challengerScore: 1,
    challengedScore: 1,
    challengerOdds: 3.32,
    challengedOdds: 3.32,
    matchDate: "2025-10-17",
    completedAt: "2025-10-17"
  },
  {
    challenger: "Cezar",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 1,
    challengedScore: 2,
    challengerOdds: 3.32,
    challengedOdds: 5.81,
    matchDate: "2025-10-17",
    completedAt: "2025-10-17"
  },
  {
    challenger: "Tony",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 11,
    challengedScore: 15,
    challengerOdds: 29.15,
    challengedOdds: 32.35,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "Tony",
    challenged: "Dew",
    winner: "Tony",
    challengerScore: 11,
    challengedScore: 14,
    challengerOdds: 29.15,
    challengedOdds: 27.77,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 12,
    challengedScore: 14,
    challengerOdds: 27.31,
    challengedOdds: 27.77,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Tony",
    winner: "Tony",
    challengerScore: 12,
    challengedScore: 11,
    challengerOdds: 27.31,
    challengedOdds: 29.15,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "Tone Andrei",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 12,
    challengedScore: 15,
    challengerOdds: 27.31,
    challengedOdds: 32.35,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 12,
    challengedScore: 16,
    challengerOdds: 27.31,
    challengedOdds: 35.50,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "mihai94",
    challenged: "Dew",
    winner: "mihai94",
    challengerScore: 15,
    challengedScore: 14,
    challengerOdds: 32.35,
    challengedOdds: 27.77,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "Cezar",
    challenged: "Dew",
    winner: "Cezar",
    challengerScore: 16,
    challengedScore: 14,
    challengerOdds: 35.50,
    challengedOdds: 27.77,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 15,
    challengedScore: 16,
    challengerOdds: 32.35,
    challengedOdds: 35.50,
    matchDate: "2025-10-18",
    completedAt: "2025-10-18"
  },
  {
    challenger: "Tony",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 9,
    challengedScore: 12,
    challengerOdds: 27.20,
    challengedOdds: 34.46,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "Tony",
    challenged: "Dew",
    winner: "Tony",
    challengerScore: 9,
    challengedScore: 6,
    challengerOdds: 27.20,
    challengedOdds: 12.78,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Tony",
    winner: "Tony",
    challengerScore: 10,
    challengedScore: 9,
    challengerOdds: 23.31,
    challengedOdds: 27.20,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "Tone Andrei",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 10,
    challengedScore: 12,
    challengerOdds: 23.31,
    challengedOdds: 34.46,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Dew",
    winner: "Tone Andrei",
    challengerScore: 10,
    challengedScore: 6,
    challengerOdds: 23.31,
    challengedOdds: 12.78,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 10,
    challengedScore: 10,
    challengerOdds: 23.31,
    challengedOdds: 24.69,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "mihai94",
    challenged: "Dew",
    winner: "mihai94",
    challengerScore: 12,
    challengedScore: 6,
    challengerOdds: 34.46,
    challengedOdds: 12.78,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "mihai94",
    challengerScore: 12,
    challengedScore: 10,
    challengerOdds: 34.46,
    challengedOdds: 24.69,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "Cezar",
    challenged: "Dew",
    winner: "Cezar",
    challengerScore: 10,
    challengedScore: 6,
    challengerOdds: 24.69,
    challengedOdds: 12.78,
    matchDate: "2025-10-19",
    completedAt: "2025-10-19"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Tony",
    winner: "Tone Andrei",
    challengerScore: 2,
    challengedScore: 0,
    challengerOdds: 6.33,
    challengedOdds: 0.00,
    matchDate: "2025-10-20",
    completedAt: "2025-10-20"
  },
  {
    challenger: "Tone Andrei",
    challenged: "mihai94",
    winner: "Egalitate",
    challengerScore: 2,
    challengedScore: 2,
    challengerOdds: 6.33,
    challengedOdds: 6.33,
    matchDate: "2025-10-20",
    completedAt: "2025-10-20"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Dew",
    winner: "Tone Andrei",
    challengerScore: 2,
    challengedScore: 1,
    challengerOdds: 6.33,
    challengedOdds: 2.83,
    matchDate: "2025-10-20",
    completedAt: "2025-10-20"
  },
  {
    challenger: "mihai94",
    challenged: "Dew",
    winner: "mihai94",
    challengerScore: 2,
    challengedScore: 1,
    challengerOdds: 6.33,
    challengedOdds: 2.83,
    matchDate: "2025-10-20",
    completedAt: "2025-10-20"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "mihai94",
    challengerScore: 2,
    challengedScore: 2,
    challengerOdds: 6.33,
    challengedOdds: 5.88,
    matchDate: "2025-10-20",
    completedAt: "2025-10-20"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "mihai94",
    challengerScore: 8,
    challengedScore: 5,
    challengerOdds: 14.55,
    challengedOdds: 8.17,
    matchDate: "2025-10-21",
    completedAt: "2025-10-21"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "mihai94",
    challengerScore: 7,
    challengedScore: 5,
    challengerOdds: 12.03,
    challengedOdds: 6.94,
    matchDate: "2025-10-22",
    completedAt: "2025-10-22"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "mihai94",
    challengerScore: 10,
    challengedScore: 6,
    challengerOdds: 22.11,
    challengedOdds: 11.03,
    matchDate: "2025-10-23",
    completedAt: "2025-10-23"
  },
  {
    challenger: "mihai94",
    challenged: "Tony",
    winner: "Tony",
    challengerScore: 10,
    challengedScore: 10,
    challengerOdds: 10.90,
    challengedOdds: 30.71,
    matchDate: "2025-10-25",
    completedAt: "2025-10-25"
  },
  {
    challenger: "mihai94",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 1,
    challengedScore: 3,
    challengerOdds: 3.05,
    challengedOdds: 11.04,
    matchDate: "2025-10-25",
    completedAt: "2025-10-25"
  },
  {
    challenger: "mihai94",
    challenged: "Tony",
    winner: "mihai94",
    challengerScore: 3,
    challengedScore: 2,
    challengerOdds: 5.68,
    challengedOdds: 3.44,
    matchDate: "2025-10-26",
    completedAt: "2025-10-26"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 2,
    challengedScore: 2,
    challengerOdds: 3.64,
    challengedOdds: 4.22,
    matchDate: "2025-10-26",
    completedAt: "2025-10-26"
  },
  {
    challenger: "mihai94",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 10,
    challengedScore: 11,
    challengerOdds: 20.18,
    challengedOdds: 25.34,
    matchDate: "2025-10-27",
    completedAt: "2025-10-27"
  },
  {
    challenger: "mihai94",
    challenged: "Tony",
    winner: "Tony",
    challengerScore: 10,
    challengedScore: 12,
    challengerOdds: 20.18,
    challengedOdds: 30.70,
    matchDate: "2025-10-27",
    completedAt: "2025-10-27"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Tony",
    challengerScore: 12,
    challengedScore: 11,
    challengerOdds: 30.70,
    challengedOdds: 23.42,
    matchDate: "2025-10-27",
    completedAt: "2025-10-27"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 10,
    challengedScore: 11,
    challengerOdds: 20.18,
    challengedOdds: 23.42,
    matchDate: "2025-10-27",
    completedAt: "2025-10-27"
  },
  {
    challenger: "mihai94",
    challenged: "Dew",
    winner: "mihai94",
    challengerScore: 10,
    challengedScore: 10,
    challengerOdds: 14.30,
    challengedOdds: 10.49,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Tony",
    challengerScore: 10,
    challengedScore: 10,
    challengerOdds: 20.71,
    challengedOdds: 17.46,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 10,
    challengedScore: 10,
    challengerOdds: 10.90,
    challengedOdds: 17.46,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "mihai94",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 1,
    challengedScore: 2,
    challengerOdds: 3.05,
    challengedOdds: 5.04,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Tony",
    challengerScore: 3,
    challengedScore: 4,
    challengerOdds: 11.04,
    challengedOdds: 10.22,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "Dew",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 2,
    challengedScore: 4,
    challengerOdds: 5.04,
    challengedOdds: 10.22,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 1,
    challengedScore: 4,
    challengerOdds: 3.05,
    challengedOdds: 10.22,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "mihai94",
    challenged: "Cezar",
    winner: "mihai94",
    challengerScore: 3,
    challengedScore: 2,
    challengerOdds: 5.68,
    challengedOdds: 4.22,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "Dew",
    challenged: "Tone Andrei",
    winner: "Dew",
    challengerScore: 2,
    challengedScore: 1,
    challengerOdds: 5.04,
    challengedOdds: 3.01,
    matchDate: "2025-10-28",
    completedAt: "2025-10-28"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Dew",
    winner: "Tone Andrei",
    challengerScore: 3,
    challengedScore: 2,
    challengerOdds: 6.18,
    challengedOdds: 3.85,
    matchDate: "2025-10-31",
    completedAt: "2025-10-31"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Tony",
    winner: "Tony",
    challengerScore: 2,
    challengedScore: 3,
    challengerOdds: 4.53,
    challengedOdds: 6.09,
    matchDate: "2025-11-03",
    completedAt: "2025-11-03"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Tony",
    winner: "Tone Andrei",
    challengerScore: 10,
    challengedScore: 6,
    challengerOdds: 23.61,
    challengedOdds: 12.58,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Tony",
    winner: "Tone Andrei",
    challengerScore: 13,
    challengedScore: 8,
    challengerOdds: 23.23,
    challengedOdds: 19.10,
    matchDate: "2025-11-01",
    completedAt: "2025-11-01"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Tony",
    winner: "Tone Andrei",
    challengerScore: 3,
    challengedScore: 1,
    challengerOdds: 6.18,
    challengedOdds: 1.70,
    matchDate: "2025-10-31",
    completedAt: "2025-10-31"
  },
  {
    challenger: "Dew",
    challenged: "Tone Andrei",
    winner: "Tone Andrei",
    challengerScore: 2,
    challengedScore: 3,
    challengerOdds: 3.85,
    challengedOdds: 6.18,
    matchDate: "2025-10-31",
    completedAt: "2025-10-31"
  },
  {
    challenger: "Dew",
    challenged: "Tony",
    winner: "Tony",
    challengerScore: 2,
    challengedScore: 3,
    challengerOdds: 3.07,
    challengedOdds: 6.09,
    matchDate: "2025-11-03",
    completedAt: "2025-11-03"
  },
  {
    challenger: "Dew",
    challenged: "Tony",
    winner: "Dew",
    challengerScore: 17,
    challengedScore: 8,
    challengerOdds: 34.31,
    challengedOdds: 19.10,
    matchDate: "2025-11-01",
    completedAt: "2025-11-01"
  },
  {
    challenger: "Dew",
    challenged: "Tony",
    winner: "Dew",
    challengerScore: 2,
    challengedScore: 1,
    challengerOdds: 3.85,
    challengedOdds: 1.70,
    matchDate: "2025-10-31",
    completedAt: "2025-10-31"
  },
  {
    challenger: "Tony",
    challenged: "Tone Andrei",
    winner: "Tone Andrei",
    challengerScore: 6,
    challengedScore: 10,
    challengerOdds: 12.58,
    challengedOdds: 23.61,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Tony",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 6,
    challengedScore: 9,
    challengerOdds: 12.58,
    challengedOdds: 15.82,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Tony",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 6,
    challengedScore: 11,
    challengerOdds: 12.58,
    challengedOdds: 20.74,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Tone Andrei",
    challenged: "mihai94",
    winner: "Tone Andrei",
    challengerScore: 3,
    challengedScore: 2,
    challengerOdds: 6.18,
    challengedOdds: 3.85,
    matchDate: "2025-10-31",
    completedAt: "2025-10-31"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Dew",
    winner: "Tone Andrei",
    challengerScore: 2,
    challengedScore: 2,
    challengerOdds: 4.53,
    challengedOdds: 3.07,
    matchDate: "2025-11-03",
    completedAt: "2025-11-03"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Dew",
    winner: "Tone Andrei",
    challengerScore: 10,
    challengedScore: 11,
    challengerOdds: 23.61,
    challengedOdds: 20.74,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Dew",
    winner: "Dew",
    challengerScore: 13,
    challengedScore: 17,
    challengerOdds: 23.23,
    challengedOdds: 34.31,
    matchDate: "2025-11-01",
    completedAt: "2025-11-01"
  },
  {
    challenger: "Dew",
    challenged: "Cezar",
    winner: "Egalitate",
    challengerScore: 2,
    challengedScore: 2,
    challengerOdds: 3.07,
    challengedOdds: 3.07,
    matchDate: "2025-11-03",
    completedAt: "2025-11-03"
  },
  {
    challenger: "Dew",
    challenged: "Cezar",
    winner: "Dew",
    challengerScore: 11,
    challengedScore: 10,
    challengerOdds: 20.74,
    challengedOdds: 17.53,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Dew",
    challenged: "Cezar",
    winner: "Dew",
    challengerScore: 17,
    challengedScore: 16,
    challengerOdds: 34.31,
    challengedOdds: 30.52,
    matchDate: "2025-11-01",
    completedAt: "2025-11-01"
  },
  {
    challenger: "Dew",
    challenged: "Cezar",
    winner: "Dew",
    challengerScore: 2,
    challengedScore: 1,
    challengerOdds: 3.85,
    challengedOdds: 1.70,
    matchDate: "2025-10-31",
    completedAt: "2025-10-31"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 6,
    challengedScore: 10,
    challengerOdds: 12.58,
    challengedOdds: 17.53,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Tone Andrei",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 2,
    challengedScore: 5,
    challengerOdds: 4.53,
    challengedOdds: 12.20,
    matchDate: "2025-11-03",
    completedAt: "2025-11-03"
  },
  {
    challenger: "Tone Andrei",
    challenged: "mihai94",
    winner: "Tone Andrei",
    challengerScore: 10,
    challengedScore: 9,
    challengerOdds: 23.61,
    challengedOdds: 15.82,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Tone Andrei",
    challenged: "mihai94",
    winner: "mihai94",
    challengerScore: 13,
    challengedScore: 15,
    challengerOdds: 23.23,
    challengedOdds: 26.00,
    matchDate: "2025-11-01",
    completedAt: "2025-11-01"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Cezar",
    winner: "Tone Andrei",
    challengerScore: 2,
    challengedScore: 2,
    challengerOdds: 4.53,
    challengedOdds: 3.07,
    matchDate: "2025-11-03",
    completedAt: "2025-11-03"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Cezar",
    winner: "Tone Andrei",
    challengerScore: 10,
    challengedScore: 10,
    challengerOdds: 23.61,
    challengedOdds: 17.53,
    matchDate: "2025-11-02",
    completedAt: "2025-11-02"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 13,
    challengedScore: 16,
    challengerOdds: 23.23,
    challengedOdds: 30.52,
    matchDate: "2025-11-01",
    completedAt: "2025-11-01"
  },
  {
    challenger: "Tone Andrei",
    challenged: "Cezar",
    winner: "Tone Andrei",
    challengerScore: 3,
    challengedScore: 1,
    challengerOdds: 6.18,
    challengedOdds: 1.70,
    matchDate: "2025-10-31",
    completedAt: "2025-10-31"
  },
  {
    challenger: "Tony",
    challenged: "mihai94",
    winner: "Tony",
    challengerScore: 4,
    challengedScore: 4,
    challengerOdds: 10.62,
    challengedOdds: 7.01,
    matchDate: "2025-11-04",
    completedAt: "2025-11-04"
  },
  {
    challenger: "Tony",
    challenged: "Tone Andrei",
    winner: "Tony",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 10.62,
    challengedOdds: 10.23,
    matchDate: "2025-11-04",
    completedAt: "2025-11-04"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Cezar",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 10.62,
    challengedOdds: 11.89,
    matchDate: "2025-11-04",
    completedAt: "2025-11-04"
  },
  {
    challenger: "Tony",
    challenged: "Dew",
    winner: "Tony",
    challengerScore: 4,
    challengedScore: 5,
    challengerOdds: 10.62,
    challengedOdds: 10.23,
    matchDate: "2025-11-04",
    completedAt: "2025-11-04"
  },
  {
    challenger: "Tony",
    challenged: "Dew",
    winner: "Tony",
    challengerScore: 5,
    challengedScore: 4,
    challengerOdds: 18.31,
    challengedOdds: 6.09,
    matchDate: "2025-11-05",
    completedAt: "2025-11-05"
  },
  {
    challenger: "Tony",
    challenged: "Tone Andrei",
    winner: "Tone Andrei",
    challengerScore: 5,
    challengedScore: 5,
    challengerOdds: 18.31,
    challengedOdds: 19.27,
    matchDate: "2025-11-05",
    completedAt: "2025-11-05"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Tony",
    challengerScore: 5,
    challengedScore: 3,
    challengerOdds: 18.31,
    challengedOdds: 4.00,
    matchDate: "2025-11-05",
    completedAt: "2025-11-05"
  },
  {
    challenger: "Tony",
    challenged: "mihai94",
    winner: "Tony",
    challengerScore: 5,
    challengedScore: 3,
    challengerOdds: 18.31,
    challengedOdds: 4.00,
    matchDate: "2025-11-05",
    completedAt: "2025-11-05"
  },
  {
    challenger: "Tony",
    challenged: "Dew",
    winner: "Tony",
    challengerScore: 8,
    challengedScore: 9,
    challengerOdds: 18.41,
    challengedOdds: 17.40,
    matchDate: "2025-11-06",
    completedAt: "2025-11-06"
  },
  {
    challenger: "Tony",
    challenged: "Tone Andrei",
    winner: "Tony",
    challengerScore: 8,
    challengedScore: 8,
    challengerOdds: 18.41,
    challengedOdds: 14.74,
    matchDate: "2025-11-06",
    completedAt: "2025-11-06"
  },
  {
    challenger: "Tony",
    challenged: "Cezar",
    winner: "Tony",
    challengerScore: 8,
    challengedScore: 7,
    challengerOdds: 18.41,
    challengedOdds: 13.20,
    matchDate: "2025-11-06",
    completedAt: "2025-11-06"
  },
  {
    challenger: "Tony",
    challenged: "mihai94",
    winner: "Tony",
    challengerScore: 8,
    challengedScore: 7,
    challengerOdds: 18.41,
    challengedOdds: 11.73,
    matchDate: "2025-11-06",
    completedAt: "2025-11-06"
  }
];

// Date exacte din fotografiile clasamentelor
// NOTĂ: Pentru a adăuga o nouă săptămână, doar adaugă un nou obiect în HISTORICAL_DATA
const HISTORICAL_DATA = {
  week1: {
    name: "Săptămâna 1 (Sep 16-22)",
    totalMatches: 18,
    players: {
      "Tony": { rank: 1, points: 24.38, odds: 42.49, correct: 11, accuracy: 61, total: 18 },
      "mihai94": { rank: 2, points: 24.04, odds: 49.76, correct: 10, accuracy: 56, total: 18 },
      "Tone Andrei": { rank: 3, points: 21.33, odds: 52.89, correct: 8, accuracy: 44, total: 18 },
      "Cezar": { rank: 4, points: 17.71, odds: 43.70, correct: 8, accuracy: 44, total: 18 },
      "Dew": { rank: 5, points: 15.86, odds: 48.86, correct: 7, accuracy: 39, total: 18 },
      "Flo": { rank: 6, points: 9.09, odds: 55.28, correct: 4, accuracy: 22, total: 18 }
    }
  },
  week2: {
    name: "Săptămâna 2 (Sep 23-29)",
    totalMatches: 56,
    players: {
      "Tone Andrei": { rank: 1, points: 60.72, odds: 202.22, correct: 19, accuracy: 34, total: 56 },
      "mihai94": { rank: 2, points: 51.95, odds: 140.72, correct: 23, accuracy: 41, total: 56 },
      "Tony": { rank: 3, points: 51.17, odds: 155.06, correct: 20, accuracy: 39, total: 56 },
      "Dew": { rank: 4, points: 47.49, odds: 131.48, correct: 22, accuracy: 39, total: 56 },
      "Cezar": { rank: 5, points: 44.34, odds: 159.92, correct: 18, accuracy: 32, total: 56 }
    }
  },
  week3: {
    name: "Săptămâna 3 (Sep 30 - Oct 2)",
    totalMatches: 36, // Numărul total de meciuri din săptămâna 3
    players: {
      "Dew": { rank: 1, points: 46.87, odds: 81.17, correct: 21, accuracy: 58, total: 36 },
      "Tony": { rank: 2, points: 42.57, odds: 115.21, correct: 17, accuracy: 47, total: 36 },
      "Tone Andrei": { rank: 3, points: 37.53, odds: 129.58, correct: 14, accuracy: 39, total: 36 },
      "mihai94": { rank: 4, points: 36.90, odds: 88.14, correct: 18, accuracy: 50, total: 36 },
      "Cezar": { rank: 5, points: 31.20, odds: 79.98, correct: 18, accuracy: 50, total: 36 },
      "Flo": { rank: 6, points: 30.93, odds: 99.98, correct: 16, accuracy: 44, total: 36 }
    }
  },
  week4: {
    name: "Săptămâna 4 (Oct 3-6)",
    totalMatches: 56,
    players: {
      "Cezar": { rank: 1, points: 54.63, odds: 153.26, correct: 24, accuracy: 43, total: 56 },
      "Tone Andrei": { rank: 2, points: 52.07, odds: 156.59, correct: 24, accuracy: 43, total: 56 },
      "Tony": { rank: 3, points: 47.30, odds: 214.05, correct: 14, accuracy: 25, total: 56 },
      "Dew": { rank: 4, points: 43.48, odds: 128.91, correct: 24, accuracy: 43, total: 56 },
      "mihai94": { rank: 5, points: 43.19, odds: 136.74, correct: 23, accuracy: 41, total: 56 }
    }
  },
  week5: {
    name: "Săptămâna 5 (Oct 7-13)",
    totalMatches: 48,
    players: {
      "Flo": { rank: 1, points: 66.47, odds: 110.18, correct: 34, accuracy: 71, total: 48 },
      "Tone Andrei": { rank: 2, points: 61.91, odds: 97.53, correct: 33, accuracy: 69, total: 48 },
      "mihai94": { rank: 3, points: 55.64, odds: 89.94, correct: 33, accuracy: 69, total: 48 },
      "Dew": { rank: 4, points: 50.09, odds: 81.99, correct: 32, accuracy: 67, total: 48 },
      "Cezar": { rank: 5, points: 47.71, odds: 87.18, correct: 31, accuracy: 65, total: 48 },
      "Tony": { rank: 6, points: 40.57, odds: 87.86, correct: 29, accuracy: 60, total: 48 }
    }
  },
  week6: {
    name: "Săptămâna 6 (Oct 17-21)",
    totalMatches: 56,
    players: {
      "mihai94": { rank: 1, points: 76.46, odds: 146.81, correct: 30, accuracy: 54, total: 56 },
      "Cezar": { rank: 2, points: 69.39, odds: 135.00, correct: 29, accuracy: 52, total: 56 },
      "Tone Andrei": { rank: 3, points: 62.76, odds: 153.38, correct: 26, accuracy: 46, total: 56 },
      "Flo": { rank: 4, points: 60.68, odds: 148.05, correct: 25, accuracy: 45, total: 56 },
      "Tony": { rank: 5, points: 58.84, odds: 174.25, correct: 21, accuracy: 38, total: 56 },
      "Dew": { rank: 6, points: 49.19, odds: 142.52, correct: 23, accuracy: 41, total: 56 }
    }
  },
  week7: {
    name: "Săptămâna 7 (Oct 21-23)",
    totalMatches: 36,
    players: {
      "mihai94": { rank: 1, points: 48.69, odds: 78.21, correct: 25, accuracy: 69, total: 36 },
      "Dew": { rank: 2, points: 40.44, odds: 79.27, correct: 23, accuracy: 64, total: 36 },
      "Tone Andrei": { rank: 3, points: 40.13, odds: 83.07, correct: 21, accuracy: 58, total: 36 },
      "Flo": { rank: 4, points: 35.11, odds: 83.01, correct: 20, accuracy: 56, total: 36 },
      "Tony": { rank: 5, points: 29.41, odds: 101.55, correct: 16, accuracy: 44, total: 36 },
      "Cezar": { rank: 6, points: 28.14, odds: 90.80, correct: 16, accuracy: 44, total: 36 }
    }
  },
  week8: {
    name: "Săptămâna 8 (Oct 24-28)",
    totalMatches: 56,
    players: {
      "Tony": { rank: 1, points: 66.09, odds: 153.04, correct: 27, accuracy: 48, total: 56 },
      "Tone Andrei": { rank: 2, points: 57.99, odds: 141.49, correct: 26, accuracy: 46, total: 56 },
      "Cezar": { rank: 3, points: 55.32, odds: 139.16, correct: 27, accuracy: 48, total: 56 },
      "Dew": { rank: 4, points: 50.74, odds: 136.78, correct: 25, accuracy: 45, total: 56 },
      "mihai94": { rank: 5, points: 45.81, odds: 140.73, correct: 24, accuracy: 43, total: 56 }
    }
  },
  week9: {
    name: "Săptămâna 9 (Oct 31 - Nov 3)",
    totalMatches: 56,
    players: {
      "Dew": { rank: 1, points: 61.97, odds: 130.29, correct: 32, accuracy: 57, total: 56 },
      "mihai94": { rank: 2, points: 57.87, odds: 126.33, correct: 31, accuracy: 55, total: 56 },
      "Tone Andrei": { rank: 3, points: 57.55, odds: 149.53, correct: 28, accuracy: 50, total: 56 },
      "Flo": { rank: 4, points: 54.12, odds: 142.15, correct: 27, accuracy: 48, total: 56 },
      "Cezar": { rank: 5, points: 52.42, odds: 139.61, correct: 25, accuracy: 52, total: 56 },
      "Tony": { rank: 6, points: 39.47, odds: 176.99, correct: 18, accuracy: 32, total: 56 }
    }
  },
  week10: {
    name: "Săptămâna 10 (Nov 4-6)",
    totalMatches: 36,
    players: {
      "Tony": { rank: 1, points: 47.34, odds: 118.32, correct: 17, accuracy: 47, total: 36 },
      "Tone Andrei": { rank: 2, points: 44.24, odds: 91.06, correct: 18, accuracy: 50, total: 36 },
      "Dew": { rank: 3, points: 33.72, odds: 79.68, correct: 18, accuracy: 50, total: 36 },
      "Flo": { rank: 4, points: 33.29, odds: 82.22, correct: 17, accuracy: 47, total: 36 },
      "Cezar": { rank: 5, points: 29.89, odds: 86.87, correct: 15, accuracy: 42, total: 36 },
      "mihai94": { rank: 6, points: 22.74, odds: 81.96, correct: 14, accuracy: 39, total: 36 }
    }
  },
  week11: {
    name: "Săptămâna 11 (Nov 13-18)",
    totalMatches: 56,
    players: {
      "Cezar": { rank: 1, points: 73.24, odds: 161.28, correct: 27, accuracy: 48, total: 56 },
      "Tony": { rank: 2, points: 52.76, odds: 191.81, correct: 19, accuracy: 34, total: 56 },
      "Tone Andrei": { rank: 3, points: 49.21, odds: 151.42, correct: 22, accuracy: 39, total: 56 },
      "mihai94": { rank: 4, points: 47.46, odds: 134.14, correct: 24, accuracy: 43, total: 56 },
      "Dew": { rank: 5, points: 38.66, odds: 138.93, correct: 20, accuracy: 36, total: 56 }
    }
  },
  week12: {
    name: "Săptămâna 12 (Nov 20-25)",
    totalMatches: 56,
    players: {
      "Cezar": { rank: 1, points: 73.24, odds: 161.28, correct: 27, accuracy: 48, total: 56 },
      "Tony": { rank: 2, points: 52.76, odds: 191.81, correct: 19, accuracy: 34, total: 56 },
      "Tone Andrei": { rank: 3, points: 49.21, odds: 151.42, correct: 22, accuracy: 39, total: 56 },
      "mihai94": { rank: 4, points: 47.46, odds: 134.14, correct: 24, accuracy: 43, total: 56 },
      "Dew": { rank: 5, points: 38.66, odds: 138.93, correct: 20, accuracy: 36, total: 56 }
    }
  },
  week13: {
    name: "Săptămâna 13 (Nov 25-27)",
    totalMatches: 56,
    players: {
      "Tony": { rank: 1, points: 76.89, odds: 149.94, correct: 31, accuracy: 55, total: 56 },
      "Cezar": { rank: 2, points: 63.86, odds: 142.62, correct: 28, accuracy: 50, total: 56 },
      "mihai94": { rank: 3, points: 56.44, odds: 137.55, correct: 27, accuracy: 48, total: 56 },
      "Tone Andrei": { rank: 4, points: 55.91, odds: 134.32, correct: 27, accuracy: 48, total: 56 },
      "Flo": { rank: 5, points: 53.02, odds: 147.27, correct: 24, accuracy: 43, total: 56 },
      "Dew": { rank: 6, points: 52.59, odds: 142.12, correct: 24, accuracy: 43, total: 56 }
    }
  }
};

function calculatePlayerStats() {
  const players = ["Tony", "mihai94", "Tone Andrei", "Cezar", "Dew", "Flo"];
  const weeks = Object.keys(HISTORICAL_DATA);
  
  return players.map(playerName => {
    // Calculez câte săptămâni a jucat
    let weeksPlayed = 0;
    let totalPredictions = 0;
    let correctPredictions = 0;
    let totalPoints = 0;
    const weeklyRanks: number[] = [];
    
    // Iterez prin toate săptămânile din HISTORICAL_DATA
    weeks.forEach(weekKey => {
      const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
      const playerData = weekData.players[playerName as keyof typeof weekData.players];
      
      if (playerData) {
        weeksPlayed++;
        totalPredictions += playerData.total;
        correctPredictions += playerData.correct;
        totalPoints += playerData.points;
        weeklyRanks.push(playerData.rank);
      }
    });
    
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    const avgRank = weeklyRanks.length > 0 ? weeklyRanks.reduce((a, b) => a + b, 0) / weeklyRanks.length : 6;
    
    // Calculez streak-uri bazate pe performanță și săptămânile jucate
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Pentru ultima săptămână disponibilă
    const lastWeekKey = weeks[weeks.length - 1];
    const lastWeekData = HISTORICAL_DATA[lastWeekKey as keyof typeof HISTORICAL_DATA];
    const lastPlayerData = lastWeekData.players[playerName as keyof typeof lastWeekData.players];
    
    if (lastPlayerData && lastPlayerData.accuracy > 35) {
      currentStreak = Math.floor(lastPlayerData.accuracy / 10);
    }
    
    // Calculez cel mai lung streak din toate săptămânile
    weeks.forEach(weekKey => {
      const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
      const playerData = weekData.players[playerName as keyof typeof weekData.players];
      
      if (playerData && playerData.accuracy > 35) {
        longestStreak = Math.max(longestStreak, Math.floor(playerData.accuracy / 8));
      }
    });
    
    return {
      name: playerName,
      totalPredictions,
      correctPredictions,
      accuracy,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalPoints: Math.round(totalPoints * 100) / 100,
      favoriteOutcome: '1' as const, // Pentru simplitate
      averageReactions: Math.round((Math.random() * 2 + 1) * weeksPlayed * 10) / 10,
      boostsUsed: weeksPlayed,
      rank: 0, // Va fi calculat după
      avgRank,
      weeksPlayed
    };
  }).filter(player => player.totalPredictions > 0)
    .sort((a, b) => {
      // Sortez după puncte în primul rând, apoi după acuratețe
      if (Math.abs(a.totalPoints - b.totalPoints) < 0.1) {
        return b.accuracy - a.accuracy;
      }
      return b.totalPoints - a.totalPoints;
    })
    .map((player, index) => ({
      ...player,
      rank: index + 1
    }));
}

function calculateWeeklyStats() {
  const weeks = Object.keys(HISTORICAL_DATA);
  
  return weeks.map(weekKey => {
    const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
    
    return {
      week: weekData.name,
      totalMatches: weekData.totalMatches,
      players: Object.fromEntries(
        Object.entries(weekData.players).map(([name, data]) => [
          name,
          {
            correct: data.correct,
            total: data.total,
            accuracy: data.accuracy,
            points: data.points,
            rank: data.rank,
            boosts: Math.floor(Math.random() * 2), // Simulat
            reactions: Math.floor(Math.random() * 5) + 1 // Simulat
          }
        ])
      )
    };
  });
}

function calculateRealH2HStats() {
  try {
    // Use historical data instead of database
    const completedChallenges = H2H_HISTORICAL_DATA;
    
    if (completedChallenges.length === 0) {
      return { mostWins: undefined, mostPlayed: undefined, h2hData: [], playerH2HStats: {} };
    }
    
    // Count wins and total challenges per player
    const playerH2HStats: Record<string, { wins: number, total: number }> = {};
    
    completedChallenges.forEach(challenge => {
      const challengerName = challenge.challenger;
      const challengedName = challenge.challenged;
      
      // Initialize stats if not exists
      if (!playerH2HStats[challengerName]) {
        playerH2HStats[challengerName] = { wins: 0, total: 0 };
      }
      if (!playerH2HStats[challengedName]) {
        playerH2HStats[challengedName] = { wins: 0, total: 0 };
      }
      
      // Count total challenges
      playerH2HStats[challengerName].total++;
      playerH2HStats[challengedName].total++;
      
      // Count wins (skip egalitate)
      if (challenge.winner === challengerName) {
        playerH2HStats[challengerName].wins++;
      } else if (challenge.winner === challengedName) {
        playerH2HStats[challengedName].wins++;
      }
      // If winner is "Egalitate", no one gets a win
    });
    
    // Find player with most wins
    let mostWins = undefined;
    let maxWins = 0;
    Object.entries(playerH2HStats).forEach(([name, stats]) => {
      if (stats.wins > maxWins) {
        maxWins = stats.wins;
        mostWins = name;
      }
    });
    
    // Find player with most challenges played
    let mostPlayed = undefined;
    let maxPlayed = 0;
    Object.entries(playerH2HStats).forEach(([name, stats]) => {
      if (stats.total > maxPlayed) {
        maxPlayed = stats.total;
        mostPlayed = name;
      }
    });
    
    // H2H data is already in the correct format
    const h2hData = completedChallenges;
    
    return { 
      mostWins, 
      mostPlayed,
      h2hData,
      playerH2HStats
    };
  } catch (error) {
    console.error('Error calculating H2H stats:', error);
    return { mostWins: undefined, mostPlayed: undefined, h2hData: [], playerH2HStats: {} };
  }
}

function calculateOverallStats(playerStats: any[]) {
  const weeks = Object.keys(HISTORICAL_DATA);
  const totalPredictions = playerStats.reduce((sum, p) => sum + p.totalPredictions, 0);
  const totalCorrect = playerStats.reduce((sum, p) => sum + p.correctPredictions, 0);
  const averageAccuracy = totalPredictions > 0 ? (totalCorrect / totalPredictions) * 100 : 0;
  
  // Găsesc jucătorul cu cele mai multe predicții
  const mostActivePlayer = playerStats.reduce((max, p) => 
    p.totalPredictions > max.totalPredictions ? p : max
  ).name;
  
  // Găsesc jucătorul cu cele mai multe predicții corecte
  const mostCorrectPlayer = playerStats.reduce((max, p) => 
    p.correctPredictions > max.correctPredictions ? p : max
  ).name;
  
  // Găsesc jucătorul cu cea mai bună acuratețe
  const mostAccuratePlayer = playerStats.reduce((max, p) => 
    p.accuracy > max.accuracy ? p : max
  ).name;
  
  // Cea mai bună acuratețe săptămânală și jucătorul
  let bestWeeklyAccuracy = 0;
  let bestWeeklyPlayer = '';
  let bestWeeklyWeek = '';
  
  // Iterez prin toate săptămânile pentru a găsi cea mai bună acuratețe
  weeks.forEach(weekKey => {
    const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
    
    Object.entries(weekData.players).forEach(([name, data]) => {
      if (data.accuracy > bestWeeklyAccuracy) {
        bestWeeklyAccuracy = data.accuracy;
        bestWeeklyPlayer = name;
        bestWeeklyWeek = weekData.name;
      }
    });
  });
  
  // Calculez totalul de meciuri din toate săptămânile
  const totalMatches = weeks.reduce((sum, weekKey) => {
    const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
    return sum + weekData.totalMatches;
  }, 0);
  
  // Calculez câștigătorii săptămânali (rank 1 în fiecare săptămână)
  const weeklyWinners: Record<string, number> = {};
  weeks.forEach(weekKey => {
    const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
    const winner = Object.entries(weekData.players).find(([_, data]) => data.rank === 1);
    if (winner) {
      const winnerName = winner[0];
      weeklyWinners[winnerName] = (weeklyWinners[winnerName] || 0) + 1;
    }
  });
  
  // Găsesc câștigătorul ultimei săptămâni
  const lastWeekKey = weeks[weeks.length - 1];
  const lastWeekData = HISTORICAL_DATA[lastWeekKey as keyof typeof HISTORICAL_DATA];
  const lastWeekWinner = Object.entries(lastWeekData.players).find(([_, data]) => data.rank === 1);
  const lastWeekWinnerName = lastWeekWinner ? lastWeekWinner[0] : '';
  
  // Calculate H2H statistics from database
  const h2hStats = calculateRealH2HStats();
  const mostH2HWins = h2hStats.mostWins;
  const mostH2HPlayed = h2hStats.mostPlayed;
  
  return {
    totalWeeks: weeks.length,
    totalMatches,
    totalPredictions,
    averageAccuracy,
    mostActivePlayer,
    bestWeeklyAccuracy,
    bestWeeklyPlayer,
    bestWeeklyWeek,
    mostCorrectPlayer,
    mostAccuratePlayer,
    weeklyWinners,
    lastWeekWinnerName,
    mostH2HWins,
    mostH2HPlayed
  };
}

function calculateHeadToHead(playerStats: any[]) {
  const weeks = Object.keys(HISTORICAL_DATA);
  const headToHead = [];
  
  for (let i = 0; i < playerStats.length; i++) {
    for (let j = i + 1; j < playerStats.length; j++) {
      const p1 = playerStats[i];
      const p2 = playerStats[j];
      
      let p1Wins = 0;
      let p2Wins = 0;
      let draws = 0;
      
      // Compar performanțele săptămânale din toate săptămânile
      weeks.forEach(weekKey => {
        const weekData = HISTORICAL_DATA[weekKey as keyof typeof HISTORICAL_DATA];
        const p1Data = weekData.players[p1.name as keyof typeof weekData.players];
        const p2Data = weekData.players[p2.name as keyof typeof weekData.players];
        
        if (p1Data && p2Data) {
          if (p1Data.accuracy > p2Data.accuracy) p1Wins++;
          else if (p2Data.accuracy > p1Data.accuracy) p2Wins++;
          else draws++;
        }
      });
      
      headToHead.push({
        player1: p1.name,
        player2: p2.name,
        player1Wins: p1Wins,
        player2Wins: p2Wins,
        draws
      });
    }
  }
  
  return headToHead;
}

export async function GET() {
  try {
    const playerStats = calculatePlayerStats();
    const weeklyStats = calculateWeeklyStats();
    const overallStats = calculateOverallStats(playerStats);
    const headToHead = calculateHeadToHead(playerStats);
    const h2hRealStats = calculateRealH2HStats();
    
    return NextResponse.json({
      weeklyStats,
      playerStats,
      overallStats,
      headToHead,
      h2hChallenges: h2hRealStats.h2hData,
      h2hPlayerStats: h2hRealStats.playerH2HStats
    });
  } catch (error) {
    console.error('Eroare la calculul statisticilor:', error);
    return NextResponse.json(
      { error: 'Eroare la calculul statisticilor' },
      { status: 500 }
    );
  }
}
