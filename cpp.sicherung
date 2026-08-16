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
// 7. NPC BAUPLATZSUCHE (NUR FÜR C++ INTERN, NICHT EXPORTIERT)
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

} // extern "C"