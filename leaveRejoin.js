/**
 * leaveRejoin.js
 * 
 * This module handles "Session Rotation" for the AFK bot.
 * It makes the bot leave every hour and then rejoin.
 * This helps evade Aternos server-level bot detection.
 * 
 * Enhanced with "Human-like" behaviors: Arm swinging, Hotbar cycling,
 * Teabagging, and Inventory re-sorting.
 */

function randomMs(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function setupLeaveRejoin(bot, createBot) {
    let leaveTimer = null;
    let jumpTimer = null;
    let jumpOffTimer = null;
    let swingTimer = null;
    let hotbarTimer = null;
    let teabagTimer = null;
    let resortTimer = null;
    let stopped = false;

    function cleanup() {
        stopped = true;
        const timers = [leaveTimer, jumpTimer, jumpOffTimer, swingTimer, hotbarTimer, teabagTimer, resortTimer];
        timers.forEach(t => { if (t) clearTimeout(t); });
        leaveTimer = jumpTimer = jumpOffTimer = swingTimer = hotbarTimer = teabagTimer = resortTimer = null;
    }

    // --- RANDOM JUMPING (AFK Plugin evasion) ---
    function scheduleNextJump() {
        if (stopped || !bot.entity) return;
        bot.setControlState('jump', true);
        jumpOffTimer = setTimeout(() => {
            if (!stopped && bot.setControlState) bot.setControlState('jump', false);
        }, 300);
        const nextJump = randomMs(20000, 300000);
        jumpTimer = setTimeout(scheduleNextJump, nextJump);
    }

    // --- ARM SWINGING (Fidget) ---
    function scheduleArmSwing() {
        if (stopped) return;
        try {
            bot.swingArm();
        } catch (e) { }
        const nextSwing = randomMs(10000, 60000);
        swingTimer = setTimeout(scheduleArmSwing, nextSwing);
    }

    // --- HOTBAR CYCLING ---
    function scheduleHotbarCycle() {
        if (stopped) return;
        try {
            const slot = Math.floor(Math.random() * 9);
            bot.setQuickBarSlot(slot);
        } catch (e) { }
        const nextCycle = randomMs(30000, 120000);
        hotbarTimer = setTimeout(scheduleHotbarCycle, nextCycle);
    }

    // --- TEABAGGING (Rapid Sneaking) ---
    function scheduleTeabagging() {
        if (stopped) return;

        const performTeabag = (count) => {
            if (stopped || count <= 0) {
                if (!stopped) bot.setControlState('sneak', false);
                return;
            }
            bot.setControlState('sneak', true);
            setTimeout(() => {
                bot.setControlState('sneak', false);
                setTimeout(() => performTeabag(count - 1), 150);
            }, 150);
        };

        // 10% chance to teabag every 2-5 minutes
        if (Math.random() > 0.9) {
            performTeabag(randomMs(2, 5));
        }

        const nextTeabagCheck = randomMs(120000, 300000);
        teabagTimer = setTimeout(scheduleTeabagging, nextTeabagCheck);
    }

    // --- INVENTORY RE-SORTING ---
    async function scheduleInventoryResort() {
        if (stopped) return;
        try {
            const items = bot.inventory.items();
            if (items.length >= 2) {
                // Pick two random items/slots and swap them
                const slotA = items[Math.floor(Math.random() * items.length)].slot;
                const slotB = Math.floor(Math.random() * 36) + 9; // Random inventory slot

                await bot.clickWindow(slotA, 0, 0);
                await bot.clickWindow(slotB, 0, 0);
                await bot.clickWindow(slotA, 0, 0);
            }
        } catch (e) { }

        const nextResort = randomMs(300000, 900000); // Every 5-15 minutes
        resortTimer = setTimeout(scheduleInventoryResort, nextResort);
    }

    // --- SESSION ROTATION ---

    // reset state
    cleanup();
    stopped = false;

    // STAY TIME: Approx 1 hour (55-65 mins for variance)
    const stayTime = randomMs(55 * 60 * 1000, 65 * 60 * 1000);
    console.log(`[AFK] Session started. Next rotation in ${Math.round(stayTime / 60000)} minutes.`);

    // Start all behaviors
    scheduleNextJump();
    scheduleArmSwing();
    scheduleHotbarCycle();
    scheduleTeabagging();
    scheduleInventoryResort();

    leaveTimer = setTimeout(() => {
        if (stopped) return;
        console.log('[AFK] Rotating session (leaving server)...');
        cleanup();
        try {
            bot.quit();
        } catch (e) { }
    }, stayTime);

    // Cleanup on disconnect
    bot.on('end', cleanup);
    bot.on('kicked', cleanup);
    bot.on('error', cleanup);
}

module.exports = setupLeaveRejoin;
