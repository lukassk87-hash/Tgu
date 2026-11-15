window.Game = window.Game || {};

Game.SicknessManager = class SicknessManager {
  constructor(world, vm, economy) {
    this.world = world;
    this.vm = vm;
    this.economy = economy;

    this.FIRST_SICKNESS_DELAY_MS = 15 * 60 * 1000;   // 15 Minuten
    this.MIN_INTERVAL_MS = 1 * 60 * 1000;            // 1 Minute
    this.MAX_INTERVAL_MS = 10 * 60 * 1000;           // 10 Minuten

    this.TREATMENT_TIME_MS = 5000;
    this.FETCH_CARRY_AMOUNT = 3;

    this.nextSicknessAt = 0;
    this._started = false;
    this._lastUpdateTime = 0;
    this._firstSicknessPopupShown = false;

    this.globalQueue = [];
    this._sickSet = new Set();

    this.onSicknessOutbreak = null;
    this.onFirstSickWithoutAntibiotics = null;
    this.onTreatmentStart = null;
    this.onTreatmentComplete = null;
  }

  start(now) {
    if (this._started) return;
    this._started = true;
    this._lastUpdateTime = now;
    this.nextSicknessAt = now + this.FIRST_SICKNESS_DELAY_MS;
  }

  _scheduleNext(fromTime) {
    const rnd = this.MIN_INTERVAL_MS +
      Math.random() * (this.MAX_INTERVAL_MS - this.MIN_INTERVAL_MS);
    this.nextSicknessAt = fromTime + rnd;
  }

  update(now) {
    if (!this._started) return;
    if (this.world.castleId === null) return;

    this._lastUpdateTime = now;

    // 1) Neuer Krankheitsfall fällig?
    if (now >= this.nextSicknessAt) {
      const countToInfect = Math.floor(Math.random() * 5) + 1;
      const victims = this._pickSickVillagers(countToInfect);
      
      if (victims.length > 0) {
        for (const v of victims) {
          this._infect(v, now);
        }
      }
      
      this._scheduleNext(now);
    }

    // 2) Alle Arztpraxen abarbeiten
    if (this.world.arztpraxen && this.world.arztpraxen.length > 0) {
      for (let i = 0; i < this.world.arztpraxen.length; i++) {
        const b = this.world.arztpraxen[i];
        if (!b.built || b.ruined) continue;
        if (b.paused) continue;
        this._tickPraxis(b, now);
      }
    }
  }

  _pickSickVillagers(count) {
    const candidates = [];

    for (const v of this.vm.villagers.values()) {
      if (v.isSick) continue;
      if (v.job !== 'worker') continue;
      if (!v.workplaceId) continue;
      if (v.state !== 'working') continue;

      const b = this.world.buildings.get(v.workplaceId);
      if (!b) continue;
      if (!b.built || b.ruined) continue;
      if (b.def.immuneToSickness) continue;
      if (b.def.id === 'fireStation') continue;
      if (!b.def.sicknessPenalty) continue;

      candidates.push(v);
    }

    if (candidates.length === 0) return [];
    
    candidates.sort(() => Math.random() - 0.5);
    return candidates.slice(0, count);
  }

  _infect(v, now) {
    v.isSick = true;
    v._sickSince = now;
    v._treatmentTargetId = null;
    v._sickHealAt = 0;
    v._inSicknessTreatment = false; // Wartet noch auf Zuweisung

    this._sickSet.add(v.id);
    this.globalQueue.push(v.id);

    const hasAntibiotics =
      (this.economy.res.antibiotics || 0) > 0 ||
      this._anyPraxisHasAntibiotics();

    if (!this._firstSicknessPopupShown && !hasAntibiotics) {
      this._firstSicknessPopupShown = true;
      if (this.onFirstSickWithoutAntibiotics) {
        this.onFirstSickWithoutAntibiotics();
      }
    }

    if (this.onSicknessOutbreak) {
      this.onSicknessOutbreak(v);
    }
  }

  infectAll(now) {
    const infected = [];

    for (const v of this.vm.villagers.values()) {
      if (v.isSick) continue;
      if (v.state === 'dead') continue;

      if (v.workplaceId) {
        const b = this.world.buildings.get(v.workplaceId);
        if (b) {
          if (b.def.immuneToSickness) continue;
          if (b.def.id === 'fireStation') continue;
        }
      }

      if (v.job === 'free') continue;
      if (v.job === 'warrior') continue;
      if (v.reservedLogistics) continue;

      if (v.job === 'worker' && v.workplaceId) {
        const b = this.world.buildings.get(v.workplaceId);
        if (!b || b.ruined || !b.built) continue;
        if (!b.def.sicknessPenalty) continue;
      } else if (v.job === 'worker' && !v.workplaceId) {
        continue;
      } else {
        continue;
      }

      v.isSick = true;
      v._sickSince = now;
      v._treatmentTargetId = null;
      v._sickHealAt = 0;
      v._inSicknessTreatment = false;
      
      this._sickSet.add(v.id);
      this.globalQueue.push(v.id);

      infected.push(v);

      if (this.onSicknessOutbreak) {
        this.onSicknessOutbreak(v);
      }
    }

    return infected.length;
  }

  _anyPraxisHasAntibiotics() {
    if (!this.world.arztpraxen) return false;
    for (const b of this.world.arztpraxen) {
      if (!b.built || b.ruined) continue;
      if ((b.antibioticStorage || 0) > 0) return true;
    }
    return false;
  }

  _heal(v, praxisB, now) {
    v.isSick = false;
    v._sickSince = 0;
    v._sickHealAt = 0;
    v._treatmentTargetId = null;
    v._inSicknessTreatment = false; // Behandlung abgeschlossen
    v.state = 'working';
    v.task = null;
    v.hidden = true;

    this._sickSet.delete(v.id);
    this._removeFromGlobalQueue(v.id);

    this._scheduleNext(now);

    if (this.onTreatmentComplete) {
      this.onTreatmentComplete(v, praxisB);
    }
  }

  _removeFromGlobalQueue(villagerId) {
    const idx = this.globalQueue.indexOf(villagerId);
    if (idx !== -1) this.globalQueue.splice(idx, 1);
  }

  _tickPraxis(b, now) {
    // ── WENN EIN PATIENT DA IST ──────────────────────────────────────────
    if (b.currentPatient !== null) {
      if (b.treatmentEndsAt > 0 && now >= b.treatmentEndsAt) {
        const patient = this.vm.villagers.get(b.currentPatient);
        const pid = b.currentPatient;
        b.currentPatient = null;
        b.treatmentEndsAt = 0;

        if (patient && patient.isSick) {
          this._heal(patient, b, now);
        } else if (patient) {
          patient._treatmentTargetId = null;
          patient._inSicknessTreatment = false;
        }
      }
      return;
    }

    // ── WENN KEIN PATIENT DA IST: VORRAT AUFFÜLLEN ───────────────────────
    // Egal ob Warteschlange leer ist oder nicht, der Arzt füllt immer auf,
    // solange er nicht das Maximum erreicht hat.
    const maxAb = b.def.maxAntibioticStorage || 3;
    if ((b.antibioticStorage || 0) < maxAb) {
      this._requestAntibioticFetch(b, now);
    }

    if (this.globalQueue.length === 0) return;

    if ((b.antibioticStorage || 0) <= 0) {
      // Konnte nicht aufgefüllt werden (keine Antibiotika im Lager)
      return;
    }

    this._assignNextPatient(b, now);
  }

  _assignNextPatient(b, now) {
    while (this.globalQueue.length > 0) {
      const nextId = this.globalQueue[0];
      const patient = this.vm.villagers.get(nextId);

      if (!patient || !patient.isSick) {
        this.globalQueue.shift();
        this._sickSet.delete(nextId);
        continue;
      }

      if (patient.state === 'zfighting' ||
          patient.state === 'vfighting' ||
          patient.state === 'dragon_attack' ||
          patient.state === 'attacking_raiders' ||
          patient.state === 'vfightback' ||
          patient.state === 'vdefend') {
        return;
      }

      if (patient._treatmentTargetId !== null &&
          patient._treatmentTargetId !== b.id) {
        this.globalQueue.shift();
        continue;
      }

      this.globalQueue.shift();

      b.currentPatient = nextId;
      b.treatmentEndsAt = 0;
      
      patient._treatmentTargetId = b.id;
      
      patient.state = 'sick_walking_to_praxis';
      patient.task = 'sick_walking_to_praxis';
      patient.hidden = false;
      patient.asset = 'images/krank.webp';
      
      this.vm.startMove(patient, b.x, b.y + (b.h || 1) - 1);

      if (this.onTreatmentStart) {
        this.onTreatmentStart(patient, b);
      }
      return;
    }
  }

  onPatientArrived(v, praxisB) {
    if (!praxisB || !v) return;

    if ((praxisB.antibioticStorage || 0) <= 0) {
      praxisB.currentPatient = null;
      praxisB.treatmentEndsAt = 0;
      v._treatmentTargetId = null;
      v._inSicknessTreatment = false;
      if (!this.globalQueue.includes(v.id) && v.isSick) {
        this.globalQueue.unshift(v.id);
      }
      v.state = 'working';
      v.task = null;
      v.hidden = true;
      return;
    }

    praxisB.antibioticStorage -= 1;
    v.state = 'sick_treating';
    v.task = 'sick_treating';
    v.hidden = true;
    v._inSicknessTreatment = true;
    v._sickHealAt = performance.now() + this.TREATMENT_TIME_MS;

    praxisB.treatmentEndsAt = v._sickHealAt;
  }

  _requestAntibioticFetch(b, now) {
    if (b.fetchAntibioticWorkerId !== null) return;
    if (b.workerId === null) return;

    const doctor = this.vm.villagers.get(b.workerId);
    if (!doctor) return;
    if (doctor.state !== 'working') return;
    if (doctor.task) return;
    if (doctor.isSick) return;

    if ((this.economy.res.antibiotics || 0) <= 0) return;

    let best = null, bestDistSq = Infinity;
    for (const s of this.world.dropoffBuildings) {
      const bx = s.x, by = s.y + (s.h || 1) - 1;
      const dx = bx - doctor.x, dy = by - doctor.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
    }
    if (!best) return;

    b.fetchAntibioticWorkerId = doctor.id;
    doctor.task = 'fetch_antibiotics_storage';
    doctor.state = 'moving';
    doctor.workplaceId = b.id;
    this.vm.startMove(doctor, best.x, best.y + (best.h || 1) - 1);
  }

  takeAntibioticsFromStorage(praxisB) {
    if (!praxisB) return 0;
    const available = this.economy.res.antibiotics || 0;
    const space = (praxisB.def.maxAntibioticStorage || 3) - (praxisB.antibioticStorage || 0);
    const amount = Math.min(this.FETCH_CARRY_AMOUNT, space, available);
    if (amount <= 0) return 0;

    this.economy.res.antibiotics -= amount;
    if (this.economy.onChange) this.economy.onChange();
    return amount;
  }

  deliverAntibiotics(praxisB, amount) {
    if (!praxisB || amount <= 0) return;
    const max = praxisB.def.maxAntibioticStorage || 3;
    praxisB.antibioticStorage = Math.min(max, (praxisB.antibioticStorage || 0) + amount);
    praxisB.fetchAntibioticWorkerId = null;
  }

  onPraxisRemoved(praxisB) {
    if (!praxisB) return;

    if (praxisB.currentPatient !== null) {
      const pid = praxisB.currentPatient;
      const patient = this.vm.villagers.get(pid);

      if (patient && patient.isSick) {
        if (patient.state === 'sick_walking_to_praxis' ||
            patient.state === 'sick_treating' ||
            patient.state === 'sick_walking_back') {
          patient.state = 'working';
          patient.task = null;
          patient.hidden = true;
        }
        patient._treatmentTargetId = null;
        patient._sickHealAt = 0;
        patient._inSicknessTreatment = false;

        if (!this.globalQueue.includes(pid)) {
          this.globalQueue.unshift(pid);
        }
      }
      praxisB.currentPatient = null;
      praxisB.treatmentEndsAt = 0;
    }

    if (praxisB.fetchAntibioticWorkerId !== null) {
      const doc = this.vm.villagers.get(praxisB.fetchAntibioticWorkerId);
      if (doc) {
        if (doc.state === 'moving' &&
            (doc.task === 'fetch_antibiotics_storage' ||
             doc.task === 'fetch_antibiotics_return')) {
          doc.state = 'working';
          doc.task = null;
          doc.hidden = true;
          doc._fetchAntibioticsAmount = 0;
        }
      }
      praxisB.fetchAntibioticWorkerId = null;
    }
  }

  onVillagerRemoved(v) {
    if (!v) return;

    this._sickSet.delete(v.id);
    this._removeFromGlobalQueue(v.id);

    if (v._treatmentTargetId !== null) {
      const praxisB = this.world.buildings.get(v._treatmentTargetId);
      if (praxisB && praxisB.def.id === 'arztpraxis') {
        if (praxisB.currentPatient === v.id) {
          praxisB.currentPatient = null;
          praxisB.treatmentEndsAt = 0;
        }
        if (praxisB.fetchAntibioticWorkerId === v.id) {
          praxisB.fetchAntibioticWorkerId = null;
        }
      }
      v._treatmentTargetId = null;
    }
    v._inSicknessTreatment = false;
  }

  serialize(now) {
    // NEU: Wir zählen nur, wie viele Villager aktuell krank sind.
    let sickCount = 0;
    for (const v of this.vm.villagers.values()) {
      if (v.isSick) sickCount++;
    }

    return {
      started: this._started,
      nextSicknessAtRemaining: this.nextSicknessAt > 0 && this.nextSicknessAt !== Infinity
        ? Math.max(0, this.nextSicknessAt - now)
        : -1,
      firstSicknessPopupShown: this._firstSicknessPopupShown,
      sickCount: sickCount // Speichere nur die Anzahl
    };
  }

  restoreFromSave(data, now) {
    if (!data) {
      this._started = false;
      this._lastUpdateTime = now;
      this.nextSicknessAt = 0;
      this._firstSicknessPopupShown = false;
      this.globalQueue = [];
      this._sickSet.clear();
      return;
    }

    this._started = !!data.started;
    this._lastUpdateTime = now;

    if (data.nextSicknessAtRemaining === -1) {
      this.nextSicknessAt = Infinity;
    } else if (data.nextSicknessAtRemaining > 0) {
      this.nextSicknessAt = now + data.nextSicknessAtRemaining;
    } else {
      this.nextSicknessAt = 0;
    }

    this._firstSicknessPopupShown = !!data.firstSicknessPopupShown;

    this.globalQueue = [];
    this._sickSet.clear();

    // NEU: Anhand der gespeicherten Anzahl neu infizieren
    if (data.sickCount && data.sickCount > 0) {
      const candidates = [];
      for (const v of this.vm.villagers.values()) {
        if (v.state === 'dead') continue;
        if (v.job === 'free') continue;
        if (v.job === 'warrior') continue;
        if (v.reservedLogistics) continue;
        
        if (v.workplaceId) {
          const b = this.world.buildings.get(v.workplaceId);
          if (b && b.def.immuneToSickness) continue;
          if (b && b.def.id === 'fireStation') continue;
          if (b && !b.def.sicknessPenalty) continue;
        }
        candidates.push(v);
      }
      
      candidates.sort(() => Math.random() - 0.5);
      const toInfect = candidates.slice(0, Math.min(data.sickCount, candidates.length));
      
      for (const v of toInfect) {
        this._infect(v, now);
      }
    }
  }
};