#include <emscripten.h>
#include <cmath>
#include <algorithm>

extern "C" {

// 🔥 EMSCRIPTEN_KEEPALIVE = Funktion wird exportiert
EMSCRIPTEN_KEEPALIVE
void moveVillagersBatch(
    float* x, float* y, 
    float* targetX, float* targetY,
    float* speeds,
    unsigned char* alive,
    int count,
    float dt
) {
    // SIMD-optimierte Schleife
    #pragma omp simd
    for (int i = 0; i < count; i++) {
        if (!alive[i]) continue;
        
        float dx = targetX[i] - x[i];
        float dy = targetY[i] - y[i];
        float dist = std::sqrt(dx*dx + dy*dy);
        
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

}