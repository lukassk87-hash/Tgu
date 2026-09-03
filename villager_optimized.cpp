#include <emscripten.h>
#include <cmath>
#include <algorithm>
#include <cstdlib>
#include <cstring>

extern "C" {

// ============================================================
// 1. VILLAGER-BEWEGUNG (SPIELER 1)
// ============================================================
EMSCRIPTEN_KEEPALIVE
void moveVillagersBatch(
    float* x, float* y, 
    float* targetX, float* targetY,
    float* speeds,
    unsigned char* alive,
    int count,
    float dt
) {
    for (int i = 0; i < count; i++) {
        if (!alive[i]) continue;

        float dx = targetX[i] - x[i];
        float dy = targetY[i] - y[i];
        float dist = sqrt(dx*dx + dy*dy);

        if (dist < 1.0f) {
            x[i] = targetX[i];
            y[i] = targetY[i];
            continue;
        }

        float step = std::min(dist, speeds[i] * dt);
        x[i] += (dx / dist) * step;
        y[i] += (dy / dist) * step;
    }
}

// ============================================================
// 2. NPC VILLAGER BEWEGUNG
// ============================================================
EMSCRIPTEN_KEEPALIVE
void moveNpcVillagersBatch(
    float* x, float* y, 
    float* targetX, float* targetY,
    float* speeds,
    unsigned char* alive,
    int count,
    float dt
) {
    for (int i = 0; i < count; i++) {
        if (!alive[i]) continue;

        float dx = targetX[i] - x[i];
        float dy = targetY[i] - y[i];
        float dist = sqrt(dx*dx + dy*dy);

        if (dist < 1.0f) {
            x[i] = targetX[i];
            y[i] = targetY[i];
            continue;
        }

        float step = std::min(dist, speeds[i] * dt);
        x[i] += (dx / dist) * step;
        y[i] += (dy / dist) * step;
    }
}

// ============================================================
// 3. SPIELER 2 VILLAGER BEWEGUNG
// ============================================================
EMSCRIPTEN_KEEPALIVE
void movePlayer2VillagersBatch(
    float* x, float* y, 
    float* targetX, float* targetY,
    float* speeds,
    unsigned char* alive,
    int count,
    float dt
) {
    for (int i = 0; i < count; i++) {
        if (!alive[i]) continue;

        float dx = targetX[i] - x[i];
        float dy = targetY[i] - y[i];
        float dist = sqrt(dx*dx + dy*dy);

        if (dist < 1.0f) {
            x[i] = targetX[i];
            y[i] = targetY[i];
            continue;
        }

        float step = std::min(dist, speeds[i] * dt);
        x[i] += (dx / dist) * step;
        y[i] += (dy / dist) * step;
    }
}

// ============================================================
// 4. NPC VILLAGER HARVEST UPDATE
// ============================================================
EMSCRIPTEN_KEEPALIVE
void updateNpcHarvestBatch(
    float* villagerX, float* villagerY,
    float* targetX, float* targetY,
    float* harvestProgress,
    unsigned char* isHarvesting,
    unsigned char* alive,
    int count,
    float dt
) {
    for (int i = 0; i < count; i++) {
        if (!alive[i]) continue;
        if (!isHarvesting[i]) continue;

        float dx = targetX[i] - villagerX[i];
        float dy = targetY[i] - villagerY[i];
        float dist = sqrt(dx*dx + dy*dy);

        if (dist < 3.0f) {
            harvestProgress[i] += dt;
            if (harvestProgress[i] >= 0.25f) {
                harvestProgress[i] = 0.0f;
                isHarvesting[i] = 0;
            }
        } else {
            float speed = 70.0f;
            float step = std::min(dist, speed * dt);
            villagerX[i] += (dx / dist) * step;
            villagerY[i] += (dy / dist) * step;
        }
    }
}

// ============================================================
// 5. SPIELER 2 VILLAGER HARVEST UPDATE
// ============================================================
EMSCRIPTEN_KEEPALIVE
void updatePlayer2HarvestBatch(
    float* villagerX, float* villagerY,
    float* targetX, float* targetY,
    float* harvestProgress,
    unsigned char* isHarvesting,
    unsigned char* alive,
    int count,
    float dt
) {
    for (int i = 0; i < count; i++) {
        if (!alive[i]) continue;
        if (!isHarvesting[i]) continue;

        float dx = targetX[i] - villagerX[i];
        float dy = targetY[i] - villagerY[i];
        float dist = sqrt(dx*dx + dy*dy);

        if (dist < 3.0f) {
            harvestProgress[i] += dt;
            if (harvestProgress[i] >= 0.25f) {
                harvestProgress[i] = 0.0f;
                isHarvesting[i] = 0;
            }
        } else {
            float speed = 65.0f;
            float step = std::min(dist, speed * dt);
            villagerX[i] += (dx / dist) * step;
            villagerY[i] += (dy / dist) * step;
        }
    }
}

// ============================================================
// 6. KAMPF
// ============================================================
EMSCRIPTEN_KEEPALIVE
int findNearestEnemy(
    float queryX, float queryY,
    float* enemyX, float* enemyY,
    unsigned char* enemyAlive,
    int* enemyTeams,
    int myTeam,
    int count,
    float maxRange
) {
    float bestDist = maxRange * maxRange;
    int bestIndex = -1;

    for (int i = 0; i < count; i++) {
        if (!enemyAlive[i]) continue;
        if (enemyTeams[i] == myTeam) continue;

        float dx = enemyX[i] - queryX;
        float dy = enemyY[i] - queryY;
        float d2 = dx*dx + dy*dy;

        if (d2 < bestDist) {
            bestDist = d2;
            bestIndex = i;
        }
    }
    return bestIndex;
}

EMSCRIPTEN_KEEPALIVE
void updateCombatBatch(
    float* attackerX, float* attackerY,
    unsigned char* attackerAlive,
    int* attackerTeams,
    float* attackerCooldowns,
    int attackerCount,
    float* targetX, float* targetY,
    unsigned char* targetAlive,
    int* targetTeams,
    int targetCount,
    float range,
    float dt
) {
    float rangeSq = range * range;

    for (int i = 0; i < attackerCount; i++) {
        if (!attackerAlive[i]) continue;

        attackerCooldowns[i] -= dt;
        if (attackerCooldowns[i] > 0) continue;

        float bestDist = rangeSq;
        int bestIndex = -1;

        for (int j = 0; j < targetCount; j++) {
            if (!targetAlive[j]) continue;
            if (targetTeams[j] == attackerTeams[i]) continue;

            float dx = targetX[j] - attackerX[i];
            float dy = targetY[j] - attackerY[i];
            float d2 = dx*dx + dy*dy;

            if (d2 < bestDist) {
                bestDist = d2;
                bestIndex = j;
            }
        }

        if (bestIndex != -1) {
            if (rand() % 2 == 0) {
                targetAlive[bestIndex] = 0;
            }
            attackerCooldowns[i] = 2.0f;
        }
    }
}

// ============================================================
// 7. NPC BAUENTSCHEIDUNG (MIT GRENZE!)
// ============================================================
EMSCRIPTEN_KEEPALIVE
int npcBuildDecision(
    float grain, float wood, float stone, float fish,
    int houses, int lagers, int farms, int woodcutters, 
    int stonemasons, int towers, int fischer,
    int population,
    float lagerCooldown,
    int* outType,    // 0=nix, 1=haus, 2=lager, 3=bauer, 4=holz, 5=stein, 6=turm, 7=fischer, 8=grenze
    int* outPriority
) {
    int targetFarms = std::max(2, (int)(houses * 0.5f));
    int targetWood = std::max(2, (int)(houses * 1.0f));
    int targetStone = std::max(1, (int)(houses * 1.0f));
    int targetTowers = std::max(1, (int)(houses * 3.0f));
    int targetLagers = std::max(1, (int)(houses * 0.3f));
    int targetFischer = (int)(houses * 1.5f);

    int bestType = 0;
    int bestPriority = 0;

    // ===== KANN ÜBERHAUPT GEBAUT WERDEN? =====
    if (population < 2 && (woodcutters < targetWood || stonemasons < targetStone)) {
        *outType = 0;
        *outPriority = 0;
        return 0;
    }

    // ============================================================
    // 🔥 GRENZE (NEU - HÖCHSTE PRIORITÄT BEI 30+ HÄUSERN)
    // ============================================================
    if (houses > 30 && population >= 6) {
        bestType = 8;
        bestPriority = 110;  // Höchste Priorität!
    }

    // ============================================================
    // ANDERE GEBÄUDE (niedrigere Priorität)
    // ============================================================

    // ===== FISCHERHÜTTE =====
    if (fischer < targetFischer && wood >= 5 && stone >= 5) {
        if (50 > bestPriority) {
            bestType = 7;
            bestPriority = 50;
        }
    }

    // ===== LAGER =====
    if (lagers < targetLagers && wood >= 10 && stone >= 10 && lagerCooldown <= 0) {
        if (80 > bestPriority) {
            bestType = 2;
            bestPriority = 80;
        }
    }

    // ===== TÜRME =====
    if (towers < targetTowers && wood >= 15) {
        if (90 > bestPriority) {
            bestType = 6;
            bestPriority = 90;
        }
    }

    // ===== STEINMETZ =====
    if (stonemasons < targetStone && wood >= 5 && population >= 2) {
        if (96 > bestPriority) {
            bestType = 5;
            bestPriority = 96;
        }
    }

    // ===== HOLZFÄLLER =====
    if (woodcutters < targetWood && population >= 2) {
        if (92 > bestPriority) {
            bestType = 4;
            bestPriority = 92;
        }
    }

    // ===== BAUER =====
    if (farms < targetFarms && wood >= 5) {
        if (95 > bestPriority) {
            bestType = 3;
            bestPriority = 95;
        }
    }

    // ===== HAUS =====
    if (farms >= targetFarms && wood >= 3 && grain >= 5) {
        if (85 > bestPriority) {
            bestType = 1;
            bestPriority = 85;
        }
    }

    *outType = bestType;
    *outPriority = bestPriority;
    return (bestType != 0) ? 1 : 0;
}

// ============================================================
// 8. NPC WIRTSCHAFT
// ============================================================
EMSCRIPTEN_KEEPALIVE
void updateNpcEconomyBatch(
    float* resources,
    int* houseData,
    int houseCount,
    float* fischerData,
    int fischerCount,
    float* resourceData,
    int resourceCount,
    float dt
) {
    // ===== 1. HÄUSER =====
    for (int i = 0; i < houseCount; i++) {
        int baseIdx = i * 6;
        float grainConsumeTimer = houseData[baseIdx + 0];
        float growthTimer = houseData[baseIdx + 1];
        int residents = houseData[baseIdx + 2];
        int maxResidents = houseData[baseIdx + 3];
        int isUnderConstruction = houseData[baseIdx + 4];
        int level = houseData[baseIdx + 5];

        if (isUnderConstruction) continue;

        grainConsumeTimer += dt;
        while (grainConsumeTimer >= 15.0f) {
            grainConsumeTimer -= 15.0f;
            if (resources[0] > 0) {
                resources[0] -= 1;
            } else {
                growthTimer = 0;
            }
        }

        if (resources[0] > 0 && residents < maxResidents) {
            growthTimer += dt;
            if (growthTimer >= 30.0f) {
                growthTimer -= 30.0f;
                residents += 1;
            }
        } else if (resources[0] <= 0) {
            growthTimer = 0;
        }

        houseData[baseIdx + 0] = grainConsumeTimer;
        houseData[baseIdx + 1] = growthTimer;
        houseData[baseIdx + 2] = residents;
    }

    // ===== 2. FISCHERHÜTTEN =====
    for (int i = 0; i < fischerCount; i++) {
        int baseIdx = i * 3;
        float fishProductionTimer = fischerData[baseIdx + 0];
        float fishProductionInterval = fischerData[baseIdx + 1];
        int level = (int)fischerData[baseIdx + 2];

        if (level <= 0) level = 1;
        float interval = fishProductionInterval / level;

        fishProductionTimer += dt;
        if (fishProductionTimer >= interval) {
            fishProductionTimer -= interval;
            resources[3] += 1;
        }

        fischerData[baseIdx + 0] = fishProductionTimer;
    }

    // ===== 3. RESSOURCEN-GEBÄUDE =====
    for (int i = 0; i < resourceCount; i++) {
        int baseIdx = i * 6;
        float fishStorage = resourceData[baseIdx + 0];
        float fishConsumeTimer = resourceData[baseIdx + 1];
        float fishBonusTimer = resourceData[baseIdx + 2];
        float maxProductionTime = resourceData[baseIdx + 3];
        float baseMaxProductionTime = resourceData[baseIdx + 4];
        int level = (int)resourceData[baseIdx + 5];

        if (level <= 0) level = 1;
        float fishConsumeInterval = 18.0f;

        fishConsumeTimer += dt;
        if (fishConsumeTimer >= fishConsumeInterval) {
            fishConsumeTimer -= fishConsumeInterval;
            if (fishStorage > 0) {
                fishStorage -= 1;
                fishBonusTimer = 0;
            } else {
                fishBonusTimer += fishConsumeInterval;
            }
        }

        if (resources[3] > 0 && fishStorage < 3) {
            float needed = 3 - fishStorage;
            float toAdd = std::min(needed, resources[3]);
            fishStorage += toAdd;
            resources[3] -= toAdd;
        }

        float fishMultiplier = 1.0f;
        if (fishStorage >= 3) {
            fishMultiplier = 1.5f;
        } else if (fishStorage == 0 && fishBonusTimer > 60.0f) {
            fishMultiplier = 0.75f;
        }

        maxProductionTime = (baseMaxProductionTime / level) * (1.0f / fishMultiplier);

        resourceData[baseIdx + 0] = fishStorage;
        resourceData[baseIdx + 1] = fishConsumeTimer;
        resourceData[baseIdx + 2] = fishBonusTimer;
        resourceData[baseIdx + 3] = maxProductionTime;
    }
}

// ============================================================
// 9. NPC BAUPLATZSUCHE
// ============================================================
EMSCRIPTEN_KEEPALIVE
int countResourcesAround(
    int gx, int gy,
    int* terrain,
    int width,
    int height,
    int resourceType
) {
    int count = 0;
    for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
            if (dx == 0 && dy == 0) continue;
            int nx = gx + dx;
            int ny = gy + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            if (terrain[ny * width + nx] == resourceType) {
                count++;
            }
        }
    }
    return count;
}

EMSCRIPTEN_KEEPALIVE
int isPositionValidForNPC(
    int gx, int gy,
    int* terrain,
    int width, int height,
    int* occupied,
    int occupiedCount,
    int* npcGrenzen,
    int grenzeCount,
    int type,
    int isLager
) {
    if (gx < 1 || gx >= width - 1 || gy < 1 || gy >= height - 1) return 0;

    for (int i = 0; i < occupiedCount; i++) {
        if (occupied[i*2] == gx && occupied[i*2+1] == gy) {
            return 0;
        }
    }

    int terrainHere = terrain[gy * width + gx];
    if (terrainHere == -1) return 0;

    if (type == 0 && terrainHere != 0) return 0;
    if (type == 1 && terrainHere != 1) return 0;
    if (type == 2 && terrainHere != 2) return 0;
    if ((type == 3 || type == 4 || type == 5) && (terrainHere == 1 || terrainHere == 2)) return 0;
    if (type == 6 && (terrainHere == 1 || terrainHere == 2)) return 0;

    int insideGrenze = 0;
    for (int i = 0; i < grenzeCount; i++) {
        int gx2 = npcGrenzen[i*3];
        int gy2 = npcGrenzen[i*3+1];
        int radius = npcGrenzen[i*3+2];
        int dx = gx - gx2;
        int dy = gy - gy2;
        if (dx*dx + dy*dy <= radius*radius) {
            insideGrenze = 1;
            break;
        }
    }
    if (!insideGrenze && grenzeCount > 0) return 0;

    if (type == 0 || type == 1 || type == 2) {
        int resourceType = (type == 0) ? 0 : (type == 1 ? 1 : 2);
        int resources = countResourcesAround(gx, gy, terrain, width, height, resourceType);
        if (resources < 3) return 0;
    }

    if (type == 7) {
        int waterCount = 0;
        for (int dy = -1; dy <= 1; dy++) {
            for (int dx = -1; dx <= 1; dx++) {
                if (dx == 0 && dy == 0) continue;
                int nx = gx + dx;
                int ny = gy + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                if (terrain[ny * width + nx] == 3) {
                    waterCount++;
                }
            }
        }
        if (waterCount < 2) return 0;
    }

    return 1;
}

EMSCRIPTEN_KEEPALIVE
int findBestBuildPosition(
    int* terrain,
    int width, int height,
    int* occupied,
    int occupiedCount,
    int* npcGrenzen,
    int grenzeCount,
    int* existingBuildings,
    int existingCount,
    int type,
    int isLager,
    int* outX,
    int* outY,
    float* outScore
) {
    int bestX = -1;
    int bestY = -1;
    float bestScore = -999999.0f;

    int searchRadius = 20;
    int centerX = width / 2;
    int centerY = height / 2;

    if (existingCount > 0) {
        float sumX = 0, sumY = 0;
        for (int i = 0; i < existingCount; i++) {
            sumX += existingBuildings[i*3];
            sumY += existingBuildings[i*3+1];
        }
        centerX = sumX / existingCount;
        centerY = sumY / existingCount;
    }

    for (int dy = -searchRadius; dy <= searchRadius; dy++) {
        for (int dx = -searchRadius; dx <= searchRadius; dx++) {
            int gx = centerX + dx;
            int gy = centerY + dy;

            if (!isPositionValidForNPC(gx, gy, terrain, width, height, 
                                       occupied, occupiedCount, 
                                       npcGrenzen, grenzeCount, 
                                       type, isLager)) {
                continue;
            }

            float score = 0;

            float distToCenter = sqrt(dx*dx + dy*dy);
            score += (20 - std::min(distToCenter, 20.0f)) * 2;

            if (type == 0 || type == 1 || type == 2) {
                int resourceType = (type == 0) ? 0 : (type == 1 ? 1 : 2);
                int resources = countResourcesAround(gx, gy, terrain, width, height, resourceType);
                score += resources * 20;
            }

            float minDist = 999999;
            for (int i = 0; i < existingCount; i++) {
                float dx2 = gx - existingBuildings[i*3];
                float dy2 = gy - existingBuildings[i*3+1];
                float d = sqrt(dx2*dx2 + dy2*dy2);
                if (d < minDist) minDist = d;
            }
            if (minDist <= 2) score += 25;
            else if (minDist <= 4) score += 15;
            else if (minDist <= 6) score += 10;

            float grenzeDist = 999999;
            for (int i = 0; i < grenzeCount; i++) {
                float dx2 = gx - npcGrenzen[i*3];
                float dy2 = gy - npcGrenzen[i*3+1];
                float d = sqrt(dx2*dx2 + dy2*dy2);
                if (d < grenzeDist) grenzeDist = d;
            }
            if (grenzeDist < 20) {
                score += (20 - grenzeDist) * 2;
            }

            if (score > bestScore) {
                bestScore = score;
                bestX = gx;
                bestY = gy;
            }
        }
    }

    if (bestX != -1) {
        *outX = bestX;
        *outY = bestY;
        *outScore = bestScore;
        return 1;
    }

    *outX = -1;
    *outY = -1;
    *outScore = 0;
    return 0;
}

} // extern "C"