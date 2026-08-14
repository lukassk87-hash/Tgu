#include <emscripten.h>
#include <cmath>
#include <algorithm>
#include <cstdlib>
#include <cstring>

extern "C" {

// ============================================================
// 1. VILLAGER-BEWEGUNG (BEREITS VORHANDEN)
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
// 2. KAMPF (BEREITS VORHANDEN)
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
// 3. NPC BAUPLATZSUCHE (BEREITS VORHANDEN)
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
    float bestScore = -1000000.0f;
    int bestGx = -1, bestGy = -1;
    
    int searchRadius = 8;
    if (type == 5 || isLager) searchRadius = 12;
    
    int isHouse = (type == 3);
    int isTower = (type == 4);
    int isLagerType = (type == 5 || isLager);
    int isResourceBuilding = (type == 0 || type == 1 || type == 2);
    int isGrenzeType = (type == 6);
    
    for (int g = 0; g < grenzeCount; g++) {
        int gx = npcGrenzen[g*3];
        int gy = npcGrenzen[g*3+1];
        int radius = npcGrenzen[g*3+2];
        
        int maxRadius = (radius > searchRadius) ? searchRadius : radius;
        if (isLagerType && maxRadius < 5) maxRadius = 5;
        
        int step = (radius > 20) ? 2 : 1;
        
        for (int dy = -maxRadius; dy <= maxRadius; dy += step) {
            for (int dx = -maxRadius; dx <= maxRadius; dx += step) {
                int cx = gx + dx;
                int cy = gy + dy;
                
                if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
                
                if (!isPositionValidForNPC(cx, cy, terrain, width, height, 
                    occupied, occupiedCount, npcGrenzen, grenzeCount, type, isLager)) {
                    continue;
                }
                
                float score = 0.0f;
                int terrainHere = terrain[cy * width + cx];
                
                if (isResourceBuilding) {
                    int resourceType = (type == 0) ? 0 : (type == 1 ? 1 : 2);
                    int resources = countResourcesAround(cx, cy, terrain, width, height, resourceType);
                    score += resources * 25.0f;
                }
                
                if (isHouse) {
                    for (int i = 0; i < existingCount; i++) {
                        int bx = existingBuildings[i*3];
                        int by = existingBuildings[i*3+1];
                        int bType = existingBuildings[i*3+2];
                        
                        if (bType == 0 || bType == 1 || bType == 2 || bType == 7) {
                            int dx2 = cx - bx;
                            int dy2 = cy - by;
                            float dist = sqrt(dx2*dx2 + dy2*dy2);
                            
                            if (dist <= 2.0f) score += 30.0f;
                            else if (dist <= 4.0f) score += 15.0f;
                            else if (dist <= 6.0f) score += 5.0f;
                        }
                        
                        if (bType == 5) {
                            int dx2 = cx - bx;
                            int dy2 = cy - by;
                            float dist = sqrt(dx2*dx2 + dy2*dy2);
                            if (dist <= 3.0f) score += 20.0f;
                            else if (dist <= 6.0f) score += 10.0f;
                        }
                    }
                }
                
                if (isTower) {
                    int coveredBuildings = 0;
                    int towerRange = 5;
                    for (int i = 0; i < existingCount; i++) {
                        int bx = existingBuildings[i*3];
                        int by = existingBuildings[i*3+1];
                        int bType = existingBuildings[i*3+2];
                        
                        if (bType == 4) continue;
                        
                        int dx2 = cx - bx;
                        int dy2 = cy - by;
                        float dist = sqrt(dx2*dx2 + dy2*dy2);
                        if (dist <= towerRange) {
                            coveredBuildings++;
                        }
                    }
                    score += coveredBuildings * 15.0f;
                }
                
                if (isLagerType) {
                    float centerX = 0, centerY = 0;
                    int buildingCount = 0;
                    for (int i = 0; i < existingCount; i++) {
                        centerX += existingBuildings[i*3];
                        centerY += existingBuildings[i*3+1];
                        buildingCount++;
                    }
                    if (buildingCount > 0) {
                        centerX /= buildingCount;
                        centerY /= buildingCount;
                        int dx2 = cx - (int)centerX;
                        int dy2 = cy - (int)centerY;
                        float dist = sqrt(dx2*dx2 + dy2*dy2);
                        score += (30.0f - std::min(dist, 30.0f)) * 2.0f;
                    }
                }
                
                if (isGrenzeType) {
                    int dx2 = cx - gx;
                    int dy2 = cy - gy;
                    float dist = sqrt(dx2*dx2 + dy2*dy2);
                    score += dist * 5.0f;
                    
                    int freeCells = 0;
                    for (int dy2 = -5; dy2 <= 5; dy2++) {
                        for (int dx2 = -5; dx2 <= 5; dx2++) {
                            int nx = cx + dx2;
                            int ny = cy + dy2;
                            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                            
                            int occupiedFlag = 0;
                            for (int o = 0; o < occupiedCount; o++) {
                                if (occupied[o*2] == nx && occupied[o*2+1] == ny) {
                                    occupiedFlag = 1;
                                    break;
                                }
                            }
                            if (!occupiedFlag) freeCells++;
                        }
                    }
                    score += freeCells * 0.5f;
                }
                
                float minDist = 100.0f;
                for (int i = 0; i < existingCount; i++) {
                    int bx = existingBuildings[i*3];
                    int by = existingBuildings[i*3+1];
                    int dx2 = cx - bx;
                    int dy2 = cy - by;
                    float dist = sqrt(dx2*dx2 + dy2*dy2);
                    if (dist < minDist) minDist = dist;
                }
                
                if (minDist <= 1.0f) score += 25.0f;
                else if (minDist <= 2.0f) score += 15.0f;
                else if (minDist <= 3.0f) score += 10.0f;
                
                float minGrenzeDist = 100.0f;
                for (int g2 = 0; g2 < grenzeCount; g2++) {
                    int gx2 = npcGrenzen[g2*3];
                    int gy2 = npcGrenzen[g2*3+1];
                    int dx2 = cx - gx2;
                    int dy2 = cy - gy2;
                    float dist = sqrt(dx2*dx2 + dy2*dy2);
                    if (dist < minGrenzeDist) minGrenzeDist = dist;
                }
                if (minGrenzeDist < 20.0f && minGrenzeDist > 0) {
                    score += (20.0f - minGrenzeDist) * 2.0f;
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestGx = cx;
                    bestGy = cy;
                }
            }
        }
    }
    
    if (bestGx != -1) {
        *outX = bestGx;
        *outY = bestGy;
        *outScore = bestScore;
        return 1;
    }
    
    *outX = -1;
    *outY = -1;
    *outScore = -1000000.0f;
    return 0;
}

// ============================================================
// 4. NPC VILLAGER BEWEGUNG (NEU!)
// ============================================================

// ===== 4a. NPC VILLAGER AUF EINMAL BEWEGEN =====
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

// ===== 4b. NPC VILLAGER NÄCHSTEN FINDEN (FÜR KAMPF) =====
EMSCRIPTEN_KEEPALIVE
int findNearestNpcVillager(
    float queryX, float queryY,
    float* villagerX, float* villagerY,
    unsigned char* alive,
    int count,
    float maxRange
) {
    float bestDist = maxRange * maxRange;
    int bestIndex = -1;
    
    for (int i = 0; i < count; i++) {
        if (!alive[i]) continue;
        float dx = villagerX[i] - queryX;
        float dy = villagerY[i] - queryY;
        float d2 = dx*dx + dy*dy;
        if (d2 < bestDist) {
            bestDist = d2;
            bestIndex = i;
        }
    }
    return bestIndex;
}

// ===== 4c. NPC VILLAGER HARVEST UPDATE =====
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
                isHarvesting[i] = 0; // Fertig
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
// 5. SPIELER 2 VILLAGER BEWEGUNG (NEU!)
// ============================================================

// ===== 5a. SPIELER 2 VILLAGER AUF EINMAL BEWEGEN =====
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

// ===== 5b. SPIELER 2 VILLAGER NÄCHSTEN FINDEN =====
EMSCRIPTEN_KEEPALIVE
int findNearestPlayer2Villager(
    float queryX, float queryY,
    float* villagerX, float* villagerY,
    unsigned char* alive,
    int count,
    float maxRange
) {
    float bestDist = maxRange * maxRange;
    int bestIndex = -1;
    
    for (int i = 0; i < count; i++) {
        if (!alive[i]) continue;
        float dx = villagerX[i] - queryX;
        float dy = villagerY[i] - queryY;
        float d2 = dx*dx + dy*dy;
        if (d2 < bestDist) {
            bestDist = d2;
            bestIndex = i;
        }
    }
    return bestIndex;
}

// ===== 5c. SPIELER 2 VILLAGER HARVEST UPDATE =====
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
                isHarvesting[i] = 0; // Fertig
            }
        } else {
            float speed = 65.0f;
            float step = std::min(dist, speed * dt);
            villagerX[i] += (dx / dist) * step;
            villagerY[i] += (dy / dist) * step;
        }
    }
}

} // extern "C"